# PhysioLens Production Release Plan

## Current State Assessment

| Gate          | Status | Details                                                                                |
| ------------- | ------ | -------------------------------------------------------------------------------------- |
| Build         | PASS   | All 3 packages build (shared-types, api, web)                                          |
| Typecheck     | PASS   | All 4 packages pass tsc --noEmit                                                       |
| Lint          | FAIL   | 2 errors: `unicorn/prefer-top-level-await` rule not installed; 4 warnings: unused vars |
| Tests         | FAIL   | 222 passing, 1 failing (signaling relay test timeout)                                  |
| Docker Build  | PASS   | API, Web, Signaling images build successfully                                          |
| Security Scan | PASS   | No high/critical audit issues                                                          |

### Known Bugs

1. **next.config.js** references `@rom/shared-types` instead of `@physiolens/shared-types` in `transpilePackages`
2. **server.ts** uses `eslint-disable unicorn/prefer-top-level-await` but unicorn plugin isn't installed — ESLint errors
3. **Signaling test** `relays messages between host and remote` times out (race condition in WebSocket test)
4. **auth.ts** has 4 unused variable warnings (`_passwordHash`, `_err`, `_`)

---

## Phase 1: Fix Pipeline Blockers (ALL CI GATES GREEN)

> Goal: `pnpm turbo lint && pnpm turbo test && pnpm turbo build && pnpm turbo typecheck` — all pass

