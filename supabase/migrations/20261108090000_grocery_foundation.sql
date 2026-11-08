begin;

alter table public.recipe_ingredients
  add constraint recipe_ingredients_id_household_key unique (id, household_id);

create table public.grocery_weeks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  starts_on date not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, starts_on),
  unique (id, household_id)
);

create trigger grocery_weeks_set_updated_at
before update on public.grocery_weeks
for each row execute function public.set_updated_at();

create table public.grocery_destinations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, name),
  unique (id, household_id)
);

create trigger grocery_destinations_set_updated_at
before update on public.grocery_destinations
for each row execute function public.set_updated_at();

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  grocery_week_id uuid not null,
  ingredient_id uuid,
  destination_id uuid,
  source_kind text not null check (source_kind in ('meal_plan', 'manual')),
  generated_key text,
  name text not null check (length(trim(name)) between 1 and 200),
  category text not null default 'Other' check (length(trim(category)) between 1 and 100),
  quantity numeric(14, 6) check (quantity is null or quantity >= 0),
  unit text,
  amount_text text,
  gotten_at timestamptz,
  gotten_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (grocery_week_id, household_id)
    references public.grocery_weeks(id, household_id) on delete cascade,
  foreign key (ingredient_id, household_id)
    references public.ingredients(id, household_id) on delete restrict,
  foreign key (destination_id, household_id)
    references public.grocery_destinations(id, household_id) on delete set null,
  unique (id, household_id),
  check (
    (source_kind = 'meal_plan' and generated_key is not null)
    or (source_kind = 'manual' and generated_key is null)
  )
);

create trigger grocery_items_set_updated_at
before update on public.grocery_items
for each row execute function public.set_updated_at();

create unique index grocery_items_generated_key_idx
  on public.grocery_items (grocery_week_id, generated_key)
  where generated_key is not null;

create index grocery_items_week_category_idx
  on public.grocery_items (grocery_week_id, category, name);
create index grocery_items_destination_idx
  on public.grocery_items (destination_id)
  where destination_id is not null;

create table public.grocery_item_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  grocery_item_id uuid not null,
  meal_plan_entry_id uuid not null,
  recipe_ingredient_id uuid not null,
  contributed_quantity numeric(14, 6),
  contributed_unit text,
  created_at timestamptz not null default now(),
  foreign key (grocery_item_id, household_id)
    references public.grocery_items(id, household_id) on delete cascade,
  foreign key (meal_plan_entry_id, household_id)
    references public.meal_plan_entries(id, household_id) on delete cascade,
  foreign key (recipe_ingredient_id, household_id)
    references public.recipe_ingredients(id, household_id) on delete cascade,
  unique (grocery_item_id, meal_plan_entry_id, recipe_ingredient_id)
);

create index grocery_item_sources_item_idx
  on public.grocery_item_sources (grocery_item_id);
create index grocery_item_sources_meal_idx
  on public.grocery_item_sources (meal_plan_entry_id);

alter table public.grocery_weeks enable row level security;
alter table public.grocery_weeks force row level security;
alter table public.grocery_destinations enable row level security;
alter table public.grocery_destinations force row level security;
alter table public.grocery_items enable row level security;
alter table public.grocery_items force row level security;
alter table public.grocery_item_sources enable row level security;
alter table public.grocery_item_sources force row level security;

create policy grocery_weeks_members_all on public.grocery_weeks
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy grocery_destinations_members_all on public.grocery_destinations
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy grocery_items_members_all on public.grocery_items
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy grocery_item_sources_members_all on public.grocery_item_sources
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

revoke all on table public.grocery_weeks, public.grocery_destinations,
  public.grocery_items, public.grocery_item_sources from public, anon;
grant select, insert, update, delete on table public.grocery_weeks,
  public.grocery_destinations, public.grocery_items, public.grocery_item_sources
  to authenticated;

