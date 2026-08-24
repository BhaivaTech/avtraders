#!/bin/bash
# ============================================
# AV Traders - Fresh VM Setup Script
# User: chethan | VM: 34.47.226.103
# Domain: av.bhaivatech.com
# ============================================
# Run INSIDE the VM as: bash setup-vm-fresh.sh
# ============================================

set -e

# ============================================
# CONFIG
# ============================================
APP_USER="chethan"
APP_DIR="/home/$APP_USER/avtraders"
DOMAIN="av.bhaivatech.com"
SERVER_IP="34.47.226.103"
NODE_VERSION="20"
GITHUB_REPO="https://github.com/BhaivaTech/avtraders.git"
BRANCH="development"

# Remote DB
DB_HOST="46.28.44.56"
DB_PORT="3306"
DB_NAME="avtradersdb"
DB_USER="appuser"
DB_PASSWORD="DataSync@VPS1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "   AV Traders - VM Setup & Deploy"
echo "=========================================="
echo "User:   $APP_USER"
echo "Dir:    $APP_DIR"
echo "Domain: $DOMAIN"
echo "IP:     $SERVER_IP"
echo "Repo:   $GITHUB_REPO"
echo "=========================================="
echo -e "${NC}"

# ============================================
# PHASE 1: System Dependencies
# ============================================
echo -e "\n${YELLOW}[PHASE 1] Installing system dependencies...${NC}"
sudo apt update -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx \
    mysql-client ufw fail2ban htop unzip wget

# ============================================
# PHASE 2: Node.js + PM2
# ============================================
echo -e "\n${YELLOW}[PHASE 2] Installing Node.js ${NODE_VERSION} + PM2...${NC}"
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node: $(node --version) | npm: $(npm --version)"

if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2
fi
echo "PM2: $(pm2 --version)"

# ============================================
# PHASE 3: Firewall
# ============================================
echo -e "\n${YELLOW}[PHASE 3] Configuring firewall...${NC}"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo -e "${GREEN}✔ Firewall configured${NC}"

# ============================================
# PHASE 4: Clone / Pull Code
# ============================================
echo -e "\n${YELLOW}[PHASE 4] Setting up application code...${NC}"
mkdir -p /home/$APP_USER/logs
mkdir -p /home/$APP_USER/backups

if [ -d "$APP_DIR/.git" ]; then
    echo "  Repo exists — pulling latest from $BRANCH..."
    cd $APP_DIR
    git fetch --all
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "  Cloning repo from GitHub..."
    git clone -b $BRANCH $GITHUB_REPO $APP_DIR
fi
echo -e "${GREEN}✔ Code ready at $APP_DIR${NC}"
echo "  Commit: $(cd $APP_DIR && git log -1 --oneline)"

# ============================================
# PHASE 5: Backend .env Setup
# ============================================
echo -e "\n${YELLOW}[PHASE 5] Configuring backend environment...${NC}"
if [ -f "$APP_DIR/backend/.env.production" ]; then
    cp $APP_DIR/backend/.env.production $APP_DIR/backend/.env

    SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')

    sed -i "s/CHANGE_ME_TO_RANDOM_64_CHAR_STRING/${SESSION_SECRET}/" $APP_DIR/backend/.env
    sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST}|" $APP_DIR/backend/.env
    sed -i "s|DB_PORT=.*|DB_PORT=${DB_PORT}|" $APP_DIR/backend/.env
    sed -i "s|DB_USER=.*|DB_USER=${DB_USER}|" $APP_DIR/backend/.env
    sed -i "s|DB_PASS=.*|DB_PASS=${DB_PASSWORD}|" $APP_DIR/backend/.env
    sed -i "s|DB_NAME=.*|DB_NAME=${DB_NAME}|" $APP_DIR/backend/.env
    sed -i "s|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|BACKEND_BASE_URL=.*|BACKEND_BASE_URL=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|APP_ORIGIN=.*|APP_ORIGIN=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN}|" $APP_DIR/backend/.env
    sed -i "s|COOKIE_DOMAIN=.*|COOKIE_DOMAIN=.bhaivatech.com|" $APP_DIR/backend/.env

    echo -e "${GREEN}✔ Backend .env configured${NC}"
else
    echo -e "${RED}⚠ No .env.production found — creating minimal .env...${NC}"
    cat > $APP_DIR/backend/.env <<ENVEOF
NODE_ENV=production
PORT=5100
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASSWORD}
SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
PUBLIC_BASE_URL=https://${DOMAIN}
BACKEND_BASE_URL=https://${DOMAIN}
APP_ORIGIN=https://${DOMAIN}
ALLOWED_ORIGINS=https://${DOMAIN}
COOKIE_DOMAIN=.bhaivatech.com
ENVEOF
    echo -e "${YELLOW}⚠ Minimal .env created — add API keys (MSG91, SMTP, PhonePe) manually after deploy${NC}"
