# Medical Disclaimer

**Platform:** Musculoskeletal Range of Motion (ROM) Measurement Platform
**Provider:** [YOUR COMPANY NAME]
**Last Updated:** February 9, 2026

---

## IMPORTANT: READ CAREFULLY BEFORE USING THIS PLATFORM

This Medical Disclaimer governs the clinical use of the Musculoskeletal ROM Measurement Platform. By using this Platform, healthcare professionals acknowledge and accept the limitations, warnings, and professional responsibilities outlined below.

---

## 1. Medical Device Classification

### Current Status: [OPTION A - Non-Device / OPTION B - FDA-Cleared Device]

**OPTION A: NOT A MEDICAL DEVICE (Recommended for MVP)**

This Platform is **NOT** a medical device as defined by the U.S. Food and Drug Administration (FDA). Specifically:

- **Not intended for diagnosis:** The Platform does not diagnose, treat, cure, or prevent any disease or medical condition
- **Clinical assessment tool:** Designed to assist licensed healthcare professionals in documenting range of motion measurements
- **Not diagnostic:** Measurements and AI-generated interpretations are advisory only and require independent clinical verification
- **Healthcare professional use only:** Intended for use by trained clinicians as part of a comprehensive clinical examination

**Regulatory Basis:** This Platform qualifies for FDA enforcement discretion under the following criteria:
- Does not analyze patient-specific data to diagnose or treat disease
- Provides general clinical guidance, not patient-specific diagnoses
- Explicitly requires healthcare professional review and interpretation
- Does not replace or substitute for clinical judgment

**OR**

**OPTION B: FDA-CLEARED MEDICAL DEVICE (Future Path)**

This Platform is an FDA-cleared Class II medical device under 21 CFR 890.1925 (Goniometer).

- **510(k) Number:** K###### (Substantially Equivalent to predicate device K######)
- **Intended Use:** Non-invasive measurement of joint range of motion for clinical assessment
- **Indications for Use:** Adult patients (18+ years) undergoing musculoskeletal evaluation by licensed healthcare professionals
- **Device Class:** Class II (moderate risk, special controls)
- **Prescription Use:** Rx Only - Available only by prescription from a licensed healthcare provider

**Contraindications:** [List specific contraindications if FDA-cleared]
**Warnings:** [List FDA-mandated warnings if FDA-cleared]

---

## 2. Clinical Scope and Limitations

### 2.1 Intended Clinical Use

The Platform is intended to:
- **Measure range of motion** of major joints (shoulder, elbow, wrist, hip, knee, ankle)
- **Document clinical findings** for patient records and longitudinal tracking
- **Generate clinical reports** summarizing ROM measurements with normative comparisons
- **Provide advisory recommendations** for special orthopedic tests based on ROM deficits

### 2.2 Limitations of Use

**The Platform is NOT intended to:**
- Replace physical examination or clinical assessment
- Diagnose specific medical conditions or pathologies
- Determine treatment plans or medical management
- Replace manual goniometry in all clinical situations
- Function without healthcare professional oversight

### 2.3 Known Clinical Limitations

Users must be aware of the following limitations:

**Measurement Accuracy:**
- **Typical Accuracy:** ±5° mean absolute error compared to manual goniometry
- **Confidence Intervals:** Measurements include confidence scores (0-1.0) indicating reliability
- **Patient Factors:** Accuracy may be reduced in patients with:
  - Extreme obesity (BMI >40)
  - Significant scar tissue or deformity
  - Inability to achieve full range of motion
  - Uncooperative behavior or poor positioning

**Environmental Factors:**
- **Lighting:** Poor lighting conditions may affect computer vision accuracy
- **Camera Positioning:** Suboptimal camera angles reduce measurement reliability
- **Clothing:** Loose or bulky clothing may interfere with landmark detection
- **Movement:** Patient instability or tremor may affect measurements

**Computer Vision Limitations:**
- **Landmark Detection:** The system may fail to detect body landmarks in:
  - Extreme body positions
  - Partial body occlusion
  - Poor contrast between patient and background
- **False Positives/Negatives:** The system may incorrectly identify body landmarks in complex scenes

