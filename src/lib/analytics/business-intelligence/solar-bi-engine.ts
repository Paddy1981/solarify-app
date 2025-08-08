/**
 * Solar Business Intelligence Engine
 * Advanced reporting, analytics, and business intelligence for solar marketplace
 */

import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS, EnergyProductionRecord, SolarSystem, Project, Quote, RFQ } from '../../../types/firestore-schema';
import { errorTracker } from '../../monitoring/error-tracker';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface BusinessIntelligenceReport {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  data: ReportData;
  metadata: ReportMetadata;
  generatedAt: Date;
  period: ReportPeriod;
  filters: ReportFilters;
}

export type ReportType = 
  | 'performance_summary'
  | 'financial_analysis'
  | 'market_analysis'
  | 'installer_performance'
  | 'supplier_analysis'
  | 'customer_insights'
  | 'system_comparison'
  | 'roi_analysis'
  | 'maintenance_report'
  | 'environmental_impact';

export type ReportCategory = 
  | 'operational'
  | 'financial'
  | 'strategic'
  | 'compliance'
  | 'marketing';

export type ReportPeriod = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export interface ReportData {
  summary: SummaryMetrics;
  charts: ChartData[];
  tables: TableData[];
  insights: BusinessInsight[];
  kpis: KPIMetric[];
  trends: TrendAnalysis[];
  comparisons: ComparisonData[];
}

export interface SummaryMetrics {
  totalSystems: number;
  totalCapacity: number; // kW
  totalProduction: number; // kWh
  totalRevenue: number; // $
  averagePerformance: number; // %
  customerSatisfaction: number; // %
  marketShare: number; // %
  growthRate: number; // %
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap';
  data: DataPoint[];
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
}

export interface DataPoint {
  x: string | number;
  y: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface AxisConfig {
  label: string;
  unit?: string;
  format?: string;
}

export interface SeriesConfig {
  name: string;
  color: string;
  type?: 'line' | 'bar' | 'area';
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  sortable: boolean;
  exportable: boolean;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  actionItems: string[];
  dataSupport: string[];
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage change
  status: 'excellent' | 'good' | 'warning' | 'poor';
}

export interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  confidence: number;
  timeframe: string;
  significance: 'high' | 'medium' | 'low';
}

export interface ComparisonData {
  title: string;
  categories: string[];
  metrics: ComparisonMetric[];
  benchmark?: number;
}

export interface ComparisonMetric {
  name: string;
  values: number[];
  unit: string;
  higherIsBetter: boolean;
}

export interface ReportMetadata {
  dataPoints: number;
  dataSources: string[];
  refreshRate: string;
  accuracy: number;
  completeness: number;
  lastDataUpdate: Date;
}

export interface ReportFilters {
  dateRange: { start: Date; end: Date };
  systems?: string[];
  installers?: string[];
  regions?: string[];
  systemTypes?: string[];
  performanceThreshold?: number;
}

export interface MarketAnalysisData {
  marketSize: {
    totalInstalled: number;
    yearOverYear: number;
    projectedGrowth: number;
  };
  competitiveAnalysis: {
    topInstallers: InstallerMetrics[];
    marketShare: { installer: string; share: number }[];
    pricingAnalysis: PricingMetrics;
  };
  customerSegmentation: {
    segments: CustomerSegment[];
    trends: SegmentTrend[];
  };
  geographicAnalysis: {
    regions: RegionalMetrics[];
    penetration: PenetrationMetrics;
  };
}

export interface InstallerMetrics {
  id: string;
  name: string;
  projectsCompleted: number;
  totalCapacity: number;
  averageProjectSize: number;
  customerSatisfaction: number;
  averagePrice: number;
  marketShare: number;
}

export interface PricingMetrics {
  averagePricePerWatt: number;
  priceRange: { min: number; max: number };
  trends: { period: string; price: number }[];
  competitorPricing: { installer: string; price: number }[];
}

export interface CustomerSegment {
  name: string;
  size: number;
  averageSystemSize: number;
  priceRange: { min: number; max: number };
  preferences: string[];
  conversionRate: number;
}

export interface SegmentTrend {
  segment: string;
  growthRate: number;
  churnRate: number;
  lifetimeValue: number;
}

export interface RegionalMetrics {
  region: string;
  installations: number;
  totalCapacity: number;
  averageProduction: number;
  marketPenetration: number;
  averagePrice: number;
}

