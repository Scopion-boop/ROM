#!/usr/bin/env bash
# PhysioLens — One-time server setup script
# Run as the 'deploy' user on the DigitalOcean droplet.
#
# Usage: bash deploy/initial-setup.sh
set -euo pipefail

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found. Install Docker first."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose not found. Install Docker Compose plugin."; exit 1; }

APP_DIR=/opt/physiolens

cd "$APP_DIR"

echo "============================================"
echo " PhysioLens — Initial Deployment Setup"
echo "============================================"
echo ""

# Check required env files exist
missing=0
for f in .env .env.api .env.web; do
    if [ ! -f "$APP_DIR/$f" ]; then
        echo "MISSING: $APP_DIR/$f"
        missing=1
    fi
done

if [ "$missing" -eq 1 ]; then
    echo ""
    echo "Create the missing files using the templates in deploy/:"
    echo "  cp deploy/.env.db.template .env        # then fill in POSTGRES_PASSWORD"
    echo "  cp deploy/.env.api.template .env.api    # then fill in JWT_SECRET, Stripe keys, etc."
    echo "  cp deploy/.env.web.template .env.web    # then fill in AI API keys"
    echo ""
    exit 1
fi

echo "All env files found."
echo ""

# Build images
echo "Building Docker images (this may take several minutes)..."
docker compose -f docker-compose.prod.yml build

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for postgres health check
echo "Waiting for PostgreSQL to be healthy..."
retries=0
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U physiolens 2>/dev/null; do
    retries=$((retries + 1))
    if [ "$retries" -gt 30 ]; then
        echo "ERROR: PostgreSQL did not become healthy in time."
        exit 1
    fi
    sleep 2
done
echo "PostgreSQL is ready."

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api node dist/db/migrate.js

echo ""
echo "============================================"
echo " Deployment complete!"
echo "============================================"
echo ""
echo " Verify at:"
echo "   https://physiolens.com"
echo "   https://api.physiolens.com/api/health"
echo ""
echo " Useful commands:"
echo "   docker compose -f docker-compose.prod.yml ps       # service status"
echo "   docker compose -f docker-compose.prod.yml logs -f   # follow logs"
echo "   docker compose -f docker-compose.prod.yml down      # stop all"
echo ""
