# Infrastructure cleanup plan

Created: November 11, 2026

Re-evaluate: November 18, 2026

## Purpose

Use the dedicated Meal Planner infrastructure for one week, confirm that normal household workflows remain reliable, and then decide whether to retire the Catalist-owned rollback resources.

Nothing in this plan authorizes automatic deletion. The November 18 review is a decision checkpoint. Deleting the old Cloudflare Worker and deleting the old Supabase project each require separate explicit approval.

## Resources under test

- Current frontend: `https://meal-planner.meal-planner-app.workers.dev`
- Current Supabase project: `ugslkmbxnxtaukbwbdng`
- Temporary fallback frontend: `https://meal-planner.usecatalistapp.workers.dev`
- Temporary fallback Supabase project: `mberdmpyvjylnmmlnpsc`
- Local recovery backup: `local-data/supabase-backups/2026-11-11-mberdmpyvjylnmmlnpsc/`

Use the current frontend for all normal testing. Do not intentionally add new data through the fallback frontend because writes there will not be synchronized into the current Supabase project.

## Test during the week

Test naturally during regular use; a single successful pass of each relevant workflow is enough.

- [ ] Sign in from a fresh or private browser session.
- [ ] Sign out and sign back in.
- [ ] Confirm recipe lists, details, favorites, and all recipe images load.
- [ ] Create or update a meal plan and confirm it persists after a reload.
- [ ] Mark a planned meal cooked and confirm the state persists.
- [ ] Generate or update groceries from a meal plan.
- [ ] Add and edit a manual grocery item.
- [ ] Move a grocery item to a store list and toggle its completion state.
- [ ] Confirm the app works on the phone or a phone-sized browser viewport.
- [ ] Return on a later day and confirm the week's changes are still present.

## Test notes

Record only failures, suspicious behavior, or anything that needs another look.

| Date | Area | Observation | Resolved? |
| --- | --- | --- | --- |
|  |  |  |  |

Do not place passwords, API keys, database URLs containing credentials, or other secrets in this file.

## Stop conditions

Do not delete either fallback resource if any of these occur:

- sign-in, sign-out, confirmation, or password recovery fails;
- recipes, images, meal plans, groceries, favorites, or household membership are missing;
- a write appears successful but disappears after reload;
- the new Worker is intermittently unavailable;
- the target project contains fewer expected records or Storage objects than the verified migration baseline;
- the local recovery backup is missing or unreadable.

If a stop condition occurs, document it above and diagnose it against the current infrastructure. Use the fallback only for emergency access; do not continue writing independently to both projects.

## November 18 review

Before approving cleanup:

- [ ] Review the test checklist and notes.
- [ ] Confirm the current frontend still opens and authenticates in a fresh browser session.
- [ ] Confirm new meal-plan or grocery changes made during the week are present after reload.
- [ ] Re-run the source/target verification only if a discrepancy was observed during testing.
- [ ] Confirm the local recovery backup still contains the SQL exports, Storage manifest, and 134 recipe images.
- [ ] Confirm no application, deployment, redirect, or documentation still depends on the Catalist Worker or source project.
- [ ] Decide explicitly whether to proceed, extend the rollback period, or investigate a problem.

## Cleanup order after approval

Perform these steps in order. Stop if any verification fails.

1. **Delete the old Catalist Cloudflare Worker.** Delete only the Worker serving `https://meal-planner.usecatalistapp.workers.dev`. Do not modify the dedicated Meal Planner Worker.
2. **Verify the current app again.** Open `https://meal-planner.meal-planner-app.workers.dev`, sign in, and confirm the application loads normally.
3. **Remove the obsolete Auth redirect.** In target Supabase project `ugslkmbxnxtaukbwbdng`, remove the redirect entry for `https://meal-planner.usecatalistapp.workers.dev/**`. Keep the current Worker URL and intended local-development redirects.
4. **Review the source Supabase project separately.** Confirm project `mberdmpyvjylnmmlnpsc` is no longer referenced by local environment files, hosting configuration, import tooling, or Auth redirects.
5. **Request separate approval to delete the source project.** Supabase project deletion is permanent. Do not delete it merely because the Worker was removed.
6. **Preserve the local backup.** Keep the November 11 backup after source-project deletion unless a later, independently verified backup supersedes it.
7. **Update the records.** Mark the infrastructure backlog complete and update `docs/15_decision_log.md` and `docs/16_infrastructure_handoff.md` with the actual deletion dates and verification result.

## Result options

At the November 18 review, record one outcome:

- **Proceed:** testing passed and cleanup can begin with the old Worker.
- **Extend:** no failure was found, but more rollback time is desired.
- **Investigate:** a stop condition or unresolved concern blocks cleanup.
