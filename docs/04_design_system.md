# Visual System Foundations + Design System Discipline

This section formalizes Meal Planner’s design system foundations so Codex can build consistently and without drift.

Non-negotiables:
- Absolutely no design drift. Ever.
- Build from the design system first before introducing new components
- All CSS must be in CSS variables
- Only rem units (no pixels)
- Accessibility and WCAG 2.2 is a requirement and foundational
- Maintain a living design system page to track the system

---

## Color Palette (Official)

Core Base:
- White: #FFFFFF
- App Canvas: #F7F9FC
- Secondary Surface: #EFF2F7
- Borders: #E5E7EB
- Primary Text: #111827
- Secondary Text: #6B7280

Primary Brand Color:
- Meal Planner Olive: #636B2F
- Hover: #565D29
- Focus Ring: #C5CA9F
- Darker Accent: #474D22

Status Colors:
- Success: #16A34A
- Warning: #D97706
- Danger: #DC2626

No saturated UI colors.
No decorative gradients.

---

## Typography System (Official)

Primary Font: **Inter**

Why Inter:
- Neutral
- System-friendly
- Designed for UI
- Excellent legibility at small sizes
- Strong numeric rendering (important for values)
- Modern but not trendy
- Performs well across platforms

Typography Scale (rem-based):
H1 → 2.25rem  
H2 → 1.75rem  
H3 → 1.375rem  
H4 → 1.125rem  
Body Large → 1.125rem  
Body → 1rem  
Body Small → 0.875rem  
Caption → 0.75rem  

Font Weights:
- 400 body
- 500 emphasis
- 600 subheadings
- 700 major headings

---

## Layout System

Grid:
- 12-column responsive grid
- Max content width: 72rem
- Generous whitespace
- Vertical rhythm based on 1rem increments

Spacing Scale:
0.25rem  
0.5rem  
1rem  
1.5rem  
2rem  
3rem  
4rem  

No arbitrary pixel spacing.

### Product Page Header Pattern

Product pages use one shared `.page-header` pattern:

- exactly one `h1`, using the H2 token on desktop and H3 token on mobile
- no eyebrow or category copy above the title
- no record totals, status summaries, or decorative copy beside the title
- an optional `.page-header-description` may sit below the title only when it adds information the page content does not already provide
- page actions may share the header row, but they remain semantically separate controls

Recipe-detail names and authentication introductions are content-specific headings, not product page headers.

### Focused Task Mode Pattern

Multi-step mobile tasks that provide their own Cancel and commit actions may temporarily hide the app header and primary navigation. The task title must name the outcome, field labels must name the immediate action, and leaving the mode must always be explicit. Desktop may retain the shell when its larger layout keeps the task context clear.

---

## CSS Variable System (Required)

All design tokens must be defined as variables.
Components may not use raw hex values or pixel units.

Class naming rule:
- Use `block-element--modifier`
- Do not use double underscores

## Styling Ownership Model

Meal Planner uses three styling layers:

1. Global system layer
- Tokens
- Resets
- Shell layout
- Shared primitive visual contracts
- `/design-system` documentation shell styles

2. Primitive behavior layer
- Angular component templates
- Inputs, outputs, host bindings, accessibility behavior
- Minimal component-scoped styles only when the behavior cannot live cleanly in the global system layer

3. Feature layer
- Feature-specific layout composition
- No reinvention of primitive visuals

Rules:
- Shared visual primitives such as cards, tables, popovers, tabs, and shell header patterns should be inspectable in the global stylesheet layer.
- Component-scoped SCSS must not become the hidden source of truth for the visual system.
- `/design-system` should document primitives, not compensate for weak primitive architecture.
- If a style needs to be reused, inspected, or reasoned about as part of the system, it belongs in the global system layer.
- The shared global style layer must be decomposed into maintainable partials by primitive or pattern. Avoid catch-all files that become new styling silos.

---

## Accessibility Requirements

All UI must meet WCAG 2.2 AA minimum.

