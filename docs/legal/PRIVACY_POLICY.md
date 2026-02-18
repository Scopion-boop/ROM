# Privacy Policy

**Effective Date:** [TO BE DETERMINED - Set before launch]
**Last Updated:** February 9, 2026

**Company Name:** [YOUR COMPANY NAME]
**Website:** [YOUR WEBSITE URL]
**Contact Email:** privacy@[YOUR DOMAIN].com

---

## 1. Introduction

This Privacy Policy describes how [YOUR COMPANY NAME] ("Company," "we," "us," or "our") collects, uses, discloses, and protects information when you use our Musculoskeletal Range of Motion (ROM) Measurement Platform (the "Platform"). This Platform is designed for healthcare professionals to capture, measure, and document patient range of motion using computer vision technology.

**IMPORTANT:** This Platform processes Protected Health Information (PHI) as defined by the Health Insurance Portability and Accountability Act (HIPAA). We are committed to maintaining the confidentiality, integrity, and availability of all PHI in accordance with HIPAA regulations.

---

## 2. Information We Collect

### 2.1 Protected Health Information (PHI)

When clinicians use our Platform to assess patients, we collect and process:

- **Patient Identifiers** (if entered by clinician): Name, medical record number, date of birth
- **Clinical Measurements**: Range of motion angles, joint assessments, movement data
- **Video/Image Data**: Computer vision analysis of patient movements (processed locally, not stored by default)
- **Clinical Notes**: Assessment findings, interpretations, treatment recommendations
- **Special Test Results**: Orthopedic special test outcomes

### 2.2 User Account Information

For clinicians and healthcare professionals using the Platform:

- **Contact Information**: Name, email address, phone number
- **Professional Information**: Medical license number, organization/clinic affiliation, role
- **Credentials**: Username, encrypted password, authentication tokens

### 2.3 Technical Information

- **Device Data**: IP address, browser type, operating system, device identifiers
- **Usage Data**: Login times, features accessed, session duration, error logs
- **Performance Data**: API response times, system health metrics

### 2.4 Audit and Compliance Logs

- **Access Logs**: Who accessed what data, when, and from where
- **Modification Logs**: Changes to patient data, clinical notes, or system settings
- **Export Logs**: When PHI was exported, by whom, and in what format

---

## 3. How We Use Your Information

### 3.1 Primary Purposes (Healthcare Operations)

- **Clinical Assessment**: Enable range of motion measurements and clinical documentation
- **Data Storage**: Maintain patient assessment history for longitudinal care
- **Report Generation**: Create clinical reports and documentation
- **AI-Powered Insights**: Provide clinical interpretation and special test recommendations

### 3.2 Secondary Purposes (Platform Operations)

- **Authentication & Authorization**: Verify user identity and access permissions
- **System Maintenance**: Monitor performance, diagnose errors, improve functionality
- **Security**: Detect and prevent unauthorized access, data breaches, or misuse
- **Compliance**: Meet HIPAA audit, reporting, and retention requirements

### 3.3 Legal Bases for Processing (GDPR Compliance)

- **Legitimate Interest**: Healthcare provision, system security, fraud prevention
- **Legal Obligation**: HIPAA compliance, breach notification, law enforcement requests
- **Consent**: Marketing communications, optional features (where applicable)

---

## 4. Data Sharing and Disclosure

### 4.1 No Sale of PHI

**We do NOT sell PHI to third parties under any circumstances.**

### 4.2 Permitted Disclosures

We may disclose PHI only in the following situations:

#### 4.2.1 Within Your Healthcare Organization
- PHI is accessible to authorized clinicians within your organization for treatment purposes
- Organization administrators may access audit logs for compliance

#### 4.2.2 Business Associates
We may share PHI with third-party service providers who assist in Platform operations:

- **Cloud Infrastructure**: AWS (database hosting, storage, networking)
- **AI Services**: OpenAI, Anthropic (for clinical interpretation - de-identified when possible)
- **Security Services**: Authentication, monitoring, backup providers

**All Business Associates execute HIPAA-compliant Business Associate Agreements (BAAs).**

#### 4.2.3 Legal Requirements
- **Law Enforcement**: When required by valid subpoena, court order, or warrant
- **Public Health**: Mandatory reporting of communicable diseases (if applicable)
- **Legal Proceedings**: Response to lawsuits or legal claims involving the Platform

#### 4.2.4 With Your Explicit Consent
- Research collaborations (after de-identification)
- Third-party integrations you explicitly authorize

### 4.3 De-Identified Data

We may use de-identified data (with all 18 HIPAA identifiers removed) for:
- Product improvement and AI model training
- Research and clinical validation studies
- Aggregate analytics and reporting

De-identified data is NOT considered PHI and is not subject to HIPAA restrictions.

---

## 5. Data Security

### 5.1 Technical Safeguards

- **Encryption at Rest**: AES-256 encryption for all stored data (database, backups)
- **Encryption in Transit**: TLS 1.3 for all network communications
- **Access Controls**: Multi-factor authentication, role-based access control (RBAC)
- **Network Security**: Private VPC, firewall rules, intrusion detection
- **Secure Key Management**: AWS Secrets Manager, KMS for encryption keys

### 5.2 Administrative Safeguards

- **Employee Training**: Annual HIPAA and security awareness training
- **Access Audits**: Quarterly reviews of user permissions and access logs
- **Incident Response**: 24/7 security monitoring, documented breach procedures
- **Vendor Management**: Due diligence and BAAs with all third parties

### 5.3 Physical Safeguards

