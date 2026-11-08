begin;

create or replace function public.copy_meal_plan(
  p_source_plan_id uuid,
  p_target_starts_on date
)
returns public.meal_plans
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  source_plan public.meal_plans;
  target_plan public.meal_plans;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into source_plan
  from public.meal_plans
  where id = p_source_plan_id;

  if source_plan.id is null or not public.is_household_member(source_plan.household_id) then
    raise exception 'Source meal plan not found';
  end if;

  if p_target_starts_on is null or p_target_starts_on = source_plan.starts_on then
    raise exception 'Choose a different destination week';
  end if;

  insert into public.meal_plans (household_id, starts_on, created_by)
  values (source_plan.household_id, p_target_starts_on, current_user_id)
  on conflict (household_id, starts_on)
  do update set starts_on = excluded.starts_on
  returning * into target_plan;

  if exists (
    select 1
    from public.meal_plan_entries
    where meal_plan_id = target_plan.id
  ) then
    raise exception 'That week already has a meal plan';
  end if;

  insert into public.meal_plan_entries (
    household_id,
    meal_plan_id,
    recipe_id,
    position,
    planned_servings,
    scheduled_for
  )
  select
    source_entry.household_id,
    target_plan.id,
    source_entry.recipe_id,
    row_number() over (order by source_entry.position)::integer,
    source_entry.planned_servings,
    case
      when source_entry.scheduled_for is null then null
      else p_target_starts_on + (source_entry.scheduled_for - source_plan.starts_on)
    end
  from public.meal_plan_entries source_entry
  where source_entry.meal_plan_id = source_plan.id
  order by source_entry.position;

  return target_plan;
end;
$$;

revoke all on function public.copy_meal_plan(uuid, date) from public, anon;
grant execute on function public.copy_meal_plan(uuid, date) to authenticated;

commit;
