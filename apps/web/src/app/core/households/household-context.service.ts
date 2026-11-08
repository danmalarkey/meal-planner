import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export interface HouseholdContext {
  id: string;
  defaultServings: 2 | 4 | 6;
}

@Injectable({ providedIn: 'root' })
export class HouseholdContextService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private contextPromise: Promise<HouseholdContext> | null = null;

  get(): Promise<HouseholdContext> {
    this.contextPromise ??= this.load();
    return this.contextPromise;
  }

  private async load(): Promise<HouseholdContext> {
    const client = this.requiredClient();
    const membershipResult = await client
      .from('household_members')
      .select('household_id')
      .order('created_at')
      .limit(1)
      .single();

    if (membershipResult.error) throw membershipResult.error;

    const householdResult = await client
      .from('households')
      .select('id,default_servings')
      .eq('id', membershipResult.data.household_id)
      .single();

    if (householdResult.error) throw householdResult.error;

    return {
      id: householdResult.data.id as string,
      defaultServings: householdResult.data.default_servings as 2 | 4 | 6
    };
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
