# Meal Planner design-system audit

This document records the current boundary between the shipped product and the
internal `/design-system` reference. The route is an implementation-backed
recipe library, not a separate visual concept.

## Canonical taxonomy

| Boundary | Owns | Does not own |
| --- | --- | --- |
| Foundations | Color, typography, spacing, elevation, radius, focus, and motion tokens | Component-specific layout |
| Primitive components | Reusable units with one stable interaction or presentation job | Product workflows |
| Feature components | Reusable product-level compositions built from primitives | One-page arrangements |
| Patterns | Documented recipes for composing primitives and features | Selectors or APIs that do not exist |

Governance rules belong in this audit and in automated checks. They are not a
fifth component category.

## Reconciliation completed

- Renamed the former “Core Components” group to the accurate “Primitive
  Components” boundary.
- Added the shipped `ui-swatch` primitive and its actual API.
- Documented Lucide as the source icon library and `ui-icon` as the required
  Meal Planner boundary, including the complete approved token meal planning.
- Reclassified `uiScrollHighlight` from an informal pattern to its real shared
  directive boundary.
- Removed the duplicate scroll/highlight example and the orphan “Rules”
  section.
- Replaced remote sample artwork with stable local design-system assets.
- Updated drifted API references for buttons, alerts, popovers, tables,
  drawers, modals, and the application header.
- Flattened the specimen layout so one example surface owns the border,
  background, and elevation instead of rendering documentation cards inside
  documentation cards.
- Added `npm run audit:design-system` to verify shipped `ui-*` components are
  registered, implementation paths exist, registry IDs are unique, and every
  registered section is present on the route. Production builds run this audit
  automatically.
- Bound every registered component to its API-documentation key. The audit now
  compares live signal inputs and outputs with the documented contract and
  fails on missing or stale rows.
- Added preview-presence checks so a registered component cannot pass with
  documentation alone; its section must render the real selector.
- Added feature-coverage checks for shared capture, feature, and recipe
  components. Each candidate must be documented or carry a specific exclusion
  reason.
- Interactive previews now exercise their outputs instead of rendering inert
  controls. The audit also rejects projected card-footer actions when the
  owning card has not enabled its footer.
- Reconciled recipe-item card specimens with the four production layouts:
  recipe workspace card, media list, mobile compact list, and recipes
  index recent card. Selection and category/status states are visible in the
  reference instead of being API-only claims.
- Replaced fictional meal planning/archive pattern examples with the product’s
  category contextual actions and delete-item confirmation language.
- Added registry-backed component search to the sticky desktop and mobile
  navigation so the reference remains usable as the meal planning grows.
- Documented the shipped skeleton-loading classes as a composition pattern,
  including the shared shell, block, pill, busy-state, and reduced-motion
  contracts.

## Current ownership

The registry in
`src/app/pages/design-system/design-system-page.data.ts` is the source of truth
for the route navigation and implementation mapping.

Feature components currently documented:

- Application header
- External source attribution
- Filter summary
- Recipe item identity
- Recipe item summary
- Recipe item card
- Recipe recent rail
- Recipe category picker
- Recipe editor drawer

Composition patterns currently documented:

- Contextual row actions
- Filtering drawer
- Skeleton loading
- Confirmation modal

## Remaining product-to-system candidates

These are shipped compositions that need a deliberate reuse audit before they
are promoted into the system:

- Recipe item drawer
- Recipe category manager drawer
- Quick-add flow

The exclusions and their reasons live in
`DESIGN_SYSTEM_FEATURE_EXCLUSIONS`; the automated audit prevents an
unclassified shared feature from silently falling between product and system.
Promotion is not automatic. A feature belongs in the shared system only when
it has a stable, preview-safe boundary and centralizing it reduces duplicated
behavior.

## Change rule

When adding or changing a shared UI behavior:

1. Update the owning primitive or feature component.
2. Update its design-system preview, usage guidance, and API reference.
3. Run `npm run audit:design-system`.
4. Run the relevant component tests and the production build.

Page-level CSS may arrange shared components, but it must not redefine their
radius, typography, selected state, focus treatment, or interaction behavior.

## Delta-completeness gate

Do not call a reconciliation pass complete after checking only the sections
that were visibly edited. Before handoff:

1. Compare the canonical registry with shipped primitives, feature components,
   shared CSS patterns, and current product states.
2. Verify every requested layout delta at desktop and mobile widths.
3. Verify state examples include loading, empty, disabled, error, selection,
   and recovery where the owning implementation supports them.
4. Verify navigation remains usable as the meal planning grows, including direct
   search rather than requiring manual section scanning.
5. Run the structural audit, relevant interaction tests, production build, and
   a final source-drift search before reporting completion.
