#!/usr/bin/env node

/**
 * Smoke tests for post-deployment validation
 * Quick tests to verify critical functionality after deployment
 */

const https = require('https');
const http = require('http');

const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

class SmokeTestRunner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      overall: 'unknown',
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
  }

  async runSmokeTests() {
    const startTime = Date.now();
    
    console.log(`💨 Starting smoke tests for: ${this.baseUrl}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
    console.log('─'.repeat(60));

    const testSuites = [
      { name: 'Critical Pages', tests: this.getCriticalPageTests() },
      { name: 'API Endpoints', tests: this.getAPITests() },
      { name: 'Authentication', tests: this.getAuthTests() },
      { name: 'User Flows', tests: this.getUserFlowTests() },
      { name: 'Static Assets', tests: this.getStaticAssetTests() }
    ];

    for (const suite of testSuites) {
      console.log(`\n🧪 Running ${suite.name} tests...`);
      await this.runTestSuite(suite);
    }

    const endTime = Date.now();
    this.results.summary.duration = endTime - startTime;
    this.results.summary.total = this.results.tests.length;
    this.results.summary.passed = this.results.tests.filter(t => t.status === 'pass').length;
    this.results.summary.failed = this.results.tests.filter(t => t.status === 'fail').length;
    this.results.summary.skipped = this.results.tests.filter(t => t.status === 'skip').length;
    this.results.overall = this.results.summary.failed === 0 ? 'pass' : 'fail';

    this.printResults();
    this.exitWithStatus();
  }

  getCriticalPageTests() {
    return [
      {
        name: 'Home Page Loads',
        url: '/',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['Solarify', 'solar'],
        critical: true
      },
      {
        name: 'Homeowner Dashboard Accessible',
        url: '/homeowner/dashboard',
        method: 'GET',
        expectedStatus: [200, 302, 401], // May redirect to login
        critical: true
      },
      {
        name: 'Installer Dashboard Accessible',
        url: '/installer/dashboard',
        method: 'GET',
        expectedStatus: [200, 302, 401],
        critical: true
      },
      {
        name: 'Supplier Dashboard Accessible',
        url: '/supplier/dashboard',
        method: 'GET',
        expectedStatus: [200, 302, 401],
        critical: true
      },
      {
        name: 'Marketplace Page Loads',
        url: '/marketplace',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['products', 'solar'],
        critical: true
      },
      {
        name: '404 Page Handles Unknown Routes',
        url: '/this-page-does-not-exist',
        method: 'GET',
        expectedStatus: 404,
        critical: false
      }
    ];
  }

  getAPITests() {
    return [
      {
        name: 'Health Check API',
        url: '/api/health',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['status'],
        critical: true
      },
      {
        name: 'Authentication Status API',
        url: '/api/auth/status',
        method: 'GET',
        expectedStatus: [200, 401],
        critical: true
      },
      {
        name: 'Products API Responds',
        url: '/api/products',
        method: 'GET',
        expectedStatus: [200, 401],
        expectedContent: [],
        critical: true
      },
      {
        name: 'RFQs API Responds',
        url: '/api/rfqs',
        method: 'GET',
        expectedStatus: [200, 401],
        critical: true
      },
      {
        name: 'Database Health Check',
        url: '/api/health/database',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['database'],
        critical: true
      }
    ];
  }

  getAuthTests() {
    return [
      {
        name: 'Login Page Accessible',
        url: '/auth/signin',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['sign in', 'login'],
        critical: true
      },
      {
        name: 'Registration Page Accessible',
        url: '/auth/signup',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['sign up', 'register'],
        critical: true
      },
      {
        name: 'Password Reset Page Accessible',
        url: '/auth/reset-password',
        method: 'GET',
        expectedStatus: 200,
        expectedContent: ['reset', 'password'],
        critical: false
      }
    ];
  }

  getUserFlowTests() {
    return [
      {
        name: 'RFQ Creation Page Loads',
        url: '/homeowner/rfq',
        method: 'GET',
        expectedStatus: [200, 302, 401],
        critical: true
      },
      {
        name: 'Quote Management Page Loads',
        url: '/installer/quotes',
        method: 'GET',
        expectedStatus: [200, 302, 401],
        critical: true
      },
      {
        name: 'Product Management Page Loads',
        url: '/supplier/products',
        method: 'GET',
        expectedStatus: [200, 302, 401],
        critical: true
      },
      {
        name: 'Search Functionality Available',
        url: '/search?q=solar',
        method: 'GET',
        expectedStatus: [200, 302],
        critical: false
      }
    ];
  }

  getStaticAssetTests() {
    return [
      {
        name: 'Favicon Loads',
        url: '/favicon.ico',
        method: 'GET',
        expectedStatus: 200,
        critical: false
      },
      {
        name: 'Robots.txt Available',
        url: '/robots.txt',
        method: 'GET',
        expectedStatus: [200, 404],
        critical: false
      },
      {
        name: 'Sitemap Available',
        url: '/sitemap.xml',
        method: 'GET',
        expectedStatus: [200, 404],
        critical: false
      }
    ];
  }

  async runTestSuite(suite) {
    for (const test of suite.tests) {
      await this.runSingleTest(test);
    }
  }

  async runSingleTest(test) {
    const startTime = Date.now();
    const result = {
      name: test.name,
      url: `${this.baseUrl}${test.url}`,
      method: test.method,
      expectedStatus: test.expectedStatus,
      expectedContent: test.expectedContent || [],
      actualStatus: null,
      responseTime: 0,
      status: 'unknown',
      error: null,
      critical: test.critical,
      timestamp: new Date().toISOString(),
      contentValidation: {}
    };

    try {
      const response = await this.makeRequest(test.url, test.method);
      result.actualStatus = response.statusCode;
      result.responseTime = Date.now() - startTime;

      // Check status code
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const statusValid = expectedStatuses.includes(response.statusCode);
      
      // Check content if response is successful
      let contentValid = true;
      if (response.statusCode >= 200 && response.statusCode < 400 && test.expectedContent) {
        for (const expectedText of test.expectedContent) {
          const found = response.body.toLowerCase().includes(expectedText.toLowerCase());
          result.contentValidation[expectedText] = found;
          if (!found) contentValid = false;
        }
      }

      if (statusValid && contentValid) {
        result.status = 'pass';
        console.log(`✅ ${test.name}: ${response.statusCode} (${result.responseTime}ms)`);
      } else {
        result.status = 'fail';
        const issues = [];
        if (!statusValid) issues.push(`status: expected ${test.expectedStatus}, got ${response.statusCode}`);
        if (!contentValid) issues.push('content validation failed');
        result.error = issues.join(', ');
        console.log(`❌ ${test.name}: ${result.error} (${result.responseTime}ms)`);
      }
    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.status = test.critical ? 'fail' : 'skip';
      result.error = error.message;
      
      if (test.critical) {
        console.log(`❌ ${test.name}: ${error.message} (${result.responseTime}ms)`);
      } else {
        console.log(`⚠️  ${test.name}: ${error.message} (skipped, non-critical)`);
      }
    }

    this.results.tests.push(result);
  }

  makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Solarify-Smoke-Test/1.0',
          'Accept': 'text/html,application/json,*/*'
        }
      };

      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${TIMEOUT}ms`));
      });

      req.end();
    });
  }

  printResults() {
    console.log('\n' + '─'.repeat(60));
    console.log('💨 SMOKE TEST RESULTS');
    console.log('─'.repeat(60));
    console.log(`📊 Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`✅ Passed: ${this.results.summary.passed}/${this.results.summary.total}`);
    console.log(`❌ Failed: ${this.results.summary.failed}/${this.results.summary.total}`);
    console.log(`⚠️  Skipped: ${this.results.summary.skipped}/${this.results.summary.total}`);
    console.log(`⏱️  Total Duration: ${this.results.summary.duration}ms`);
    console.log('─'.repeat(60));

    const criticalFailures = this.results.tests.filter(t => t.status === 'fail' && t.critical);
    const nonCriticalFailures = this.results.tests.filter(t => t.status === 'fail' && !t.critical);

    if (criticalFailures.length > 0) {
      console.log('🚨 CRITICAL FAILURES:');
      criticalFailures.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
      console.log('─'.repeat(60));
    }

    if (nonCriticalFailures.length > 0) {
      console.log('⚠️  NON-CRITICAL ISSUES:');
      nonCriticalFailures.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
      console.log('─'.repeat(60));
    }

    // Additional deployment validation
    console.log('🔍 DEPLOYMENT VALIDATION:');
    const deploymentChecks = this.validateDeployment();
    deploymentChecks.forEach(check => {
      console.log(`   ${check.status} ${check.message}`);
    });
    console.log('─'.repeat(60));

    // Output machine-readable results for CI/CD
    if (process.env.CI) {
      console.log('\n📋 MACHINE-READABLE RESULTS:');
      console.log(JSON.stringify(this.results, null, 2));
    }
  }

  validateDeployment() {
    const checks = [];
    
    // Check if main pages are accessible
    const mainPages = this.results.tests.filter(t => 
      ['Home Page Loads', 'Homeowner Dashboard Accessible', 'Installer Dashboard Accessible', 'Supplier Dashboard Accessible']
      .includes(t.name)
    );
    
    const mainPagesWorking = mainPages.filter(p => p.status === 'pass').length;
    if (mainPagesWorking === mainPages.length) {
      checks.push({ status: '✅', message: 'All main pages are accessible' });
    } else {
      checks.push({ status: '❌', message: `${mainPages.length - mainPagesWorking} main pages have issues` });
    }

    // Check API health
    const apiTests = this.results.tests.filter(t => t.url.includes('/api/'));
    const apiWorking = apiTests.filter(t => t.status === 'pass').length;
    if (apiWorking >= apiTests.length * 0.8) {
      checks.push({ status: '✅', message: `${apiWorking}/${apiTests.length} API endpoints are working` });
    } else {
      checks.push({ status: '❌', message: `Only ${apiWorking}/${apiTests.length} API endpoints are working` });
    }

    // Check response times
    const avgResponseTime = this.results.tests.reduce((sum, t) => sum + t.responseTime, 0) / this.results.tests.length;
    if (avgResponseTime < 2000) {
      checks.push({ status: '✅', message: `Average response time: ${Math.round(avgResponseTime)}ms` });
    } else {
      checks.push({ status: '⚠️', message: `Average response time is high: ${Math.round(avgResponseTime)}ms` });
    }

    return checks;
  }

  exitWithStatus() {
    const criticalFailures = this.results.tests.filter(t => t.status === 'fail' && t.critical).length;
    const exitCode = criticalFailures > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('🎉 All critical smoke tests passed! Deployment is healthy.');
    } else {
      console.log(`💥 ${criticalFailures} critical smoke tests failed! Deployment needs attention.`);
    }
    
    process.exit(exitCode);
  }
}

// Advanced smoke testing utilities
class DatabaseSmokeTest {
  static async testDatabaseConnectivity(baseUrl) {
    console.log('🗄️ Testing database connectivity...');
    
    try {
      const runner = new SmokeTestRunner(baseUrl);
      const response = await runner.makeRequest('/api/health/database');
      
      if (response.statusCode === 200) {
        console.log('✅ Database connectivity test passed');
        return true;
      } else {
        console.log(`❌ Database connectivity test failed: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Database connectivity test failed: ${error.message}`);
      return false;
    }
  }
}

class SecuritySmokeTest {
  static async testSecurityHeaders(baseUrl) {
    console.log('🔒 Testing security headers...');
    
    try {
      const runner = new SmokeTestRunner(baseUrl);
      const response = await runner.makeRequest('/');
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'content-security-policy'
      ];
      
      const missingHeaders = securityHeaders.filter(header => !response.headers[header]);
      
      if (missingHeaders.length === 0) {
        console.log('✅ All security headers are present');
        return true;
      } else {
        console.log(`⚠️ Missing security headers: ${missingHeaders.join(', ')}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Security headers test failed: ${error.message}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    const runner = new SmokeTestRunner(TEST_BASE_URL);
    await runner.runSmokeTests();
  } catch (error) {
    console.error('💥 Smoke tests failed with error:', error.message);
    process.exit(1);
  }
}

// Run smoke tests if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  SmokeTestRunner,
  DatabaseSmokeTest,
  SecuritySmokeTest
};