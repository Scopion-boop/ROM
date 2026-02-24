import type { RequestHandler } from 'express';
import { getRepos } from '../repositories/repo-factory';

type InternalPlan = 'solo';
const PLAN_RANK: Record<InternalPlan | 'free', number> = {
  free: 0,
  solo: 1,
};

const cache = new Map<string, { plan: InternalPlan | 'free'; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidatePlanCache(orgId: string): void {
  cache.delete(orgId);
}

async function getOrgPlan(orgId: string): Promise<InternalPlan | 'free'> {
  const cached = cache.get(orgId);
  if (cached && Date.now() < cached.expiresAt) return cached.plan;

  const { subscriptions } = getRepos();
  const sub = await subscriptions.getActiveByOrgId(orgId);
  const plan: InternalPlan | 'free' =
    sub && (sub.status === 'active' || sub.status === 'trialing')
      ? (sub.plan as InternalPlan)
      : 'free';

  cache.set(orgId, { plan, expiresAt: Date.now() + CACHE_TTL_MS });
  return plan;
}

export function planGuard(required: 'solo'): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user?.organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const plan = await getOrgPlan(user.organizationId);
      if (PLAN_RANK[plan] < PLAN_RANK[required]) {
        res.status(402).json({
          error: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: 'pro',
          currentPlan: plan === 'free' ? 'free' : 'pro',
          upgradeUrl: '/dashboard/billing',
        });
        return;
      }
      req.plan = plan;
      next();
    } catch (err) {
      next(err);
    }
  };
}