**AI-Generated Interpretation Limitations:**
- **General Guidance Only:** AI recommendations are based on general clinical data and may not apply to specific patients
- **Not Personalized:** AI does not account for patient-specific factors (comorbidities, surgical history, medications)
- **Algorithmic Bias:** AI training data may not represent all populations equally
- **Requires Verification:** All AI-generated content must be independently verified by the clinician

---

## 3. Healthcare Professional Responsibilities

### 3.1 Clinical Judgment Requirement

**CRITICAL:** The healthcare professional using this Platform retains full responsibility for:

- **Clinical decision-making:** All treatment decisions, diagnoses, and patient management
- **Data verification:** Independent verification of all measurements and AI recommendations
- **Patient safety:** Ensuring appropriate use of the Platform for each patient
- **Informed consent:** Obtaining patient consent for ROM assessment and data processing
- **Professional liability:** All malpractice and liability exposure remains with the clinician

**The Platform is a tool to assist clinical judgment, not replace it.**

### 3.2 Required Clinical Competencies

Users of this Platform must:
- Hold a valid healthcare professional license (PT, OT, MD, DO, DC, etc.)
- Be trained in musculoskeletal examination and range of motion assessment
- Understand normal and pathological joint mechanics
- Be capable of interpreting ROM measurements in clinical context
- Know when manual goniometry or other assessment methods are more appropriate

### 3.3 Contraindications for Platform Use

Do NOT use this Platform in the following situations:

**Absolute Contraindications:**
- **Acute fractures or dislocations:** Use only after fracture healing and medical clearance
- **Severe joint instability:** Risk of injury with active ROM testing
- **Post-operative patients:** Only use per surgeon's protocol (typically >6 weeks post-op)
- **Acute inflammatory conditions:** Avoid ROM testing during active flare-ups

**Relative Contraindications (Use Clinical Judgment):**
- **Severe pain:** May limit patient ability to achieve full ROM
- **Recent trauma:** Wait until acute inflammation subsides
- **Neurological impairment:** May affect patient ability to cooperate
- **Pediatric patients (<18 years):** Limited validation data in children

### 3.4 When to Use Manual Goniometry Instead

