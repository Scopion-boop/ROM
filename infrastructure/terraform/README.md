# Terraform Infrastructure for ROM Platform

This directory contains Terraform configuration for deploying the ROM Platform to AWS with production-grade infrastructure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud (us-east-1)                   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              VPC (10.0.0.0/16)                     │    │
│  │                                                    │    │
│  │  ┌──────────────────┐  ┌──────────────────┐      │    │
│  │  │  Public Subnet   │  │  Public Subnet   │      │    │
│  │  │   (us-east-1a)   │  │   (us-east-1b)   │      │    │
│  │  │                  │  │                  │      │    │
│  │  │  ┌──────────┐    │  │    ┌──────────┐ │      │    │
│  │  │  │   ALB    │◄───┼──┼────│   ALB    │ │      │    │
│  │  │  └────┬─────┘    │  │    └────┬─────┘ │      │    │
│  │  └───────┼──────────┘  └─────────┼───────┘      │    │
│  │          │                       │              │    │
│  │          ▼                       ▼              │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │ Private Subnet   │  │ Private Subnet   │    │    │
│  │  │   (us-east-1a)   │  │   (us-east-1b)   │    │    │
│  │  │                  │  │                  │    │    │
│  │  │  ┌──────────┐    │  │    ┌──────────┐ │    │    │
│  │  │  │ ECS Tasks│    │  │    │ ECS Tasks│ │    │    │
│  │  │  │  (API)   │    │  │    │  (API)   │ │    │    │
│  │  │  └────┬─────┘    │  │    └────┬─────┘ │    │    │
│  │  │       │          │  │         │       │    │    │
│  │  │       └──────────┼──┼─────────┘       │    │    │
│  │  │                  │  │                  │    │    │
│  │  │       ┌──────────┴──┴──────────┐      │    │    │
│  │  │       │  RDS PostgreSQL (Multi-AZ) │     │    │
│  │  │       │  (Encrypted with KMS)      │     │    │
│  │  │       └────────────────────────────┘     │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Other Services:                                        │
│  - ECR (Docker Images)                                  │
│  - S3 (Backups)                                         │
│  - Secrets Manager (JWT, DB Credentials)                │
│  - CloudWatch (Logs, Metrics, Alarms)                   │
│  - KMS (Encryption Keys)                                │
└─────────────────────────────────────────────────────────┘
```

## Infrastructure Components

### Networking (vpc.tf)

- **VPC:** 10.0.0.0/16 with DNS support
- **Public Subnets:** 2 AZs for Application Load Balancer
- **Private Subnets:** 2 AZs for ECS tasks and RDS database
- **NAT Gateways:** One per AZ for private subnet internet access
- **VPC Flow Logs:** Security monitoring and compliance

### Database (rds.tf)

- **RDS PostgreSQL 15:** Multi-AZ deployment for HA
- **Instance Type:** db.t3.medium (2 vCPU, 4 GB RAM)
- **Storage:** 100 GB encrypted with AWS KMS
- **Backups:** Automated daily backups (7-day retention)
- **Security:** Private subnet, security groups, encryption at rest/transit

### Compute (ecs.tf)

- **ECS Cluster:** Fargate launch type (serverless)
- **API Service:** 2 tasks (512 CPU, 1024 MB memory each)
- **Auto Scaling:** Target tracking based on CPU/memory
- **Health Checks:** ALB health checks + ECS health checks

### Load Balancing (alb.tf)

- **Application Load Balancer:** Internet-facing
- **HTTPS Listener:** Port 443 with SSL certificate
- **HTTP Redirect:** Port 80 → 443
- **Target Group:** Health checks on /api/health

### Storage (s3.tf)

- **Backup Bucket:** Versioned, encrypted
- **Lifecycle Policy:** Transition to Glacier after 90 days
- **Public Access:** Blocked

### Monitoring (cloudwatch.tf)

- **Log Groups:** API logs, VPC flow logs
- **Retention:** 90 days
- **Alarms:** CPU, memory, error rates
- **Dashboards:** Application metrics

### Secrets (secrets.tf)

- **JWT Secret:** Automatically generated
- **DB Credentials:** Stored securely
- **Rotation:** Manual (quarterly recommended)

## Prerequisites

### 1. Install Tools

```bash
# Terraform
brew install terraform  # macOS
# or
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# AWS CLI
brew install awscli  # macOS
# or
pip install awscli

