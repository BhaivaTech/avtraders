#!/bin/bash
# AV Traders - Deployment Verification Script
# Run this after deployment to check everything is working

DOMAIN="av.bhaiavtech.com"
SERVER_IP="34.180.17.171"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "AV Traders - Deployment Verification"
echo "=========================================="
echo ""

# 1. Check DNS
echo -e "${YELLOW}[1] Checking DNS...${NC}"
DNS_IP=$(host $DOMAIN 2>/dev/null | grep "has address" | awk '{print $4}')
if [ "$DNS_IP" = "$SERVER_IP" ]; then
    echo -e "${GREEN}✓ DNS correctly points to $SERVER_IP${NC}"
else
    echo -e "${RED}✗ DNS issue: $DOMAIN resolves to $DNS_IP (expected $SERVER_IP)${NC}"
fi

# 2. Check Nginx
echo -e "\n${YELLOW}[2] Checking Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
    echo "  Run: sudo systemctl start nginx"
fi

# 3. Check MySQL
echo -e "\n${YELLOW}[3] Checking MySQL...${NC}"
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✓ MySQL is running${NC}"
else
    echo -e "${RED}✗ MySQL is not running${NC}"
    echo "  Run: sudo systemctl start mysql"
fi

# 4. Check PM2 Backend
echo -e "\n${YELLOW}[4] Checking Backend (PM2)...${NC}"
if pm2 list 2>/dev/null | grep -q "avtraders-backend.*online"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Run: pm2 start ecosystem.config.cjs --env production"
fi

# 5. Check Backend Health
echo -e "\n${YELLOW}[5] Checking Backend Health...${NC}"
HEALTH=$(curl -s http://localhost:5100/health 2>/dev/null)
if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
    echo "  Response: $HEALTH"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "  Run: pm2 logs avtraders-backend"
fi

# 6. Check HTTP
echo -e "\n${YELLOW}[6] Checking HTTP...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null)
if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTP is working (redirects to HTTPS)${NC}"
else
    echo -e "${RED}✗ HTTP returned code $HTTP_CODE${NC}"
fi

# 7. Check HTTPS
echo -e "\n${YELLOW}[7] Checking HTTPS...${NC}"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null)
if [ "$HTTPS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS is working${NC}"
else
    echo -e "${RED}✗ HTTPS returned code $HTTPS_CODE${NC}"
fi

# 8. Check SSL Certificate
echo -e "\n${YELLOW}[8] Checking SSL Certificate...${NC}"
SSL_INFO=$(curl -sI https://$DOMAIN 2>/dev/null | grep -i "strict-transport")
if [ -n "$SSL_INFO" ]; then
    echo -e "${GREEN}✓ SSL certificate is valid${NC}"
else
    echo -e "${RED}✗ SSL certificate may have issues${NC}"
fi

# 9. Check API
echo -e "\n${YELLOW}[9] Checking API...${NC}"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health 2>/dev/null)
if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API is accessible${NC}"
else
    echo -e "${RED}✗ API returned code $API_CODE${NC}"
fi

# 10. Check Frontend
echo -e "\n${YELLOW}[10] Checking Frontend...${NC}"
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null)
if [ "$FRONTEND_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend returned code $FRONTEND_CODE${NC}"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Quick Commands:"
echo "  View logs:    pm2 logs avtraders-backend"
echo "  Restart:      pm2 restart avtraders-backend"
echo "  Nginx logs:   sudo tail -f /var/log/nginx/$DOMAIN.error.log"
echo "  MySQL:        mysql -u avtraders -p avtradersdb"
echo "=========================================="
