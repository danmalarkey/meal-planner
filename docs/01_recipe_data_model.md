# Recipe Data Model

## Scope

The first Meal Planner data slice owns household membership, recipes, ingredients, instructions, cookware, recipe images, and serving scaling. Meal scheduling and grocery-list workflows remain deferred until the imported recipe library is verified.

## Household boundary

Every recipe and ingredient belongs to a household. Household members may work with the household library; household owners manage membership and household settings. The default household serving count is `4` and must be one of `2`, `4`, or `6`.

Favorite state is personal rather than recipe ownership. `recipe_favorites` links one household recipe to one household member; removing that link never deletes or hides the shared recipe from other members. The current Mealime archive is the household's existing favorite set, so migration and re-import mark those recipes as favorites for every current household member.

All household tables use Row Level Security. Recipe images live in the private `recipe-images` bucket under this path contract:

```text
<household-id>/<recipe-id>/<image-file>
```

## Recipe serving model

Recipes store one `base_servings` value and one set of base ingredient quantities. The application derives a scale factor at runtime:

```text
target servings / base servings
```

The supported target values are `2`, `4`, and `6`. Scaled recipe variants are never persisted as duplicate recipes or ingredient rows.

Each recipe ingredient retains the source strings and a parsed quantity boundary:

- `quantity_text`, `unit_text`, and `amount_text` preserve the archive fields.
- `display_text`, `shopping_text`, and `source_text` preserve the complete human-readable forms.
- `normalized_quantity` and `normalized_unit` support scaling.
- Ingredients without a measurable amount keep a null normalized quantity and remain unchanged when servings change.
- `source_data` preserves the complete source ingredient object for future parser improvements.

The importer parses the complete `amount` field because mixed quantities such as `1 ½ lb` are split across the source `quantity` and `unit` fields.

Mealime instruction strings preserve their original line structure. The first non-empty line is the written instruction; later lines are the quantities used in that step. Recipe detail presents those quantities directly below the instruction and derives their 2-, 4-, or 6-serving display at runtime. The stored source instruction remains unchanged.

## Import contract

`mealime-recipes.json` and the matching image directory are immutable source material. The importer:

1. Runs as a dry-run unless `--apply` is supplied.
2. Verifies every recipe, amount, and image before connecting to Supabase.
3. Requires a Meal Planner project reference, service-role key, and existing household ID.
4. Verifies the target database contains the Meal Planner application identity marker.
5. Upserts source records by household, provider, and source ID.
6. Uploads images to private Storage using stable household and recipe paths.
7. Marks the imported Mealime recipes as favorites for current household members.

The first hosted validation import should use `--limit 5`. Load all 134 recipes only after the five-recipe result is verified in the database and Storage.

## Future import sources

The recipe library should eventually accept a public recipe-page URL and prepare a household-owned recipe from the page's structured recipe data. Import is always review-before-save: the user can confirm or correct the title, image, servings, timing, ingredients, and instructions before anything is persisted. A newly imported website recipe enters **All recipes** and is favorited only when the signed-in member chooses it.

The importer must preserve the source URL and available attribution, reject private or unsafe network destinations, and never require or reuse credentials for the source website. Unsupported or incomplete pages should fail clearly and allow manual entry rather than silently saving a partial recipe. Imported quantities must continue to use the existing base-serving and source-string preservation model.
