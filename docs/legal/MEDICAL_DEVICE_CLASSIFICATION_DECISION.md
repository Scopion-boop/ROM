# Medical Device Classification Decision Framework

**Platform:** PhysioLens
**Organization:** [YOUR COMPANY NAME]
**Version:** 1.0
**Last Updated:** February 9, 2026

---

## Executive Summary

This document provides a framework for deciding whether to position the ROM Measurement Platform as:

- **Option A: Non-Medical Device** (faster market entry, enforcement discretion)
- **Option B: FDA-Cleared Medical Device** (510(k) pathway, clinical credibility)

**RECOMMENDATION FOR MVP:** **Option A (Non-Medical Device)** to enable rapid market entry while gathering clinical validation data. Pursue Option B (FDA clearance) as Phase 2 roadmap item based on market feedback and competitive positioning.

---

## 1. Regulatory Landscape

### 1.1 FDA Medical Device Definition

Under 21 USC §321(h), a medical device is an instrument, apparatus, implement, machine, or similar article intended for use in:

- Diagnosis of disease or other conditions
- Cure, mitigation, treatment, or prevention of disease
- Affecting the structure or function of the body

**Key Determination:** Does the Platform's **intended use** meet this definition?

### 1.2 FDA Enforcement Discretion

FDA may exercise **enforcement discretion** (not require 510(k) clearance) for certain low-risk software, including:

**Relevant Criteria for PhysioLens:**

- **Does not analyze patient-specific data** to detect, diagnose, or treat disease
- **Provides general wellness information** or clinical reference
- **Assists healthcare providers** but does not replace clinical judgment
- **Low risk** if it malfunctions

**Guidance Documents:**

- FDA Policy for Device Software Functions (2022)
- Clinical Decision Support Software Draft Guidance (2022)
- Digital Health Innovation Action Plan

---

## 2. Option A: Non-Medical Device (Recommended for MVP)

### 2.1 Positioning Strategy

**Intended Use Statement:**

> "The ROM Measurement Platform is a clinical assessment tool designed to assist licensed healthcare professionals in documenting range of motion measurements. It provides general clinical guidance and requires independent verification by trained clinicians. It is NOT intended to diagnose, treat, cure, or prevent any disease."

**Key Characteristics:**

- **Clinical assessment tool** (not diagnostic device)
- **Advisory recommendations** (not treatment directives)
- **Requires clinician review** of all measurements and AI output
- **Healthcare professional use only** (not direct-to-consumer)

### 2.2 Advantages

| Benefit                     | Impact                                                  |
| --------------------------- | ------------------------------------------------------- |
| **Fast Market Entry**       | No 6-12 month FDA review process                        |
| **Lower Cost**              | Save $50K-$150K in 510(k) submission costs + legal fees |
| **Development Flexibility** | Rapid iteration, no FDA approval for changes            |
| **Pilot Launch**            | Gather clinical validation data before FDA submission   |
| **Competitive Timing**      | Beat competitors to market                              |

### 2.3 Disadvantages

| Risk                           | Mitigation                                                             |
| ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| **Regulatory Uncertainty**     | FDA could later determine it IS a device (rare if properly positioned) |
| **Competitive Disadvantage**   | Some competitors may have FDA clearance                                | Document clinical validation, HIPAA compliance        |
| **Clinical Adoption Barriers** | Some institutions require FDA clearance                                | Target early-adopter clinics, emphasize data security |
| **Reimbursement**              | CPT codes may require FDA clearance                                    | Position as clinical efficiency tool (non-billable)   |

### 2.4 Requirements for Option A

**To qualify for enforcement discretion:**

1. **Intended Use Statements**
   - ✅ Clearly state "not a medical device"
   - ✅ Require clinician review and interpretation
   - ✅ Do not claim to diagnose or treat conditions

2. **User Interface Design**
   - ✅ Display measurements with confidence scores
   - ✅ Require explicit clinician confirmation before saving data
   - ✅ Prominent disclaimers: "For professional use only," "Verify independently"

