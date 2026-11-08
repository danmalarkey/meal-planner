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
}

@Injectable({ providedIn: 'root' })
export class RecipeRepositoryService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });

  async listRecipes(): Promise<RecipeSummary[]> {
    return this.loadRecipeSummaries();
  }

  async getRecipeSummaries(recipeIds: string[]): Promise<RecipeSummary[]> {
    if (recipeIds.length === 0) return [];
    return this.loadRecipeSummaries(recipeIds);
  }

  private async loadRecipeSummaries(recipeIds?: string[]): Promise<RecipeSummary[]> {
    const client = this.requiredClient();
    let query = client
      .from('recipes')
      .select('id,title,minutes,base_servings,image_storage_path,dietary_metadata');
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

  async getRecipe(recipeId: string): Promise<RecipeDetail> {
    const client = this.requiredClient();
    // Supabase's browser auth client protects session reads with a navigator lock.
    // Keep these requests ordered so several simultaneous token reads cannot race.
    const recipeResult = await client
      .from('recipes')
      .select('id,title,minutes,base_servings,image_storage_path,dietary_metadata')
      .eq('id', recipeId)
      .single();
    const ingredientResult = await client
      .from('recipe_ingredients')
      .select('position,normalized_quantity,normalized_unit,display_text,source_data')
      .eq('recipe_id', recipeId)
      .order('position');
    const stepResult = await client
      .from('recipe_steps')
      .select('position,instruction')
      .eq('recipe_id', recipeId)
      .order('position');
    const cookwareResult = await client
      .from('recipe_cookware')
      .select('position,name')
      .eq('recipe_id', recipeId)
      .order('position');

    if (recipeResult.error) throw recipeResult.error;
    if (ingredientResult.error) throw ingredientResult.error;
    if (stepResult.error) throw stepResult.error;
    if (cookwareResult.error) throw cookwareResult.error;

    const row = recipeResult.data as RecipeRow;
    const signedUrls = await this.signedImageUrls(
      client,
      row.image_storage_path ? [row.image_storage_path] : []
    );

    return {
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
  }

  private summary(row: RecipeRow, signedUrls: Map<string, string>): RecipeSummary {
    const assessment = row.dietary_metadata?.assessment;
    return {
      id: row.id,
      title: row.title,
      minutes: row.minutes,
      baseServings: row.base_servings,
      imageUrl: row.image_storage_path ? signedUrls.get(row.image_storage_path) ?? null : null,
      dietaryAssessment: typeof assessment === 'string' ? assessment : null
    };
  }

  private async signedImageUrls(
    client: SupabaseClient,
    paths: string[]
  ): Promise<Map<string, string>> {
    if (paths.length === 0) return new Map();

    const { data, error } = await client.storage.from('recipe-images').createSignedUrls(paths, 3600);
    if (error) throw error;

    return new Map(
      (data ?? [])
        .filter(
          (item): item is typeof item & { path: string; signedUrl: string } =>
            typeof item.path === 'string' && typeof item.signedUrl === 'string'
        )
        .map((item) => [item.path, item.signedUrl] as const)
    );
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
