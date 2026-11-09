import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export interface RecipeSummary {
  id: string;
  title: string;
  minutes: number | null;
  baseServings: number;
  imageUrl: string | null;
  dietaryAssessment: string | null;
  isFavorite: boolean;
}

export interface RecipeIngredient {
  position: number;
  normalizedQuantity: number | null;
  normalizedUnit: string | null;
  displayText: string;
  ingredientName: string;
}

export interface RecipeStep {
  position: number;
  instruction: string;
  ingredientLines: string[];
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  cookware: Array<{ position: number; name: string }>;
}

interface RecipeRow {
  id: string;
  title: string;
  minutes: number | null;
  base_servings: number;
  image_storage_path: string | null;
  dietary_metadata: { assessment?: unknown } | null;
  favorites: Array<{ user_id: string }> | null;
}

interface SignedImageUrl {
  url: string;
  expiresAt: number;
}

interface ExpiringValue<T> {
  value: T;
  expiresAt: number;
}

interface ExpiringRequest<T> {
  request: Promise<T>;
  expiresAt: number;
}

const SIGNED_IMAGE_URL_TTL_MS = 50 * 60 * 1000;
const RECIPE_SUMMARY_SELECT =
  'id,title,minutes,base_servings,image_storage_path,dietary_metadata,favorites:recipe_favorites(user_id)';