fi

# ============================================
# PHASE 6: Install Backend Dependencies
# ============================================
echo -e "\n${YELLOW}[PHASE 6] Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install --production
echo -e "${GREEN}✔ Backend dependencies installed${NC}"

# ============================================
# PHASE 7: Frontend .env + Build
# ============================================
echo -e "\n${YELLOW}[PHASE 7] Building frontend...${NC}"
if [ -f "$APP_DIR/frontend/.env.production" ]; then
    cp $APP_DIR/frontend/.env.production $APP_DIR/frontend/.env
    sed -i "s|VITE_SITE_URL=.*|VITE_SITE_URL=https://${DOMAIN}|" $APP_DIR/frontend/.env
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://${DOMAIN}/api|" $APP_DIR/frontend/.env
else
    echo "VITE_SITE_URL=https://${DOMAIN}" > $APP_DIR/frontend/.env
    echo "VITE_API_URL=https://${DOMAIN}/api" >> $APP_DIR/frontend/.env
fi

cd $APP_DIR/frontend
npm install
npm run build
echo -e "${GREEN}✔ Frontend built${NC}"

# Fix permissions so Nginx (www-data) can read files in home dir
chmod o+x /home/$APP_USER
chmod -R o+rX $APP_DIR/frontend/dist
echo -e "${GREEN}✔ Permissions fixed for Nginx${NC}"

# ============================================
# PHASE 8: PM2 Setup
# ============================================
echo -e "\n${YELLOW}[PHASE 8] Starting backend with PM2...${NC}"
cd $APP_DIR

# Update ecosystem config for current user
sed -i "s|/home/swaragh092/|/home/${APP_USER}/|g" $APP_DIR/ecosystem.config.cjs

pm2 delete avtraders-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
echo -e "${GREEN}✔ PM2 running${NC}"

# ============================================
# PHASE 9: Nginx (HTTP first)
# ============================================
echo -e "\n${YELLOW}[PHASE 9] Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null <<NGINX_CONFIG
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_read_timeout 86400s;
    }

    location /health {
        proxy_pass http://127.0.0.1:5100;
        access_log off;
    }

    location / {
        root ${APP_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|pdf)$ {
        root ${APP_DIR}/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log /var/log/nginx/${DOMAIN}.error.log;
    client_max_body_size 50M;
}
NGINX_CONFIG

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo -e "${GREEN}✔ Nginx running on HTTP${NC}"

# ============================================
# PHASE 10: SSL Certificate
# ============================================
echo -e "\n${YELLOW}[PHASE 10] Setting up SSL...${NC}"
echo ""
echo -e "${YELLOW}DNS Check for ${DOMAIN}:${NC}"
host ${DOMAIN} 2>/dev/null || dig +short ${DOMAIN} || echo "Cannot resolve DNS"

echo ""
echo -e "${YELLOW}Make sure DNS A record points to: ${SERVER_IP}${NC}"
echo ""
read -p "Press Enter to get SSL certificate (or Ctrl+C to skip SSL for now)..."

if sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
    --non-interactive --agree-tos \
    --email admin@bhaivatech.com --redirect 2>/dev/null; then
    echo -e "${GREEN}✔ SSL certificate installed${NC}"
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
else
    echo -e "${YELLOW}⚠ SSL skipped — site running on HTTP. Run certbot manually when DNS is ready.${NC}"
fi

# ============================================
# PHASE 11: Verification
# ============================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}PM2 Status:${NC}"
pm2 status

echo -e "\n${GREEN}Nginx Status:${NC}"
sudo systemctl status nginx --no-pager -l | head -5

echo -e "\n${GREEN}Backend Health:${NC}"
sleep 3
curl -s http://localhost:5100/health 2>/dev/null || curl -s http://localhost:5100/api/health 2>/dev/null || echo "Backend starting up..."

echo ""
echo "=========================================="
echo "  Site:    https://${DOMAIN}"
echo "  API:     https://${DOMAIN}/api"
echo "  Health:  https://${DOMAIN}/health"
echo "  Logs:    pm2 logs avtraders-backend"
echo "  Update:  cd ~/avtraders && bash update.sh"
echo "=========================================="
echo ""
echo -e "${YELLOW}ACTION REQUIRED - Add these to ~/avtraders/backend/.env:${NC}"
echo "  MSG91_AUTH_KEY=your-key"
echo "  MSG91_WA_NAMESPACE=your-namespace"
echo "  MSG91_WA_INTEGRATED_NUMBER=your-number"
echo "  SMTP_USER=your-gmail"
echo "  SMTP_PASS=your-app-password"
echo "  PHONEPE_MERCHANT_ID=your-merchant-id"
echo "  PHONEPE_SALT_KEY=your-salt-key"
echo "  ADMIN_PASSWORD=your-admin-password"
echo ""
echo "Then run: pm2 restart avtraders-backend"
echo "=========================================="
