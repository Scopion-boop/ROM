# PhysioLens — Clinical ROM Measurement Platform
AI-assisted range of motion measurement and clinical documentation system

✅ **Status**: Production-Ready MVP - Waves 1 & 2 Complete
📅 **Last Updated**: March 6, 2026
🎯 **Current Version**: v0.1.0 (Pre-Production)

## Project Overview
Computer vision-powered range of motion measurement platform for physiotherapists, chiropractors, and orthopedic surgeons. Replaces manual goniometry with AI-assisted assessment for faster, more accurate clinical documentation.

### Core Features (Implemented)
- ✅ **3D Dual-Camera ROM Measurement** - MediaPipe pose detection with WebRTC phone pairing
- ✅ **Max ROM Filtering** - Automatic selection of maximum range per joint across all measurements
- ✅ **Clinical Notes with Normative Ranges** - Auto-generated notes with AMA/AAOS reference ranges
- ✅ **AI Interpretation** - LLM-powered clinical interpretation (OpenAI GPT-4o & Anthropic Claude)
- ✅ **Special Tests Database** - 23 clinical tests (shoulder, knee, hip) with automated recommendations
- ✅ **Print-Ready Reports** - Professional PDF-ready clinical documentation
- ✅ **Auto-Detection Vision Strategy** - Automatic body part detection and movement tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 15.1 (App Router) + React 19
- **Computer Vision**: MediaPipe Pose Detection (WASM)
- **Real-time Communication**: WebRTC (Simple Peer)
- **UI Components**: Lucide Icons, Framer Motion
- **Testing**: Vitest + React Testing Library

### Backend
- **API**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (Drizzle ORM)
- **AI Integration**: OpenAI GPT-4o / Anthropic Claude Sonnet
- **Security**: Helmet, CORS, bcryptjs, JWT
- **Observability**: Pino structured logging

### Infrastructure
- **Monorepo**: Turborepo (pnpm workspaces)
- **Package Management**: pnpm 9.15+
- **Node Runtime**: Node.js 20+
- **Type Safety**: TypeScript 5.7

## Project Structure
```
physiolens/
├── apps/
│   ├── web/                      # Next.js web application
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages
│   │   │   │   ├── api/         # API routes (/api/interpret)
│   │   │   │   ├── camera/      # Camera capture & remote pairing
│   │   │   │   ├── sessions/    # Session management
│   │   │   │   └── exam/        # Self-guided exam flow
│   │   │   ├── components/      # React components
│   │   │   │   ├── capture/     # Capture wizard & video
│   │   │   │   ├── notes/       # Clinical note renderer
│   │   │   │   └── layout/      # Navigation & layouts
│   │   │   ├── lib/             # Core business logic
│   │   │   │   ├── cv/          # Computer vision (MediaPipe)
│   │   │   │   ├── strategies/  # Vision strategy pattern
│   │   │   │   ├── interpretation/ # AI interpretation
│   │   │   │   └── rom-utils.ts # ROM calculations
│   │   │   └── hooks/           # React hooks
│   │   ├── .env.local.example   # Environment template
│   │   └── vitest.config.ts     # Test configuration
│   │
│   └── api/                      # Express API server
│       ├── src/
│       │   ├── routes/          # API endpoints
│       │   ├── services/        # Business logic
│       │   ├── repositories/    # Data access layer
│       │   ├── db/              # Database schemas
│       │   ├── auth/            # Authentication
│       │   └── middleware/      # Express middleware
│       └── .env.example         # API environment template
│
├── packages/
│   └── shared-types/            # Shared TypeScript types
│
└── docs/                        # Comprehensive documentation
    ├── planning-v2/             # Product & architecture docs
    ├── security/                # Security & compliance
    ├── legal/                   # Legal & regulatory
    └── release/                 # Release & operations
```

## Development Workflow

### Testing
- **Unit Tests**: Vitest with React Testing Library
- **Coverage**: 29/29 tests passing (100% pass rate)
- **Type Safety**: Full TypeScript with strict mode
- **Linting**: ESLint with Next.js config

### Code Quality
```bash
# Run all quality checks
pnpm typecheck  # TypeScript compilation (0 errors)
pnpm lint       # ESLint checks
pnpm test       # All test suites (223 tests across 23+ files)
```

### Current Status
- ✅ TypeScript: 0 compilation errors
- ✅ Tests: 223 passing (api: 106, web: 62, signaling: 5, shared-types: 50)
- ✅ PostgreSQL persistence active (Drizzle ORM, auto-migrate on startup)
- ✅ Cookie-based auth hardened (httpOnly, CSRF protection)
- ✅ CI/CD pipeline (3 GitHub Actions workflows)
- ✅ Docker production stack (Caddy + Postgres + API + Web + Signaling)
- 🚧 PDF export (uses browser print — server-side deferred)
- 🚧 NLP summarization (stubbed)

## Quick Start

