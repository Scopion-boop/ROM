# Release Checklist

## Pre-release
- [ ] Scope freeze approved
- [ ] All critical tests pass
- [ ] Security scans clear (no unresolved high severity)
- [ ] Database migration plan validated
- [ ] Rollback plan documented
- [ ] Runbooks updated
- [ ] Legal/compliance docs current

## Deployment
- [ ] Deploy to staging
- [ ] Complete smoke tests
- [ ] Deploy canary to production
- [ ] Monitor error rate, latency, and capture success metrics

## Post-release
- [ ] Confirm stability window (60 minutes minimum)
- [ ] Announce release notes
- [ ] Track incidents/feedback in release channel
- [ ] Archive release evidence and approvals
