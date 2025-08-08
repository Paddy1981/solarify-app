/**
 * Business Intelligence Reports API
 * GET /api/analytics/business-intelligence/reports - List available reports
 * POST /api/analytics/business-intelligence/reports - Generate new report
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { solarBIEngine, ReportType, ReportPeriod, ReportFilters } from '../../../../lib/analytics/business-intelligence/solar-bi-engine';
import { errorTracker } from '../../../../lib/monitoring/error-tracker';

interface CreateReportRequest {
  type: ReportType;
  period?: ReportPeriod;
  filters?: Partial<ReportFilters>;
  name?: string;
  description?: string;
}

interface ListReportsQuery {
  type?: ReportType;
  category?: string;
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
  const requestId = `bi_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    if (req.method === 'GET') {
      return await handleListReports(req, res, requestId, startTime);
    } else if (req.method === 'POST') {
      return await handleCreateReport(req, res, requestId, startTime);
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
 * Handle GET request - List available reports
 */
async function handleListReports(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requestId: string,
  startTime: number
) {
  const {
    type,
    category,
    limit = 50,
    offset = 0
  } = req.query as Partial<ListReportsQuery>;

  // Parse numeric parameters
  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // Track API usage
  errorTracker.addBreadcrumb('BI Reports API - List', 'api', {
    type,
    category,
    limit: limitNum,
    offset: offsetNum,
    requestId
  });

  // Mock report templates/history for demonstration
  const availableReports = [
    {
      id: 'perf_summary_monthly',
      type: 'performance_summary',
      category: 'operational',
      name: 'Monthly Performance Summary',
      description: 'Comprehensive monthly analysis of solar system performance',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      period: 'monthly'
    },
    {
      id: 'financial_quarterly',
      type: 'financial_analysis',
      category: 'financial',
      name: 'Quarterly Financial Analysis',
      description: 'Revenue, costs, and ROI analysis for Q3 2024',
      lastGenerated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'completed',
      period: 'quarterly'
    },
    {
      id: 'market_analysis_yearly',
      type: 'market_analysis',
      category: 'strategic',
      name: 'Annual Market Analysis',
      description: 'Market trends, competitive analysis, and growth opportunities',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed',
      period: 'yearly'
    },
    {
      id: 'installer_perf_monthly',
      type: 'installer_performance',
      category: 'operational',
      name: 'Monthly Installer Performance',
      description: 'Performance metrics and rankings for solar installers',
      lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
      period: 'monthly'
    },
    {
      id: 'customer_insights_quarterly',
      type: 'customer_insights',
      category: 'marketing',
      name: 'Quarterly Customer Insights',
      description: 'Customer segmentation, preferences, and satisfaction analysis',
      lastGenerated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'completed',
      period: 'quarterly'
    }
  ];

  // Filter reports if type specified
  let filteredReports = availableReports;
  if (type) {
    filteredReports = filteredReports.filter(report => report.type === type);
  }
  if (category) {
    filteredReports = filteredReports.filter(report => report.category === category);
  }

  // Apply pagination
  const paginatedReports = filteredReports.slice(offsetNum, offsetNum + limitNum);

  const processingTime = Date.now() - startTime;

  return res.status(200).json({
    success: true,
    data: {
      reports: paginatedReports,
      availableTypes: [
        'performance_summary',
        'financial_analysis',
        'market_analysis',
        'installer_performance',
        'customer_insights',
        'system_comparison',
        'roi_analysis',
        'maintenance_report',
        'environmental_impact'
      ],
      availableCategories: [
        'operational',
        'financial',
        'strategic',
        'compliance',
        'marketing'
      ]
    },
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: filteredReports.length
      }
    }
  });
}

/**
 * Handle POST request - Generate new report
 */
async function handleCreateReport(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requestId: string,
  startTime: number
) {
  const {
    type,
    period = 'month',
    filters = {},
    name,
    description
  } = req.body as CreateReportRequest;

  // Validate required fields
  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'Report type is required',
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate report type
  const validTypes: ReportType[] = [
    'performance_summary',
    'financial_analysis',
    'market_analysis',
    'installer_performance',
    'customer_insights',
    'system_comparison',
    'roi_analysis',
    'maintenance_report',
    'environmental_impact'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Validate period
  const validPeriods: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  }

  // Track API usage
  errorTracker.addBreadcrumb('BI Reports API - Create', 'api', {
    type,
    period,
    filters,
    requestId
  });

  try {
    // Generate the report
    const report = await solarBIEngine.generateReport(type, period, filters);

    // If custom name/description provided, use them
    if (name) report.title = name;
    if (description) report.description = description;

    const processingTime = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      data: {
        reportId: report.id,
        report: {
          id: report.id,
          title: report.title,
          description: report.description,
          type: report.type,
          category: report.category,
          period: report.period,
          generatedAt: report.generatedAt,
          summary: report.data.summary,
          insights: report.data.insights,
          kpis: report.data.kpis,
          metadata: report.metadata
        },
        downloadUrl: `/api/analytics/business-intelligence/reports/${report.id}/download`,
        status: 'completed'
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    });

  } catch (error) {
    console.error('Report generation failed:', error);

    // Return specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Report generation failed';

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