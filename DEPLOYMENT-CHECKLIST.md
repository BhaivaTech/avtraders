# AV Traders Deployment Checklist
## Server: 10.160.0.5 | Domain: av.bhaiavtech.com

---

## Pre-Deployment Checklist

### DNS Configuration
- [ ] Login to your domain registrar (or DNS provider)
- [ ] Add A record: `av.bhaiavtech.com` → `10.160.0.5`
- [ ] Add A record: `www.bhaiavtech.com` → `10.160.0.5`
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify: `ping av.bhaiavtech.com` should show `10.160.0.5`

### GCP Firewall Rules
- [ ] Go to GCP Console → VPC Network → Firewall
- [ ] Create rule: Allow TCP port 80 from 0.0.0.0/0
- [ ] Create rule: Allow TCP port 443 from 0.0.0.0/0
- [ ] Create rule: Allow TCP port 22 from your IP (SSH)

```bash
# Or via gcloud CLI:
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server
```

---

## Server Setup

### Step 1: Connect to Server
```bash
ssh your-username@10.160.0.5
# Or if using external IP:
ssh your-username@EXTERNAL_IP
```

### Step 2: Run Setup Script
```bash
# Upload the deployment script
scp deploy-vm.sh your-username@10.160.0.5:/tmp/

# Connect and run
ssh your-username@10.160.0.5
chmod +x /tmp/deploy-vm.sh
sudo /tmp/deploy-vm.sh
```

### Step 3: Clone Repository
```bash
# Switch to app user
sudo su - app

# Clone the repository
cd /home/app/avtraders
git clone https://github.com/yourusername/avtraders.git .
```

---

## Backend Deployment

### Step 1: Configure Environment
```bash
cd /home/app/avtraders/backend

# Copy production env
cp .env.production .env

# Edit with actual values
nano .env
```

**Required Updates:**
| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Random 64-char string |
| `JWT_SECRET` | Random 64-char string |
| `MSG91_AUTH_KEY` | MSG91 API key |
| `MSG91_WA_NAMESPACE` | MSG91 namespace UUID |
| `MSG91_WA_INTEGRATED_NUMBER` | WhatsApp number |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `PHONEPE_MERCHANT_ID` | PhonePe merchant ID |
| `PHONEPE_SALT_KEY` | PhonePe salt key |
| `ADMIN_PASSWORD` | Admin login password |

**Generate Random Secrets:**
```bash
# Generate random strings
openssl rand -base64 64
```

### Step 2: Install Dependencies
```bash
npm install --production
```

### Step 3: Import Database
```bash
mysql -u avtraders -p avtradersdb < schema.sql
```

### Step 4: Start with PM2
```bash
cd /home/app/avtraders
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 status
```

---

## Frontend Deployment

### Step 1: Configure Environment
```bash
cd /home/app/avtraders/frontend

# Copy production env
cp .env.production .env

# Edit if needed
nano .env
```

### Step 2: Build
```bash
npm install
npm run build
```

### Step 3: Update Nginx Config
```bash
# Edit Nginx config with correct paths
sudo nano /etc/nginx/sites-available/av.bhaiavtech.com

# Update the frontend location block:
# proxy_pass http://127.0.0.1:5173;  # For dev server
# OR serve static files directly:
# root /home/app/avtraders/frontend/dist;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Post-Deployment Verification

### 1. Check Services
```bash
# Backend status
pm2 status

# Nginx status
sudo systemctl status nginx

# MySQL status
sudo systemctl status mysql

# View logs
pm2 logs avtraders-backend
sudo tail -f /var/log/nginx/av.bhaiavtech.com.access.log
```

### 2. Test Endpoints
```bash
# Backend health
curl https://av.bhaiavtech.com/health

# Frontend
curl -I https://av.bhaiavtech.com

# API
curl https://av.bhaiavtech.com/api/health
```

### 3. SSL Verification
- Visit https://av.bhaiavtech.com
- Check for padlock icon
- Verify certificate is valid

---

## Maintenance Commands

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs avtraders-backend

# Restart backend
pm2 restart avtraders-backend

# Stop backend
pm2 stop avtraders-backend

# Monitor resources
pm2 monit
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/av.bhaiavtech.com.error.log
```

### MySQL Commands
```bash
# Connect to database
mysql -u avtraders -p avtradersdb

# Backup database
mysqldump -u avtraders -p avtradersdb > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u avtraders -p avtradersdb < backup_file.sql
```

### SSL Renewal
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs avtraders-backend --lines 100

# Check if port is in use
sudo lsof -i :5100

# Check environment
pm2 env 0
```

### 502 Bad Gateway
```bash
# Check backend is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/av.bhaiavtech.com.error.log

# Check backend logs
pm2 logs avtraders-backend
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u avtraders -p -h 127.0.0.1 avtradersdb

# Check MySQL is running
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### SSL Issues
```bash
# Check certificate
sudo certbot certificates

# Check Nginx SSL config
sudo nginx -t

# Check if port 443 is open
sudo netstat -tlnp | grep 443
```

---

## Backup Strategy

### Database Backup Script
```bash
#!/bin/bash
# /home/app/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/app/backups"
BACKUP_FILE="$BACKUP_DIR/avtradersdb_$DATE.sql.gz"

# Create backup
mysqldump -u avtraders -p'AvTr@ders2024!' avtradersdb | gzip > $BACKUP_FILE

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null

echo "Backup created: $BACKUP_FILE"
```

### Add to Cron
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/app/scripts/backup-db.sh >> /home/app/logs/backup.log 2>&1
```

---

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] Fail2ban configured
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Database password is strong
- [ ] Regular backups configured
- [ ] Log rotation configured
- [ ] UFW firewall enabled

---

## Monitoring

### Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/avtraders

# Add:
/home/app/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 app app
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Monitor Resources
```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit
```

---

## Quick Reference

| Service | Command |
|---------|---------|
| **Backend** | `pm2 restart avtraders-backend` |
| **Nginx** | `sudo systemctl restart nginx` |
| **MySQL** | `sudo systemctl restart mysql` |
| **Logs** | `pm2 logs avtraders-backend` |
| **Status** | `pm2 status` |
| **SSL** | `sudo certbot certificates` |

---

## Support Contacts

- **Domain**: av.bhaiavtech.com
- **Server IP**: 10.160.0.5
- **SSH**: `ssh app@10.160.0.5`
- **MySQL**: `mysql -u avtraders -p avtradersdb`
