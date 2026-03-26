# 07 - Development and Agent Orchestration Model

## Team lead operating model

You act as Product/Clinical Owner. I run as AI Team Lead/Architect. Execution is split into specialized agent streams with strict interfaces.

## Agent streams (parallel-capable)

1. `frontend-agent`

- Owns clinician/patient UI, capture workflows, and note editor UX

2. `backend-agent`

- Owns API domain, auth/RBAC, session and note storage, exports

3. `cv-agent`

- Owns pose pipeline, angle computation, quality scoring, algorithm versioning

4. `security-compliance-agent`

- Owns threat model, controls, audit, policy enforcement

5. `qa-validation-agent`

- Owns automated tests, test data strategy, and release quality gates

6. `devops-sre-agent`

- Owns infrastructure, CI/CD, observability, runbooks

## Coordination protocol

- Daily async standup in one planning hub (recommended: GitHub Projects + Issues)
- Every story must define:
  - owner agent
  - acceptance criteria
  - dependencies
  - verification command/check
- PRs require two-stage review:
  1. Spec compliance review
  2. Code quality/security review

## Parallelization rules

Parallel allowed when tasks do not modify same files or shared contracts.

Safe parallel lanes:

- Frontend UI scaffolding + backend auth service + infra bootstrap
- CV experimentation + legal doc drafting + QA test harness setup

Not parallel:

- API contract changes and frontend integration that depends on those contracts
- Shared schema migrations without coordination window

## Branch and merge strategy

- trunk-based with short-lived feature branches
- naming: `feat/<domain>-<ticket>`
- merge policy: required checks + CODEOWNERS gates

## Tooling hub recommendations

- Source control + planning hub: GitHub (Issues, Projects, Discussions)
- Design/collab: Figma + Notion/Confluence
- Incident and logs: Sentry + Cloud monitoring
- Product analytics: PostHog/Amplitude

## How to use Claude Code + Copilot + Codex effectively

- Claude Code: architecture, task decomposition, cross-cutting decisions
- Copilot: in-editor code acceleration for scoped implementation tasks
- Codex/C()D3X-style agents: targeted generation for isolated modules, tests, or scripts
- Enforce all generated code through CI checks and human review gates

## Definition of ready for implementation task

- scope and acceptance criteria clear
- security and compliance impact noted
- data contract defined (if applicable)
- test strategy included

## Definition of done for implementation task

- code merged
- tests passing
- docs updated
- observability hooks added where relevant