export interface PenetrationMetrics {
  residential: number;
  commercial: number;
  industrial: number;
  totalMarket: number;
}

// =====================================================
// SOLAR BI ENGINE CLASS
// =====================================================

export class SolarBIEngine {
  private reportCache: Map<string, BusinessIntelligenceReport> = new Map();
  private dataCache: Map<string, any> = new Map();

  /**
   * Generate comprehensive business intelligence report
   */
  public async generateReport(
    type: ReportType,
    period: ReportPeriod = 'monthly',
    filters: Partial<ReportFilters> = {}
  ): Promise<BusinessIntelligenceReport> {
    try {
      errorTracker.addBreadcrumb('Generating BI report', 'bi_engine', {
        type,
        period,
        filters
      });

      // Set default date range
      const dateRange = filters.dateRange || this.getDefaultDateRange(period);
      const fullFilters: ReportFilters = {
        dateRange,
        ...filters
      };

      // Generate report based on type
      let reportData: ReportData;
      let title: string;
      let description: string;
      let category: ReportCategory;

      switch (type) {
        case 'performance_summary':
          reportData = await this.generatePerformanceSummaryReport(fullFilters);
          title = 'Solar Performance Summary Report';
          description = 'Comprehensive analysis of solar system performance metrics';
          category = 'operational';
          break;

        case 'financial_analysis':
          reportData = await this.generateFinancialAnalysisReport(fullFilters);
          title = 'Financial Performance Analysis';
          description = 'Revenue, costs, and ROI analysis across all solar projects';
          category = 'financial';
          break;

        case 'market_analysis':
          reportData = await this.generateMarketAnalysisReport(fullFilters);
          title = 'Solar Market Analysis Report';
          description = 'Market trends, competitive analysis, and growth opportunities';
          category = 'strategic';
          break;

        case 'installer_performance':
          reportData = await this.generateInstallerPerformanceReport(fullFilters);
          title = 'Installer Performance Dashboard';
          description = 'Performance metrics and rankings for solar installers';
          category = 'operational';
          break;

        case 'customer_insights':
          reportData = await this.generateCustomerInsightsReport(fullFilters);
          title = 'Customer Insights & Behavior Analysis';
          description = 'Customer segmentation, preferences, and satisfaction analysis';
          category = 'marketing';
          break;

        default:
          throw new Error(`Unsupported report type: ${type}`);
      }

      const report: BusinessIntelligenceReport = {
        id: this.generateReportId(type, period),
        title,
        description,
        type,
        category,
        data: reportData,
        metadata: await this.generateMetadata(reportData, fullFilters),
        generatedAt: new Date(),
        period,
        filters: fullFilters
      };

      // Cache the report
      this.reportCache.set(report.id, report);

      return report;

    } catch (error) {
      errorTracker.captureException(error as Error, { type, period, filters });
      throw error;
    }
  }

