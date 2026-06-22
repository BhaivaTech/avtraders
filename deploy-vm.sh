#!/bin/bash
# ============================================
# AV Traders - Complete VM Deployment Script
# Server: 34.180.17.171 | Domain: av.bhaivatech.com
# ============================================
# Run this script as root or with sudo
# Usage: sudo ./deploy-vm.sh
# ============================================

set -e

# ============================================
# CONFIGURATION - Update these values
# ============================================
DOMAIN="av.bhaivatech.com"
SERVER_IP="34.180.17.171"
APP_USER="swaragh092"  # Your current username
APP_DIR="/home/$APP_USER/avtraders"
NODE_VERSION="20"
# Remote Database (external VPS)
DB_HOST="46.28.44.56"
DB_PORT="3306"
DB_NAME="avtradersdb"
DB_USER="appuser"
DB_PASSWORD="DataSync@VPS1"
ADMIN_EMAIL="admin@bhaivatech.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=========================================="
echo "   AV Traders - GCP VM Deployment"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Server: $SERVER_IP"
echo "User: $APP_USER"
echo "App Dir: $APP_DIR"
echo "=========================================="
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# ============================================
# PHASE 1: SYSTEM SETUP
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 1: System Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 1.1: Update System
echo -e "\n${GREEN}[1.1] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 1.2: Install Dependencies
echo -e "\n${GREEN}[1.2] Installing system dependencies...${NC}"
apt install -y \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    mysql-client \
    ufw \
    fail2ban \
    htop \
    unzip \
    wget \
    software-properties-common
# Note: mysql-server NOT installed - using remote DB at ${DB_HOST}

# ============================================
# PHASE 2: NODE.JS & PM2
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 2: Node.js & PM2${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 2.1: Install Node.js
echo -e "\n${GREEN}[2.1] Installing Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Verify installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Step 2.2: Install PM2
echo -e "\n${GREEN}[2.2] Installing PM2 globally...${NC}"
npm install -g pm2

# ============================================
# PHASE 3: REMOTE DATABASE CHECK
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 3: Remote Database Connection Test${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}[3.1] Testing remote database connection...${NC}"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"

if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1;" &>/dev/null; then
    echo -e "${GREEN}✔ Remote DB connection successful${NC}"
else
    echo -e "${RED}✘ Cannot connect to remote DB at ${DB_HOST}:${DB_PORT}${NC}"
    echo -e "${YELLOW}Check: firewall rules on the remote VPS allow ${SERVER_IP} on port 3306${NC}"
    echo -e "${YELLOW}Continuing anyway — fix DB access and re-run if needed${NC}"
fi

# ============================================
# PHASE 4: FIREWALL SETUP
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 4: Firewall Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 4.1: Configure UFW
echo -e "\n${GREEN}[4.1] Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo -e "${GREEN}Firewall status:${NC}"
ufw status verbose

# ============================================
# PHASE 5: NGINX SETUP (HTTP FIRST)
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 5: Nginx Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 5.1: Create Nginx HTTP-only config
echo -e "\n${GREEN}[5.1] Creating Nginx configuration (HTTP)...${NC}"
cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINX_CONFIG'
# AV Traders - Nginx Configuration (HTTP - for SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # Upstream backend
    location /api/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5100;
        access_log off;
    }

    # Frontend
    location / {
        root APP_DIR_PLACEHOLDER/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root APP_DIR_PLACEHOLDER/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/DOMAIN_PLACEHOLDER.access.log;
    error_log /var/log/nginx/DOMAIN_PLACEHOLDER.error.log;

    # Max upload size
    client_max_body_size 50M;
}
NGINX_CONFIG

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/${DOMAIN}
sed -i "s|APP_DIR_PLACEHOLDER|${APP_DIR}|g" /etc/nginx/sites-available/${DOMAIN}

# Step 5.2: Enable site
echo -e "\n${GREEN}[5.2] Enabling Nginx site...${NC}"
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/

# Step 5.3: Test and start Nginx
echo -e "\n${GREEN}[5.3] Testing and starting Nginx...${NC}"
nginx -t
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}Nginx is running${NC}"

