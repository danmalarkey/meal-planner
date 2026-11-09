import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { HouseholdContextService } from '../households/household-context.service';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export interface GroceryDestination {
  id: string;
  name: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  amountText: string | null;
  destinationId: string | null;
  sourceKind: 'meal_plan' | 'manual';
  gottenAt: string | null;
}

export interface GroceryWeek {
  id: string | null;
  startsOn: string;
  destinations: GroceryDestination[];
  items: GroceryItem[];
}

interface GroceryItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  amount_text: string | null;
  destination_id: string | null;
  source_kind: 'meal_plan' | 'manual';
  gotten_at: string | null;
}

interface CachedGroceryWeek {
  value: GroceryWeek;
  expiresAt: number;
}

const WEEK_CACHE_TTL_MS = 60 * 1000;

@Injectable({ providedIn: 'root' })
export class GroceryRepositoryService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private readonly household = inject(HouseholdContextService);
  private ingredientNamesPromise: Promise<string[]> | null = null;
  private readonly weekByStartsOn = new Map<string, CachedGroceryWeek>();
  private readonly weekRequestByStartsOn = new Map<string, Promise<GroceryWeek>>();

  constructor() {
    this.client?.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return;
      this.ingredientNamesPromise = null;
      this.weekByStartsOn.clear();
      this.weekRequestByStartsOn.clear();
    });
  }

  listIngredientNames(): Promise<string[]> {
    this.ingredientNamesPromise ??= this.loadIngredientNames().catch((error) => {
      this.ingredientNamesPromise = null;
      throw error;
    });
    return this.ingredientNamesPromise;
  }

  getWeek(startsOn: string): Promise<GroceryWeek> {
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

  private async loadWeek(startsOn: string): Promise<GroceryWeek> {
    const client = this.requiredClient();
    const household = await this.household.get();
    const [destinationResult, weekResult] = await Promise.all([
      client
        .from('grocery_destinations')
        .select('id,name')
        .eq('household_id', household.id)
        .is('archived_at', null)
        .order('name'),
      client
        .from('grocery_weeks')
        .select('id,starts_on')
        .eq('household_id', household.id)
        .eq('starts_on', startsOn)
        .maybeSingle()
    ]);

    if (destinationResult.error) throw destinationResult.error;
    if (weekResult.error) throw weekResult.error;

    const destinations = (destinationResult.data ?? []) as GroceryDestination[];
    if (!weekResult.data) return { id: null, startsOn, destinations, items: [] };

    const itemResult = await client
      .from('grocery_items')
      .select(
        'id,name,category,quantity,unit,amount_text,destination_id,source_kind,gotten_at'
      )
      .eq('grocery_week_id', weekResult.data.id)
      .order('category')
      .order('name');

    if (itemResult.error) throw itemResult.error;

    return {
      id: weekResult.data.id as string,
      startsOn: weekResult.data.starts_on as string,
      destinations,
      items: ((itemResult.data ?? []) as GroceryItemRow[]).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity === null ? null : Number(item.quantity),
        unit: item.unit,
        amountText: item.amount_text,
        destinationId: item.destination_id,
        sourceKind: item.source_kind,
        gottenAt: item.gotten_at
      }))
    };
  }

  async syncFromMealPlan(startsOn: string): Promise<GroceryWeek> {
    const household = await this.household.get();
    const { error } = await this.requiredClient().rpc('sync_grocery_week_from_meal_plan', {
      p_household_id: household.id,
      p_starts_on: startsOn
    });
    if (error) throw error;
    this.forgetWeek(startsOn);
    return this.getWeek(startsOn);
  }

  async addManualItem(input: {
    startsOn: string;
    name: string;
    category: string;
    amountText: string | null;
    destinationId: string | null;
  }): Promise<void> {
    const client = this.requiredClient();
    const household = await this.household.get();
    const weekResult = await client
      .from('grocery_weeks')
      .upsert(
        { household_id: household.id, starts_on: input.startsOn },
        { onConflict: 'household_id,starts_on' }
      )
      .select('id')
      .single();

    if (weekResult.error) throw weekResult.error;

    const { error } = await client.from('grocery_items').insert({
      household_id: household.id,
      grocery_week_id: weekResult.data.id,
      source_kind: 'manual',
      name: input.name.trim(),
      category: input.category,
      amount_text: input.amountText?.trim() || null,
      destination_id: input.destinationId
    });
    if (error) throw error;
    this.forgetWeek(input.startsOn);
  }

  async createDestination(name: string): Promise<GroceryDestination> {
    const household = await this.household.get();
    const { data, error } = await this.requiredClient()
      .from('grocery_destinations')
      .insert({ household_id: household.id, name: name.trim() })
      .select('id,name')
      .single();

    if (error) throw error;
    const destination = data as GroceryDestination;
    for (const [startsOn, cached] of this.weekByStartsOn) {
      const week = cached.value;
      this.weekByStartsOn.set(startsOn, {
        value: {
          ...week,
          destinations: [...week.destinations, destination].sort((left, right) =>
            left.name.localeCompare(right.name)
          )
        },
        expiresAt: Date.now() + WEEK_CACHE_TTL_MS
      });
    }
    return destination;
  }

  async deleteDestination(destinationId: string): Promise<void> {
    const { error } = await this.requiredClient()
      .from('grocery_destinations')
      .delete()
      .eq('id', destinationId);

    if (error) throw error;
    for (const [startsOn, cached] of this.weekByStartsOn) {
      const week = cached.value;
      this.weekByStartsOn.set(startsOn, {
        value: {
          ...week,
          destinations: week.destinations.filter((destination) => destination.id !== destinationId),
          items: week.items.map((item) =>
            item.destinationId === destinationId ? { ...item, destinationId: null } : item
          )
        },
        expiresAt: Date.now() + WEEK_CACHE_TTL_MS
      });
    }
  }

  async setGotten(itemId: string, gotten: boolean): Promise<void> {
    const { error } = await this.requiredClient().rpc('set_grocery_item_gotten', {
      p_item_id: itemId,
      p_gotten: gotten
    });
    if (error) throw error;
    const gottenAt = gotten ? new Date().toISOString() : null;
    this.updateCachedItems((item) =>
      item.id === itemId ? { ...item, gottenAt } : item
    );
  }

  async assignDestination(itemIds: string[], destinationId: string | null): Promise<void> {
    if (itemIds.length === 0) return;
    const { error } = await this.requiredClient().rpc('assign_grocery_items_destination', {
      p_item_ids: itemIds,
      p_destination_id: destinationId
    });
    if (error) throw error;
    const selectedItemIds = new Set(itemIds);
    this.updateCachedItems((item) =>
      selectedItemIds.has(item.id) ? { ...item, destinationId } : item
    );
  }

  async updateItem(
    itemId: string,
    input: {
      name: string;
      category: string;
      amountText: string | null;
      destinationId: string | null;
    }
  ): Promise<void> {
    const { error } = await this.requiredClient()
      .from('grocery_items')
      .update({
        name: input.name.trim(),
        category: input.category,
        amount_text: input.amountText?.trim() || null,
        destination_id: input.destinationId
      })
      .eq('id', itemId);

    if (error) throw error;
    this.updateCachedItems((item) =>
      item.id === itemId
        ? {
            ...item,
            name: input.name.trim(),
            category: input.category,
            amountText: input.amountText?.trim() || null,
            destinationId: input.destinationId
          }
        : item
    );
  }

  private updateCachedItems(update: (item: GroceryItem) => GroceryItem): void {
    for (const [startsOn, cached] of this.weekByStartsOn) {
      this.weekByStartsOn.set(startsOn, {
        value: {
          ...cached.value,
          items: cached.value.items.map(update)
        },
        expiresAt: Date.now() + WEEK_CACHE_TTL_MS
      });
    }
  }

  private forgetWeek(startsOn: string): void {
    this.weekByStartsOn.delete(startsOn);
    this.weekRequestByStartsOn.delete(startsOn);
  }

  private async loadIngredientNames(): Promise<string[]> {
    const household = await this.household.get();
    const { data, error } = await this.requiredClient()
      .from('ingredients')
      .select('name')
      .eq('household_id', household.id)
      .order('name');

    if (error) throw error;
    return [...new Set((data ?? []).map((ingredient) => ingredient.name as string))];
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