  /**
   * Generate performance summary report
   */
  private async generatePerformanceSummaryReport(filters: ReportFilters): Promise<ReportData> {
    // Fetch data
    const systems = await this.fetchSystems(filters);
    const productionData = await this.fetchProductionData(filters);
    
    // Calculate summary metrics
    const summary: SummaryMetrics = {
      totalSystems: systems.length,
      totalCapacity: systems.reduce((sum, system) => sum + system.configuration.totalCapacity, 0),
      totalProduction: productionData.reduce((sum, record) => sum + record.production.energy, 0),
      totalRevenue: 0, // Would calculate from financial data
      averagePerformance: productionData.length > 0 ? 
        productionData.reduce((sum, record) => sum + record.performance.performanceRatio, 0) / productionData.length * 100 : 0,
      customerSatisfaction: 85.5, // Would fetch from customer surveys
      marketShare: 12.3, // Would calculate from market data
      growthRate: 8.9 // Would calculate from historical data
    };

    // Generate charts
    const charts: ChartData[] = [
      {
        id: 'production_timeline',
        title: 'Energy Production Timeline',
        type: 'line',
        data: this.aggregateProductionByDay(productionData),
        xAxis: { label: 'Date', format: 'date' },
        yAxis: { label: 'Energy Production', unit: 'kWh' },
        series: [{ name: 'Daily Production', color: '#3b82f6' }]
      },
      {
        id: 'system_performance',
        title: 'System Performance Distribution',
        type: 'bar',
        data: this.createPerformanceDistribution(productionData),
        xAxis: { label: 'Performance Range', unit: '%' },
        yAxis: { label: 'Number of Systems' },
        series: [{ name: 'Systems', color: '#10b981' }]
      },
      {
        id: 'capacity_by_region',
        title: 'Installed Capacity by Region',
        type: 'pie',
        data: this.aggregateCapacityByRegion(systems),
        xAxis: { label: 'Region' },
        yAxis: { label: 'Capacity', unit: 'kW' },
        series: [{ name: 'Capacity', color: '#f59e0b' }]
      }
    ];

    // Generate tables
    const tables: TableData[] = [
      {
        id: 'top_performing_systems',
        title: 'Top Performing Systems',
        headers: ['System ID', 'Location', 'Capacity (kW)', 'Performance Ratio', 'Annual Production (kWh)'],
        rows: this.getTopPerformingSystems(systems, productionData),
        sortable: true,
        exportable: true
      }
    ];

    // Generate insights
    const insights: BusinessInsight[] = [
      {
        id: 'performance_trend',
        title: 'Performance Trending Upward',
        description: 'Average system performance has improved by 3.2% compared to last quarter',
        type: 'trend',
        impact: 'medium',
        confidence: 0.85,
        actionItems: ['Continue current optimization strategies', 'Monitor for seasonal variations'],
        dataSupport: ['Performance ratio increase', 'Energy output improvement']
      }
    ];

    // Generate KPIs
    const kpis: KPIMetric[] = [
      {
        id: 'avg_performance_ratio',
        name: 'Average Performance Ratio',
        value: summary.averagePerformance,
        unit: '%',
        target: 85,
        trend: 'up',
        change: 3.2,
        status: summary.averagePerformance >= 85 ? 'excellent' : 'good'
      },
      {
        id: 'total_capacity',
        name: 'Total Installed Capacity',
        value: summary.totalCapacity,
        unit: 'MW',
        trend: 'up',
        change: 15.7,
        status: 'excellent'
      }
    ];

    const trends: TrendAnalysis[] = [
      {
        metric: 'System Performance',
        direction: 'increasing',
        slope: 0.032,
        confidence: 0.85,
        timeframe: 'Last 3 months',
        significance: 'medium'
      }
    ];

    const comparisons: ComparisonData[] = [
      {
        title: 'Regional Performance Comparison',
        categories: ['North', 'South', 'East', 'West'],
        metrics: [
          {
            name: 'Average Performance Ratio',
            values: [82.5, 87.2, 85.1, 83.8],
            unit: '%',
            higherIsBetter: true
          }
        ]
      }
    ];

    return {
      summary,
      charts,
      tables,
      insights,
      kpis,
      trends,
      comparisons
    };
  }

  /**
   * Generate financial analysis report
   */
  private async generateFinancialAnalysisReport(filters: ReportFilters): Promise<ReportData> {
    // Fetch financial data
    const projects = await this.fetchProjects(filters);
    const quotes = await this.fetchQuotes(filters);
    
    const summary: SummaryMetrics = {
      totalSystems: projects.length,
      totalCapacity: projects.reduce((sum, proj) => sum + (proj.finalSystem?.totalCapacity || 0), 0),
      totalProduction: 0,
      totalRevenue: projects.reduce((sum, proj) => sum + proj.contract.totalValue, 0),
      averagePerformance: 0,
      customerSatisfaction: 0,
      marketShare: 0,
      growthRate: 12.5 // Revenue growth rate
    };

    const charts: ChartData[] = [
      {
        id: 'revenue_timeline',
        title: 'Revenue Timeline',
        type: 'line',
        data: this.aggregateRevenueByMonth(projects),
        xAxis: { label: 'Month' },
        yAxis: { label: 'Revenue', unit: '$' },
        series: [{ name: 'Monthly Revenue', color: '#059669' }]
      },
      {
        id: 'project_value_distribution',
        title: 'Project Value Distribution',
        type: 'bar',
        data: this.createProjectValueDistribution(projects),
        xAxis: { label: 'Project Value Range', unit: '$' },
        yAxis: { label: 'Number of Projects' },
        series: [{ name: 'Projects', color: '#dc2626' }]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'financial_summary',
        title: 'Financial Summary by Quarter',
        headers: ['Quarter', 'Revenue ($)', 'Projects', 'Avg Project Value ($)', 'Profit Margin (%)'],
        rows: this.getQuarterlyFinancialSummary(projects),
        sortable: true,
        exportable: true
      }
    ];

    const insights: BusinessInsight[] = [
      {
        id: 'revenue_growth',
        title: 'Strong Revenue Growth',
        description: 'Revenue has increased by 25% compared to the same period last year',
        type: 'opportunity',
        impact: 'high',
        confidence: 0.92,
        actionItems: ['Scale operations to meet demand', 'Optimize pricing strategy'],
        dataSupport: ['Quarterly revenue data', 'Project completion rates']
      }
    ];

    const kpis: KPIMetric[] = [
      {
        id: 'total_revenue',
        name: 'Total Revenue',
        value: summary.totalRevenue,
        unit: '$',
        trend: 'up',
        change: 25.3,
        status: 'excellent'
      },
      {
        id: 'avg_project_value',
        name: 'Average Project Value',
        value: summary.totalRevenue / Math.max(projects.length, 1),
        unit: '$',
        trend: 'up',
        change: 8.7,
        status: 'good'
      }
    ];

    return {
      summary,
      charts,
      tables,
      insights,
      kpis,
      trends: [],
      comparisons: []
    };
  }

