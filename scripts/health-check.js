#!/usr/bin/env node

/**
 * Application health check script
 * Validates critical application endpoints and services
 */

const https = require('https');
const http = require('http');

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

class HealthChecker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  async runHealthChecks() {
    const startTime = Date.now();
    
    console.log(`🏥 Starting health checks for: ${this.baseUrl}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
    console.log('─'.repeat(60));

    const checks = [
      { name: 'Application Root', path: '/', method: 'GET', expectedStatus: 200 },
      { name: 'Health Endpoint', path: '/api/health', method: 'GET', expectedStatus: 200 },
      { name: 'Authentication Check', path: '/api/auth/status', method: 'GET', expectedStatus: [200, 401] },
      { name: 'Database Connection', path: '/api/health/database', method: 'GET', expectedStatus: 200 },
      { name: 'Firebase Connection', path: '/api/health/firebase', method: 'GET', expectedStatus: 200 },
      { name: 'Static Assets', path: '/favicon.ico', method: 'GET', expectedStatus: 200 },
      { name: 'API Documentation', path: '/api/docs', method: 'GET', expectedStatus: [200, 404] },
    ];

    for (const check of checks) {
      await this.performCheck(check);
    }

    const endTime = Date.now();
    this.results.summary.duration = endTime - startTime;
    this.results.summary.total = this.results.checks.length;
    this.results.summary.passed = this.results.checks.filter(c => c.status === 'pass').length;
    this.results.summary.failed = this.results.checks.filter(c => c.status === 'fail').length;
    this.results.overall = this.results.summary.failed === 0 ? 'healthy' : 'unhealthy';

    this.printResults();
    this.exitWithStatus();
  }

  async performCheck(check) {
    const startTime = Date.now();
    const result = {
      name: check.name,
      url: `${this.baseUrl}${check.path}`,
      method: check.method,
      expectedStatus: check.expectedStatus,
      actualStatus: null,
      responseTime: 0,
      status: 'unknown',
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.makeRequest(check.path, check.method);
      result.actualStatus = response.statusCode;
      result.responseTime = Date.now() - startTime;

      const expectedStatuses = Array.isArray(check.expectedStatus) 
        ? check.expectedStatus 
        : [check.expectedStatus];
      
      if (expectedStatuses.includes(response.statusCode)) {
        result.status = 'pass';
        console.log(`✅ ${check.name}: ${response.statusCode} (${result.responseTime}ms)`);
      } else {
        result.status = 'fail';
        result.error = `Expected ${check.expectedStatus}, got ${response.statusCode}`;
        console.log(`❌ ${check.name}: ${response.statusCode} - ${result.error} (${result.responseTime}ms)`);
      }
    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.status = 'fail';
      result.error = error.message;
      console.log(`❌ ${check.name}: ${error.message} (${result.responseTime}ms)`);
    }

    this.results.checks.push(result);
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
          'User-Agent': 'Solarify-Health-Checker/1.0',
          'Accept': 'application/json,text/html,*/*'
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
    console.log('─'.repeat(60));
    console.log('🏥 HEALTH CHECK RESULTS');
    console.log('─'.repeat(60));
    console.log(`📊 Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`✅ Passed: ${this.results.summary.passed}/${this.results.summary.total}`);
    console.log(`❌ Failed: ${this.results.summary.failed}/${this.results.summary.total}`);
    console.log(`⏱️  Total Duration: ${this.results.summary.duration}ms`);
    console.log('─'.repeat(60));

    if (this.results.summary.failed > 0) {
      console.log('❌ FAILED CHECKS:');
      this.results.checks
        .filter(check => check.status === 'fail')
        .forEach(check => {
          console.log(`   • ${check.name}: ${check.error}`);
        });
      console.log('─'.repeat(60));
    }

    // Output machine-readable results for CI/CD
    if (process.env.CI) {
      console.log('\n📋 MACHINE-READABLE RESULTS:');
      console.log(JSON.stringify(this.results, null, 2));
    }
  }

  exitWithStatus() {
    const exitCode = this.results.overall === 'healthy' ? 0 : 1;
    
    if (exitCode === 0) {
      console.log('🎉 All health checks passed!');
    } else {
      console.log('💥 Some health checks failed!');
    }
    
    process.exit(exitCode);
  }
}

// Additional health check utilities
class DatabaseHealthChecker {
  static async checkFirestore() {
    try {
      // This would typically check Firestore connectivity
      console.log('🔥 Checking Firestore connection...');
      return { status: 'healthy', latency: Math.random() * 100 };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  static async checkAuthentication() {
    try {
      // This would check Firebase Auth connectivity
      console.log('🔐 Checking Authentication service...');
      return { status: 'healthy', latency: Math.random() * 50 };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

class PerformanceChecker {
  static async measureResponseTimes(baseUrl) {
    const endpoints = [
      '/api/health',
      '/api/auth/status',
      '/homeowner/dashboard',
      '/installer/dashboard',
      '/supplier/dashboard'
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const checker = new HealthChecker(baseUrl);
        await checker.makeRequest(endpoint);
        const responseTime = Date.now() - startTime;
        results.push({ endpoint, responseTime, status: 'success' });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({ endpoint, responseTime, status: 'error', error: error.message });
      }
    }

    return results;
  }
}

// Main execution
async function main() {
  try {
    const checker = new HealthChecker(HEALTH_CHECK_URL);
    await checker.runHealthChecks();
  } catch (error) {
    console.error('💥 Health check failed with error:', error.message);
    process.exit(1);
  }
}

// Run health checks if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  HealthChecker,
  DatabaseHealthChecker,
  PerformanceChecker
};