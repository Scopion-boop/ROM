import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  _resend ??= new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.FROM_EMAIL ?? 'hello@physiolens.io';

async function safeEmail(fn: () => Promise<unknown>): Promise<void> {
  if (!getResend()) return; // skip when key not configured
  try {
    await fn();
  } catch (err) {
    console.error('[email]', err);
  }
}

export function sendWelcomeEmail(to: string, name: string, clinicName: string): Promise<void> {
  return safeEmail(() =>
    getResend()!.emails.send({
      from: FROM,
      to,
      subject: 'Welcome to PhysioLens',
      html: `<h1>Welcome, ${name}!</h1><p>Your PhysioLens account for <strong>${clinicName}</strong> is ready.</p><p>— The PhysioLens Team</p>`,
    }),
  );
}

export function sendInviteEmail(
  to: string,
  inviterName: string,
  clinicName: string,
  inviteUrl: string,
): Promise<void> {
  return safeEmail(() =>
    getResend()!.emails.send({
      from: FROM,
      to,
      subject: `You've been invited to join ${clinicName} on PhysioLens`,
      html: `<h1>You're invited</h1><p>${inviterName} invited you to join <strong>${clinicName}</strong> on PhysioLens.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>— The PhysioLens Team</p>`,
    }),
  );
}

export function sendTrialExpiringEmail(to: string, name: string, daysLeft: number): Promise<void> {
  return safeEmail(() =>
    getResend()!.emails.send({
      from: FROM,
      to,
      subject: `Your PhysioLens trial ends in ${daysLeft} days`,
      html: `<p>Hi ${name}, your free trial ends in ${daysLeft} days. <a href="${process.env.APP_URL}/dashboard/billing">Upgrade now</a>.</p><p>— The PhysioLens Team</p>`,
    }),
  );
}

export function sendPaymentFailedEmail(to: string, name: string, retryUrl: string): Promise<void> {
  return safeEmail(() =>
    getResend()!.emails.send({
      from: FROM,
      to,
      subject: 'PhysioLens payment failed',
      html: `<p>Hi ${name}, we couldn't process your payment. <a href="${retryUrl}">Update payment method</a>.</p><p>— The PhysioLens Team</p>`,
    }),
  );
}
