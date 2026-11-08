import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = dirname(fileURLToPath(import.meta.url));

const authTemplates = [
  {
    filename: 'confirmation.html',
    subject: 'Confirm your Meal Planner email',
    preheader: 'Confirm your email address to finish setting up Meal Planner.',
    context: 'Account setup',
    title: 'Confirm your email',
    paragraphs: [
      'Confirm this email address to finish setting up your Meal Planner account.'
    ],
    action: { label: 'Confirm email', href: '{{ .ConfirmationURL }}' },
    note: 'If you didn’t create a Meal Planner account, you can safely ignore this email.'
  },
  {
    filename: 'invite.html',
    subject: 'You’re invited to Meal Planner',
    preheader: 'Accept your invitation to Meal Planner.',
    context: 'Invitation',
    title: 'You’re invited',
    paragraphs: [
      'You’ve been invited to create a Meal Planner account and start planning meals together.'
    ],
    action: { label: 'Accept invitation', href: '{{ .ConfirmationURL }}' },
    note: 'If you weren’t expecting this invitation, you can safely ignore this email.'
  },
  {
    filename: 'magic_link.html',
    subject: 'Your Meal Planner sign-in link',
    preheader: 'Use this secure link to sign in to Meal Planner.',
    context: 'Sign in',
    title: 'Sign in to Meal Planner',
    paragraphs: [
      'Use the secure link below to sign in. This link expires shortly and can only be used once.'
    ],
    action: { label: 'Sign in', href: '{{ .ConfirmationURL }}' },
    note: 'If you didn’t request this link, you can safely ignore this email.'
  },
  {
    filename: 'recovery.html',
    subject: 'Reset your Meal Planner password',
    preheader: 'Choose a new password for your Meal Planner account.',
    context: 'Password reset',
    title: 'Reset your password',
    paragraphs: [
      'We received a request to reset the password for your Meal Planner account.'
    ],
    action: { label: 'Reset password', href: '{{ .ConfirmationURL }}' },
    note: 'If you didn’t request a password reset, you can safely ignore this email.'
  },
  {
    filename: 'email_change.html',
    subject: 'Confirm your Meal Planner email change',
    preheader: 'Confirm the email address change for your Meal Planner account.',
    context: 'Account security',
    title: 'Confirm your email change',
    paragraphs: [
      'Confirm the change from <strong style="color: #111827; font-weight: 600;">{{ .Email }}</strong> to <strong style="color: #111827; font-weight: 600;">{{ .NewEmail }}</strong>.'
    ],
    action: { label: 'Confirm email change', href: '{{ .ConfirmationURL }}' },
    note: 'Both addresses must confirm this change. If you didn’t request it, do not use this link.'
  },
  {
    filename: 'reauthentication.html',
    subject: '{{ .Token }} is your Meal Planner verification code',
    preheader: 'Use this code to confirm it’s you.',
    context: 'Account security',
    title: 'Confirm it’s you',
    paragraphs: [
      'Enter this verification code in Meal Planner to continue. It expires shortly.'
    ],
    code: '{{ .Token }}',
    note: 'Never share this code. Meal Planner will never ask for it by email or phone.'
  }
];