# Verify installations
terraform -version
aws --version
```

### 2. AWS Account Setup

```bash
# Configure AWS credentials
aws configure
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json

# Verify access
aws sts get-caller-identity
```

### 3. Create S3 Backend (Optional but Recommended)

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
    --bucket rom-terraform-state \
    --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket rom-terraform-state \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket rom-terraform-state \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name rom-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

Then uncomment the `backend "s3"` block in `main.tf`.

## Deployment Instructions

### Step 1: Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform (downloads providers)
terraform init
```

### Step 2: Create Staging Environment

```bash
# Create staging.tfvars
cat > staging.tfvars <<EOF
environment              = "staging"
aws_region              = "us-east-1"
project_name            = "rom-platform"

# Database
db_instance_class       = "db.t3.small"  # Smaller for staging
db_allocated_storage    = 50
db_backup_retention_days = 3

# ECS
api_desired_count       = 1  # Fewer tasks for staging
api_cpu                 = 256
api_memory              = 512

# Monitoring
cloudwatch_log_retention_days = 30
EOF

# Plan deployment
terraform plan -var-file=staging.tfvars -out=staging.tfplan

# Review the plan, then apply
terraform apply staging.tfplan
```

### Step 3: Create Production Environment

```bash
# Create production.tfvars
cat > production.tfvars <<EOF
environment              = "production"
aws_region              = "us-east-1"
project_name            = "rom-platform"

# Database
db_instance_class       = "db.t3.medium"
db_allocated_storage    = 100
db_backup_retention_days = 7

# ECS
api_desired_count       = 2
api_cpu                 = 512
api_memory              = 1024

# Monitoring
cloudwatch_log_retention_days = 90

# Security (production should restrict this)
allowed_cidr_blocks     = ["0.0.0.0/0"]  # TODO: Restrict to office/VPN IPs
EOF

# Plan deployment
terraform plan -var-file=production.tfvars -out=production.tfplan

# Review the plan carefully
terraform show production.tfplan

# Apply (this will incur AWS costs)
terraform apply production.tfplan
```

### Step 4: Verify Deployment

```bash
# Get outputs
terraform output

# Test database connectivity
terraform output -raw rds_endpoint

# Test ALB
terraform output -raw alb_url
curl $(terraform output -raw alb_url)/api/health
```

## Post-Deployment Configuration

### 1. Configure DNS (Route53)

```bash
# Create Route53 hosted zone (if not exists)
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Get ALB DNS name and Zone ID
ALB_DNS=$(terraform output -raw alb_dns_name)
ALB_ZONE=$(terraform output -raw alb_zone_id)

# Create A record alias
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.yourdomain.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "'$ALB_ZONE'",
        "DNSName": "'$ALB_DNS'",
        "EvaluateTargetHealth": true
      }
    }
  }]
}'
```

### 2. Request SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
    --domain-name api.yourdomain.com \
    --validation-method DNS \
    --region us-east-1

# Follow email validation or add DNS CNAME records
# Once validated, update ALB listener to use certificate ARN
```

### 3. Run Database Migrations

```bash
# Get RDS endpoint
export DATABASE_URL=$(terraform output -raw rds_endpoint | sed 's/:5432//')
export DATABASE_URL="postgresql://rom_admin:PASSWORD@${DATABASE_URL}:5432/rom_production"

# Run Drizzle migrations
cd ../../apps/api
npx drizzle-kit push

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

### 4. Deploy Application

See outputs from `terraform output deployment_commands` for Docker build/push commands.

## Cost Estimation

**Staging Environment:** ~$120/month