@Injectable({ providedIn: 'root' })
export class RecipeRepositoryService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private recipeListRequest: ExpiringRequest<RecipeSummary[]> | null = null;
  private readonly recipeSummaryById = new Map<string, ExpiringValue<RecipeSummary>>();
  private readonly recipeDetailRequests = new Map<string, ExpiringRequest<RecipeDetail>>();
  private readonly signedImageUrlByPath = new Map<string, SignedImageUrl>();

  constructor() {
    this.client?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') this.clearCache();
    });
  }

  listRecipes(): Promise<RecipeSummary[]> {
    const now = Date.now();
    if (this.recipeListRequest && this.recipeListRequest.expiresAt > now) {
      return this.recipeListRequest.request;
    }

    const request = this.loadRecipeSummaries()
      .then((recipes) => {
        this.rememberSummaries(recipes);
        return recipes;
      })
      .catch((error) => {
        this.recipeListRequest = null;
        throw error;
      });
    this.recipeListRequest = {
      request,
      expiresAt: now + SIGNED_IMAGE_URL_TTL_MS
    };
    return request;
  }

  async getRecipeSummaries(recipeIds: string[]): Promise<RecipeSummary[]> {
    if (recipeIds.length === 0) return [];

    const now = Date.now();
    const uniqueRecipeIds = [...new Set(recipeIds)];
    if (this.recipeListRequest && this.recipeListRequest.expiresAt > now) {
      await this.recipeListRequest.request;
    } else {
      const missingRecipeIds = uniqueRecipeIds.filter((recipeId) => !this.cachedSummary(recipeId, now));
      if (missingRecipeIds.length > 0) {
        this.rememberSummaries(await this.loadRecipeSummaries(missingRecipeIds));
      }
    }

    return uniqueRecipeIds.flatMap((recipeId) => {
      const recipe = this.cachedSummary(recipeId);
      return recipe ? [recipe] : [];
    });
  }

  private async loadRecipeSummaries(recipeIds?: string[]): Promise<RecipeSummary[]> {
    const client = this.requiredClient();
    let query = client
      .from('recipes')
      .select(RECIPE_SUMMARY_SELECT);
    if (recipeIds) query = query.in('id', recipeIds);

    const { data, error } = await query.order('title');
    if (error) throw error;

    const rows = (data ?? []) as RecipeRow[];
    const signedUrls = await this.signedImageUrls(
      client,
      rows.map((row) => row.image_storage_path).filter((path): path is string => Boolean(path))
    );

    return rows.map((row) => this.summary(row, signedUrls));
  }

  getRecipe(recipeId: string): Promise<RecipeDetail> {
    const now = Date.now();
    const cached = this.recipeDetailRequests.get(recipeId);
    if (cached && cached.expiresAt > now) return cached.request;

    const request = this.loadRecipe(recipeId).catch((error) => {
      this.recipeDetailRequests.delete(recipeId);
      throw error;
    });
    this.recipeDetailRequests.set(recipeId, {
      request,
      expiresAt: now + SIGNED_IMAGE_URL_TTL_MS
    });
    return request;
  }

  private async loadRecipe(recipeId: string): Promise<RecipeDetail> {
    const client = this.requiredClient();
    const [recipeResult, ingredientResult, stepResult, cookwareResult] = await Promise.all([
      client
        .from('recipes')
        .select(RECIPE_SUMMARY_SELECT)
        .eq('id', recipeId)
        .single(),
      client
        .from('recipe_ingredients')
        .select('position,normalized_quantity,normalized_unit,display_text,source_data')
        .eq('recipe_id', recipeId)
        .order('position'),
      client
        .from('recipe_steps')
        .select('position,instruction')
        .eq('recipe_id', recipeId)
        .order('position'),
      client
        .from('recipe_cookware')
        .select('position,name')
        .eq('recipe_id', recipeId)
        .order('position')
    ]);

    if (recipeResult.error) throw recipeResult.error;
    if (ingredientResult.error) throw ingredientResult.error;
    if (stepResult.error) throw stepResult.error;
    if (cookwareResult.error) throw cookwareResult.error;

    const row = recipeResult.data as RecipeRow;
    const signedUrls = await this.signedImageUrls(
      client,
      row.image_storage_path ? [row.image_storage_path] : []
    );

    const recipe = {
      ...this.summary(row, signedUrls),
      ingredients: (ingredientResult.data ?? []).map((ingredient) => ({
        position: ingredient.position as number,
        normalizedQuantity: ingredient.normalized_quantity as number | null,
        normalizedUnit: ingredient.normalized_unit as string | null,
        displayText: ingredient.display_text as string,
        ingredientName:
          ((ingredient.source_data as { name?: unknown } | null)?.name as string | undefined) ??
          (ingredient.display_text as string)
      })),
      steps: (stepResult.data ?? []).map((step) => {
        const [instruction = '', ...ingredientLines] = (step.instruction as string)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        return {
          position: step.position as number,
          instruction,
          ingredientLines
        };
      }),
      cookware: (cookwareResult.data ?? []) as Array<{ position: number; name: string }>
    };
    this.rememberSummaries([recipe]);
    return recipe;
  }

  async setFavorite(recipeId: string, favorite: boolean): Promise<void> {
    const { error } = await this.requiredClient().rpc('set_recipe_favorite', {
      p_recipe_id: recipeId,
      p_favorite: favorite
    });
    if (error) throw error;

    this.updateFavoriteCache(recipeId, favorite);
  }

  private rememberSummaries(recipes: RecipeSummary[]): void {
    const expiresAt = Date.now() + SIGNED_IMAGE_URL_TTL_MS;
    for (const recipe of recipes) {
      this.recipeSummaryById.set(recipe.id, { value: recipe, expiresAt });
    }
  }

  private cachedSummary(recipeId: string, now = Date.now()): RecipeSummary | null {
    const cached = this.recipeSummaryById.get(recipeId);
    if (cached && cached.expiresAt > now) return cached.value;
    this.recipeSummaryById.delete(recipeId);
    return null;
  }

  private clearCache(): void {
    this.recipeListRequest = null;
    this.recipeSummaryById.clear();
    this.recipeDetailRequests.clear();
    this.signedImageUrlByPath.clear();
  }

  private updateFavoriteCache(recipeId: string, favorite: boolean): void {
    const updateRecipe = <T extends RecipeSummary>(recipe: T): T =>
      recipe.id === recipeId ? { ...recipe, isFavorite: favorite } : recipe;

    if (this.recipeListRequest) {
      this.recipeListRequest = {
        ...this.recipeListRequest,
        request: this.recipeListRequest.request.then((recipes) => recipes.map(updateRecipe))
      };
    }

    const summary = this.recipeSummaryById.get(recipeId);
    if (summary) {
      this.recipeSummaryById.set(recipeId, {
        ...summary,
        value: updateRecipe(summary.value)
      });
    }

    const detail = this.recipeDetailRequests.get(recipeId);
    if (detail) {
      this.recipeDetailRequests.set(recipeId, {
        ...detail,
        request: detail.request.then(updateRecipe)
      });
    }
  }

  private summary(row: RecipeRow, signedUrls: Map<string, string>): RecipeSummary {
    const assessment = row.dietary_metadata?.assessment;
    return {
      id: row.id,
      title: row.title,
      minutes: row.minutes,
      baseServings: row.base_servings,
      imageUrl: row.image_storage_path ? signedUrls.get(row.image_storage_path) ?? null : null,
      dietaryAssessment: typeof assessment === 'string' ? assessment : null,
      isFavorite: (row.favorites?.length ?? 0) > 0
    };
  }

  private async signedImageUrls(
    client: SupabaseClient,
    paths: string[]
  ): Promise<Map<string, string>> {
    if (paths.length === 0) return new Map();

    const now = Date.now();
    const uniquePaths = [...new Set(paths)];
    const signedUrls = new Map<string, string>();
    const pathsToSign: string[] = [];

    for (const path of uniquePaths) {
      const cached = this.signedImageUrlByPath.get(path);
      if (cached && cached.expiresAt > now) signedUrls.set(path, cached.url);
      else pathsToSign.push(path);
    }

    if (pathsToSign.length === 0) return signedUrls;

    const { data, error } = await client.storage
      .from('recipe-images')
      .createSignedUrls(pathsToSign, 3600);
    if (error) throw error;

    for (const item of data ?? []) {
      if (typeof item.path !== 'string' || typeof item.signedUrl !== 'string') continue;
      signedUrls.set(item.path, item.signedUrl);
      this.signedImageUrlByPath.set(item.path, {
        url: item.signedUrl,
        expiresAt: now + SIGNED_IMAGE_URL_TTL_MS
      });
    }

    return signedUrls;
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
