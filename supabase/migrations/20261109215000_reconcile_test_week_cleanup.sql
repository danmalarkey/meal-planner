begin;

-- Ensure both launch-testing weeks are completely empty before household use.
delete from public.grocery_items
where grocery_week_id in (
  select id
  from public.grocery_weeks
  where starts_on in (date '2026-11-08', date '2026-11-15')
);

delete from public.meal_plans
where starts_on in (date '2026-11-08', date '2026-11-15');

commit;
