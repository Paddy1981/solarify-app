#!/usr/bin/env node

/**
 * Performance monitoring and baseline checking script
 * Validates application performance metrics against baselines
 */

const https = require('https');
const http = require('http');

const PERF_CHECK_URL = process.env.PERF_CHECK_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// Performance baselines (in milliseconds)
const PERFORMANCE_BASELINES = {
  'api/health': { max: 200, target: 100 },
  'api/auth/status': { max: 500, target: 300 },
  'homeowner/dashboard': { max: 2000, target: 1500 },
  'installer/dashboard': { max: 2000, target: 1500 },
  'supplier/dashboard': { max: 2000, target: 1500 },
  'marketplace': { max: 3000, target: 2000 },
  'api/rfqs': { max: 800, target: 600 },
  'api/products': { max: 1000, target: 800 },
};

class PerformanceChecker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      overall: 'unknown',
      metrics: {
        totalRequests: 0,
        passedRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0
      },
      checks: [],
      summary: {
        withinBaseline: 0,
        exceedsBaseline: 0,
        critical: 0
      }
    };
  }

  async runPerformanceChecks() {
    const startTime = Date.now();
    
    console.log(`⚡ Starting performance checks for: ${this.baseUrl}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
    console.log('─'.repeat(70));

    // Test each endpoint multiple times for statistical accuracy
    const testRuns = 3;
    
    for (const [endpoint, baseline] of Object.entries(PERFORMANCE_BASELINES)) {
      await this.performEndpointTest(endpoint, baseline, testRuns);
    }

    // Calculate overall metrics
    await this.calculateOverallMetrics();
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    this.results.metrics.throughput = (this.results.metrics.totalRequests / totalDuration) * 1000; // requests per second

    this.printResults();
    this.generateRecommendations();
    this.exitWithStatus();
  }

  async performEndpointTest(endpoint, baseline, runs = 3) {
    console.log(`🧪 Testing ${endpoint} (${runs} runs)...`);
    
    const measurements = [];
    
    for (let i = 0; i < runs; i++) {
      const measurement = await this.measureEndpoint(endpoint);
      measurements.push(measurement);
      
      // Small delay between requests
      await this.sleep(100);
    }

    const avgResponseTime = measurements.reduce((sum, m) => sum + m.responseTime, 0) / measurements.length;
    const minResponseTime = Math.min(...measurements.map(m => m.responseTime));
    const maxResponseTime = Math.max(...measurements.map(m => m.responseTime));
    
    const result = {
      endpoint: endpoint,
      baseline: baseline,
      measurements: measurements,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: minResponseTime,
      maxResponseTime: maxResponseTime,
      withinBaseline: avgResponseTime <= baseline.max,
      withinTarget: avgResponseTime <= baseline.target,
      status: this.determineStatus(avgResponseTime, baseline),
      recommendation: this.generateEndpointRecommendation(avgResponseTime, baseline)
    };

    this.results.checks.push(result);
    this.updateSummary(result);
    this.printEndpointResult(result);
  }

  async measureEndpoint(endpoint) {
    const startTime = Date.now();
    const fullUrl = `${this.baseUrl}/${endpoint}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      const responseTime = Date.now() - startTime;
      
      return {
        responseTime,
        statusCode: response.statusCode,
        success: response.statusCode >= 200 && response.statusCode < 400,
        contentLength: response.body ? response.body.length : 0
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        responseTime,
        statusCode: null,
        success: false,
        error: error.message,
        contentLength: 0
      };
    }
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/${path}`);
      const requestModule = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Solarify-Performance-Checker/1.0',
          'Accept': 'application/json,text/html,*/*',
          'Connection': 'keep-alive'
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

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${TIMEOUT}ms`));
      });

      req.end();
    });
  }

  determineStatus(responseTime, baseline) {
    if (responseTime <= baseline.target) return 'excellent';
    if (responseTime <= baseline.max) return 'good';
    if (responseTime <= baseline.max * 1.5) return 'warning';
    return 'critical';
  }

  generateEndpointRecommendation(responseTime, baseline) {
    if (responseTime <= baseline.target) {
      return 'Performance is excellent';
    } else if (responseTime <= baseline.max) {
      return 'Performance is acceptable but could be optimized';
    } else if (responseTime <= baseline.max * 1.5) {
      return 'Performance needs attention - consider caching or optimization';
    } else {
      return 'CRITICAL: Performance is unacceptable - immediate optimization required';
    }
  }

  updateSummary(result) {
    this.results.metrics.totalRequests += result.measurements.length;
    
    if (result.withinBaseline) {
      this.results.summary.withinBaseline++;
    } else {
      this.results.summary.exceedsBaseline++;
    }
    
    if (result.status === 'critical') {
      this.results.summary.critical++;
    }
  }

  async calculateOverallMetrics() {
    const allResponseTimes = this.results.checks
      .flatMap(check => check.measurements.map(m => m.responseTime))
      .sort((a, b) => a - b);

    if (allResponseTimes.length > 0) {
      this.results.metrics.averageResponseTime = Math.round(
        allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
      );
      
      this.results.metrics.p95ResponseTime = Math.round(
        allResponseTimes[Math.floor(allResponseTimes.length * 0.95)]
      );
      
      this.results.metrics.p99ResponseTime = Math.round(
        allResponseTimes[Math.floor(allResponseTimes.length * 0.99)]
      );
    }

    this.results.metrics.passedRequests = this.results.checks
      .flatMap(check => check.measurements)
      .filter(m => m.success).length;
    
    this.results.metrics.failedRequests = this.results.metrics.totalRequests - this.results.metrics.passedRequests;

    // Determine overall status
    if (this.results.summary.critical > 0) {
      this.results.overall = 'critical';
    } else if (this.results.summary.exceedsBaseline > 0) {
      this.results.overall = 'warning';
    } else {
      this.results.overall = 'good';
    }
  }

  printEndpointResult(result) {
    const icon = this.getStatusIcon(result.status);
    const baselineStatus = result.withinBaseline ? '✅' : '❌';
    
    console.log(`${icon} ${result.endpoint}: ${result.avgResponseTime}ms avg (${result.minResponseTime}-${result.maxResponseTime}ms) ${baselineStatus}`);
    
    if (!result.withinBaseline) {
      console.log(`   └─ Baseline: ${result.baseline.max}ms, Target: ${result.baseline.target}ms`);
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'warning': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  printResults() {
    console.log('─'.repeat(70));
    console.log('⚡ PERFORMANCE CHECK RESULTS');
    console.log('─'.repeat(70));
    console.log(`📊 Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`🎯 Within Baseline: ${this.results.summary.withinBaseline}/${this.results.checks.length}`);
    console.log(`⚠️  Exceeds Baseline: ${this.results.summary.exceedsBaseline}/${this.results.checks.length}`);
    console.log(`🔴 Critical Issues: ${this.results.summary.critical}/${this.results.checks.length}`);
    console.log('─'.repeat(70));
    console.log('📈 PERFORMANCE METRICS');
    console.log(`• Average Response Time: ${this.results.metrics.averageResponseTime}ms`);
    console.log(`• 95th Percentile: ${this.results.metrics.p95ResponseTime}ms`);
    console.log(`• 99th Percentile: ${this.results.metrics.p99ResponseTime}ms`);
    console.log(`• Throughput: ${this.results.metrics.throughput.toFixed(2)} req/sec`);
    console.log(`• Success Rate: ${((this.results.metrics.passedRequests / this.results.metrics.totalRequests) * 100).toFixed(1)}%`);
    console.log('─'.repeat(70));
  }

  generateRecommendations() {
    console.log('💡 PERFORMANCE RECOMMENDATIONS');
    console.log('─'.repeat(70));

    const criticalEndpoints = this.results.checks.filter(check => check.status === 'critical');
    const warningEndpoints = this.results.checks.filter(check => check.status === 'warning');

    if (criticalEndpoints.length > 0) {
      console.log('🚨 CRITICAL ACTIONS REQUIRED:');
      criticalEndpoints.forEach(endpoint => {
        console.log(`   • ${endpoint.endpoint}: ${endpoint.recommendation}`);
      });
    }

    if (warningEndpoints.length > 0) {
      console.log('⚠️  OPTIMIZATION OPPORTUNITIES:');
      warningEndpoints.forEach(endpoint => {
        console.log(`   • ${endpoint.endpoint}: ${endpoint.recommendation}`);
      });
    }

    // General recommendations
    console.log('🔧 GENERAL RECOMMENDATIONS:');
    
    if (this.results.metrics.averageResponseTime > 1000) {
      console.log('   • Consider implementing caching strategies');
      console.log('   • Review database query performance');
      console.log('   • Optimize bundle sizes and code splitting');
    }
    
    if (this.results.metrics.p95ResponseTime > 2000) {
      console.log('   • Implement CDN for static assets');
      console.log('   • Consider server-side rendering optimizations');
    }
    
    if (this.results.metrics.throughput < 10) {
      console.log('   • Review server capacity and scaling configuration');
      console.log('   • Consider connection pooling optimizations');
    }

    console.log('─'.repeat(70));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  exitWithStatus() {
    if (process.env.CI) {
      console.log('\n📋 MACHINE-READABLE RESULTS:');
      console.log(JSON.stringify(this.results, null, 2));
    }

    const exitCode = this.results.overall === 'critical' ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('🎉 Performance checks completed successfully!');
    } else {
      console.log('💥 Performance checks failed - critical issues detected!');
    }
    
    process.exit(exitCode);
  }
}

// Load testing utilities
class LoadTester {
  static async runConcurrentTests(baseUrl, endpoint, concurrency = 10, duration = 30000) {
    console.log(`🔄 Running load test: ${concurrency} concurrent requests for ${duration}ms`);
    
    const startTime = Date.now();
    const results = [];
    let requestCount = 0;
    
    const workers = Array.from({ length: concurrency }, () => {
      return new Promise(async (resolve) => {
        const workerResults = [];
        
        while (Date.now() - startTime < duration) {
          try {
            const reqStart = Date.now();
            const checker = new PerformanceChecker(baseUrl);
            await checker.makeRequest(endpoint);
            const responseTime = Date.now() - reqStart;
            
            workerResults.push({ responseTime, success: true });
            requestCount++;
          } catch (error) {
            workerResults.push({ responseTime: TIMEOUT, success: false, error: error.message });
            requestCount++;
          }
          
          // Small delay to prevent overwhelming
          await new Promise(r => setTimeout(r, 10));
        }
        
        resolve(workerResults);
      });
    });
    
    const allWorkerResults = await Promise.all(workers);
    const flatResults = allWorkerResults.flat();
    
    const successfulRequests = flatResults.filter(r => r.success);
    const failedRequests = flatResults.filter(r => !r.success);
    
    console.log(`📊 Load Test Results:`);
    console.log(`   • Total Requests: ${requestCount}`);
    console.log(`   • Successful: ${successfulRequests.length}`);
    console.log(`   • Failed: ${failedRequests.length}`);
    console.log(`   • Success Rate: ${(successfulRequests.length / flatResults.length * 100).toFixed(1)}%`);
    console.log(`   • Average Response Time: ${(successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length).toFixed(0)}ms`);
    console.log(`   • Requests/sec: ${(requestCount / (duration / 1000)).toFixed(2)}`);
    
    return {
      totalRequests: requestCount,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length,
      requestsPerSecond: requestCount / (duration / 1000)
    };
  }
}

// Main execution
async function main() {
  try {
    const checker = new PerformanceChecker(PERF_CHECK_URL);
    await checker.runPerformanceChecks();
  } catch (error) {
    console.error('💥 Performance check failed with error:', error.message);
    process.exit(1);
  }
}

// Run performance checks if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  PerformanceChecker,
  LoadTester,
  PERFORMANCE_BASELINES
};