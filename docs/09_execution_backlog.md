# Execution Backlog

This file tracks accepted future work that is not yet scheduled for implementation. Product rules remain in their owning model documents; this list exists for execution visibility.

## Infrastructure and launch

- [ ] **Finish retiring Catalist infrastructure** — The Meal Planner-owned Supabase project, dedicated Cloudflare account/Worker, verified data backup, deployment, Auth redirect configuration, local runtime cutover, and private-window sign-in check are complete. Test the dedicated stack through November 18, 2026, then choose whether to proceed, extend, or investigate. If proceeding, retire the old Catalist Worker first after explicit approval, remove its redirect from target Auth configuration, and delete the source project only with separate explicit approval. Keep the `workers.dev` URL until product naming and a custom domain are settled. Status: Seven-day rollback test in progress. See `docs/16_infrastructure_handoff.md` and `docs/17_infrastructure_cleanup_plan.md`.

## Recipe library

- [ ] **Import a recipe from another website** — Let a household member paste a public recipe-page URL, extract available structured recipe data and imagery, review or correct every field, and then save the result to **All recipes**. Preserve the source URL and attribution; reject unsafe/private destinations; never require source-site credentials; fall back to clear manual entry when a page cannot be parsed reliably; and let the signed-in member favorite the imported recipe separately. Status: Deferred.

## Meal planning

- [ ] **Save a meal plan as a favorite** — Allow a household to save a weekly plan as a reusable named template that can later populate an empty current or future week. The saved favorite must remain separate from dated meal-plan history, and using it must not alter its source week. Define naming, editing, deletion, and duplicate-handling behavior before implementation. Status: Deferred.