- **Data Center Security**: AWS facilities with SOC 2 Type II certification
- **Redundancy**: Multi-AZ deployment, automated backups, disaster recovery plan
- **Asset Management**: Inventory of all systems processing PHI

### 5.4 Breach Notification

In the event of a data breach affecting PHI:
- We will notify affected individuals within **72 hours** of discovery
- We will notify the U.S. Department of Health and Human Services (HHS)
- We will provide details on the breach, data affected, and remediation steps

---

## 6. Data Retention and Deletion

### 6.1 Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Patient Assessment Data | **7 years** | HIPAA minimum, state medical records laws |
| Clinical Notes | **7 years** | Professional liability, malpractice statutes |
| User Account Data | Account lifetime + **2 years** | Business necessity, audit requirements |
| Audit Logs | **6 years** | HIPAA audit requirements |
| System Logs | **90 days** | Operational necessity |
| Backups | **30 days** (rolling) | Disaster recovery |

### 6.2 Deletion Requests

Patients may request deletion of their PHI by contacting their healthcare provider. We will:
- Delete PHI within **30 days** of verified request
- Retain audit logs showing deletion occurred (HIPAA requirement)
- Notify the requesting party upon completion

**Exceptions:** We may retain PHI if required by law (e.g., ongoing legal proceedings, mandatory reporting).

### 6.3 Account Termination

When a clinician account is terminated:
- Access is immediately revoked
- Account data is retained for 2 years (audit compliance)
- PHI remains accessible to organization administrators

---

## 7. Your Privacy Rights

### 7.1 HIPAA Rights (U.S. Patients)

- **Right to Access**: Request copies of your health information
- **Right to Amend**: Request corrections to inaccurate information
- **Right to Accounting**: Receive a list of disclosures of your PHI
- **Right to Restrict**: Request limitations on use or disclosure
- **Right to Confidential Communications**: Specify how you receive PHI

**To exercise these rights, contact your healthcare provider directly.**

### 7.2 GDPR Rights (EU/EEA Individuals)

- **Right to Access**: Obtain confirmation of processing and data copies
- **Right to Rectification**: Correct inaccurate personal data
- **Right to Erasure**: Request deletion ("right to be forgotten")
- **Right to Restrict Processing**: Limit how we use your data
- **Right to Data Portability**: Receive data in machine-readable format
- **Right to Object**: Object to processing for specific purposes
- **Right to Withdraw Consent**: Revoke consent at any time

**To exercise GDPR rights, email:** privacy@[YOUR DOMAIN].com

### 7.3 California Privacy Rights (CCPA/CPRA)

California residents have additional rights under the California Consumer Privacy Act:

- **Right to Know**: Categories and specific pieces of personal information collected
- **Right to Delete**: Request deletion of personal information
- **Right to Opt-Out**: Opt out of sale of personal information (we do not sell PHI)
- **Right to Non-Discrimination**: Equal service regardless of privacy rights exercise

**California Residents:** Call [YOUR PHONE] or email privacy@[YOUR DOMAIN].com

---

## 8. International Data Transfers

Our Platform is hosted in the **United States** (AWS us-east-1 region). If you access the Platform from outside the U.S.:

- Your data will be transferred to and processed in the United States
- U.S. data protection laws may differ from your jurisdiction
- We use Standard Contractual Clauses (SCCs) for GDPR compliance

**For EU/EEA users:** We comply with the EU-U.S. Data Privacy Framework principles.

---

## 9. Children's Privacy

This Platform is intended for **healthcare professionals only** and is not designed for direct use by children under 18. We do not knowingly collect personal information from children without parental consent.

If patient data includes information about minors, it is provided by their healthcare provider with appropriate parental/guardian authorization.

---

## 10. Changes to This Policy

We may update this Privacy Policy to reflect:
- Changes in legal requirements (new laws or regulations)
- Platform feature updates or new services
- Feedback from users or regulators

**Notice of Changes:**
- Updated policy will be posted on our website with new "Last Updated" date
- Material changes will be announced via email to registered users
- Continued use after changes constitutes acceptance

---

## 11. Contact Information

### Privacy Officer
**[YOUR COMPANY NAME]**
[YOUR ADDRESS]
Email: privacy@[YOUR DOMAIN].com
Phone: [YOUR PHONE NUMBER]

### HIPAA Complaints

If you believe your privacy rights have been violated, you may file a complaint with:

1. **Our Privacy Officer** (contact information above)
2. **U.S. Department of Health and Human Services**
   Office for Civil Rights
   200 Independence Avenue, S.W.
   Washington, D.C. 20201
   Phone: 1-877-696-6775
   Website: https://www.hhs.gov/ocr/privacy/

**You will not be retaliated against for filing a complaint.**

### GDPR Data Protection Authority

EU/EEA individuals may lodge a complaint with their local supervisory authority:
- **List of authorities:** https://edpb.europa.eu/about-edpb/board/members_en

---

## 12. Additional State-Specific Disclosures

### Nevada Residents
Nevada law allows you to opt out of the sale of personal information. We do not sell PHI. To exercise Nevada rights: privacy@[YOUR DOMAIN].com

### Virginia, Colorado, Connecticut, Utah Residents
These states have enacted comprehensive privacy laws. Contact privacy@[YOUR DOMAIN].com to exercise your rights.

---

## Acknowledgment

By using the Platform, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.

**For Healthcare Providers:** You are responsible for obtaining any necessary patient consents or authorizations required by law before using this Platform to process patient data.

---

**Document Version:** 1.0
**HIPAA Compliant:** Yes
**GDPR Compliant:** Yes
**Legal Review Required:** Yes - Before Launch
