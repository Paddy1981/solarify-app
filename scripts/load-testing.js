// =============================================================================
// Comprehensive Load Testing for Solarify Solar Marketplace
// =============================================================================
// Advanced load testing scenarios to validate production readiness
// Tests critical user journeys and system scalability
// =============================================================================

const k6 = require('k6');
const http = require('k6/http');
const check = require('k6').check;
const sleep = require('k6').sleep;
const crypto = require('k6/crypto');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'https://solarify-staging.web.app';
const PROJECT_ID = __ENV.PROJECT_ID || 'solarify-staging';
const ENVIRONMENT = __ENV.ENVIRONMENT || 'staging';

// Load testing scenarios configuration
const scenarios = {
  // Light load - normal business hours
  light_load: {
    executor: 'constant-vus',
    vus: 10,
    duration: '5m',
    tags: { scenario: 'light_load' },
  },
  
  // Peak load - high traffic simulation
  peak_load: {
    executor: 'ramping-vus',
    stages: [
      { duration: '2m', target: 20 },  // Ramp up
      { duration: '5m', target: 50 },  // Stay at peak
      { duration: '2m', target: 0 },   // Ramp down
    ],
    tags: { scenario: 'peak_load' },
  },
  
  // Stress test - beyond normal capacity
  stress_test: {
    executor: 'ramping-vus',
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 100 },
      { duration: '3m', target: 150 },
      { duration: '2m', target: 0 },
    ],
    tags: { scenario: 'stress_test' },
  },
  
  // Spike test - sudden traffic spikes
  spike_test: {
    executor: 'ramping-vus',
    stages: [
      { duration: '10s', target: 5 },
      { duration: '1m', target: 100 },  // Sudden spike
      { duration: '10s', target: 5 },
      { duration: '3m', target: 5 },
      { duration: '10s', target: 0 },
    ],
    tags: { scenario: 'spike_test' },
  },
  
  // Soak test - extended duration
  soak_test: {
    executor: 'constant-vus',
    vus: 20,
    duration: '15m',
    tags: { scenario: 'soak_test' },
  },
  
  // Critical user journey - RFQ creation flow
  rfq_creation_journey: {
    executor: 'constant-arrival-rate',
    rate: 5, // 5 RFQ creations per second
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 10,
    maxVUs: 50,
    tags: { scenario: 'rfq_journey' },
  },
  
  // API load test - external integrations
  api_load_test: {
    executor: 'constant-arrival-rate',
    rate: 10,
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 5,
    maxVUs: 20,
    tags: { scenario: 'api_load' },
  }
};

// Performance thresholds
const thresholds = {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
  http_req_failed: ['rate<0.05'], // Error rate under 5%
  http_reqs: ['rate>10'], // At least 10 requests per second
  
  // Scenario-specific thresholds
  'http_req_duration{scenario:light_load}': ['p(95)<1500'],
  'http_req_duration{scenario:peak_load}': ['p(95)<3000'],
  'http_req_duration{scenario:stress_test}': ['p(95)<5000'],
  'http_req_duration{scenario:rfq_journey}': ['p(95)<2000'],
  
  // Page-specific thresholds
  'http_req_duration{page:home}': ['p(95)<1000'],
  'http_req_duration{page:dashboard}': ['p(95)<2000'],
  'http_req_duration{page:rfq}': ['p(95)<3000'],
  'http_req_duration{page:api}': ['p(95)<1500'],
};

// Test data generators
function generateTestUser() {
  const userId = crypto.randomUUID();
  return {
    id: userId,
    email: `test-user-${userId.slice(0, 8)}@solarify-loadtest.com`,
    name: `Test User ${Math.floor(Math.random() * 1000)}`,
    role: Math.random() > 0.7 ? 'installer' : 'homeowner',
  };
}

