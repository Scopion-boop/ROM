# Development Environment Setup

Complete guide for setting up the PhysioLens development environment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js 20+**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20

   # Verify installation
   node --version  # Should be v20.x.x or higher
   ```

2. **pnpm 9.15+**
   ```bash
   npm install -g pnpm@9.15.0

   # Verify installation
   pnpm --version  # Should be 9.15.0 or higher
   ```

3. **PostgreSQL 15+** (Optional - for database persistence)
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15

   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql-15
   sudo systemctl start postgresql

   # Verify installation
   psql --version  # Should be 15.x or higher
   ```

4. **Git**
   ```bash
   # Verify installation
   git --version
   ```

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Vitest
- **Postman** or **Insomnia** for API testing
- **Chrome DevTools** for debugging

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd physiolens
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for:
- Root workspace
- `apps/web` (Next.js)
- `apps/api` (Express)
- `packages/shared-types`

## Environment Configuration

### Web Application (.env.local)

```bash
cd apps/web
cp .env.local.example .env.local
```

Edit `apps/web/.env.local`:

```bash
# ── AI Interpretation (server-side only) ──
# Provide at least one API key
OPENAI_API_KEY=sk-proj-...              # Get from https://platform.openai.com
# OPENAI_MODEL=gpt-4o                   # Optional: Override default model

# OR use Anthropic Claude
# ANTHROPIC_API_KEY=sk-ant-...          # Get from https://console.anthropic.com
# ANTHROPIC_MODEL=claude-sonnet-4-20250514

# ── WebRTC Signaling ──
NEXT_PUBLIC_SIGNAL_PORT=4001            # Port for signaling server
```

**API Key Setup:**
- **OpenAI**: Create account at https://platform.openai.com, get API key from API keys section
- **Anthropic**: Create account at https://console.anthropic.com, get API key from settings

### API Server (.env)

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/rom_dev

# Security
JWT_SECRET=your-secure-random-secret-here  # Generate with: openssl rand -base64 32
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:2000

# Logging
LOG_LEVEL=debug
```

**Security Notes:**
- Never commit `.env` files to version control
- Use strong random secrets for JWT_SECRET
- Keep API keys secure

## Database Setup

### Option 1: PostgreSQL (Recommended for Production)

1. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database and user
   CREATE DATABASE rom_dev;
   CREATE USER rom_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE rom_dev TO rom_user;
   \q
   ```

2. **Run Migrations**
   ```bash
   cd apps/api
   pnpm db:push    # Push Drizzle schema to database
   pnpm db:studio  # (Optional) Open Drizzle Studio to inspect DB
   ```

### Option 2: In-Memory (Development Only)

The API currently uses in-memory repositories by default for rapid development. No database setup required.

**Note:** Data will be lost when the server restarts.

## Running the Application

### Development Mode (All Services)

From the **root directory**, run:

```bash
pnpm dev
```

This starts:
- Next.js web app on http://localhost:2000
- Express API on http://localhost:3000

### Running Services Individually

**Terminal 1: API Server**
```bash
cd apps/api
pnpm dev
```

**Terminal 2: WebRTC Signaling Server**
```bash
cd apps/web
node src/lib/signaling/server.mjs
```

**Terminal 3: Next.js Web App**
```bash
cd apps/web
pnpm dev
```

### Accessing the Application

1. **Web Application**: http://localhost:2000
2. **API Server**: http://localhost:3000
3. **Signaling Server**: http://localhost:4001

### Testing the Setup

1. **Verify API Health**
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Verify Web App**
   - Open http://localhost:2000
   - You should see the landing page
   - Click "New Session" to test camera access

3. **Test Dual-Camera Setup**
   - Click "New Session"
   - Select a joint (e.g., "Shoulder")
   - In the capture wizard, click "Pair Phone"
   - Scan QR code with phone camera
   - Phone should connect via WebRTC

## Development Commands

### Root Directory Commands

```bash
# Install all dependencies
pnpm install

# Run all services
pnpm dev

# Run all tests
pnpm test

# Lint all projects
pnpm lint

# Type check all projects
pnpm typecheck

# Format all code
pnpm format

# Build all projects for production
pnpm build

# Clean all build artifacts
pnpm clean
```

### Web App Commands (apps/web)

```bash
cd apps/web

# Development server
pnpm dev

# Run tests
pnpm test
pnpm test:watch  # Watch mode

# Type checking
pnpm typecheck

# Build for production
pnpm build
pnpm start       # Run production build

# Linting
pnpm lint
```

### API Commands (apps/api)

```bash
cd apps/api

# Development server (with auto-reload)
pnpm dev

# Run tests
pnpm test
pnpm test:watch

# Database operations (Drizzle)
pnpm db:push     # Push schema changes
pnpm db:studio   # Open Drizzle Studio GUI

# Type checking
pnpm typecheck

# Build for production
pnpm build
pnpm start       # Run production build
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm --filter @physiolens/web test
pnpm --filter @physiolens/api test

# Watch mode
pnpm --filter @physiolens/web test:watch

# Coverage report
pnpm test -- --coverage
```

### Manual Testing Workflow

1. **Camera Capture**
   - Click "New Session"
   - Select joint (shoulder/knee/hip)
   - Grant camera permissions
   - Perform movement while recording

2. **Dual-Camera (WebRTC)**
   - Ensure signaling server is running
   - Click "Pair Phone" in wizard
   - Scan QR on phone
   - Test 3D landmark fusion

3. **Clinical Notes**
   - Complete a capture session
   - View generated clinical note
   - Check normative ranges display
   - Test print functionality (Cmd/Ctrl+P)

4. **AI Interpretation**
   - Ensure API key is configured
   - Complete a session with measurements
   - Click "Request Interpretation"
   - Verify interpretation appears in note

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 2000 (Next.js)
lsof -ti:2000 | xargs kill -9

# Find process using port 3000 (API)
lsof -ti:3000 | xargs kill -9

# Find process using port 4001 (Signaling)
lsof -ti:4001 | xargs kill -9
```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript project references
pnpm typecheck

# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Camera Not Working

1. **Check browser permissions** (Chrome: chrome://settings/content/camera)
2. **Use HTTPS or localhost** (camera API requires secure context)
3. **Test in Chrome/Edge** (best MediaPipe support)

### WebRTC Connection Fails

1. **Verify signaling server is running** (http://localhost:4001)
2. **Check firewall settings** (allow ports 4001, 2000)
3. **Ensure both devices on same network** (or use TURN server)

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U rom_user -d rom_dev -h localhost

# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux

# Reset database
pnpm --filter @physiolens/api db:push --force
```

### MediaPipe Errors

- **Clear browser cache** (MediaPipe WASM files cached)
- **Check network** (WASM files loaded from CDN)
- **Try incognito mode** (eliminate extension conflicts)

### AI Interpretation Not Working

1. **Verify API key in .env.local**
   ```bash
   cat apps/web/.env.local | grep API_KEY
   ```

2. **Check API quota/billing** (OpenAI/Anthropic dashboard)

3. **Test API directly**
   ```bash
   curl http://localhost:2000/api/interpret \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"measurements":[...],"metadata":{...}}'
   ```

## Next Steps

After setup:
1. Review [API.md](./API.md) for API documentation
2. Check [Architecture docs](./docs/planning-v2/03-architecture-stack.md)
3. Read [Contributing guidelines](./docs/planning-v2/07-dev-agent-orchestration.md)

## Support

For issues not covered here:
- Check [GitHub Issues](https://github.com/<org>/<repo>/issues)
- Review [Open Questions](./docs/planning-v2/11-open-questions-for-founder.md)
- Contact development team
