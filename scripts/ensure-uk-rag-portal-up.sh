#!/usr/bin/env bash
# Watchdog: if the UK RAG Portal is not responding on port 3000, restart the systemd service.
# Add to crontab to run every 5 minutes: */5 * * * * /home/ec2-user/uk-rag-portal/scripts/ensure-uk-rag-portal-up.sh
# Requires: ec2-user can run "sudo systemctl restart uk-rag-portal" (e.g. passwordless sudo on Amazon Linux).

set -e
URL="${UK_RAG_PORTAL_URL:-http://127.0.0.1:3000}"
SERVICE="${UK_RAG_PORTAL_SERVICE:-uk-rag-portal}"
LOG="${UK_RAG_PORTAL_WATCHDOG_LOG:-/home/ec2-user/uk-rag-portal/logs/watchdog.log}"

if curl -sf -o /dev/null --connect-timeout 5 --max-time 10 "$URL/" 2>/dev/null; then
  exit 0
fi

# App not responding – restart service
mkdir -p "$(dirname "$LOG")"
echo "$(date -Iseconds) Watchdog: $URL not responding, restarting $SERVICE" >> "$LOG"
sudo systemctl restart "$SERVICE" >> "$LOG" 2>&1 || true
