# Go-Live Runbook

## Purpose
Standardize production launch steps, define rollback triggers, and ensure safe pilot release.

## Roles and Responsibilities

| Role | Responsibility | Contact |
|------|---------------|---------|
| Release Manager | Coordinates deployment, go/no-go calls | `[TBD]` |
| On-call Engineer | Monitors systems, executes rollback if needed | `[TBD]` |
| QA Lead | Validates smoke tests, confirms acceptance | `[TBD]` |
| Security Observer | Monitors for security anomalies | `[TBD]` |
| Clinical Advisor | Validates measurement quality post-deploy | `[TBD]` |

## Pre-Launch (T-24h)

- [ ] RELEASE_CHECKLIST.md fully completed
- [ ] All sign-offs obtained (engineering, security, compliance, product)
- [ ] Staging environment mirrors production configuration
- [ ] Rollback procedure tested against staging
- [ ] Communication plan distributed to stakeholders
- [ ] On-call schedule confirmed for launch window + 48h

## Go-Live Sequence

### Phase 1: Canary (T+0 to T+30min)
1. Confirm go/no-go checklist complete → Release Manager decides GO
2. Deploy release candidate to production canary (10% traffic)
3. **Monitor continuously:**
   - `GET /api/health` — must return 200
   - `GET /api/health/metrics` — error counters stable
   - Request logger — no unexpected 5xx patterns
4. Execute critical path smoke test:
   - Register user → Login → Create session → Add measurement → Generate note → Export JSON
5. If canary passes: proceed to Phase 2
6. If canary fails: **ROLLBACK IMMEDIATELY**

### Phase 2: Gradual Rollout (T+30min to T+90min)
1. Increase to 25% traffic → monitor 15 minutes
2. Increase to 50% traffic → monitor 15 minutes
3. Increase to 100% traffic → monitor 30 minutes

### Phase 3: Stabilization (T+90min to T+150min)
1. Confirm 60-minute stability window at 100% traffic
2. Verify zero security anomalies
3. Verify measurement quality metrics within expected range
4. Send "Launch Success" communication

## Rollback Triggers

Execute **immediate rollback** if ANY of the following occur:

| Trigger | Threshold | Detection Method |
|---------|-----------|-----------------|
| Error rate spike | > 5% for 5 consecutive minutes | Metrics counter |
| Health probe failure | 2+ consecutive non-200 responses | Health endpoint monitor |
| PHI exposure | Any confirmed incident | Audit log + alerts |
| Session save failures | > 10% failure rate | Session status tracking |
| Security anomaly | Any Sev1 event | Security monitoring |
| Clinical quality | Systematic measurement errors reported | Clinical advisor |

### Rollback Procedure
1. Route 100% traffic to previous stable version
2. Confirm health check returns 200 on stable version
3. Page Release Manager + Security Observer
4. Send "Rollback Executed" communication with initial details
5. Begin incident investigation (see incident-response docs)

## Post-Launch Communications

| Event | Audience | Channel | Template |
|-------|----------|---------|----------|
| Launch started | Engineering + stakeholders | Slack + email | "Pilot deployment in progress" |
| Canary passed | Engineering | Slack | "Canary phase complete, proceeding to rollout" |
| Launch success | All stakeholders | Email | "PhysioLens pilot is live" |
| Rollback executed | All stakeholders | Email + phone | "Deployment rolled back — investigating" |

## Post-Launch Monitoring (48h)

- [ ] Monitor error rates every 4 hours
- [ ] Review audit logs daily
- [ ] Check measurement quality metrics daily
- [ ] Collect initial clinician feedback
- [ ] Schedule post-launch review at T+1 week
