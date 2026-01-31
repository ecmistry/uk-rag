#!/usr/bin/env bash
# Quick diagnostics when dashboard cards don't appear after "metrics reloaded successfully".
# Run from project root: BASE_URL=http://localhost:3000 ./scripts/check-dashboard.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=== UK RAG Dashboard diagnostics ==="
echo "App URL: $BASE_URL"
echo ""

echo "--- 1. Metrics API diagnostics (DB connection + count) ---"
# tRPC batch format for metrics.getDiagnostics
DIAG=$(curl -s "${BASE_URL}/api/trpc/metrics.getDiagnostics" 2>/dev/null || true)
if [ -z "$DIAG" ]; then
  echo "Could not reach app at $BASE_URL (is the server running?)"
else
  echo "$DIAG" | head -5
  # Try to extract result if JSON
  if command -v jq &>/dev/null; then
    echo ""
    echo "Parsed:"
    echo "$DIAG" | jq -r '.[0].result.data.json // .result?.data?.json // .' 2>/dev/null || echo "$DIAG"
  fi
fi
echo ""

echo "--- 2. EC2 disk space ---"
df -h 2>/dev/null || true
echo ""

echo "--- 3. EC2 memory ---"
free -m 2>/dev/null || true
echo ""

echo "--- Next steps ---"
echo "If dbConnected is false: set DATABASE_URL in .env and ensure MongoDB is running."
echo "If metricsCount is 0: run Data Refresh in the UI or: npm run load:metrics"
echo "If metricsCount > 0 but no cards: clear cache (admin) and reload dashboard; check server logs for [Metrics] list ..."
echo "See docs/EC2_DASHBOARD_TROUBLESHOOTING.md for full guide."