create or replace function public.grocery_generation_candidates(
  p_household_id uuid,
  p_starts_on date
)
returns table (
  generated_key text,
  ingredient_id uuid,
  item_name text,
  category_name text,
  normalized_unit text,
  contributed_quantity numeric,
  meal_plan_entry_id uuid,
  recipe_ingredient_id uuid
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    case
      when recipe_ingredient.normalized_quantity is null then
        'source:' || plan_entry.id::text || ':' || recipe_ingredient.id::text
      else
        'ingredient:' || ingredient.id::text || ':unit:' ||
        coalesce(nullif(lower(trim(recipe_ingredient.normalized_unit)), ''), 'unitless')
    end,
    ingredient.id,
    ingredient.name,
    coalesce(nullif(trim(ingredient.category), ''), 'Other'),
    nullif(trim(recipe_ingredient.normalized_unit), ''),
    case
      when recipe_ingredient.normalized_quantity is null then null
      else round(
        recipe_ingredient.normalized_quantity * plan_entry.planned_servings / recipe.base_servings,
        6
      )
    end,
    plan_entry.id,
    recipe_ingredient.id
  from public.meal_plans meal_plan
  join public.meal_plan_entries plan_entry
    on plan_entry.meal_plan_id = meal_plan.id
  join public.recipes recipe
    on recipe.id = plan_entry.recipe_id
  join public.recipe_ingredients recipe_ingredient
    on recipe_ingredient.recipe_id = recipe.id
   and recipe_ingredient.household_id = meal_plan.household_id
  join public.ingredients ingredient
    on ingredient.id = recipe_ingredient.ingredient_id
  where meal_plan.household_id = p_household_id
    and meal_plan.starts_on = p_starts_on
    and recipe_ingredient.pantry_staple = false;
$$;

revoke all on function public.grocery_generation_candidates(uuid, date)
  from public, anon, authenticated;

create or replace function public.sync_grocery_week_from_meal_plan(
  p_household_id uuid,
  p_starts_on date
)
returns public.grocery_weeks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_week public.grocery_weeks;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_starts_on is null or not public.is_household_member(p_household_id) then
    raise exception 'Grocery week not found';
  end if;

  insert into public.grocery_weeks (household_id, starts_on)
  values (p_household_id, p_starts_on)
  on conflict (household_id, starts_on)
  do update set starts_on = excluded.starts_on
  returning * into target_week;

  insert into public.grocery_items (
    household_id,
    grocery_week_id,
    ingredient_id,
    source_kind,
    generated_key,
    name,
    category,
    quantity,
    unit
  )
  select
    p_household_id,
    target_week.id,
    min(source.ingredient_id::text)::uuid,
    'meal_plan',
    source.generated_key,
    min(source.item_name),
    min(source.category_name),
    sum(source.contributed_quantity),
    min(source.normalized_unit)
  from public.grocery_generation_candidates(p_household_id, p_starts_on) source
  group by source.generated_key
  on conflict (grocery_week_id, generated_key) where generated_key is not null
  do update set
    ingredient_id = excluded.ingredient_id,
    name = excluded.name,
    category = excluded.category,
    quantity = excluded.quantity,
    unit = excluded.unit,
    updated_at = now();

  delete from public.grocery_items grocery_item
  where grocery_item.grocery_week_id = target_week.id
    and grocery_item.source_kind = 'meal_plan'
    and not exists (
      select 1
      from public.grocery_generation_candidates(p_household_id, p_starts_on) source
      where source.generated_key = grocery_item.generated_key
    );

  delete from public.grocery_item_sources item_source
  using public.grocery_items grocery_item
  where item_source.grocery_item_id = grocery_item.id
    and grocery_item.grocery_week_id = target_week.id
    and grocery_item.source_kind = 'meal_plan';

  insert into public.grocery_item_sources (
    household_id,
    grocery_item_id,
    meal_plan_entry_id,
    recipe_ingredient_id,
    contributed_quantity,
    contributed_unit
  )
  select
    p_household_id,
    grocery_item.id,
    source.meal_plan_entry_id,
    source.recipe_ingredient_id,
    source.contributed_quantity,
    source.normalized_unit
  from public.grocery_generation_candidates(p_household_id, p_starts_on) source
  join public.grocery_items grocery_item
    on grocery_item.grocery_week_id = target_week.id
   and grocery_item.generated_key = source.generated_key;

  return target_week;
end;
$$;

revoke all on function public.sync_grocery_week_from_meal_plan(uuid, date) from public, anon;
grant execute on function public.sync_grocery_week_from_meal_plan(uuid, date) to authenticated;

create or replace function public.set_grocery_item_gotten(
  p_item_id uuid,
  p_gotten boolean
)
returns public.grocery_items
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_item public.grocery_items;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into target_item
  from public.grocery_items
  where id = p_item_id;

  if target_item.id is null or not public.is_household_member(target_item.household_id) then
    raise exception 'Grocery item not found';
  end if;

  update public.grocery_items
  set gotten_at = case when p_gotten then now() else null end,
      gotten_by = case when p_gotten then auth.uid() else null end
  where id = p_item_id
  returning * into target_item;

  return target_item;
end;
$$;

revoke all on function public.set_grocery_item_gotten(uuid, boolean) from public, anon;
grant execute on function public.set_grocery_item_gotten(uuid, boolean) to authenticated;

create or replace function public.assign_grocery_items_destination(
  p_item_ids uuid[],
  p_destination_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_household_id uuid;
  updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if coalesce(array_length(p_item_ids, 1), 0) = 0 then
    return 0;
  end if;

  select grocery_item.household_id into target_household_id
  from public.grocery_items grocery_item
  where grocery_item.id = p_item_ids[1];

  if target_household_id is null or not public.is_household_member(target_household_id) then
    raise exception 'Grocery items not found';
  end if;

  if exists (
    select 1 from unnest(p_item_ids) item_id
    left join public.grocery_items grocery_item on grocery_item.id = item_id
    where grocery_item.id is null or grocery_item.household_id <> target_household_id
  ) then
    raise exception 'Grocery items must belong to one household';
  end if;

  if p_destination_id is not null and not exists (
    select 1 from public.grocery_destinations destination
    where destination.id = p_destination_id
      and destination.household_id = target_household_id
      and destination.archived_at is null
  ) then
    raise exception 'Grocery list not found';
  end if;

  update public.grocery_items
  set destination_id = p_destination_id
  where id = any(p_item_ids);

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.assign_grocery_items_destination(uuid[], uuid) from public, anon;
grant execute on function public.assign_grocery_items_destination(uuid[], uuid) to authenticated;

commit;
