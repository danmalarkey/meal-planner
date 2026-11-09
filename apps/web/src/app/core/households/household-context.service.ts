import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export interface HouseholdContext {
  id: string;
  defaultServings: 2 | 4 | 6;
}

interface HouseholdMembershipRow {
  household_id: string;
  household: {
    id: string;
    default_servings: 2 | 4 | 6;
  };
}

@Injectable({ providedIn: 'root' })
export class HouseholdContextService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private contextPromise: Promise<HouseholdContext> | null = null;

  constructor() {
    this.client?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') this.contextPromise = null;
    });
  }

  get(): Promise<HouseholdContext> {
    this.contextPromise ??= this.load();
    return this.contextPromise;
  }

  private async load(): Promise<HouseholdContext> {
    const membershipResult = await this.requiredClient()
      .from('household_members')
      .select('household_id,household:households!inner(id,default_servings)')
      .order('created_at')
      .limit(1)
      .single();

    if (membershipResult.error) throw membershipResult.error;
    const membership = membershipResult.data as unknown as HouseholdMembershipRow;

    return {
      id: membership.household.id,
      defaultServings: membership.household.default_servings
    };
  }

  private requiredClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase is not configured.');
    return this.client;
  }
}
