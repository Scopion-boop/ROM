# Deployment Guide

Production deployment guide for the Musculoskeletal ROM Measurement Platform.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Database Setup](#database-setup)
- [Monitoring & Observability](#monitoring--observability)
- [Security Checklist](#security-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

### Architecture Components
- **Next.js Web App**: Frontend application (port 2000 → production port 80/443)
- **Express API Server**: Backend API (port 3000 → production port 3000)
- **WebRTC Signaling Server**: Real-time communication (port 4001 → production port 4001)
- **PostgreSQL Database**: Data persistence (port 5432)

### Deployment Topology

```
┌─────────────────────────────────────────────────────────┐
│                    Internet/CDN                         │
└────────────────────┬────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │ Load Balancer │ (AWS ALB/ELB)
              └──────┬──────┘
       ┌─────────────┼─────────────┐
       │             │             │
  ┌────▼────┐   ┌───▼────┐   ┌───▼────┐
  │Next.js  │   │Express │   │Signaling│
  │   App   │   │  API   │   │ Server  │
  └────┬────┘   └───┬────┘   └────────┘
       │            │
       └────────────┼────────────┐
                    │            │
              ┌─────▼─────┐  ┌──▼──────┐
              │PostgreSQL │  │  Redis  │ (optional)
              │    RDS    │  │ (cache) │
              └───────────┘  └─────────┘
```

## Prerequisites

### Required Accounts & Services
- [x] **Node.js 20+** runtime environment
- [x] **PostgreSQL 15+** database
- [x] **Domain name** with SSL certificate
- [x] **OpenAI or Anthropic API account** (for AI interpretation)

### Optional Services
- [ ] **AWS Account** (recommended for production)
- [ ] **Vercel Account** (alternative for Next.js hosting)
- [ ] **Docker Hub** (for containerized deployments)
- [ ] **Datadog/New Relic** (monitoring)

### Pre-Deployment Checklist
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] Backup strategy defined
- [ ] Rollback plan documented

## Environment Configuration

### Production Environment Variables

#### Web Application (.env.local)

```bash
# ── AI Interpretation ──
OPENAI_API_KEY=sk-proj-...                        # Production API key
OPENAI_MODEL=gpt-4o                               # Specific model version
# OR
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# ── WebRTC Signaling ──
NEXT_PUBLIC_SIGNAL_PORT=4001
NEXT_PUBLIC_SIGNAL_URL=wss://signal.yourdomain.com  # Production WebSocket URL

# ── API Configuration ──
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# ── Analytics (Optional) ──
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### API Server (.env)

```bash
# ── Server ──
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ── Database ──
DATABASE_URL=postgresql://user:password@rds-endpoint.region.rds.amazonaws.com:5432/rom_prod
DATABASE_SSL=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ── Security ──
JWT_SECRET=<strong-random-secret-64-chars>        # Generate: openssl rand -base64 64
JWT_EXPIRY=24h
BCRYPT_ROUNDS=12

# ── CORS ──
CORS_ORIGIN=https://app.yourdomain.com
CORS_CREDENTIALS=true

# ── Logging ──
LOG_LEVEL=info                                    # production, warn, error
LOG_FORMAT=json

# ── Rate Limiting (Future) ──
# RATE_LIMIT_WINDOW_MS=60000
# RATE_LIMIT_MAX_REQUESTS=100
```

#### Signaling Server (.env)

```bash
NODE_ENV=production
SIGNAL_PORT=4001
ALLOWED_ORIGINS=https://app.yourdomain.com
```

### Secrets Management

**Development**:
- Use `.env.local` and `.env` files (never commit!)

**Production**:
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Vercel**: Use Vercel Environment Variables dashboard
- **Docker**: Use Docker Secrets or Kubernetes Secrets
- **Self-hosted**: Use HashiCorp Vault or encrypted files

**Example: AWS Secrets Manager**
```bash
# Store secret
aws secretsmanager create-secret \
  --name rom-prod/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

# Retrieve in application
const secret = await secretsManager.getSecretValue({ SecretId: 'rom-prod/database-url' }).promise();
process.env.DATABASE_URL = secret.SecretString;
```

## Build Process

### 1. Local Build Verification

```bash
# Clean previous builds
pnpm clean

# Install dependencies (production only)
pnpm install --prod --frozen-lockfile

# Type check
pnpm typecheck

# Run tests
pnpm test

# Build all applications
pnpm build
```

### 2. Build Outputs

**Next.js Web App**:
```bash
cd apps/web
pnpm build

# Output: apps/web/.next/
# Static files: apps/web/.next/static/
# Server files: apps/web/.next/server/
```

**Express API**:
```bash
cd apps/api
pnpm build

# Output: apps/api/dist/
# Entry point: apps/api/dist/index.js
```

### 3. Production Start Commands

```bash
# Web app
cd apps/web
pnpm start  # Runs: next start -p 2000

# API server
cd apps/api
pnpm start  # Runs: node dist/index.js

# Signaling server
cd apps/web
node src/lib/signaling/server.mjs
```

## Deployment Options

### Option 1: Vercel (Recommended for Web App)

#### Why Vercel?
- Native Next.js support
- Automatic HTTPS & CDN
- Zero-downtime deployments
- Environment variable management
- Serverless API routes

#### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Vercel**
   ```bash
   cd apps/web
   vercel login
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add NEXT_PUBLIC_SIGNAL_PORT production
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Configure Custom Domain**
   - Go to Vercel dashboard → Settings → Domains
   - Add `app.yourdomain.com`
   - Update DNS records as instructed

#### vercel.json Configuration

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "NEXT_PUBLIC_SIGNAL_URL": "@signal-url"
  }
}
```

### Option 2: Docker Containers

#### Dockerfile - Web App

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 2000
CMD ["pnpm", "start"]
```