3. **Marketing and Labeling**
   - ✅ Avoid disease claims ("diagnose rotator cuff tears")
   - ✅ Use appropriate terminology ("clinical assessment," "documentation tool")
   - ✅ Emphasize clinician judgment

4. **Documentation**
   - ✅ Medical Disclaimer clearly stating non-device status
   - ✅ Terms of Service limiting liability for clinical decisions
   - ✅ User training materials emphasizing clinician responsibility

### 2.5 Clinical Validation (Recommended Even for Non-Device)

**Conduct validation study:**

- **Design:** ROM measurements (Platform vs. manual goniometry)
- **Subjects:** 20-30 patients across different body types
- **Joints:** Shoulder, elbow, hip, knee
- **Metrics:** Mean Absolute Error (MAE), Intraclass Correlation Coefficient (ICC)
- **Target:** MAE ≤5°, ICC ≥0.85

**Benefits:**

- Clinical credibility for marketing
- Peer-reviewed publication
- Evidence base for future FDA submission (if pursuing Option B)

### 2.6 FDA Communication Strategy

**Proactive FDA Engagement (Optional but Recommended):**

- **Pre-Submission Q&A (Q-Sub):** Ask FDA to confirm enforcement discretion eligibility
  - **Cost:** $0-$10K (depending on use of consultants)
  - **Timeline:** 60-90 days
  - **Benefit:** Written FDA feedback reduces regulatory risk

- **When to Engage FDA:**
  - If uncertain about device classification
  - If planning future 510(k) submission
  - If competitors challenge your non-device claim

---

## 3. Option B: FDA-Cleared Medical Device (510(k) Pathway)

### 3.1 Positioning Strategy

**Intended Use Statement:**

> "The ROM Measurement Platform is an FDA-cleared Class II medical device intended for non-invasive measurement of joint range of motion in adult patients undergoing musculoskeletal evaluation by licensed healthcare professionals. It is substantially equivalent to [Predicate Device]."

**Device Classification:**

- **Class II** (Moderate Risk, Special Controls)
- **21 CFR 890.1925** - Goniometer
- **Product Code:** ITD (Goniometer, AC-Powered)

### 3.2 510(k) Submission Process

**Timeline:** 6-12 months from submission to clearance

| Phase           | Duration   | Activities                                                   |
| --------------- | ---------- | ------------------------------------------------------------ |
| **Preparation** | 3-6 months | Clinical validation, predicate identification, documentation |
| **Submission**  | 1 month    | Compile 510(k) application, submit to FDA                    |
| **FDA Review**  | 3-6 months | FDA questions (Additional Info requests), responses          |
| **Clearance**   | 1 week     | FDA issues clearance letter, assign 510(k) number            |

**Total:** 7-13 months from start to market

### 3.3 Cost Estimate

| Item                                | Cost Range                                          |
| ----------------------------------- | --------------------------------------------------- |
| **FDA User Fee** (FY2026)           | $13,000-$20,000 (small business discount available) |
| **Regulatory Consultant**           | $30,000-$80,000                                     |
| **Clinical Validation Study**       | $50,000-$150,000 (20-30 subjects, multi-site)       |
| **Biostatistician**                 | $10,000-$20,000                                     |
| **Legal Counsel**                   | $20,000-$50,000                                     |
| **Quality Management System (QMS)** | $30,000-$100,000 (ISO 13485 certification)          |
| **Total**                           | **$153,000-$420,000**                               |

### 3.4 Predicate Device Strategy

**Identify substantially equivalent predicate:**

**Potential Predicates:**

- **K######** - [Predicate Device Name] (Digital Goniometer)
- **K######** - [Another Predicate] (Motion Capture System)

**Substantial Equivalence Criteria:**

- **Same intended use:** Range of motion measurement
- **Similar technological characteristics:** Computer vision vs. manual/digital goniometry
- **Same performance benchmarks:** ±5° accuracy

**Search FDA 510(k) Database:** https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm

### 3.5 Clinical Validation Requirements

**More rigorous than Option A validation:**

