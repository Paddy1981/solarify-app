// =============================================================================
// Jest Configuration for E2E Tests
// =============================================================================

module.exports = {
  preset: '@detox/jest-preset',
  
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    ['jest-junit', {
      outputDirectory: 'e2e/reports',
      outputName: 'junit.xml',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],
  verbose: true,
  
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  testEnvironment: 'node',
  
  collectCoverage: false,
  
  // E2E specific configuration
  transformIgnorePatterns: [
    'node_modules/(?!(detox|@detox)/)'
  ]
};