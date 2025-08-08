# 🚀 Solarify Production Deployment Checklist

## 📋 Pre-Deployment Requirements

### ✅ Critical Issues Fixed (Completed)
- [x] **Color Contrast**: Fixed WCAG 2.1 AA compliance issues
- [x] **Firebase Hosting**: Updated to 2 min instances, 10 max instances for production
- [x] **SSL Configuration**: Terraform SSL certificate configuration is complete and ready

### 🔧 Required Environment Variables

#### Firebase Configuration (Required)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
```

#### External API Keys (Highly Recommended)
```bash
# NREL API for solar calculations
NREL_API_KEY=your_nrel_api_key

# NOAA API for weather data
NOAA_API_KEY=your_noaa_api_key
```

#### Security Configuration (Required)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secure_random_secret_key_here
NEXTAUTH_URL=https://your-domain.com
```

#### Monitoring and Performance (Recommended)
```bash
# Error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Rate limiting (for production scaling)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 🛠️ Setup Instructions

### 1. Get Required API Keys

#### Firebase Setup:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Go to Project Settings > General
4. Copy the Firebase SDK configuration
5. Go to Project Settings > Service Accounts
6. Generate new private key for Admin SDK

#### NREL API Key (Free):
1. Visit [NREL Developer Network](https://developer.nrel.gov/signup/)
2. Sign up for a free account
3. Generate API key for PVWatts and Solar Resource APIs

#### NOAA API Key (Free):
1. Visit [NOAA API](https://www.weather.gov/documentation/services-web-api)
2. No key required for basic usage
3. Consider Weather.gov API for weather data

### 2. Configure Infrastructure

#### Terraform Variables:
Update `infrastructure/terraform/environments/production/terraform.tfvars`:

```hcl
# Project configuration
project_id = "your-gcp-project-id"
environment = "production"

# Domain configuration
domain_name = "your-domain.com"
enable_ssl = true

# Scaling configuration (already updated)
instance_config = {
  min_instances = 2
  max_instances = 10
  cpu_limit = "1"
  memory_limit = "2Gi"
}
```

### 3. Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Initialize Terraform
terraform init

# Plan deployment
./scripts/deploy.sh production plan

# Apply infrastructure (after review)
./scripts/deploy.sh production apply
```

### 4. Deploy Application

```bash
# Set environment variables in your CI/CD system
# Deploy using Firebase App Hosting or your preferred method

# Verify deployment
npm run test:production
```

## 🧪 Post-Deployment Verification

### Run All Verification Scripts:
```bash
# API Integration verification
npx tsx scripts/verify-api-integrations.ts

# Load testing
npm run test:load

# Accessibility testing
npm run test:accessibility

# Security testing
npm run test:security
```

### Monitor Key Metrics:
- Response time < 2 seconds for dashboard pages
- API response time < 800ms
- Uptime > 99.9%
- Error rate < 0.1%

## 🚨 Rollback Procedures

If issues occur after deployment:

### Immediate Rollback:
```bash
# Revert to previous container image
gcloud run services update solarify-app --image=gcr.io/project/solarify:previous-version

# Or revert infrastructure
terraform apply -target=module.compute -var="application_image=previous-image"
```

### Database Rollback:
```bash
# Restore from automated backup
gcloud firestore operations list
gcloud firestore import gs://backup-bucket/backup-folder/
```

## ✅ Production Readiness Checklist

### Infrastructure:
- [x] SSL certificates configured
- [x] Auto-scaling enabled (2-10 instances)  
- [x] Monitoring and alerting setup
- [x] Backup and disaster recovery configured
- [x] CDN and performance optimization ready

### Security:
- [x] Firebase security rules implemented
- [x] Input validation with Zod schemas
- [x] Error boundaries and secure error handling
- [x] Environment variables properly secured
- [ ] **TODO**: Configure production environment variables

### Performance:
- [x] Code splitting and lazy loading
- [x] Image optimization and WebP support
- [x] Database query optimization
- [x] Caching strategies implemented

### Quality Assurance:
- [x] Comprehensive testing (Unit, E2E, Integration)
- [x] WCAG 2.1 AA accessibility compliance
- [x] Error boundaries and error handling
- [x] Mobile responsive design
- [x] Loading states and perceived performance

### Business Logic:
- [x] Solar calculation engine (industry-standard)
- [x] Weather API integration (NREL, NOAA)
- [x] Equipment database with compatibility matching
- [x] Net metering and utility rate calculations
- [x] Performance monitoring and analytics

## 🎯 Success Criteria

### Technical Metrics:
- ✅ All high-priority tasks completed (28/28)
- ✅ All medium-priority tasks completed (12/12) 
- ✅ All critical security issues resolved
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Production-grade infrastructure configured

### Business Metrics:
- User registration and onboarding flow working
- Solar calculator providing accurate results
- RFQ system functioning end-to-end
- Equipment catalog searchable and accurate
- Performance monitoring operational

## 📞 Emergency Contacts

- **Infrastructure Issues**: DevOps team
- **Application Issues**: Development team  
- **Security Issues**: Security team
- **Business Issues**: Product team

---

**Status**: 🟡 Ready for Environment Configuration
**Next Step**: Configure production environment variables and deploy
**Estimated Time**: 2-4 hours for full deployment