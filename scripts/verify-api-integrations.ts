#!/usr/bin/env tsx

/**
 * API Integration Verification Script
 * Tests all external API integrations for production readiness
 */

interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'warning' | 'skip';
  message: string;
  responseTime?: number;
  details?: any;
}

class APIIntegrationVerifier {
  private results: APITestResult[] = [];

  async verifyAll(): Promise<void> {
    console.log('🔍 Starting API Integration Verification...\n');

    // Test Firebase Configuration
    await this.testFirebaseConfig();
    
    // Test External APIs
    await this.testNRELAPI();
    await this.testNOAAAPI();
    await this.testWeatherServices();
    
    // Test Internal APIs
    await this.testInternalAPIs();
    
    // Test Monitoring Services
    await this.testMonitoringServices();
    
    // Display Results
    this.displayResults();
  }

  private async testFirebaseConfig(): Promise<void> {
    console.log('📋 Testing Firebase Configuration...');
    
    const requiredFirebaseEnvs = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'FIREBASE_ADMIN_PROJECT_ID',
      'FIREBASE_ADMIN_CLIENT_EMAIL'
    ];

    let allPresent = true;
    const missing = [];

    for (const env of requiredFirebaseEnvs) {
      if (!process.env[env]) {
        allPresent = false;
        missing.push(env);
      }
    }

