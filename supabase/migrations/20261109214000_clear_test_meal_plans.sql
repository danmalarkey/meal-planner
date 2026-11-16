begin;

-- Remove launch-testing plans while retaining every recipe in the household library.
delete from public.meal_plans
where starts_on in (date '2026-11-08', date '2026-11-15');

commit;
