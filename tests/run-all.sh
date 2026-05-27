#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo " Quizzy — full test suite"
echo "============================================"

bash "$ROOT/tests/run-frontend.sh"

bash "$ROOT/tests/run-backend-unit.sh"

bash "$ROOT/tests/run-backend-e2e.sh"

echo ""
echo "============================================"
echo " All tests passed."
echo "============================================"
