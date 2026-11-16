begin;

do $$
declare
  target_week public.grocery_weeks;
begin
  for target_week in
    select grocery_week.*
    from public.grocery_weeks grocery_week
    where grocery_week.starts_on = date '2026-11-15'
  loop
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
      target_week.household_id,
      target_week.id,
      min(source.ingredient_id::text)::uuid,
      'meal_plan',
      source.generated_key,
      min(source.item_name),
      min(source.category_name),
      sum(source.contributed_quantity),
      min(source.normalized_unit)
    from public.grocery_generation_candidates(
      target_week.household_id,
      target_week.starts_on
    ) source
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
        from public.grocery_generation_candidates(
          target_week.household_id,
          target_week.starts_on
        ) source
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
      target_week.household_id,
      grocery_item.id,
      source.meal_plan_entry_id,
      source.recipe_ingredient_id,
      source.contributed_quantity,
      source.normalized_unit
    from public.grocery_generation_candidates(
      target_week.household_id,
      target_week.starts_on
    ) source
    join public.grocery_items grocery_item
      on grocery_item.grocery_week_id = target_week.id
     and grocery_item.generated_key = source.generated_key;
  end loop;
end;
$$;

commit;