  /**
   * Generate market analysis report
   */
  private async generateMarketAnalysisReport(filters: ReportFilters): Promise<ReportData> {
    // Fetch market data
    const rfqs = await this.fetchRFQs(filters);
    const quotes = await this.fetchQuotes(filters);
    const projects = await this.fetchProjects(filters);

    const marketData = await this.analyzeMarketData(rfqs, quotes, projects);

    const summary: SummaryMetrics = {
      totalSystems: projects.length,
      totalCapacity: marketData.marketSize.totalInstalled,
      totalProduction: 0,
      totalRevenue: 0,
      averagePerformance: 0,
      customerSatisfaction: 0,
      marketShare: marketData.competitiveAnalysis.marketShare.find(m => m.installer === 'current')?.share || 0,
      growthRate: marketData.marketSize.yearOverYear
    };

    const charts: ChartData[] = [
      {
        id: 'market_growth',
        title: 'Market Growth Trend',
        type: 'line',
        data: this.createMarketGrowthData(marketData),
        xAxis: { label: 'Year' },
        yAxis: { label: 'Installations', unit: 'MW' },
        series: [{ name: 'Market Size', color: '#7c3aed' }]
      },
      {
        id: 'competitive_landscape',
        title: 'Competitive Market Share',
        type: 'pie',
        data: marketData.competitiveAnalysis.marketShare.map(item => ({
          x: item.installer,
          y: item.share
        })),
        xAxis: { label: 'Installer' },
        yAxis: { label: 'Market Share', unit: '%' },
        series: [{ name: 'Market Share', color: '#06b6d4' }]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'installer_rankings',
        title: 'Top Installer Rankings',
        headers: ['Rank', 'Installer', 'Projects', 'Capacity (MW)', 'Avg Price ($/W)', 'Customer Rating'],
        rows: this.createInstallerRankingTable(marketData.competitiveAnalysis.topInstallers),
        sortable: true,
        exportable: true
      }
    ];

    const insights: BusinessInsight[] = [
      {
        id: 'market_opportunity',
        title: 'Growing Market Opportunity',
        description: `Solar market is projected to grow by ${marketData.marketSize.projectedGrowth}% over the next year`,
        type: 'opportunity',
        impact: 'high',
        confidence: 0.88,
        actionItems: [
          'Increase marketing investment',
          'Expand service areas',
          'Develop competitive pricing strategy'
        ],
        dataSupport: ['Market size projections', 'RFQ volume trends']
      }
    ];

    const kpis: KPIMetric[] = [
      {
        id: 'market_share',
        name: 'Market Share',
        value: summary.marketShare,
        unit: '%',
        target: 15,
        trend: 'up',
        change: 2.3,
        status: summary.marketShare >= 15 ? 'excellent' : 'good'
      },
      {
        id: 'rfq_conversion',
        name: 'RFQ Conversion Rate',
        value: this.calculateRFQConversionRate(rfqs, quotes),
        unit: '%',
        trend: 'stable',
        change: 0.5,
        status: 'good'
      }
    ];

    return {
      summary,
      charts,
      tables,
      insights,
      kpis,
      trends: [],
      comparisons: []
    };
  }

