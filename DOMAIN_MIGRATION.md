# Domain Migration: automate-workflows.com → uk-rag.online

## ✅ Migration Complete

The portal has been successfully migrated from `automate-workflows.com` to `uk-rag.online`.

## Changes Made

### 1. DNS Configuration
- ✅ DNS verified: `uk-rag.online` → `13.135.206.128`
- ✅ DNS resolution working correctly

### 2. SSL Certificate
- ✅ New SSL certificate obtained for `uk-rag.online`
- ✅ Certificate valid until: **2026-04-26**
- ✅ Certificate path: `/etc/letsencrypt/live/uk-rag.online/`
- ✅ Auto-renewal configured via Certbot

### 3. Nginx Configuration
- ✅ New config file: `/etc/nginx/conf.d/uk-rag-online.conf`
- ✅ HTTP to HTTPS redirect configured
- ✅ SSL/TLS configured for HTTPS
- ✅ Old domain config removed (`automate-workflows.conf`)

### 4. Application Files
- ✅ Recreated deleted files:
  - `client/src/components/MetricHistoryChart.tsx`
  - `client/src/pages/Documentation.tsx`
- ✅ Updated `SETUP.md` with new domain
- ✅ Updated footer text in `Home.tsx`

## Access URLs

- **Primary (HTTPS)**: https://uk-rag.online
- **HTTP Redirect**: http://uk-rag.online → automatically redirects to HTTPS
- **IP Access**: http://13.135.206.128 (HTTP only, proxies to uk-rag.online)

## Verification

✅ **HTTPS**: Working (HTTP 200 OK)
✅ **HTTP Redirect**: Working (HTTP 301 → HTTPS)
✅ **SSL Certificate**: Valid
✅ **Application**: Running and accessible
✅ **Services**: All services active

## Next Steps

1. **Update any bookmarks** to use the new domain
2. **Update any external references** to the portal URL
3. **Test the portal** at https://uk-rag.online
4. **Hard refresh browser** (Ctrl+Shift+R) to clear any cached references to the old domain

## Certificate Renewal

The SSL certificate will automatically renew before expiration (2026-04-26). Certbot has been configured to handle renewals automatically.

To manually test renewal:
```bash
sudo certbot renew --dry-run
```

## Status

✅ **Migration Complete** - The portal is now accessible at https://uk-rag.online
