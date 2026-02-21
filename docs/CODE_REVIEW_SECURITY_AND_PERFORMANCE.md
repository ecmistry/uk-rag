# Code Review: Security & Performance

Review date: 2026-01-31. Focus: security and performance before sharing the codebase.

---

## Security

### ✅ In good shape

- **Auth**: Admin login uses only `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env; no defaults. Dev-login disabled in production. Admin login rate-limited (3 attempts per IP per 15 min).
- **Session cookie**: `httpOnly`, `secure` when HTTPS, `sameSite`. Session verified via JWT (jose).
- **Authorization**: tRPC uses `publicProcedure`, `protectedProcedure`, `adminProcedure`; admin-only actions correctly gated.
- **Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP in production.
- **Input validation**: Zod on tRPC inputs; `metricKey` alphanumeric + underscore; commentary title/content/period length limits.
- **DB**: MongoDB queries use parameterized objects (no string concatenation); no injection risk from validated inputs.
- **Secrets**: No credentials in code; `.env` in `.gitignore`. Client only sees `VITE_*` env vars.
- **Docs**: `SECURITY_REVIEW.md` and dependency overrides (fast-xml-parser, tar, qs, etc.) documented.

### 🔧 Changes made during review

1. **SECURITY_REVIEW.md**: Corrected rate limit description from "5 attempts" to "3 attempts".
2. **CSV export filenames**: Sanitized `metricKey` and `category` in `metrics.exportCsv` so returned filenames cannot contain path characters or unexpected characters (safe for `Content-Disposition` / download).
3. **Commentary lists**: Added a cap of 200 items to `getPublishedCommentaries()` and `getAllCommentaries()` to avoid unbounded response size and DB load.

### Recommendations (optional)

- **Body size limit**: `express.json({ limit: "50mb" })` is large and can aid DoS. If you do not need 50MB payloads, consider lowering (e.g. 1–2MB) and document the reason for any higher value.
- **Dependency audit**: Run `pnpm audit` (with nvm + pnpm in path) periodically; address any new advisories.
- **Password comparison**: Admin password is compared with `!==`. For maximum paranoia, consider `crypto.timingSafeEqual` (with fixed-length buffers) to avoid timing side-channels; risk is low for a single-admin app.

---

## Performance

### ✅ In good shape

- **Indexes**: `setupIndexes.ts` defines indexes for `users.openId`, `metrics.metricKey` / `category` / `ragStatus`, `metricHistory` (metricKey, recordedAt, compound), `commentary` (status, publishedAt, createdAt, id), `fileMetadata`.
- **Caching**: In-memory LRU cache (200 entries, 5 min TTL) for metric by key and metric history; cache cleared on history write.
- **Metric history limit**: `getMetricHistory` caps limit at 500; tRPC `getById` caps `historyLimit` at 500.
- **Metrics list**: Reads from DB with projection; no unbounded reads.

### 🔧 Changes made during review

- **Commentary lists**: Capped at 200 items (see above) so list endpoints stay bounded.

### Recommendations (optional)

- **Metrics refresh**: Admin `metrics.refresh` calls `getMetricHistory(metric_key, 1000)` per metric in a loop. For very large metric sets, consider batching or a single aggregation if you need to scale further.
- **Cache size**: If the number of metrics grows a lot, consider increasing cache `maxSize` or TTL in `server/cache.ts`.

---

## Summary

Security posture is solid for sharing: auth is env-based and rate-limited, inputs are validated, headers and cookies are configured, and there are no known secrets in repo or unbounded queries. Performance is reasonable with indexes and caching; commentary lists and CSV filenames were tightened during this review. Optional items above can be done as follow-ups.
