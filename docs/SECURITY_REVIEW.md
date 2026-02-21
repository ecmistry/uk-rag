# Security Review (Portal)

Summary of security and robustness measures applied to the UK RAG Portal.

## Authentication & Authorization

- **Admin login**: Single admin account only; email must match configured `ADMIN_EMAIL` (env or default). No other email can log in.
- **Rate limiting**: `POST /api/auth/admin-login` limited to 5 attempts per client IP per 15 minutes to mitigate brute force.
- **Session cookie**: `httpOnly`, `secure` when over HTTPS, `sameSite` (lax/strict or none when secure). No script access to session.
- **Admin procedures**: Data refresh, metrics refresh, commentary create/update/delete, and cache clear require `ctx.user.role === 'admin'`.

## Input Validation & Injection

- **tRPC inputs**: Validated with Zod. `metricKey` restricted to `^[a-zA-Z0-9_]+$` and length 1–128 to prevent NoSQL operator injection in MongoDB queries.
- **Commentary**: `title` max 500 chars, `content` max 50,000 chars, `period` max 100 chars to limit payload size and abuse.
- **Metrics**: `historyLimit` capped at 500; category is an enum. No raw user input is interpolated into queries.

## Security Headers

- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `SAMEORIGIN`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Content-Security-Policy** (production only): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`

## Rate Limiting

- **Admin login**: 3 attempts per client IP per 15 minutes (then HTTP 429). Success clears the count for that IP.

## Operational Security

- **Admin credentials**: Prefer `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables in production; defaults exist for development only.
- **Exec**: Data ingestion runs fixed Python scripts with fixed args (e.g. `--historical`); no user input is passed into shell commands.
- **Logging**: No logging of passwords or session tokens. Debug logging of request inputs has been reduced.

## Dependency Audit

- **@trpc/server** upgraded to ^11.8+ (prototype pollution fix).
- **fast-xml-parser** overridden to >=5.3.5 (transitive from AWS SDK).
- **tar** overridden to >=7.5.7 (transitive from Tailwind).
- **qs** overridden to >=6.14.1 (transitive from Express; DoS fix).
- **axios** upgraded to ^1.13.5 (mergeConfig __proto__ fix).
- **vite** upgraded to ^7.1.11 (fs.deny bypass fix).
- **pnpm** devDependency set to ^10.27+ (lockfile/script/command-injection fixes). Run `pnpm install` and upgrade the global pnpm if needed.

Run `pnpm audit` periodically and address new advisories.

## Recommendations

- Use HTTPS in production and ensure `secure` is set on cookies (handled when `x-forwarded-proto` is https).
- Rotate admin password periodically and keep it in env/secret manager only.
- Upgrade the global pnpm to 10.27+ when possible (`npm i -g pnpm` or corepack).
