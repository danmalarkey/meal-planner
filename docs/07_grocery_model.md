# Grocery Model

## Scope

Groceries are organized by household and shopping week. The first version supports separate current- and next-week boards, one complete **All items** view, category grouping, manual items, and optional store destinations such as Costco or Target.

## One weekly source of truth

Each grocery item belongs to exactly one weekly grocery board. **All items** is the complete view of that board, not a second list and not a copy of the item.

An item may also have one optional store destination. Assigning an item to Costco or Target changes where it appears when the board is filtered by store, but the item remains visible in **All items**. Removing the destination returns it to the unassigned portion of the weekly board.

This gives the household one authoritative grocery list while still supporting the physical reality of shopping at more than one store.

## Weekly boards

The interface opens **This week** by default and uses the same arrow-based weekly navigation and date labels as Meal Plan. Every week remains a separate board, so future preparation never changes the current shopping list.

A board may receive items from its matching meal plan and may also contain manual items. Past grocery boards remain available as history but are not part of the initial navigation.

## Categories and destinations

Categories answer **what kind of item is this?** Examples include Produce, Meat, Dairy, Beverages, Pantry, and Household. The All items view groups items by category. Known ingredients inherit their stored category; manual entry may infer a category from recognizable names while keeping that field editable.

Store destinations answer **where should we buy it?** Costco and Target are household-managed examples. Destinations persist across weeks, while an item's assignment belongs only to that week's grocery item.

Deleting a store destination removes only the reusable list. Any grocery items assigned to it remain in their weekly **All items** view and become unassigned; deleting a list never deletes grocery items.

Category and store are independent dimensions. Moving apples to Costco does not change their Produce category.

## Item lifecycle

- Meal-plan ingredients and manually added items enter the weekly board.
- New items are unassigned unless the user chooses a store.
- One or more selected items may be moved to a store destination or back to unassigned.
- **Move items** enters multi-select from All items, then assigns the selection to a destination in one batch. Creating a store destination opens that multi-select immediately with the new list already targeted, so the household never has to visit an empty list and start a second add flow.
- Marking an item **Gotten** moves it into the completed state inside its existing category and store view. It does not delete or relocate the item.
- Gotten items are hidden by default across the active list. The list-level overflow menu explicitly shows or hides them, and category titles remain present even when all of their items are hidden.
- Each category heading carries its total, such as **Produce 12**. The overflow menu owns list-level actions: add an item, move multiple items, create a list, and show or hide gotten items.
- Tapping an item row opens its weekly edit drawer for its name, amount, category, and optional store list. Multi-select remains the faster path for moving several items at once. Manual item entry suggests canonical household ingredient names while still allowing free-form basics.
- Store assignment never removes an item from All items.

## Meal-plan generation

Generating groceries is explicit and idempotent. Repeating **Add groceries** for the same week updates the meal-plan-derived items instead of creating duplicates, while preserving their store assignment and Gotten state.

The first version combines an ingredient only when its canonical ingredient identity and normalized unit match. Qualitative or incompatible amounts remain separate rather than guessing a conversion. Source-marked pantry staples are omitted. Every generated item retains links to the planned meals and recipe ingredients that contributed to it.

## Planned data boundaries

- `grocery_weeks` owns the household and `starts_on` date.
- `grocery_destinations` owns reusable household store names.
- `grocery_items` owns the week, category, quantity/display text, checked state, and optional destination.
- Grocery-generation source links will connect an aggregated grocery item back to the planned meals and recipe ingredients that contributed to it.

The source link is important for later serving changes and meal removal. Ingredient provenance must not be collapsed into an opaque text-only list.

## Deferred

- conversion between different units
- household-managed pantry overrides and persistent staples
- collaborative realtime updates
- store ordering or aisle maps
- recurring household basics