#### Dockerfile - API Server

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]
```

#### Docker Compose (Development/Testing)

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "2000:2000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_SIGNAL_PORT=4001
      - NEXT_PUBLIC_API_URL=http://api:3000
    depends_on:
      - api
      - signaling

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres

  signaling:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.signaling
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=http://localhost:2000

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=rom_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=rom_prod
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

#### Build & Deploy with Docker

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Option 3: AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Elastic Beanstalk**
   ```bash
   cd apps/web
   eb init -p node.js-20 rom-web-app --region us-east-1
   ```

3. **Create Environment**
   ```bash
   eb create rom-prod --instance-type t3.medium
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### Option 4: AWS ECS/Fargate

See [AWS ECS Deployment Guide](./docs/deployment/aws-ecs-guide.md) (coming soon)

### Option 5: Self-Hosted VPS

#### Requirements
- Ubuntu 22.04 LTS
- 4GB RAM minimum
- 50GB SSD storage
- Nginx reverse proxy
- Let's Encrypt SSL

#### Setup Script

```bash
#!/bin/bash
# deploy.sh

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone repository
git clone <repo-url> /var/www/rom-app
cd /var/www/rom-app

# Install dependencies
pnpm install --frozen-lockfile

# Build applications
pnpm build

# Install PM2 for process management
npm install -g pm2

# Start applications
pm2 start apps/web/package.json --name rom-web -- start
pm2 start apps/api/dist/index.js --name rom-api
pm2 start apps/web/src/lib/signaling/server.mjs --name rom-signaling

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/rom-app
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    # Next.js web app
    location / {
        proxy_pass http://localhost:2000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebRTC Signaling (WebSocket)
    location /signal {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Database Setup

### PostgreSQL Production Setup

#### 1. Create Database

```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create production database
CREATE DATABASE rom_prod;

-- Create user with strong password
CREATE USER rom_app WITH PASSWORD 'strong_random_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rom_prod TO rom_app;

-- Enable required extensions
\c rom_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 2. Run Migrations

```bash
cd apps/api

# Set production database URL
export DATABASE_URL="postgresql://rom_app:password@host:5432/rom_prod"

# Push schema with Drizzle
pnpm db:push

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

#### 3. Database Backups

**Automated Daily Backups**:
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/rom-app"
FILENAME="rom_prod_${DATE}.sql.gz"

pg_dump -h localhost -U rom_app rom_prod | gzip > "${BACKUP_DIR}/${FILENAME}"

# Retain last 30 days
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +30 -delete
```

**Cron Job**:
```cron
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

#### 4. Database Restore

```bash
# Restore from backup
gunzip -c /var/backups/rom-app/rom_prod_20260208.sql.gz | psql -U rom_app -d rom_prod
```

### AWS RDS PostgreSQL

1. **Create RDS Instance**
   - Engine: PostgreSQL 15.x
   - Instance class: db.t3.medium (or larger)
   - Storage: 100GB SSD (encrypted)
   - Multi-AZ: Yes (for high availability)
   - Automated backups: 7-day retention

2. **Security Group**
   - Allow port 5432 from API server security group only
   - No public access

3. **Connection String**
   ```
   postgresql://username:password@rom-db.xxxxx.us-east-1.rds.amazonaws.com:5432/rom_prod
   ```

## Monitoring & Observability

### Application Logs

**Pino JSON Logs** (already configured):
```json
{
  "level": 30,
  "time": 1675872000000,
  "msg": "User logged in",
  "userId": "user_123",
  "organizationId": "org_456"
}
```

### Health Checks

**API Health Endpoint**:
```http
GET /health
```

**Next.js Health** (custom):
```javascript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Monitoring Tools

