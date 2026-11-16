begin;

create table public.grocery_category_preferences (
  household_id uuid not null references public.households(id) on delete cascade,
  normalized_name text not null check (length(trim(normalized_name)) between 1 and 200),
  category text not null check (length(trim(category)) between 1 and 100),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, normalized_name)
);

create trigger grocery_category_preferences_set_updated_at
before update on public.grocery_category_preferences
for each row execute function public.set_updated_at();

alter table public.grocery_category_preferences enable row level security;
alter table public.grocery_category_preferences force row level security;

create policy grocery_category_preferences_members_all
on public.grocery_category_preferences
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

revoke all on table public.grocery_category_preferences from public, anon;
grant select, insert, update, delete on table public.grocery_category_preferences to authenticated;

update public.grocery_items
set category = 'Beverages', updated_at = now()
where source_kind = 'manual'
  and coalesce(nullif(trim(category), ''), 'Other') in ('Other', 'Pantry & Other')
  and lower(name) ~ '(^|[^a-z])sprite([^a-z]|$)';

commit;
