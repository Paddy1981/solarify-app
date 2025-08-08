/**
 * Data Pipeline Jobs API
 * GET /api/analytics/data-pipeline/jobs - List pipeline jobs
 * POST /api/analytics/data-pipeline/jobs - Create new pipeline job
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { dataPipelineOrchestrator, PipelineJob, PipelineType, JobPriority } from '../../../../lib/analytics/pipeline/data-pipeline-orchestrator';
import { errorTracker } from '../../../../lib/monitoring/error-tracker';

interface CreateJobRequest {
  name: string;
  type: PipelineType;
  priority?: JobPriority;
  schedule: {
    type: 'once' | 'interval' | 'cron';
    interval?: number;
    cron?: string;
    enabled: boolean;
  };
  config: {
    source: any;
    target: any;
    transformations?: any[];
    validation?: any;
    errorHandling?: any;
    monitoring?: any;
  };
  dependencies?: string[];
  maxRetries?: number;
}

interface ListJobsQuery {
  status?: string;
  type?: PipelineType;
  limit?: number;
  offset?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    pagination?: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const startTime = Date.now();
  const requestId = `job_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (req.method === 'GET') {
      return await handleListJobs(req, res, requestId, startTime);
    } else if (req.method === 'POST') {
      return await handleCreateJob(req, res, requestId, startTime);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      requestId,
      method: req.method,
      query: req.query,
      body: req.body
    });

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    });
  }
}

/**
 * Handle GET request - List pipeline jobs
 */
async function handleListJobs(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requestId: string,
  startTime: number
) {
  const {
    status,
    type,
    limit = 50,
    offset = 0
  } = req.query as Partial<ListJobsQuery>;

  // Parse numeric parameters
  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // Track API usage
  errorTracker.addBreadcrumb('Pipeline Jobs API - List', 'api', {
    status,
    type,
    limit: limitNum,
    offset: offsetNum,
    requestId
  });

  // Mock pipeline jobs for demonstration
  const mockJobs = [
    {
      id: 'job_daily_ingestion',
      name: 'Daily Solar Data Ingestion',
      type: 'data_ingestion',
      status: 'completed',
      priority: 'high',
      schedule: {
        type: 'interval',
        interval: 1440, // 24 hours
        enabled: true
      },
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000), // in 22 hours
      duration: 45000, // 45 seconds
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'job_hourly_processing',
      name: 'Hourly Data Processing',
      type: 'data_processing',
      status: 'running',
      priority: 'medium',
      schedule: {
        type: 'interval',
        interval: 60, // 1 hour
        enabled: true
      },
      lastRun: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      nextRun: new Date(Date.now() + 50 * 60 * 1000), // in 50 minutes
      duration: 120000, // 2 minutes
      retryCount: 0,
      maxRetries: 2,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 'job_weekly_analytics',
      name: 'Weekly Analytics Computation',
      type: 'analytics_computation',
      status: 'scheduled',
      priority: 'medium',
      schedule: {
        type: 'cron',
        cron: '0 2 * * 1', // Every Monday at 2 AM
        enabled: true
      },
      lastRun: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      duration: 300000, // 5 minutes
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'job_monthly_reports',
      name: 'Monthly Report Generation',
      type: 'report_generation',
      status: 'pending',
      priority: 'low',
      schedule: {
        type: 'cron',
        cron: '0 3 1 * *', // First day of month at 3 AM
        enabled: true
      },
      lastRun: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
      nextRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday (overdue)
      duration: 600000, // 10 minutes
      retryCount: 1,
      maxRetries: 3,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'job_data_quality_check',
      name: 'Data Quality Validation',
      type: 'data_quality_check',
      status: 'failed',
      priority: 'high',
      schedule: {
        type: 'interval',
        interval: 240, // 4 hours
        enabled: true
      },
      lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      nextRun: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // in 3.5 hours
      duration: 30000, // 30 seconds
      retryCount: 2,
      maxRetries: 3,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000)
    }
  ];

  // Filter jobs
  let filteredJobs = mockJobs;
  if (status) {
    filteredJobs = filteredJobs.filter(job => job.status === status);
  }
  if (type) {
    filteredJobs = filteredJobs.filter(job => job.type === type);
  }

  // Apply pagination
  const paginatedJobs = filteredJobs.slice(offsetNum, offsetNum + limitNum);

  // Get pipeline statistics
  const stats = {
    totalJobs: mockJobs.length,
    runningJobs: mockJobs.filter(j => j.status === 'running').length,
    completedJobs: mockJobs.filter(j => j.status === 'completed').length,
    failedJobs: mockJobs.filter(j => j.status === 'failed').length,
    scheduledJobs: mockJobs.filter(j => j.status === 'scheduled').length,
    pendingJobs: mockJobs.filter(j => j.status === 'pending').length
  };

  const processingTime = Date.now() - startTime;

  return res.status(200).json({
    success: true,
    data: {
      jobs: paginatedJobs,
      statistics: stats,
      availableTypes: [
        'data_ingestion',
        'data_processing',
        'data_transformation',
        'data_aggregation',
        'analytics_computation',
        'report_generation',
        'data_quality_check',
        'data_archival',
        'system_maintenance'
      ],
      availableStatuses: [
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled',
        'retrying',
        'scheduled'
      ]
    },
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: filteredJobs.length
      }
    }
  });
}

