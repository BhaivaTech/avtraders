#!/bin/bash
# AV Traders - GCP VM Deployment Script
# Server: 10.160.0.5 | Domain: av.bhaiavtech.com

set -e

# ============================================
# CONFIGURATION - Update these values
# ============================================
DOMAIN="av.bhaiavtech.com"
SERVER_IP="34.180.17.171"
APP_USER="app"
APP_DIR="/home/app/avtraders"
NODE_VERSION="20"  # LTS version

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo "AV Traders - VM Deployment"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Server: $SERVER_IP"
echo "==========================================${NC}"

# ============================================
# Step 1: System Update & Dependencies
# ============================================
echo -e "\n${YELLOW}[1/8] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "\n${YELLOW}[2/8] Installing dependencies...${NC}"
sudo apt install -y \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    mysql-server \
    mysql-client \
    ufw \
    fail2ban \
    htop \
    unzip

# ============================================
# Step 2: Install Node.js
# ============================================
echo -e "\n${YELLOW}[3/8] Installing Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# ============================================
# Step 3: Create Application User
# ============================================
echo -e "\n${YELLOW}[4/8] Setting up application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    sudo usermod -aG www-data $APP_USER
    echo "User $APP_USER created"
else
    echo "User $APP_USER already exists"
fi

# Create directories
sudo -u $APP_USER mkdir -p $APP_DIR
sudo -u $APP_USER mkdir -p /home/app/logs
sudo -u $APP_USER mkdir -p /home/app/backups

# ============================================
# Step 4: Setup MySQL
# ============================================
echo -e "\n${YELLOW}[5/8] Configuring MySQL...${NC}"

# Secure MySQL installation
sudo mysql_secure_installation <<EOF

y
StrongPassword123!
StrongPassword123!
y
y
y
y
EOF

# Create database and user
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS avtradersdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'avtraders'@'localhost' IDENTIFIED BY 'AvTr@ders2024!';
GRANT ALL PRIVILEGES ON avtradersdb.* TO 'avtraders'@'localhost';
FLUSH PRIVILEGES;
"

echo -e "${GREEN}MySQL configured with:${NC}"
echo "  Database: avtradersdb"
echo "  User: avtraders"
echo "  Password: AvTr@ders2024!"

# ============================================
# Step 5: Configure Firewall
# ============================================
echo -e "\n${YELLOW}[6/8] Configuring firewall...${NC}"

# Reset UFW
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw --force enable

echo -e "${GREEN}Firewall configured:${NC}"
sudo ufw status verbose

# ============================================
# Step 6: Configure Nginx
# ============================================
echo -e "\n${YELLOW}[7/8] Configuring Nginx...${NC}"

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Copy AV Traders Nginx config
sudo cp $APP_DIR/nginx/av.bhaiavtech.com.conf /etc/nginx/sites-available/av.bhaiavtech.com

# Create symlink
sudo ln -sf /etc/nginx/sites-available/av.bhaiavtech.com /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}Nginx configured${NC}"

# ============================================
# Step 7: Setup SSL with Let's Encrypt
# ============================================
echo -e "\n${YELLOW}[8/8] Setting up SSL...${NC}"
echo -e "${YELLOW}IMPORTANT: Make sure DNS A record for $DOMAIN points to $SERVER_IP${NC}"
echo ""
read -p "Press Enter to continue with SSL setup, or Ctrl+C to skip..."

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email admin@bhaiavtech.com \
    --redirect

# Auto-renewal cron
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo -e "${GREEN}SSL configured${NC}"

# ============================================
# Step 8: Setup PM2 Startup
# ============================================
echo -e "\n${YELLOW}Configuring PM2 auto-start...${NC}"

# Generate startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/app

echo -e "${GREEN}PM2 startup configured${NC}"

# ============================================
# Final Instructions
# ============================================
echo -e "\n${GREEN}=========================================="
echo "Server Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Deploy your code:"
echo "   cd $APP_DIR"
echo "   git clone <your-repo-url> ."
echo ""
echo "2. Setup backend:"
echo "   cd backend"
echo "   cp .env.example .env"
echo "   # Edit .env with production values"
echo "   npm install --production"
echo "   pm2 start ../ecosystem.config.cjs --env production"
echo "   pm2 save"
echo ""
echo "3. Setup frontend:"
echo "   cd frontend"
echo "   cp .env.example .env"
echo "   # Edit .env with production values"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Import database schema:"
echo "   mysql -u avtraders -p avtradersdb < backend/schema.sql"
echo ""
echo "5. Update Nginx config with actual backend URL:"
echo "   sudo nano /etc/nginx/sites-available/av.bhaiavtech.com"
echo "   sudo systemctl reload nginx"
echo ""
echo "=========================================="
echo "Access Information:"
echo "=========================================="
echo "Website: https://$DOMAIN"
echo "Backend: https://$DOMAIN/api"
echo ""
echo "SSH: ssh $APP_USER@$SERVER_IP"
echo "MySQL: mysql -u avtraders -p avtradersdb"
echo "Logs: pm2 logs avtraders-backend"
echo "Status: pm2 status"
echo "=========================================="
