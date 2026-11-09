# Decision Log

## 2026-11-09 — Recipes is the shared library and favorites are personal

- Status: Active — implemented; hosted schema applied
- Decision: The primary product area is **Recipes**. **All recipes** contains the household-owned library, while **Favorites** is a personal member-to-recipe relationship and filter. Existing Mealime recipes are favorited for every current household member during migration; future website imports enter All recipes until a member favorites them. Meal-plan creation may browse either scope.
- Why it matters: Recipe ownership remains shared for planning and groceries while each household member can express preferences without duplicating or hiding recipes.
- Canonical references: `docs/01_recipe_data_model.md`, `docs/02_product_structure.md`, `docs/03_meal_plan_model.md`, `supabase/migrations/20261109103000_recipe_favorites.sql`
- Follow-up trigger: Revisit shared or aggregate favorite views only if household use shows that personal Favorites is insufficient for planning together.

## 2026-11-09 — Recipe import from public websites is deferred scope

- Status: Deferred — accepted backlog item
- Decision: Meal Planner will eventually let a household member paste a public recipe-page URL, review the extracted recipe fields, and save the confirmed result to **All recipes**. Imports preserve the source URL and attribution, use the existing serving and source-string model, reject unsafe/private destinations, and fall back to manual entry when extraction is incomplete rather than silently saving partial data. Favorite state remains a separate personal action.
- Why it matters: The household can grow its recipe library without retyping reliable public recipe data while retaining control over accuracy, ownership, and source provenance.
- Canonical references: `docs/01_recipe_data_model.md`, `docs/09_execution_backlog.md`
- Follow-up trigger: Begin implementation only after defining supported structured-data formats, server-side fetch protections, image handling, duplicate detection, and the review-before-save interface.

## 2026-11-08 — Empty weeks offer recent-plan copy-forward

- Status: Active — implemented
- Decision: Empty current and future weeks keep **Create meal plan** as the primary manual path and also show the two most recent populated plans as compact thumbnail rows. The source preview opens its historical week; **Use** copies the source directly into the empty week and exposes an immediate Undo action. Copying remains unavailable when the destination already has meals.
- Why it matters: A successful recent week can be repeated without navigating backward first, while manual creation remains clear and historical plans remain unchanged.
- Canonical references: `docs/03_meal_plan_model.md`, `apps/web/src/app/pages/meal-plan/meal-plan-page.component.ts`, `apps/web/src/app/core/meal-plans/meal-plan-repository.service.ts`
- Follow-up trigger: Revisit the number or ranking of recent plans only after real household use shows that chronological recency is insufficient.

## 2026-11-08 — Grocery completion is reversible and filtered in place

- Status: Active — implemented; hosted schema applied
- Decision: Marking a grocery item **Gotten** gives that weekly item a reversible completion timestamp. Gotten items are hidden by default and explicitly shown or hidden for the active list from its overflow menu; category titles remain visible and carry totals such as **Produce 12**. The same menu owns add, batch move, and new-list actions. Tapping a row opens weekly item editing, including its optional store list, while multi-select remains available for faster batch assignment. Groceries reuse Meal Plan's arrow-based week header and manual entry suggests canonical household ingredients. Meal-plan generation combines only canonical ingredients with matching normalized units, omits source-marked pantry staples, preserves provenance, and is idempotent so regeneration retains store and completion state.
- Why it matters: The shopping view stays focused on what remains without deleting history, splitting the source of truth, or letting All items and store views drift apart.
- Canonical references: `docs/07_grocery_model.md`, `supabase/migrations/20261108090000_grocery_foundation.sql`
- Follow-up trigger: Revisit unit conversion, pantry overrides, and recurring basics only after the initial weekly shopping flow is in regular use.

## 2026-11-07 — Recipe detail keeps serving controls quiet and instructions ingredient-aware

