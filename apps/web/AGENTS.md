# Meal Planner project instructions

## Design system

- Keep foundations, primitive components, feature components, and patterns structurally distinct.
- Reuse tokens and existing primitives before adding new styling or component variants.
- Keep interface copy in sentence case.
- Preserve WCAG 2.2 AA behavior, visible focus, keyboard operation, and reduced-motion support.

## Product boundaries

- Do not inherit catalog, collection, inventory, barcode, ownership, or provider concepts from the source application.
- Add meal-planning concepts only after their domain and household ownership rules are explicit.
- Treat household membership as the future authorization boundary.

## Git hygiene

- Keep routine Git operations low-noise.
- Do not commit, push, open pull requests, or deploy unless explicitly requested.
- Run each relevant build or test once per code state and reuse the result.
