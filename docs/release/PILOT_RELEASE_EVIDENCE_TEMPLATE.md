# Pilot Release Evidence Template

> Complete this document for each pilot release. All sections must be filled before sign-off.

**Release Version:** `[version]`  
**Release Date:** `[date]`  
**Release Manager:** `[name]`

---

## 1. Build and Artifact Info

| Field | Value |
|-------|-------|
| Commit SHA | `[git rev-parse HEAD]` |
| Branch | `[branch name]` |
| Build ID / CI Run | `[CI run URL]` |
| Release Tag | `[git tag]` |
| Package Versions | API: `[ver]`, Web: `[ver]`, CV: `[ver]`, NLP: `[ver]` |

## 2. Verification Evidence

### Test Results
| Suite | Total | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| shared-types (Vitest) | | | | |
| api (Vitest) | | | | |
| web (Vitest) | | | | |
| cv (pytest) | | | | |
| nlp (pytest) | | | | |

**Commands executed:**
```
pnpm -r test
pytest services/cv/tests/ -v
pytest services/nlp/tests/ -v
```

### Lint Results
- [ ] `pnpm -r lint` — PASS / FAIL
- [ ] Warnings: `[count]`

### Build Results
- [ ] `pnpm -r build` — PASS / FAIL

### Security Scan Results
- [ ] `pnpm audit --audit-level=high` — PASS / FAIL (advisory count: `[n]`)
- [ ] Static pattern check (eval/innerHTML) — PASS / FAIL
- [ ] THREAT_MODEL_V1.md reviewed — YES / NO

### Performance Baseline
| Metric | Value |
|--------|-------|
| API health response time (p50) | `[ms]` |
| API health response time (p99) | `[ms]` |
| Measurement processing time (p50) | `[ms]` |

### Rollback Validation
- [ ] Rollback procedure tested against staging — YES / NO
- [ ] Rollback execution time: `[minutes]`
- [ ] Post-rollback health check: PASS / FAIL

## 3. Deployment Timeline

| Milestone | Planned Time | Actual Time | Status |
|-----------|-------------|-------------|--------|
| Go/no-go decision | | | |
| Canary deploy (10%) | | | |
| 25% rollout | | | |
| 50% rollout | | | |
| 100% rollout | | | |
| Stability window start | | | |
| Stability window end | | | |
| Release confirmed | | | |

## 4. SLO Compliance During Release

| SLO | Target | Actual | Status |
|-----|--------|--------|--------|
| Availability | ≥ 99% | | |
| API latency (p95) | < 500ms | | |
| Error rate | < 1% | | |
| Measurement success | ≥ 90% | | |

## 5. Incidents During Release

| Incident | Severity | Resolution | Duration |
|----------|----------|------------|----------|
| `[none or details]` | | | |

## 6. Sign-offs

| Role | Name | Approved | Date | Notes |
|------|------|----------|------|-------|
| Release Manager | | ☐ | | |
| QA Lead | | ☐ | | |
| Security Reviewer | | ☐ | | |
| Clinical Advisor | | ☐ | | |
| Product Owner | | ☐ | | |
| Compliance Officer | | ☐ | | |

---

**Evidence archived:** `[link to CI artifacts / storage location]`