#### Option 1: Datadog

```bash
# Install Datadog Agent
DD_API_KEY=<your-api-key> bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/master/cmd/agent/install_script.sh)"

# Configure APM
export DD_ENV=production
export DD_SERVICE=rom-api
export DD_VERSION=0.1.0
```

#### Option 2: AWS CloudWatch

- Enable CloudWatch Logs for ECS/EB
- Set log retention to 30 days
- Create alarms for:
  - High error rate (>5% in 5 minutes)
  - High latency (p99 >3s)
  - Low health check success rate (<95%)

#### Option 3: Self-Hosted Grafana + Prometheus

See [Observability Setup Guide](./docs/ops/observability-setup.md) (coming soon)

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Response Time (p95) | <500ms | >1s |
| Error Rate | <1% | >5% |
| Database Connections | <80% pool | >90% pool |
| CPU Usage | <70% | >85% |
| Memory Usage | <80% | >90% |
| Disk Space | <80% | >90% |

## Security Checklist

### Pre-Deployment Security

- [ ] **Environment Variables**: All secrets in secure storage (not in code)
- [ ] **HTTPS Only**: Enforce SSL/TLS (no HTTP traffic)
- [ ] **Database Encryption**: At-rest and in-transit encryption enabled
- [ ] **Authentication**: JWT with strong secrets (64+ character random strings)
- [ ] **Rate Limiting**: Implement API rate limits
- [ ] **Input Validation**: All user inputs validated and sanitized
- [ ] **CORS**: Restrict to known origins only
- [ ] **Security Headers**: Helmet.js configured (CSP, HSTS, etc.)
- [ ] **Dependency Audit**: Run `pnpm audit` and fix vulnerabilities
- [ ] **Access Control**: Principle of least privilege for DB users
- [ ] **Secrets Rotation**: Plan for periodic secret rotation

### Security Headers (Helmet.js)

Already configured in `apps/api/src/index.ts`:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### SSL/TLS Configuration

**Let's Encrypt (Free)**:
```bash
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

**Auto-renewal**:
```cron
0 0 1 * * certbot renew --quiet
```

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Docker Rollback

```bash
# Tag previous working image
docker tag rom-web:v0.0.9 rom-web:latest

# Restart containers
docker-compose down
docker-compose up -d
```

### Database Rollback

⚠️ **Caution**: Test in staging first!

```bash
# Restore from backup (see Database Setup)
gunzip -c /var/backups/rom-app/rom_prod_<timestamp>.sql.gz | psql -U rom_app -d rom_prod
```

### Emergency Rollback Plan

1. **Identify issue** (monitoring alerts, user reports)
2. **Assess severity** (critical = immediate rollback)
3. **Notify team** (incident channel)
4. **Execute rollback** (use method above)
5. **Verify restoration** (health checks, smoke tests)
6. **Post-mortem** (document root cause, preventive measures)

## Troubleshooting

### Application Won't Start

**Check logs**:
```bash
# Docker
docker-compose logs web

# PM2
pm2 logs rom-web

# Systemd
journalctl -u rom-web -n 100
```

**Common issues**:
- Missing environment variables
- Port already in use
- Database connection failure

### Database Connection Issues

**Test connection**:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**Check firewall**:
```bash
telnet db-host 5432
```

### High Memory Usage

**Identify process**:
```bash
pm2 monit
```

**Node.js memory limit**:
```bash
# Increase heap size
export NODE_OPTIONS="--max-old-space-size=4096"
```

### WebRTC Not Connecting

1. **Check signaling server** is running (port 4001)
2. **Verify firewall** allows WebSocket connections
3. **Check CORS** settings allow origin
4. **Test with browser DevTools** (Network → WS tab)

## Post-Deployment Checklist

- [ ] Verify all services healthy (`/health` endpoints)
- [ ] Test core user flows (capture → note → print)
- [ ] Verify AI interpretation works (API key configured)
- [ ] Test dual-camera pairing (WebRTC functional)
- [ ] Check database connectivity and backups
- [ ] Review logs for errors
- [ ] Monitor performance metrics
- [ ] Update DNS records if needed
- [ ] Document any issues encountered
- [ ] Notify team of successful deployment

## Support

For deployment issues:
- Review [SETUP.md](./SETUP.md) for local troubleshooting
- Check [Architecture docs](./docs/planning-v2/03-architecture-stack.md)
- See [Release Checklist](./docs/release/RELEASE_CHECKLIST.md)
- Contact DevOps team

---

**Last Updated**: February 8, 2026
**Version**: v0.1.0
