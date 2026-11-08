# Angular Component API Contracts (System Components)

Codex must implement standalone Angular components with strict typed inputs/outputs.

Rules:
- No component should expose raw styling knobs that bypass tokens
- Variants/sizes are enums, not arbitrary strings
- All interactive components must support `id`, `disabled`, and accessibility inputs
- Emit events for user actions; avoid two-way binding unless necessary

---

## Shared Types (Recommended)

Define shared enums (examples):
- `UiSize = 'sm' | 'md' | 'lg'`
- `UiButtonVariant = 'primary' | 'primary-elevated' | 'secondary' | 'secondary-elevated' | 'ghost' | 'destructive' | 'link'`
- `UiIconPosition = 'leading' | 'trailing'`
- `UiStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger'`

---

## ui-button

Inputs:
- `variant: UiButtonVariant` (default: `secondary`)
- `size: UiSize` (default: `md`)
- `type: 'button' | 'submit' | 'reset'` (default: `button`)
- `disabled: boolean` (default: `false`)
- `loading: boolean` (default: `false`)
- `iconLeading?: string`
- `iconTrailing?: string`
- `ariaLabel?: string` (required for icon-only)
- `fullWidth?: boolean` (default: `false`)

Outputs:
- `clicked: EventEmitter<MouseEvent>`

Rules:
- If `loading=true`, suppress clicks and set `aria-busy="true"`
- If icon-only, `ariaLabel` required
- Must preserve width in loading state

---

## ui-icon-button

Inputs:
- `variant: 'secondary' | 'ghost' | 'destructive'` (default: `ghost`)
- `size: UiSize` (default: `md`)
- `icon: string` (required)
- `disabled: boolean`
- `loading: boolean`
- `ariaLabel: string` (required)
- `tooltip?: string` (recommended)

Outputs:
- `clicked: EventEmitter<MouseEvent>`

---

## ui-segmented

Inputs:
- `items: Array<{ id: string; label: string; icon?: string; disabled?: boolean }>`
- `value: string`
- `size: UiSize` (default: `md`)
- `ariaLabel: string` (required)

Outputs:
- `valueChange: EventEmitter<string>`

Rules:
- Arrow keys move selection
- Selected state must use the same premium active-language as adjacent selection controls
- Selected state is not color-only
- Use for compact mode switching when all options should stay visible

---

## ui-breadcrumbs

Inputs:
- `items: Array<{ label: string; path?: string }>` (required)

Rules:
- Last breadcrumb item is the current page and is not interactive
- Current breadcrumb exposes `aria-current="page"`
- Intermediate items may link to parent routes

---

## ui-input

Inputs:
- `label: string` (required)
- `value: string`
- `type: 'text' | 'email' | 'password' | 'number' | 'date' | 'search'` (default: `text`)
- `placeholder?: string`
- `helperText?: string`
- `errorText?: string`
- `disabled?: boolean`
- `required?: boolean`
- `readonly?: boolean`
- `size: UiSize` (default: `md`)
- `id?: string`
- `name?: string`
- `autocomplete?: string`
- `iconLeading?: string`
- `iconTrailing?: string`
- `clearable?: boolean`
- `maxLength?: number`

Outputs:
- `valueChange: EventEmitter<string>`
- `blurred: EventEmitter<FocusEvent>`
- `submitted: EventEmitter<void>` (optional for search enter key)

Rules:
- Visible label required
- `errorText` wires to `aria-describedby` and `aria-invalid=true`
- Search includes clear action; ESC to clear recommended

---

## ui-textarea

Inputs:
- `label: string`
- `value: string`
- `rows?: number` (default: 4)
- `helperText?: string`
- `errorText?: string`
- `disabled?: boolean`
- `required?: boolean`
- `maxLength?: number`

Outputs:
- `valueChange: EventEmitter<string>`
- `blurred: EventEmitter<FocusEvent>`

---

## ui-select (MVP)

