# Meal Planner web

Angular 22 application shell and design system for Meal Planner.

## Development

```bash
npm install
cp .env.example .env.local
npm start
```

Runtime variables:

- `MEAL_PLANNER_SUPABASE_URL`
- `MEAL_PLANNER_SUPABASE_PUBLISHABLE_KEY`

The publishable key is safe for browser use when every exposed table has appropriate grants and Row Level Security policies. Never expose a Supabase secret key, service-role key, Stripe secret, or database password to the browser.

## Stripe

Stripe infrastructure is retained but is not linked from the current interface. Before enabling billing, configure these Supabase function secrets:

- `MEAL_PLANNER_STRIPE_SECRET_KEY`
- `MEAL_PLANNER_STRIPE_ACCOUNT_ID`
- `MEAL_PLANNER_STRIPE_MONTHLY_PRICE_ID`
- `MEAL_PLANNER_STRIPE_ANNUAL_PRICE_ID`
- `MEAL_PLANNER_STRIPE_WEBHOOK_SECRET`
- `MEAL_PLANNER_ALLOWED_ORIGINS`

Apply the billing foundation migration before deploying the retained Stripe Edge Functions.

## Checks

```bash
npm test
npm run build
```
