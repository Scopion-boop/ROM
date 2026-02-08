# 01 - Product Charter

## Product Name (working)
Musculoskeletal ROM Assistant

## Vision
Enable clinicians to capture reliable ROM measurements and generate high-quality exam notes in minutes, with optional patient-guided pre-assessment workflows.

## Problem
Manual ROM measurement is slow, inconsistent, and documentation-heavy. Clinicians lose time to admin overhead, and objective progression tracking is often poor.

## Who this is for
- Primary: Physiotherapists, chiropractors, orthopedic/sports medicine clinicians
- Secondary (V1.1): Nurses in pre-assessment flow, patients performing guided movement at home

## Core outcomes
- Reduce per-exam measurement + note time by at least 40% in pilot clinics
- Improve measurement consistency compared with visual estimation
- Provide structured, copy-ready note outputs clinicians can use immediately

## Scope
### V1 (clinical assisted)
- Single-session guided ROM capture
- Core joints (recommended: shoulder, elbow, knee)
- Angle extraction with confidence scores
- Auto-generated note block (copy/paste friendly)
- Clinician review/edit before export

### V1.1 (enhanced workflow)
- AI summary of full exam text
- Guided patient self-assessment mode
- Clinician approval workflow for remotely collected sessions
- Improved movement-quality checks and retake prompts

## Non-goals for V1
- Full autonomous diagnosis
- Billing automation and payer workflows
- Deep EHR write-back integration
- Full-body biomechanical modeling

## Business model options (to validate)
- B2B SaaS per clinician seat
- Per-clinic monthly tier
- Hybrid: clinician seats + patient self-assessment volume bundle

## Constraints and assumptions
- Must be privacy-first and healthcare-safe by default.
- App should run in standard clinic hardware environments.
- Founder has not locked web vs native-first; plan assumes web-first for speed and adoption.

## Success metrics
- Time saved per exam
- Agreement with manual goniometer baseline (target threshold to be confirmed)
- Documentation completeness and clinician satisfaction
- Activation and retention in pilot clinics
