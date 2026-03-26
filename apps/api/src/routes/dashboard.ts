import { Router, type IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { getRepos } from '../repositories/repo-factory';
import { getSessionLimit } from '../lib/plan-utils';

export const dashboardRouter: IRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;
    const { sessions, measurements, subscriptions, orgs } = getRepos();
    const [allSessions, sub, org] = await Promise.all([
      sessions.listByOrg(organizationId),
      subscriptions.getActiveByOrgId(organizationId),
      orgs.getById(organizationId),
    ]);
    const allMeasurements = (
      await Promise.all(allSessions.map((s) => measurements.listBySession(s.id)))
    ).flat();
    const totalSessions = allSessions.length;
    const totalMeasurements = allMeasurements.length;
    const avgConfidenceScore =
      totalMeasurements > 0
        ? Math.round(
            (allMeasurements.reduce((acc, m) => acc + m.confidenceScore, 0) / totalMeasurements) *
              100,
          )
        : null;
    const now = new Date();
    const thisMonthSessions = allSessions.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const lastMonthSessions = allSessions.filter((s) => {
      const d = new Date(s.createdAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    }).length;
    const sessionChange =
      lastMonthSessions === 0
        ? thisMonthSessions > 0
          ? '+100%'
          : '+0%'
        : `${thisMonthSessions >= lastMonthSessions ? '+' : ''}${Math.round(((thisMonthSessions - lastMonthSessions) / lastMonthSessions) * 100)}%`;
    res.json({
      totalSessions,
      totalMeasurements,
      avgConfidenceScore,
      sessionsThisMonth: org?.monthlySessionCount ?? thisMonthSessions,
      sessionLimit: getSessionLimit(sub?.plan ?? null),
      sessionChange,
    });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/rom-trend', async (req, res, next) => {
  try {
    const { organizationId } = req.user!;
    const daysParam = req.query.days as string | undefined;
    const days = Math.min(parseInt(daysParam ?? '30', 10), 90);
    const { sessions, measurements } = getRepos();
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const allSessions = await sessions.listByOrg(organizationId);
    const recentSessions = allSessions.filter((s) => new Date(s.createdAt) >= cutoff);

    // Pre-populate date buckets with empty arrays
    const byDate: Record<string, number[]> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0]!;
      byDate[d] = [];
    }

    await Promise.all(
      recentSessions.map(async (s) => {
        const dateKey = s.createdAt.split('T')[0]!;
        if (byDate[dateKey] !== undefined) {
          const ms = await measurements.listBySession(s.id);
          byDate[dateKey]!.push(...ms.map((m) => m.romDegrees));
        }
      }),
    );

    const dates = Object.keys(byDate).sort();
    const avgRom = dates.map((d) => {
      const vals = byDate[d]!;
      return vals.length > 0 ? Math.round(vals.reduce((acc, v) => acc + v, 0) / vals.length) : 0;
    });

    res.json({ dates, avgRom });
  } catch (err) {
    next(err);
  }
});
