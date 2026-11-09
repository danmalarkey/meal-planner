begin;

create table public.recipe_favorites (
  household_id uuid not null,
  recipe_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id),
  foreign key (recipe_id, household_id)
    references public.recipes(id, household_id) on delete cascade,
  foreign key (household_id, user_id)
    references public.household_members(household_id, user_id) on delete cascade
);

create index recipe_favorites_member_idx
on public.recipe_favorites (household_id, user_id, created_at desc);

insert into public.recipe_favorites (household_id, recipe_id, user_id)
select recipe.household_id, recipe.id, member.user_id
from public.recipes recipe
join public.household_members member on member.household_id = recipe.household_id
on conflict do nothing;

alter table public.recipe_favorites enable row level security;
alter table public.recipe_favorites force row level security;

create policy recipe_favorites_select_own on public.recipe_favorites
for select to authenticated
using (
  user_id = auth.uid()
  and public.is_household_member(household_id)
);

create policy recipe_favorites_insert_own on public.recipe_favorites
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_household_member(household_id)
);

create policy recipe_favorites_delete_own on public.recipe_favorites
for delete to authenticated
using (
  user_id = auth.uid()
  and public.is_household_member(household_id)
);

revoke all on table public.recipe_favorites from public, anon;
grant select, insert, delete on table public.recipe_favorites to authenticated;

create or replace function public.set_recipe_favorite(
  p_recipe_id uuid,
  p_favorite boolean
)
returns boolean
language plpgsql
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  recipe_household_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select household_id
  into recipe_household_id
  from public.recipes
  where id = p_recipe_id;

  if recipe_household_id is null then
    raise exception 'Recipe was not found';
  end if;

  if p_favorite then
    insert into public.recipe_favorites (household_id, recipe_id, user_id)
    values (recipe_household_id, p_recipe_id, current_user_id)
    on conflict (recipe_id, user_id) do nothing;
  else
    delete from public.recipe_favorites
    where recipe_id = p_recipe_id
      and user_id = current_user_id;
  end if;

  return p_favorite;
end;
$$;

revoke all on function public.set_recipe_favorite(uuid, boolean) from public, anon;
grant execute on function public.set_recipe_favorite(uuid, boolean) to authenticated;

commit;
