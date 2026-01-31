# IP Address Access Fix

## Issue

Accessing the portal via IP address (`http://13.135.206.128/`) was returning 404 errors because nginx only had server blocks configured for the domain name `automate-workflows.com`, not for the IP address.

## Root Cause

When nginx receives a request, it matches the request to a server block based on:
1. The `listen` directive (port)
2. The `server_name` directive (hostname/IP)

Since the configuration only had `server_name automate-workflows.com`, requests to the IP address didn't match any server block and fell back to the default server block, which returned 404.

## Solution

Added a dedicated server block for IP address access:

```nginx
# Server block for IP address access (HTTP only, no SSL)
server {
    listen 80;
    server_name 13.135.206.128;

    # ... proxy configuration ...
}
```

This server block:
- Listens on port 80 for requests to the IP address
- Proxies requests to the Node.js application on `localhost:3000`
- Sets the `Host` header to `automate-workflows.com` so the application receives the correct hostname
- Uses the same logging and configuration as the domain server block

## Configuration Structure

The nginx configuration now has three server blocks:

1. **IP Address Server Block** (port 80)
   - Handles `http://13.135.206.128/`
   - Proxies to Node.js app

2. **Domain HTTPS Server Block** (port 443)
   - Handles `https://automate-workflows.com`
   - SSL/TLS certificates managed by Certbot
   - Proxies to Node.js app

3. **Domain HTTP Redirect Server Block** (port 80)
   - Handles `http://automate-workflows.com`
   - Redirects to HTTPS (managed by Certbot)

## Verification

✅ IP address access: `http://13.135.206.128/` → Returns 200 OK
✅ Domain HTTPS access: `https://automate-workflows.com` → Returns 200 OK
✅ Domain HTTP redirect: `http://automate-workflows.com` → Redirects to HTTPS

## Important Notes

1. **SSL Certificates**: SSL certificates are only valid for the domain name, not IP addresses. Therefore, the IP address server block only serves HTTP (port 80), not HTTPS.

2. **Host Header**: The IP address server block sets `Host: automate-workflows.com` so the application receives the correct hostname, which is important for any hostname-based logic in the application.

3. **Certbot**: The SSL configuration is managed by Certbot. If you run `certbot renew` or modify certificates, Certbot may update the domain server blocks but will not modify the IP address server block.

## Testing

Test IP access:
```bash
curl -I http://13.135.206.128/
# Should return: HTTP/1.1 200 OK

curl -s http://13.135.206.128/ | grep -o "<title>.*</title>"
# Should return: <title>UK RAG Dashboard</title>
```

Test domain access:
```bash
curl -I https://automate-workflows.com
# Should return: HTTP/1.1 200 OK
```
