# Infrastructure separation handoff

Last updated: November 11, 2026

## Goal

Give Meal Planner clean infrastructure ownership that is independent of Catalist, preserves the household's current data, and costs nothing until a paid launch requires otherwise.

The operating setup is:

- a dedicated Meal Planner Supabase organization and production project;
- a dedicated Cloudflare account and Worker for the frontend;
- no Catalist database, Stripe, deployment, or runtime credentials in Meal Planner;
- the default `workers.dev` address until the product name and custom domain are settled.

The data and hosting cutover completed on November 11, 2026. The Catalist-owned Worker and source Supabase project remain temporarily available only as rollback resources; retirement is the remaining separation work. Use the dedicated stack through November 18, 2026, then follow the test and decision gates in `docs/17_infrastructure_cleanup_plan.md`.

## Supabase migration execution status

Decision clarified on November 11, 2026: migrate from the Catalist-owned production project `mberdmpyvjylnmmlnpsc` to the separately created Meal Planner-owned project `ugslkmbxnxtaukbwbdng`. This was a project-to-project migration, not an organization transfer. Database, Auth, Storage, configuration comparison, deployment, and private-window sign-in checks passed before local browser and import configuration moved to the target.

Database and Storage migration completed on November 11, 2026. A logical source backup is stored locally under the gitignored `local-data/supabase-backups/2026-11-11-mberdmpyvjylnmmlnpsc/` directory. It contains roles, schema, data, migration-history schema/data, all 134 private recipe images, and a checksummed Storage manifest.

Pre-transfer production baseline recorded on November 11, 2026:

- source organization ID: `oxlmeyltbrpbonetfrht`;
- project ref: `mberdmpyvjylnmmlnpsc`;
- application identity rows: 1;
- Auth users: 1;
- households / household members: 1 / 1;
- recipes / ingredients: 134 / 230;
- recipe ingredients / steps / cookware: 1,713 / 1,599 / 1,498;
- recipe favorites: 128;
- meal plans / entries: 1 / 5;
- grocery weeks / destinations / items / item sources: 2 / 2 / 0 / 0;
- grocery category preferences: 0;
- private `recipe-images` Storage objects: 134 objects totaling 16,351,996 bytes;
- billing and Stripe event tables: 0 rows.

The 134 recipe image references and 134 Storage objects match. The existing project-scoped secret successfully completed the read-only inventory. No secret values are recorded here.

The source-project verification matched the full baseline with no count differences:

- project ref remained `mberdmpyvjylnmmlnpsc`;
- the existing project endpoint and project-scoped secret remained valid;
- application identity remained `meal-planner`;
- all recorded database counts matched;
- all 134 recipe image references and 134 private Storage objects remained present;
- Storage remained 16,351,996 bytes;
- the existing production frontend returned HTTP 200.

The target-project verification also matched the full source baseline with no differences:

- target project ref: `ugslkmbxnxtaukbwbdng`;
- application identity: `meal-planner`;
- Auth users: 1;
- migration history rows: 11;
- all recorded application-table counts matched;
- private recipe-image Storage policies: 4;
- recipe image references / Storage objects: 134 / 134;
- Storage bytes: 16,351,996.

The source and target public Auth settings also match: email/password enabled, signups enabled, email confirmation required, and phone auth disabled.

## Cloudflare separation status

Completed on November 11, 2026:

- dedicated Cloudflare account ID: `fc5544f8cd9a5d9f8e6824a9ecdfdac1`;
- dedicated `workers.dev` account subdomain: `meal-planner-app.workers.dev`;
- Worker name: `meal-planner`;
- new deployment URL: `https://meal-planner.meal-planner-app.workers.dev`;
- deployed version ID after the account-subdomain rename: `76cdbd33-bec3-456d-acf7-303250b570de`;
- `apps/web/wrangler.jsonc` is pinned to the dedicated account ID;
- the deployed build uses the new `ugslkmbxnxtaukbwbdng` Supabase URL and publishable key;
- the design-system audit and Angular production build passed before deployment;
- the target Supabase Auth Site URL and redirect allowlist include the dedicated Worker;
- a private-window sign-in and normal application-loading check passed against the dedicated Worker;
- the Catalist Cloudflare Worker was not modified and remains a temporary fallback.

The local browser and import environment files now point to the target project. A product-owned custom domain remains deferred until the product name is settled.

Remaining Supabase migration work:

- deploy any required Edge Functions and secrets only if they are deliberately activated;
- verify custom Auth email templates only if the product begins using templates beyond Supabase defaults;
- perform deeper recipe-image, meal-plan, and grocery mutation checks if stronger acceptance coverage is desired;
- retire the Catalist Worker first, then remove its redirect URL from the target Auth configuration;
- retain the source Supabase project for a short rollback window and delete it only with separate explicit approval.

