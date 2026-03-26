# Threat Model V1 — PhysioLens

**Document Status:** Draft
**Last Updated:** 2026-02-08
**Classification:** Internal — Engineering

---

## 1. System Overview

PhysioLens captures, processes, and stores musculoskeletal range-of-motion (ROM) measurements using computer vision. Components:

| Component            | Purpose                       | Trust Level            |
| -------------------- | ----------------------------- | ---------------------- |
| Web App (Next.js)    | Clinician capture UI          | Semi-trusted (browser) |
| API Core (Express)   | Auth, sessions, notes, export | Trusted                |
| CV Worker (FastAPI)  | ROM angle computation         | Trusted                |
| NLP Worker (FastAPI) | Note generation               | Trusted                |
| Database (future)    | Persistent storage            | Trusted                |

---

## 2. Trust Boundaries

1. **Internet ↔ Web App**: Public-facing, unauthenticated until login
2. **Web App ↔ API Core**: Bearer token auth, HTTPS required
3. **API Core ↔ CV Worker**: Internal network, service-to-service auth (Phase B)
4. **API Core ↔ Database**: Encrypted at rest, encrypted in transit

---

## 3. Data Classification

| Data Type        | Classification | Handling                                            |
| ---------------- | -------------- | --------------------------------------------------- |
| Video frames     | PHI            | Process in-memory, never stored raw                 |
| ROM measurements | PHI            | Encrypted at rest, audit-logged                     |
| Clinical notes   | PHI            | Encrypted at rest, versioned, immutable audit trail |
| User credentials | Sensitive      | Bcrypt-hashed (cost 12), never logged               |
| JWT tokens       | Sensitive      | 8h expiry, signed with HS256                        |
| Audit events     | Internal       | Append-only, tamper-evident                         |

---

## 4. STRIDE Analysis

### Spoofing

- **Threat:** Attacker impersonates clinician using stolen JWT
- **Mitigation:** Short token expiry (8h), organization-scoped tokens, refresh token rotation (Phase B)

### Tampering

- **Threat:** Modified measurement values or clinical notes
- **Mitigation:** Immutable audit trail, note versioning with status transitions only forward

### Repudiation

- **Threat:** Clinician denies generating or editing a note
- **Mitigation:** All actions logged in audit trail with userId, timestamp, correlation ID

### Information Disclosure

- **Threat:** PHI leaked through logs, error messages, or caching
- **Mitigation:** PHI-safe structured logging, no-store cache headers, scrubbed error responses

### Denial of Service

- **Threat:** Rate-limit exhaustion or resource starvation
- **Mitigation:** Per-IP rate limiting, request size limits (1MB), Helmet security headers

### Elevation of Privilege

- **Threat:** Support role accessing clinician functions
- **Mitigation:** RBAC middleware (requireRole), organization-scoped data access

---

## 5. Attack Surfaces

| Surface                | Vectors                             | Current Controls                    |
| ---------------------- | ----------------------------------- | ----------------------------------- |
| Auth endpoints         | Brute force, credential stuffing    | Rate limiting, bcrypt cost 12       |
| Session API            | IDOR, unauthorized access           | Org-scoped queries, auth middleware |
| Export endpoints       | Data exfiltration                   | Auth required, audit logging        |
| File uploads (Phase B) | Malicious files, oversized payloads | 1MB limit, content-type validation  |

---

## 6. Open Risks

| Risk                                 | Severity | Status           | Planned Mitigation                         |
| ------------------------------------ | -------- | ---------------- | ------------------------------------------ |
| No HTTPS enforcement                 | High     | Open             | TLS termination at load balancer (Phase B) |
| In-memory data stores                | High     | Accepted (pilot) | PostgreSQL migration (Phase B)             |
| Single signing key                   | Medium   | Open             | Key rotation mechanism (Phase C)           |
| No CSRF protection                   | Medium   | Open             | SameSite cookies + CSRF tokens (Phase B)   |
| No input sanitization beyond Express | Low      | Open             | Zod request validation (Phase B)           |

---

## 7. Review Schedule

- **Phase A:** This document reviewed by security lead
- **Phase B:** Pen test against deployed preview environment
- **Phase C:** Annual threat model refresh + HIPAA gap assessment
