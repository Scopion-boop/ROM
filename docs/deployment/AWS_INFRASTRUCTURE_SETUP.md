# AWS Infrastructure Setup Guide

Complete guide for provisioning production-ready AWS infrastructure for the Musculoskeletal ROM Measurement Platform with HIPAA-compliant security controls.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Network Layer (VPC)](#network-layer-vpc)
4. [Database Layer (RDS)](#database-layer-rds)
5. [Application Layer (ECS)](#application-layer-ecs)
6. [Load Balancing (ALB)](#load-balancing-alb)
7. [Storage (S3)](#storage-s3)
8. [Monitoring (CloudWatch)](#monitoring-cloudwatch)
9. [Security Configuration](#security-configuration)
10. [Cost Estimation](#cost-estimation)
11. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### Required Tools

- **AWS CLI v2**: `aws --version` (must be 2.x)
- **Terraform v1.5+**: `terraform version` (for Infrastructure as Code)
- **Docker**: For building container images
- **jq**: JSON processing for scripts

### AWS Account Setup

1. **AWS Account** with billing enabled
2. **IAM User** with AdministratorAccess (or specific permissions)
3. **AWS CLI configured**:
   ```bash
   aws configure
   # AWS Access Key ID: [your-key]
   # AWS Secret Access Key: [your-secret]
   # Default region: us-east-1
   # Default output format: json
   ```

4. **Enable Required AWS Services**:
   - VPC
   - RDS (PostgreSQL)
   - ECS (Fargate)
   - ALB
   - S3
   - CloudWatch
   - Secrets Manager
   - KMS

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    VPC (10.0.0.0/16)                      │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │         Public Subnets (2 AZs)                   │    │ │
│  │  │  ┌──────────────┐        ┌──────────────┐       │    │ │
│  │  │  │  ALB (443)   │───────│  NAT Gateway  │       │    │ │
│  │  │  └──────────────┘        └──────────────┘       │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │         Private Subnets (2 AZs)                  │    │ │
│  │  │  ┌──────────────┐        ┌──────────────┐       │    │ │
│  │  │  │ ECS Fargate  │        │ ECS Fargate  │       │    │ │
│  │  │  │  (API Tasks) │        │  (API Tasks) │       │    │ │
│  │  │  └──────────────┘        └──────────────┘       │    │ │
│  │  │                                                  │    │ │
│  │  │  ┌──────────────┐        ┌──────────────┐       │    │ │
│  │  │  │ RDS Primary  │───────│ RDS Standby  │       │    │ │
│  │  │  │ (Multi-AZ)   │ (sync) │   (Multi-AZ) │       │    │ │
│  │  │  └──────────────┘        └──────────────┘       │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────┐   ┌───────────────────┐                │
│  │   S3 Buckets      │   │  Secrets Manager  │                │
│  │  (Encrypted)      │   │  (JWT_SECRET)     │                │
│  └───────────────────┘   └───────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

- **VPC**: Isolated network with public and private subnets across 2 availability zones
- **ALB**: Application Load Balancer for HTTPS termination and traffic distribution
- **ECS Fargate**: Serverless container orchestration for API services
- **RDS PostgreSQL**: Multi-AZ encrypted database with automated backups
- **S3**: Encrypted object storage for backups and artifacts
- **Secrets Manager**: Secure storage for sensitive configuration (JWT secrets, DB credentials)
- **CloudWatch**: Centralized logging and metrics

---

## Network Layer (VPC)

### VPC Configuration

```bash
# VPC CIDR: 10.0.0.0/16 (65,536 IPs)
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=rom-production-vpc},{Key=Environment,Value=production}]'

# Enable DNS hostnames
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=rom-production-vpc" --query "Vpcs[0].VpcId" --output text)
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
```

### Subnets (2 AZs for High Availability)

```bash
# Public Subnet 1 (us-east-1a)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-public-1a},{Key=Type,Value=public}]'

# Public Subnet 2 (us-east-1b)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-public-1b},{Key=Type,Value=public}]'

# Private Subnet 1 (us-east-1a) - for ECS tasks
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-private-app-1a},{Key=Type,Value=private}]'

# Private Subnet 2 (us-east-1b) - for ECS tasks
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.12.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-private-app-1b},{Key=Type,Value=private}]'

# Private Subnet 3 (us-east-1a) - for RDS
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.21.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-private-db-1a},{Key=Type,Value=database}]'

# Private Subnet 4 (us-east-1b) - for RDS
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.22.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=rom-private-db-1b},{Key=Type,Value=database}]'
```

### Internet Gateway & NAT Gateway

```bash
# Internet Gateway for public subnets
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=rom-igw}]'

IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=rom-igw" --query "InternetGateways[0].InternetGatewayId" --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# NAT Gateway for private subnets (outbound internet)
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=rom-nat-eip}]'

EIP_ID=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=rom-nat-eip" --query "Addresses[0].AllocationId" --output text)
PUBLIC_SUBNET_1=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=rom-public-1a" --query "Subnets[0].SubnetId" --output text)

aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET_1 \
  --allocation-id $EIP_ID \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=rom-nat-gw}]'
```

### Route Tables

```bash
# Public route table
aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=rom-public-rt}]'

PUBLIC_RT_ID=$(aws ec2 describe-route-tables --filters "Name=tag:Name,Values=rom-public-rt" --query "RouteTables[0].RouteTableId" --output text)

# Route to Internet Gateway
aws ec2 create-route --route-table-id $PUBLIC_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# Associate public subnets
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1 --route-table-id $PUBLIC_RT_ID
# Repeat for PUBLIC_SUBNET_2

# Private route table
aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=rom-private-rt}]'

PRIVATE_RT_ID=$(aws ec2 describe-route-tables --filters "Name=tag:Name,Values=rom-private-rt" --query "RouteTables[0].RouteTableId" --output text)
NAT_GW_ID=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=rom-nat-gw" --query "NatGateways[0].NatGatewayId" --output text)

# Route to NAT Gateway
aws ec2 create-route --route-table-id $PRIVATE_RT_ID --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW_ID

# Associate private subnets
# Associate all private subnets with this route table
```

---

## Database Layer (RDS)

### KMS Encryption Key

```bash
# Create KMS key for RDS encryption
aws kms create-key \
  --description "RDS encryption key for ROM platform" \
  --key-policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT_ID:root"},
      "Action": "kms:*",
      "Resource": "*"
    }]
  }' \
  --tags TagKey=Name,TagValue=rom-rds-key

# Create alias
aws kms create-alias \
  --alias-name alias/rom-rds \
  --target-key-id <key-id-from-above>
```

### DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name rom-db-subnet-group \
  --db-subnet-group-description "ROM Platform Database Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy \
  --tags Key=Name,Value=rom-db-subnet-group
```

### Security Group for RDS

```bash
aws ec2 create-security-group \
  --group-name rom-rds-sg \
  --description "Security group for ROM RDS PostgreSQL" \
  --vpc-id $VPC_ID

RDS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=rom-rds-sg" --query "SecurityGroups[0].GroupId" --output text)

# Allow PostgreSQL traffic from ECS tasks only
ECS_SG_ID="<ecs-security-group-id>"
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG_ID
```

### RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier rom-production-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.5 \
  --master-username postgres \
  --master-user-password '<strong-password>' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --kms-key-id alias/rom-rds \
  --db-subnet-group-name rom-db-subnet-group \
  --vpc-security-group-ids $RDS_SG_ID \
  --multi-az \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --deletion-protection \
  --tags Key=Name,Value=rom-production-db Key=Environment,Value=production
```

**Key Settings:**
- **Multi-AZ**: Enabled for high availability (automatic failover)
- **Encryption**: AES-256 at rest via KMS
- **Backup Retention**: 30 days
- **CloudWatch Logs**: Enabled for query monitoring
- **Deletion Protection**: Enabled to prevent accidental deletion

### Connection String

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier rom-production-db \
  --query "DBInstances[0].Endpoint.Address" \
  --output text

# DATABASE_URL format:
# postgresql://postgres:<password>@<endpoint>:5432/postgres
```

Store in **AWS Secrets Manager** (see Security Configuration section).

---

## Application Layer (ECS)

### ECR Repository

```bash
aws ecr create-repository \
  --repository-name rom-api \
  --encryption-configuration encryptionType=AES256 \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Name,Value=rom-api

# Get repository URI
ECR_URI=$(aws ecr describe-repositories --repository-names rom-api --query "repositories[0].repositoryUri" --output text)
```

### Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# Build image
docker build -t rom-api:latest -f apps/api/Dockerfile .

# Tag and push
docker tag rom-api:latest $ECR_URI:latest
docker tag rom-api:latest $ECR_URI:$(git rev-parse --short HEAD)
docker push $ECR_URI:latest
docker push $ECR_URI:$(git rev-parse --short HEAD)
```

### ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name rom-production-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --settings name=containerInsights,value=enabled \
  --tags key=Name,value=rom-production-cluster
```

### Task Definition

Create `task-definition.json`:

```json
{
  "family": "rom-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/romApiTaskRole",
  "containerDefinitions": [
    {
      "name": "rom-api",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/rom-api:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "4000"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:rom/jwt-secret"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:rom/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rom-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/api/health/ready || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### ECS Service

```bash
aws ecs create-service \
  --cluster rom-production-cluster \
  --service-name rom-api-service \
  --task-definition rom-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=rom-api,containerPort=4000" \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
  --enable-execute-command \
  --tags key=Name,value=rom-api-service
```

---

## Load Balancing (ALB)

### Security Group for ALB

```bash
aws ec2 create-security-group \
  --group-name rom-alb-sg \
  --description "Security group for ROM ALB" \
  --vpc-id $VPC_ID

ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=rom-alb-sg" --query "SecurityGroups[0].GroupId" --output text)

# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow HTTP (for redirect)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name rom-alb \
  --subnets subnet-public-1a subnet-public-1b \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=rom-alb
```

### Target Group

```bash
aws elbv2 create-target-group \
  --name rom-api-tg \
  --protocol HTTP \
  --port 4000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /api/health/ready \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200
```

### SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.yourplatform.com \
  --subject-alternative-names '*.yourplatform.com' \
  --validation-method DNS \
  --tags Key=Name,Value=rom-platform-cert

# Add DNS validation records (follow ACM console instructions)
# Wait for certificate to be issued
```

### HTTPS Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### HTTP → HTTPS Redirect

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

---

## Storage (S3)

### Backup Bucket

```bash
aws s3api create-bucket \
  --bucket rom-production-backups-$(date +%s) \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

BUCKET_NAME="<bucket-name-from-above>"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Lifecycle policy for backups
aws s3api put-bucket-lifecycle-configuration \
  --bucket $BUCKET_NAME \
  --lifecycle-configuration file://s3-lifecycle.json
```

`s3-lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "Transition-to-IA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

---

## Monitoring (CloudWatch)

### Log Groups

```bash
# API logs
aws logs create-log-group --log-group-name /ecs/rom-api
aws logs put-retention-policy --log-group-name /ecs/rom-api --retention-in-days 90

# RDS logs
aws logs create-log-group --log-group-name /aws/rds/instance/rom-production-db/postgresql
aws logs put-retention-policy --log-group-name /aws/rds/instance/rom-production-db/postgresql --retention-in-days 90
```

### CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name ROM-Production \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name rom-api-high-error-rate \
  --alarm-description "Alert when API error rate exceeds 5%" \
  --metric-name 4xxError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:rom-alerts

# Database CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name rom-rds-high-cpu \
  --alarm-description "Alert when RDS CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=rom-production-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:rom-alerts
```

---

## Security Configuration

### Secrets Manager

```bash
# Store JWT secret
aws secretsmanager create-secret \
  --name rom/jwt-secret \
  --description "JWT signing secret for ROM platform" \
  --secret-string "$(openssl rand -base64 32)"

# Store database URL
aws secretsmanager create-secret \
  --name rom/database-url \
  --description "PostgreSQL connection string" \
  --secret-string "postgresql://postgres:<password>@<rds-endpoint>:5432/postgres"

# Enable rotation (optional)
aws secretsmanager rotate-secret \
  --secret-id rom/jwt-secret \
  --rotation-lambda-arn <lambda-arn> \
  --rotation-rules AutomaticallyAfterDays=90
```

### IAM Roles

**ECS Task Execution Role** (for pulling images, accessing secrets):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

**ECS Task Role** (for application permissions):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::rom-production-backups/*"
    }
  ]
}
```

---

## Cost Estimation

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| VPC | Standard (NAT Gateway) | $32 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ, 100GB | $150 |
| ECS Fargate | 2 tasks, 0.5 vCPU, 1GB RAM | $30 |
| ALB | Standard, ~1M requests | $25 |
| S3 | 100GB Standard + lifecycle | $3 |
| CloudWatch | Logs + Dashboards | $10 |
| Secrets Manager | 2 secrets | $0.80 |
| **Total** | | **~$250/month** |

*Costs vary based on actual usage. Add 20% buffer for production traffic.*

---

## Deployment Checklist

### Pre-Deployment

- [ ] AWS account created and configured
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate requested and validated
- [ ] Secrets stored in Secrets Manager
- [ ] Docker image built and pushed to ECR

### Infrastructure Provisioning

- [ ] VPC created with public/private subnets (2 AZs)
- [ ] Internet Gateway and NAT Gateway configured
- [ ] Route tables configured
- [ ] Security groups created (ALB, ECS, RDS)
- [ ] RDS PostgreSQL instance created (Multi-AZ, encrypted)
- [ ] S3 backup bucket created (encrypted, versioned)
- [ ] KMS keys created for encryption

### Application Deployment

- [ ] ECS cluster created
- [ ] Task definition registered
- [ ] ECS service created with desired count
- [ ] ALB created with target group
- [ ] HTTPS listener configured
- [ ] HTTP → HTTPS redirect configured
- [ ] Health checks passing

### Monitoring & Alerts

- [ ] CloudWatch log groups created (90-day retention)
- [ ] CloudWatch dashboard configured
- [ ] Alarms created (error rate, CPU, memory)
- [ ] SNS topics created for alerts
- [ ] Alert destinations configured (email, Slack)

### Security Validation

- [ ] Encryption at rest verified (RDS, S3)
- [ ] Encryption in transit verified (HTTPS, TLS 1.2+)
- [ ] Security group rules verified (least privilege)
- [ ] IAM roles verified (least privilege)
- [ ] Secrets rotation enabled
- [ ] Deletion protection enabled (RDS)

### Testing

- [ ] API health check returns 200 OK
- [ ] Database connectivity confirmed
- [ ] HTTPS certificate valid
- [ ] Load balancer distributing traffic
- [ ] Auto-scaling working
- [ ] Backups running successfully

### Post-Deployment

- [ ] DNS records updated to point to ALB
- [ ] Documentation updated with endpoints
- [ ] Runbooks created for common issues
- [ ] Team trained on deployment process

---

## Next Steps

1. **Terraform IaC**: Convert manual steps to Terraform for reproducibility
2. **CI/CD Pipeline**: Automate deployment via GitHub Actions
3. **Staging Environment**: Create identical staging infrastructure
4. **Disaster Recovery**: Test backup/restore procedures
5. **Security Audit**: Conduct penetration testing
6. **Cost Optimization**: Enable Savings Plans or Reserved Instances

---

## Support

For AWS-specific issues:
- AWS Support (if subscribed)
- AWS Documentation: https://docs.aws.amazon.com/
- AWS re:Post: https://repost.aws/

For platform issues:
- See [DEPLOYMENT.md](../../DEPLOYMENT.md)
- See [Troubleshooting Guide](./TROUBLESHOOTING.md)
