# Meal Planner

Meal Planner is a household-first meal-planning application built with Angular and Supabase.

The repository currently contains a clean application shell, authentication foundation, reusable design system, and dormant Stripe billing infrastructure. Recipe, planning, grocery, and household domain models will be added deliberately rather than inherited from another product.

## Repository map

```text
apps/web/   Angular application and design system
docs/       Design-system and accessibility guidance
packages/   Shared design foundations
supabase/   Local configuration, auth templates, billing migration, and Stripe functions
```

## Local development

```bash
cd apps/web
npm install
npm start
```

The app runs on `http://localhost:4300`.

Copy `.env.example` to `.env.local` and add the Meal Planner Supabase URL and publishable key when authentication is ready. Without Supabase configuration, development builds use a local preview mode.

## Quality checks

```bash
cd apps/web
npm test
npm run build
```

## Private recipe import

The downloaded recipe archive stays under the Git-ignored `local-data/` directory. The importer validates the entire source without writing by default:

```bash
cd apps/web
npm run import:mealime
```

See `docs/01_recipe_data_model.md` for the serving-scaling model and the guarded five-recipe import workflow.

## Engineering rules

- Use the existing design system before adding new UI patterns.
- Keep foundations, primitives, feature components, and patterns structurally distinct.
- Use design tokens and rem-based sizing.
- Maintain WCAG 2.2 AA expectations.
- Put household ownership and Row Level Security at the center of future data modeling.
- Keep Stripe secrets and Supabase secret keys server-side.