- **Sample Size:** 30-100 subjects (FDA may require larger sample)
- **Multi-Site:** 2-3 clinical sites for generalizability
- **Blinded Comparison:** PhysioLens vs. manual goniometry (gold standard)
- **Statistical Analysis:** Bland-Altman plots, ICC, MAE, 95% confidence intervals
- **IRB Approval:** Institutional Review Board approval for human subjects research
- **GCP Compliance:** Good Clinical Practice standards

**Timeline:** 4-6 months
**Cost:** $50K-$150K

### 3.6 Quality Management System (QMS)

**ISO 13485 Certification Required:**

- **Design Controls:** Documented design inputs, outputs, verification, validation
- **Risk Management:** ISO 14971 risk analysis (software hazards, cybersecurity)
- **Document Control:** Version control, change management, traceability
- **CAPA (Corrective and Preventive Action):** Process for addressing post-market issues

**Timeline:** 6-12 months to establish and certify
**Cost:** $30K-$100K (consultants, certification body audits)

### 3.7 Advantages

| Benefit                    | Impact                                              |
| -------------------------- | --------------------------------------------------- |
| **Clinical Credibility**   | "FDA-cleared" differentiates from competitors       |
| **Institutional Adoption** | Easier sale to large hospital systems               |
| **Reimbursement**          | Potential for CPT codes, insurance coverage         |
| **International Markets**  | FDA clearance facilitates CE Mark (EU), HC (Canada) |
| **Competitive Moat**       | Raises barrier to entry for competitors             |

### 3.8 Disadvantages

| Risk                    | Mitigation                                       |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **High Cost**           | $150K-$400K upfront investment                   | Seek investors, grants (SBIR)                       |
| **Long Timeline**       | 6-12 months delay to market                      | Launch Option A first, pursue Option B in parallel  |
| **Regulatory Burden**   | Ongoing FDA reporting (MDR, annual registration) | Hire regulatory specialist                          |
| **Limited Flexibility** | FDA approval required for major changes          | Design for modularity, separate software components |

### 3.9 Post-Market Requirements (If FDA-Cleared)

**Medical Device Reporting (MDR):**

- **30-day reports:** Deaths, serious injuries caused by device
- **Annual reports:** Malfunctions with serious injury risk
- **5-day reports:** Public health emergencies

**Annual Registration:**

- Update FDA establishment registration annually
- Pay annual registration fee (~$7,000)

**Post-Market Surveillance:**

- Monitor adverse events, complaints
- Maintain complaint files for 2 years

---

## 4. Decision Matrix

### 4.1 Key Decision Factors

| Factor                      | Option A (Non-Device)                           | Option B (FDA 510(k))            | Weight |
| --------------------------- | ----------------------------------------------- | -------------------------------- | ------ |
| **Time to Market**          | ✅ Immediate (2-3 months)                       | ❌ 6-12 months                   | High   |
| **Cost**                    | ✅ Low ($10K-$50K)                              | ❌ High ($150K-$400K)            | High   |
| **Clinical Credibility**    | ⚠️ Moderate (requires validation study)         | ✅ High ("FDA-cleared")          | Medium |
| **Institutional Adoption**  | ⚠️ May face barriers at large hospitals         | ✅ Easier sales process          | Medium |
| **Regulatory Risk**         | ⚠️ FDA could later challenge (low probability)  | ✅ Minimal (cleared path)        | Low    |
| **Development Flexibility** | ✅ Rapid iteration, no FDA approval for changes | ❌ Limited (requires FDA review) | Medium |
| **Competitive Advantage**   | ⚠️ Parity with other non-device tools           | ✅ Differentiation               | Medium |

### 4.2 Recommended Decision Tree

```
START: Is rapid market entry critical? (validate MVP hypothesis)
  ├─ YES → Option A (Non-Device) ✅ RECOMMENDED FOR MVP
  │         ↓
  │         Conduct Clinical Validation Study (4-6 months)
  │         ↓
  │         Gather Market Feedback (6-12 months)
  │         ↓
  │         Re-evaluate for Option B based on:
  │         - Customer demand for FDA clearance
  │         - Competitive landscape
  │         - Funding availability
  │
  └─ NO → Option B (FDA 510(k))
           ↓
           Budget $150K-$400K, 6-12 month timeline
           ↓
           Pursue 510(k) submission
```

