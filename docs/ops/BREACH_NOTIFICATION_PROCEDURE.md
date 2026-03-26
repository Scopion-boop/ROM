# HIPAA Breach Notification Procedure

**Organization:** [YOUR COMPANY NAME]
**Effective Date:** [TO BE DETERMINED]
**Version:** 1.0
**Last Updated:** February 9, 2026

**HIPAA Reference:** 45 CFR §§ 164.400-414 (Breach Notification Rule)

---

## Table of Contents

1. [Overview](#overview)
2. [Definitions](#definitions)
3. [Breach Determination Process](#breach-determination-process)
4. [Notification Requirements](#notification-requirements)
5. [Notification Procedures](#notification-procedures)
6. [Documentation and Recordkeeping](#documentation-and-recordkeeping)
7. [Breach Log](#breach-log)

---

## 1. Overview

### 1.1 Purpose

This procedure establishes requirements and procedures for responding to breaches of unsecured Protected Health Information (PHI) in compliance with the HIPAA Breach Notification Rule.

### 1.2 Scope

This procedure applies to:

- All employees, contractors, and business associates of [YOUR COMPANY NAME]
- All breaches involving unsecured PHI maintained or transmitted by the ROM Measurement Platform
- Breaches discovered by [YOUR COMPANY NAME] or reported by business associates

### 1.3 Regulatory Authority

**HIPAA Breach Notification Rule (45 CFR Part 164, Subpart D) requires:**

- **Individual Notification:** Within 60 days of breach discovery
- **HHS Notification:** Within 60 days (or immediately if ≥500 individuals)
- **Media Notification:** Immediately if ≥500 individuals in a jurisdiction
- **Business Associate Notification:** Within 60 days to covered entities

**Penalties for Non-Compliance:**

- **Tier 1:** $100-$50,000 per violation (unknowing violation)
- **Tier 2:** $1,000-$50,000 per violation (reasonable cause)
- **Tier 3:** $10,000-$50,000 per violation (willful neglect, corrected)
- **Tier 4:** $50,000 per violation (willful neglect, not corrected)
- **Maximum Annual:** $1.5 million per violation category

---

## 2. Definitions

### 2.1 Breach

**HIPAA Definition:** The acquisition, access, use, or disclosure of PHI in a manner not permitted by the Privacy Rule that compromises the security or privacy of the PHI.

**Presumption of Breach:** Any impermissible use or disclosure of PHI is PRESUMED to be a breach unless a risk assessment demonstrates a low probability that PHI was compromised.

### 2.2 Unsecured PHI

PHI that is **not** rendered unusable, unreadable, or indecipherable to unauthorized persons through:

- **Encryption:** AES-256 or equivalent (as specified by NIST)
- **Destruction:** Shredding, burning, pulping, or secure electronic wiping

**Our Platform:** PHI at rest is encrypted with AES-256 (AWS RDS/S3). Properly encrypted PHI is NOT considered a breach if stolen.

### 2.3 Discovery of Breach

A breach is **discovered** on the first day that:

- Any employee or agent of [YOUR COMPANY NAME] knows or should have known of the breach, OR
- We are notified by a business associate of a breach

**Discovery Clock:** Breach notification timeline (60 days) begins on the date of discovery, not the date of the breach itself.

### 2.4 Harm Threshold

**Low Probability of Compromise:** A breach does NOT require notification if a risk assessment demonstrates low probability that PHI was compromised, considering:

1. **Nature and extent** of PHI involved
2. **Unauthorized person** who used or accessed PHI
3. **Whether PHI was actually acquired or viewed**
4. **Extent to which risk has been mitigated**

---

## 3. Breach Determination Process

### 3.1 Initial Assessment (Day 0-1)

**Upon discovery of a potential breach, immediately:**

1. **Secure the scene**
   - Contain the incident (see Incident Response Playbook)
   - Preserve evidence (logs, emails, screenshots)
   - Prevent further unauthorized access

2. **Notify key personnel**
   - **Privacy Officer/Compliance Lead:** [NAME], [PHONE]
   - **Legal Counsel:** [LAW FIRM], [PHONE]
   - **Incident Commander:** [NAME], [PHONE]

3. **Document initial facts**
   - Date/time of breach
   - How was breach discovered?
   - What PHI was involved?
   - Who had unauthorized access?
   - How many individuals affected?

### 3.2 Risk Assessment (Day 1-3)

**Conduct a formal risk assessment using the four-factor test:**

#### Factor 1: Nature and Extent of PHI Involved

**High Risk Indicators:**

- Social Security Numbers, driver's license numbers, financial account numbers
- Diagnosis, treatment, or medication information
- Mental health or substance abuse records
- HIV/AIDS status
- Large volume of individuals affected (>500)

**Lower Risk Indicators:**

- Limited identifiers only (name, date of birth)
- De-identified or partially redacted data
- Small number of individuals affected (<50)

**Score:** High / Medium / Low

#### Factor 2: Unauthorized Person Who Used/Accessed PHI

**High Risk Indicators:**

- External malicious actor (hacker, ransomware)
- Person with intent to use PHI for fraud or identity theft
- Public disclosure (posted online, sent to media)
- Unknown recipient

**Lower Risk Indicators:**

- Healthcare provider covered by HIPAA (accidental misdirection)
- Business associate with executed BAA
- Known recipient who agrees to delete/return data
- Internal employee with no malicious intent

**Score:** High / Medium / Low

#### Factor 3: Was PHI Actually Acquired or Viewed?

**High Risk Indicators:**

- Confirmed that PHI was viewed, downloaded, or exported
- Data exfiltration detected (large data transfers)
- Ransomware encryption (implies data theft)

**Lower Risk Indicators:**

- No evidence PHI was actually accessed
- Encryption prevented data from being read
- Recipient confirmed they did not open/view PHI

**Score:** High / Medium / Low

#### Factor 4: Extent to Which Risk Has Been Mitigated

**Mitigating Actions:**

- PHI was encrypted at rest (even if stolen)
- Unauthorized recipient destroyed/returned PHI (with verification)
- Access was immediately revoked, preventing further exposure
- Recipient signed confidentiality agreement
- Technical safeguards prevented data extraction

**Score:** High / Medium / Low

### 3.3 Risk Assessment Conclusion

**Overall Risk Determination:**

| Overall Risk                      | Notification Required? | Rationale                                          |
| --------------------------------- | ---------------------- | -------------------------------------------------- |
| **Low Probability of Compromise** | **NO**                 | Document risk assessment; no notification required |
| **Medium/High Risk**              | **YES**                | Proceed with breach notification procedures        |

**Risk Assessment Must Be Documented:** Create written risk assessment report within 3 business days and retain for 6 years.

**Risk Assessment Template:**

```markdown
# HIPAA Breach Risk Assessment

**Incident ID:** [INC-YYYY-MM-DD-###]
**Date of Discovery:** [YYYY-MM-DD]
**Assessed By:** [NAME, TITLE]
**Date of Assessment:** [YYYY-MM-DD]

## Incident Summary

[Brief description of breach]

## Four-Factor Analysis

### Factor 1: Nature and Extent of PHI

- **PHI Involved:** [List specific data elements]
- **Sensitivity:** High / Medium / Low
- **Number of Individuals:** [number]
- **Score:** High / Medium / Low

### Factor 2: Unauthorized Person

- **Who Accessed:** [Description]
- **Intent:** Malicious / Accidental / Unknown
- **Score:** High / Medium / Low

### Factor 3: Actual Acquisition/Viewing

- **Evidence of Access:** Yes / No / Unknown
- **Details:** [Describe evidence]
- **Score:** High / Medium / Low

### Factor 4: Mitigation

- **Actions Taken:** [List mitigation steps]
- **Effectiveness:** High / Medium / Low
- **Score:** High / Medium / Low

## Conclusion

- **Overall Risk:** Low / Medium / High
- **Notification Required:** YES / NO
- **Rationale:** [Explanation of determination]

## Approval

- **Privacy Officer:** [SIGNATURE], [DATE]
- **Legal Counsel:** [SIGNATURE], [DATE]
```

---

## 4. Notification Requirements

### 4.1 Individual Notification

**Required Elements (45 CFR § 164.404(c)):**

All breach notifications to individuals must include:

1. **Brief description of the breach**
   - What happened, date of breach, date of discovery

2. **Types of PHI involved**
   - Specific data elements (diagnosis, SSN, address, etc.)

3. **Steps individuals should take**
   - Credit monitoring, fraud alerts, changing passwords

4. **What we are doing**
   - Investigation, remediation, preventing recurrence

5. **Contact information**
   - How to get more information, who to call with questions

**Format:**

- **Written notice** via first-class mail (or email if individual agreed to electronic communications)
- **Plain language** (no legal jargon)
- **Substitute notice** if contact information is insufficient/out-of-date (see Section 5.2)

**Timing:**

- **Within 60 days** of breach discovery
- **Expedited notification** if immediate harm (e.g., financial fraud risk)

### 4.2 HHS (Department of Health and Human Services) Notification

#### 4.2.1 Breaches Affecting ≥500 Individuals ("Tier 1")

**Notification Method:**

- **Online Portal:** https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf
- **Paper Form:** https://www.hhs.gov/sites/default/files/breach-notification-form.pdf

**Timing:** **Within 60 days** of breach discovery

**Required Information:**

- Name and contact information of covered entity
- Name and contact information of business associate (if applicable)
- Date of breach, date of discovery
- Number of individuals affected (best estimate)
- Description of breach
- Types of PHI involved
- Actions taken in response

#### 4.2.2 Breaches Affecting <500 Individuals ("Tier 2")

**Notification Method:**

- **Annual Report:** Submit log of breaches affecting <500 individuals
- **Timing:** Within 60 days after end of calendar year
- **Portal:** Same HHS breach portal

### 4.3 Media Notification (Breaches ≥500 in a Jurisdiction)

**Required If:**

- Breach affects ≥500 residents of a State or jurisdiction

**Notification Method:**

- **Prominent media outlet** serving the affected jurisdiction
- **Press release** to major newspapers, TV stations
- **Timing:** Concurrent with individual notification (within 60 days)

**Press Release Template:** See Section 7.3

### 4.4 Business Associate Notification

**If we are a Business Associate:**

- **Notify covered entity** (our customer/clinic) within **60 days** of discovery
- Provide details needed for covered entity to assess breach

**If our Business Associate breaches:**

- Business associate must notify us within 60 days
- We then assess whether to notify individuals/HHS

---

## 5. Notification Procedures

### 5.1 Standard Individual Notification (Day 1-60)

**Step 1: Prepare Notification Letter (Day 1-7)**

Use template in Section 7.1. Customize with:

- Specific details of breach
- Number of individuals affected
- Types of PHI compromised
- Remediation steps

**Review and Approval:**

- Privacy Officer: [NAME]
- Legal Counsel: [LAW FIRM]
- CEO (for breaches ≥100 individuals)

**Step 2: Obtain Mailing List (Day 5-10)**

Query database for affected individuals:

```sql
-- Example: Get affected patients for breach notification
SELECT DISTINCT
    p.patient_id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.zip,
    p.email,
    p.phone
FROM patients p
JOIN audit_events ae ON p.patient_id = ae.patient_id
WHERE ae.event_type = 'unauthorized_access'
AND ae.event_date BETWEEN '2026-01-01' AND '2026-01-15'
ORDER BY p.name;
```

**Data Quality Check:**

- Verify addresses are current
- Identify insufficient/outdated contact info (see substitute notice)

**Step 3: Mail Notification (Day 10-50)**

- **Print letters** on company letterhead
- **First-class mail** (USPS tracking recommended)
- **Email** (if individual opted in to electronic communications AND we have documented consent)

**Do NOT:**

- Send breach notifications via unencrypted email without consent
- Include PHI in the notification itself (use patient ID only)

**Step 4: Track Responses (Day 50-60)**

- **Incoming calls/emails:** Log all inquiries, respond within 24 hours
- **Undeliverable mail:** Document, attempt alternative contact methods
- **Substitute notice:** Required if 10+ notifications are undeliverable

**Step 5: Document Completion (Day 60)**

- **Confirmation report:** All notifications sent, responses tracked
- **Retain records:** 6 years (HIPAA requirement)

### 5.2 Substitute Notice (Insufficient Contact Information)

**Required When:**

- Contact information is insufficient or out-of-date for **10 or more individuals**

**Substitute Notice Options:**

#### Option A: Posting on Website (If <10 individuals or <500 total)

- **Conspicuous posting** on homepage of website
- **Duration:** 90 days
- **Content:** Same as individual notice, plus instructions to call for information

#### Option B: Major Media Notice (If ≥10 individuals affected)

- **Notice in major print or broadcast media** serving the affected area
- **Toll-free number:** For individuals to learn if they are affected

### 5.3 Emergency Notification (Imminent Harm)

**Expedited notification required if:**

- **Immediate threat** of identity theft or financial fraud
- **Active exploitation** of stolen PHI detected

**Actions:**

- **Notify individuals by phone** within 24-48 hours
- **Provide specific guidance** on protective actions (freeze credit, change passwords)
- **Follow up with written notice** per standard timeline

**Example Scenarios:**

- Stolen laptop with unencrypted financial account numbers
- Ransomware with confirmed data exfiltration
- Hacker actively using stolen credentials

---

## 6. Documentation and Recordkeeping

### 6.1 Required Documentation

**HIPAA requires retaining for 6 years:**

1. **Risk assessments** for all incidents (breach and non-breach)
2. **Breach notifications** sent to individuals
3. **HHS notifications** (submission confirmations)
4. **Media notifications** (press releases, proof of publication)
5. **Undeliverable mail** tracking
6. **Individual responses** (calls, emails, questions)

**Storage Location:**

- **Physical documents:** Locked cabinet, Privacy Officer's office
- **Electronic documents:** Secure file share (encrypted, access-controlled)

### 6.2 Breach Log

**Maintain ongoing log of all breaches:**

- Breaches affecting ≥500 individuals (Tier 1)
- Breaches affecting <500 individuals (Tier 2)
- Incidents determined not to be breaches (with risk assessment)

**Template:** See Section 7 - Breach Log Template

### 6.3 Annual Reporting

**By March 1 each year:**

- Submit **annual breach report** to HHS for all breaches <500 individuals from previous calendar year
- **Internal report** to Board of Directors summarizing all security incidents and breaches

---

## 7. Templates and Forms

### 7.1 Individual Breach Notification Letter Template

```
[Company Letterhead]

[Date]

[Individual Name]
[Address]
[City, State ZIP]

RE: Notification of Data Security Incident

Dear [Name]:

We are writing to inform you of a data security incident that may have affected the privacy of your protected health information maintained by [YOUR COMPANY NAME] in connection with our ROM Measurement Platform.

**What Happened**

On [Date of Discovery], we discovered that [brief description of breach - e.g., "an unauthorized individual gained access to our database containing patient information"]. The incident occurred between [Date Range].

**What Information Was Involved**

The information that may have been accessed includes: [list specific data elements, e.g., "your name, date of birth, medical record number, and range of motion assessment data from [date]"]. [If applicable: "Your Social Security number, financial account information, and [other sensitive data] were NOT involved."]

**What We Are Doing**

We take this incident very seriously. We have:
- [Specific action 1, e.g., "Immediately secured our systems to prevent further unauthorized access"]
- [Specific action 2, e.g., "Engaged cybersecurity experts to investigate the incident"]
- [Specific action 3, e.g., "Implemented additional security measures, including enhanced encryption and access controls"]
- [Specific action 4, e.g., "Notified law enforcement and are cooperating fully with their investigation"]

**What You Can Do**

We recommend you take the following steps to protect yourself:

1. **Review your health records** for any unauthorized activity
2. **Monitor your financial accounts** for suspicious transactions
3. **Consider placing a fraud alert** on your credit report (see instructions below)
4. **Be alert for phishing attempts** (suspicious emails or calls requesting personal information)

[If SSN or financial data involved]:
We are offering [12/24] months of free credit monitoring and identity theft protection services through [Provider]. To enroll, please call [Phone] or visit [Website] by [Deadline]. Your enrollment code is: [Code].

**More Information**

For more information about this incident or if you have questions, please contact us at:

[YOUR COMPANY NAME]
Attn: Privacy Officer
[Address]
Phone: [Toll-Free Number]
Email: privacy@[YOUR DOMAIN].com
Hours: Monday-Friday, 9 AM - 5 PM ET

You may also contact:
- **Federal Trade Commission:** 1-877-IDTHEFT (438-4338) or www.ftc.gov/idtheft
- **Your State Attorney General:** [State-specific contact info]
- **U.S. Department of Health and Human Services:** 1-877-696-6775 or www.hhs.gov/ocr/privacy

We sincerely apologize for this incident and any concern it may cause. Protecting your information is our highest priority, and we are committed to preventing incidents like this in the future.

Sincerely,

[Name]
[Title]
[YOUR COMPANY NAME]

---

**How to Place a Fraud Alert:**

Contact one of the three major credit bureaus (the bureau you contact must notify the other two):
- Equifax: 1-800-525-6285, www.equifax.com
- Experian: 1-888-397-3742, www.experian.com
- TransUnion: 1-800-680-7289, www.transunion.com

**How to Obtain a Free Credit Report:**
You are entitled to one free credit report annually from each bureau. Visit www.annualcreditreport.com or call 1-877-322-8228.
```

### 7.2 HHS Notification (Web Portal Submission)

**Portal:** https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf

**Required Fields:**

1. Type of breach (hacking, unauthorized access, theft, loss, etc.)
2. Location of breached information (paper, electronic, other)
3. Date of breach
4. Date of discovery
5. Number of individuals affected
6. Description of breach (500 characters max)
7. Covered entity information
8. Business associate information (if applicable)

**Confirmation:**

- Portal provides **confirmation number** - save this!
- **Breach appears on HHS public "Wall of Shame"** at https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf

### 7.3 Media Notification (Press Release Template)

```
FOR IMMEDIATE RELEASE

[Date]

CONTACT:
[Name, Title]
[Phone]
[Email]

[YOUR COMPANY NAME] Announces Data Security Incident

[CITY, STATE] – [YOUR COMPANY NAME], operator of the ROM Measurement Platform for healthcare professionals, today announced that it recently discovered a data security incident that may have affected the protected health information of approximately [NUMBER] individuals.

**What Happened**

On [Date], [Company] discovered [brief description]. The incident occurred between [Date Range]. Upon discovery, [Company] immediately [actions taken].

**What Information Was Involved**

The information potentially affected includes [data elements]. [Company's] investigation is ongoing, and we are working with cybersecurity experts and law enforcement.

**Notification**

[Company] is mailing notification letters to all potentially affected individuals and has reported this incident to the U.S. Department of Health and Human Services as required by federal law.

**Steps Being Taken**

[Company] has implemented [specific security enhancements] to prevent similar incidents in the future. We take the privacy and security of patient information very seriously and deeply regret any concern this incident may cause.

**More Information**

Individuals with questions may contact [Company] at [Toll-Free Number] or visit [Website].

###
```

### 7.4 Breach Log Template

**Maintain in secure Excel/database:**

| Breach ID   | Date Discovered | Date Occurred | # Individuals | PHI Involved        | Type              | Notification Date | HHS Notified     | Notes                                               |
| ----------- | --------------- | ------------- | ------------- | ------------------- | ----------------- | ----------------- | ---------------- | --------------------------------------------------- |
| BR-2026-001 | 2026-02-09      | 2026-02-01    | 150           | Name, DOB, ROM data | Hacking           | 2026-03-15        | Yes (2026-03-15) | Ransomware attack, data restored from backup        |
| BR-2026-002 | 2026-05-12      | 2026-05-10    | 5             | Name, email         | Misdirected email | N/A (Low Risk)    | No               | Risk assessment: low probability, recipient deleted |

---

## 8. State Breach Notification Laws

**IMPORTANT:** Many states have breach notification laws with requirements that differ from or are more stringent than HIPAA.

### 8.1 State-Specific Requirements

**Example States with Stricter Requirements:**

- **California (CCPA/CPRA):**
  - Notification within "reasonable time" (typically interpreted as within 30-60 days)
  - Notify California Attorney General if ≥500 California residents affected
  - Specific content requirements for notice

- **New York (SHIELD Act):**
  - Notification "in the most expedient time possible and without unreasonable delay"
  - Notify NY Attorney General, State Police, and Division of State Police if ≥500 NY residents

- **Massachusetts:**
  - Notification as soon as practicable, but not later than "as soon as possible"
  - Notify MA Attorney General and Director of Consumer Affairs if ≥500 MA residents

**Action Required:**

- **Consult legal counsel** to determine which state laws apply
- Comply with the **most stringent** applicable requirement

---

## 9. Responsibilities

| Role                    | Responsibilities                                                          |
| ----------------------- | ------------------------------------------------------------------------- |
| **Privacy Officer**     | Overall breach response coordination, risk assessments, HHS notifications |
| **Legal Counsel**       | Legal advice, notification letter review, regulatory compliance           |
| **Incident Commander**  | Technical investigation, containment, evidence preservation               |
| **Communications Lead** | Draft notifications, manage media inquiries, customer communications      |
| **CEO**                 | Approval for notifications ≥100 individuals, board reporting              |

---

## 10. Training and Awareness

**Annual HIPAA training** must include:

- How to recognize a breach
- Reporting procedures (who to contact, when)
- Prohibition on unauthorized PHI access
- Consequences of breaches (penalties, liability)

**Training Records:** Retain 6 years

---

## 11. Related Documents

- **Incident Response Playbook:** Technical incident handling procedures
- **HIPAA Privacy Policy:** Overall privacy practices
- **Business Associate Agreement Template:** BAA requirements
- **Risk Assessment Template:** Four-factor breach analysis

---

## 12. Contact Information

**Privacy Officer/Compliance Lead:**
[NAME]
Phone: [PHONE]
Email: compliance@[YOUR DOMAIN].com

**Legal Counsel:**
[LAW FIRM NAME]
Phone: [PHONE]
Email: [ATTORNEY EMAIL]

**HHS Office for Civil Rights:**
Phone: 1-800-368-1019
Email: ocrmail@hhs.gov
Website: www.hhs.gov/ocr

---

## Acknowledgment

This procedure has been reviewed and approved:

**Privacy Officer:** ****\*\*****\_****\*\***** Date: \***\*\_\*\***

**Legal Counsel:** ****\*\*****\_****\*\***** Date: \***\*\_\*\***

**CEO:** ****\*\*****\_****\*\***** Date: \***\*\_\*\***

---

**Document Version:** 1.0
**Next Review Date:** [6 months from effective date]
**Confidential:** Do not distribute externally without authorization