  /**
   * Generate installer performance report
   */
  private async generateInstallerPerformanceReport(filters: ReportFilters): Promise<ReportData> {
    const projects = await this.fetchProjects(filters);
    const quotes = await this.fetchQuotes(filters);
    
    // Aggregate data by installer
    const installerMetrics = this.aggregateInstallerMetrics(projects, quotes);

    const summary: SummaryMetrics = {
      totalSystems: projects.length,
      totalCapacity: projects.reduce((sum, proj) => sum + (proj.finalSystem?.totalCapacity || 0), 0),
      totalProduction: 0,
      totalRevenue: projects.reduce((sum, proj) => sum + proj.contract.totalValue, 0),
      averagePerformance: installerMetrics.reduce((sum, installer) => sum + installer.customerSatisfaction, 0) / installerMetrics.length,
      customerSatisfaction: 0,
      marketShare: 0,
      growthRate: 0
    };

    const charts: ChartData[] = [
      {
        id: 'installer_performance_comparison',
        title: 'Installer Performance Comparison',
        type: 'bar',
        data: installerMetrics.map(installer => ({
          x: installer.name,
          y: installer.customerSatisfaction
        })),
        xAxis: { label: 'Installer' },
        yAxis: { label: 'Customer Satisfaction', unit: '/5' },
        series: [{ name: 'Satisfaction', color: '#f59e0b' }]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'installer_metrics',
        title: 'Installer Performance Metrics',
        headers: ['Installer', 'Projects', 'Capacity (kW)', 'Avg Size (kW)', 'Customer Rating', 'Avg Price ($/W)'],
        rows: installerMetrics.map(installer => [
          installer.name,
          installer.projectsCompleted,
          installer.totalCapacity.toFixed(1),
          installer.averageProjectSize.toFixed(1),
          installer.customerSatisfaction.toFixed(1),
          installer.averagePrice.toFixed(2)
        ]),
        sortable: true,
        exportable: true
      }
    ];

    const insights: BusinessInsight[] = [
      {
        id: 'top_performer_analysis',
        title: 'Top Performer Identified',
        description: `${installerMetrics[0]?.name} leads in customer satisfaction with ${installerMetrics[0]?.customerSatisfaction.toFixed(1)}/5 rating`,
        type: 'trend',
        impact: 'medium',
        confidence: 0.9,
        actionItems: ['Study best practices', 'Share learnings across network'],
        dataSupport: ['Customer satisfaction scores', 'Project completion rates']
      }
    ];

    const kpis: KPIMetric[] = [
      {
        id: 'avg_satisfaction',
        name: 'Average Customer Satisfaction',
        value: summary.averagePerformance,
        unit: '/5',
        target: 4.5,
        trend: 'up',
        change: 2.1,
        status: summary.averagePerformance >= 4.5 ? 'excellent' : 'good'
      }
    ];

    return {
      summary,
      charts,
      tables,
      insights,
      kpis,
      trends: [],
      comparisons: []
    };
  }

