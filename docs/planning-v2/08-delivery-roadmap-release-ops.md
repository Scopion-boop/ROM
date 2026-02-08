# 08 - Delivery Roadmap, Release, and Operations

## Phase roadmap

## Phase 0 (Weeks 1-2): Foundations
- Lock product scope and claims language
- Define data model and contracts
- Set up monorepo, CI, lint/test standards
- Set up baseline security controls and environments

## Phase 1 (Weeks 3-6): V1 Core Build
- Camera workflow + pose capture + angle engine (core joints)
- Session persistence and note generation
- Clinician review/export workflow
- Internal alpha testing

## Phase 2 (Weeks 7-9): Hardening
- Quality/performance optimization
- Security and privacy verification
- Audit logging and role controls complete
- Pilot onboarding kit (training + SOP)

## Phase 3 (Weeks 10-12): Pilot Launch
- Controlled pilot at 1-3 clinics
- Capture feedback and measurement variance metrics
- Iterate on UX and reliability

## Phase 4 (Post-pilot): V1.1 Build
- AI summary and patient guided mode
- Clinician approval queue
- Expanded movement templates

## Release strategy
- Environments: `dev` -> `staging` -> `prod`
- Progressive release with feature flags
- Canary rollout for risky CV/model changes
- Rollback plans prepared and tested per release

## Release gates
1. Functional gate: all critical user journeys pass
2. Security gate: scans pass, no unresolved high-severity issues
3. Compliance gate: required policy/docs current
4. Performance gate: target latency/FPS maintained in test profile
5. Operations gate: runbook and on-call readiness complete

## SRE/operations baseline
- SLOs (initial):
  - API availability >= 99.5%
  - session save success >= 99.9%
  - P95 API latency <= 400ms
- Error budget policies and incident severity matrix
- Weekly reliability review during pilot

## Support model
- Tier 1: product support and workflow issues
- Tier 2: technical and integration issues
- Tier 3: engineering incident response

## Incident response
- Severity definitions and escalation tree
- Time-bound communication cadence for incident updates
- Post-incident blameless review required for Sev1/Sev2
