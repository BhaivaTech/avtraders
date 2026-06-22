#!/bin/bash
# ============================================
# AV Traders - Emergency SSL Fix Script
# Fixes: missing cert + nginx down on live server
# Run as: sudo bash fix-ssl-now.sh
# ============================================

set -e

DOMAIN="av.bhaivatech.com"
SERVER_IP="34.180.17.171"
APP_USER="swaragh092"
APP_DIR="/home/$APP_USER/avtraders"
ADMIN_EMAIL="admin@bhaivatech.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AV Traders - Emergency SSL Fix${NC}"
echo -e "${BLUE}  Domain: $DOMAIN${NC}"
echo -e "${BLUE}========================================${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# ============================================
# STEP 1: Remove broken Nginx config (if any)
# ============================================
echo -e "\n${YELLOW}[1/5] Checking existing Nginx configs...${NC}"

# Check for any config referencing the wrong domain
grep -r "bhaiavtech" /etc/nginx/ 2>/dev/null && echo -e "${RED}Found wrong domain in nginx config!${NC}" || echo -e "${GREEN}No wrong domain references found${NC}"

# List current certs
echo -e "\n${YELLOW}Existing Let's Encrypt certs:${NC}"
ls /etc/letsencrypt/live/ 2>/dev/null || echo "No certs found"

# ============================================
# STEP 2: Write a clean HTTP-only Nginx config
#         (removes SSL refs so nginx can start)
# ============================================
echo -e "\n${YELLOW}[2/5] Writing temporary HTTP-only Nginx config...${NC}"

cat > /etc/nginx/sites-available/${DOMAIN} << NGINX_HTTP
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
    }

    # Health
    location /health {
        proxy_pass http://127.0.0.1:5100;
        access_log off;
    }

    # Frontend
    location / {
        root ${APP_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root ${APP_DIR}/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log /var/log/nginx/${DOMAIN}.error.log;
    client_max_body_size 50M;
}
NGINX_HTTP

# Enable site, disable default
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}

echo -e "${GREEN}HTTP-only config written${NC}"

# ============================================
# STEP 3: Test + Start Nginx
# ============================================
echo -e "\n${YELLOW}[3/5] Testing and starting Nginx...${NC}"
nginx -t
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}Nginx is UP (HTTP only)${NC}"

# ============================================
# STEP 4: Ensure port 80 is open for certbot
# ============================================
echo -e "\n${YELLOW}[4/5] Ensuring firewall allows HTTP/HTTPS...${NC}"
ufw allow 80/tcp comment 'HTTP - certbot'
ufw allow 443/tcp comment 'HTTPS'
ufw status verbose

# ============================================
# STEP 5: Issue SSL Certificate
# ============================================
echo -e "\n${YELLOW}[5/5] Issuing SSL certificate for ${DOMAIN}...${NC}"
echo -e "${YELLOW}Note: DNS must point ${DOMAIN} -> ${SERVER_IP}${NC}"
echo ""

# Check DNS first
echo -e "${BLUE}DNS check:${NC}"
host ${DOMAIN} || echo "DNS may not be propagated yet"

echo ""
echo -e "${YELLOW}⚠️  If using Cloudflare: set ${DOMAIN} to DNS Only (grey cloud) before continuing!${NC}"
echo ""
read -p "Press Enter when DNS is confirmed and Cloudflare proxy is OFF... "

# Run certbot
certbot --nginx \
    -d ${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${ADMIN_EMAIL} \
    --redirect

# Enable auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

echo -e "${GREEN}SSL certificate installed and auto-renewal enabled${NC}"

# ============================================
# VERIFY
# ============================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Final Verification${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${BLUE}Nginx status:${NC}"
systemctl status nginx --no-pager -l | head -8

echo -e "\n${BLUE}SSL cert check:${NC}"
certbot certificates 2>/dev/null | grep -A4 "${DOMAIN}" || echo "Run: certbot certificates"

echo -e "\n${BLUE}HTTPS test:${NC}"
sleep 2
curl -sI https://${DOMAIN} | head -6 || echo "HTTPS not yet responding"

echo -e "\n${GREEN}========================================"
echo "  FIX COMPLETE!"
echo "  Site: https://${DOMAIN}"
echo -e "========================================${NC}"