- Status: Active
- Decision: Recipe detail presents cook time and the current serving count as quiet inline metadata. The serving count opens the shared popover pattern for 2-, 4-, and 6-serving choices. Instruction source strings are split at preserved line breaks so written directions remain primary and their ingredient quantities appear directly below, scaled at runtime with the selected serving count. When detail is opened from a meal plan, the same occurrence-level Cooked? toggle is available on mobile and desktop.
- Why it matters: The cooking view stays readable, quantities remain attached to the step where they are needed, and serving or completion changes continue to use one source of truth.
- Canonical references: `docs/01_recipe_data_model.md`, `docs/03_meal_plan_model.md`, `apps/web/src/app/pages/recipes/recipe-detail-page.component.ts`, `apps/web/src/app/core/recipes/recipe-scaling.ts`
- Follow-up trigger: Revisit step parsing only if a future source format stops preserving instruction and quantity lines separately.

## 2026-11-07 — Meal-plan creation uses a routed full-recipe selection flow

- Status: Active — initial routed selection shipped
- Decision: Creating a meal plan for an empty current or future week navigates to a dedicated screen containing the complete searchable recipe library with **All recipes** and **Favorites** scopes. Recipe cards become selection controls with visible check state, and a persistent confirmation action sits above mobile navigation. Building finalizes the week's meal membership: created plans expose no Add action, and their builder routes return to the plan. Meal selection is not presented in a drawer.
- Why it matters: Choosing meals is the primary task, so it needs the space, imagery, and direct manipulation of the full recipe library instead of a secondary overlay.
- Canonical references: `docs/03_meal_plan_model.md`, `apps/web/src/app/pages/meal-plan/meal-plan-builder-page.component.ts`, `apps/web/src/app/features/recipes/recipe-card.component.ts`
- Follow-up trigger: Introduce a clearly named replace, remove, or rebuild mode only if real usage shows that post-creation structural editing is needed.

## 2026-11-07 — Recommended plans are a definite future enhancement

- Status: Deferred — definite future enhancement
- Decision: Empty current and future weeks will eventually support a genuine **Recommended plan** built from household favorites and informed by signals such as recent cooking history, repetition, variety, preparation time, and household preferences. Recommendations remain optional previews until explicitly saved and never replace an existing plan automatically. Until that engine exists, empty weeks show the manual **Create meal plan** flow rather than arbitrary recipe cards presented as suggestions.
- Why it matters: Recommendation can make weekly planning meaningfully faster, but it should be introduced only when there is enough real plan and cooking history to produce useful suggestions rather than arbitrary recipe picks.
- Canonical references: `docs/03_meal_plan_model.md`
- Follow-up trigger: Begin design and scoring work after persisted meal planning, cooked history, meal editing, and grocery generation are operating end to end.

## 2026-11-07 — Groceries are one weekly list with optional store destinations

- Status: Active
- Decision: Each week has one authoritative grocery board. **All items** includes every item and groups them by grocery category. Household store destinations such as Costco and Target are optional assignments on those same items, not separate copies; moving an item to a store never removes it from All items. Weekly boards remain separate and use the same arrow-based navigation as Meal Plan.
- Why it matters: The model matches the preference for one complete household list while preserving practical store-specific shopping lists without synchronization or duplication problems.
- Canonical references: `docs/07_grocery_model.md`, `docs/02_product_structure.md`
- Follow-up trigger: Revisit multi-store assignment only if real shopping behavior shows that one item genuinely needs to be bought at multiple stores in the same week.

## 2026-11-07 — Past meal plans are read-only and reuse has an explicit destination

- Status: Active
- Decision: Past meal-plan composition is historical and cannot be edited. **Use this plan again** requires an explicit current or future destination—This week, Next week, or a selected future week. Cooked state may still be reversed to correct a mistake. The initial week boundary is Sunday-start and remains centralized for a later household preference.
- Why it matters: History remains trustworthy, accidental edits cannot rewrite what happened, and copying never leaves the target week ambiguous.
- Canonical references: `docs/03_meal_plan_model.md`, `docs/02_product_structure.md`
- Follow-up trigger: Revisit historical corrections or household-configurable week starts only after the core weekly workflow is in use.

## 2026-11-07 — Weekly plans support history, future planning, and copy-forward

- Status: Active
- Decision: Meal plans are week-specific household records that remain available in the past and may be created in the future. **Use this plan again** copies a past plan's meals, order, and servings into a selected empty current or future week, leaves the source unchanged, and resets copied cooked state. Copying never replaces, merges with, or appends to a created plan.
- Why it matters: The household can repeat a successful week with one simple action while preserving reliable history and keeping every created plan structurally stable.
- Canonical references: `docs/03_meal_plan_model.md`, `docs/02_product_structure.md`
- Follow-up trigger: Revisit copy behavior only if real usage shows a need for replace, merge, templates, or recurring plans.

