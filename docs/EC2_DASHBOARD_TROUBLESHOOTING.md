# Dashboard cards not appearing – EC2 troubleshooting

Use this when "metrics reloaded successfully" but the dashboard shows "No metrics data available" for all sections.

## 1. Check diagnostics API

The app exposes a **diagnostics** endpoint that reports DB connection and metrics count.

From the EC2 server (or any host that can reach the app):

```bash
# Replace with your app URL and port (e.g. http://localhost:3000 or https://your-domain)
BASE_URL="${BASE_URL:-http://localhost:3000}"

# tRPC getDiagnostics (batch format)
curl -s "${BASE_URL}/api/trpc/metrics.getDiagnostics" | jq .
```

Expected when things are OK:

- `dbConnected`: true  
- `metricsCount`: number > 0 (e.g. 30+ after a full refresh)

Interpretation:

- **dbConnected: false** → MongoDB not reachable. Check `DATABASE_URL` in `.env` and that MongoDB is running and reachable from this host.
- **dbConnected: true, metricsCount: 0** → DB is connected but the `metrics` collection is empty. Refresh may have failed, written to another DB, or data was cleared. Run a refresh (Data Refresh in the UI or load script) and check again.
- **dbConnected: true, metricsCount: N (N > 0)** → DB has data. If the dashboard still shows no cards, the problem is likely cache or frontend (see steps 3 and 4).

## 2. Check server logs

After you click "Refresh" and then load the dashboard, check the Node server logs for lines like:

```
[Metrics] list category=all source=db rawCount=35 finalCount=45
```

Interpretation:

- **source=cache count=N** → List response came from cache (N = number of metrics returned). If N is 0, we now treat that as a cache miss and hit the DB.
- **source=fallback count=N** → DB was unavailable; app returned placeholders only (N = placeholder count).
- **source=db rawCount=0 finalCount=20** → DB returned 0 metrics; `finalCount` is from placeholders only. So DB is connected but **empty** → run a refresh and confirm metrics are written.
- **source=db rawCount=35 finalCount=45** → DB had 35 metrics; after placeholders/filtering, 45 items returned. Dashboard should show cards; if it doesn’t, focus on cache/frontend (steps 3–4).

If you run refresh and then list and never see `source=db rawCount=...` with `rawCount > 0`, the process handling the list request may be different from the one that did the refresh (e.g. multiple workers). In that case, clear cache (step 3) and/or ensure all workers use the same `DATABASE_URL`.

## 3. Clear metrics cache (admin)

If diagnostics show **metricsCount > 0** but the UI still shows no cards:

1. Log in as an admin.
2. Call the **clear cache** mutation (e.g. from Data Refresh or any admin flow that calls `metrics.clearCache`), or call it via API:

```bash
# If you have an admin session cookie, you can call clearCache (admin only)
# Otherwise use the Data Refresh UI and then "Clear cache" if available, or restart the app.
```

3. Reload the dashboard so it refetches the list from the DB.

The app now clears **all** category list caches when you clear cache (`metrics:all`, `metrics:Economy`, etc.), so a single clear forces the next list to hit the DB.

## 4. EC2 disk and memory

If the app or MongoDB is on the same EC2 instance, low disk or memory can cause odd behaviour (restarts, failed writes, no data).

On the EC2 instance:

```bash
# Disk space
df -h

# Memory
free -m
```

- **Disk**: Ensure the partition that holds MongoDB data (and logs) has enough free space (e.g. at least 10–20% free). If it’s full, free space or expand the volume.
- **Memory**: If `free` shows very little free memory, the process may be killed (OOM) or MongoDB may be slow; consider increasing instance size or freeing memory.

## 5. Restore data after fixing DB/cache

Once DB connection is correct and (if needed) cache is cleared:

1. **Option A – UI**: Data Refresh → choose category or "All" → Refresh. Then reload the dashboard.
2. **Option B – Load script** (on the server, with correct `DATABASE_URL`):

```bash
cd /home/ec2-user/uk-rag-portal
export DATABASE_URL="mongodb://..."   # same as in .env
npm run load:metrics
```

Then reload the dashboard. With the current logic, the list request should hit the DB and return the newly loaded metrics so the cards appear.

## 6. 502 Bad Gateway when signing in

If you get **502 Bad Gateway** when clicking "Sign in" on the initial (unauthenticated) page, nginx is proxying the request to the Node app but **nothing is listening on port 3000**.

**Cause:** Nginx is configured to proxy `/` (and thus `/api/auth/dev-login`) to `http://127.0.0.1:3000`. If the Node app is not running, or is running on a different port (e.g. 3001), nginx gets "connection refused" and returns 502.

**Fix:**

1. **Ensure the app is running and bound to port 3000** (same port nginx uses):

   ```bash
   # On the EC2 server – check what is listening
   lsof -i :3000

   # If nothing: free the port and start the app so it uses 3000
   cd /home/ec2-user/uk-rag-portal
   export PORT=3000
   npm run build && npm run start
   ```

2. **If using systemd** (e.g. `uk-rag-portal.service`), the service sets `PORT=3000`. Start/enable it so the app stays up:

   ```bash
   sudo systemctl start uk-rag-portal
   sudo systemctl enable uk-rag-portal   # optional: start on boot
   sudo systemctl status uk-rag-portal
   ```

3. **If the app was started and bound to 3001** (because 3000 was busy), either:
   - Stop the process, free port 3000, then start again so the app binds to 3000, or  
   - Point nginx at 3001 by changing `proxy_pass http://127.0.0.1:3000` to `http://127.0.0.1:3001` in the nginx config and reload nginx (not recommended long-term; prefer keeping the app on 3000).

After the app is listening on 3000, try "Sign in" again.

**Verify:** On the server, confirm the app is up and dev-login responds:

```bash
systemctl status uk-rag-portal
curl -sI -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/auth/dev-login
```

You should see `302` (redirect). If you see "Connection refused", the app is not listening on 3000.

**Note:** In production the app is now configured to use only `PORT` (e.g. 3000). If that port is busy, the process exits with an error instead of binding to another port, so nginx and the app always match.

## Summary

| Symptom | Likely cause | Action |
|--------|----------------|--------|
| dbConnected: false | MongoDB not reachable / wrong `DATABASE_URL` | Fix `.env`, start MongoDB, check network/security groups |
| metricsCount: 0 | DB empty | Run refresh or load script, then check metricsCount again |
| metricsCount > 0 but no cards | Stale cache or frontend | Clear cache (admin), reload dashboard; check server logs for `source=db rawCount=...` |
| source=fallback in logs | DB was null when list ran | Check DB connection and retry; ensure `DATABASE_URL` is set where the app runs |
| EC2 disk full / very low memory | Resource pressure | Free disk, increase memory or instance size |
| 502 when clicking Sign in | Node app not listening on port 3000 | Start app on 3000 (e.g. `PORT=3000 npm run start` or systemd); see section 6 |

Running the diagnostics API and the server log checks above will narrow down whether the issue is DB, cache, or frontend.
