# Privacy Policy Template (Draft)

> **NOTICE:** This template is for informational purposes only and does not constitute legal advice. All sections marked `[TBD]` require review and completion by qualified legal counsel before publication.

**Effective Date:** `[TBD — counsel to set]`
**Last Reviewed:** `[TBD]`

---

## 1. Who We Are

`[TBD — Company legal name]` ("we", "us", "our") operates the PhysioLens, a musculoskeletal range-of-motion measurement and clinical documentation tool.

**Contact:** `[TBD — privacy@company.com, DPO name if applicable]`

## 2. What Data We Collect

| Data Category | Examples | Retention |
|--------------|----------|-----------|
| Account data | Email, name, role, organization | Duration of account |
| Session data | Joint selections, timestamps, clinician ID | `[TBD — counsel to define]` |
| Measurement data | ROM angles, confidence scores, quality flags | `[TBD]` |
| Clinical notes | Generated and edited note content | `[TBD]` |
| Video frames | Camera captures during measurement | Processed in-memory only; **never stored** |
| Audit logs | Action type, user ID, timestamp | `[TBD — minimum 7 years suggested for HIPAA]` |
| Technical logs | IP address, browser type, correlation IDs | 90 days |

## 3. Legal Basis for Processing

- **Performance of contract:** Providing measurement and documentation services
- **Legitimate interest:** Service security, fraud prevention, platform improvement
- **Legal obligation:** HIPAA compliance, audit trail maintenance
- **Consent:** `[TBD — where consent-based processing applies]`

## 4. How Data Is Used in ROM Workflows

- Computer vision processing of video frames to compute joint angles
- Automated note generation from measurement results
- Clinical documentation storage and export
- Quality assurance and measurement confidence scoring

**PHI Handling:** Video frames are processed in real-time memory and are never written to persistent storage. Only computed measurement values are retained.

## 5. Data Sharing and Subprocessors

| Subprocessor | Purpose | Location |
|-------------|---------|----------|
| `[TBD — cloud provider]` | Infrastructure hosting | `[TBD — region]` |
| `[TBD — if applicable]` | `[Purpose]` | `[Location]` |

We do not sell personal data. We do not share PHI for marketing purposes.

## 6. Data Retention and Deletion

- Retention periods per data category defined in Section 2
- Deletion requests honored within `[TBD — 30 days suggested]`
- Audit logs retained per regulatory minimums regardless of deletion requests
- See DATA_RETENTION_POLICY.md for technical implementation

## 7. Security Safeguards

- Encryption in transit (TLS 1.2+) and at rest (AES-256)
- Role-based access control (RBAC) with organization isolation
- Immutable append-only audit trail
- Rate limiting, security headers, and PHI-safe logging
- Annual security reviews and penetration testing (Phase B+)

## 8. International Transfers

`[TBD — counsel to assess whether SCCs, adequacy decisions, or other mechanisms are needed]`

## 9. User Rights

Depending on applicable jurisdiction:
- Right to access, rectify, delete personal data
- Right to data portability (JSON/text export available)
- Right to withdraw consent
- Right to lodge complaint with supervisory authority

**Requests:** `[TBD — privacy@company.com]`

## 10. Policy Updates

- Material changes communicated `[TBD — 30 days]` in advance
- Version history maintained in this repository

---

**Review Checklist:**
- [ ] Legal counsel has reviewed all `[TBD]` fields
- [ ] Applicable jurisdiction(s) confirmed
- [ ] Subprocessor list finalized
- [ ] Retention periods approved by compliance officer
- [ ] Sign-off: `________________________` Date: `________`