/**
 * Handle POST request - Create new pipeline job
 */
async function handleCreateJob(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requestId: string,
  startTime: number
) {
  const {
    name,
    type,
    priority = 'medium',
    schedule,
    config,
    dependencies = [],
    maxRetries = 3
  } = req.body as CreateJobRequest;

  // Validate required fields
  if (!name || !type || !schedule || !config) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, type, schedule, config',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate pipeline type
  const validTypes: PipelineType[] = [
    'data_ingestion',
    'data_processing',
    'data_transformation',
    'data_aggregation',
    'analytics_computation',
    'report_generation',
    'data_quality_check',
    'data_archival',
    'system_maintenance'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid pipeline type. Must be one of: ${validTypes.join(', ')}`,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate priority
  const validPriorities: JobPriority[] = ['low', 'medium', 'high', 'critical'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate schedule
  if (!['once', 'interval', 'cron'].includes(schedule.type)) {
    return res.status(400).json({
      success: false,
      error: 'Schedule type must be one of: once, interval, cron',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  if (schedule.type === 'interval' && (!schedule.interval || schedule.interval < 1)) {
    return res.status(400).json({
      success: false,
      error: 'Interval schedule requires valid interval in minutes',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  if (schedule.type === 'cron' && !schedule.cron) {
    return res.status(400).json({
      success: false,
      error: 'Cron schedule requires cron expression',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate config structure
  if (!config.source || !config.target) {
    return res.status(400).json({
      success: false,
      error: 'Config must include source and target configurations',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Track API usage
  errorTracker.addBreadcrumb('Pipeline Jobs API - Create', 'api', {
    name,
    type,
    priority,
    requestId
  });

  try {
    // For demonstration, create a mock job instead of using the actual orchestrator
    const mockJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newJob = {
      id: mockJobId,
      name,
      type,
      status: 'scheduled' as const,
      priority,
      schedule: {
        ...schedule,
        timezone: 'UTC'
      },
      config: {
        source: config.source,
        target: config.target,
        transformations: config.transformations || [],
        validation: config.validation || { enabled: false, rules: [], onFailure: 'warn' },
        errorHandling: config.errorHandling || {
          retryPolicy: { maxRetries, backoffStrategy: 'exponential', baseDelay: 60000, maxDelay: 600000 },
          deadLetterQueue: false,
          alerting: { enabled: false, channels: [], thresholds: [] }
        },
        monitoring: config.monitoring || { metrics: [], sampling: 0.1, logging: { level: 'info', retention: 30, structured: true } }
      },
      dependencies,
      retryCount: 0,
      maxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
      nextRun: schedule.type === 'once' ? new Date() : 
                schedule.type === 'interval' ? new Date(Date.now() + schedule.interval! * 60 * 1000) :
                new Date(Date.now() + 60 * 60 * 1000) // Default 1 hour for cron
    };

    // In a real implementation, this would call:
    // const jobId = await dataPipelineOrchestrator.createJob(newJob);

    const processingTime = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      data: {
        jobId: mockJobId,
        job: newJob,
        message: 'Pipeline job created successfully'
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    });

  } catch (error) {
    console.error('Job creation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Job creation failed';

    return res.status(500).json({
      success: false,
      error: errorMessage,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }
}