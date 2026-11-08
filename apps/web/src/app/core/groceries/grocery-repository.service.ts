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

@Injectable({ providedIn: 'root' })
export class GroceryRepositoryService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private readonly household = inject(HouseholdContextService);
  private ingredientNamesPromise: Promise<string[]> | null = null;

  listIngredientNames(): Promise<string[]> {
    this.ingredientNamesPromise ??= this.loadIngredientNames();
    return this.ingredientNamesPromise;
  }

  async getWeek(startsOn: string): Promise<GroceryWeek> {
    const client = this.requiredClient();
    const household = await this.household.get();
    const destinationResult = await client
      .from('grocery_destinations')
      .select('id,name')
      .eq('household_id', household.id)
      .is('archived_at', null)
      .order('name');

    if (destinationResult.error) throw destinationResult.error;

    const weekResult = await client
      .from('grocery_weeks')
      .select('id,starts_on')
      .eq('household_id', household.id)
      .eq('starts_on', startsOn)
      .maybeSingle();

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
  }

  async createDestination(name: string): Promise<GroceryDestination> {
    const household = await this.household.get();
    const { data, error } = await this.requiredClient()
      .from('grocery_destinations')
      .insert({ household_id: household.id, name: name.trim() })
      .select('id,name')
      .single();

    if (error) throw error;
    return data as GroceryDestination;
  }

  async deleteDestination(destinationId: string): Promise<void> {
    const { error } = await this.requiredClient()
      .from('grocery_destinations')
      .delete()
      .eq('id', destinationId);

    if (error) throw error;
  }

  async setGotten(itemId: string, gotten: boolean): Promise<void> {
    const { error } = await this.requiredClient().rpc('set_grocery_item_gotten', {
      p_item_id: itemId,
      p_gotten: gotten
    });
    if (error) throw error;
  }

  async assignDestination(itemIds: string[], destinationId: string | null): Promise<void> {
    if (itemIds.length === 0) return;
    const { error } = await this.requiredClient().rpc('assign_grocery_items_destination', {
      p_item_ids: itemIds,
      p_destination_id: destinationId
    });
    if (error) throw error;
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