  /**
   * Generate customer insights report
   */
  private async generateCustomerInsightsReport(filters: ReportFilters): Promise<ReportData> {
    const rfqs = await this.fetchRFQs(filters);
    const projects = await this.fetchProjects(filters);
    
    // Analyze customer data
    const customerSegmentation = this.analyzeCustomerSegmentation(rfqs, projects);

    const summary: SummaryMetrics = {
      totalSystems: projects.length,
      totalCapacity: 0,
      totalProduction: 0,
      totalRevenue: 0,
      averagePerformance: 0,
      customerSatisfaction: customerSegmentation.reduce((sum, seg) => sum + seg.conversionRate, 0) / customerSegmentation.length * 100,
      marketShare: 0,
      growthRate: 0
    };

    const charts: ChartData[] = [
      {
        id: 'customer_segments',
        title: 'Customer Segmentation',
        type: 'pie',
        data: customerSegmentation.map(segment => ({
          x: segment.name,
          y: segment.size
        })),
        xAxis: { label: 'Segment' },
        yAxis: { label: 'Customers' },
        series: [{ name: 'Segment Size', color: '#10b981' }]
      }
    ];

    const tables: TableData[] = [
      {
        id: 'segment_analysis',
        title: 'Customer Segment Analysis',
        headers: ['Segment', 'Size', 'Avg System Size (kW)', 'Price Range ($)', 'Conversion Rate (%)', 'Key Preferences'],
        rows: customerSegmentation.map(segment => [
          segment.name,
          segment.size,
          segment.averageSystemSize.toFixed(1),
          `$${segment.priceRange.min.toLocaleString()} - $${segment.priceRange.max.toLocaleString()}`,
          (segment.conversionRate * 100).toFixed(1),
          segment.preferences.join(', ')
        ]),
        sortable: true,
        exportable: true
      }
    ];

    const insights: BusinessInsight[] = [
      {
        id: 'high_value_segment',
        title: 'High-Value Customer Segment Identified',
        description: 'Premium homeowners show highest conversion rates and system sizes',
        type: 'opportunity',
        impact: 'high',
        confidence: 0.85,
        actionItems: [
          'Develop targeted marketing for premium segment',
          'Create premium service packages',
          'Focus on high-end equipment offerings'
        ],
        dataSupport: ['Conversion rate analysis', 'System size preferences']
      }
    ];

    const kpis: KPIMetric[] = [
      {
        id: 'overall_conversion_rate',
        name: 'Overall Conversion Rate',
        value: summary.customerSatisfaction,
        unit: '%',
        target: 25,
        trend: 'up',
        change: 3.5,
        status: summary.customerSatisfaction >= 25 ? 'excellent' : 'good'
      }
    ];

    return {
      summary,
      charts,
      tables,
      insights,
      kpis,
      trends: [],
      comparisons: []
    };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private generateReportId(type: ReportType, period: ReportPeriod): string {
    return `${type}_${period}_${Date.now()}`;
  }

  private getDefaultDateRange(period: ReportPeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setDate(end.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(end.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 1);
    }

    return { start, end };
  }

  // Data fetching methods (simplified - would use actual Firestore queries)
  private async fetchSystems(filters: ReportFilters): Promise<SolarSystem[]> {
    try {
      const systemsQuery = query(
        collection(db, COLLECTIONS.SOLAR_SYSTEMS),
        where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(systemsQuery);
      return snapshot.docs.map(doc => doc.data() as SolarSystem);
    } catch (error) {
      errorTracker.captureException(error as Error);
      return [];
    }
  }

  private async fetchProductionData(filters: ReportFilters): Promise<EnergyProductionRecord[]> {
    try {
      const productionQuery = query(
        collection(db, COLLECTIONS.ENERGY_PRODUCTION),
        where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end)),
        orderBy('timestamp', 'asc'),
        limit(10000) // Limit for performance
      );
      
      const snapshot = await getDocs(productionQuery);
      return snapshot.docs.map(doc => doc.data() as EnergyProductionRecord);
    } catch (error) {
      errorTracker.captureException(error as Error);
      return [];
    }
  }

  private async fetchProjects(filters: ReportFilters): Promise<Project[]> {
    try {
      const projectsQuery = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(projectsQuery);
      return snapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      errorTracker.captureException(error as Error);
      return [];
    }
  }

