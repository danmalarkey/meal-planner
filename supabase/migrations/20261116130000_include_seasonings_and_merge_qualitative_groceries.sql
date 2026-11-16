begin;

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
        'ingredient:' || ingredient.id::text || ':qualitative'
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
    and (
      recipe_ingredient.pantry_staple = false
      or lower(trim(coalesce(ingredient.category, ''))) = 'spices & seasonings'
    );
$$;

comment on function public.grocery_generation_candidates(uuid, date) is
  'Returns grocery candidates, including seasonings and merging amount-less occurrences by canonical ingredient.';

commit;