Required:
- 4.5:1 contrast for body text
- 3:1 for large headings
- Visible focus states (not color-only)
- Keyboard navigable
- Accessible form labels
- ARIA roles where appropriate
- Reduced motion support

Accessibility is not optional.
Accessibility is foundational.

---

## Design System Page (Living)

Meal Planner must include an internal route:
`/design-system`

This route is for internal engineering use only.
It must be available in development by default and must not be publicly reachable in production unless explicitly enabled for internal review.

Sections:
- Foundations: Colors, Typography, Spacing, Shadows & Radius
- Primitive components: Buttons, Inputs, Selects, Textareas, Checkboxes, Radio Groups, Toggles, Segmented Controls, Cards, Data Strips, Tabs, Breadcrumbs, Icon Buttons, Popovers, Chips, Badges, Alerts, Toasts, Empty States, Avatars, Tables, Drawers, Modals, Icons
- Feature components: App Header, Filter Summary, Workspace Commands, Recipe Identity, Recipe Card, Recipe Recent Item, Recipe Recent Rail, Recipe Category Picker
- Patterns: Meal planning Actions, Filtering, Confirmation Modal, Scroll & Highlight

This page acts as the single source of UI truth.
No component is built without design system documentation first.

### Current Implemented Section Meal planning (March 2026 Sync)

Foundations:
- Colors
- Typography
- Spacing
- Shadows & Radius

Primitive components:
- Buttons
- Inputs
- Selects
- Textareas
- Checkboxes
- Radio Groups
- Toggles
- Segmented Controls
- Cards
- Data Strips
- Tabs
- Breadcrumbs
- Icon Buttons
- Popovers
- Chips
- Badges
- Alerts
- Toasts
- Empty States
- Avatars
- Tables
- Drawers
- Modals
- Icons

Feature components:
- Account Menu
- App Header
- Filter Summary
- Workspace Commands
- Recipe Identity
- Recipe Card
- Recipe Recent Item
- Recipe Recent Rail
- Recipe Category Picker

Patterns:
- Meal planning Actions
- Filtering
- Confirmation Modal
- Scroll & Highlight

## Taxonomy Discipline

Every section on `/design-system` must be exactly one of these:
- Foundation
- Primitive component
- Feature component
- Pattern

Rules:
- Categories are not components.
- A primitive component section must map to a real implementation file.
- A feature component section must map to a reusable composed implementation file.
- A pattern must be explicitly labeled as a pattern and must not pretend to be a primitive.
- Do not document multiple unrelated primitives inside one section and label it as a component.

Examples:
- `Data Display` is a category, not a component.
- `Feedback` is a category, not a component.
- `Navigation` is a category, not a component.
- `ui-data-strip` is a primitive component.
- `ui-filter-summary` is a feature component.
- `Meal planning actions popover` is a pattern.

Reference screenshots may guide hierarchy, layout rhythm, and documentation treatment.
They may not define Meal Planner’s component meal planning or taxonomy.

For interactive, data-driven primitives on `/design-system`:
- use mock data
- wire real outputs when possible
- do not present tables, selectors, or similar primitives as inert screenshots

---

# Component System Variants + Rules (Rigor Spec)

This section defines component variants and enforcement rules.
Codex must implement these components first, then build features using them.

Non-negotiables:
- No design drift
- Use design system components only
- CSS variables only (no raw hex in components)
- rem units only
- WCAG 2.2 AA compliance required
- All interactive components keyboard accessible
- All components documented on `/design-system`

---

## Global Interaction Rules (Applies to All Components)

States (required):
- default
- hover
- active/pressed
- focus-visible (keyboard)
- disabled
- loading (if applicable)

Focus:
- Must use `:focus-visible`
- Focus ring must be visible on all interactive elements
- Focus ring tokenized via tokens

Hit Targets:
- Minimum touch target height: 2.75rem

Motion:
- Subtle transitions only
- Respect reduced motion preferences
- No decorative animations

Icons:
- Icon-only buttons require `aria-label`
- Icons must not be the only meaning signal

