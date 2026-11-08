# UX Principles

## Buttons Stay Clickable

Do not prevent users from clicking primary workflow buttons just because required information is missing.

The user should be allowed to click the action. If something is missing or invalid, respond with clear feedback in context and, when useful, a toast or message that explains exactly what to fix.

Avoid this pattern:

- Disable `Save`, `Review`, `Continue`, or similar action buttons because a required field is empty.
- Leave the user with a disabled cursor and no explanation.
- Hide validation behind preconditions the user has to infer.

Use this pattern:

- Keep the action clickable.
- On click, validate the current state.
- Show the missing requirement in plain language.
- Keep loading and in-progress protections only for actual pending work where duplicate submission would be unsafe.

Example:

- Good: user clicks `Save`, then sees `Add at least one ingredient before saving.`
- Bad: `Save` is disabled until an ingredient is added.
