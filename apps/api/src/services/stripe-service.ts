import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });
  }
  return _stripe;
}

export async function getOrCreateStripeCustomer(
  orgId: string,
  orgName: string,
  existingCustomerId: string | null | undefined,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;
  const customer = await getStripe().customers.create({
    name: orgName,
    metadata: { organizationId: orgId },
  });
  return customer.id;
}

export async function createCheckoutSession(
  stripeCustomerId: string,
  priceId: string,
  orgId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: orgId },
    },
    metadata: { organizationId: orgId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? '',
  );
}

export function getPlanFromPriceId(priceId: string): 'solo' | 'practice' | 'enterprise' | null {
  if (
    priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ID_PRO_YEARLY
  ) return 'solo';
  if (
    priceId === process.env.STRIPE_PRICE_ID_PRACTICE_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ID_PRACTICE_YEARLY
  ) return 'practice';
  return null;
}
