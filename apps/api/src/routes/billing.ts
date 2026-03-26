import { Router, type Request, type Response, type NextFunction, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authz';
import { validateBody } from '../middleware/validation';
import { getRepos } from '../repositories/repo-factory';
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  getOrCreateStripeCustomer,
  getPlanFromPriceId,
} from '../services/stripe-service';
import { sendPaymentFailedEmail } from '../services/email';
import { invalidatePlanCache } from '../middleware/plan-guard';
import { internalToDisplay, getSessionLimit } from '../lib/plan-utils';
import type Stripe from 'stripe';

/** Stripe webhook payloads may include fields removed from newer API type definitions */
interface SubscriptionWithLegacyFields extends Stripe.Subscription {
  current_period_end?: number;
}

export const billingRouter: IRouter = Router();

const checkoutSchema = z.object({ priceId: z.string().min(1) });

// GET /api/billing/subscription
billingRouter.get(
  '/subscription',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user!;
      const { subscriptions, orgs } = getRepos();
      const [sub, org] = await Promise.all([
        subscriptions.getActiveByOrgId(organizationId),
        orgs.getById(organizationId),
      ]);
      const internalPlan = sub?.plan ?? null;
      res.json({
        plan: internalPlan ? internalToDisplay(internalPlan) : 'free',
        status: sub?.status ?? 'active',
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        trialEnd: sub?.trialEndsAt ?? null,
        sessionsThisMonth: org?.monthlySessionCount ?? 0,
        sessionLimit: getSessionLimit(internalPlan),
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/billing/checkout
billingRouter.post(
  '/checkout',
  requireAuth,
  validateBody(checkoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user!;
      const { priceId } = req.body as { priceId: string };
      const { orgs } = getRepos();
      const org = await orgs.getById(organizationId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      const stripeCustomerId = await getOrCreateStripeCustomer(
        organizationId,
        org.name,
        org.stripeCustomerId,
      );
      if (!org.stripeCustomerId) {
        await orgs.updateStripeCustomerId(organizationId, stripeCustomerId);
      }

      const appUrl = process.env.APP_URL ?? 'http://localhost:2000';
      const checkoutUrl = await createCheckoutSession(
        stripeCustomerId,
        priceId,
        organizationId,
        `${appUrl}/dashboard/billing?success=true`,
        `${appUrl}/dashboard/billing?cancelled=true`,
      );
      res.json({ checkoutUrl });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/billing/portal
billingRouter.post(
  '/portal',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user!;
      const { orgs } = getRepos();
      const org = await orgs.getById(organizationId);
      if (!org?.stripeCustomerId) {
        res.status(400).json({ error: 'No billing account found. Please subscribe first.' });
        return;
      }
      const appUrl = process.env.APP_URL ?? 'http://localhost:2000';
      const portalUrl = await createPortalSession(
        org.stripeCustomerId,
        `${appUrl}/dashboard/billing`,
      );
      res.json({ portalUrl });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/billing/webhook — registered with raw body in app.ts
export async function billingWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(req.body as Buffer, sig);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  const { subscriptions } = getRepos();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const orgId = session.metadata?.organizationId;
          if (orgId) invalidatePlanCache(orgId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as SubscriptionWithLegacyFields;
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          const priceId = sub.items.data[0]?.price.id ?? '';
          const planInternal = getPlanFromPriceId(priceId) ?? 'solo';
          await subscriptions.upsertByOrgId(orgId, {
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan: planInternal,
            status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : undefined,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : undefined,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          });
          invalidatePlanCache(orgId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          await subscriptions.upsertByOrgId(orgId, {
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            plan: 'solo',
            status: 'canceled',
            cancelAtPeriodEnd: false,
          });
          invalidatePlanCache(orgId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer_email) {
          const appUrl = process.env.APP_URL ?? 'http://localhost:2000';
          await sendPaymentFailedEmail(invoice.customer_email, '', `${appUrl}/dashboard/billing`);
        }
        break;
      }
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        const daysLeft = sub.trial_end
          ? Math.ceil((sub.trial_end * 1000 - Date.now()) / 86_400_000)
          : 3;
        console.log(`[billing] Trial ending in ${daysLeft} days for customer ${sub.customer}`);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[billing] Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
