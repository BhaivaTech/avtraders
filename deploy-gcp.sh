#!/bin/bash
# AV Traders - GCP Deployment Script
# Usage: ./deploy-gcp.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-gcp-project-id"}
REGION=${2:-"asia-south1"}  # Mumbai region for India
BACKEND_SERVICE="avtraders-backend"
FRONTEND_SERVICE="avtraders-frontend"
DB_INSTANCE="avtraders-mysql"
DB_NAME="avtradersdb"
DB_USER="avtraders"

echo "=========================================="
echo "AV Traders - GCP Deployment"
echo "=========================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "=========================================="

# Step 1: Set project
echo ""
echo "[1/7] Setting GCP project..."
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo ""
echo "[2/7] Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    compute.googleapis.com \
    vpcaccess.googleapis.com

# Step 3: Create Artifact Registry repository
echo ""
echo "[3/7] Creating Artifact Registry repository..."
gcloud artifacts repositories create avtraders \
    --repository-format=docker \
    --location=$REGION \
    --description="AV Traders Docker images" \
    2>/dev/null || echo "Repository already exists"

# Step 4: Create Cloud SQL instance
echo ""
echo "[4/7] Creating Cloud SQL MySQL instance..."
echo "This may take 5-10 minutes..."
gcloud sql instances create $DB_INSTANCE \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=02:00 \
    --availability-type=regional \
    --root-password=CHANGE_ME_ROOT_PASSWORD \
    2>/dev/null || echo "Instance already exists"

# Create database
gcloud sql databases create $DB_NAME \
    --instance=$DB_INSTANCE \
    2>/dev/null || echo "Database already exists"

# Create user
gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE \
    --password=CHANGE_ME_DB_PASSWORD \
    2>/dev/null || echo "User already exists"

# Step 5: Create secrets in Secret Manager
echo ""
echo "[5/7] Creating secrets in Secret Manager..."
echo "You will need to update these secrets with actual values."

# Create secrets (you'll need to update values later)
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=- 2>/dev/null || echo "Secret session-secret exists"
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=- 2>/dev/null || echo "Secret jwt-secret exists"
echo -n "your-msg91-auth-key" | gcloud secrets create msg91-auth-key --data-file=- 2>/dev/null || echo "Secret msg91-auth-key exists"
echo -n "your-phonepe-merchant-id" | gcloud secrets create phonepe-merchant-id --data-file=- 2>/dev/null || echo "Secret phonepe-merchant-id exists"
echo -n "your-phonepe-salt-key" | gcloud secrets create phonepe-salt-key --data-file=- 2>/dev/null || echo "Secret phonepe-salt-key exists"
echo -n "your-smtp-password" | gcloud secrets create smtp-password --data-file=- 2>/dev/null || echo "Secret smtp-password exists"

# Step 6: Build and push Docker images
echo ""
echo "[6/7] Building and pushing Docker images..."

# Configure Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# Build and push backend
echo "Building backend..."
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$BACKEND_SERVICE:latest -f Dockerfile.backend .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$BACKEND_SERVICE:latest

# Build and push frontend
echo "Building frontend..."
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$FRONTEND_SERVICE:latest -f Dockerfile.frontend .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$FRONTEND_SERVICE:latest

# Step 7: Deploy to Cloud Run
echo ""
echo "[7/7] Deploying to Cloud Run..."

# Deploy backend
echo "Deploying backend..."
gcloud run deploy $BACKEND_SERVICE \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$BACKEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE \
    --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE,DB_PORT=3306,DB_NAME=$DB_NAME,DB_USER=$DB_USER,PORT=8080" \
    --set-secrets="DB_PASS=db-password:latest,SESSION_SECRET=session-secret:latest,JWT_SECRET=jwt-secret:latest" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=80 \
    --timeout=300

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

# Deploy frontend
echo "Deploying frontend..."
gcloud run deploy $FRONTEND_SERVICE \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/avtraders/$FRONTEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=100

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format='value(status.url)')
echo "Frontend deployed at: $FRONTEND_URL"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Next Steps:"
echo "1. Update secrets in Secret Manager with actual values"
echo "2. Update nginx/frontend.conf with actual backend URL"
echo "3. Import schema.sql into Cloud SQL"
echo "4. Configure custom domain (optional)"
echo ""
echo "Useful Commands:"
echo "  View logs: gcloud run services logs read $BACKEND_SERVICE --region=$REGION"
echo "  Update secrets: gcloud secrets versions add SECRET_NAME --data-file=-"
echo "  Connect to DB: gcloud sql connect $DB_INSTANCE --user=$DB_USER"
echo "=========================================="
