#!/usr/bin/env bash
# Watchdog: if the UK RAG Portal is not responding on port 3000, restart the systemd service.
# Runs every 5 minutes via cron: */5 * * * * /home/ec2-user/uk-rag-portal/scripts/ensure-uk-rag-portal-up.sh
#
# This script respects systemd's own restart loop — if the service is already
# restarting (activating) or was restarted in the last 60 seconds, we skip to
# avoid a double-restart race condition.

set -e
URL="${UK_RAG_PORTAL_URL:-http://127.0.0.1:3000}"
SERVICE="${UK_RAG_PORTAL_SERVICE:-uk-rag-portal}"
LOG="${UK_RAG_PORTAL_WATCHDOG_LOG:-/home/ec2-user/uk-rag-portal/logs/watchdog.log}"

# 1. If the HTTP health check passes, nothing to do
if curl -sf -o /dev/null --connect-timeout 5 --max-time 10 "$URL/" 2>/dev/null; then
  exit 0
fi

# 2. If systemd is already restarting the service, don't pile on
ACTIVE_STATE=$(systemctl show "$SERVICE" --property=ActiveState --value 2>/dev/null || echo "unknown")
SUB_STATE=$(systemctl show "$SERVICE" --property=SubState --value 2>/dev/null || echo "unknown")

if [ "$ACTIVE_STATE" = "activating" ] || [ "$SUB_STATE" = "auto-restart" ]; then
  exit 0
fi

# 3. If the service was started within the last 60 seconds, give it time to finish booting
ACTIVE_ENTER=$(systemctl show "$SERVICE" --property=ActiveEnterTimestamp --value 2>/dev/null || echo "")
if [ -n "$ACTIVE_ENTER" ]; then
  ENTER_EPOCH=$(date -d "$ACTIVE_ENTER" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  AGE=$(( NOW_EPOCH - ENTER_EPOCH ))
  if [ "$AGE" -lt 60 ]; then
    exit 0
  fi
fi

# 4. Service is genuinely down — restart it
mkdir -p "$(dirname "$LOG")"
echo "$(date -Iseconds) Watchdog: $URL not responding, restarting $SERVICE" >> "$LOG"
sudo systemctl restart "$SERVICE" >> "$LOG" 2>&1 || true
