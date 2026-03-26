# Security Baseline Checklist

## Identity and access

- [ ] MFA enforced for privileged users
- [ ] RBAC implemented and tested
- [ ] Session/token policies documented

## Data protection

- [ ] TLS everywhere
- [ ] Encryption at rest enabled
- [ ] Key rotation policy active
- [ ] PHI minimization enforced

## Application security

- [ ] Input validation on all write paths
- [ ] Authz checks on all sensitive routes
- [ ] Rate limiting on public APIs
- [ ] Secure headers configured

## Operational security

- [ ] Centralized logging with redaction
- [ ] Alerting configured for abuse patterns
- [ ] Backup and restore tested
- [ ] Incident response playbook tested

## Assurance

- [ ] Dependency scans in CI
- [ ] SAST/DAST baseline active
- [ ] Pre-launch penetration test completed
