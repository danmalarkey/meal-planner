begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.application_identity (
  application_key text primary key check (application_key = 'meal-planner'),
  created_at timestamptz not null default now()
);

insert into public.application_identity (application_key) values ('meal-planner');
revoke all on table public.application_identity from public, anon, authenticated;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  default_servings smallint not null default 4 check (default_servings in (2, 4, 6)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members member
    where member.household_id = p_household_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members member
    where member.household_id = p_household_id
      and member.user_id = auth.uid()
      and member.role = 'owner'
  );
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.is_household_owner(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;

create or replace function public.create_household(p_name text, p_default_servings smallint default 4)
returns public.households
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  created_household public.households;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if length(trim(p_name)) not between 1 and 100 then
    raise exception 'Household name must contain 1 to 100 characters';
  end if;

  if p_default_servings not in (2, 4, 6) then
    raise exception 'Default servings must be 2, 4, or 6';
  end if;

  insert into public.households (name, default_servings)
  values (trim(p_name), p_default_servings)
  returning * into created_household;

  insert into public.household_members (household_id, user_id, role)
  values (created_household.id, current_user_id, 'owner');

  return created_household;
end;
$$;

revoke all on function public.create_household(text, smallint) from public, anon;
grant execute on function public.create_household(text, smallint) to authenticated;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source_provider text not null default 'manual',
  source_id text,
  title text not null check (length(trim(title)) between 1 and 300),
  minutes integer check (minutes is null or minutes > 0),
  base_servings smallint not null check (base_servings > 0),
  image_storage_path text,
  image_filename text,
  image_original_url text,
  source_metadata jsonb not null default '{}'::jsonb,
  dietary_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, source_provider, source_id),
  unique (id, household_id)
);

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source_provider text not null default 'manual',
  source_id text,
  name text not null check (length(trim(name)) > 0),
  category text,
  gluten_status text,
  source_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, source_provider, source_id),
  unique (id, household_id)
);

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipe_id uuid not null,
  ingredient_id uuid not null,
  position integer not null check (position > 0),
  normalized_quantity numeric(14, 6) check (normalized_quantity is null or normalized_quantity >= 0),
  normalized_unit text,
  quantity_text text,
  unit_text text,
  amount_text text,
  display_text text not null,
  shopping_text text not null,
  source_text text not null,
  pantry_staple boolean not null default false,
  shopping_notes text,
  source_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (recipe_id, household_id)
    references public.recipes(id, household_id) on delete cascade,
  foreign key (ingredient_id, household_id)
    references public.ingredients(id, household_id) on delete restrict,
  unique (recipe_id, position)
);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipe_id uuid not null,
  position integer not null check (position > 0),
  instruction text not null check (length(trim(instruction)) > 0),
  created_at timestamptz not null default now(),
  foreign key (recipe_id, household_id)
    references public.recipes(id, household_id) on delete cascade,
  unique (recipe_id, position)
);

create table public.recipe_cookware (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  recipe_id uuid not null,
  position integer not null check (position > 0),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  foreign key (recipe_id, household_id)
    references public.recipes(id, household_id) on delete cascade,
  unique (recipe_id, position)
);

create index recipes_household_title_idx on public.recipes (household_id, title);
create index ingredients_household_name_idx on public.ingredients (household_id, name);
create index recipe_ingredients_household_idx on public.recipe_ingredients (household_id);
create index recipe_steps_household_idx on public.recipe_steps (household_id);
create index recipe_cookware_household_idx on public.recipe_cookware (household_id);

alter table public.households enable row level security;
alter table public.households force row level security;
alter table public.household_members enable row level security;
alter table public.household_members force row level security;
alter table public.recipes enable row level security;
alter table public.recipes force row level security;
alter table public.ingredients enable row level security;
alter table public.ingredients force row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_ingredients force row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_steps force row level security;
alter table public.recipe_cookware enable row level security;
alter table public.recipe_cookware force row level security;

create policy households_select_members on public.households
for select to authenticated using (public.is_household_member(id));
create policy households_update_owners on public.households
for update to authenticated using (public.is_household_owner(id))
with check (public.is_household_owner(id));
create policy households_delete_owners on public.households
for delete to authenticated using (public.is_household_owner(id));

create policy household_members_select_members on public.household_members
for select to authenticated using (public.is_household_member(household_id));
create policy household_members_insert_owners on public.household_members
for insert to authenticated with check (public.is_household_owner(household_id));
create policy household_members_update_owners on public.household_members
for update to authenticated using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));
create policy household_members_delete_owners on public.household_members
for delete to authenticated using (public.is_household_owner(household_id));

create policy recipes_members_all on public.recipes
for all to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy ingredients_members_all on public.ingredients
for all to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy recipe_ingredients_members_all on public.recipe_ingredients
for all to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy recipe_steps_members_all on public.recipe_steps
for all to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
create policy recipe_cookware_members_all on public.recipe_cookware
for all to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

revoke all on table public.households, public.household_members, public.recipes,
  public.ingredients, public.recipe_ingredients, public.recipe_steps,
  public.recipe_cookware from public, anon;
grant select, update, delete on table public.households to authenticated;
grant select, insert, update, delete on table public.household_members, public.recipes,
  public.ingredients, public.recipe_ingredients, public.recipe_steps,
  public.recipe_cookware to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_household_id(p_object_name text)
returns uuid
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  return split_part(p_object_name, '/', 1)::uuid;
exception
  when invalid_text_representation then return null;
end;
$$;

revoke all on function public.storage_household_id(text) from public, anon;
grant execute on function public.storage_household_id(text) to authenticated;

create policy recipe_images_select_members on storage.objects
for select to authenticated
using (
  bucket_id = 'recipe-images'
  and public.is_household_member(public.storage_household_id(name))
);
create policy recipe_images_insert_members on storage.objects
for insert to authenticated
with check (
  bucket_id = 'recipe-images'
  and public.is_household_member(public.storage_household_id(name))
);
create policy recipe_images_update_members on storage.objects
for update to authenticated
using (
  bucket_id = 'recipe-images'
  and public.is_household_member(public.storage_household_id(name))
)
with check (
  bucket_id = 'recipe-images'
  and public.is_household_member(public.storage_household_id(name))
);
create policy recipe_images_delete_members on storage.objects
for delete to authenticated
using (
  bucket_id = 'recipe-images'
  and public.is_household_member(public.storage_household_id(name))
);

commit;
