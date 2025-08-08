// =============================================================================
// Detox Configuration for E2E Testing
// =============================================================================

module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/SolarifyMobile.app',
      build: 'xcodebuild -workspace ios/SolarifyMobile.xcworkspace -scheme SolarifyMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/SolarifyMobile.app',
      build: 'xcodebuild -workspace ios/SolarifyMobile.xcworkspace -scheme SolarifyMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..'
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..'
    }
  },
  
  devices: {
    'ios.sim.debug': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    'ios.sim.release': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    'android.emu.debug': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    },
    'android.emu.release': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  },
  
  configurations: {
    'ios.sim.debug': {
      app: 'ios.debug',
      device: 'ios.sim.debug'
    },
    'ios.sim.release': {
      app: 'ios.release',
      device: 'ios.sim.release'
    },
    'android.emu.debug': {
      app: 'android.debug',
      device: 'android.emu.debug'
    },
    'android.emu.release': {
      app: 'android.release',
      device: 'android.emu.release'
    }
  }
};