### Prerequisites
- Node.js 20+ ([Install via nvm](https://github.com/nvm-sh/nvm))
- pnpm 9.15+ (`npm install -g pnpm`)
- PostgreSQL 15+ (for API server)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd physiolens

# Install dependencies (from root)
pnpm install

# Set up environment variables
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Edit .env files with your credentials
# - Add OpenAI or Anthropic API key for AI interpretation
# - Configure PostgreSQL connection in apps/api/.env
```

### Development

```bash
# Run all services (from root)
pnpm dev

# Or run individually:
pnpm --filter @physiolens/web dev       # Next.js on http://localhost:2000
pnpm --filter @physiolens/api dev       # Express API on http://localhost:3000

# Run tests
pnpm test                        # All tests (223 across all packages)
pnpm --filter @physiolens/web test      # Web app tests only
pnpm --filter @physiolens/api test      # API tests only

# Database migrations (auto-runs on server start, or manually)
pnpm --filter @physiolens/api db:migrate

# TypeScript type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

### Running the Application

1. **Start the API server** (Terminal 1):
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Start the signaling server** for WebRTC (Terminal 2):
   ```bash
   cd apps/web
   node src/lib/signaling/server.mjs
   ```

3. **Start the Next.js app** (Terminal 3):
   ```bash
   cd apps/web
   pnpm dev
   ```

4. **Open your browser**: http://localhost:2000

### Testing the Features

- **Capture Flow**: Click "New Session" → Select joint → Follow wizard
- **Dual Camera**: Use "Pair Phone" QR code for 3D capture
- **Clinical Notes**: View auto-generated notes with normative ranges
- **AI Interpretation**: Click "Request Interpretation" (requires API key)
- **Print**: Use browser print (Cmd/Ctrl+P) for PDF export

## Roadmap

### ✅ Phase 1-5: MVP Complete (v0.1.0)
- [x] Camera capture pipeline with MediaPipe
- [x] Dual-camera WebRTC pairing
- [x] 3D landmark fusion
- [x] Max ROM filtering
- [x] Clinical note generation
- [x] AI interpretation (OpenAI/Anthropic)
- [x] Special tests database (23 tests)
- [x] Print-ready reports

### ✅ Wave 1: Production Hardening
- [x] PostgreSQL persistence (Drizzle ORM)
- [x] Cookie-based auth (httpOnly, SameSite, CSRF)
- [x] Dashboard, billing, clinic, patient links APIs
- [x] Stripe billing integration

### ✅ Wave 2: Deploy & CI/CD
- [x] Docker multi-stage builds (api, web, signaling)
- [x] docker-compose.prod.yml with Caddy + auto-TLS
- [x] GitHub Actions CI/CD (ci.yml, pr-checks.yml, deploy.yml)
- [x] 223 tests passing

### 🚧 Next: Remaining Hardening
- [ ] Server-side PDF export
- [ ] Load testing
- [ ] Feature flags

## Documentation

### Getting Started
- **[SETUP.md](./SETUP.md)** - Development environment setup
- **[API.md](./API.md)** - API endpoints and WebRTC signaling
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment and operations

### Planning & Architecture
- [Product Charter](./docs/planning-v2/01-product-charter.md)
- [PRD v1.0/v1.1](./docs/planning-v2/02-prd-v1-v1_1.md)
- [Architecture & Stack](./docs/planning-v2/03-architecture-stack.md)
- [AI/CV Measurement Design](./docs/planning-v2/04-ai-cv-measurement-design.md)

### Compliance & Legal
- [Security & Privacy](./docs/planning-v2/05-security-privacy-compliance.md)
- [Legal & Regulatory](./docs/planning-v2/06-legal-regulatory-doc-pack.md)
- [Security Baseline Checklist](./docs/security/SECURITY_BASELINE_CHECKLIST.md)

### Operations
- [Delivery Roadmap](./docs/planning-v2/08-delivery-roadmap-release-ops.md)
- [Test & Validation Plan](./docs/planning-v2/09-test-validation-clinical-plan.md)
- [Release Checklist](./docs/release/RELEASE_CHECKLIST.md)

## Regulatory Compliance

### Current Status
- **Development Phase**: Pre-production MVP
- **HIPAA**: Infrastructure designed for compliance (not audited)
- **FDA**: Class II (510k) pathway planned - not submitted
- **Clinical Validation**: Pending

### Security Features
- 🔒 Cookie-based auth (httpOnly, SameSite=Lax, Secure in prod)
- 🔒 CSRF protection via X-Requested-With header
- 🔒 Dual Bearer/cookie auth on all protected routes
- 🔒 bcryptjs password hashing (12 rounds)
- 🔒 Helmet.js security headers
- 🔒 CORS with explicit origin allowlist
- 🔒 Structured audit logging (Pino)
- 🔒 Signaling origin validation + rate limiting

## Contributing

This project is in active development. For questions or contributions:
1. Review the [Architecture Documentation](./docs/planning-v2/03-architecture-stack.md)
2. Check [Open Questions](./docs/planning-v2/11-open-questions-for-founder.md)
3. See [Implementation Sprints](./docs/planning-v2/10-backlog-implementation-sprints.md)

## License
Proprietary - Healthcare Application - Not for Distribution

---
**Team Lead**: Claude AI Orchestrator
**Development**: 6 Specialized Sub-Agents (Frontend, Backend, CV, DevOps, QA, Compliance)
# ROM
