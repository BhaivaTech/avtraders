# AV Traders - GCP Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GCP Project                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Cloud Run  │      │   Cloud Run  │      │   Cloud SQL  │  │
│  │   Frontend   │─────▶│   Backend    │─────▶│    MySQL     │  │
│  │   (Nginx)    │      │  (Node.js)   │      │    8.0       │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Cloud      │      │   Secret     │      │   Cloud      │  │
│  │   CDN        │      │   Manager    │      │   Storage    │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GCP Account**: [Sign up](https://cloud.google.com) with billing enabled
2. **gcloud CLI**: [Install](https://cloud.google.com/sdk/docs/install)
3. **Docker**: [Install](https://docs.docker.com/get-docker/)
4. **Domain** (optional): For custom domain setup

## Quick Start

### Step 1: Install & Configure gcloud CLI

```bash
# Login to GCP
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Set default region
gcloud config set compute/region asia-south1
```

### Step 2: Update Configuration

1. **Edit `deploy-gcp.sh`**:
   - Replace `PROJECT_ID` with your GCP project ID
   - Replace `REGION` if needed (default: `asia-south1` for Mumbai)
   - Update database passwords

2. **Edit `nginx/frontend.conf`**:
   - Replace `SERVICE_ID` with actual backend Cloud Run service ID

3. **Edit `backend/.env.cloud-run`**:
   - Update all placeholder values
   - Configure actual URLs after deployment

### Step 3: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh YOUR_PROJECT_ID asia-south1
```

### Step 4: Post-Deployment Setup

#### 4.1 Import Database Schema

```bash
# Connect to Cloud SQL
gcloud sql connect avtraders-mysql --user=avtraders

# In MySQL shell, import schema
mysql> USE avtradersdb;
mysql> SOURCE backend/schema.sql;
```

#### 4.2 Update Secrets

```bash
# Update database password
echo -n "YOUR_ACTUAL_PASSWORD" | gcloud secrets versions add db-password --data-file=-

# Update session secret
echo -n "YOUR_SESSION_SECRET" | gcloud secrets versions add session-secret --data-file=-

# Update other secrets...
```

#### 4.3 Update Environment Variables

```bash
# Update backend with actual URLs
gcloud run services update avtraders-backend \
    --region=asia-south1 \
    --set-env-vars="ALLOWED_ORIGINS=https://your-frontend-url.run.app,https://yourdomain.com"
```

## Manual Deployment (Step-by-Step)

### 1. Enable APIs

```bash
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com
```

### 2. Create Cloud SQL Instance

```bash
# Create MySQL instance
gcloud sql instances create avtraders-mysql \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-south1 \
    --storage-size=10GB \
    --storage-auto-increase

# Create database
gcloud sql databases create avtradersdb --instance=avtraders-mysql

# Create user
gcloud sql users create avtraders \
    --instance=avtraders-mysql \
    --password=YOUR_PASSWORD
```

### 3. Build & Push Docker Images

```bash
# Configure Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Create repository
gcloud artifacts repositories create avtraders \
    --repository-format=docker \
    --location=asia-south1

# Build and push backend
docker build -t asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/backend:latest -f Dockerfile.backend .
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/backend:latest

# Build and push frontend
docker build -t asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/frontend:latest -f Dockerfile.frontend .
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/frontend:latest
```

### 4. Deploy to Cloud Run

```bash
# Deploy backend
gcloud run deploy avtraders-backend \
    --image=asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/backend:latest \
    --region=asia-south1 \
    --allow-unauthenticated \
    --add-cloudsql-instances=YOUR_PROJECT:asia-south1:avtraders-mysql \
    --set-env-vars="NODE_ENV=production,PORT=8080"

# Deploy frontend
gcloud run deploy avtraders-frontend \
    --image=asia-south1-docker.pkg.dev/YOUR_PROJECT/avtraders/frontend:latest \
    --region=asia-south1 \
    --allow-unauthenticated
```

## Configuration Files

### Dockerfile.backend
- Node.js 20 slim image
- Production dependencies only
- Exposes port 8080 (Cloud Run default)

### Dockerfile.frontend
- Multi-stage build (Node.js + Nginx)
- Optimized for static file serving
- Nginx configured for React Router

### nginx/frontend.conf
- Gzip compression
- Static asset caching
- API proxy to backend
- Socket.io proxy
- Security headers

## Custom Domain Setup

### Option 1: Cloud Run Domain Mapping

```bash
# Map domain to frontend
gcloud run domain-mappings create \
    --service=avtraders-frontend \
    --domain=yourdomain.com \
    --region=asia-south1

# Map domain to backend
gcloud run domain-mappings create \
    --service=avtraders-backend \
    --domain=api.yourdomain.com \
    --region=asia-south1

# Verify domain ownership
gcloud domains verify yourdomain.com
```

### Option 2: Cloud CDN + Load Balancer

```bash
# Create serverless NEG for frontend
gcloud compute network-endpoint-groups create avtraders-frontend-neg \
    --region=asia-south1 \
    --serverless-deployment=platform=cloud-run,service=avtraders-frontend

# Create backend service
gcloud compute backend-services create avtraders-frontend-bs \
    --global

# Add NEG to backend service
gcloud compute backend-services add-backend avtraders-frontend-bs \
    --global \
    --network-endpoint-group=avtraders-frontend-neg \
    --network-endpoint-group-region=asia-south1

# Create URL map
gcloud compute url-maps create avtraders-url-map \
    --default-service=avtraders-frontend-bs

# Create HTTPS proxy
gcloud compute target-https-proxies create avtraders-https-proxy \
    --url-map=avtraders-url-map \
    --ssl-certificates=YOUR_SSL_CERT

# Create forwarding rule
gcloud compute forwarding-rules create avtraders-https-rule \
    --global \
    --target-https-proxy=avtraders-https-proxy \
    --ports=443
```

## File Uploads (Cloud Storage)

For production, use Cloud Storage instead of local uploads:

### 1. Create Storage Bucket

```bash
# Create bucket
gsutil mb -l asia-south1 gs://avtraders-uploads/

# Make public (if needed)
gsutil iam ch allUsers:objectViewer gs://avtraders-uploads/
```

### 2. Update Backend Code

```javascript
// In your upload handlers, use @google-cloud/storage
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('avtraders-uploads');

// Upload file
const blob = bucket.file(filename);
const blobStream = blob.createWriteStream();
blobStream.end(file.buffer);
```

## Monitoring & Logs

### View Logs

```bash
# Backend logs
gcloud run services logs read avtraders-backend --region=asia-south1

# Frontend logs
gcloud run services logs read avtraders-frontend --region=asia-south1

# Stream logs
gcloud run services logs tail avtraders-backend --region=asia-south1
```

### Set Up Alerts

```bash
# Create alert policy for errors
gcloud alpha monitoring policies create \
    --notification-channels=YOUR_CHANNEL \
    --display-name="AV Traders Errors" \
    --condition-display-name="Error rate" \
    --condition-filter='resource.type="cloud_run_revision" AND severity="ERROR"'
```

## Cost Estimation

| Service | Tier | Estimated Monthly Cost |
|---------|------|------------------------|
| Cloud Run (Backend) | 512MB, 1 CPU | $5-15 |
| Cloud Run (Frontend) | 256MB, 1 CPU | $3-10 |
| Cloud SQL | db-f1-micro | $7-15 |
| Cloud Storage | 10GB | $0.20 |
| **Total** | | **$15-40/month** |

*Costs vary based on traffic. Cloud Run charges per request.*

## Scaling Configuration

### Backend Scaling

```bash
gcloud run services update avtraders-backend \
    --region=asia-south1 \
    --min-instances=0 \
    --max-instances=20 \
    --concurrency=80
```

### Database Scaling

```bash
# Increase tier
gcloud sql instances patch avtraders-mysql \
    --tier=db-n1-standard-1

# Increase storage
gcloud sql instances patch avtraders-mysql \
    --storage-size=50GB
```

## Troubleshooting

### Common Issues

1. **Connection refused to Cloud SQL**
   ```bash
   # Check Cloud SQL instance is running
   gcloud sql instances list
   
   # Verify connection string format
   # Should be: /cloudsql/PROJECT:REGION:INSTANCE
   ```

2. **CORS errors**
   ```bash
   # Update ALLOWED_ORIGINS
   gcloud run services update avtraders-backend \
       --set-env-vars="ALLOWED_ORIGINS=https://your-frontend.run.app"
   ```

3. **Build failures**
   ```bash
   # Check build logs
   gcloud builds log --region=asia-south1 BUILD_ID
   ```

4. **Memory issues**
   ```bash
   # Increase memory
   gcloud run services update avtraders-backend \
       --memory=1Gi
   ```

### Health Checks

```bash
# Backend health
curl https://avtraders-backend-XXXX.run.app/health

# Frontend health
curl https://avtraders-frontend-XXXX.run.app/
```

## Rollback

### Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service=avtraders-backend --region=asia-south1

# Rollback to specific revision
gcloud run services update-traffic avtraders-backend \
    --to-revisions=REVISION_NAME=100 \
    --region=asia-south1
```

### Database Rollback

```bash
# Restore from backup
gcloud sql backups restore BACKUP_ID \
    --restore-instance=avtraders-mysql-new \
    --backup-instance=avtraders-mysql
```

## Security Checklist

- [ ] Enable Cloud SQL SSL
- [ ] Configure VPC Connector for private networking
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Enable audit logging
- [ ] Configure IAM roles (least privilege)
- [ ] Store secrets in Secret Manager
- [ ] Enable HTTPS only
- [ ] Set up WAF rules

## Support

- **GCP Documentation**: https://cloud.google.com/run/docs
- **Cloud SQL Docs**: https://cloud.google.com/sql/docs/mysql
- **Stack Overflow**: Tag with `google-cloud-run`