Semantics:
- Use correct native elements (`<button>`, `<a>`, `<input>`)
- Avoid div-click traps
- Accessible names required

---

## Expanded Design Tokens (Comprehensive Token Contract)

Rules:
- All values are in rem (except colors)
- No pixels
- No hardcoded hex in components (only in token definitions)
- Tokens must be consumable by Angular components without drift

```css
:root {
  /* Base */
  --color-bg: #FFFFFF;
  --color-bg-alt: #F7F9FC;
  --color-surface: #FFFFFF;
  --color-surface-alt: #EFF2F7;

  /* Borders */
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #4B5563;
  --color-text-inverse: #FFFFFF;

  /* Brand */
  --color-primary: #636B2F;
  --color-primary-hover: #565D29;
  --color-primary-active: #474D22;
  --color-primary-soft: #E8EBD9;

  /* Status */
  --color-success: #16A34A;
  --color-success-soft: #DCFCE7;
  --color-warning: #D97706;
  --color-warning-soft: #FFEDD5;
  --color-danger: #DC2626;
  --color-danger-soft: #FEE2E2;
  --color-info: var(--color-primary);
  --color-info-soft: var(--color-primary-soft);

  /* Links */
  --color-link: var(--color-primary);
  --color-link-hover: var(--color-primary-hover);

  /* Typography */
  --font-family-base: 'Inter', system-ui, sans-serif;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-default: 1.5;
  --line-height-loose: 1.7;

  --font-size-caption: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;

  --font-size-h4: 1.125rem;
  --font-size-h3: 1.375rem;
  --font-size-h2: 1.75rem;
  --font-size-h1: 2.25rem;

  --letter-spacing-default: 0;
  --letter-spacing-tight: -0.01em;

  /* Spacing */
  --space-0: 0rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 3rem;
  --space-7: 4rem;
  --space-8: 6rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-pill: 999rem;
  --radius-control: var(--radius-md);
  --radius-token: var(--radius-pill);

  Radius usage:
  - `--radius-control` is the default for CTA, action, ghost, and menu-trigger buttons
  - `--radius-token` is the default for badges, chips, tags, and status tokens
  - `--radius-md` is the default component radius for inputs, data strips, popovers, and utility surfaces
  - `--radius-lg` is the default surface radius for cards, modals, and larger panels
  - `--radius-sm` is reserved for tighter controls when density requires it
  - `--radius-pill` is reserved for pill-shaped tokens and controls; square icon-only buttons may use it to remain circular

  /* Borders */
  --border-width: 0.0625rem;
  --border-style: solid;
  --border-default: var(--border-width) var(--border-style) var(--color-border);
  --border-strong: var(--border-width) var(--border-style) var(--color-border-strong);

  /* Shadows (minimal) */
  --shadow-none: none;
  --shadow-sm: 0 0.0625rem 0.125rem rgba(0,0,0,0.06);
  --shadow-md: 0 0.25rem 0.5rem rgba(0,0,0,0.08);
  --shadow-lg: 0 1rem 2.5rem rgba(0,0,0,0.08);

  Shadow usage:
  - `--shadow-sm` is optional quiet elevation for standard panels; recipe-grid items remain flat
  - `--shadow-md` is for floating surfaces such as popovers, menus, and elevated examples
  - `--shadow-lg` is for dominant overlays such as modals
  - do not invent one-off shadows in component styles

  /* Focus */
  --focus-ring-color: #C5CA9F;
  --focus-ring-size: 0.1875rem;
  --focus-ring-offset: 0.125rem;

  Focus usage:
  - all keyboard focus states must use these tokens
  - do not use ad hoc outlines or browser-default focus treatments when authoring components

  /* Control sizes */
  --control-height-xs: 1.625rem;
  --control-height-sm: 2.25rem;
  --control-height-md: 2.75rem;
  --control-height-lg: 3.25rem;

  --control-padding-x-sm: 0.75rem;
  --control-padding-x-md: 1rem;
  --control-padding-x-lg: 1.25rem;

  Control sizing usage:
  - use the control-height scale to keep fields, buttons, segmented controls, and triggers aligned
  - default to `--control-height-md` unless a documented component variant requires otherwise

  /* Z-index */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;

  /* Transitions */
  --transition-fast: 120ms;
  --transition-default: 180ms;
  --transition-slow: 240ms;
  --easing-standard: ease;
}
```