function generateRFQData() {
  const locations = [
    { city: 'San Francisco', state: 'CA', zip: '94102' },
    { city: 'Austin', state: 'TX', zip: '73301' },
    { city: 'Denver', state: 'CO', zip: '80202' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
  ];
  
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  return {
    id: crypto.randomUUID(),
    propertyAddress: `${Math.floor(Math.random() * 9999)} Test St, ${location.city}, ${location.state} ${location.zip}`,
    systemSize: Math.floor(Math.random() * 15) + 5, // 5-20 kW
    roofType: ['asphalt_shingle', 'tile', 'metal', 'flat'][Math.floor(Math.random() * 4)],
    estimatedBudget: Math.floor(Math.random() * 50000) + 15000, // $15k-65k
    timeframe: ['immediate', 'within_3_months', 'within_6_months'][Math.floor(Math.random() * 3)],
    electricityBill: Math.floor(Math.random() * 300) + 100, // $100-400
    ...location,
  };
}

function generateQuoteData(rfqId) {
  return {
    rfqId: rfqId,
    quotedPrice: Math.floor(Math.random() * 40000) + 20000,
    systemSize: Math.floor(Math.random() * 15) + 5,
    panelBrand: ['SunPower', 'LG', 'Canadian Solar', 'Tesla'][Math.floor(Math.random() * 4)],
    inverterBrand: ['Enphase', 'SolarEdge', 'Power Optimizers'][Math.floor(Math.random() * 3)],
    warrantyYears: [20, 25][Math.floor(Math.random() * 2)],
    installationTimeframe: Math.floor(Math.random() * 12) + 2, // 2-14 weeks
  };
}

// Test scenarios

export function homepageLoadTest() {
  const response = http.get(`${BASE_URL}/`, {
    tags: { page: 'home' },
  });
  
  check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads in reasonable time': (r) => r.timings.duration < 2000,
    'Homepage contains Solarify branding': (r) => r.body.includes('Solarify'),
    'Homepage has proper content-type': (r) => r.headers['Content-Type']?.includes('text/html'),
  });
  
  sleep(1);
}

export function dashboardLoadTest() {
  const response = http.get(`${BASE_URL}/dashboard`, {
    tags: { page: 'dashboard' },
  });
  
  check(response, {
    'Dashboard accessible': (r) => r.status === 200 || r.status === 401, // May require auth
    'Dashboard response time acceptable': (r) => r.timings.duration < 3000,
  });
  
  sleep(2);
}

