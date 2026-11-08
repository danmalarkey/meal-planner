# Meal Planner Auth Email Templates

These generated HTML files are the canonical Meal Planner presentation for Supabase Auth email. They use one shared shell from `build.mjs`; workflow-specific templates only own their subject, copy, action, and supported Supabase variables.

## Build

From the repository root:

```sh
node supabase/templates/build.mjs
```

Do not edit the generated `.html` files directly. Update `build.mjs` and rebuild them.

## Hosted Supabase installation

After custom SMTP is connected, open each project’s **Authentication → Emails → Email Templates** screen and copy the matching generated file into the template editor.

| Supabase template | Subject | File |
| --- | --- | --- |
| Confirm sign up | `Confirm your Meal Planner email` | `confirmation.html` |
| Invite user | `You’re invited to Meal Planner` | `invite.html` |
| Magic link | `Your Meal Planner sign-in link` | `magic_link.html` |
| Reset password | `Reset your Meal Planner password` | `recovery.html` |
| Change email address | `Confirm your Meal Planner email change` | `email_change.html` |
| Reauthentication | `{{ .Token }} is your Meal Planner verification code` | `reauthentication.html` |
| Password changed | `Your Meal Planner password was changed` | `password_changed_notification.html` |
| Email address changed | `Your Meal Planner email was changed` | `email_changed_notification.html` |
| Verification method added | `A verification method was added to Meal Planner` | `mfa_factor_enrolled_notification.html` |
| Verification method removed | `A verification method was removed from Meal Planner` | `mfa_factor_unenrolled_notification.html` |
| Sign-in method linked | `A sign-in method was linked to Meal Planner` | `identity_linked_notification.html` |
| Sign-in method removed | `A sign-in method was removed from Meal Planner` | `identity_unlinked_notification.html` |

Security notifications remain opt-in Supabase behavior. Installing their branded content does not require enabling notification types Meal Planner has not deliberately adopted.

## Optional custom SMTP

Use a verified sending domain owned by the project and keep credentials outside Git.

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Resend API key
- Sender name: `Meal Planner`
- Sender email: an address on the verified project domain

Disable click and open tracking for Auth emails so the provider does not rewrite Supabase confirmation links.