# ============================================
# PHASE 6: APPLICATION SETUP
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 6: Application Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 6.1: Create directories
echo -e "\n${GREEN}[6.1] Creating application directories...${NC}"
mkdir -p $APP_DIR
mkdir -p /home/$APP_USER/logs
mkdir -p /home/$APP_USER/backups

# Step 6.2: Setup Backend Environment
echo -e "\n${GREEN}[6.2] Setting up backend environment...${NC}"
if [ -f "$APP_DIR/backend/.env.production" ]; then
    cp $APP_DIR/backend/.env.production $APP_DIR/backend/.env
    
    # Generate random secrets
    SESSION_SECRET=$(openssl rand -base64 64)
    JWT_SECRET=$(openssl rand -base64 64)
    
    # Update .env with generated secrets
    sed -i "s/CHANGE_ME_TO_RANDOM_64_CHAR_STRING/${SESSION_SECRET}/" $APP_DIR/backend/.env

    # Inject remote DB config
    sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST}|" $APP_DIR/backend/.env
    sed -i "s|DB_PORT=.*|DB_PORT=${DB_PORT}|" $APP_DIR/backend/.env
    sed -i "s|DB_USER=.*|DB_USER=${DB_USER}|" $APP_DIR/backend/.env
    sed -i "s|DB_PASS=.*|DB_PASS=${DB_PASSWORD}|" $APP_DIR/backend/.env
    sed -i "s|DB_NAME=.*|DB_NAME=${DB_NAME}|" $APP_DIR/backend/.env

    # Inject domain/origin config
    sed -i "s|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|BACKEND_BASE_URL=.*|BACKEND_BASE_URL=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|APP_ORIGIN=.*|APP_ORIGIN=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN},https://www.bhaivatech.com|" $APP_DIR/backend/.env
    sed -i "s|COOKIE_DOMAIN=.*|COOKIE_DOMAIN=.bhaivatech.com|" $APP_DIR/backend/.env
    sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=${ADMIN_EMAIL}|" $APP_DIR/backend/.env
    
    echo -e "${GREEN}Backend .env created with remote DB config${NC}"
    echo "  DB_HOST=$DB_HOST"
    echo "  DB_PORT=$DB_PORT"
    echo "  DB_NAME=$DB_NAME"
    echo "  DB_USER=$DB_USER"
else
    echo -e "${RED}Warning: .env.production not found. Please create .env manually.${NC}"
fi

# Step 6.3: Install Backend Dependencies
echo -e "\n${GREEN}[6.3] Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install --production

# Step 6.4: Import Database Schema (to remote DB)
echo -e "\n${GREEN}[6.4] Importing database schema to remote DB...${NC}"
if [ -f "$APP_DIR/backend/schema.sql" ]; then
    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < $APP_DIR/backend/schema.sql
    echo -e "${GREEN}Database schema imported to ${DB_HOST}/${DB_NAME}${NC}"
else
    echo -e "${RED}Warning: schema.sql not found. Import manually later.${NC}"
fi

# Step 6.5: Setup Frontend Environment
echo -e "\n${GREEN}[6.5] Setting up frontend environment...${NC}"
if [ -f "$APP_DIR/frontend/.env.production" ]; then
    cp $APP_DIR/frontend/.env.production $APP_DIR/frontend/.env
    sed -i "s|VITE_SITE_URL=.*|VITE_SITE_URL=https://${DOMAIN}|" $APP_DIR/frontend/.env
    echo -e "${GREEN}Frontend .env created${NC}"
else
    echo -e "${RED}Warning: .env.production not found. Please create .env manually.${NC}"
fi

# Step 6.6: Build Frontend
echo -e "\n${GREEN}[6.6] Building frontend...${NC}"
cd $APP_DIR/frontend
npm install
npm run build

# Step 6.7: Start Backend with PM2
echo -e "\n${GREEN}[6.7] Starting backend with PM2...${NC}"
cd $APP_DIR

# Update ecosystem.config.cjs with correct user
sed -i "s/user: 'app'/user: '${APP_USER}'/" $APP_DIR/ecosystem.config.cjs
sed -i "s|cwd: '/home/app/avtraders/backend'|cwd: '${APP_DIR}/backend'|" $APP_DIR/ecosystem.config.cjs

# Start with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

echo -e "${GREEN}Backend started with PM2${NC}"

