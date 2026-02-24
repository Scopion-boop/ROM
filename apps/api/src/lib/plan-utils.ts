/**
 * Plan mapping utilities for reconciling internal DB plan names
 * with Stripe/display plan names.
 *
 * Internal plans (DB enum): 'solo'
 * Display plans (user-facing): 'free' | 'pro'
 */

export type InternalPlan = 'solo';
export type DisplayPlan = 'free' | 'pro';

/**
 * Convert internal DB plan to user-facing display plan name.
 */
export function internalToDisplay(plan: InternalPlan): DisplayPlan {
    const map: Record<InternalPlan, DisplayPlan> = {
        solo: 'pro', // solo = individual pro subscription
    };
    return map[plan] ?? 'free';
}

/**
 * Get the monthly session limit for a given plan.
 * Returns null for unlimited sessions.
 */
export function getSessionLimit(plan: InternalPlan | null): number | null {
    // Free tier (no subscription) = 10 sessions/month
    if (!plan) return 10;

    // Solo (paid) plan has unlimited sessions
    if (plan === 'solo') {
        return null;
    }

    // Fallback for unknown plans
    return 10;
}

/**
 * Check if an organization has exceeded their session limit.
 */
export function hasExceededSessionLimit(
    plan: InternalPlan | null,
    monthlySessionCount: number,
): boolean {
    const limit = getSessionLimit(plan);
    if (limit === null) return false; // Unlimited
    return monthlySessionCount >= limit;
}

/**
 * Get remaining sessions for the current billing period.
 * Returns null for unlimited.
 */
export function getRemainingSessionCount(
    plan: InternalPlan | null,
    monthlySessionCount: number,
): number | null {
    const limit = getSessionLimit(plan);
    if (limit === null) return null; // Unlimited
    return Math.max(0, limit - monthlySessionCount);
}