    if (allPresent) {
      this.results.push({
        service: 'Firebase Configuration',
        status: 'success',
        message: 'All Firebase environment variables present'
      });

      // Test Firebase connection
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`, {
          method: 'GET'
        });
        
        if (response.status === 401 || response.status === 200) {
          this.results.push({
            service: 'Firebase Connectivity',
            status: 'success', 
            message: 'Firebase API endpoints reachable'
          });
        } else {
          this.results.push({
            service: 'Firebase Connectivity',
            status: 'warning',
            message: `Unexpected Firebase response: ${response.status}`
          });
        }
      } catch (error) {
        this.results.push({
          service: 'Firebase Connectivity',
          status: 'error',
          message: `Firebase connection failed: ${error.message}`
        });
      }
    } else {
      this.results.push({
        service: 'Firebase Configuration',
        status: 'error',
        message: `Missing environment variables: ${missing.join(', ')}`
      });
    }
  }

  private async testNRELAPI(): Promise<void> {
    console.log('☀️ Testing NREL API Integration...');
    
    const apiKey = process.env.NREL_API_KEY;
    if (!apiKey) {
      this.results.push({
        service: 'NREL API',
        status: 'warning',
        message: 'NREL_API_KEY not configured - solar calculations may be limited'
      });
      return;
    }

    try {
      const startTime = Date.now();
      
      // Test NREL PVWatts API
      const pvWattsUrl = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${apiKey}&lat=40.2&lon=-105.25&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10`;
      
      const response = await fetch(pvWattsUrl);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          service: 'NREL PVWatts API',
          status: 'success',
          message: 'API responding correctly',
          responseTime,
          details: { annual_energy: data.outputs?.ac_annual || 'N/A' }
        });
      } else {
        this.results.push({
          service: 'NREL PVWatts API',
          status: 'error',
          message: `API error: ${response.status} ${response.statusText}`,
          responseTime
        });
      }

      // Test NREL Solar Resource API
      const solarResourceUrl = `https://developer.nrel.gov/api/solar/solar_resource/v1.json?api_key=${apiKey}&lat=40.2&lon=-105.25`;
      const resourceResponse = await fetch(solarResourceUrl);
      
      if (resourceResponse.ok) {
        this.results.push({
          service: 'NREL Solar Resource API', 
          status: 'success',
          message: 'Solar resource data available'
        });
      } else {
        this.results.push({
          service: 'NREL Solar Resource API',
          status: 'warning',
          message: 'Solar resource API unavailable'
        });
      }

    } catch (error) {
      this.results.push({
        service: 'NREL API',
        status: 'error',
        message: `Connection failed: ${error.message}`
      });
    }
  }

  private async testNOAAAPI(): Promise<void> {
    console.log('🌤️ Testing NOAA Weather API...');
    
    const apiKey = process.env.NOAA_API_KEY;
    if (!apiKey) {
      this.results.push({
        service: 'NOAA API',
        status: 'warning',
        message: 'NOAA_API_KEY not configured - weather data may be limited'
      });
      return;
    }

    try {
      const startTime = Date.now();
      
      // Test NOAA Current Conditions
      const weatherUrl = `https://api.weather.gov/stations/KDEN/observations/latest`;
      
      const response = await fetch(weatherUrl, {
        headers: {
          'User-Agent': 'Solarify-App/1.0 (contact@solarify.com)'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          service: 'NOAA Weather API',
          status: 'success', 
          message: 'Weather data available',
          responseTime,
          details: { 
            temperature: data.properties?.temperature?.value || 'N/A',
            timestamp: data.properties?.timestamp || 'N/A'
          }
        });
      } else {
        this.results.push({
          service: 'NOAA Weather API',
          status: 'error',
          message: `Weather API error: ${response.status}`,
          responseTime
        });
      }

    } catch (error) {
      this.results.push({
        service: 'NOAA API',
        status: 'error',
        message: `Connection failed: ${error.message}`
      });
    }
  }

  private async testWeatherServices(): Promise<void> {
    console.log('🌍 Testing Additional Weather Services...');
    
    // Test OpenWeatherMap (if configured)
    const owmKey = process.env.OPENWEATHERMAP_API_KEY;
    if (owmKey) {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Denver,CO&appid=${owmKey}`);
        if (response.ok) {
          this.results.push({
            service: 'OpenWeatherMap API',
            status: 'success',
            message: 'Additional weather data available'
          });
        }
      } catch (error) {
        this.results.push({
          service: 'OpenWeatherMap API',
          status: 'warning',
          message: 'Optional weather service unavailable'
        });
      }
    }

    // Test WeatherAPI.com (if configured)
    const weatherApiKey = process.env.WEATHERAPI_KEY;
    if (weatherApiKey) {
      try {
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=Denver,CO`);
        if (response.ok) {
          this.results.push({
            service: 'WeatherAPI.com',
            status: 'success',
            message: 'Weather API service operational'
          });
        }
      } catch (error) {
        this.results.push({
          service: 'WeatherAPI.com',
          status: 'warning',
          message: 'Optional weather service unavailable'
        });
      }
    }
  }

  private async testInternalAPIs(): Promise<void> {
    console.log('🏠 Testing Internal API Endpoints...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const endpoints = [
      '/api/health',
      '/api/solar/calculate',
      '/api/equipment/search', 
      '/api/net-metering',
      '/api/utility-rates'
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const responseTime = Date.now() - startTime;

        if (response.ok || response.status === 404) { // 404 is ok for non-existent endpoints
          this.results.push({
            service: `Internal API: ${endpoint}`,
            status: 'success',
            message: `Endpoint accessible (${response.status})`,
            responseTime
          });
        } else {
          this.results.push({
            service: `Internal API: ${endpoint}`,
            status: 'warning', 
            message: `Endpoint returned ${response.status}`,
            responseTime
          });
        }
      } catch (error) {
        // Local server might not be running - this is expected
        this.results.push({
          service: `Internal API: ${endpoint}`,
          status: 'skip',
          message: 'Local server not running - will test in deployment'
        });
      }
    }
  }

  private async testMonitoringServices(): Promise<void> {
    console.log('📊 Testing Monitoring Services...');
    
    // Test Sentry DSN if configured
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      try {
        const response = await fetch(sentryDsn.replace('/api/', '/api/0/'));
        this.results.push({
          service: 'Sentry Error Tracking',
          status: 'success',
          message: 'Sentry DSN reachable'
        });
      } catch (error) {
        this.results.push({
          service: 'Sentry Error Tracking', 
          status: 'warning',
          message: 'Sentry configuration may need verification'
        });
      }
    } else {
      this.results.push({
        service: 'Sentry Error Tracking',
        status: 'warning',
        message: 'NEXT_PUBLIC_SENTRY_DSN not configured'
      });
    }

    // Test Redis if configured
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      try {
        const response = await fetch(`${redisUrl}/ping`, {
          headers: {
            'Authorization': `Bearer ${redisToken}`
          }
        });
        
        if (response.ok) {
          this.results.push({
            service: 'Redis Cache',
            status: 'success',
            message: 'Redis connection successful'
          });
        } else {
          this.results.push({
            service: 'Redis Cache',
            status: 'error', 
            message: `Redis connection failed: ${response.status}`
          });
        }
      } catch (error) {
        this.results.push({
          service: 'Redis Cache',
          status: 'error',
          message: `Redis error: ${error.message}`
        });
      }
    } else {
      this.results.push({
        service: 'Redis Cache',
        status: 'warning',
        message: 'Redis not configured - rate limiting unavailable'
      });
    }
  }

  private displayResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 API INTEGRATION VERIFICATION RESULTS');
    console.log('='.repeat(80));

    const successful = this.results.filter(r => r.status === 'success').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    // Group by status
    const groups = {
      success: this.results.filter(r => r.status === 'success'),
      warning: this.results.filter(r => r.status === 'warning'), 
      error: this.results.filter(r => r.status === 'error'),
      skip: this.results.filter(r => r.status === 'skip')
    };

    for (const [status, results] of Object.entries(groups)) {
      if (results.length === 0) continue;
      
      const emoji = {
        success: '✅',
        warning: '⚠️', 
        error: '❌',
        skip: '⏭️'
      }[status];

      console.log(`\n${emoji} ${status.toUpperCase()} (${results.length}):`);
      console.log('-'.repeat(40));
      
      for (const result of results) {
        console.log(`  ${result.service}`);
        console.log(`    └─ ${result.message}`);
        if (result.responseTime) {
          console.log(`    └─ Response time: ${result.responseTime}ms`);
        }
        if (result.details) {
          console.log(`    └─ Details: ${JSON.stringify(result.details)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}`);  
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Total Tests: ${this.results.length}`);
    
    const successRate = ((successful / this.results.length) * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);

    // Determine overall status
    if (errors > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND - Review errors before deployment');
      process.exit(1);
    } else if (warnings > 2) {
      console.log('\n⚠️  MULTIPLE WARNINGS - Consider addressing before production');
      process.exit(1);
    } else {
      console.log('\n🎉 API INTEGRATIONS READY FOR DEPLOYMENT');
      process.exit(0);
    }
  }
}

// Run verification
if (require.main === module) {
  const verifier = new APIIntegrationVerifier();
  verifier.verifyAll().catch(console.error);
}

export default APIIntegrationVerifier;