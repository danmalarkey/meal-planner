# Meal Plan Model

## Scope

Meal plans are household-owned weekly containers. The initial Meal Plan slice supports past, current, and future weeks; creating a week from favorite recipes; copying an earlier plan into an empty week; ordering meals at creation; planned servings; and reversible cooked state.

## Weekly plans

Each household may have one plan for a given `starts_on` date. The interface opens the current week by default and allows direct previous-week and next-week navigation plus selection of a future week.

Creating or viewing a future week must not change the current plan. Past plans remain available as history rather than being overwritten.

The initial household default is a Sunday-start week. Week boundaries should remain centralized so a later household setting can change that convention without changing stored plan semantics.

## Planned meals

Each planned-meal entry references a recipe and owns occurrence-specific state:

- display position within the plan
- planned servings, initially inherited from the household default
- optional scheduled day within the week
- `cooked_at` timestamp and `cooked_by` household member

Completion belongs to the planned meal, never to the reusable recipe.

Empty current and future weeks expose **Create meal plan**, which navigates to a dedicated full-page recipe-selection flow for the selected week. The screen also shows the two most recent populated plans as compact thumbnail previews. A recent plan may be reviewed or copied directly into the empty week, with an immediate Undo action after copying. The creation screen shows the complete searchable favorites grid, uses a plus on available cards and a check after selection, and keeps the confirmation action available above mobile navigation. Empty weeks do not display arbitrary recipe cards as if they were recommendations.

Building the plan finalizes that week's meal membership. A created plan does not expose **Add meals**, and its builder route redirects back to the plan. Any future replace, remove, or rebuild workflow must be introduced as an explicit editing mode rather than incremental addition through the creation flow.

## Cooked toggle

Every planned-meal card uses the same top-right check-circle interaction as meal-plan selection. The uncooked state shows a light check as an action hint. Tapping it records `cooked_at` and `cooked_by`; the filled olive circle and faded card content show completion while the check control remains at full opacity. Tapping the filled circle again clears both fields so accidental completion can be corrected. Tapping the recipe content opens that planned occurrence's details, where the same reversible Cooked? action remains available on mobile and desktop.

## Reusing a past plan

A past plan exposes **Use this plan again**. The action copies its meals, ordering, and planned servings into a selected current or future week. It never moves or edits the original plan.

The destination is always explicit: **This week**, **Next week**, or another selected future week. Past plan composition is read-only, so the action cannot target the historical source week.

Copied entries always start uncooked. The target week must be empty; reuse never replaces, merges with, or appends to a created plan.

On an empty current or future week, the two most recent populated plans provide a compact copy-forward shortcut. Selecting **Use** copies that source directly into the week being viewed; selecting the preview opens the historical source for review. The immediate confirmation may undo only the plan that was just copied.

## Deferred

- saving a weekly meal plan as a reusable named favorite/template, separate from dated plan history
- ratings and cooking notes
- grocery aggregation and purchased-item state
- nutrition tracking
- recurring plans

## Definite future enhancement: Recommended plan

Empty current or future weeks should eventually offer a genuine **Recommended plan** assembled from the household's favorites. Recommendations should consider recent cooking history, repetition, variety, preparation time, and other useful household preferences before proposing a balanced week.

Until that recommendation engine exists, empty weeks show only the manual **Create meal plan** action. Recommended plans must remain suggestions until the user chooses to save them, and must never silently replace an existing plan.

## Historical edit policy

Meal membership is finalized when any week is created. Past plans are read-only history, and the initial product does not expose structural editing for current or future plans after creation. A mistaken cooked toggle may still be corrected because completion is an occurrence record rather than a structural meal-plan change.
