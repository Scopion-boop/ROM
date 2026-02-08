# Go-Live Runbook

## Purpose
Standardize production launch steps and rollback triggers.

## Roles
- Release manager
- On-call engineer
- QA lead
- Security/compliance observer

## Go-live sequence
1. Confirm go/no-go checklist complete
2. Deploy release candidate to production canary
3. Validate critical workflows
4. Increase traffic gradually
5. Monitor dashboards continuously
6. Confirm stable release or execute rollback

## Rollback triggers
- Sustained high error rate
- Session save failures above threshold
- Security anomaly detected
- Severe data quality regression

## Communications
- Launch started message
- Mid-rollout status update
- Launch success or rollback notice
