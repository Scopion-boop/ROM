# Agent Execution Policy

> Version: 1.0.0 | Effective: 2026-02-08 | Owner: Orchestrator
> Status: **LOCKED** — changes require explicit founder approval.

---

## 1. Purpose

This document defines hard guardrails, execution constraints, and "done" criteria for all AI agents operating on the ROM Platform project. Every agent MUST read this document before executing any assigned outcome.

---

## 2. Claim Posture: Documentation-Assist ONLY

### 2.1 Mandatory Constraints

| Allowed                                                        | Blocked                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| "This tool assists clinicians in documenting ROM measurements" | "This tool diagnoses musculoskeletal conditions"                       |
| "Measurement recorded: shoulder flexion 142°"                  | "Patient has limited mobility indicating rotator cuff pathology"       |
| "Assists with clinical documentation workflow"                 | "Provides clinical decision support for treatment selection"           |
| Referencing published accuracy metrics with citations          | Claiming regulatory clearance or clinical equivalence without evidence |

### 2.2 Hard Rules

1. **No diagnostic claims.** No agent may generate, imply, or publish any statement that positions the product as a diagnostic tool.
2. **No efficacy claims.** No agent may claim the product treats, cures, or manages any medical condition.
3. **No regulated launch claims** without an explicit, versioned policy change approved by the founder and recorded in this document's changelog.
4. **No CDS (Clinical Decision Support) framing** unless reclassification is explicitly approved and documented.
5. **All external-facing language** must be reviewed against the jurisdiction-specific claims matrix (`JURISDICTION_CLAIMS_MATRIX.md`) before publication.

---

## 3. Definition of "Done"

An issue/outcome is **only** considered done when ALL of the following are satisfied:

### 3.1 Evidence Bundle Required

Every closed issue MUST include an `EvidenceBundle` containing:

```yaml
EvidenceBundle:
  outcome_id: <issue number>
  artifacts:
    - type: <code|document|data|config|test_result>
      path_or_url: <link to artifact>
  validation_metrics:
    - metric: <name>
      value: <measured value>
      threshold: <required threshold>
      pass: <true|false>
  source_citations:
    - claim: <what is being claimed>
      source_url: <link to source>
      source_date: <ISO date>
      jurisdiction: <US|EU|UK|ALL>
      verification_status: <verified|pending|disputed>
  confidence: <high|medium|low>
  timestamp: <ISO timestamp>
```

### 3.2 Closure Checklist

- [ ] Evidence bundle posted as issue comment
- [ ] All acceptance criteria from the `OutcomeCard` verified
- [ ] No unresolved blockers
- [ ] Risk class acknowledged (r1/r2/r3 require manual review)
- [ ] Citations provided for any factual or regulatory claims
- [ ] Completion prompt executed and logged

### 3.3 Rejection Conditions

An issue will be **reopened** if:

- Evidence bundle is missing or incomplete
- Citations are missing for regulatory, market, or accuracy claims
- Acceptance criteria are not demonstrably met
- Risk-class gate was bypassed (r1/r2/r3 without human approval)

---

## 4. Agent Operating Rules

### 4.1 Assignment Protocol

1. Agents receive work ONLY from the orchestrator.
2. Agents do NOT self-assign or pick work from the backlog.
3. Agents do NOT communicate directly with other agents — all coordination routes through the orchestrator.

### 4.2 Execution Boundaries

| Rule                    | Description                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Single-issue focus**  | Each agent works on exactly one issue at a time                                                                      |
| **No scope creep**      | Agent must not expand scope beyond the assigned issue's acceptance criteria                                          |
| **Escalation required** | If an agent encounters an ambiguity, blocker, or risk not covered by the issue, it MUST escalate to the orchestrator |
| **No secrets in code**  | Agents must never hardcode credentials, API keys, or PII in source files                                             |
| **Prompt integrity**    | Agents execute ONLY from the latest approved version of `PROMPT_REGISTRY.md`                                         |

### 4.3 Risk-Gated Execution

| Risk Class | Execution Rule                                                                             |
| ---------- | ------------------------------------------------------------------------------------------ |
| `risk:r4`  | Agent may execute and close with evidence bundle                                           |
| `risk:r3`  | Agent may execute; closure requires orchestrator review                                    |
| `risk:r2`  | Agent may execute; closure requires human approval                                         |
| `risk:r1`  | Agent may NOT execute without explicit human pre-approval; closure requires human sign-off |

### 4.4 Dependency Enforcement

- An agent MUST NOT close a child outcome before all parent dependencies are closed.
- The orchestrator MUST verify dependency chain before assigning an issue.
- Blocked issues are moved to `Blocked` column and not reassigned until unblocked.

---

## 5. Data Handling Rules

1. **Video default**: Process-then-discard. Raw video frames are not persisted unless an explicit, documented policy override is approved.
2. **PII handling**: Minimal collection. No patient identifiers stored in development or staging environments.
3. **Logs**: No PII in application logs. Structured logging only.
4. **Encryption**: All data at rest encrypted (AES-256). All data in transit encrypted (TLS 1.2+).

---

## 6. Escalation Triggers

An agent MUST escalate immediately if:

- The issue touches patient safety
- A regulatory claim boundary is unclear
- The issue requires access to production data
- The agent's confidence in meeting acceptance criteria is below "medium"
- A dependency is discovered that was not listed in the issue
- The accuracy measurement exceeds the error tolerance defined in the acceptance criteria

---

## 7. Changelog

| Date       | Version | Change                | Approved By |
| ---------- | ------- | --------------------- | ----------- |
| 2026-02-08 | 1.0.0   | Initial locked policy | Founder     |
