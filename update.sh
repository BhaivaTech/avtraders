#!/bin/bash
# ============================================
# AV Traders - Update & Redeploy Script
# Run after every code push
# Usage: bash update.sh
# ============================================

APP_USER="chethan"
APP_DIR="/home/$APP_USER/avtraders"
BRANCH="main"   # Change to your branch (main / development)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AV Traders - Update & Redeploy${NC}"
echo -e "${BLUE}========================================${NC}"

# ============================================
# STEP 1: Git Pull
# ============================================
echo -e "\n${YELLOW}[1/5] Pulling latest code from ${BRANCH}...${NC}"
cd $APP_DIR
git fetch --all
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✔ Code updated${NC}"
echo "  Commit: $(git log -1 --oneline)"

# ============================================
# STEP 2: Install Backend Dependencies
# ============================================
echo -e "\n${YELLOW}[2/5] Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install --production
echo -e "${GREEN}✔ Backend dependencies installed${NC}"

# ============================================
# STEP 3: Build Frontend
# ============================================
echo -e "\n${YELLOW}[3/5] Building frontend...${NC}"
cd $APP_DIR/frontend
npm install
npm run build
echo -e "${GREEN}✔ Frontend built${NC}"

# ============================================
# STEP 4: Run Migrations (if any)
# ============================================
echo -e "\n${YELLOW}[4/5] Running database migrations (if any)...${NC}"
cd $APP_DIR/backend

# Check if migrate script exists in package.json
if npm run | grep -q "migrate"; then
    npm run migrate
    echo -e "${GREEN}✔ Migrations done${NC}"
else
    # Run any new .sql migration files manually
    DB_HOST="46.28.44.56"
    DB_PORT="3306"
    DB_USER="appuser"
    DB_PASS="DataSync@VPS1"
    DB_NAME="avtradersdb"

    for f in $APP_DIR/backend/migrations/*.sql; do
        echo "  Applying migration: $(basename $f)"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$f" 2>/dev/null && echo "    ✔ Done" || echo "    ⚠ Skipped (may already be applied)"
    done
fi

# ============================================
# STEP 5: Restart Backend with PM2
# ============================================
echo -e "\n${YELLOW}[5/5] Restarting backend...${NC}"
cd $APP_DIR

if pm2 list | grep -q "avtraders-backend"; then
    pm2 restart avtraders-backend
else
    pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo -e "${GREEN}✔ Backend restarted${NC}"

# ============================================
# Reload Nginx (for any config changes)
# ============================================
if command -v nginx &>/dev/null; then
    nginx -t && systemctl reload nginx && echo -e "${GREEN}✔ Nginx reloaded${NC}"
fi

# ============================================
# Final Status
# ============================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploy Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}PM2 Status:${NC}"
pm2 status
echo ""
echo -e "${GREEN}Health Check:${NC}"
sleep 2
curl -s http://localhost:5100/api/health | head -c 200 || echo "Backend starting..."
echo ""
echo -e "${GREEN}Site: https://av.bhaivatech.com${NC}"