**Decision Point:** Launch with Option A, collect real-world evidence, then decide on Option B based on market traction.

---

## 5. Hybrid Approach (Recommended Strategy)

### 5.1 Phase 1: MVP Launch (Option A)

**Months 1-12:**

- Launch as **non-medical device** clinical assessment tool
- Target early-adopter clinics (PT, sports medicine, orthopedics)
- Conduct **clinical validation study** (20-30 subjects)
- Gather **user feedback** and refine product
- Build **customer base** and generate revenue
- **Cost:** $10K-$50K (validation study, legal review)

**Exit Criteria for Phase 2:**

- ≥50 paying clinics using platform
- Clinical validation study complete (published or under review)
- Customers requesting FDA clearance for institutional adoption
- Competitive pressure (multiple competitors pursuing FDA)

### 5.2 Phase 2: FDA Clearance (Option B)

**Months 13-24:**

- Prepare **510(k) submission** using Phase 1 data
- Expand clinical validation (multi-site, 50-100 subjects)
- Implement **ISO 13485 QMS**
- Submit 510(k) to FDA
- **Cost:** $150K-$400K

**Benefit:** Real-world evidence from Phase 1 strengthens 510(k) application

### 5.3 Risk Mitigation

**If FDA challenges Option A positioning:**

- Cease marketing with device claims
- Pivot to Option B (510(k) pathway)
- **Likelihood:** LOW if properly positioned (enforcement discretion well-established)

**Mitigation:**

- Proactive FDA Q-Sub to confirm enforcement discretion
- Maintain clear non-device labeling and intended use
- Document clinical validation early

---

## 6. International Regulatory Considerations

### 6.1 European Union (CE Mark)

**Medical Device Regulation (MDR) 2017/745:**

- **Class I** (low risk) or **Class IIa** (moderate risk) likely classification
- **Conformity assessment** via Notified Body
- **Timeline:** 6-12 months
- **Cost:** $50K-$150K

**Benefit:** EU market access (446 million population)

### 6.2 Canada (Health Canada)

**Medical Devices Regulations (SOR/98-282):**

- **Class II** likely classification
- **Medical Device License** required
- **Timeline:** 3-6 months
- **Cost:** $20K-$50K

**Benefit:** FDA 510(k) clearance facilitates HC approval

### 6.3 Strategy

**Sequential Approach:**

1. **U.S. Market** (Option A → Option B)
2. **CE Mark** (if FDA-cleared, easier path)
3. **Canada** (leverages FDA clearance)

---

## 7. Final Recommendation

### 7.1 For MVP Launch (Now - Month 12)

**✅ Choose Option A: Non-Medical Device**

**Rationale:**

- Fastest path to market (validate product-market fit)
- Lowest cost ($10K-$50K vs. $150K-$400K)
- Flexibility to iterate based on user feedback
- Can always pursue FDA clearance later (Option B) with stronger evidence

**Critical Actions:**

1. **Legal review** of Medical Disclaimer and intended use statements
2. **Clinical validation study** (20-30 subjects, 4-6 months)
3. **User training** emphasizing clinician responsibility
4. **Document everything** (prepares for future FDA submission)

### 7.2 For Future (Month 12-24)

**🔄 Re-evaluate Option B: FDA 510(k) Clearance**

**Decision Criteria:**

- Customer demand (≥20% of prospects require FDA clearance)
- Competitive pressure (≥2 competitors pursue FDA)
- Funding secured ($150K-$400K for 510(k))
- Clinical validation complete and positive results
- Revenue trajectory supports 6-12 month timeline

---

## 8. Action Items

**Immediate (Before Launch):**

- [ ] Legal counsel review of Medical Disclaimer
- [ ] Finalize intended use statement (non-device language)
- [ ] Update marketing materials (remove disease claims)
- [ ] Implement UI disclaimers ("Verify independently")

**Short-Term (Months 1-3):**

- [ ] Initiate clinical validation study (IRB approval)
- [ ] Document product design and risk analysis (prepares for future QMS)
- [ ] Consider FDA Q-Sub to confirm enforcement discretion