## 2026-11-07 — Cooked state belongs to the planned meal

- Status: Active
- Decision: Meal Plan cards use the same reversible top-right check circle as recipe selection to mark an individual planned-meal entry cooked or not cooked. The filled circle and selected-card treatment show completion, while tapping the recipe content opens its details. Cooked state is backed by a completion timestamp on the entry and never mutates the reusable recipe or its favorite state.
- Why it matters: A recipe can appear in many weekly plans and be cooked many times, so completion must describe one occurrence rather than mutate the reusable recipe.
- Canonical references: `docs/02_product_structure.md`, `docs/03_meal_plan_model.md`, `apps/web/src/app/features/meal-plans/planned-meal-card.component.ts`
- Follow-up trigger: Add cooking history or ratings only after persisted meal plans and the Cooked? flow are working end to end.

## 2026-11-07 — Mobile-first interaction with a preserved desktop layout

- Status: Active
- Decision: Prioritize mobile interaction design using the Mealime mobile references for hierarchy and flow, while retaining Meal Planner's existing spacious desktop composition. Mobile removes the persistent top app header and keeps each product page's own title context sticky at the top; Meal plan keeps its title and week navigation together. The same primary navigation moves from the desktop header to a bottom bar, with the account avatar occupying the final bottom-bar slot as a separate account control. Recipe detail content becomes tabbed only on mobile and remains simultaneously visible in desktop panels.
- Why it matters: The household will use the app primarily on phones, but responsive presentation should not duplicate features or weaken the useful desktop layout.
- Canonical references: `docs/02_product_structure.md`, `apps/web/src/app/layouts/app-shell-layout.component.ts`, `apps/web/src/app/pages/recipes/recipe-detail-page.component.ts`, `apps/web/src/styles.scss`
- Follow-up trigger: Revisit the responsive boundary only after testing the core meal-plan and cooking flows on real phone-sized viewports.

## 2026-11-07 — Primary product areas and account navigation

- Status: Superseded by **Recipes is the shared library and favorites are personal** on 2026-11-09
- Decision: Meal Planner has four primary areas: Meal plan, Groceries, Favorites, and Settings. The shell exposes the first three as product navigation; Settings and Sign out live in the user-avatar account popover. That same popover sits at the right of the desktop header and at the end of the mobile bottom bar without becoming part of the semantic primary-navigation group. Imported meals are all treated as favorites, so there is no separate general recipe-library destination.
- Why it matters: The structure separates household planning work from account management and gives every imported meal one clear home.
- Canonical references: `docs/02_product_structure.md`, `apps/web/src/app/app.route-definitions.ts`, `apps/web/src/app/layouts/app-shell-layout.component.ts`, `apps/web/src/app/features/account/account-menu.component.ts`
- Follow-up trigger: Revisit navigation only if a genuinely non-favorite recipe collection or another top-level household workflow is introduced.

## 2026-11-07 — Household recipe foundation and serving scaling

- Status: Active
- Decision: Recipes store one base serving count and one base ingredient quantity set. The app derives 2-, 4-, and 6-serving views at runtime, with household default servings set to 4.
- Why it matters: Derived scaling prevents duplicated recipe variants and preserves one source of truth while supporting the household’s normal four-serving workflow.
- Canonical references: `docs/01_recipe_data_model.md`, `supabase/migrations/20261107190000_recipe_foundation.sql`, `apps/web/src/app/core/recipes/recipe-scaling.ts`
- Follow-up trigger: Revisit quantity formatting and unit conversion when grocery aggregation is implemented; never discard the imported source strings.

## 2026-11-07 — Mealime archive import boundary

- Status: Active
- Decision: Treat the downloaded Mealime archive as immutable private source data. Import it through a dry-run-first, idempotent tool rather than committing it or using it as disposable database seed data.
- Why it matters: The archive contains real household content, stable source IDs, and images that must remain private and safely re-importable.
- Canonical references: `docs/01_recipe_data_model.md`, `apps/web/scripts/import-mealime.mjs`
- Follow-up trigger: Complete a five-recipe hosted validation before importing all 134 recipes.
