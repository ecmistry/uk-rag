# HTTPS Domain Access Fix

## Issue

User reported that `https://automate-workflows.com` was not working, while `http://13.135.206.128/` was working correctly.

## Investigation

From server-side testing, HTTPS was actually working:
- ✅ SSL certificate is valid (Let's Encrypt, expires 2026-04-24)
- ✅ Port 443 is listening and accepting connections
- ✅ HTTPS returns 200 OK with correct content
- ✅ HTTP correctly redirects to HTTPS (301 redirect)

## Root Cause

The nginx configuration had a problematic HTTP redirect block that was managed by Certbot. The block had:
```nginx
server {
    if ($host = automate-workflows.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name automate-workflows.com www.automate-workflows.com;
    return 404; # managed by Certbot
}
```

While this worked, it was unnecessarily complex. The `if` statement and subsequent `return 404` created a confusing configuration.

## Solution

Simplified the HTTP redirect block to a cleaner configuration:

```nginx
# HTTP to HTTPS redirect for domain
server {
    listen 80;
    server_name automate-workflows.com www.automate-workflows.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}
```

## Current Configuration

The nginx configuration now has three server blocks:

1. **IP Address Server Block** (port 80)
   - Handles `http://13.135.206.128/`
   - Proxies directly to Node.js app (no SSL)

2. **Domain HTTPS Server Block** (port 443)
   - Handles `https://automate-workflows.com`
   - SSL/TLS certificates managed by Certbot
   - Proxies to Node.js app

3. **Domain HTTP Redirect Server Block** (port 80)
   - Handles `http://automate-workflows.com`
   - Redirects all traffic to HTTPS (301 redirect)

## Verification

All access methods are now working:

✅ **IP Address (HTTP)**: `http://13.135.206.128/` → 200 OK
✅ **Domain (HTTPS)**: `https://automate-workflows.com` → 200 OK  
✅ **Domain (HTTP)**: `http://automate-workflows.com` → 301 redirect to HTTPS

## SSL Certificate Details

- **Certificate**: Let's Encrypt
- **Domain**: automate-workflows.com
- **Expiry**: 2026-04-24 (89 days remaining)
- **Certificate Path**: `/etc/letsencrypt/live/automate-workflows.com/fullchain.pem`
- **Private Key Path**: `/etc/letsencrypt/live/automate-workflows.com/privkey.pem`

## Testing

Test HTTPS access:
```bash
curl -I https://automate-workflows.com
# Should return: HTTP/1.1 200 OK

curl -s https://automate-workflows.com | grep -o "<title>.*</title>"
# Should return: <title>UK RAG Dashboard</title>
```

Test HTTP redirect:
```bash
curl -I http://automate-workflows.com
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://automate-workflows.com/
```

## Troubleshooting

If HTTPS still doesn't work from your browser:

1. **Clear browser cache** - Old cached responses might be interfering
2. **Check browser console** - Look for mixed content warnings or SSL errors
3. **Try incognito/private mode** - Rules out browser extensions
4. **Check DNS** - Ensure DNS is resolving to `13.135.206.128`
5. **Check firewall/security groups** - Ensure port 443 is open in AWS security groups
6. **Check certificate validity** - Run: `sudo certbot certificates`

## AWS Security Group

If HTTPS is still not accessible, verify that your AWS EC2 security group allows inbound traffic on:
- **Port 80** (HTTP)
- **Port 443** (HTTPS)

Both should be open to allow HTTP and HTTPS access.
