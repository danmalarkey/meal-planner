# Design System Taxonomy And Review Standard

This document exists to stop structural drift in the Meal Planner design system.

It defines how the system must be organized, documented, and reviewed before new UI work is accepted.

## Non-Negotiable Review Rules

- Do not confuse categories with components.
- Do not document multiple unrelated primitives under one component heading.
- Do not create placeholder sections that do not map to a real file or a named pattern.
- Do not use a reference screenshot as product content.
- Use reference systems for structure, hierarchy, and documentation rhythm only.

## Principal Review Bar

This is the operating bar for Meal Planner design-system work.

- Think in systems, not local fixes.
- Anticipate spacing, motion, interaction states, focus states, and responsive behavior before presenting UI.
- Convert repeated feedback into a rule immediately instead of treating it as a one-off correction.
- Do not ship inert demos for interactive primitives. Use mock data and real outputs when possible.
- Do not let a lower section on `/design-system` become looser than an earlier one. Every section must meet the same documentation contract.
- Prefer fewer, clearer sections with defensible boundaries over more surface area.
- If a section would require explanation to justify its taxonomy, it is not ready.
- If a pattern is weak, fix the primitive or composition rules beneath it instead of decorating the example.
- Keep documentation shell styles separate from primitive styles and primitive styles separate from feature composition.

## Taxonomy

Every section on `/design-system` must be exactly one of these:

### Foundations

Foundations are tokens, scales, and rules.

Examples:
- Colors
- Typography
- Spacing
- Shadows & Radius

Foundations are not components.

### Primitive Components

Primitive components are reusable implementation units with a dedicated file and a stable API.

A primitive component section must:
- map to a real Angular component file
- document one component only
- show variants and states for that component
- include preview, code, and API tabs when the section is mature enough

Examples:
- `ui-button`
- `ui-input`
- `ui-select`
- `ui-segmented`
- `ui-popover`
- `ui-tabs`
- `ui-breadcrumbs`
- `ui-avatar`
- `ui-badge`
- `ui-alert`
- `ui-toast-host`
- `ui-data-strip`
- `ui-table`
- `ui-drawer`
- `ui-modal`
- `ui-empty-state`
- `ui-icon`

### Feature Components

Feature components are reusable product-level compositions built from primitives.

A feature component section must:
- have a clear reusable boundary
- have a dedicated implementation file
- be reusable across multiple product surfaces
- not be a one-off page layout

Examples:
- `ui-app-header`
- `ui-filter-summary`

### Patterns

Patterns are documented interaction or layout recipes composed from primitives and feature components.

A pattern section must:
- be labeled as a pattern
- describe when to use it
- not pretend to be a primitive component
- show the primitives it depends on

Examples:
- Context actions popover
- Filter popover
- Confirmation modal
- Record summary layout

## Documentation Contract For `/design-system`

Each primitive section should converge on this format:

1. Title
2. Short description
3. Preview
4. Code
5. API
6. Accessibility notes

Each pattern section should converge on this format:

1. Pattern name
2. Intent
3. Composition notes
4. Preview
5. Rules

For interactive, data-driven primitives:
- demos must use mock data
- demos must exercise real outputs when possible
- tables, selectors, and similar primitives should not be shown as dead static shells

## Section Admission Test

Before adding a new section to `/design-system`, it must pass all of these:

1. Is it a foundation, primitive, feature component, or pattern?
2. If primitive or feature component, does a real implementation file already exist or get created in the same change?
3. If pattern, is it explicitly labeled as a pattern?
4. Does the section document one thing only?
5. Does the section avoid importing domain-specific baggage from unrelated products?

If any answer is no, the section should not be added.

## Reference Screenshot Rule

Reference screenshots may inform:
- layout hierarchy
- spacing rhythm
- tab treatment
- documentation structure
- example container styling

Reference screenshots may not be used to:
- import unrelated domain concepts
- import irrelevant component names
- import feature taxonomy from another product without adaptation

## Review Questions

Every substantial `/design-system` change should be reviewed against these questions:

1. Is this section structurally honest?
2. Is this a real reusable unit or just a visual grouping?
3. Is this better understood as a pattern than a component?
4. Does the section help product development move faster without creating ambiguity?
5. Would another engineer know what file or pattern to use after reading it?
6. Are spacing, transitions, hover states, focus states, and alignment already resolved to system quality?
7. Does this section hold up without reviewer coaching on obvious interaction or layout details?

If the answer to any of these is no, the section is not ready.
