#!/usr/bin/env node

// =============================================================================
// Unified Monitoring Dashboard for Firebase & Google Cloud
// =============================================================================
// Single dashboard monitoring both Firebase and Google Cloud services
// Demonstrates unified observability across the entire platform
// =============================================================================

const { google } = require('googleapis');
const admin = require('firebase-admin');
const express = require('express');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: process.env.PROJECT_ID || 'solarify-staging',
  environment: process.env.ENVIRONMENT || 'staging',
  port: process.env.PORT || 3001,
  refreshInterval: parseInt(process.env.REFRESH_INTERVAL) || 30000, // 30 seconds
  
  // Monitoring thresholds
  thresholds: {
    responseTime: 2000,      // 2 seconds
    errorRate: 0.05,         // 5%
    cpuUtilization: 80,      // 80%
    memoryUtilization: 85,   // 85%
    diskUtilization: 90,     // 90%
    firestoreReads: 100000,  // 100k reads per hour
    firestoreWrites: 50000,  // 50k writes per hour
  }
};

// Monitoring data store
const monitoringData = {
  lastUpdated: null,
  firebase: {
    hosting: { status: 'unknown', responseTime: 0, requests: 0 },
    firestore: { reads: 0, writes: 0, connections: 0 },
    auth: { signUps: 0, signIns: 0, activeUsers: 0 },
    functions: { executions: 0, errors: 0, duration: 0 },
    storage: { uploads: 0, downloads: 0, storage: 0 }
  },
  googleCloud: {
    cloudRun: { instances: 0, requests: 0, errors: 0 },
    compute: { instances: [], cpu: 0, memory: 0 },
    loadBalancer: { requests: 0, latency: 0 },
    monitoring: { uptime: 100, alerts: 0 }
  },
  alerts: [],
  performance: {
    availability: 100,
    responseTime: 0,
    errorRate: 0,
    throughput: 0
  }
};

// Initialize Google Cloud APIs
let monitoring, compute, cloudRun;

// Initialize Firebase Admin SDK
function initializeFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: CONFIG.projectId
    });
  }
}

// Initialize Google Cloud APIs
async function initializeGoogleCloud() {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/monitoring.read',
        'https://www.googleapis.com/auth/compute.readonly'
      ]
    });

    const authClient = await auth.getClient();
    
    monitoring = google.monitoring({ version: 'v3', auth: authClient });
    compute = google.compute({ version: 'v1', auth: authClient });
    cloudRun = google.run({ version: 'v1', auth: authClient });
    
    console.log('✅ Google Cloud APIs initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Google Cloud APIs:', error.message);
  }
}