- [ ] 1.1 Remove `eslint-disable unicorn/prefer-top-level-await` comments from `apps/api/src/server.ts` (rule doesn't exist)
- [ ] 1.2 Fix unused variable warnings in `apps/api/src/routes/auth.ts`
- [ ] 1.3 Fix `transpilePackages` in `apps/web/next.config.js` (`@rom/shared-types` → `@physiolens/shared-types`)
- [ ] 1.4 Fix signaling relay test timeout in `services/signaling/__tests__/server.test.js`
- [ ] 1.5 Verify: all 4 gates pass clean (`lint`, `test`, `build`, `typecheck`)

---

## Phase 2: Code Quality & Developer Experience

> Goal: Consistent formatting, fast local feedback, coverage visibility

- [ ] 2.1 Add `.prettierrc` config file at root (codify formatting rules)
- [ ] 2.2 Add `.prettierignore` (dist, .next, node_modules, pnpm-lock.yaml)
- [ ] 2.3 Run `pnpm format` and commit any formatting fixes
- [ ] 2.4 Add Husky pre-commit hooks + lint-staged (lint + format on commit)
- [ ] 2.5 Add Vitest coverage config to api, web, shared-types (`coverage.provider: 'v8'`)
- [ ] 2.6 Add `pnpm test:coverage` script at root
- [ ] 2.7 Fix ESLint config warnings: add `"type": "module"` to api and shared-types package.json or rename configs to `.mjs`
- [ ] 2.8 Verify: pre-commit hook blocks bad code, coverage reports generate

---

## Phase 3: Feature Completeness

> Goal: No stubs, no placeholder pages, complete user flows

- [ ] 3.1 Implement PDF export in `apps/api/src/routes/export.ts` (currently returns metadata-only stub)
- [ ] 3.2 Implement clinic user removal in `apps/api/src/routes/clinic.ts` (currently 204 no-op)
- [ ] 3.3 Add proper 404 page (`apps/web/src/app/not-found.tsx`)
- [ ] 3.4 Add error page (`apps/web/src/app/error.tsx` with error boundary)
- [ ] 3.5 Review and complete patient self-assessment flow (`/patient/[token]`)
- [ ] 3.6 Audit all pages for loading states, empty states, and error states
- [ ] 3.7 Add toast/notification system for user feedback on actions
- [ ] 3.8 Verify: every user flow works end-to-end (register → login → session → capture → note → export)

---

## Phase 4: Security Hardening

> Goal: OWASP Top 10 covered, healthcare-appropriate security posture

- [ ] 4.1 Add password complexity validation (min 8 chars, mixed case, number, special char)
- [ ] 4.2 Add account lockout after N failed login attempts (5 attempts, 15-min lockout)
- [ ] 4.3 Add refresh token rotation (currently JWT-only with 8h expiry)
- [ ] 4.4 Add Content-Security-Policy header to Caddyfile and Next.js middleware
- [ ] 4.5 Move rate limiter from in-memory to persistent store (or document as acceptable for single-instance)
- [ ] 4.6 Add API request size limits (body-parser limit)
- [ ] 4.7 Add session invalidation on password change
- [ ] 4.8 Audit all Zod schemas for completeness (max string lengths, pattern validation)
- [ ] 4.9 Verify: security scan passes, manual OWASP checklist reviewed

---

## Phase 5: Testing Expansion

> Goal: 80%+ coverage, E2E confidence, accessibility verified

- [ ] 5.1 Add coverage thresholds to vitest configs (branches: 70%, functions: 80%, lines: 80%)
- [ ] 5.2 Expand web component tests (dashboard, sessions list, login, register — currently only 1 component test)
- [ ] 5.3 Add Playwright E2E tests for critical flows (auth, session creation, capture, notes)
- [ ] 5.4 Add Playwright config and GitHub Actions integration
- [ ] 5.5 Add axe-core accessibility tests via Playwright
- [ ] 5.6 Add API contract tests (validate response shapes match shared-types)
- [ ] 5.7 Add Lighthouse CI for performance budgets
- [ ] 5.8 Verify: coverage thresholds met, E2E tests pass, no critical a11y violations

---

## Phase 6: Production Infrastructure

> Goal: Reliable, observable, recoverable production deployment

- [ ] 6.1 Complete DNS records: `www` A → 138.197.20.117, `api` A → 138.197.20.117
- [ ] 6.2 Add PostgreSQL backup cron (pg_dump to local + optional S3/Spaces)
- [ ] 6.3 Add Docker log rotation config (json-file driver with max-size/max-file)
- [ ] 6.4 Add health check endpoint aggregator (single `/api/health/deep` checking DB, services)
- [ ] 6.5 Add uptime monitoring (UptimeRobot, Healthchecks.io, or similar free tier)
- [ ] 6.6 Add rollback procedure to DEPLOYMENT.md (tagged images, docker compose rollback steps)
- [ ] 6.7 Add GitHub environment protection rules for production deployment
- [ ] 6.8 Verify: deployment succeeds, health checks green, backups running

---

## Phase 7: Polish & Final Audit

> Goal: Production-quality UX, documentation, and release readiness

- [ ] 7.1 Generate OpenAPI 3.1 spec from Express routes (swagger-jsdoc or manual)
- [ ] 7.2 Responsive design audit (mobile, tablet, desktop breakpoints)
- [ ] 7.3 Accessibility audit (WCAG 2.1 AA compliance check)
- [ ] 7.4 Performance audit (Lighthouse scores: performance > 90, a11y > 90)
- [ ] 7.5 Run full `pnpm format` and commit
- [ ] 7.6 Update README.md with final production status
- [ ] 7.7 Update AI_CONTEXT.md to reflect completed state
- [ ] 7.8 Create git tag `v1.0.0` and update CHANGELOG
- [ ] 7.9 Final verification: merge to main, deploy succeeds, all health checks green

---

## Execution Order & Dependencies

```
Phase 1 (P0 blockers) ──→ Phase 2 (DX) ──→ Phase 3 (Features)
                                │                    │
                                ▼                    ▼
                          Phase 4 (Security) ──→ Phase 5 (Tests)
                                                     │
                                                     ▼
                                            Phase 6 (Infra) ──→ Phase 7 (Polish)
```

**Estimated scope:** ~35 tasks across 7 phases
**Autonomous execution:** Phases 1-5 can be executed nearly fully autonomously. Phases 6-7 may need user input for DNS changes, monitoring service selection, and deployment credentials.
