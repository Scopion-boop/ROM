# Pilot Contract Requirements

> **NOTICE:** This document outlines required contractual elements for the ROM Platform pilot program. All items require legal counsel review before execution.

**Last Updated:** 2026-02-08  
**Status:** Draft — Awaiting Counsel Review

---

## 1. Pilot Scope

| Element | Requirement |
|---------|-------------|
| Duration | `[TBD — suggested 90 days]` |
| Participating sites | `[TBD — number and names]` |
| Maximum users per site | `[TBD]` |
| Supported joints | Shoulder, Elbow, Wrist, Hip, Knee, Ankle (+ bilateral) |
| Volume cap | `[TBD — sessions per month]` |

## 2. Required Agreements

### 2.1 Master Services Agreement (MSA)
- [ ] Service description referencing current feature set
- [ ] Pilot-specific term and termination provisions
- [ ] Limitation of liability appropriate for pilot stage
- [ ] See TERMS_OF_SERVICE_TEMPLATE.md for clause templates

### 2.2 Business Associate Agreement (BAA)
- [ ] HIPAA-compliant BAA executed before any PHI processing
- [ ] Subprocessor list included as exhibit
- [ ] Breach notification procedures (72-hour timeline)
- [ ] See BAA_DPA_CHECKLIST.md for required elements

### 2.3 Data Processing Agreement (DPA)
- [ ] Required if processing data of EU/UK residents
- [ ] Standard Contractual Clauses (SCCs) as applicable
- [ ] See BAA_DPA_CHECKLIST.md

### 2.4 Medical Disclaimer Acknowledgment
- [ ] Signed acknowledgment from clinic medical director
- [ ] Confirms understanding that Service is not a medical device
- [ ] See MEDICAL_DISCLAIMER_TEMPLATE.md

## 3. Data Handling Requirements

| Requirement | Status |
|-------------|--------|
| Data encrypted in transit (TLS 1.2+) | Implemented |
| Data encrypted at rest | Phase B — `[TBD provider]` |
| Video frames not persisted | Implemented (in-memory only) |
| Audit trail for all data access | Implemented |
| Data export on termination | Implemented (JSON/text) |
| Data deletion on termination | `[TBD — process documented]` |

## 4. Insurance Requirements

- [ ] Professional liability / E&O insurance: `[TBD — $X minimum]`
- [ ] Cyber liability insurance: `[TBD — $X minimum]`
- [ ] General commercial liability: `[TBD — $X minimum]`

## 5. Pilot Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| System uptime | ≥ 99% during business hours | Health endpoint monitoring |
| Measurement completion rate | ≥ 90% of attempted sessions | Session status tracking |
| Clinician satisfaction | ≥ 4.0 / 5.0 | Post-pilot survey |
| Note generation accuracy | ≥ 95% require no major edits | Note amendment tracking |
| Security incidents | 0 PHI breaches | Audit log review |

## 6. Exit Provisions

- Data export window: `[TBD — 30 days post-termination]`
- Data format: JSON and plain text (PDF in Phase B)
- Data deletion confirmation: Written certification provided
- Transition support: `[TBD — hours of support included]`

## 7. Regulatory Representations

- [ ] Provider represents that the Service complies with applicable data protection laws
- [ ] Provider represents no pending regulatory actions
- [ ] Customer represents it maintains all required clinical licenses
- [ ] Both parties acknowledge the Service is not cleared/approved as a medical device

---

**Sign-off Matrix:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Legal Counsel | `[TBD]` | | |
| Compliance Officer | `[TBD]` | | |
| Clinical Advisor | `[TBD]` | | |
| Engineering Lead | `[TBD]` | | |
| Founder / CEO | `[TBD]` | | |