// Firebase Monitoring Functions
async function monitorFirebaseHosting() {
  try {
    const appUrl = `https://${CONFIG.projectId}.web.app`;
    const startTime = Date.now();
    
    const response = await fetch(appUrl, { method: 'HEAD' });
    const responseTime = Date.now() - startTime;
    
    monitoringData.firebase.hosting = {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: responseTime,
      statusCode: response.status,
      lastChecked: new Date().toISOString()
    };
    
    // Update performance metrics
    monitoringData.performance.responseTime = responseTime;
    monitoringData.performance.availability = response.ok ? 100 : 0;
    
  } catch (error) {
    monitoringData.firebase.hosting = {
      status: 'error',
      responseTime: 0,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
    
    addAlert('high', 'Firebase Hosting Error', error.message);
  }
}

async function monitorFirestore() {
  try {
    const firestore = admin.firestore();
    
    // Test basic connectivity
    const testCollection = firestore.collection('health_check');
    const testDoc = testCollection.doc('monitoring_test');
    
    const startTime = Date.now();
    await testDoc.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
    const writeTime = Date.now() - startTime;
    
    const readStartTime = Date.now();
    await testDoc.get();
    const readTime = Date.now() - readStartTime;
    
    // Clean up test document
    await testDoc.delete();
    
    monitoringData.firebase.firestore = {
      status: 'healthy',
      writeLatency: writeTime,
      readLatency: readTime,
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    monitoringData.firebase.firestore = {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
    
    addAlert('critical', 'Firestore Error', error.message);
  }
}

async function monitorFirebaseAuth() {
  try {
    const auth = admin.auth();
    
    // Get user count (limited sample for performance)
    const listUsers = await auth.listUsers(1000);
    const userCount = listUsers.users.length;
    
    monitoringData.firebase.auth = {
      status: 'healthy',
      totalUsers: userCount,
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    monitoringData.firebase.auth = {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
    
    addAlert('high', 'Firebase Auth Error', error.message);
  }
}

// Google Cloud Monitoring Functions
async function monitorCloudRun() {
  if (!cloudRun) return;
  
  try {
    const location = `projects/${CONFIG.projectId}/locations/us-central1`;
    const response = await cloudRun.projects.locations.services.list({
      parent: location
    });
    
    const services = response.data.items || [];
    
    monitoringData.googleCloud.cloudRun = {
      status: 'healthy',
      serviceCount: services.length,
      services: services.map(service => ({
        name: service.metadata.name,
        status: service.status?.conditions?.[0]?.type || 'unknown',
        url: service.status?.url
      })),
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    monitoringData.googleCloud.cloudRun = {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
    
    addAlert('high', 'Cloud Run Error', error.message);
  }
}

async function monitorComputeEngine() {
  if (!compute) return;
  
  try {
    const response = await compute.instances.aggregatedList({
      project: CONFIG.projectId
    });
    
    let totalInstances = 0;
    const instances = [];
    
    if (response.data.items) {
      Object.values(response.data.items).forEach(zoneData => {
        if (zoneData.instances) {
          totalInstances += zoneData.instances.length;
          instances.push(...zoneData.instances.map(instance => ({
            name: instance.name,
            status: instance.status,
            zone: instance.zone?.split('/').pop(),
            machineType: instance.machineType?.split('/').pop()
          })));
        }
      });
    }
    
    monitoringData.googleCloud.compute = {
      status: 'healthy',
      totalInstances: totalInstances,
      instances: instances,
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    monitoringData.googleCloud.compute = {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
    
    addAlert('medium', 'Compute Engine Error', error.message);
  }
}

async function monitorCloudMonitoring() {
  if (!monitoring) return;
  
  try {
    // Get uptime check results
    const uptimeChecks = await monitoring.projects.uptimeCheckConfigs.list({
      parent: `projects/${CONFIG.projectId}`
    });
    
    // Get alert policies
    const alertPolicies = await monitoring.projects.alertPolicies.list({
      name: `projects/${CONFIG.projectId}`
    });
    
    monitoringData.googleCloud.monitoring = {
      status: 'healthy',
      uptimeChecks: uptimeChecks.data.uptimeCheckConfigs?.length || 0,
      alertPolicies: alertPolicies.data.alertPolicies?.length || 0,
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    monitoringData.googleCloud.monitoring = {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

// Alert Management
function addAlert(severity, title, message) {
  const alert = {
    id: Date.now(),
    severity: severity, // 'low', 'medium', 'high', 'critical'
    title: title,
    message: message,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };
  
  monitoringData.alerts.unshift(alert);
  
  // Keep only last 100 alerts
  if (monitoringData.alerts.length > 100) {
    monitoringData.alerts = monitoringData.alerts.slice(0, 100);
  }
  
  console.log(`🚨 Alert [${severity.toUpperCase()}]: ${title} - ${message}`);
}

function checkThresholds() {
  const { thresholds } = CONFIG;
  const { performance, firebase } = monitoringData;
  
  // Response time threshold
  if (performance.responseTime > thresholds.responseTime) {
    addAlert('high', 'High Response Time', 
      `Response time ${performance.responseTime}ms exceeds threshold ${thresholds.responseTime}ms`);
  }
  
  // Error rate threshold
  if (performance.errorRate > thresholds.errorRate) {
    addAlert('high', 'High Error Rate', 
      `Error rate ${(performance.errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.errorRate * 100)}%`);
  }
  
  // Check service health
  Object.entries(firebase).forEach(([service, data]) => {
    if (data.status === 'error') {
      addAlert('critical', `${service} Service Down`, data.error || 'Service is not responding');
    } else if (data.status === 'unhealthy') {
      addAlert('high', `${service} Service Unhealthy`, 'Service is experiencing issues');
    }
  });
}

// Main monitoring loop
async function runMonitoringCycle() {
  console.log('🔄 Starting monitoring cycle...');
  
  try {
    // Monitor Firebase services
    await Promise.allSettled([
      monitorFirebaseHosting(),
      monitorFirestore(),
      monitorFirebaseAuth()
    ]);
    
    // Monitor Google Cloud services
    await Promise.allSettled([
      monitorCloudRun(),
      monitorComputeEngine(),
      monitorCloudMonitoring()
    ]);
    
    // Check thresholds and generate alerts
    checkThresholds();
    
    // Update last updated timestamp
    monitoringData.lastUpdated = new Date().toISOString();
    
    console.log('✅ Monitoring cycle completed');
    
  } catch (error) {
    console.error('❌ Error in monitoring cycle:', error);
    addAlert('critical', 'Monitoring System Error', error.message);
  }
}

// Express server for dashboard
function startDashboard() {
  const app = express();
  
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  
  // API endpoint to get monitoring data
  app.get('/api/monitoring', (req, res) => {
    res.json(monitoringData);
  });
  
  // API endpoint to acknowledge alerts
  app.post('/api/alerts/:id/acknowledge', (req, res) => {
    const alertId = parseInt(req.params.id);
    const alert = monitoringData.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Dashboard HTML
  app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solarify Unified Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h3 { margin-bottom: 15px; color: #555; }
        .status { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.unhealthy { background: #f8d7da; color: #721c24; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.unknown { background: #d1ecf1; color: #0c5460; }
        .metric { 
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .alerts { margin-top: 20px; }
        .alert { 
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }
        .alert.critical { background: #f8d7da; border-color: #dc3545; }
        .alert.high { background: #fff3cd; border-color: #ffc107; }
        .alert.medium { background: #d1ecf1; border-color: #17a2b8; }
        .alert.low { background: #d4edda; border-color: #28a745; }
        .refresh-info { 
            text-align: center;
            color: #666;
            margin: 20px 0;
            font-size: 14px;
        }
        #lastUpdated { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Solarify Unified Monitoring Dashboard</h1>
        <p>Firebase & Google Cloud Platform - Single Unified View</p>
        <p>Environment: ${CONFIG.environment} | Project: ${CONFIG.projectId}</p>
    </div>
    
    <div class="container">
        <div class="refresh-info">
            Last Updated: <span id="lastUpdated">Loading...</span> | 
            Auto-refresh every ${CONFIG.refreshInterval / 1000} seconds
        </div>
        
        <div class="grid" id="dashboard">
            <div class="card">
                <h3>🔥 Firebase Services</h3>
                <div id="firebase-services">Loading...</div>
            </div>
            
            <div class="card">
                <h3>☁️ Google Cloud Services</h3>
                <div id="gcp-services">Loading...</div>
            </div>
            
            <div class="card">
                <h3>📊 Performance Metrics</h3>
                <div id="performance-metrics">Loading...</div>
            </div>
            
            <div class="card">
                <h3>🚨 Active Alerts</h3>
                <div id="alerts">Loading...</div>
            </div>
        </div>
    </div>

    <script>
        async function fetchData() {
            try {
                const response = await fetch('/api/monitoring');
                const data = await response.json();
                updateDashboard(data);
            } catch (error) {
                console.error('Failed to fetch monitoring data:', error);
            }
        }
        
        function updateDashboard(data) {
            document.getElementById('lastUpdated').textContent = 
                data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Never';
            
            // Update Firebase services
            const firebaseHtml = Object.entries(data.firebase).map(([service, info]) => 
                \`<div class="metric">
                    <span>\${service.charAt(0).toUpperCase() + service.slice(1)}</span>
                    <span class="status \${info.status || 'unknown'}">\${info.status || 'unknown'}</span>
                </div>\`
            ).join('');
            document.getElementById('firebase-services').innerHTML = firebaseHtml;
            
            // Update Google Cloud services
            const gcpHtml = Object.entries(data.googleCloud).map(([service, info]) => 
                \`<div class="metric">
                    <span>\${service.charAt(0).toUpperCase() + service.slice(1)}</span>
                    <span class="status \${info.status || 'unknown'}">\${info.status || 'unknown'}</span>
                </div>\`
            ).join('');
            document.getElementById('gcp-services').innerHTML = gcpHtml;
            
            // Update performance metrics
            const perfHtml = \`
                <div class="metric">
                    <span>Availability</span>
                    <span>\${data.performance.availability.toFixed(2)}%</span>
                </div>
                <div class="metric">
                    <span>Response Time</span>
                    <span>\${data.performance.responseTime}ms</span>
                </div>
                <div class="metric">
                    <span>Error Rate</span>
                    <span>\${(data.performance.errorRate * 100).toFixed(2)}%</span>
                </div>
            \`;
            document.getElementById('performance-metrics').innerHTML = perfHtml;
            
            // Update alerts
            const alertsHtml = data.alerts.length ? 
                data.alerts.slice(0, 10).map(alert => 
                    \`<div class="alert \${alert.severity}">
                        <strong>\${alert.title}</strong><br>
                        \${alert.message}<br>
                        <small>\${new Date(alert.timestamp).toLocaleString()}</small>
                    </div>\`
                ).join('') : 
                '<div class="alert low">No active alerts</div>';
            document.getElementById('alerts').innerHTML = alertsHtml;
        }
        
        // Initial load
        fetchData();
        
        // Auto-refresh
        setInterval(fetchData, ${CONFIG.refreshInterval});
    </script>
</body>
</html>
    `);
  });
  
  app.listen(CONFIG.port, () => {
    console.log(`🚀 Unified monitoring dashboard running on http://localhost:${CONFIG.port}`);
    console.log(`📊 Monitoring project: ${CONFIG.projectId} (${CONFIG.environment})`);
    console.log(`🔄 Refresh interval: ${CONFIG.refreshInterval / 1000}s`);
  });
}

// Main function
async function main() {
  console.log('🚀 Starting Solarify Unified Monitoring Dashboard');
  console.log(`📊 Project: ${CONFIG.projectId}`);
  console.log(`🌍 Environment: ${CONFIG.environment}`);
  
  // Initialize services
  initializeFirebase();
  await initializeGoogleCloud();
  
  // Start monitoring
  await runMonitoringCycle();
  setInterval(runMonitoringCycle, CONFIG.refreshInterval);
  
  // Start dashboard server
  startDashboard();
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  addAlert('critical', 'Monitoring System Error', 'Unhandled rejection in monitoring system');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  addAlert('critical', 'Monitoring System Error', 'Uncaught exception in monitoring system');
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start monitoring dashboard:', error);
    process.exit(1);
  });
}

module.exports = { main, CONFIG };