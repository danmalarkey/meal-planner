# Accessibility + Quality Gates (WCAG 2.2 Rigor)

This checklist is the verification gate during implementation and PR review.
Codex should implement unit tests where feasible and devs should manual-test
keyboard and screen reader basics.

---

## Global Accessibility Checklist
- [ ] Keyboard-only navigation works (Tab/Shift+Tab)
- [ ] Focus visible is always present and obvious
- [ ] No focus traps except within modals (intentional)
- [ ] No interaction requires a mouse
- [ ] Color is never the only indicator (errors, selected states, status)
- [ ] Text contrast meets WCAG AA across states
- [ ] Touch targets meet minimum size
- [ ] Reduced motion respected
- [ ] Form errors announced and associated

---

## Buttons (ui-button, ui-icon-button)
- [ ] Uses native `<button>` unless link semantics required
- [ ] `disabled` prevents focus and activation
- [ ] `loading` sets `aria-busy="true"` and prevents double-submit
- [ ] Icon-only requires `aria-label`
- [ ] Focus ring visible on keyboard focus
- [ ] Ghost buttons still have affordance + focus ring

---

## Inputs (ui-input, ui-textarea)
- [ ] Visible label present (placeholder not used as label)
- [ ] `aria-describedby` includes helper + error text
- [ ] When invalid, `aria-invalid="true"`
- [ ] Error message is specific and actionable
- [ ] Search clear is keyboard reachable and labeled

---

## Select / Dropdown (ui-select)
- [ ] Native select retains semantics OR custom follows ARIA combobox/listbox patterns
- [ ] Keyboard selection works (arrows, enter, escape)
- [ ] Screen reader announces label + current selection

---

## Checkbox / Radio / Toggle
- [ ] Label is clickable and associated correctly
- [ ] Toggle announces on/off
- [ ] Radio groups have group label
- [ ] Keyboard interaction works

---

## Badges
- [ ] Meaning conveyed via text, not color alone
- [ ] Contrast sufficient against backgrounds

---

## Cards (interactive)
- [ ] Interactive cards focusable
- [ ] Enter/Space activates action
- [ ] Focus ring visible
- [ ] Nested interactive elements do not conflict

---

## Tables (ui-table)
- [ ] Column headers semantic
- [ ] Sortable headers are buttons
- [ ] Sort state announced (aria-sort or equivalent)
- [ ] Row selection keyboard accessible
- [ ] Select all accessible
- [ ] Dense variant remains readable

---

## Modals
- [ ] Focus trapped within modal
- [ ] Initial focus meaningful
- [ ] Escape/backdrop behavior matches risk level
- [ ] Close returns focus to invoking element
- [ ] Screen reader announces title/content

---

## Toasts / Alerts
- [ ] Toasts do not steal focus
- [ ] Critical errors appear inline and are announced

---

# Enforcement Process (PR Gate)

A pull request introducing UI changes must include:
- Which system component(s) were used or created
- Confirmation that tokens were used (no raw styling)
- Confirmation keyboard-only test passed
- Confirmation focus-visible states verified
- Confirmation contrast checked for primary interactions

No exceptions.
No drift.
