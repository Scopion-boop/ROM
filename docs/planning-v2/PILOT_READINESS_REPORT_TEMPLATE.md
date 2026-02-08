# Pilot Readiness Report Template

## Summary

| Field                | Value            |
|----------------------|------------------|
| Release candidate    | `[commit SHA]`   |
| Build date           | `[YYYY-MM-DD]`   |
| Branch               | `feat/platform-monorepo-scaffold` |
| Environments verified| Local dev, CI    |
| Overall status       | **GO / NO-GO**   |

## Test Results

| Suite            | Framework | Tests | Status |
|------------------|-----------|-------|--------|
| shared-types     | Vitest    | 13    | ✅ / ❌ |
| api              | Vitest    | 53    | ✅ / ❌ |
| web              | Vitest    | 9     | ✅ / ❌ |
| cv (Python)      | pytest    | 7     | ✅ / ❌ |
| nlp (Python)     | pytest    | 1     | ✅ / ❌ |
| **Total**        |           | **83**| ✅ / ❌ |

## Lint & Static Analysis

| Package       | Tool               | Status |
|---------------|--------------------|--------|
| shared-types  | ESLint (typescript-eslint) | ✅ / ❌ |
| api           | ESLint (typescript-eslint) | ✅ / ❌ |
| web           | next lint (eslint-config-next) | ✅ / ❌ |
| CI security-scan | grep banned patterns | ✅ / ❌ |

## Evidence Checklist

- [ ] All tests pass (`pnpm -r test`, `pytest` in cv & nlp)
- [ ] All lint passes (`pnpm -r lint`)
- [ ] Security headers verified (Cache-Control, X-Frame-Options, Helmet)
- [ ] Rate limiting verified (429 after threshold)
- [ ] Auth & RBAC verified (JWT, role constraints)
- [ ] Health / readiness / metrics endpoints operational
- [ ] Structured logging active (no PHI in logs)
- [ ] Legal templates reviewed by counsel: Privacy Policy, ToS, Medical Disclaimer
- [ ] BAA/DPA checklist verified
- [ ] Release checklist completed
- [ ] Go-live runbook reviewed by ops team

## Security

- [ ] THREAT_MODEL_V1 reviewed
- [ ] No `eval()` / `innerHTML` usage in codebase
- [ ] Helmet enabled with strict defaults
- [ ] CORS configured to allowlist only
- [ ] JWT secret is environment-injected (not hardcoded)

## Key Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | [describe] | High/Med/Low | [describe] |
| 2 | [describe] | High/Med/Low | [describe] |
| 3 | [describe] | High/Med/Low | [describe] |

## Sign-Off

| Role               | Name | Date | Decision    |
|--------------------|------|------|-------------|
| Engineering Lead   |      |      | GO / NO-GO  |
| Security Lead      |      |      | GO / NO-GO  |
| Clinical Oversight |      |      | GO / NO-GO  |
| Product Owner      |      |      | GO / NO-GO  |

---

*Template version: 1.0 — Update as new verification gates are added.*## Mitigations
- Mitigation 1:
- Mitigation 2:
- Mitigation 3:

## Final approvals
- Engineering lead:
- Security/compliance lead:
- Product/clinical owner:
