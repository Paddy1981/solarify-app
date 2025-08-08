/**
 * Report Generation API
 * Provides report generation and management endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { reportingAnalyticsSystem } from '../../../../lib/monitoring/reporting-analytics-system';
import { errorTracker } from '../../../../lib/monitoring/error-tracker';

interface ReportGenerationRequest extends NextApiRequest {
  body: {
    systemId: string;
    reportType: 'performance_summary' | 'energy_production' | 'financial_analysis' | 'environmental_impact' | 
               'maintenance_summary' | 'system_health' | 'comparative_analysis' | 'forecasting_report' | 
               'compliance_report' | 'custom_report';
    customization?: {
      dateRange?: {
        type: 'fixed' | 'rolling';
        start?: string;
        end?: string;
        rollingPeriod?: number;
      };
      includeSections?: string[];
      excludeSections?: string[];
      format?: 'pdf' | 'excel' | 'csv' | 'json';
      template?: string;
      branding?: {
        logo?: string;
        primaryColor?: string;
        headerText?: string;
        footerText?: string;
      };
    };
    delivery?: {
      method: 'download' | 'email';
      email?: string;
      schedule?: {
        frequency: 'once' | 'daily' | 'weekly' | 'monthly';
        startDate?: string;
      };
    };
  };
}

interface ReportListRequest extends NextApiRequest {
  query: {
    systemId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        return handleGenerateReport(req as ReportGenerationRequest, res);
      case 'GET':
        return handleListReports(req as ReportListRequest, res);
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    errorTracker.captureException(error as Error, {
      method: req.method,
      endpoint: 'reports/generate'
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function handleGenerateReport(
  req: ReportGenerationRequest,
  res: NextApiResponse
) {
  const { systemId, reportType, customization, delivery } = req.body;

  // Validate required fields
  if (!systemId) {
    return res.status(400).json({
      error: 'Missing required field: systemId',
      code: 'MISSING_SYSTEM_ID'
    });
  }

  if (!reportType) {
    return res.status(400).json({
      error: 'Missing required field: reportType',
      code: 'MISSING_REPORT_TYPE'
    });
  }

  // Validate report type
  const validReportTypes = [
    'performance_summary',
    'energy_production',
    'financial_analysis',
    'environmental_impact',
    'maintenance_summary',
    'system_health',
    'comparative_analysis',
    'forecasting_report',
    'compliance_report',
    'custom_report'
  ];

  if (!validReportTypes.includes(reportType)) {
    return res.status(400).json({
      error: 'Invalid report type',
      code: 'INVALID_REPORT_TYPE',
      validValues: validReportTypes
    });
  }

  // Validate date range if provided
  if (customization?.dateRange) {
    const { type, start, end, rollingPeriod } = customization.dateRange;
    
    if (type === 'fixed') {
      if (!start || !end) {
        return res.status(400).json({
          error: 'Fixed date range requires start and end dates',
          code: 'MISSING_DATE_RANGE'
        });
      }
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format in date range',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
      }
    } else if (type === 'rolling') {
      if (!rollingPeriod || rollingPeriod <= 0) {
        return res.status(400).json({
          error: 'Rolling date range requires a positive rollingPeriod',
          code: 'INVALID_ROLLING_PERIOD'
        });
      }
    }
  }

  // Validate delivery options
  if (delivery?.method === 'email' && !delivery.email) {
    return res.status(400).json({
      error: 'Email delivery requires email address',
      code: 'MISSING_EMAIL'
    });
  }

  try {
    // Generate report
    const report = await reportingAnalyticsSystem.generateReport(
      systemId,
      reportType,
      customization
    );

    // Handle delivery if specified
    if (delivery) {
      switch (delivery.method) {
        case 'email':
          // Schedule email delivery (implementation would depend on email service)
          break;
        case 'download':
          // Set up download link (default behavior)
          break;
      }
    }

    return res.status(202).json({ // 202 Accepted for async processing
      success: true,
      message: 'Report generation initiated',
      data: {
        reportId: report.id,
        systemId: report.systemId,
        type: report.type,
        title: report.title,
        status: report.status,
        generatedAt: report.generatedAt.toISOString(),
        estimatedCompletionTime: '2-5 minutes',
        downloadUrl: report.downloadUrl // Will be populated when ready
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Report generation failed',
      code: 'GENERATION_FAILED',
      details: (error as Error).message
    });
  }
}

async function handleListReports(
  req: ReportListRequest,
  res: NextApiResponse
) {
  const {
    systemId,
    type,
    status,
    startDate,
    endDate,
    limit = '50'
  } = req.query;

  // Parse and validate filters
  const filters: any = {};

  if (type) {
    const reportTypes = type.split(',').map(t => t.trim());
    const validTypes = [
      'performance_summary',
      'energy_production',
      'financial_analysis',
      'environmental_impact',
      'maintenance_summary',
      'system_health',
      'comparative_analysis',
      'forecasting_report',
      'compliance_report',
      'custom_report'
    ];
    
    if (!reportTypes.every(t => validTypes.includes(t))) {
      return res.status(400).json({
        error: 'Invalid report type in filter',
        code: 'INVALID_REPORT_TYPE',
        validValues: validTypes
      });
    }
    
    filters.type = reportTypes as any;
  }

  if (status) {
    const statusValues = status.split(',').map(s => s.trim());
    const validStatuses = ['generating', 'completed', 'failed', 'expired', 'archived'];
    
    if (!statusValues.every(s => validStatuses.includes(s))) {
      return res.status(400).json({
        error: 'Invalid status value in filter',
        code: 'INVALID_STATUS',
        validValues: validStatuses
      });
    }
    
    filters.status = statusValues as any;
  }

  if (startDate) {
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: 'Invalid startDate format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    filters.startDate = date;
  }

  if (endDate) {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: 'Invalid endDate format',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    filters.endDate = date;
  }

  const limitValue = Math.min(parseInt(limit) || 50, 200); // Max 200 reports
  filters.limit = limitValue;

  try {
    let reports: any[] = [];

    if (systemId) {
      // Get reports for specific system
      reports = reportingAnalyticsSystem.getSystemReports(systemId, filters);
    } else {
      // Get reports across all systems (would need different method in production)
      // For now, return empty array if no systemId specified
      reports = [];
    }

    // Set cache headers (5 minutes for report lists)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');

    return res.status(200).json({
      data: reports,
      filters: {
        systemId,
        type,
        status,
        startDate,
        endDate,
        limit: limitValue
      },
      metadata: {
        total: reports.length,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve reports',
      code: 'RETRIEVAL_FAILED',
      details: (error as Error).message
    });
  }
}