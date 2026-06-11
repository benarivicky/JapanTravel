#!/usr/bin/env bash
# scripts/ci-dryrun.sh
#
# Simulates the Cloud Build / GitHub Actions pipeline locally.
# Run this before pushing to catch step-ordering bugs early.
#
# Usage:
#   bash scripts/ci-dryrun.sh
#
# Requirements: Node 20+, .env.local present in project root

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load .env.local so NEXT_PUBLIC_* vars are available for the build
if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  echo "✓ Loaded .env.local"
else
  echo "✗ .env.local not found — copy .env.example to .env.local and fill in values"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════"
echo " CI Dry-Run  —  JapanTravel gcpV3"
echo "═══════════════════════════════════════════════"

run_step() {
  local name="$1"
  shift
  echo ""
  echo "── Step: $name ──"
  "$@"
  echo "✓ $name passed"
}

run_step "npm ci"           npm ci
run_step "typecheck"        npm run typecheck
run_step "lint"             npm run lint
run_step "unit tests"       npm run test -- --ci --no-coverage
run_step "production build" npm run build

echo ""
echo "═══════════════════════════════════════════════"
echo " ✅  All CI steps passed — safe to push"
echo "═══════════════════════════════════════════════"