Consider manual goniometry or other assessment methods when:
- High precision required for surgical planning (±1° accuracy needed)
- Patient factors prevent reliable computer vision (body habitus, scarring)
- Legal documentation required (workers' compensation, disability evaluations)
- Research studies requiring gold-standard measurements
- Computer vision confidence score <0.75

---

## 4. AI-Powered Features: Special Warnings

### 4.1 AI Clinical Interpretation

**Purpose:** Provides advisory clinical interpretation based on ROM deficits and suggests relevant special orthopedic tests.

**Limitations:**
- **Not diagnostic:** AI does NOT diagnose conditions (e.g., "rotator cuff tear," "meniscal injury")
- **General recommendations:** Based on clinical literature, not patient-specific data
- **Requires context:** Clinician must consider patient history, symptoms, physical exam findings
- **May miss rare conditions:** AI trained on common pathologies; rare conditions may not be identified

**User Responsibility:**
- Independently verify all AI-generated recommendations
- Perform special tests only if clinically indicated
- Interpret results in context of full clinical presentation
- Do not rely solely on AI output for clinical decisions

### 4.2 AI Training Data and Bias

**Training Data Sources:**
- Published clinical literature on ROM normative values (AMA, AAOS guidelines)
- De-identified ROM measurement datasets
- Clinical special test databases

**Potential Biases:**
- **Age bias:** Normative values based primarily on adults 18-65 years
- **Ethnic/racial bias:** Limited representation of diverse populations in training data
- **Gender bias:** May not account for sex-based differences in flexibility
- **Activity level bias:** Normative values may not apply to elite athletes or sedentary individuals

**Mitigation:** Users should adjust clinical interpretation based on patient demographics and activity level.

### 4.3 AI Model Versioning and Updates

- **Algorithm Version:** Displayed with each measurement (e.g., "v1.0")
- **Model Updates:** We may update AI models to improve accuracy; changes will be documented in release notes
- **Backward Compatibility:** Older measurements remain valid but may have different AI recommendations if re-analyzed with newer models

---

## 5. Patient Safety Warnings

### 5.1 Risk of Injury During ROM Testing

**WARNING:** Active range of motion testing may cause injury if performed improperly.

**Risks include:**
- Muscle strain or ligament sprain
- Exacerbation of existing injuries
- Acute pain or discomfort
- Cardiovascular stress (in elderly or deconditioned patients)

**Mitigation:**
- Obtain thorough medical history before ROM testing
- Screen for contraindications
- Instruct patients to stop if they experience sharp pain
- Monitor patients for adverse reactions during testing

### 5.2 Data Privacy and Security Risks

**WARNING:** Electronic health data is subject to cybersecurity risks.

**Risks include:**
- Unauthorized access to patient data (data breaches)
- Interception of data during transmission (man-in-the-middle attacks)
- Loss of data due to technical failures

**Mitigation:**
- We use industry-standard encryption (AES-256 at rest, TLS 1.3 in transit)
- Regular security audits and penetration testing
- HIPAA-compliant data handling procedures
- See Privacy Policy for full details

**User Responsibility:**
- Use strong passwords and enable multi-factor authentication
- Do not access the Platform on public or unsecured Wi-Fi
- Log out after each session
- Report suspected security incidents immediately

### 5.3 Video/Image Capture Privacy

**WARNING:** Video and image data may reveal patient identity.

**Privacy Considerations:**
- Video data is processed locally on the device (browser-side computer vision)
- By default, video is NOT uploaded to servers (processed in real-time and discarded)
- If video storage is enabled (optional feature), videos are encrypted and access-controlled
- Patients must consent to video capture and storage

**User Responsibility:**
- Obtain patient consent before video capture
- Inform patients if video will be stored
- Ensure camera does not capture identifying background elements (whiteboards, other patients)

---

## 6. Technical Limitations and System Requirements

### 6.1 Supported Environments

**Tested Configurations:**
- **Browsers:** Chrome 100+, Edge 100+, Safari 15+ (desktop and mobile)
- **Operating Systems:** Windows 10+, macOS 11+, iOS 14+, Android 10+
- **Camera:** Minimum 720p resolution, 30 FPS

**Unsupported Configurations:**
- Internet Explorer (not supported)
- Browsers with JavaScript disabled
- Cameras <720p resolution
- Extremely low-light environments (<50 lux)

### 6.2 Internet Connectivity

**Requirements:**
- **Minimum:** 5 Mbps download, 1 Mbps upload
- **Recommended:** 25 Mbps download, 5 Mbps upload (for dual-camera mode)

**Offline Use:** Not supported. Internet connection required for:
- User authentication
- Data synchronization
- AI interpretation (requires server-side processing)

### 6.3 System Downtime and Availability

**Service Level Objective:** 99% uptime (excluding planned maintenance)

**Planned Maintenance:**
- Scheduled during off-peak hours (typically 2-4 AM ET)
- Notice provided 48 hours in advance
- Expected duration <2 hours

**Unplanned Outages:**
- We strive for rapid resolution (<1 hour for critical issues)
- Status updates posted at status.[YOUR DOMAIN].com
- Email notifications for extended outages

**User Impact:** During outages:
- Platform unavailable (no ROM measurements)
- Existing data remains secure and accessible post-restoration
- No data loss expected (automatic backups)

---

## 7. Research and Publication Use

### 7.1 Research Use Restrictions

**Platform data may be used for research ONLY with:**
- Institutional Review Board (IRB) approval
- Patient informed consent (HIPAA authorization if PHI is used)
- Data Use Agreement (DUA) executed with [YOUR COMPANY NAME]

**Prohibited Research Uses:**
- Publication of identifiable patient data
- Sharing of data outside approved research team
- Commercial use of research findings without license

### 7.2 De-Identified Data for Product Improvement

We may use de-identified data (HIPAA Safe Harbor or Expert Determination method) to:
- Improve computer vision algorithms
- Validate AI clinical recommendations
- Publish aggregate statistics (no patient-level data)

**Opt-Out:** Contact privacy@[YOUR DOMAIN].com to opt out of de-identified data use.

---

## 8. Reporting Adverse Events and Malfunctions

### 8.1 Adverse Event Definition

An **adverse event** is any undesirable experience associated with use of the Platform, including:
- Patient injury during ROM testing (falls, strains, cardiovascular events)
- Incorrect measurements leading to clinical errors
- Data breaches exposing patient information
- System malfunctions causing data loss

### 8.2 Reporting Procedures

**Report adverse events immediately:**
- **Email:** safety@[YOUR DOMAIN].com
- **Phone:** [YOUR SAFETY HOTLINE] (24/7)
- **Online Form:** [YOUR WEBSITE]/report-adverse-event

**Information to Include:**
- Date and time of event
- Description of what happened
- Patient outcome (if applicable)
- System/algorithm version number
- Your contact information

**[If FDA-Cleared Device]:** We will report serious adverse events to the FDA within 30 days per 21 CFR Part 803 (Medical Device Reporting).

### 8.3 Product Complaints and Technical Issues

For non-safety-related issues (bugs, performance problems, feature requests):
- **Email:** support@[YOUR DOMAIN].com
- **In-Platform:** Use the "Report Issue" button

---

## 9. Professional Liability and Insurance

### 9.1 Malpractice Liability

**The healthcare professional using this Platform retains full malpractice liability** for patient care decisions, regardless of Platform output.

**Examples of Professional Liability:**
- Misdiagnosis based on incorrect interpretation of ROM data
- Failure to perform additional diagnostic testing when indicated
- Treatment complications arising from ROM-based clinical decisions
- Patient injury during ROM testing

**Platform Provider Liability:**
- [YOUR COMPANY NAME] is NOT liable for clinical decisions made by users
- Professional liability insurance should cover Platform-assisted assessments
- See Terms of Service for full liability limitations

### 9.2 Insurance Recommendations

**Users should ensure their professional liability insurance covers:**
- Use of digital health tools and AI-assisted decision support
- Telemedicine or remote patient assessment (if applicable)
- Computer-based ROM measurement (vs. traditional manual goniometry)

**Consult your insurance provider** to confirm coverage before using the Platform clinically.

---

## 10. Changes to This Disclaimer

We may update this Medical Disclaimer to reflect:
- Changes in medical device regulatory status
- New clinical validation data
- Updated AI algorithms or features
- Regulatory guidance or legal requirements

**Notice of Changes:**
- Updated disclaimer posted on website with "Last Updated" date
- Material changes announced via email to registered users
- Continued use after changes constitutes acceptance

---

## 11. Contact Information

**[YOUR COMPANY NAME]**
[YOUR ADDRESS]

**General Inquiries:** support@[YOUR DOMAIN].com
**Safety/Adverse Events:** safety@[YOUR DOMAIN].com
**Clinical Questions:** clinical@[YOUR DOMAIN].com
**Regulatory/Compliance:** regulatory@[YOUR DOMAIN].com

---

## Acknowledgment and Acceptance

**By using this Platform, healthcare professionals acknowledge:**

✓ They have read and understood this Medical Disclaimer
✓ They understand the Platform's limitations and clinical scope
✓ They will independently verify all measurements and AI recommendations
✓ They accept full professional responsibility for patient care decisions
✓ They will not use the Platform outside its intended clinical use
✓ They will report adverse events and technical malfunctions promptly

**This disclaimer does not constitute medical advice. Consult clinical guidelines, peer-reviewed literature, and specialist colleagues for specific patient management decisions.**

---

**Document Version:** 1.0
**Clinical Review Required:** Yes - By licensed healthcare professional
**Legal Review Required:** Yes - Before Launch
**FDA Review Required:** [Yes if pursuing 510(k) pathway / No if non-device]

---

**CRITICAL SAFETY STATEMENTS:**

⚠️ **FOR PROFESSIONAL USE ONLY**
⚠️ **NOT A SUBSTITUTE FOR CLINICAL JUDGMENT**
⚠️ **CLINICIAN MUST INDEPENDENTLY VERIFY ALL MEASUREMENTS**
⚠️ **REPORT ADVERSE EVENTS IMMEDIATELY**
⚠️ **PATIENT CONSENT REQUIRED FOR VIDEO CAPTURE**