**Medium-Term (Months 6-12):**

- [ ] Complete validation study, submit for publication
- [ ] Collect customer feedback on FDA clearance need
- [ ] Assess competitive landscape (FDA vs. non-FDA competitors)

**Long-Term (Months 12+):**

- [ ] Decision point: Pursue 510(k)? (Yes/No)
- [ ] If Yes: Budget $150K-$400K, 6-12 month timeline
- [ ] If No: Continue Option A with enhanced clinical credibility

---

## 9. Contact Information

**Regulatory Consultants (Recommended):**

- [CONSULTANT FIRM 1], [PHONE] - FDA 510(k) specialists
- [CONSULTANT FIRM 2], [PHONE] - Medical device QMS/ISO 13485

**Legal Counsel:**

- [LAW FIRM], [PHONE] - FDA regulatory law, medical device compliance

**FDA Resources:**

- **FDA CDRH:** 1-800-638-2041, DICE@fda.hhs.gov
- **510(k) Guidance:** https://www.fda.gov/medical-devices/premarket-submissions
- **Q-Submission Program:** https://www.fda.gov/medical-devices/premarket-submissions/q-submission-program

---

## 10. Document Control

**Version:** 1.0
**Author:** [NAME, TITLE]
**Reviewed By:** Legal Counsel, Regulatory Consultant, CEO
**Approval Date:** [DATE]
**Next Review:** [6 months after initial decision]

**Confidential:** This document contains strategic business information. Do not distribute externally without authorization.

---

## Appendix A: FDA Enforcement Discretion Examples

**Examples of software that may qualify for enforcement discretion:**

- Clinical reference apps (drug interaction checkers, medical calculators)
- General wellness apps (activity trackers, meditation apps)
- Electronic health record (EHR) systems
- Administrative healthcare software (scheduling, billing)

**Examples that DO require FDA clearance:**

- Software that interprets medical images for diagnosis (CAD systems)
- Software that controls drug infusion pumps or medical devices
- Software that provides patient-specific treatment recommendations
- Software that analyzes patient data to detect disease

**PhysioLens Assessment:**

- ✅ Assists clinicians (not autonomous diagnosis)
- ✅ General clinical reference (normative ROM values)
- ✅ Requires professional interpretation
- ⚠️ AI recommendations → must be clearly advisory, not directive

**Conclusion:** Platform likely qualifies for enforcement discretion if properly positioned.

---

## Appendix B: Sample FDA Q-Submission Letter

_(Optional proactive engagement with FDA)_

```
[Date]

FDA Center for Devices and Radiological Health
Document Control Center
10903 New Hampshire Avenue, WO66-G609
Silver Spring, MD 20993-0002

RE: Pre-Submission (Q-Submission) - ROM Measurement Platform

Dear Sir or Madam:

[YOUR COMPANY NAME] respectfully requests a Pre-Submission meeting (Q-Submission) to discuss the regulatory classification and potential enforcement discretion for our ROM Measurement Platform.

**Product Description:**
The ROM Measurement Platform is a software application that uses computer vision to measure joint range of motion. It is intended for use by licensed healthcare professionals to assist in clinical documentation of musculoskeletal assessments.

**Specific Questions for FDA:**
1. Does the PhysioLens meet the criteria for enforcement discretion under the FDA Policy for Device Software Functions (2022)?
2. If the Platform IS considered a medical device, what regulatory pathway would FDA recommend (510(k), De Novo, exempt)?
3. What clinical validation data would FDA require for a potential future 510(k) submission?

**Attached Documents:**
- Product description and intended use
- Screenshots and user interface
- Risk analysis
- Proposed validation protocol

We request a 60-minute meeting to discuss these questions. We are available [dates/times].

Thank you for your consideration.

Sincerely,

[Name, Title]
[YOUR COMPANY NAME]
```

**Cost:** $0 (no FDA fee for Q-Sub)
**Timeline:** FDA typically responds within 60-75 days
**Benefit:** Written FDA feedback reduces regulatory uncertainty