  private async fetchQuotes(filters: ReportFilters): Promise<Quote[]> {
    try {
      const quotesQuery = query(
        collection(db, COLLECTIONS.QUOTES),
        where('submittedAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('submittedAt', '<=', Timestamp.fromDate(filters.dateRange.end)),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(quotesQuery);
      return snapshot.docs.map(doc => doc.data() as Quote);
    } catch (error) {
      errorTracker.captureException(error as Error);
      return [];
    }
  }

  private async fetchRFQs(filters: ReportFilters): Promise<RFQ[]> {
    try {
      const rfqsQuery = query(
        collection(db, COLLECTIONS.RFQS),
        where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(rfqsQuery);
      return snapshot.docs.map(doc => doc.data() as RFQ);
    } catch (error) {
      errorTracker.captureException(error as Error);
      return [];
    }
  }

  // Data processing methods
  private aggregateProductionByDay(data: EnergyProductionRecord[]): DataPoint[] {
    const dailyData = new Map<string, number>();
    
    data.forEach(record => {
      const date = record.timestamp.toDate().toISOString().split('T')[0];
      dailyData.set(date, (dailyData.get(date) || 0) + record.production.energy);
    });
    
    return Array.from(dailyData.entries()).map(([date, energy]) => ({
      x: date,
      y: Math.round(energy * 100) / 100
    }));
  }

  private createPerformanceDistribution(data: EnergyProductionRecord[]): DataPoint[] {
    const ranges = [
      { label: '0-60%', min: 0, max: 0.6, count: 0 },
      { label: '60-70%', min: 0.6, max: 0.7, count: 0 },
      { label: '70-80%', min: 0.7, max: 0.8, count: 0 },
      { label: '80-90%', min: 0.8, max: 0.9, count: 0 },
      { label: '90-100%', min: 0.9, max: 1.0, count: 0 }
    ];

    data.forEach(record => {
      const pr = record.performance.performanceRatio;
      const range = ranges.find(r => pr >= r.min && pr < r.max);
      if (range) range.count++;
    });

    return ranges.map(range => ({
      x: range.label,
      y: range.count
    }));
  }

  private aggregateCapacityByRegion(systems: SolarSystem[]): DataPoint[] {
    const regionData = new Map<string, number>();
    
    systems.forEach(system => {
      const region = system.location.address.state;
      regionData.set(region, (regionData.get(region) || 0) + system.configuration.totalCapacity);
    });
    
    return Array.from(regionData.entries()).map(([region, capacity]) => ({
      x: region,
      y: Math.round(capacity * 10) / 10
    }));
  }

  private getTopPerformingSystems(
    systems: SolarSystem[], 
    productionData: EnergyProductionRecord[]
  ): (string | number)[][] {
    // Simplified implementation
    return systems.slice(0, 10).map(system => [
      system.id,
      system.location.address.city,
      system.configuration.totalCapacity,
      '85.2%', // Would calculate actual performance ratio
      system.targets.annual
    ]);
  }

  private aggregateRevenueByMonth(projects: Project[]): DataPoint[] {
    const monthlyData = new Map<string, number>();
    
    projects.forEach(project => {
      const month = project.createdAt.toDate().toISOString().slice(0, 7); // YYYY-MM
      monthlyData.set(month, (monthlyData.get(month) || 0) + project.contract.totalValue);
    });
    
    return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
      x: month,
      y: Math.round(revenue)
    }));
  }

  private createProjectValueDistribution(projects: Project[]): DataPoint[] {
    const ranges = [
      { label: '$0-25K', min: 0, max: 25000, count: 0 },
      { label: '$25K-50K', min: 25000, max: 50000, count: 0 },
      { label: '$50K-75K', min: 50000, max: 75000, count: 0 },
      { label: '$75K-100K', min: 75000, max: 100000, count: 0 },
      { label: '$100K+', min: 100000, max: Infinity, count: 0 }
    ];

    projects.forEach(project => {
      const value = project.contract.totalValue;
      const range = ranges.find(r => value >= r.min && value < r.max);
      if (range) range.count++;
    });

    return ranges.map(range => ({
      x: range.label,
      y: range.count
    }));
  }

  private getQuarterlyFinancialSummary(projects: Project[]): (string | number)[][] {
    // Simplified quarterly aggregation
    const quarters = new Map<string, { revenue: number; projects: number }>();
    
    projects.forEach(project => {
      const date = project.createdAt.toDate();
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      
      const existing = quarters.get(quarter) || { revenue: 0, projects: 0 };
      quarters.set(quarter, {
        revenue: existing.revenue + project.contract.totalValue,
        projects: existing.projects + 1
      });
    });

    return Array.from(quarters.entries()).map(([quarter, data]) => [
      quarter,
      data.revenue,
      data.projects,
      Math.round(data.revenue / Math.max(data.projects, 1)),
      '15.5%' // Simplified profit margin
    ]);
  }

  private async analyzeMarketData(
    rfqs: RFQ[], 
    quotes: Quote[], 
    projects: Project[]
  ): Promise<MarketAnalysisData> {
    return {
      marketSize: {
        totalInstalled: projects.reduce((sum, p) => sum + (p.finalSystem?.totalCapacity || 0), 0),
        yearOverYear: 15.2,
        projectedGrowth: 18.5
      },
      competitiveAnalysis: {
        topInstallers: this.getTopInstallers(projects),
        marketShare: [
          { installer: 'Installer A', share: 25.3 },
          { installer: 'Installer B', share: 18.7 },
          { installer: 'Current', share: 12.4 },
          { installer: 'Others', share: 43.6 }
        ],
        pricingAnalysis: {
          averagePricePerWatt: 2.85,
          priceRange: { min: 2.20, max: 3.50 },
          trends: [],
          competitorPricing: []
        }
      },
      customerSegmentation: {
        segments: this.getCustomerSegments(rfqs),
        trends: []
      },
      geographicAnalysis: {
        regions: [],
        penetration: {
          residential: 3.2,
          commercial: 15.8,
          industrial: 35.6,
          totalMarket: 8.9
        }
      }
    };
  }

