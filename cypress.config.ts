import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })
      
      // Code coverage setup
      require('@cypress/code-coverage/task')(on, config)
      
      return config
    },
    
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    env: {
      // Test user credentials for E2E tests
      TEST_HOMEOWNER_EMAIL: 'test.homeowner@solarify.test',
      TEST_HOMEOWNER_PASSWORD: 'TestPassword123!',
      TEST_INSTALLER_EMAIL: 'test.installer@solarify.test',
      TEST_INSTALLER_PASSWORD: 'TestPassword123!',
      TEST_SUPPLIER_EMAIL: 'test.supplier@solarify.test',
      TEST_SUPPLIER_PASSWORD: 'TestPassword123!',
    },
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
  
  // Global configuration
  retries: {
    runMode: 2,
    openMode: 0,
  },
  
  // Browser configuration
  chromeWebSecurity: false,
  
  // Experimental features
  experimentalStudio: true,
  experimentalMemoryManagement: true,
})