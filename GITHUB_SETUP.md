# 🚀 GitHub Setup Guide for Solarify Firebase Deployment

This guide helps you set up your GitHub repository for automatic Firebase deployment.

## 📋 Prerequisites

- GitHub account
- Firebase project created
- Firebase CLI installed locally
- Repository forked or cloned

## 🔐 Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

### Navigation
1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Required Secrets

#### 1. FIREBASE_TOKEN
**Description**: Firebase CI token for authentication  
**How to get**:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login and get CI token
firebase login:ci

# Copy the token that appears
```
**Value**: Paste the token from the command above

#### 2. FIREBASE_PROJECT_ID_STAGING
**Description**: Firebase project ID for staging environment  
**Value**: Your staging Firebase project ID (e.g., `solarify-staging`)

#### 3. FIREBASE_PROJECT_ID_PRODUCTION  
**Description**: Firebase project ID for production environment  
**Value**: Your production Firebase project ID (e.g., `solarify-production`)

### Optional Secrets (for advanced setups)

#### NEXT_PUBLIC_FIREBASE_API_KEY
**Description**: Firebase API key (if not using environment-specific configs)  
**Value**: Your Firebase API key

#### NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
**Description**: Firebase auth domain  
**Value**: `your-project-id.firebaseapp.com`

## 🌍 Environment Setup

### GitHub Environments

1. **Create Staging Environment**
   - Go to Settings → Environments
   - Click **New environment**
   - Name: `staging`
   - Add protection rules if needed

2. **Create Production Environment**  
   - Go to Settings → Environments
   - Click **New environment**
   - Name: `production`
   - Add protection rules (e.g., required reviewers)

### Environment-Specific Secrets

For each environment, you can set specific secrets:

**Staging Environment:**
- `FIREBASE_PROJECT_ID` → `your-staging-project`
- `NEXT_PUBLIC_FIREBASE_API_KEY` → staging API key

**Production Environment:**
- `FIREBASE_PROJECT_ID` → `your-production-project`  
- `NEXT_PUBLIC_FIREBASE_API_KEY` → production API key

## 🔄 Workflow Configuration

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-firebase.yml`) that:

### Triggers
- **Push to `main`** → Deploy to production
- **Push to `develop`** → Deploy to staging
- **Pull requests** → Run tests only
- **Manual trigger** → Deploy to selected environment

### Steps
1. **Test** → Run linting, TypeScript checks, and tests
2. **Build** → Create production build
3. **Deploy** → Deploy to Firebase based on branch
4. **Verify** → Run post-deployment checks

## 📦 Deployment Package Alternative

If GitHub Actions don't work, you can still deploy manually:

```bash
# Create deployment package
./create-static-build.sh

# This creates: solarify-firebase-deploy-YYYYMMDD-HHMMSS.tar.gz
```

Upload the extracted package to Firebase Console → Hosting.

## 🏗️ Firebase Project Setup

### 1. Create Firebase Projects

**For Staging:**
```bash
firebase projects:create your-project-staging
```

**For Production:**
```bash
firebase projects:create your-project-production
```

### 2. Enable Required Services

For each project, enable:
- ✅ Authentication
- ✅ Firestore Database  
- ✅ Cloud Storage
- ✅ Hosting
- ✅ Cloud Messaging (optional)

### 3. Configure Security Rules

The repository includes pre-configured rules:
- `firestore.rules` - Database security
- `storage.rules` - File storage security

These are automatically deployed with the application.

## 🧪 Testing the Setup

### 1. Test Local Build
```bash
npm install
npm run build
```

### 2. Test GitHub Actions
1. Make a small change to README.md
2. Commit and push to `develop` branch
3. Check Actions tab for build status
4. Verify staging deployment

### 3. Production Deployment
1. Merge `develop` into `main`
2. Check Actions tab for production deployment
3. Verify production site

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: HTTP Error: 401, Request had invalid authentication credentials
```
**Solution**: Regenerate `FIREBASE_TOKEN`
```bash
firebase logout
firebase login:ci
# Update GitHub secret with new token
```

#### Project Not Found
```
Error: Project 'your-project-id' not found
```
**Solution**: 
- Verify project ID in GitHub secrets
- Ensure Firebase project exists
- Check project permissions

#### Build Failures
```
Error: Cannot resolve module
```
**Solution**:
- Check `package.json` dependencies
- Verify Node.js version (18+)
- Clear cache and reinstall

### Debug Mode

Enable debug logging in GitHub Actions:
1. Go to repository Settings → Secrets
2. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`
3. Add secret: `ACTIONS_STEP_DEBUG` = `true`

## 📊 Monitoring

After setup, monitor:

### GitHub Actions
- Build success/failure rates
- Deployment frequency  
- Action execution time

### Firebase Console
- Hosting deployment history
- Performance metrics
- Error rates
- User analytics

## 🚀 Advanced Configuration

### Custom Domains
```bash
# Add custom domain in Firebase Console
firebase hosting:channel:deploy preview --expires 30d
```

### Multiple Environments
Create additional environments:
- `development`
- `testing`  
- `preview`

Each with their own Firebase projects and secrets.

### Automated Testing
The workflow includes:
- Unit tests with Jest
- E2E tests with Cypress  
- TypeScript validation
- Code quality checks

## 🆘 Support

### Resources
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

### Getting Help
1. Check GitHub Actions logs
2. Review Firebase Console deployment logs
3. Create GitHub issue with error details

## ✅ Deployment Checklist

Before going live:

- [ ] Firebase projects created (staging & production)
- [ ] GitHub secrets configured
- [ ] GitHub environments set up  
- [ ] Firebase services enabled
- [ ] Security rules deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificates enabled
- [ ] Performance monitoring set up
- [ ] Error tracking configured
- [ ] Backup strategy implemented

## 🎉 Success!

Once configured, your Solarify application will:

✅ **Auto-deploy** on every push to main/develop  
✅ **Run tests** before deployment  
✅ **Deploy to staging** from develop branch  
✅ **Deploy to production** from main branch  
✅ **Monitor performance** and errors  
✅ **Scale automatically** with Firebase  

**Your solar marketplace is ready to change the world! 🌞**