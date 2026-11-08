# Meal Planner Supabase

This directory contains the Meal Planner Supabase configuration, auth email templates, and dormant Stripe billing infrastructure.

The application uses Supabase Auth with household-scoped recipes, weekly meal plans, and grocery boards. Grocery generation keeps manual items separate, preserves meal-plan provenance, and treats store destinations as views over one weekly item set.

The household recipe foundation is defined in `migrations/20261107190000_recipe_foundation.sql`. It creates household-scoped recipe tables, private recipe-image Storage policies, and the Meal Planner identity marker used by the guarded importer.

## Browser-safe configuration

- `MEAL_PLANNER_SUPABASE_URL`
- `MEAL_PLANNER_SUPABASE_PUBLISHABLE_KEY`

Never expose a service-role key, database password, Stripe secret, or webhook signing secret to the Angular app.

## Optional Stripe infrastructure

Stripe is retained for a possible future launch but is not currently surfaced in the product. The Edge Functions require:

- `MEAL_PLANNER_STRIPE_SECRET_KEY`
- `MEAL_PLANNER_STRIPE_ACCOUNT_ID`
- `MEAL_PLANNER_STRIPE_MONTHLY_PRICE_ID`
- `MEAL_PLANNER_STRIPE_ANNUAL_PRICE_ID`
- `MEAL_PLANNER_STRIPE_WEBHOOK_SECRET`
- `MEAL_PLANNER_ALLOWED_ORIGINS` when deployed outside localhost

Live Stripe keys are rejected unless `MEAL_PLANNER_STRIPE_ALLOW_LIVE=true` is deliberately set. Every function also verifies that the key belongs to `MEAL_PLANNER_STRIPE_ACCOUNT_ID` before reading or changing Stripe data. Use a dedicated Meal Planner Stripe account and restricted key; never copy credentials from another product.

Apply `migrations/20261107000000_billing_foundation.sql` before deploying the billing functions. Checkout and portal functions require an authenticated Supabase user; the webhook verifies Stripe's signature directly.

## Recipe archive import

From `apps/web`, copy `.env.import.example` to `.env.import.local` and configure the new Meal Planner Supabase project. Use a new-format `sb_secret_...` key dedicated to Meal Planner; do not use a legacy `service_role` JWT or reuse another project's key.

Validate without writes:

```bash
npm run import:mealime
```

After applying the migrations and creating the household, validate five recipes first:

```bash
npm run import:mealime -- --apply --household-id <uuid> --limit 5
```

The importer verifies that the Supabase URL matches `MEAL_PLANNER_SUPABASE_PROJECT_REF` and that the database contains the `meal-planner` application identity marker before it writes anything.