Do not delete the source backup. Supabase project deletion is permanent, and the local backup is the recovery artifact after the rollback project is retired.

## Verified current state

- Repository: `https://github.com/danmalarkey/meal-planner`
- Local checkout: `/Users/danmalarkey/dev-work/personal/meal-planner`
- Verified commit on November 11, 2026: `d34ec23`
- Current frontend: `https://meal-planner.meal-planner-app.workers.dev`.
- Temporary fallback frontend: `https://meal-planner.usecatalistapp.workers.dev` returned HTTP 200 on November 11, 2026.
- The checked-in Worker name is `meal-planner`; its static output is `apps/web/dist/meal-planner-web/browser`.
- Current Supabase project ref: `ugslkmbxnxtaukbwbdng`.
- Current Supabase URL: `https://ugslkmbxnxtaukbwbdng.supabase.co`.
- Temporary fallback Supabase project ref: `mberdmpyvjylnmmlnpsc`.
- Browser runtime variables are `MEAL_PLANNER_SUPABASE_URL` and `MEAL_PLANNER_SUPABASE_PUBLISHABLE_KEY`.
- Import-only credentials stay local and must never be copied into browser or hosting variables.
- Stripe code is dormant. Any future billing setup must use a dedicated Meal Planner Stripe account and credentials.
- The local worktree contains uncommitted grocery categorization, grocery UI, recipe-card styling, documentation, and test-cleanup migration work. Preserve it; do not discard or reset it during the infrastructure move.
- The open GitHub issue list was checked on November 11, 2026; no infrastructure-separation issue exists.

No secret values are recorded in this document.

## Remaining infrastructure decisions

### 1. Retire the Catalist rollback resources

The dedicated Supabase and Cloudflare resources are active. Re-evaluate the rollback resources on November 18, 2026, using `docs/17_infrastructure_cleanup_plan.md`. Delete the old Catalist Worker first after explicit approval, remove its target Auth redirect afterward, and delete the source Supabase project only after separate explicit approval.

### 2. Choose a custom domain after naming

The dedicated Cloudflare Worker is the production host. Keep its `workers.dev` URL until the product name is settled, then purchase and attach a product-owned custom domain without coupling the app back to Catalist.

### 3. Choose the initial environment model

For the lowest-cost safe setup, start with:

- one production Supabase project;
- local development against local Supabase or an explicitly disposable test project;
- one production hosting project;
- preview deployments with no production write credentials unless deliberately authorized.

A separate hosted test database is useful, but it should not be created by coupling Meal Planner back to Catalist.

## Execution checklist

1. **Preserve current application work.** Review and commit the existing Meal Planner worktree before changing infrastructure. Do not reset or clean it.
2. **Production inventory completed.** The database, Auth, and Storage baseline is recorded above and matched after transfer.
3. **Target project prepared.** Project `ugslkmbxnxtaukbwbdng` is the separately created Meal Planner-owned production project.
4. **Recoverable backup completed.** The logical database export, Storage objects, and Storage manifest are retained locally under the gitignored `local-data` directory.
5. **Target data restore completed.** Database roles, schema, data, Auth user, migration history, Storage objects, and private Storage policies are present in the target.
6. **Automated verification completed.** The source/target comparison passed with no count or Storage differences.
7. **Dedicated hosting completed.** The Worker is deployed from the Meal Planner-owned Cloudflare account at `https://meal-planner.meal-planner-app.workers.dev`.
8. **Browser-safe variables configured.** The deployed app and local browser configuration use the target URL and publishable key. Supabase secret keys, database passwords, and Stripe secrets remain server-side/local only.
9. **Supabase Auth URLs updated.** The dedicated Worker is the target Site URL and allowed redirect; the Catalist Worker remains allowed only during rollback.
10. **Initial interactive acceptance completed.** Private-window sign-in and normal application loading passed. Run deeper mutation checks before retirement if that extra rollback assurance is desired.
11. **Cutover completed with fallback retained.** The dedicated Worker and target Supabase project are the current path; Catalist resources remain unchanged for rollback.
12. **Retire old configuration last.** With explicit approval, delete the old Worker first and remove its redirect. Delete source project `mberdmpyvjylnmmlnpsc` only after a deliberate rollback window and separate explicit confirmation.

## Commercial-launch blockers to keep visible

- The imported Mealime recipe text and images are household source material, not assumed commercial inventory. Replace, license, or obtain rights to launch content before selling access.
- Add privacy, terms, account deletion, support, error monitoring, backups, and a deliberate billing decision before accepting payment.
- Keep Stripe dormant until a dedicated Meal Planner account, products, webhook, allowed origins, and launch policy are ready.

## Resume prompt

When returning, use:

> Open `docs/16_infrastructure_handoff.md`, verify the current worktree and current provider terms, then help me separate Meal Planner infrastructure without touching Catalist or losing production data.
