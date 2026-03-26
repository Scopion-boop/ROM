# Data Retention Policy

> Version: 1.0.0 | Effective: 2026-02-08 | Owner: agent:security
> Status: **LOCKED** — changes require founder + legal approval.

---

## 1. Purpose

This policy defines data retention, processing, and disposal rules for all data handled by the ROM Platform. It applies across all environments (dev, staging, production) and all jurisdictions (US, EU, UK).

---

## 2. Core Principle

> **Process-then-discard** is the default for all raw video and image data.
> No raw video frames are persisted unless an explicit, documented policy override is approved by the founder and recorded in this document's changelog.

---

## 3. Data Classification

| Data Type                  | Classification                 | Retention Default                        | Override Allowed?                   |
| -------------------------- | ------------------------------ | ---------------------------------------- | ----------------------------------- |
| Raw video frames           | Sensitive / PHI-adjacent       | **Process-then-discard** (immediate)     | Yes — founder approval + DPA update |
| Extracted pose landmarks   | De-identified measurement data | Session duration + 30 days               | Yes — with consent                  |
| ROM measurement values     | Clinical documentation data    | Per clinician's EHR policy or 7 years    | N/A — follows EHR retention         |
| Session metadata           | Operational data               | 90 days                                  | Yes                                 |
| Clinical notes (generated) | PHI                            | Per EHR retention policy                 | N/A                                 |
| Application logs           | Operational (no PII)           | 90 days rolling                          | Yes                                 |
| Audit trail                | Compliance                     | 7 years minimum                          | No — regulatory floor               |
| Error/crash reports        | Operational (no PII)           | 30 days                                  | Yes                                 |
| User account data          | PII                            | Account lifetime + 30 days post-deletion | No                                  |
| Consent records            | Compliance                     | 7 years minimum                          | No — regulatory floor               |

---

## 4. Processing Rules

### 4.1 Video Processing Pipeline

```
Camera Input → Frame Buffer (memory only)
  → Pose Estimation Model (in-memory inference)
    → Landmark Coordinates extracted
      → ROM angles calculated
        → Measurement record persisted
  → Raw frame discarded from memory
```

- Raw frames NEVER touch persistent storage in default mode.
- Frame buffer is memory-only with a maximum 30-second sliding window.
- On session end, all frame buffers are flushed.

### 4.2 Encryption Requirements

| State      | Standard             | Notes                                |
| ---------- | -------------------- | ------------------------------------ |
| At rest    | AES-256              | All persistent data stores           |
| In transit | TLS 1.2+             | All network communication            |
| In memory  | OS-level protections | Sensitive data cleared on scope exit |
| Backups    | AES-256              | Same standard as primary storage     |

---

## 5. Jurisdiction-Specific Rules

### 5.1 United States

- HIPAA retention: minimum 6 years for covered entity records
- Audit logs: minimum 6 years
- BAA-covered data follows BAA terms

### 5.2 European Union

- GDPR: data not retained beyond purpose fulfillment
- Right to erasure: supported within 30 days of request
- DPIA compliance: retention periods documented and justified
- Cross-border: data stays within EU unless adequacy decision applies

### 5.3 United Kingdom

- UK GDPR: same principles as EU GDPR
- ICO guidance: retention schedule published internally
- NHS DSPT: retention matches NHS standards where applicable

---

## 6. Disposal Procedures

| Data Type        | Disposal Method                                | Verification                     |
| ---------------- | ---------------------------------------------- | -------------------------------- |
| Raw video        | Memory flush (no persistence)                  | Automated — no recovery possible |
| Database records | Cryptographic erasure or row deletion          | Logged in audit trail            |
| File storage     | Secure delete with overwrite                   | Logged in audit trail            |
| Backups          | Encrypted backup expiry per retention schedule | Automated lifecycle policy       |
| Logs             | Rolling window auto-purge                      | CloudWatch/S3 lifecycle rules    |

---

## 7. Policy Override Process

To override the default process-then-discard policy for any data type:

1. **Request**: Written request with justification, submitted as a GitHub issue with `risk:r1` label
2. **Review**: Founder + legal review required
3. **Approval**: Explicit written approval recorded in this document's changelog
4. **Implementation**: Technical controls updated with audit logging
5. **Consent**: If the override affects user data, consent mechanisms must be updated before deployment
6. **Monitoring**: Override is time-bound (default: 90-day review cycle)

---

## 8. Audit and Compliance

- Quarterly internal review of retention compliance
- Annual external review aligned with SOC 2 / HIPAA audit cycles
- Any retention policy violation is a `risk:r1` escalation

---

## 9. Changelog

| Date       | Version | Change                                               | Approved By |
| ---------- | ------- | ---------------------------------------------------- | ----------- |
| 2026-02-08 | 1.0.0   | Initial locked policy — process-then-discard default | Founder     |
