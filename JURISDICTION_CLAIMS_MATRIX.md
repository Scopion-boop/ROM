# Jurisdiction Claims Matrix

> Version: 1.0.0 | Effective: 2026-02-08 | Owner: agent:regulatory
> Status: **LOCKED** — changes require founder + legal review.

---

## Purpose

This matrix defines what the ROM Platform may and may not claim in each target jurisdiction. All external-facing language, marketing materials, product descriptions, and in-app copy MUST comply with the relevant jurisdiction row.

---

## United States (US)

### Regulatory Framework

- FDA: AI/ML Software as Medical Device (SaMD) guidance
- FDA: Clinical Decision Support (CDS) exclusion criteria (21st Century Cures Act § 3060)
- HIPAA: Security Rule (including proposed December 2024 updates)
- FTC: Health claims enforcement

### Allowed Claims

| Claim Category | Allowed Language | Notes |
|---------------|-----------------|-------|
| Product function | "Assists clinicians in documenting range of motion measurements" | Documentation-assist framing only |
| Measurement | "Records ROM values using computer vision" | No diagnostic implication |
| Workflow | "Streamlines clinical documentation" | General productivity claim |
| Accuracy | "Achieves ≤ ±X° mean absolute error on [specific protocol]" | ONLY after validation evidence is locked; must cite protocol |

### Blocked Claims

| Claim Category | Blocked Language | Reason |
|---------------|-----------------|--------|
| Diagnosis | "Diagnoses musculoskeletal conditions" | SaMD classification trigger |
| Treatment | "Recommends treatment plans" | CDS classification trigger |
| Efficacy | "Improves patient outcomes" | Requires clinical trial evidence |
| Equivalence | "Equivalent to goniometer measurement" | Requires 510(k) or De Novo pathway |
| Screening | "Screens for mobility disorders" | Diagnostic framing |

### Data Handling

| Requirement | Policy |
|-------------|--------|
| PHI encryption at rest | AES-256 mandatory |
| PHI encryption in transit | TLS 1.2+ mandatory |
| BAA required | Yes, for all PHI-touching services |
| Breach notification | 60 days (current); may tighten under proposed rule |
| Video retention | Process-then-discard default |
| Audit logging | Required for all PHI access |

---

## European Union (EU)

### Regulatory Framework

- EU AI Act (entered into force 2024-08-01, phased enforcement through 2027)
- MDR 2017/745 (Medical Device Regulation)
- GDPR (General Data Protection Regulation)
- IVDR where applicable

### Allowed Claims

| Claim Category | Allowed Language | Notes |
|---------------|-----------------|-------|
| Product function | "Assists healthcare professionals in documenting ROM" | Must not imply medical device function |
| Measurement | "Records angle measurements using pose estimation" | Technical description only |
| Workflow | "Clinical documentation assistance tool" | Explicit non-medical-device framing |

### Blocked Claims

| Claim Category | Blocked Language | Reason |
|---------------|-----------------|--------|
| Medical device | Any claim implying medical device function | MDR classification trigger |
| AI system risk | Unqualified "AI-powered diagnostics" | AI Act high-risk classification trigger |
| Clinical claims | "Clinically validated" | Requires CE marking pathway |
| Treatment | Any treatment recommendation language | Medical device classification |

### Data Handling

| Requirement | Policy |
|-------------|--------|
| GDPR lawful basis | Legitimate interest or explicit consent |
| Data Processing Agreement | Required with all processors |
| Data residency | EU-hosted infrastructure required |
| Right to erasure | Must support within 30 days |
| DPIA | Required before processing health data |
| Video retention | Process-then-discard; explicit consent for any retention |
| Breach notification | 72 hours to supervisory authority |

### AI Act Considerations

| Requirement | Status |
|-------------|--------|
| Risk classification assessment | Required before launch |
| Transparency obligations | Must disclose AI-assisted measurement |
| Human oversight requirements | Clinician review mandatory |
| Technical documentation | Required per Annex IV |
| Conformity assessment | Required if classified as high-risk |

---

## United Kingdom (UK)

### Regulatory Framework

- UK GDPR + Data Protection Act 2018
- MHRA: Software as Medical Device guidance
- UK AI Regulation (pro-innovation approach, sector-led)
- NHS Digital Technology Assessment Criteria (DTAC)

### Allowed Claims

| Claim Category | Allowed Language | Notes |
|---------------|-----------------|-------|
| Product function | "Assists clinicians in documenting range of motion" | Same documentation-assist posture |
| Measurement | "Computer vision-assisted ROM recording" | Technical framing |
| Workflow | "Clinical workflow documentation tool" | Non-device framing |

### Blocked Claims

| Claim Category | Blocked Language | Reason |
|---------------|-----------------|--------|
| Medical device | Any SaMD-implying language | MHRA classification trigger |
| NHS endorsement | "NHS approved" or "NHS recommended" | Requires formal DTAC completion |
| Clinical claims | "Improves clinical outcomes" | Requires evidence pathway |

### Data Handling

| Requirement | Policy |
|-------------|--------|
| UK GDPR compliance | Required |
| Data residency | UK or adequate jurisdiction |
| DSPT alignment | Required for NHS data |
| Breach notification | 72 hours to ICO |
| Video retention | Process-then-discard default |

---

## Cross-Jurisdiction Defaults

| Policy | Default |
|--------|---------|
| Claim posture | Documentation-assist ONLY |
| Video data | Process-then-discard |
| Encryption standard | AES-256 at rest, TLS 1.2+ in transit |
| Audit trail | Required for all measurement data |
| Consent model | Explicit informed consent for any data beyond immediate session |
| AI transparency | Disclose AI-assisted measurement in all jurisdictions |

---

## Changelog

| Date | Version | Change | Approved By |
|------|---------|--------|-------------|
| 2026-02-08 | 1.0.0 | Initial matrix | Founder |