# ============================================
# PHASE 7: SSL CERTIFICATE
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 7: SSL Certificate${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}[7.1] Getting SSL certificate...${NC}"
echo -e "${YELLOW}Make sure DNS A record for ${DOMAIN} points to ${SERVER_IP}${NC}"
echo ""
echo -e "${YELLOW}Current DNS check:${NC}"
host ${DOMAIN} || echo "DNS not yet propagated"

echo ""
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)... "

# Get SSL certificate
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${ADMIN_EMAIL} \
    --redirect

# Setup auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

echo -e "${GREEN}SSL certificate installed${NC}"

# ============================================
# PHASE 8: FINAL NGINX CONFIG (WITH SSL)
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 8: Final Nginx Configuration${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}[8.1] Creating final Nginx config with SSL...${NC}"
cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINX_SSL_CONFIG'
# AV Traders - Nginx Configuration (HTTPS)
upstream backend {
    server 127.0.0.1:5100;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location / {
        return 301 https://DOMAIN_PLACEHOLDER$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/chain.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/DOMAIN_PLACEHOLDER.access.log;
    error_log /var/log/nginx/DOMAIN_PLACEHOLDER.error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Max upload size
    client_max_body_size 50M;

    # API Routes
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check
    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|webm|pdf)$ {
        root APP_DIR_PLACEHOLDER/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend
    location / {
        root APP_DIR_PLACEHOLDER/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
NGINX_SSL_CONFIG

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/${DOMAIN}
sed -i "s|APP_DIR_PLACEHOLDER|${APP_DIR}|g" /etc/nginx/sites-available/${DOMAIN}

# Test and reload
nginx -t
systemctl reload nginx

echo -e "${GREEN}Nginx configured with SSL${NC}"

# ============================================
# PHASE 9: VERIFICATION
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 9: Verification${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}[9.1] Checking services...${NC}"

# Check PM2
echo -e "\n${BLUE}PM2 Status:${NC}"
pm2 status

# Check Nginx
echo -e "\n${BLUE}Nginx Status:${NC}"
systemctl status nginx --no-pager -l | head -10

# Check MySQL
echo -e "\n${BLUE}MySQL Status:${NC}"
systemctl status mysql --no-pager -l | head -10

# Test backend
echo -e "\n${BLUE}Backend Health Check:${NC}"
sleep 3
curl -s http://localhost:5100/health || echo "Backend not responding yet"

# Test HTTPS
echo -e "\n${BLUE}HTTPS Test:${NC}"
curl -sI https://${DOMAIN} | head -5

# Check SSL
echo -e "\n${BLUE}SSL Certificate:${NC}"
curl -sI https://${DOMAIN} 2>&1 | grep -i "strict-transport" || echo "SSL configured"

# ============================================
# COMPLETE
# ============================================
echo -e "\n${GREEN}"
echo "=========================================="
echo "   DEPLOYMENT COMPLETE!"
echo "=========================================="
echo -e "${NC}"
echo ""
echo "Website: https://${DOMAIN}"
echo "Backend: https://${DOMAIN}/api"
echo "Health:  https://${DOMAIN}/health"
echo ""
echo "SSH:     ssh ${APP_USER}@${SERVER_IP}"
echo "MySQL:   mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p ${DB_NAME}"
echo "Logs:    pm2 logs avtraders-backend"
echo "Status:  pm2 status"
echo ""
echo "=========================================="
echo "IMPORTANT: Update these in backend/.env:"
echo "=========================================="
echo "1. MSG91_AUTH_KEY - Your MSG91 API key"
echo "2. MSG91_WA_NAMESPACE - MSG91 namespace UUID"
echo "3. MSG91_WA_INTEGRATED_NUMBER - WhatsApp number"
echo "4. SMTP_USER - Gmail address"
echo "5. SMTP_PASS - Gmail App Password"
echo "6. PHONEPE_MERCHANT_ID - PhonePe merchant ID"
echo "7. PHONEPE_SALT_KEY - PhonePe salt key"
echo "8. ADMIN_PASSWORD - Admin login password"
echo ""
echo "Then restart backend:"
echo "  cd $APP_DIR"
echo "  pm2 restart avtraders-backend"
echo "=========================================="
