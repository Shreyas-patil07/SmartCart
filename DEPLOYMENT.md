# 🚀 SmartCart Deployment Guide

Complete guide for deploying SmartCart to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Security Checklist](#security-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

- Domain name with SSL certificate
- Firebase project configured for production
- Cloud hosting account (Vercel, Heroku, AWS, etc.)
- Database service (Firestore, PostgreSQL, etc.)

## Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
# Production Settings
SECRET_KEY=<strong-random-secret-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,api.your-domain.com

# Firebase
FIREBASE_CREDENTIALS=./firebase-service-account.json

# CORS
FRONTEND_URL=https://your-app.vercel.app,https://www.your-app.com

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379/0
```

#### Frontend (.env.production)
```env
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=https://api.your-domain.com
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
cd frontend
vercel --prod
```

3. **Configure Environment Variables**:
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add all `VITE_*` variables from `.env.production`

4. **Custom Domain**:
- Add your domain in Vercel Dashboard
- Update DNS records as instructed

### Option 2: Netlify

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Build and Deploy**:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

3. **Configure**:
- Set environment variables in Netlify Dashboard
- Configure custom domain

### Option 3: AWS Amplify

1. **Connect Repository**:
- Go to AWS Amplify Console
- Connect your Git repository

2. **Build Settings** (amplify.yml):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### Option 4: Firebase Hosting

1. **Install Firebase CLI**:
```bash
npm install -g firebase-tools
firebase login
```

2. **Initialize**:
```bash
cd frontend
firebase init hosting
```

3. **Deploy**:
```bash
npm run build
firebase deploy --only hosting
```

## Backend Deployment

### Option 1: Heroku (Flask)

1. **Create Procfile**:
```
web: gunicorn app:app
```

2. **Create runtime.txt**:
```
python-3.11.0
```

3. **Add Gunicorn to requirements.txt**:
```bash
echo "gunicorn>=20.1.0" >> requirements.txt
```

4. **Deploy**:
```bash
cd backend
heroku create your-app-name
heroku config:set SECRET_KEY=your-secret-key
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
git push heroku main
```

5. **Upload Firebase Credentials**:
```bash
heroku config:set FIREBASE_CREDENTIALS="$(cat firebase-service-account.json)"
```

### Option 2: Railway

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Deploy**:
```bash
cd backend
railway login
railway init
railway up
```

3. **Configure Environment Variables**:
- Add variables in Railway Dashboard

### Option 3: AWS EC2

1. **Launch EC2 Instance**:
- Ubuntu 22.04 LTS
- t2.micro or larger
- Configure security groups (ports 80, 443, 22)

2. **SSH and Setup**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3-pip python3-venv nginx -y

# Clone repository
git clone <your-repo-url>
cd SmartCart/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

3. **Configure Gunicorn Service** (/etc/systemd/system/smartcart.service):
```ini
[Unit]
Description=SmartCart Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/SmartCart/backend
Environment="PATH=/home/ubuntu/SmartCart/backend/venv/bin"
ExecStart=/home/ubuntu/SmartCart/backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

4. **Configure Nginx** (/etc/nginx/sites-available/smartcart):
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

5. **Enable and Start Services**:
```bash
sudo systemctl enable smartcart
sudo systemctl start smartcart
sudo ln -s /etc/nginx/sites-available/smartcart /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.your-domain.com
```

### Option 4: Google Cloud Run (Django)

1. **Create Dockerfile** (backend/Dockerfile):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 smartcart.wsgi:application
```

2. **Build and Deploy**:
```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT-ID/smartcart-backend
gcloud run deploy smartcart-backend \
  --image gcr.io/PROJECT-ID/smartcart-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Database Setup

### Option 1: Firestore (Recommended)

1. **Enable Firestore** in Firebase Console
2. **Configure Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Products collection (read-only for users)
    match /products/{productId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

3. **Update Backend Code**:
- Replace in-memory storage with Firestore SDK calls
- See backend code for Firestore integration examples

### Option 2: PostgreSQL

1. **Provision Database**:
- AWS RDS, Google Cloud SQL, or Heroku Postgres

2. **Update Django Settings** (settings.py):
```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}
```

3. **Run Migrations**:
```bash
python manage.py migrate
```

## Security Checklist

### Pre-Deployment

- [ ] Change all default secrets and keys
- [ ] Set `DEBUG=False` in production
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set secure cookie flags
- [ ] Configure CSP headers
- [ ] Enable rate limiting
- [ ] Validate all user inputs
- [ ] Implement request logging
- [ ] Set up Firebase security rules
- [ ] Review and minimize API permissions
- [ ] Enable database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

### Post-Deployment

- [ ] Test all authentication flows
- [ ] Verify CORS configuration
- [ ] Test payment processing (if integrated)
- [ ] Verify QR code generation and validation
- [ ] Test error handling and logging
- [ ] Perform security audit
- [ ] Load testing
- [ ] Monitor error rates
- [ ] Set up automated backups
- [ ] Document incident response procedures

## Monitoring & Maintenance

### Error Tracking

**Sentry Integration**:

1. **Install Sentry**:
```bash
# Frontend
npm install @sentry/react

# Backend
pip install sentry-sdk[flask]
```

2. **Configure Frontend** (main.jsx):
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

3. **Configure Backend** (app.py):
```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()],
    environment="production",
    traces_sample_rate=1.0
)
```

### Performance Monitoring

- Use Firebase Performance Monitoring
- Set up Google Analytics or Mixpanel
- Monitor API response times
- Track database query performance
- Monitor server resources (CPU, memory, disk)

### Logging

**Structured Logging** (backend):
```python
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Log structured data
logger.info(json.dumps({
    'event': 'session_started',
    'user_id': user_id,
    'session_id': session_id,
    'store_id': store_id
}))
```

### Backup Strategy

1. **Database Backups**:
- Firestore: Automatic backups enabled by default
- PostgreSQL: Daily automated backups via cloud provider

2. **Code Backups**:
- Git repository with proper branching strategy
- Tagged releases for rollback capability

3. **Configuration Backups**:
- Store environment variables securely (AWS Secrets Manager, etc.)
- Document all configuration changes

### Scaling Considerations

**Horizontal Scaling**:
- Use load balancer (AWS ELB, Google Cloud Load Balancing)
- Deploy multiple backend instances
- Use Redis for session storage (shared across instances)

**Vertical Scaling**:
- Upgrade server resources as needed
- Monitor resource usage and scale proactively

**Database Scaling**:
- Enable read replicas for Firestore/PostgreSQL
- Implement caching layer (Redis)
- Optimize queries and indexes

## Rollback Procedures

### Frontend Rollback

**Vercel**:
```bash
vercel rollback
```

**Netlify**:
- Use Netlify Dashboard to restore previous deployment

### Backend Rollback

**Heroku**:
```bash
heroku releases
heroku rollback v123
```

**AWS/Custom**:
```bash
git checkout v1.2.3
# Redeploy previous version
```

## Production Checklist

- [ ] All environment variables configured
- [ ] SSL certificates installed and valid
- [ ] Database backups enabled
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring dashboards set up
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Firebase security rules deployed
- [ ] Load testing completed
- [ ] Incident response plan documented
- [ ] Team trained on deployment procedures
- [ ] Rollback procedures tested
- [ ] Documentation updated

## Support & Maintenance

### Regular Maintenance Tasks

- **Daily**: Monitor error rates and performance metrics
- **Weekly**: Review logs for security issues
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Security audit and penetration testing
- **Annually**: Disaster recovery drill

### Incident Response

1. **Detect**: Monitoring alerts trigger
2. **Assess**: Determine severity and impact
3. **Respond**: Execute rollback or hotfix
4. **Communicate**: Update stakeholders
5. **Resolve**: Deploy fix and verify
6. **Review**: Post-mortem and documentation

---

**Last Updated**: April 15, 2026

For questions or issues, refer to the main [README.md](README.md) or contact the development team.
