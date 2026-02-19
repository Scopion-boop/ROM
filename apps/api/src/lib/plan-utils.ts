/**
 * Plan mapping utilities for reconciling internal DB plan names
 * with Stripe/display plan names.
 *
 * Internal plans (DB enum): 'solo' | 'practice' | 'enterprise'
 * Display plans (user-facing): 'free' | 'pro' | 'practice'
 */

export type InternalPlan = 'solo' | 'practice' | 'enterprise';
export type DisplayPlan = 'free' | 'pro' | 'practice';

/**
 * Convert internal DB plan to user-facing display plan name.
 */
export function internalToDisplay(plan: InternalPlan): DisplayPlan {
    const map: Record<InternalPlan, DisplayPlan> = {
        solo: 'pro', // solo = individual pro subscription
        practice: 'practice',
        enterprise: 'practice', // enterprise maps to practice display
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

    // All paid plans have unlimited sessions
    if (plan === 'solo' || plan === 'practice' || plan === 'enterprise') {
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
