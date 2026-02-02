# UK RAG Portal - Setup Complete

## ✅ Setup Summary

The UK RAG Portal has been successfully set up and is running with HTTPS enabled. The portal monitors key performance indicators across Economy, Education, Crime, Healthcare, and Defence sectors with real-time data from official UK government sources.

### What Was Done

1. **Dependencies Installed**
   - Node.js 20.20.0 (via nvm)
   - pnpm package manager
   - Python 3 with required packages (requests, pandas, openpyxl)
   - nginx web server
   - certbot for SSL certificates

2. **Code Fixes**
   - Fixed `import.meta.dirname` compatibility issues for Node.js 18/20
   - Updated `vite.config.ts`, `server/_core/vite.ts`, and `vitest.config.ts`

3. **Environment Configuration**
   - Created `.env` file with required environment variables
   - Generated JWT secret for session management

4. **Application Build**
   - Built production version of the application
   - Created systemd service for automatic startup

5. **HTTPS Setup**
   - Configured nginx as reverse proxy
   - Obtained SSL certificate from Let's Encrypt for `uk-rag.online`
   - Configured automatic HTTP to HTTPS redirect

### Services Status

- **UK RAG Portal**: Running on port 3000 (systemd service: `uk-rag-portal`)
- **Nginx**: Running and proxying to the application
- **HTTPS**: Enabled and working at https://uk-rag.online

### Configuration Files

- **Environment**: `/home/ec2-user/uk-rag-portal/.env`
- **Systemd Service**: `/etc/systemd/system/uk-rag-portal.service`
- **Nginx Config**: `/etc/nginx/conf.d/uk-rag-online.conf`
- **SSL Certificate**: `/etc/letsencrypt/live/uk-rag.online/`

### Useful Commands

**Start/Stop/Restart the application:**
```bash
sudo systemctl start uk-rag-portal
sudo systemctl stop uk-rag-portal
sudo systemctl restart uk-rag-portal
sudo systemctl status uk-rag-portal
```

**View application logs:**
```bash
sudo journalctl -u uk-rag-portal -f
```

**Restart nginx:**
```bash
sudo systemctl restart nginx
```

**Run in development mode:**
```bash
cd /home/ec2-user/uk-rag-portal
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
npx --yes pnpm@10.4.1 dev
```

**Build for production:**
```bash
cd /home/ec2-user/uk-rag-portal
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
npx --yes pnpm@10.4.1 build
sudo systemctl restart uk-rag-portal
```

**Install or update the systemd service (always on port 3000):**

The service runs the production app on **port 3000** and restarts automatically on failure or reboot. After changing `uk-rag-portal.service` in the repo:

```bash
sudo cp /home/ec2-user/uk-rag-portal/uk-rag-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable uk-rag-portal   # start on boot
sudo systemctl start uk-rag-portal   # start now
sudo systemctl status uk-rag-portal
```

Ensure the app is built before first start: `npm run build` from the project directory.

### Preventing sign-in 502 / downtime (recurring outages)

If the portal goes down (e.g. 502 on Sign in) after reboots or overnight, do the following once so it does not happen again:

1. **Start on boot**  
   The service must be **enabled** so it starts after EC2 reboot or maintenance:
   ```bash
   sudo systemctl enable uk-rag-portal
   sudo systemctl status uk-rag-portal   # confirm it is enabled and active
   ```

2. **Use the hardened systemd unit**  
   The repo’s `uk-rag-portal.service` is set up to:
   - Start after the network is up (`network-online.target`)
   - Retry forever on crash (`StartLimitIntervalSec=0`)
   - Allow up to 2 minutes for startup (`TimeoutStartSec=120`)  
   After any change to the unit file:
   ```bash
   sudo cp /home/ec2-user/uk-rag-portal/uk-rag-portal.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable uk-rag-portal
   sudo systemctl restart uk-rag-portal
   ```

3. **Optional: watchdog cron**  
   To automatically restart the app if it stops responding (e.g. stuck process), run the watchdog script every 5 minutes:
   ```bash
   chmod +x /home/ec2-user/uk-rag-portal/scripts/ensure-uk-rag-portal-up.sh
   crontab -e
   ```
   Add this line (ec2-user must be able to run `sudo systemctl restart uk-rag-portal`):
   ```
   */5 * * * * /home/ec2-user/uk-rag-portal/scripts/ensure-uk-rag-portal-up.sh
   ```
   Restarts are logged under `logs/watchdog.log`.

4. **If it still goes down**  
   Check why the process stopped: `sudo journalctl -u uk-rag-portal -n 100 --no-pager`. Common causes: out-of-memory, MongoDB unreachable, or port 3000 in use. See `docs/EC2_DASHBOARD_TROUBLESHOOTING.md` (section 6).

### Next Steps

1. **Database Setup**: Configure `DATABASE_URL` in `.env` file
   - Format: `mongodb://localhost:27017/uk_rag_portal` (for local MongoDB)
   - Format: `mongodb://user:password@host:27017/database` (for remote MongoDB)
   - Create indexes: `npm run db:index`
   - Load initial data: `npm run load:metrics`
   - Backfill historical data: `npm run backfill:historical`
   - Set up scheduled pulls: `./server/createScheduledJob.sh`

2. **OAuth Configuration** (optional): If you need authentication, configure:
   - `OAUTH_SERVER_URL`
   - `VITE_APP_ID`
   - `OWNER_OPEN_ID`

3. **Forge API** (optional): If you need storage/maps features:
   - `BUILT_IN_FORGE_API_URL`
   - `BUILT_IN_FORGE_API_KEY`

### SSL Certificate Renewal

Certbot has been configured to automatically renew the SSL certificate. The certificate will expire on 2026-04-24 and will be automatically renewed before expiration.

You can manually test renewal with:
```bash
sudo certbot renew --dry-run
```

### Access

- **HTTPS**: https://uk-rag.online
- **Local**: http://localhost:3000 (when accessing directly on the server)
