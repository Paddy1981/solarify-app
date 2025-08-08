# 🌞 Solarify - Solar Marketplace Platform

![Solarify Banner](https://via.placeholder.com/800x200/667eea/ffffff?text=Solarify+Solar+Marketplace)

[![Deploy to Firebase](https://github.com/your-username/solarify-app/workflows/Deploy%20to%20Firebase/badge.svg)](https://github.com/your-username/solarify-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)

## 🎯 Overview

Solarify is a comprehensive solar marketplace platform that connects homeowners, installers, and suppliers in the solar ecosystem. Built with modern technologies and designed for scale, it provides tools for solar adoption, project management, and equipment sourcing.

### 🌟 Key Features

- **🏠 Homeowner Tools**: Solar calculators, RFQ system, savings tracking
- **🔧 Installer Dashboard**: Project management, quote generation, analytics  
- **🏪 Supplier Marketplace**: Product catalog, inventory, order management
- **📱 Mobile Apps**: Native iOS and Android applications
- **☁️ Cloud Backend**: Firebase with real-time data synchronization
- **🛡️ Enterprise Security**: Multi-factor auth, data encryption, compliance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/solarify-app.git
   cd solarify-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with your Firebase configuration:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🌐 Deployment Options

### 1. Automatic GitHub Deployment (Recommended)

This repository includes GitHub Actions for automatic Firebase deployment:

1. **Fork this repository**
2. **Set up Firebase project**
3. **Configure GitHub Secrets**:
   - `FIREBASE_TOKEN` (get via `firebase login:ci`)
   - `FIREBASE_PROJECT_ID_STAGING`
   - `FIREBASE_PROJECT_ID_PRODUCTION`
4. **Push to main branch** → automatic production deployment
5. **Push to develop branch** → automatic staging deployment

### 2. Manual Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Build and deploy
npm run build
firebase deploy
```

### 3. One-Click Deployment Package

```bash
# Create deployment package
./create-static-build.sh

# Extract and upload to Firebase Console
tar -xzf solarify-firebase-deploy-*.tar.gz
# Upload via Firebase Console → Hosting (drag & drop)
```

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 with TypeScript
- Tailwind CSS + Radix UI
- React Query for data management

**Backend:**
- Firebase Authentication
- Firestore Database
- Cloud Storage & Functions
- Cloud Messaging

**Mobile:**
- React Native (iOS & Android)
- Firebase SDK integration
- Offline-first architecture

## 📱 Mobile Apps

Native mobile applications with offline support and advanced features:

```bash
cd mobile
./scripts/setup-mobile-development.sh
./deploy-mobile.sh --platform both --build-type release
```

## 🧪 Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:all      # Complete test suite
npm run typecheck     # TypeScript validation
npm run lint          # Code quality checks
```

## 📚 Documentation

- [📖 Manual Deployment Guide](MANUAL_DEPLOYMENT_GUIDE.md)
- [📱 Mobile Setup Guide](mobile/firebase-mobile-setup.md)
- [🏗️ Architecture Assessment](ENTERPRISE_ARCHITECTURE_ASSESSMENT.md)
- [🚀 Deployment Status](DEPLOYMENT_STATUS.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and ensure they pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🌞 Built for a sustainable future powered by solar energy 🌱**

[Live Demo](https://solarify-app.web.app) • [Documentation](docs/) • [Mobile Apps](mobile/) • [API Reference](docs/api.md)

Made with ❤️ for the solar revolution

</div>