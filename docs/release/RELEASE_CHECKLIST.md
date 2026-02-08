# Release Checklist

## Pre-release Gates

### Engineering
- [ ] All unit tests pass (`pnpm -r test` — 0 failures)
- [ ] All lint checks pass (`pnpm -r lint` — 0 warnings treated as errors)
- [ ] TypeScript build succeeds (`pnpm -r build` — 0 errors)
- [ ] Python test suites pass (`pytest services/cv/tests/ services/nlp/tests/`)
- [ ] No TODO/FIXME items in critical paths
- [ ] API contract matches shared-types schemas

### Security
- [ ] Dependency audit clean (`pnpm audit --audit-level=high`)
- [ ] No `eval()` or `innerHTML` patterns in source
- [ ] THREAT_MODEL_V1.md reviewed and signed off
- [ ] Rate limiting configured and tested
- [ ] Security headers verified (Cache-Control, X-Frame-Options, Permissions-Policy)
- [ ] SECURITY_BASELINE_CHECKLIST.md completed

### Compliance
- [ ] Privacy Policy reviewed by counsel
- [ ] Terms of Service reviewed by counsel
- [ ] Medical Disclaimer reviewed by counsel
- [ ] BAA/DPA executed with pilot site(s)
- [ ] PILOT_CONTRACT_REQUIREMENTS.md signed off

### Operations
- [ ] Health endpoint responding (`GET /api/health`)
- [ ] Readiness probe passing (`GET /api/health/ready`)
- [ ] Metrics endpoint functional (`GET /api/health/metrics`)
- [ ] Structured logging verified (JSON format, correlation IDs)
- [ ] SERVICE_SUPPORT_MODEL.md reviewed

## Deployment

### SLO Targets (Pilot)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | ≥ 99% (business hours) | Health probe uptime |
| API latency (p95) | < 500ms | Request logger timestamps |
| Error rate | < 1% | Error counter / total requests |
| Measurement success | ≥ 90% | Session completion rate |

### Deploy Sequence
- [ ] Deploy to staging environment
- [ ] Execute smoke test suite against staging
- [ ] Deploy canary to production (10% traffic)
- [ ] Monitor error rate, latency, and capture success for 30 minutes
- [ ] Gradual rollout: 25% → 50% → 100%
- [ ] Confirm stability window (60 minutes minimum at 100%)

### Rollback Criteria
If ANY of the following occur, execute immediate rollback:
- Error rate exceeds 5% for 5+ consecutive minutes
- Health endpoint returns non-200 for 2+ consecutive checks
- Any PHI data exposure detected
- Session save failure rate exceeds 10%
- Severity 1 security incident

## Post-release
- [ ] Confirm stability window completed
- [ ] Publish release notes to stakeholders
- [ ] Monitor incident channel for 24 hours
- [ ] Archive release evidence (PILOT_RELEASE_EVIDENCE_TEMPLATE.md)
- [ ] Schedule post-release review within 1 week
