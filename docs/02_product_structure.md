# Product Structure

Meal Planner has four primary product areas:

- **Meal plan** is the signed-in landing area and owns the household's weekly meal schedule.
- **Groceries** owns the household shopping list derived from planned meals plus manual items.
- **Recipes** is the household recipe library. **All recipes** contains the shared library; **Favorites** is a personal filter over that library rather than a separate collection or ownership boundary.
- Meal detail uses the neutral `/meals/:recipeId` route because a meal may be opened from Recipes, a meal plan, or another future workflow. Section routes do not own meal identity.
- **Settings** owns account and household configuration. It is reached from the user-avatar popover rather than occupying primary navigation.

The primary app shell exposes Meal plan, Groceries, and Recipes. Account identity, Settings, and Sign out are grouped in the account menu because they describe the signed-in user rather than the meal-planning workflow.

## Meal Plan State

A meal plan is persisted household data, not a filtered view of Recipes. Each planned-meal entry references one household recipe and owns its plan-specific state, including position, planned servings, optional scheduled day, and completion.

The **Cooked?** action sets a completion timestamp on the planned-meal entry. Cooked cards remain visible in the plan with a clear completed treatment. The action may be reversed to correct an accidental completion. Completion never changes the underlying recipe or its personal favorite state, because the same recipe may be cooked again in another plan.

Household members can navigate past and future weeks. **Use this plan again** copies a past plan into a selected current or future week without modifying history; copied entries start uncooked. The detailed behavior is owned by `docs/03_meal_plan_model.md`.

Past meal-plan composition is historical and read-only. An empty current or future week may be built once; after creation, its meal membership is closed. Reusing a past plan therefore creates a plan only in an explicitly selected empty current or future week rather than reopening history or appending to an existing plan.

## Grocery State

Groceries use a weekly board aligned with meal planning. **This week** and **Next week** are separate boards. Within a board, **All items** is the household's one authoritative list and groups items by grocery category.

Household-managed store destinations such as Costco and Target are optional views over the same items. Moving an item to a store assigns its destination; it does not copy the item or remove it from All items. The detailed behavior is owned by `docs/07_grocery_model.md`.

Within every category and store view, marking an item **Gotten** moves it into a reversible completed state. Completed items are hidden by default and can be revealed in place with **Show completed**, keeping the active shopping view focused without losing history or synchronization across lists.

## Responsive Direction

Meal Planner is mobile-first for interaction design while retaining a spacious desktop layout:

- On mobile, there is no persistent top app header. Each product page keeps its own title context sticky at the top; Meal plan keeps the title and week navigation together. The three primary destinations use one persistent bottom navigation group, and the account avatar shares that bottom layout region as a semantically separate final control. Recipe details prioritize full-width imagery, tabbed Cookware / Ingredients / Instructions content, and a focused cooking action.
- On desktop, the same destinations remain in the header. Recipe details keep the existing side-by-side hero and multi-panel content layout so larger screens can show more information at once.

Mobile and desktop share the same routes, primitives, data, and semantic navigation. Responsive layout may reposition a control, but it must not create a second feature implementation.

The internal design-system route remains available in development but is not part of product navigation.
