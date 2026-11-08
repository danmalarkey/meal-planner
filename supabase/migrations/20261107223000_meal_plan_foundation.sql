begin;

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  starts_on date not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, starts_on),
  unique (id, household_id)
);

create trigger meal_plans_set_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  meal_plan_id uuid not null,
  recipe_id uuid not null,
  position integer not null check (position > 0),
  planned_servings smallint not null check (planned_servings in (2, 4, 6)),
  scheduled_for date,
  cooked_at timestamptz,
  cooked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (meal_plan_id, household_id)
    references public.meal_plans(id, household_id) on delete cascade,
  foreign key (recipe_id, household_id)
    references public.recipes(id, household_id) on delete restrict,
  unique (meal_plan_id, position),
  unique (id, household_id)
);

create trigger meal_plan_entries_set_updated_at
before update on public.meal_plan_entries
for each row execute function public.set_updated_at();

create index meal_plans_household_starts_on_idx
  on public.meal_plans (household_id, starts_on desc);
create index meal_plan_entries_household_idx
  on public.meal_plan_entries (household_id);
create index meal_plan_entries_recipe_idx
  on public.meal_plan_entries (recipe_id);

alter table public.meal_plans enable row level security;
alter table public.meal_plans force row level security;
alter table public.meal_plan_entries enable row level security;
alter table public.meal_plan_entries force row level security;

create policy meal_plans_members_all on public.meal_plans
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy meal_plan_entries_members_all on public.meal_plan_entries
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

revoke all on table public.meal_plans, public.meal_plan_entries from public, anon;
grant select, insert, update, delete on table public.meal_plans, public.meal_plan_entries
  to authenticated;

create or replace function public.set_meal_plan_entry_cooked(
  p_entry_id uuid,
  p_cooked boolean
)
returns public.meal_plan_entries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  target_entry public.meal_plan_entries;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into target_entry
  from public.meal_plan_entries
  where id = p_entry_id;

  if target_entry.id is null or not public.is_household_member(target_entry.household_id) then
    raise exception 'Meal-plan entry not found';
  end if;

  update public.meal_plan_entries
  set cooked_at = case when p_cooked then now() else null end,
      cooked_by = case when p_cooked then current_user_id else null end
  where id = p_entry_id
  returning * into target_entry;

  return target_entry;
end;
$$;

revoke all on function public.set_meal_plan_entry_cooked(uuid, boolean) from public, anon;
grant execute on function public.set_meal_plan_entry_cooked(uuid, boolean) to authenticated;

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
  target_position integer;
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

  select coalesce(max(position), 0)
  into target_position
  from public.meal_plan_entries
  where meal_plan_id = target_plan.id;

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
    target_position + row_number() over (order by source_entry.position)::integer,
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
