import { createClient } from '@supabase/supabase-js';

export async function bootstrapPrimaryHousehold({ supabaseUrl, secretKey }) {
  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: identity, error: identityError } = await supabase
    .from('application_identity')
    .select('application_key')
    .eq('application_key', 'meal-planner')
    .maybeSingle();

  if (identityError || identity?.application_key !== 'meal-planner') {
    throw new Error('The target database is not initialized as Meal Planner.');
  }

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 50
  });
  if (usersError) throw usersError;

  const confirmedUsers = usersPage.users.filter((user) => user.email_confirmed_at);
  if (confirmedUsers.length !== 1) {
    throw new Error(
      `Expected exactly one confirmed Meal Planner user, found ${confirmedUsers.length}.`
    );
  }

  const ownerId = confirmedUsers[0].id;
  const { data: existingMembership, error: membershipLookupError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', ownerId)
    .maybeSingle();
  if (membershipLookupError) throw membershipLookupError;
  if (existingMembership) return existingMembership.household_id;

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: 'Our household', default_servings: 4 })
    .select('id')
    .single();
  if (householdError) throw householdError;

  const { error: ownerError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: ownerId,
    role: 'owner'
  });

  if (ownerError) {
    await supabase.from('households').delete().eq('id', household.id);
    throw ownerError;
  }

  return household.id;
}