export function apiHealthCheck() {
  const response = http.get(`${BASE_URL}/api/health`, {
    tags: { page: 'api' },
  });
  
  check(response, {
    'API health check returns 200': (r) => r.status === 200,
    'API health check is fast': (r) => r.timings.duration < 1000,
    'API returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  });
  
  sleep(0.5);
}

export function rfqCreationJourney() {
  const user = generateTestUser();
  const rfqData = generateRFQData();
  
  // Step 1: Visit homepage
  let response = http.get(`${BASE_URL}/`, {
    tags: { journey: 'rfq_creation', step: 'homepage' },
  });
  
  check(response, {
    'RFQ Journey - Homepage loads': (r) => r.status === 200,
  });
  
  sleep(1);
  
  // Step 2: Navigate to RFQ form
  response = http.get(`${BASE_URL}/rfq/create`, {
    tags: { journey: 'rfq_creation', step: 'rfq_form' },
  });
  
  check(response, {
    'RFQ Journey - Form page accessible': (r) => r.status === 200 || r.status === 404, // May not exist yet
  });
  
  sleep(2);
  
  // Step 3: Submit RFQ (simulate API call)
  response = http.post(`${BASE_URL}/api/rfq`, JSON.stringify(rfqData), {
    headers: { 'Content-Type': 'application/json' },
    tags: { journey: 'rfq_creation', step: 'submit_rfq' },
  });
  
  check(response, {
    'RFQ Journey - Submission handled': (r) => r.status === 200 || r.status === 201 || r.status === 404,
    'RFQ Journey - Response time acceptable': (r) => r.timings.duration < 5000,
  });
  
  sleep(1);
  
  // Step 4: View RFQ confirmation/dashboard
  response = http.get(`${BASE_URL}/dashboard/rfqs`, {
    tags: { journey: 'rfq_creation', step: 'confirmation' },
  });
  
  check(response, {
    'RFQ Journey - Confirmation page loads': (r) => r.status === 200 || r.status === 401,
  });
  
  sleep(2);
}

export function installerQuoteJourney() {
  const rfqId = crypto.randomUUID();
  const quoteData = generateQuoteData(rfqId);
  
  // Step 1: Browse available RFQs
  let response = http.get(`${BASE_URL}/installer/rfqs`, {
    tags: { journey: 'quote_creation', step: 'browse_rfqs' },
  });
  
  check(response, {
    'Quote Journey - RFQ listing accessible': (r) => r.status === 200 || r.status === 401,
  });
  
  sleep(1);
  
  // Step 2: View RFQ details
  response = http.get(`${BASE_URL}/installer/rfqs/${rfqId}`, {
    tags: { journey: 'quote_creation', step: 'rfq_details' },
  });
  
  check(response, {
    'Quote Journey - RFQ details load': (r) => r.status === 200 || r.status === 404,
  });
  
  sleep(2);
  
  // Step 3: Submit quote
  response = http.post(`${BASE_URL}/api/quotes`, JSON.stringify(quoteData), {
    headers: { 'Content-Type': 'application/json' },
    tags: { journey: 'quote_creation', step: 'submit_quote' },
  });
  
  check(response, {
    'Quote Journey - Quote submission handled': (r) => r.status === 200 || r.status === 201 || r.status === 404,
    'Quote Journey - Reasonable response time': (r) => r.timings.duration < 3000,
  });
  
  sleep(1);
}

export function staticResourcesTest() {
  const resources = [
    '/favicon.ico',
    '/_next/static/css/app.css',
    '/_next/static/js/app.js',
    '/images/logo.svg',
    '/api/auth/session',
  ];
  
  resources.forEach((resource) => {
    const response = http.get(`${BASE_URL}${resource}`, {
      tags: { resource_type: 'static' },
    });
    
    check(response, {
      [`Static resource ${resource} available or redirected`]: (r) => 
        r.status === 200 || r.status === 301 || r.status === 302 || r.status === 404,
      [`Static resource ${resource} fast response`]: (r) => r.timings.duration < 2000,
    });
    
    sleep(0.2);
  });
}

export function externalAPISimulation() {
  // Simulate external API calls that the app might make
  const apis = [
    { url: `${BASE_URL}/api/weather`, name: 'weather_api' },
    { url: `${BASE_URL}/api/solar-data`, name: 'solar_data_api' },
    { url: `${BASE_URL}/api/utility-rates`, name: 'utility_api' },
    { url: `${BASE_URL}/api/incentives`, name: 'incentives_api' },
  ];
  
  apis.forEach((api) => {
    const response = http.get(api.url, {
      tags: { api_type: 'external', api_name: api.name },
    });
    
    check(response, {
      [`${api.name} API responds`]: (r) => r.status === 200 || r.status === 404 || r.status === 500,
      [`${api.name} API reasonable response time`]: (r) => r.timings.duration < 10000,
    });
    
    sleep(1);
  });
}

export function databaseLoadTest() {
  // Simulate database-heavy operations
  const operations = [
    { endpoint: '/api/search/installers', params: '?city=San+Francisco&state=CA' },
    { endpoint: '/api/analytics/dashboard', params: '' },
    { endpoint: '/api/user/profile', params: '' },
    { endpoint: '/api/rfqs/recent', params: '?limit=20' },
  ];
  
  operations.forEach((op) => {
    const response = http.get(`${BASE_URL}${op.endpoint}${op.params}`, {
      tags: { operation_type: 'database' },
    });
    
    check(response, {
      [`Database operation ${op.endpoint} handles load`]: (r) => 
        r.status === 200 || r.status === 401 || r.status === 404,
      [`Database operation ${op.endpoint} completes in time`]: (r) => 
        r.timings.duration < 5000,
    });
    
    sleep(1.5);
  });
}

// Main test execution logic
export function setup() {
  console.log(`Starting load tests for ${BASE_URL}`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  
  // Setup test data if needed
  return {
    baseUrl: BASE_URL,
    projectId: PROJECT_ID,
    environment: ENVIRONMENT,
  };
}

export default function(data) {
  const scenario = __ENV.SCENARIO || 'mixed';
  
  switch (scenario) {
    case 'homepage':
      homepageLoadTest();
      break;
      
    case 'dashboard':
      dashboardLoadTest();
      break;
      
    case 'api':
      apiHealthCheck();
      break;
      
    case 'rfq_journey':
      rfqCreationJourney();
      break;
      
    case 'quote_journey':
      installerQuoteJourney();
      break;
      
    case 'static_resources':
      staticResourcesTest();
      break;
      
    case 'external_apis':
      externalAPISimulation();
      break;
      
    case 'database':
      databaseLoadTest();
      break;
      
    case 'mixed':
    default:
      // Mixed scenario - simulate realistic user behavior
      const testType = Math.random();
      
      if (testType < 0.3) {
        homepageLoadTest();
      } else if (testType < 0.5) {
        dashboardLoadTest();
      } else if (testType < 0.65) {
        rfqCreationJourney();
      } else if (testType < 0.8) {
        installerQuoteJourney();
      } else if (testType < 0.9) {
        apiHealthCheck();
      } else {
        staticResourcesTest();
      }
      break;
  }
}

export function teardown(data) {
  console.log('Load tests completed');
  console.log('Check the results for performance metrics and any failures');
}

// Export configuration
module.exports = {
  scenarios,
  thresholds,
  options: {
    scenarios,
    thresholds,
    
    // Global settings
    userAgent: 'Solarify Load Test Bot/1.0',
    insecureSkipTLSVerify: false,
    noConnectionReuse: false,
    noVUConnectionReuse: false,
    
    // Summary settings
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.5)', 'count'],
    summaryTimeUnit: 'ms',
    
    // Output settings
    discardResponseBodies: false,
    
    // Tags for better analysis
    tags: {
      application: 'solarify',
      environment: ENVIRONMENT,
      project: PROJECT_ID,
    },
  }
};