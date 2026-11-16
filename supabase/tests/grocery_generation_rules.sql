begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into public.households (id, name)
values ('10000000-0000-0000-0000-000000000001', 'Grocery generation test');

insert into public.recipes (id, household_id, source_provider, source_id, title, base_servings)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'test',
    'recipe-1',
    'Test recipe one',
    4
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'test',
    'recipe-2',
    'Test recipe two',
    4
  );

insert into public.ingredients (id, household_id, source_provider, source_id, name, category)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'test',
    'mayonnaise',
    'mayonnaise',
    'Condiments & Sauces'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'test',
    'black-pepper',
    'black pepper',
    'Spices & Seasonings'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'test',
    'olive-oil',
    'olive oil',
    'Condiments & Sauces'
  );

insert into public.meal_plans (id, household_id, starts_on)
values (
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '2026-11-15'
);

insert into public.meal_plan_entries (
  id,
  household_id,
  meal_plan_id,
  recipe_id,
  position,
  planned_servings
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    1,
    4
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    2,
    4
  );

insert into public.recipe_ingredients (
  id,
  household_id,
  recipe_id,
  ingredient_id,
  position,
  display_text,
  shopping_text,
  source_text,
  pantry_staple
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    1,
    'mayonnaise',
    'mayonnaise',
    'mayonnaise',
    false
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    1,
    'mayonnaise',
    'mayonnaise',
    'mayonnaise',
    false
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    2,
    'black pepper',
    'black pepper',
    'black pepper',
    true
  ),
  (
    '60000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    2,
    'black pepper',
    'black pepper',
    'black pepper',
    true
  ),
  (
    '60000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    3,
    'olive oil',
    'olive oil',
    'olive oil',
    true
  );

select is(
  (
    select count(*)::integer
    from public.grocery_generation_candidates(
      '10000000-0000-0000-0000-000000000001',
      '2026-11-15'
    )
    where item_name = 'black pepper'
  ),
  2,
  'pantry-marked seasonings remain grocery candidates'
);

select is(
  (
    select count(*)::integer
    from public.grocery_generation_candidates(
      '10000000-0000-0000-0000-000000000001',
      '2026-11-15'
    )
    where item_name = 'olive oil'
  ),
  0,
  'non-seasoning pantry staples remain excluded'
);

select is(
  (
    select count(*)::integer
    from public.grocery_generation_candidates(
      '10000000-0000-0000-0000-000000000001',
      '2026-11-15'
    )
    where item_name = 'mayonnaise'
  ),
  2,
  'both mayonnaise sources remain represented'
);

select is(
  (
    select count(distinct generated_key)::integer
    from public.grocery_generation_candidates(
      '10000000-0000-0000-0000-000000000001',
      '2026-11-15'
    )
    where item_name = 'mayonnaise'
  ),
  1,
  'amount-less mayonnaise sources share one generated grocery key'
);

select is(
  (
    select min(generated_key)
    from public.grocery_generation_candidates(
      '10000000-0000-0000-0000-000000000001',
      '2026-11-15'
    )
    where item_name = 'mayonnaise'
  ),
  'ingredient:30000000-0000-0000-0000-000000000001:qualitative',
  'qualitative grocery keys are stable per canonical ingredient'
);

select * from finish();

rollback;