---

## Button System (Core)

Buttons are foundational. All buttons must be built from a single base with variants.

Button anatomy:
- Container
- Label text
- Optional leading icon
- Optional trailing icon
- Optional spinner (loading state)

Shape:
- CTA, action, and ghost buttons use rounded rectangles via `--radius-control`, not pills
- Icon-only buttons remain circular when their square control contract calls for it

Rules:
- Icon alignment must not shift label
- Add and attach actions use one leading plus icon; do not pair it with a trailing caret, including when the action opens a menu
- Loading state must preserve width (avoid layout shift)
- Disabled must block pointer and keyboard activation
- Must support `<button>` and `<a>` patterns
- Icon-only buttons require `aria-label`

Button variants (required):
- Primary
- Secondary
- Ghost (explicitly required)
- Destructive
- Link button

Variant intent + rules:
- Only one primary button per content region (card/modal/section) unless exceptional
- Ghost: transparent background, subtle hover surface; must maintain affordance and accessibility
- Destructive actions require confirmation for high-impact operations

Button sizes (required):
- xs (compressed section actions and dense command rows)
- sm (dense toolbars/tables/inline)
- md (default)
- lg (onboarding/empty-state/hero CTAs)

State rules:
- Disabled must remain readable; do not fade to illegibility
- Loading disables interaction, sets `aria-busy="true"`, and preserves width

---

## Icon Button System (Required)

Variants:
- Icon Secondary (default)
- Icon Ghost (common for toolbars)
- Icon Destructive

Rules:
- `aria-label` required
- Tooltip recommended
- Must meet minimum hit target

---

## Button Groups / Segmented Controls (Required)

Used for:
- segmented controls
- view toggles (grid/list)
- filter toggles

Rules:
- Arrow-key navigation for segmented controls
- Selected state not color-only

---

## Input System (Text Inputs)

Inputs include:
- text
- search
- number
- date
- textarea

Rules:
- Labels required (visible label; placeholder is not a label)
- Helper + error text beneath
- Error wires to aria-describedby + aria-invalid
- Search input includes clear button; ESC-to-clear recommended

---

## Select / Dropdown System

MVP:
- single select (native or custom)

Rules:
- Keyboard accessible
- Screen reader announces selection
- Supports long lists (virtualization future)

---

## Checkbox / Radio / Toggle

Rules:
- All must have labels
- Prefer native inputs when possible
- Toggles not used for destructive irreversible actions

---

## Badge / Tag System

Variants:
- Neutral
- Info
- Success
- Warning
- Danger

Rules:
- Do not overuse color
- Badges short (1–2 words)
- Must not rely solely on color for meaning

---

## Card System

Anatomy:
- Header (title + actions)
- Body
- Footer (optional)

Variants:
- Standard (default)
- Interactive (hover border change, clickable)
- Dense (for lists)

Rules:
- Use borders primarily, minimal shadows
- Clickable cards must have hover/focus state and not conflict with internal links

---

## Table System (Dense Data Layouts)

Required:
- Sortable columns
- Row hover state
- Row selection (bulk operations)
- Pagination or infinite scroll per context
- Dense spacing variant

Rules:
- Sort headers are buttons (not clickable divs)
- Provide accessible column headers
- Selection keyboard operable

---

## Modal System

Types:
- Confirmation
- Form
- Step-up security (MFA challenge)
- Picker modal (metadata match selection)

Rules:
- Trap focus
- Escape closes only if safe (not for destructive confirmations)
- Return focus to invoking element
- Accessible on mobile

---

## Toast / Alert System

Toast:
- Success / Info / Warning / Error

