# Service and Support Model

## Support tiers
- Tier 1: account/workflow support, within business hours
- Tier 2: technical triage and integration support
- Tier 3: engineering escalation for incidents and defects

## SLA draft (pilot)
- Sev1 (outage/data risk): acknowledge in 30 minutes
- Sev2 (major degradation): acknowledge in 2 hours
- Sev3 (minor issue): acknowledge in 1 business day

## Operating rituals
- Weekly reliability review
- Weekly bug triage with severity tagging
- Monthly security review
- Quarterly policy/compliance review

## Observability Stack

### Health & Readiness
- `GET /api/health` — liveness probe (status, version, timestamp)
- `GET /api/health/ready` — readiness check (Phase B+: DB, queue health)
- `GET /api/health/metrics` — counter-based metrics + uptime

### Structured Logging
- JSON format, one object per line
- Fields: `level`, `message`, `timestamp`, `service`, `correlationId`
- PHI-safe policy: only metadata logged, never patient data or note content
- Correlation ID propagated via `x-correlation-id` header

### Metrics (Pilot)
- In-process counters (requests, errors, exports)
- Phase B target: Prometheus client or Datadog StatsD

### Alerting (Phase B)
- Sev1: PagerDuty for health check failures, error rate > 5%
- Sev2: Slack notification for elevated latency (p99 > 2s)
- Sev3: Daily digest for warning-level events

## Knowledge base
- Clinician onboarding guide
- Camera setup troubleshooting guide
- Measurement quality troubleshooting guide
- Export and note workflow guide