- RDS db.t3.small: $40/month
- ECS Fargate (1 task): $30/month
- ALB: $25/month
- NAT Gateway: $15/month
- Other: $10/month

**Production Environment:** ~$250/month

- RDS db.t3.medium Multi-AZ: $100/month
- ECS Fargate (2 tasks): $70/month
- ALB: $30/month
- NAT Gateway (2): $30/month
- CloudWatch, S3, KMS: $20/month

**Cost Optimization Tips:**

1. Use Reserved Instances for RDS (30-50% savings)
2. Enable ECS auto-scaling to reduce task count during low traffic
3. Use S3 Intelligent-Tiering for backups
4. Review CloudWatch log retention (shorter = cheaper)

## Maintenance

### Daily Backups

Automated RDS backups run daily. Manual snapshots can be created:

```bash
aws rds create-db-snapshot \
    --db-instance-identifier $(terraform output -raw rds_database_name) \
    --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

### Rotate Secrets (Quarterly)

```bash
# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)

# Update secret in Secrets Manager
aws secretsmanager update-secret \
    --secret-id $(terraform output -raw jwt_secret_arn) \
    --secret-string $NEW_JWT_SECRET

# Force ECS service update to pick up new secret
aws ecs update-service \
    --cluster $(terraform output -raw ecs_cluster_name) \
    --service $(terraform output -raw api_service_name) \
    --force-new-deployment
```

### Scale ECS Tasks

```bash
# Scale up
aws ecs update-service \
    --cluster $(terraform output -raw ecs_cluster_name) \
    --service $(terraform output -raw api_service_name) \
    --desired-count 4

# Scale down
aws ecs update-service \
    --cluster $(terraform output -raw ecs_cluster_name) \
    --service $(terraform output -raw api_service_name) \
    --desired-count 1
```

## Troubleshooting

### Issue: Terraform Init Fails

```bash
# Clear cache
rm -rf .terraform .terraform.lock.hcl

# Re-initialize
terraform init
```

### Issue: Plan Shows Many Changes

```bash
# Refresh state
terraform refresh -var-file=production.tfvars

# Re-run plan
terraform plan -var-file=production.tfvars
```

### Issue: ECS Tasks Not Starting

```bash
# Check task definition
aws ecs describe-task-definition --task-definition rom-api

# Check service events
aws ecs describe-services \
    --cluster $(terraform output -raw ecs_cluster_name) \
    --services $(terraform output -raw api_service_name)

# Check CloudWatch logs
aws logs tail /aws/ecs/rom-api --follow
```

### Issue: ALB Health Checks Failing

```bash
# Check target health
aws elbv2 describe-target-health \
    --target-group-arn $(terraform output -raw alb_target_group_arn)

# Test health endpoint from within VPC
aws ecs execute-command \
    --cluster $(terraform output -raw ecs_cluster_name) \
    --task TASK_ID \
    --interactive \
    --command "curl http://localhost:4000/api/health"
```

## Destroying Infrastructure

⚠️ **WARNING:** This will delete all resources including databases. Backups will NOT be deleted.

```bash
# Staging
terraform destroy -var-file=staging.tfvars

# Production (requires confirmation)
terraform destroy -var-file=production.tfvars
```

## Security Best Practices

1. **Restrict CIDR blocks** - Update `allowed_cidr_blocks` to office/VPN IPs only
2. **Enable MFA delete** - For S3 buckets
3. **Rotate secrets** - Quarterly rotation of JWT secret and DB passwords
4. **Review IAM policies** - Principle of least privilege
5. **Enable AWS Config** - Track configuration changes
6. **Enable GuardDuty** - Threat detection
7. **Enable AWS WAF** - Protect ALB from common attacks

## Support

For issues with this infrastructure:

1. Check CloudWatch Logs
2. Review ECS service events
3. Check RDS monitoring
4. Review VPC Flow Logs
5. Contact DevOps team

---

**Created:** February 9, 2026
**Last Updated:** February 9, 2026
**Maintained By:** DevOps Team