Alert:
- Inline warnings
- Form errors
- System notifications

Rules:
- Toasts must not contain critical info that can be missed
- Errors also appear inline where relevant

---

## Empty State System

Rules:
- Explain what’s missing
- Provide one clear CTA (Primary)
- Provide optional secondary guidance (Ghost/Link)

---

## Workspace Command Surface

Classification:
- Shared feature component composed from existing primitives

Composition:
- `ui-workspace-command` owns the desktop identity row, presentation switcher, condensed search animation, utilities, and selection-state boundary for Recipe and Meal planning
- workspace identity, presentation mode, primary creation action, and infrequent management actions
- category refinement or expanded search in the flexible region
- search, sort, filter, and selection controls in a separate utility group
- `ui-workspace-results-summary` and bulk actions while selection mode is active
- the same compact sticky command row on mobile, with search expanding in place

Rules:
- Keep workspace identity outside the sticky command row.
- Preserve a recipe description as compact secondary context beneath the workspace title; truncate it before letting it crowd the action group.
- Place the set-and-forget view switcher beside workspace identity; keep it semantically separate from recipe management even though they share a row.
- Let the app header own global capture; preserve the active recipe as capture context on recipe routes.
- Categories occupy the flexible region. Search animates left from its utility trigger as one extra-small control without replacing them, reverses that motion on close, and receives focus after opening; sort, filter, and selection remain in that utility group.
- Show at most four named category chips after `All`; place remaining choices and management behind a plain `More` trigger without a count badge. Keep `More` directly adjacent to the visible category chips and reachable when the rail compresses.
- Use a compact active sort label in the toolbar (`Recent`, `Updated`, `A–Z`) while the menu and accessible name retain the full, explicit wording.
- Compress utility copy without hiding state: Search may be icon-only, while Sort, Filter, and Select retain short visible labels. Apply the shared `ui-compact-actions` density contract to workspace utilities, drawer section actions, and global-header controls so they resolve to `--control-height-xs` without page-level overrides.
- Replace ordinary workspace commands with bulk actions during selection instead of stacking both sets.
- Desktop commands remain sticky beneath the app header; do not promote the mobile bottom bar on desktop.
- Keep category refinement and desktop utility actions on one row; compress or clip the category preview before stacking those groups.
- Respond to available workspace width with a container query so inspector-open states do not depend only on viewport width.
- Hidden responsive command surfaces must not remain in the keyboard tab order.

---

## Pagination / Infinite Scroll Rules

Default:
- Pagination for tables
- Infinite scroll for grid views

Rules:
- Preserve scroll position
- Provide skeletons
- Avoid uncontrolled infinite loading

---

## Form Validation Rules

- Validate on blur + on submit (not on every keystroke)
- Clear actionable error messages
- Errors adjacent to field
- Summary error region at top for screen readers

---

## Component Documentation Requirements (`/design-system`)

Every component entry must include:
- Name
- Purpose
- Variants
- Sizes
- States
- Accessibility notes
- Do / Don’t guidance
- Code usage snippet

No component is considered “done” until documented.

---

## Enforcement Rules (Prevent Drift)

1. Build design system components first.
2. Feature work may only compose system components.
3. New component requests must be justified by repeated use case and documented.
4. No one-off CSS inside feature components (except layout wrappers).
5. All spacing uses `--space-*` tokens.
6. All colors use `--color-*` tokens.
7. No hardcoded hex values or pixel units anywhere.
8. All interactive components must pass keyboard-only usage test.

---

## Immediate System Build List (Codex-First Backlog)

Codex should build these in this order:

1) Tokens + typography baseline (Inter)  
2) Button system (all variants including Ghost) + icon buttons + loading  
3) Input system (text/search/number/textarea)  
4) Badge system  
5) Card system  
6) Table system (sorting + selection UI)  
7) Modal system (confirm + form)  
8) Toast/alert system  
9) Empty states  
10) Design system page (`/design-system`) documenting everything above

No feature work begins until 1–5 are complete and documented.