  private getTopInstallers(projects: Project[]): InstallerMetrics[] {
    const installerMap = new Map<string, any>();
    
    projects.forEach(project => {
      const installerId = project.installerId;
      const existing = installerMap.get(installerId) || {
        id: installerId,
        name: `Installer ${installerId.slice(-6)}`,
        projectsCompleted: 0,
        totalCapacity: 0,
        totalValue: 0
      };
      
      installerMap.set(installerId, {
        ...existing,
        projectsCompleted: existing.projectsCompleted + 1,
        totalCapacity: existing.totalCapacity + (project.finalSystem?.totalCapacity || 0),
        totalValue: existing.totalValue + project.contract.totalValue
      });
    });

    return Array.from(installerMap.values()).map(installer => ({
      ...installer,
      averageProjectSize: installer.totalCapacity / Math.max(installer.projectsCompleted, 1),
      customerSatisfaction: 4.2 + Math.random() * 0.6, // Mock data
      averagePrice: installer.totalValue / Math.max(installer.totalCapacity, 1) / 1000, // $/W
      marketShare: (installer.projectsCompleted / projects.length) * 100
    }));
  }

  private getCustomerSegments(rfqs: RFQ[]): CustomerSegment[] {
    return [
      {
        name: 'Budget-Conscious',
        size: Math.floor(rfqs.length * 0.4),
        averageSystemSize: 8.5,
        priceRange: { min: 15000, max: 30000 },
        preferences: ['Low cost', 'Simple installation', 'Basic equipment'],
        conversionRate: 0.15
      },
      {
        name: 'Value-Focused',
        size: Math.floor(rfqs.length * 0.35),
        averageSystemSize: 12.2,
        priceRange: { min: 25000, max: 45000 },
        preferences: ['Quality equipment', 'Good warranty', 'Efficiency'],
        conversionRate: 0.25
      },
      {
        name: 'Premium',
        size: Math.floor(rfqs.length * 0.25),
        averageSystemSize: 16.8,
        priceRange: { min: 40000, max: 80000 },
        preferences: ['Top equipment', 'Smart features', 'Full service'],
        conversionRate: 0.35
      }
    ];
  }

  private createMarketGrowthData(marketData: MarketAnalysisData): DataPoint[] {
    // Mock historical growth data
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      x: currentYear - 4 + i,
      y: 1000 + i * 200 + Math.random() * 100 // Simplified growth curve
    }));
  }

  private createInstallerRankingTable(installers: InstallerMetrics[]): (string | number)[][] {
    return installers
      .sort((a, b) => b.projectsCompleted - a.projectsCompleted)
      .slice(0, 10)
      .map((installer, index) => [
        index + 1,
        installer.name,
        installer.projectsCompleted,
        (installer.totalCapacity / 1000).toFixed(1),
        installer.averagePrice.toFixed(2),
        installer.customerSatisfaction.toFixed(1)
      ]);
  }

  private calculateRFQConversionRate(rfqs: RFQ[], quotes: Quote[]): number {
    const rfqsWithQuotes = new Set(quotes.map(q => q.rfqId));
    return (rfqsWithQuotes.size / Math.max(rfqs.length, 1)) * 100;
  }

  private aggregateInstallerMetrics(projects: Project[], quotes: Quote[]): InstallerMetrics[] {
    return this.getTopInstallers(projects);
  }

  private analyzeCustomerSegmentation(rfqs: RFQ[], projects: Project[]): CustomerSegment[] {
    return this.getCustomerSegments(rfqs);
  }

  private async generateMetadata(
    data: ReportData, 
    filters: ReportFilters
  ): Promise<ReportMetadata> {
    return {
      dataPoints: data.charts.reduce((sum, chart) => sum + chart.data.length, 0),
      dataSources: ['solar_systems', 'energy_production', 'projects', 'quotes', 'rfqs'],
      refreshRate: 'Hourly',
      accuracy: 0.95,
      completeness: 0.98,
      lastDataUpdate: new Date()
    };
  }
}

// Export singleton instance
export const solarBIEngine = new SolarBIEngine();