Inputs:
- `label: string`
- `value: string | null`
- `options: Array<{ value: string; label: string; disabled?: boolean }>`
- `placeholder?: string`
- `helperText?: string`
- `errorText?: string`
- `disabled?: boolean`
- `required?: boolean`

Outputs:
- `valueChange: EventEmitter<string | null>`

Rules:
- Keyboard accessible
- If custom, must meet combobox/listbox ARIA rules
- Native select is acceptable in MVP if semantics preserved

---

## ui-checkbox

Inputs:
- `label: string`
- `checked: boolean`
- `disabled?: boolean`
- `helperText?: string`

Outputs:
- `checkedChange: EventEmitter<boolean>`

---

## ui-radio-group

Inputs:
- `label: string`
- `value: string`
- `options: Array<{ value: string; label: string; disabled?: boolean }>`
- `disabled?: boolean`

Outputs:
- `valueChange: EventEmitter<string>`

---

## ui-toggle

Inputs:
- `label: string`
- `checked: boolean`
- `disabled?: boolean`
- `description?: string`

Outputs:
- `checkedChange: EventEmitter<boolean>`

Rules:
- Toggles used only for reversible settings

---

## ui-badge

Inputs:
- `variant: UiStatus` (default: `neutral`)
- `text: string` (required)
- `icon?: string`

Rules:
- Must not rely solely on color; text conveys meaning

---

## ui-card

Inputs:
- `title?: string`
- `subtitle?: string`
- `interactive?: boolean` (default false)
- `dense?: boolean` (default false)

Slots:
- header actions slot
- body slot
- footer slot

Rules:
- Interactive cards must be keyboard focusable and support Enter/Space activation

---

## ui-table (System)

Inputs:
- `columns: Array<{ id: string; label: string; sortable?: boolean; width?: string }>`
- `rows: Array<any>`
- `rowKey: (row) => string`
- `sort?: { columnId: string; direction: 'asc' | 'desc' }`
- `selectable?: boolean`
- `selectedKeys?: string[]`
- `dense?: boolean`
- `loading?: boolean`
- `emptyState?: { title: string; description?: string; ctaLabel?: string }`

Outputs:
- `sortChange`
- `selectionChange`
- `rowClicked`

Rules:
- Sortable headers are buttons
- Selection keyboard operable
- Provide “select all” when selectable

---

## ui-modal

Inputs:
- `open: boolean`
- `title: string`
- `description?: string`
- `size: 'sm' | 'md' | 'lg'` (default md)
- `closeOnBackdrop?: boolean` (default true; false for destructive confirms)
- `closeOnEscape?: boolean` (default true; false for destructive confirms)

Outputs:
- `closed`

Rules:
- Focus trap
- Restore focus to trigger on close
- `role="dialog"`, `aria-modal="true"`

---

## ui-drawer

Inputs:
- `open: boolean`
- `title: string`
- `description?: string`
- `size: 'md' | 'lg'` (default `md`)
- `closeOnBackdrop?: boolean` (default `true`)
- `closeOnEscape?: boolean` (default `true`)

Outputs:
- `openChange: EventEmitter<boolean>`
- `closed: EventEmitter<void>`

Rules:
- Focus trap while open
- Restore focus to trigger on close
- Use for contextual workflows that should remain on-page

---

## Toast System

**Service:** `UiToastService`

Methods:
- `success(message: string)`
- `info(message: string)`
- `warning(message: string)`
- `error(message: string)`
- `dismiss(id: string)`

Host:
- `ui-toast-host` renders the active toast stack from the service signal.

Rule:
- Toasts are non-critical; critical errors also render inline

---

## ui-empty-state

Inputs:
- `title: string`
- `description?: string`
- `icon?: string`
- `primaryCta?: { label: string }`
- `secondaryCta?: { label: string; variant?: 'ghost' | 'link' }`

Outputs:
- `primaryClicked`
- `secondaryClicked`

Rules:
- Only one primary CTA
- Secondary CTA should be Ghost or Link by default
