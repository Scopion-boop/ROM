# Incident Response Playbook

**Organization:** [YOUR COMPANY NAME]
**Platform:** PhysioLens
**Version:** 1.0
**Last Updated:** February 9, 2026
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Overview](#overview)
2. [Incident Classification](#incident-classification)
3. [Roles and Responsibilities](#roles-and-responsibilities)
4. [Incident Response Procedures](#incident-response-procedures)
5. [Specific Incident Scenarios](#specific-incident-scenarios)
6. [Post-Incident Activities](#post-incident-activities)
7. [Communication Templates](#communication-templates)

---

## 1. Overview

### 1.1 Purpose

This Incident Response Playbook provides standardized procedures for detecting, responding to, and recovering from security incidents, system outages, and data breaches affecting the ROM Measurement Platform.

### 1.2 Scope

This playbook covers:
- **Security incidents:** Unauthorized access, data breaches, cyberattacks
- **System outages:** Service disruptions, infrastructure failures
- **Data incidents:** Data loss, corruption, or accidental disclosure
- **Compliance violations:** HIPAA breaches, regulatory non-compliance

### 1.3 Objectives

- **Rapid detection** and containment of incidents
- **Minimize impact** on patient data, users, and operations
- **Meet regulatory requirements** (HIPAA 72-hour breach notification)
- **Learn and improve** through post-incident analysis

---

## 2. Incident Classification

### 2.1 Severity Levels

| Severity | Definition | Response Time | Escalation |
|----------|-----------|---------------|------------|
| **Sev1 (Critical)** | Data breach affecting PHI, complete service outage, active cyberattack | **Immediate** (<15 min) | CEO, Legal, All hands |
| **Sev2 (High)** | Partial service degradation, suspected security incident, compliance violation | **<1 hour** | CTO, Security Lead |
| **Sev3 (Medium)** | Minor service issues, performance degradation, isolated errors | **<4 hours** | On-call Engineer |
| **Sev4 (Low)** | Non-critical bugs, documentation issues, feature requests | **<1 business day** | Product Team |

### 2.2 Incident Categories

#### Security Incidents
- **Data Breach:** Unauthorized access to PHI/PII
- **Ransomware:** System infected with ransomware
- **Account Compromise:** Unauthorized access to user accounts
- **DDoS Attack:** Distributed denial of service attack
- **Insider Threat:** Malicious or negligent employee action

#### System Incidents
- **Service Outage:** Platform completely unavailable
- **Database Failure:** Database connectivity or corruption issues
- **API Degradation:** Slow or failing API endpoints
- **Infrastructure Failure:** AWS services down, network issues

#### Data Incidents
- **Data Loss:** Accidental deletion of patient data
- **Data Corruption:** Database integrity issues
- **Accidental Disclosure:** PHI sent to wrong recipient
- **Backup Failure:** Backup process not working

#### Compliance Incidents
- **HIPAA Violation:** Breach of HIPAA privacy or security rules
- **BAA Violation:** Unauthorized PHI disclosure to business associate
- **Access Control Failure:** Inadequate user permissions

---

## 3. Roles and Responsibilities

### 3.1 Incident Response Team (IRT)

| Role | Responsibilities | Contact |
|------|-----------------|---------|
| **Incident Commander (IC)** | Overall incident coordination, decision authority | [NAME], [PHONE] |
| **Security Lead** | Security investigation, containment, forensics | [NAME], [PHONE] |
| **Technical Lead** | System restoration, root cause analysis | [NAME], [PHONE] |
| **Communications Lead** | Internal/external communications, customer updates | [NAME], [PHONE] |
| **Legal Counsel** | Legal implications, regulatory reporting | [LAW FIRM], [PHONE] |
| **Compliance Officer** | HIPAA/regulatory compliance, breach determination | [NAME], [PHONE] |

### 3.2 Escalation Path

```
Sev4 → On-call Engineer
Sev3 → Engineering Manager → CTO
Sev2 → CTO → Security Lead → Legal
Sev1 → CEO + All IRT Members (immediate)
```

### 3.3 On-Call Schedule

- **Primary On-Call:** [NAME], [PHONE]
- **Secondary On-Call:** [NAME], [PHONE]
- **Rotation:** Weekly, starting Monday 9 AM ET
- **Handoff:** Sunday 8 PM ET

---

## 4. Incident Response Procedures

### 4.1 Detection and Alerting

**Automated Detection:**
- CloudWatch alarms (error rates, latency, health checks)
- Security Information and Event Management (SIEM) alerts
- Database query monitoring
- Failed login attempt thresholds

**Manual Detection:**
- User reports via support@[YOUR DOMAIN].com
- Team member observations
- External security researcher reports

### 4.2 Incident Response Lifecycle

```
Detection → Triage → Containment → Eradication → Recovery → Post-Incident Review
```

### 4.3 Phase 1: Detection and Triage (0-15 minutes)

**Actions:**
1. **Receive alert** via PagerDuty, email, or phone
2. **Acknowledge incident** in incident tracking system (Jira, ServiceNow, or Slack)
3. **Assess severity** using classification matrix
4. **Notify Incident Commander** (Sev1/Sev2)
5. **Create incident channel** (Slack: `#incident-YYYY-MM-DD-###`)

**Decision Points:**
- Is this a real incident or false positive?
- What is the severity level?
- Is PHI affected? (If yes → HIPAA breach procedures)
- Do we need to escalate immediately?

### 4.4 Phase 2: Containment (15 min - 2 hours)

**Goals:**
- Stop the incident from spreading
- Prevent further data loss or damage
- Preserve evidence for forensics

**Actions:**
1. **Isolate affected systems**
   - Block malicious IP addresses (security groups)
   - Disable compromised user accounts
   - Shut down affected servers (if necessary)

2. **Snapshot evidence**
   - Take EC2 snapshots before making changes
   - Preserve logs (CloudWatch, access logs, database logs)
   - Document timeline of events

3. **Assess scope**
   - How many users affected?
   - How much data exposed/lost?
   - What systems are impacted?

**Example Commands:**
```bash
# Block malicious IP in security group
aws ec2 revoke-security-group-ingress --group-id sg-xxx --protocol tcp --port 443 --cidr <bad-ip>/32

# Disable user account
aws cognito-idp admin-disable-user --user-pool-id xxx --username <compromised-user>

# Snapshot ECS task for forensics
aws ec2 create-snapshot --volume-id vol-xxx --description "Incident evidence YYYY-MM-DD"
```

### 4.5 Phase 3: Eradication (2-8 hours)

**Goals:**
- Remove the root cause of the incident
- Patch vulnerabilities
- Restore system integrity

**Actions:**
1. **Identify root cause**
   - Review logs and forensic evidence
   - Check for malware or backdoors
   - Identify exploited vulnerabilities

2. **Remove threat**
   - Delete malware or malicious code
   - Revoke compromised credentials
   - Patch security vulnerabilities

3. **Verify cleanliness**
   - Run antivirus/malware scans
   - Review access logs for suspicious activity
   - Confirm no persistence mechanisms remain

**Security Patches:**
```bash
# Rotate compromised secrets
aws secretsmanager rotate-secret --secret-id rom/jwt-secret

# Update IAM policies to remove excessive permissions
aws iam update-assume-role-policy --role-name romApiTaskRole --policy-document file://new-policy.json

# Deploy patched application code
./deploy.sh --environment production --version v1.2.3-hotfix
```

### 4.6 Phase 4: Recovery (8-24 hours)

**Goals:**
- Restore normal operations
- Validate system functionality
- Monitor for recurrence

**Actions:**
1. **Restore services**
   - Bring systems back online in controlled manner
   - Test functionality before full restoration
   - Monitor closely for anomalies

2. **Validate data integrity**
   - Run database integrity checks
   - Compare backups to current state
   - Verify no data corruption

3. **Re-enable access**
   - Restore user accounts (with password resets if compromised)
   - Remove temporary access restrictions
   - Resume normal operations

4. **Enhanced monitoring**
   - Increase log verbosity temporarily
   - Add specific alerts for incident recurrence
   - Watch for related activity

**Recovery Checklist:**
- [ ] All affected systems restored
- [ ] Data integrity verified
- [ ] User access restored
- [ ] Monitoring confirms normal operation
- [ ] No evidence of continued compromise
- [ ] Users notified of restoration

### 4.7 Phase 5: Post-Incident Review (24-72 hours)

**Goals:**
- Document lessons learned
- Improve detection and response
- Implement preventive measures

**Actions:**
1. **Conduct post-mortem**
   - Timeline of events
   - Root cause analysis
   - What went well / what didn't
   - Action items for improvement

2. **Update documentation**
   - This playbook
   - Runbooks
   - Monitoring alerts

3. **Implement improvements**
   - Security patches
   - Process changes
   - Additional monitoring

**Post-Mortem Template:** See Section 6.3

---

## 5. Specific Incident Scenarios

### 5.1 Scenario: Data Breach (Sev1)

**Indicators:**
- CloudWatch alarm: "Unusual data export volume"
- SIEM alert: "Multiple failed authentication attempts from foreign IP"
- User report: "I can see another clinic's patient data"

**Response:**

**1. Immediate Actions (0-15 min)**
```bash
# Disable affected user accounts
aws cognito-idp admin-disable-user --user-pool-id xxx --username <user>

# Block suspicious IPs
aws ec2 revoke-security-group-ingress --group-id sg-xxx --protocol tcp --port 443 --cidr <ip>/32

# Enable detailed CloudWatch logging
aws logs put-retention-policy --log-group-name /ecs/rom-api --retention-in-days 90
```

**2. Assess Scope (15-30 min)**
- Query audit logs for affected patients:
```sql
SELECT DISTINCT patient_id, accessed_by, accessed_at
FROM audit_events
WHERE event_type = 'data.accessed'
AND accessed_at > NOW() - INTERVAL '24 hours'
AND accessed_by IN (<suspected-accounts>);
```
- Count affected individuals
- Determine if PHI was exported/downloaded

**3. Containment (30-60 min)**
- Rotate all JWT secrets
- Force all users to re-authenticate
- Temporarily disable API endpoints if necessary

**4. Notification (72 hours)**
- **If ≥500 individuals affected:** Notify HHS and media
- **If <500 individuals affected:** Notify individuals within 60 days
- See Breach Notification Procedure (separate document)

**5. Remediation**
- Implement additional access controls
- Add data loss prevention (DLP) rules
- Enhance audit logging

---

### 5.2 Scenario: Ransomware Attack (Sev1)

**Indicators:**
- Files encrypted with `.encrypted` extension
- Ransom note displayed on servers
- Database inaccessible

**Response:**

**1. Immediate Actions (0-5 min)**
```bash
# Isolate all affected systems
aws ec2 modify-instance-attribute --instance-id i-xxx --no-source-dest-check

# Shutdown affected instances (preserve for forensics)
aws ec2 stop-instances --instance-ids i-xxx i-yyy
```

**2. Do NOT Pay Ransom**
- FBI and CISA recommend against paying ransoms
- No guarantee of data recovery
- Funds criminal activity

**3. Restore from Backups**
```bash
# Restore RDS from snapshot (latest clean backup)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier rom-restored \
  --db-snapshot-identifier rom-backup-YYYY-MM-DD

# Deploy clean application from trusted source
./deploy.sh --environment production --from-clean-source
```

**4. Report to Authorities**
- FBI Internet Crime Complaint Center (IC3): https://www.ic3.gov/
- CISA: report@cisa.gov

---

### 5.3 Scenario: Database Failure (Sev1/Sev2)

**Indicators:**
- CloudWatch alarm: "RDS CPU 100%"
- API errors: "Connection timeout to database"
- Users cannot load patient data

**Response:**

**1. Check RDS Status**
```bash
aws rds describe-db-instances --db-instance-identifier rom-production-db \
  --query "DBInstances[0].DBInstanceStatus"
```

**2. Immediate Actions**
```bash
# Check for long-running queries
# Connect to RDS and run:
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 minutes';

# Kill problematic queries
SELECT pg_terminate_backend(pid);

# Scale up RDS instance if needed
aws rds modify-db-instance --db-instance-identifier rom-production-db \
  --db-instance-class db.m5.xlarge --apply-immediately
```

**3. Failover to Standby (Multi-AZ)**
```bash
aws rds reboot-db-instance --db-instance-identifier rom-production-db --force-failover
```

**4. If Corruption Detected**
```bash
# Restore from latest backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier rom-production-db \
  --target-db-instance-identifier rom-restored \
  --restore-time $(date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%SZ")
```

---

### 5.4 Scenario: Service Outage (Sev2)

**Indicators:**
- Status page reports: "Platform unavailable"
- CloudWatch alarm: "ALB Healthy Host Count = 0"
- Users cannot log in

**Response:**

**1. Check Service Health**
```bash
# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <arn>

# Check ECS service status
aws ecs describe-services --cluster rom-production-cluster --services rom-api-service

# Check recent deployments
aws ecs list-task-definitions --family-prefix rom-api --max-items 5
```

**2. Common Fixes**
```bash
# Restart ECS service (force new deployment)
aws ecs update-service --cluster rom-production-cluster \
  --service rom-api-service --force-new-deployment

# Rollback to previous task definition
aws ecs update-service --cluster rom-production-cluster \
  --service rom-api-service --task-definition rom-api:42

# Scale up capacity temporarily
aws ecs update-service --cluster rom-production-cluster \
  --service rom-api-service --desired-count 4
```

**3. Monitor Recovery**
```bash
# Watch service stabilize
watch -n 5 "aws ecs describe-services --cluster rom-production-cluster \
  --services rom-api-service --query 'services[0].runningCount'"
```

---

### 5.5 Scenario: Accidental PHI Disclosure (Sev1)

**Indicators:**
- User report: "I accidentally emailed PHI to wrong recipient"
- Support ticket: "Export went to wrong email address"

**Response:**

**1. Immediate Actions (0-10 min)**
- Document exact details: What PHI? Sent where? When?
- Attempt to recall email (if possible)
- Contact recipient to request deletion

**2. Assess Scope (10-30 min)**
- How many patients affected?
- What specific PHI disclosed?
- Is recipient covered by BAA? (If yes, lower risk)

**3. Risk Assessment**
```
Low Risk:
- PHI sent to another clinician in same organization
- Recipient covered by existing BAA
- Limited patient identifiers disclosed

High Risk:
- PHI sent to external, unauthorized recipient
- Sensitive data (diagnosis, SSN, payment info)
- Large volume of patients affected
```

**4. Notification Requirements**
- **If Low Risk:** May not meet HIPAA "breach" threshold (document risk assessment)
- **If High Risk:** HIPAA breach notification required (see separate procedure)

**5. Remediation**
- Retrain user on data handling procedures
- Implement technical controls (e.g., recipient validation)
- Review similar incidents for patterns

---

## 6. Post-Incident Activities

### 6.1 Incident Documentation

**Required Information:**
- Incident ID and severity
- Date/time of detection and resolution
- Root cause analysis
- Impact assessment (users, patients, data)
- Timeline of events
- Actions taken
- Lessons learned

**Documentation Location:** Confluence → Incident Reports → [Incident-YYYY-MM-DD]

### 6.2 Reporting Requirements

**Internal Reporting:**
- All Sev1/Sev2 incidents: Report to CEO within 24 hours
- Monthly incident summary to board of directors

**External Reporting:**
- **HIPAA breaches:** HHS within 60 days (or immediately if ≥500 individuals)
- **SEC reporting:** If publicly traded, material incidents require 8-K filing
- **Cyber insurance:** Notify carrier within policy timeframe (typically 24-48 hours)

### 6.3 Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Incident ID:** INC-YYYY-MM-DD-###
**Severity:** Sev1 / Sev2 / Sev3 / Sev4
**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Incident Commander:** [Name]

## Summary
[Brief description of incident]

## Impact
- Users Affected: [number]
- Patients Affected: [number]
- Downtime: [duration]
- Data Loss: [yes/no, scope]

## Timeline
| Time | Event |
|------|-------|
| 10:15 | Alert received: RDS CPU 100% |
| 10:20 | Incident declared Sev2 |
| 10:25 | Identified long-running query |
| ... | ... |

## Root Cause
[Detailed explanation]

## Resolution
[What fixed the issue]

## What Went Well
- Rapid detection (5 minutes)
- Clear escalation path
- Effective communication

## What Went Wrong
- Lack of automated query timeout
- Insufficient monitoring alerts
- Outdated runbook

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Implement query timeout | Alice | 2026-02-15 | P0 |
| Add RDS query monitoring | Bob | 2026-02-20 | P1 |
| Update runbook | Carol | 2026-02-10 | P2 |

## Lessons Learned
[Key takeaways]
```

---

## 7. Communication Templates

### 7.1 Internal Incident Notification (Slack)

```
🚨 **INCIDENT DECLARED: Sev1 - Data Breach**

**Incident ID:** INC-2026-02-09-001
**Severity:** Sev1 (Critical)
**Status:** Ongoing
**Incident Commander:** Alice Smith (@alice)

**Summary:**
Unauthorized access to patient data detected. Approximately 150 patient records potentially affected.

**Impact:**
- Platform remains operational
- No service disruption
- PHI may have been accessed by unauthorized party

**Next Steps:**
- Containing breach (blocking IP, disabling accounts)
- Assessing full scope of exposure
- Preparing breach notifications

**Incident Channel:** #incident-2026-02-09-001
**Status Updates:** Every 30 minutes

**DO NOT discuss publicly or on social media.**
```

### 7.2 Customer Communication (Email - Service Outage)

```
Subject: [Action Required] Platform Service Disruption - Resolved

Dear [Customer],

We experienced a service disruption on [Date] from [Time] to [Time] (ET) that affected access to the ROM Measurement Platform.

**What Happened:**
A database connectivity issue caused the Platform to be temporarily unavailable for approximately [X hours].

**Current Status:**
✅ RESOLVED - All services restored as of [Time]
✅ No patient data was lost or compromised
✅ All user accounts remain secure

**Impact:**
- Platform was unavailable during the outage window
- No data loss occurred
- Ongoing assessments were not affected

**What We're Doing:**
We have implemented additional monitoring and failover procedures to prevent recurrence.

**Questions:**
If you have concerns or questions, please contact support@[YOUR DOMAIN].com or call [PHONE].

We apologize for the inconvenience and appreciate your patience.

Sincerely,
[Your Name]
[Title], [Company Name]
```

### 7.3 Breach Notification (See BREACH_NOTIFICATION_PROCEDURE.md)

---

## 8. Contact Information

**Incident Response Team:**
- **Incident Commander:** [NAME], [PHONE], [EMAIL]
- **Security Lead:** [NAME], [PHONE], [EMAIL]
- **Technical Lead:** [NAME], [PHONE], [EMAIL]

**External Contacts:**
- **Legal Counsel:** [LAW FIRM], [PHONE]
- **Cyber Insurance:** [CARRIER], Policy #[NUMBER], [PHONE]
- **FBI Cyber Division:** (855) 292-3937
- **CISA:** report@cisa.gov, (888) 282-0870

**Escalation:**
- **CEO:** [NAME], [PHONE]
- **Board Chair:** [NAME], [PHONE] (Sev1 only, if CEO unavailable)

---

## 9. Playbook Maintenance

**Review Schedule:** Quarterly (January, April, July, October)
**Owner:** Security Lead
**Approver:** CTO

**Next Review Date:** [YYYY-MM-DD]

**Version History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-09 | Initial creation | [Your Name] |

---

**This playbook is confidential and for internal use only. Do not share externally without approval.**
