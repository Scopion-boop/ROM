# 05 - Security, Privacy, and Compliance Baseline

## Security posture goals

- Protect PHI and exam artifacts end-to-end.
- Enforce least privilege and role-based access.
- Maintain auditable trails for sensitive actions.

## Baseline controls (must-have before pilot)

- SSO or strong MFA for clinician/admin access
- Short-lived tokens + secure cookie strategy
- Encrypted transport (TLS 1.2+) and encryption at rest
- KMS-managed keys with rotation policy
- Organization-level RBAC and scoped API authorization
- Centralized audit logging for create/read/update/export actions
- WAF + rate limiting + abuse protection on public endpoints
- Secret management via vault/cloud secrets manager

## Privacy-by-design decisions

- Minimize PHI fields collected.
- Prefer edge processing for raw video where feasible.
- Store structured keypoints/measurements by default; raw video optional and policy-controlled.
- Data retention rules configurable by organization policy.

## Compliance tracks

- HIPAA-aligned controls from V1
- SOC 2 Type I readiness during pilot
- GDPR/CCPA readiness if jurisdiction requires

## Security verification gates

- Threat model completed and reviewed
- SAST/DAST and dependency scanning in CI
- Pen test before production launch
- Backup/restore drills executed
- Incident response playbook tested with tabletop exercise

## Logging and monitoring

- Structured logs with PHI-safe redaction
- Metrics: auth failures, API anomalies, inference errors
- Alerting on unusual access patterns and data export spikes

## Access model (minimum roles)

- `clinic_admin`
- `clinician`
- `reviewer`
- `support_readonly`

## Residual risk register (initial)

- Misuse of patient self-assessment without clinician oversight
- Model confidence misunderstood as diagnostic certainty
- Device/environment quality causing inaccurate captures