const securityTemplates = [
  {
    filename: 'password_changed_notification.html',
    subject: 'Your Meal Planner password was changed',
    preheader: 'The password for your Meal Planner account was changed.',
    context: 'Security notice',
    title: 'Your password was changed',
    paragraphs: ['The password for your Meal Planner account was recently changed.'],
    action: { label: 'Reset password', href: '{{ .SiteURL }}/forgot-password' },
    note: 'If you made this change, no action is needed. If you didn’t, reset your password immediately.'
  },
  {
    filename: 'email_changed_notification.html',
    subject: 'Your Meal Planner email was changed',
    preheader: 'The email address for your Meal Planner account was changed.',
    context: 'Security notice',
    title: 'Your email was changed',
    paragraphs: [
      'The email address for your Meal Planner account changed from <strong style="color: #111827; font-weight: 600;">{{ .OldEmail }}</strong> to <strong style="color: #111827; font-weight: 600;">{{ .Email }}</strong>.'
    ],
    action: { label: 'Reset password', href: '{{ .SiteURL }}/forgot-password' },
    note: 'If you made this change, no action is needed. If you didn’t, reset your password immediately.'
  },
  {
    filename: 'mfa_factor_enrolled_notification.html',
    subject: 'A verification method was added to Meal Planner',
    preheader: 'A new verification method was added to your Meal Planner account.',
    context: 'Security notice',
    title: 'Verification method added',
    paragraphs: [
      'A new <strong style="color: #111827; font-weight: 600;">{{ .FactorType }}</strong> verification method was added to your Meal Planner account.'
    ],
    action: { label: 'Open Meal Planner', href: '{{ .SiteURL }}' },
    note: 'If you didn’t make this change, review your account and reset your password immediately.'
  },
  {
    filename: 'mfa_factor_unenrolled_notification.html',
    subject: 'A verification method was removed from Meal Planner',
    preheader: 'A verification method was removed from your Meal Planner account.',
    context: 'Security notice',
    title: 'Verification method removed',
    paragraphs: [
      'A <strong style="color: #111827; font-weight: 600;">{{ .FactorType }}</strong> verification method was removed from your Meal Planner account.'
    ],
    action: { label: 'Open Meal Planner', href: '{{ .SiteURL }}' },
    note: 'If you didn’t make this change, review your account and reset your password immediately.'
  },
  {
    filename: 'identity_linked_notification.html',
    subject: 'A sign-in method was linked to Meal Planner',
    preheader: 'A new sign-in method was linked to your Meal Planner account.',
    context: 'Security notice',
    title: 'Sign-in method linked',
    paragraphs: [
      'A <strong style="color: #111827; font-weight: 600;">{{ .Provider }}</strong> sign-in method was linked to <strong style="color: #111827; font-weight: 600;">{{ .Email }}</strong>.'
    ],
    action: { label: 'Open Meal Planner', href: '{{ .SiteURL }}' },
    note: 'If you didn’t make this change, review your account and reset your password immediately.'
  },
  {
    filename: 'identity_unlinked_notification.html',
    subject: 'A sign-in method was removed from Meal Planner',
    preheader: 'A sign-in method was removed from your Meal Planner account.',
    context: 'Security notice',
    title: 'Sign-in method removed',
    paragraphs: [
      'The <strong style="color: #111827; font-weight: 600;">{{ .Provider }}</strong> sign-in method was removed from <strong style="color: #111827; font-weight: 600;">{{ .Email }}</strong>.'
    ],
    action: { label: 'Open Meal Planner', href: '{{ .SiteURL }}' },
    note: 'If you didn’t make this change, review your account and reset your password immediately.'
  }
];

function renderParagraphs(paragraphs) {
  return paragraphs
    .map(
      (paragraph) => `
                <p style="margin: 0 0 16px; color: #4b5563; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5;">
                  ${paragraph}
                </p>`
    )
    .join('');
}

function renderAction(action) {
  if (!action) return '';

  return `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                  <tr>
                    <td style="border-radius: 8px; background: #636b2f;">
                      <a href="${action.href}" style="display: inline-block; padding: 12px 18px; color: #ffffff; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.25; text-decoration: none;">${action.label}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 24px; color: #6b7280; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word;">
                  If the button doesn’t work, copy and paste this link into your browser:<br>
                  <a href="${action.href}" style="color: #565d29; text-decoration: underline;">${action.href}</a>
                </p>`;
}

function renderCode(code) {
  if (!code) return '';

  return `
                <div style="margin: 24px 0; padding: 18px; border: 1px solid #d1d5db; border-radius: 8px; background: #f7f9fc; color: #111827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.18em; line-height: 1.2; text-align: center;">${code}</div>`;
}

function renderTemplate(template) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${template.subject}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f7f9fc; color: #111827;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${template.preheader}</div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; background: #f7f9fc;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 100%; max-width: 600px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <tr>
              <td style="padding: 20px 32px; border-bottom: 1px solid #e5e7eb;">
                <a href="{{ .SiteURL }}" style="display: inline-block; color: #111827; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; text-decoration: none;">Meal Planner</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 8px; color: #636b2f; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; line-height: 1.4;">${template.context}</p>
                <h1 style="margin: 0 0 16px; color: #111827; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2;">${template.title}</h1>${renderParagraphs(template.paragraphs)}${renderAction(template.action)}${renderCode(template.code)}
                <p style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5;">${template.note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; border-top: 1px solid #e5e7eb; background: #f7f9fc; color: #6b7280; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5;">
                Plan meals, save recipes, and shop together.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

for (const template of [...authTemplates, ...securityTemplates]) {
  await writeFile(resolve(outputDirectory, template.filename), renderTemplate(template), 'utf8');
}

console.log(`Built ${authTemplates.length + securityTemplates.length} Meal Planner Auth email templates.`);
