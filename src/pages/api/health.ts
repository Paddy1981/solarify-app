import { NextApiRequest, NextApiResponse } from 'next';
import { healthChecker } from '../../lib/monitoring/health-checker';

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    auth: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
  };
  performance: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
  detailed?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const startTime = Date.now();
  
  try {
    // Use the comprehensive health checker
    const systemHealth = await healthChecker.runAllChecks();
    const responseTime = Date.now() - startTime;

    // Basic health checks for backward compatibility
    const checks = {
      database: await checkDatabase(),
      auth: await checkAuth(),
      storage: await checkStorage()
    };

    const healthResponse: HealthResponse = {
      status: systemHealth.overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      performance: {
        responseTime,
        memoryUsage: process.memoryUsage()
      },
      detailed: systemHealth
    };

    // Return appropriate status code
    const statusCode = systemHealth.overall === 'healthy' ? 200 : 
                      systemHealth.overall === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthResponse);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: 'unhealthy',
        auth: 'unhealthy',
        storage: 'unhealthy'
      },
      performance: {
        responseTime,
        memoryUsage: process.memoryUsage()
      }
    });
  }
}

async function checkDatabase(): Promise<'healthy' | 'unhealthy'> {
  try {
    // In a real implementation, this would check Firestore connectivity
    // For now, we'll simulate a basic check
    return 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'unhealthy';
  }
}

async function checkAuth(): Promise<'healthy' | 'unhealthy'> {
  try {
    // In a real implementation, this would check Firebase Auth
    return 'healthy';
  } catch (error) {
    console.error('Auth health check failed:', error);
    return 'unhealthy';
  }
}

async function checkStorage(): Promise<'healthy' | 'unhealthy'> {
  try {
    // In a real implementation, this would check Firebase Storage
    return 'healthy';
  } catch (error) {
    console.error('Storage health check failed:', error);
    return 'unhealthy';
  }
}