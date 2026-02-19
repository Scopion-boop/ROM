# Multi-stage Dockerfile for PhysioLens Web App (Next.js)
# Optimized for production deployment with static optimization

# ── Stage 1: Dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install pnpm and dependencies
RUN npm install -g pnpm@9.15.4
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types
COPY tsconfig.base.json ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Build shared-types first
WORKDIR /app/packages/shared-types
RUN npm install -g pnpm@9.15.4
RUN pnpm run build

# Build Next.js application
WORKDIR /app/apps/web

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept NEXT_PUBLIC_* as build args (baked into the Next.js bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SIGNAL_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SIGNAL_URL=$NEXT_PUBLIC_SIGNAL_URL

# Build Next.js app (generates .next directory)
RUN pnpm run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9.15.4

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist

# Install only production dependencies
WORKDIR /app
RUN pnpm install --prod --frozen-lockfile

# Switch to non-root user
USER nextjs

# Set working directory to web app
WORKDIR /app/apps/web

# Environment variables (defaults, override at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Health check (assumes Next.js serves on root)
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose web port
EXPOSE 3000

# Start Next.js server on port 3000 (matches EXPOSE and healthcheck)
CMD ["npx", "next", "start", "-p", "3000"]
