#!/usr/bin/env bash
# Pre-deployment validation script
# Run locally before deploying to verify configuration
#
# Usage: chmod +x deploy/pre-deploy-check.sh && ./deploy/pre-deploy-check.sh
set -euo pipefail

echo "=== PhysioLens Pre-Deploy Check ==="
echo ""

errors=0

# Check Docker images build
echo "[1/4] Building Docker images..."
if docker compose -f docker-compose.prod.yml build --quiet 2>/dev/null; then
    echo "  ✓ All images build successfully"
else
    echo "  ✗ Docker build failed"
    errors=$((errors + 1))
fi

# Check env templates are not directly used
echo "[2/4] Checking env file templates..."
for f in .env .env.api .env.web; do
    if [ -f "$f" ]; then
        if grep -q 'sk_live_\.\.\.' "$f" 2>/dev/null || grep -q 'CHANGE_ME' "$f" 2>/dev/null; then
            echo "  ✗ $f contains placeholder values"
            errors=$((errors + 1))
        else
            echo "  ✓ $f looks configured"
        fi
    else
        echo "  ⚠ $f not found (expected for local check)"
    fi
done

# Check required files exist
echo "[3/4] Checking required files..."
required_files=(
    "docker-compose.prod.yml"
    "deploy/Caddyfile"
    "apps/api/Dockerfile"
    "apps/web/Dockerfile"
    "services/signaling/Dockerfile"
)
for f in "${required_files[@]}"; do
    if [ -f "$f" ]; then
        echo "  ✓ $f"
    else
        echo "  ✗ $f missing!"
        errors=$((errors + 1))
    fi
done

# Check tests pass
echo "[4/4] Running test suite..."
if pnpm turbo test --force 2>/dev/null | tail -3 | grep -q "successful"; then
    echo "  ✓ All tests pass"
else
    echo "  ✗ Some tests failed"
    errors=$((errors + 1))
fi

echo ""
if [ "$errors" -eq 0 ]; then
    echo "✅ All pre-deploy checks passed!"
    exit 0
else
    echo "❌ $errors check(s) failed. Fix before deploying."
    exit 1
fi
