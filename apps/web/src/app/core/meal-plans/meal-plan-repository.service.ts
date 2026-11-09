import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { HouseholdContextService } from '../households/household-context.service';
import {
  RecipeRepositoryService,
  RecipeSummary
} from '../recipes/recipe-repository.service';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export interface PlannedMeal {
  entryId: string;
  position: number;
  plannedServings: 2 | 4 | 6;
  scheduledFor: string | null;
  cookedAt: string | null;
  recipe: RecipeSummary;
}

export interface MealPlanWeek {
  id: string | null;
  startsOn: string;
  meals: PlannedMeal[];
}

interface MealPlanEntryRow {
  id: string;
  recipe_id: string;
  position: number;
  planned_servings: 2 | 4 | 6;
  scheduled_for: string | null;
  cooked_at: string | null;
}

interface MealPlanRow {
  id: string;
  starts_on: string;
  entries: MealPlanEntryRow[];
}

interface CachedMealPlanWeek {
  value: MealPlanWeek;
  expiresAt: number;
}

const WEEK_CACHE_TTL_MS = 60 * 1000;

@Injectable({ providedIn: 'root' })
export class MealPlanRepositoryService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private readonly household = inject(HouseholdContextService);
  private readonly recipes = inject(RecipeRepositoryService);
  private readonly weekByStartsOn = new Map<string, CachedMealPlanWeek>();
  private readonly weekRequestByStartsOn = new Map<string, Promise<MealPlanWeek>>();

  constructor() {
    this.client?.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return;
      this.weekByStartsOn.clear();
      this.weekRequestByStartsOn.clear();
    });
  }

  getWeek(startsOn: string): Promise<MealPlanWeek> {
    const now = Date.now();
    const cached = this.weekByStartsOn.get(startsOn);
    if (cached && cached.expiresAt > now) return Promise.resolve(cached.value);
    this.weekByStartsOn.delete(startsOn);

    const pending = this.weekRequestByStartsOn.get(startsOn);
    if (pending) return pending;

    const request = this.loadWeek(startsOn)
      .then((week) => {
        this.weekByStartsOn.set(startsOn, {
          value: week,
          expiresAt: Date.now() + WEEK_CACHE_TTL_MS
        });
        return week;
      })
      .finally(() => this.weekRequestByStartsOn.delete(startsOn));
    this.weekRequestByStartsOn.set(startsOn, request);
    return request;
  }

  private async loadWeek(startsOn: string): Promise<MealPlanWeek> {
    const client = this.requiredClient();
    const household = await this.household.get();
    const planResult = await client
      .from('meal_plans')
      .select(
        'id,starts_on,entries:meal_plan_entries(id,recipe_id,position,planned_servings,scheduled_for,cooked_at)'
      )
      .eq('household_id', household.id)
      .eq('starts_on', startsOn)
      .maybeSingle();

    if (planResult.error) throw planResult.error;
    if (!planResult.data) return { id: null, startsOn, meals: [] };

    const plan = planResult.data as unknown as MealPlanRow;
    const entries = [...(plan.entries ?? [])].sort((left, right) => left.position - right.position);
    const recipeById = new Map(
      (await this.recipes.getRecipeSummaries(entries.map((entry) => entry.recipe_id))).map(
        (recipe) => [recipe.id, recipe] as const
      )
    );

    return {
      id: plan.id,
      startsOn: plan.starts_on,
      meals: entries.flatMap((entry) => {
        const recipe = recipeById.get(entry.recipe_id);
        return recipe
          ? [
              {
                entryId: entry.id,
                position: entry.position,
                plannedServings: entry.planned_servings,
                scheduledFor: entry.scheduled_for,
                cookedAt: entry.cooked_at,
                recipe
              }
            ]
          : [];
      })
    };
  }

  async createPlan(startsOn: string, recipeIds: string[]): Promise<MealPlanWeek> {
    if (recipeIds.length === 0) return this.getWeek(startsOn);

    const existingPlan = await this.getWeek(startsOn);
    if (existingPlan.meals.length > 0) {
      throw new Error('This week already has a meal plan.');
    }

    const client = this.requiredClient();
    const household = await this.household.get();
    const planResult = await client
      .from('meal_plans')
      .upsert(
        { household_id: household.id, starts_on: startsOn },
        { onConflict: 'household_id,starts_on' }
      )
      .select('id')
      .single();

    if (planResult.error) throw planResult.error;

    const existingEntriesResult = await client
      .from('meal_plan_entries')
      .select('recipe_id,position')
      .eq('meal_plan_id', planResult.data.id);

    if (existingEntriesResult.error) throw existingEntriesResult.error;

    const existingEntries = existingEntriesResult.data ?? [];
    if (existingEntries.length > 0) {
      throw new Error('This week already has a meal plan.');
    }

    const recipesToAdd = [...new Set(recipeIds)];

    const entriesResult = await client.from('meal_plan_entries').insert(
      recipesToAdd.map((recipeId, index) => ({
        household_id: household.id,
        meal_plan_id: planResult.data.id,
        recipe_id: recipeId,
        position: index + 1,
        planned_servings: household.defaultServings
      }))
    );

    if (entriesResult.error) throw entriesResult.error;
    this.forgetWeek(startsOn);
    return this.getWeek(startsOn);
  }

  async setCooked(entryId: string, cooked: boolean): Promise<void> {
    const { error } = await this.requiredClient().rpc('set_meal_plan_entry_cooked', {
      p_entry_id: entryId,
      p_cooked: cooked
    });
    if (error) throw error;

    const cookedAt = cooked ? new Date().toISOString() : null;
    for (const [startsOn, cached] of this.weekByStartsOn) {
      const week = cached.value;
      if (!week.meals.some((meal) => meal.entryId === entryId)) continue;
      this.weekByStartsOn.set(startsOn, {
        value: {
          ...week,
          meals: week.meals.map((meal) =>
            meal.entryId === entryId ? { ...meal, cookedAt } : meal
          )
        },
        expiresAt: Date.now() + WEEK_CACHE_TTL_MS
      });
    }
  }

  async copyPlan(sourcePlanId: string, targetStartsOn: string): Promise<MealPlanWeek> {
    const targetPlan = await this.getWeek(targetStartsOn);
    if (targetPlan.meals.length > 0) {
      throw new Error('That week already has a meal plan.');
    }

    const { error } = await this.requiredClient().rpc('copy_meal_plan', {
      p_source_plan_id: sourcePlanId,
      p_target_starts_on: targetStartsOn
    });
    if (error) throw error;
    this.forgetWeek(targetStartsOn);
    return this.getWeek(targetStartsOn);
  }

  async getRecentPlans(beforeStartsOn: string, limit = 2): Promise<MealPlanWeek[]> {
    const household = await this.household.get();
    const { data, error } = await this.requiredClient()
      .from('meal_plans')
      .select('starts_on')
      .eq('household_id', household.id)
      .lt('starts_on', beforeStartsOn)
      .order('starts_on', { ascending: false })
      .limit(Math.max(limit * 3, limit));

    if (error) throw error;

    const plans = await Promise.all(
      (data ?? []).map((row) => this.getWeek(row.starts_on as string))
    );
    return plans.filter((plan) => plan.meals.length > 0).slice(0, limit);
  }

  async deletePlan(planId: string): Promise<void> {
    const { error } = await this.requiredClient().from('meal_plans').delete().eq('id', planId);
    if (error) throw error;
    for (const [startsOn, cached] of this.weekByStartsOn) {
      if (cached.value.id === planId) this.forgetWeek(startsOn);
    }
  }

  private forgetWeek(startsOn: string): void {
    this.weekByStartsOn.delete(startsOn);
    this.weekRequestByStartsOn.delete(startsOn);
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
