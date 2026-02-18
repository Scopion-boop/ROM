# Multi-stage Dockerfile for ROM API
# Optimized for production deployment with minimal image size

# ── Stage 1: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install pnpm and dependencies
RUN npm install -g pnpm@9.15.4
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
COPY tsconfig.json ./

# Build TypeScript
WORKDIR /app/apps/api
RUN pnpm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9.15.4
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist

# Switch to non-root user
USER nodejs

# Set working directory to API
WORKDIR /app/apps/api

# Environment variables (defaults, override at runtime)
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose API port
EXPOSE 4000

# Start server
CMD ["node", "dist/server.js"]
