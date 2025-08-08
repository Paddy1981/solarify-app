# Solarify Mobile Apps

This directory contains the React Native mobile applications for the Solarify solar marketplace platform.

## Architecture Overview

### Why React Native?

After comprehensive analysis, React Native was chosen for the Solarify mobile apps because it offers:

- **70-80% code reuse** with the existing Next.js web app
- **Excellent Firebase integration** with native SDKs
- **Solar-specific features** like camera and GPS integration
- **Faster time to market** leveraging existing React/TypeScript expertise
- **Long-term maintainability** with shared business logic

## Project Structure

```
mobile/
├── shared-packages/          # Shared code between web and mobile
│   ├── solarify-core/       # Core business logic and types
│   ├── solarify-services/   # Firebase services and API layer
│   └── solarify-utils/      # Shared utilities and calculations
├── SolarifyMobile/          # React Native app
├── scripts/                 # Setup and build scripts
├── docs/                    # Mobile-specific documentation
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- Firebase project with iOS/Android apps configured

### Quick Start

```bash
# Navigate to mobile directory
cd mobile

# Run setup script
./scripts/setup-mobile-development.sh

# Start the development server
cd SolarifyMobile
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Development Phases

### Phase 1: Foundation (Weeks 1-3)
- [x] Project setup and configuration
- [x] Shared code architecture
- [ ] Firebase integration
- [ ] Basic navigation structure

### Phase 2: Core Features (Weeks 4-8)
- [ ] Authentication flows
- [ ] RFQ management
- [ ] Quote viewing and management
- [ ] User profiles

### Phase 3: Solar-Specific Features (Weeks 9-12)
- [ ] Camera integration for roof photos
- [ ] GPS location services
- [ ] Offline data synchronization
- [ ] Solar calculator

### Phase 4: Advanced Features (Weeks 13-16)
- [ ] Push notifications
- [ ] Advanced solar tools
- [ ] Field work features
- [ ] App store optimization

## Key Features

### Solar Industry Specific
- **Roof Photography**: Capture and analyze roof conditions
- **Location Services**: Precise property location and solar potential
- **Offline Support**: Work in areas with poor connectivity
- **Solar Calculator**: Mobile-optimized energy calculations

### General Marketplace
- **RFQ Management**: Create and manage solar installation requests
- **Quote Comparison**: Compare multiple installer quotes
- **Installer Matching**: Find qualified solar installers
- **Project Tracking**: Monitor installation progress

### Mobile-First Features
- **Push Notifications**: Real-time updates on quotes and projects
- **Camera Integration**: Document roof conditions and progress
- **GPS Services**: Location-based installer recommendations
- **Offline Sync**: Seamless data synchronization

## Technology Stack

- **React Native** 0.73+
- **TypeScript** 5+
- **Firebase** (Firestore, Auth, Cloud Messaging)
- **React Navigation** 6+
- **React Query** for data fetching
- **AsyncStorage** for offline data
- **React Native Camera** for photo capture
- **React Native Geolocation** for GPS

## Development Guidelines

### Code Sharing Strategy
1. **Business Logic** (90% shared): Firebase services, calculations, validation
2. **Components** (30% shared): Design tokens, patterns, layouts
3. **Platform Features** (0% shared): Navigation, camera, GPS, notifications

### Folder Structure
```
SolarifyMobile/src/
├── components/
│   ├── ui/              # Platform-specific UI components
│   ├── forms/           # Form components
│   └── solar/           # Solar-specific components
├── screens/
│   ├── auth/            # Authentication screens
│   ├── homeowner/       # Homeowner-specific screens
│   ├── installer/       # Installer-specific screens
│   └── supplier/        # Supplier-specific screens
├── navigation/          # Navigation configuration
├── services/           # Platform-specific service implementations
├── hooks/              # Custom React hooks
├── utils/              # Platform-specific utilities
└── types/              # Mobile-specific TypeScript types
```

## Testing Strategy

- **Unit Tests**: Jest for business logic
- **Component Tests**: React Native Testing Library
- **E2E Tests**: Detox for integration testing
- **Device Testing**: Firebase Test Lab
- **Manual Testing**: Real device testing matrix

## Deployment

### Development
- Expo Development Build
- Over-the-air updates for testing

### Production
- App Store (iOS) and Google Play Store (Android)
- Automated CI/CD with GitHub Actions
- Code signing and certificate management

## Performance Considerations

- **Bundle Size**: Code splitting and lazy loading
- **Memory Management**: Efficient image and data handling
- **Network**: Offline-first data synchronization
- **Battery**: Optimized GPS and background processing

## Security

- **Data Encryption**: End-to-end encryption for sensitive data
- **Authentication**: Firebase Auth with biometric support
- **Storage**: Secure local data storage
- **Network**: Certificate pinning and secure API communication

## Contribution Guidelines

1. Follow existing code style and conventions
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Test on both iOS and Android platforms
5. Consider offline scenarios in all features

## Support

For technical questions or support:
- Check the [mobile development docs](./docs/)
- Create an issue in the main repository
- Contact the mobile development team

---

**Next Steps:**
1. Run the setup script to initialize your development environment
2. Review the shared packages architecture
3. Start with Phase 1 development tasks
4. Set up Firebase configuration for mobile apps