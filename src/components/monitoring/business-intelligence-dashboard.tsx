"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Zap,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Lightbulb,
  PieChart,
  LineChart,
  Activity,
  Building,
  MapPin,
  Settings,
  Eye
} from "lucide-react";

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface BusinessIntelligenceDashboardProps {
  scope: 'portfolio' | 'regional' | 'national';
  systemIds: string[];
  userRole: 'admin' | 'manager' | 'analyst';
  refreshInterval?: number;
}

interface DashboardState {
  kpis: KPI[];
  insights: BusinessInsight[];
  recommendations: BusinessRecommendation[];
  trends: BusinessTrend[];
  benchmarks: Benchmark[];
  portfolioData: PortfolioData;
  performanceMetrics: PerformanceMetrics;
  financialMetrics: FinancialMetrics;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'production' | 'financial' | 'operational' | 'customer';
}

interface BusinessInsight {
  id: string;
  category: 'performance' | 'financial' | 'operational' | 'market';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  dataPoints: number;
  actionable: boolean;
  timeframe: string;
}

interface BusinessRecommendation {
  id: string;
  category: 'optimization' | 'investment' | 'maintenance' | 'expansion' | 'cost_reduction';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: string;
  estimatedCost: number;
  estimatedSavings: number;
  timeline: string;
  roi: number;
  confidence: number;
  prerequisites: string[];
}

interface BusinessTrend {
  id: string;
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number;
  significance: number;
  factors: string[];
  forecast: {
    nextPeriod: number;
    confidence: number;
    range: { min: number; max: number };
  };
}

interface Benchmark {
  id: string;
  metric: string;
  value: number;
  industry: number;
  peer: number;
  best: number;
  ranking: number;
  percentile: number;
  category: 'performance' | 'financial' | 'operational';
}

interface PortfolioData {
  totalSystems: number;
  totalCapacity: number; // MW
  totalProduction: number; // MWh
  averageAge: number; // years
  geographicDistribution: GeographicData[];
  systemTypes: SystemTypeData[];
  performanceDistribution: PerformanceDistribution;
}

interface GeographicData {
  region: string;
  systemCount: number;
  totalCapacity: number;
  performance: number;
}

interface SystemTypeData {
  type: string;
  count: number;
  averageCapacity: number;
  performance: number;
}

interface PerformanceDistribution {
  excellent: number; // % of systems
  good: number;
  fair: number;
  poor: number;
}

interface PerformanceMetrics {
  overallHealth: number;
  averageEfficiency: number;
  performanceRatio: number;
  uptime: number;
  degradationRate: number;
  maintenanceCompliance: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  operatingCosts: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  paybackPeriod: number;
  costPerMWh: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function BusinessIntelligenceDashboard({
  scope,
  systemIds,
  userRole,
  refreshInterval = 300000 // 5 minutes
}: BusinessIntelligenceDashboardProps) {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    kpis: [],
    insights: [],
    recommendations: [],
    trends: [],
    benchmarks: [],
    portfolioData: {
      totalSystems: 0,
      totalCapacity: 0,
      totalProduction: 0,
      averageAge: 0,
      geographicDistribution: [],
      systemTypes: [],
      performanceDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
    },
    performanceMetrics: {
      overallHealth: 0,
      averageEfficiency: 0,
      performanceRatio: 0,
      uptime: 0,
      degradationRate: 0,
      maintenanceCompliance: 0
    },
    financialMetrics: {
      totalRevenue: 0,
      operatingCosts: 0,
      netProfit: 0,
      profitMargin: 0,
      roi: 0,
      paybackPeriod: 0,
      costPerMWh: 0
    },
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'performance' | 'financial' | 'operational'>('all');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  // Load business intelligence data
  useEffect(() => {
    const loadBusinessIntelligenceData = async () => {
      try {
        setDashboardState(prev => ({ ...prev, loading: true, error: null }));

        // In production, this would fetch from the actual API
        const mockKPIs: KPI[] = [
          {
            id: 'kpi_1',
            name: 'Total Portfolio Production',
            value: 15847,
            unit: 'MWh',
            target: 15000,
            previousValue: 14923,
            change: 924,
            changePercent: 6.2,
            trend: 'up',
            status: 'excellent',
            category: 'production'
          },
          {
            id: 'kpi_2',
            name: 'Portfolio Performance Ratio',
            value: 0.87,
            unit: '',
            target: 0.85,
            previousValue: 0.84,
            change: 0.03,
            changePercent: 3.6,
            trend: 'up',
            status: 'excellent',
            category: 'production'
          },
          {
            id: 'kpi_3',
            name: 'Total Revenue',
            value: 2847650,
            unit: '$',
            target: 2500000,
            previousValue: 2684320,
            change: 163330,
            changePercent: 6.1,
            trend: 'up',
            status: 'excellent',
            category: 'financial'
          },
          {
            id: 'kpi_4',
            name: 'System Uptime',
            value: 98.7,
            unit: '%',
            target: 98.0,
            previousValue: 97.9,
            change: 0.8,
            changePercent: 0.8,
            trend: 'up',
            status: 'excellent',
            category: 'operational'
          },
          {
            id: 'kpi_5',
            name: 'Customer Satisfaction',
            value: 4.6,
            unit: '/5',
            target: 4.5,
            previousValue: 4.4,
            change: 0.2,
            changePercent: 4.5,
            trend: 'up',
            status: 'excellent',
            category: 'customer'
          },
          {
            id: 'kpi_6',
            name: 'Cost per MWh',
            value: 42.5,
            unit: '$/MWh',
            target: 45.0,
            previousValue: 44.2,
            change: -1.7,
            changePercent: -3.8,
            trend: 'down',
            status: 'excellent',
            category: 'financial'
          }
        ];

        const mockInsights: BusinessInsight[] = [
          {
            id: 'insight_1',
            category: 'performance',
            title: 'Portfolio Performance Exceeds Industry Benchmark',
            description: 'Current portfolio performance ratio of 87% significantly exceeds the industry average of 82%, indicating superior system design and maintenance practices.',
            impact: 'high',
            confidence: 0.94,
            dataPoints: 1247,
            actionable: false,
            timeframe: 'Last 90 days'
          },
          {
            id: 'insight_2',
            category: 'financial',
            title: 'Regional Cost Optimization Opportunity',
            description: 'Systems in the Southwest region show 12% higher maintenance costs per MWh compared to the national average, presenting optimization opportunities.',
            impact: 'medium',
            confidence: 0.87,
            dataPoints: 342,
            actionable: true,
            timeframe: 'Last 12 months'
          },
          {
            id: 'insight_3',
            category: 'operational',
            title: 'Predictive Maintenance ROI',
            description: 'Systems with predictive maintenance schedules show 23% fewer unplanned outages and 18% lower maintenance costs.',
            impact: 'high',
            confidence: 0.91,
            dataPoints: 856,
            actionable: true,
            timeframe: 'Last 24 months'
          }
        ];

        const mockRecommendations: BusinessRecommendation[] = [
          {
            id: 'rec_1',
            category: 'optimization',
            title: 'Implement AI-Driven Cleaning Schedule Optimization',
            description: 'Deploy machine learning algorithms to optimize panel cleaning schedules based on weather patterns, dust accumulation, and performance impact.',
            priority: 'high',
            estimatedImpact: '3.2% production increase',
            estimatedCost: 125000,
            estimatedSavings: 284500,
            timeline: '6-9 months',
            roi: 227,
            confidence: 0.86,
            prerequisites: ['Data integration platform', 'Weather API access', 'Maintenance team training']
          },
          {
            id: 'rec_2',
            category: 'investment',
            title: 'Expand High-Performance System Installations',
            description: 'Focus new installations on proven high-performance regions and system configurations based on portfolio performance data.',
            priority: 'medium',
            estimatedImpact: '15% portfolio capacity increase',
            estimatedCost: 2500000,
            estimatedSavings: 3750000,
            timeline: '18-24 months',
            roi: 150,
            confidence: 0.78,
            prerequisites: ['Site assessment', 'Financing arrangements', 'Regulatory approvals']
          },
          {
            id: 'rec_3',
            category: 'cost_reduction',
            title: 'Standardize Regional Maintenance Operations',
            description: 'Implement standardized maintenance procedures across all regions to reduce cost variations and improve efficiency.',
            priority: 'medium',
            estimatedImpact: '12% maintenance cost reduction',
            estimatedCost: 75000,
            estimatedSavings: 342000,
            timeline: '4-6 months',
            roi: 456,
            confidence: 0.92,
            prerequisites: ['Process documentation', 'Staff training', 'Tool standardization']
          }
        ];

        const mockTrends: BusinessTrend[] = [
          {
            id: 'trend_1',
            metric: 'Portfolio Production',
            period: 'monthly',
            direction: 'increasing',
            magnitude: 5.2,
            significance: 0.89,
            factors: ['Improved weather conditions', 'System optimizations', 'New installations'],
            forecast: {
              nextPeriod: 16450,
              confidence: 0.82,
              range: { min: 15890, max: 17010 }
            }
          },
          {
            id: 'trend_2',
            metric: 'System Efficiency',
            period: 'quarterly',
            direction: 'stable',
            magnitude: 0.8,
            significance: 0.65,
            factors: ['Consistent maintenance', 'Technology maturity', 'Weather normalization'],
            forecast: {
              nextPeriod: 18.9,
              confidence: 0.91,
              range: { min: 18.6, max: 19.2 }
            }
          }
        ];

        const mockBenchmarks: Benchmark[] = [
          {
            id: 'bench_1',
            metric: 'Performance Ratio',
            value: 0.87,
            industry: 0.82,
            peer: 0.84,
            best: 0.92,
            ranking: 15,
            percentile: 85,
            category: 'performance'
          },
          {
            id: 'bench_2',
            metric: 'Cost per MWh',
            value: 42.5,
            industry: 47.2,
            peer: 44.8,
            best: 38.1,
            ranking: 8,
            percentile: 92,
            category: 'financial'
          }
        ];

        const mockPortfolioData: PortfolioData = {
          totalSystems: systemIds.length,
          totalCapacity: 156.8, // MW
          totalProduction: 15847, // MWh
          averageAge: 3.2, // years
          geographicDistribution: [
            { region: 'Southwest', systemCount: 45, totalCapacity: 67.2, performance: 89 },
            { region: 'Southeast', systemCount: 38, totalCapacity: 52.1, performance: 85 },
            { region: 'West Coast', systemCount: 29, totalCapacity: 37.5, performance: 91 }
          ],
          systemTypes: [
            { type: 'Residential', count: 89, averageCapacity: 8.5, performance: 87 },
            { type: 'Commercial', count: 23, averageCapacity: 45.2, performance: 89 }
          ],
          performanceDistribution: {
            excellent: 42, // % of systems performing >90%
            good: 38, // % performing 80-90%
            fair: 16, // % performing 70-80%
            poor: 4 // % performing <70%
          }
        };

        const mockPerformanceMetrics: PerformanceMetrics = {
          overallHealth: 92,
          averageEfficiency: 18.7,
          performanceRatio: 0.87,
          uptime: 98.7,
          degradationRate: 0.45,
          maintenanceCompliance: 96
        };

        const mockFinancialMetrics: FinancialMetrics = {
          totalRevenue: 2847650,
          operatingCosts: 1653420,
          netProfit: 1194230,
          profitMargin: 41.9,
          roi: 12.5,
          paybackPeriod: 7.2,
          costPerMWh: 42.5
        };

        setDashboardState({
          kpis: mockKPIs,
          insights: mockInsights,
          recommendations: mockRecommendations,
          trends: mockTrends,
          benchmarks: mockBenchmarks,
          portfolioData: mockPortfolioData,
          performanceMetrics: mockPerformanceMetrics,
          financialMetrics: mockFinancialMetrics,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });

      } catch (error) {
        setDashboardState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load business intelligence data'
        }));
      }
    };

    loadBusinessIntelligenceData();

    // Set up refresh interval
    const interval = setInterval(loadBusinessIntelligenceData, refreshInterval);
    return () => clearInterval(interval);
  }, [systemIds, scope, refreshInterval]);

  // Filter data based on selected category
  const filteredKPIs = selectedCategory === 'all' 
    ? dashboardState.kpis 
    : dashboardState.kpis.filter(kpi => kpi.category === selectedCategory);

  const filteredInsights = selectedCategory === 'all' 
    ? dashboardState.insights 
    : dashboardState.insights.filter(insight => insight.category === selectedCategory);

  const filteredRecommendations = selectedCategory === 'all' 
    ? dashboardState.recommendations 
    : dashboardState.recommendations.filter(rec => rec.category === selectedCategory);

  if (dashboardState.loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-lg">Loading business intelligence dashboard...</p>
          <p className="text-sm text-muted-foreground">Analyzing {systemIds.length} systems</p>
        </div>
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load business intelligence dashboard: {dashboardState.error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">
            Business Intelligence Dashboard
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {scope.charAt(0).toUpperCase() + scope.slice(1)} View
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dashboardState.portfolioData.totalSystems} Systems
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dashboardState.portfolioData.totalCapacity.toFixed(1)} MW
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {filteredKPIs.slice(0, 6).map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Portfolio Performance Overview
                </CardTitle>
                <CardDescription>Key performance metrics and health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PerformanceMetricDisplay
                    label="Overall Health Score"
                    value={dashboardState.performanceMetrics.overallHealth}
                    unit="%"
                    target={90}
                    status={dashboardState.performanceMetrics.overallHealth >= 90 ? 'excellent' : 'good'}
                  />
                  <PerformanceMetricDisplay
                    label="Performance Ratio"
                    value={dashboardState.performanceMetrics.performanceRatio * 100}
                    unit="%"
                    target={85}
                    status={dashboardState.performanceMetrics.performanceRatio >= 0.85 ? 'excellent' : 'good'}
                  />
                  <PerformanceMetricDisplay
                    label="System Uptime"
                    value={dashboardState.performanceMetrics.uptime}
                    unit="%"
                    target={98}
                    status={dashboardState.performanceMetrics.uptime >= 98 ? 'excellent' : 'good'}
                  />
                  <PerformanceMetricDisplay
                    label="Average Efficiency"
                    value={dashboardState.performanceMetrics.averageEfficiency}
                    unit="%"
                    target={18}
                    status={dashboardState.performanceMetrics.averageEfficiency >= 18 ? 'excellent' : 'good'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financial Performance Overview
                </CardTitle>
                <CardDescription>Revenue, costs, and profitability metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      ${dashboardState.financialMetrics.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Operating Costs</span>
                    <span className="text-lg font-bold text-orange-600">
                      ${dashboardState.financialMetrics.operatingCosts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Profit</span>
                    <span className="text-lg font-bold text-green-600">
                      ${dashboardState.financialMetrics.netProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profit Margin</span>
                    <span className="text-lg font-bold">
                      {dashboardState.financialMetrics.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ROI</span>
                    <span className="text-lg font-bold text-green-600">
                      {dashboardState.financialMetrics.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Key Business Insights
                </CardTitle>
                <CardDescription>AI-generated insights from portfolio data analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInsights.slice(0, 3).map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} detailed />
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardState.benchmarks.map((benchmark) => (
              <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="space-y-6">
            {dashboardState.trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>System distribution across regions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardState.portfolioData.geographicDistribution.map((region) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{region.region}</span>
                        <div className="text-sm text-muted-foreground">
                          {region.systemCount} systems • {region.totalCapacity.toFixed(1)} MW
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{region.performance}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full" 
                            style={{ width: `${region.performance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Performance Distribution
                </CardTitle>
                <CardDescription>System performance categorization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <PerformanceDistributionItem
                    label="Excellent (>90%)"
                    percentage={dashboardState.portfolioData.performanceDistribution.excellent}
                    color="green"
                  />
                  <PerformanceDistributionItem
                    label="Good (80-90%)"
                    percentage={dashboardState.portfolioData.performanceDistribution.good}
                    color="blue"
                  />
                  <PerformanceDistributionItem
                    label="Fair (70-80%)"
                    percentage={dashboardState.portfolioData.performanceDistribution.fair}
                    color="yellow"
                  />
                  <PerformanceDistributionItem
                    label="Poor (<70%)"
                    percentage={dashboardState.portfolioData.performanceDistribution.poor}
                    color="red"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function KPICard({ kpi }: { kpi: KPI }) {
  const statusColors = {
    excellent: 'text-green-600 bg-green-50 border-green-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Activity;

  return (
    <Card className={`border ${statusColors[kpi.status]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.name}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold">
                {kpi.unit === '$' && '$'}{kpi.value.toLocaleString()}{kpi.unit !== '$' && kpi.unit}
              </p>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendIcon className={`h-3 w-3 ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
                {kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          {kpi.target && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="text-sm font-medium">
                {kpi.target.toLocaleString()}{kpi.unit}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight, detailed = false }: { insight: BusinessInsight; detailed?: boolean }) {
  const impactColors = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-sm">{insight.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
        </div>
        <Badge className={`${impactColors[insight.impact]} text-xs`}>
          {insight.impact} impact
        </Badge>
      </div>
      
      {detailed && (
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <span className="ml-1 font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Data Points:</span>
            <span className="ml-1 font-medium">{insight.dataPoints.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Timeframe:</span>
            <span className="ml-1 font-medium">{insight.timeframe}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Actionable:</span>
            <span className="ml-1 font-medium">{insight.actionable ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: BusinessRecommendation }) {
  const priorityColors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{recommendation.title}</CardTitle>
            <CardDescription className="mt-1">{recommendation.description}</CardDescription>
          </div>
          <Badge className={`${priorityColors[recommendation.priority]} ml-4 flex-shrink-0`}>
            {recommendation.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Estimated Cost:</span>
            <div className="font-medium">${recommendation.estimatedCost.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Estimated Savings:</span>
            <div className="font-medium text-green-600">${recommendation.estimatedSavings.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">ROI:</span>
            <div className="font-medium">{recommendation.roi}%</div>
          </div>
          <div>
            <span className="text-muted-foreground">Timeline:</span>
            <div className="font-medium">{recommendation.timeline}</div>
          </div>
        </div>
        
        <div className="mt-4">
          <span className="text-sm text-muted-foreground">Impact:</span>
          <span className="ml-2 text-sm font-medium">{recommendation.estimatedImpact}</span>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <Progress value={recommendation.confidence * 100} className="w-20 h-2" />
            <span className="text-xs">{(recommendation.confidence * 100).toFixed(0)}%</span>
          </div>
          <Button size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkCard({ benchmark }: { benchmark: Benchmark }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{benchmark.metric}</CardTitle>
        <CardDescription>Performance vs industry benchmarks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Your Portfolio</span>
            <span className="text-lg font-bold text-accent">{benchmark.value}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Industry Average</span>
            <span className="text-sm font-medium">{benchmark.industry}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Peer Average</span>
            <span className="text-sm font-medium">{benchmark.peer}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Best in Class</span>
            <span className="text-sm font-medium text-green-600">{benchmark.best}</span>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Ranking:</span>
              <span className="font-medium">#{benchmark.ranking}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Percentile:</span>
              <span className="font-medium">{benchmark.percentile}th</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard({ trend }: { trend: BusinessTrend }) {
  const directionColors = {
    increasing: 'text-green-600',
    decreasing: 'text-red-600',
    stable: 'text-blue-600',
    volatile: 'text-yellow-600'
  };

  const DirectionIcon = trend.direction === 'increasing' ? TrendingUp : 
                       trend.direction === 'decreasing' ? TrendingDown : Activity;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{trend.metric} Trend</CardTitle>
            <CardDescription>{trend.period} analysis</CardDescription>
          </div>
          <div className={`flex items-center space-x-1 ${directionColors[trend.direction]}`}>
            <DirectionIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{trend.direction}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm text-muted-foreground">Magnitude:</span>
            <div className="font-medium">{trend.magnitude.toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Significance:</span>
            <div className="font-medium">{(trend.significance * 100).toFixed(0)}%</div>
          </div>
        </div>
        
        <div className="mb-4">
          <span className="text-sm text-muted-foreground">Key Factors:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {trend.factors.map((factor, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {factor}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Forecast (Next Period):</div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{trend.forecast.nextPeriod}</span>
            <span className="text-xs text-muted-foreground">
              {(trend.forecast.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Range: {trend.forecast.range.min} - {trend.forecast.range.max}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricDisplay({ 
  label, 
  value, 
  unit, 
  target, 
  status 
}: {
  label: string;
  value: number;
  unit: string;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}) {
  const percentage = (value / target) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value.toFixed(1)}{unit}</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2" />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Target: {target}{unit}</span>
        <span className={status === 'excellent' ? 'text-green-600' : 'text-blue-600'}>
          {status}
        </span>
      </div>
    </div>
  );
}

function PerformanceDistributionItem({ 
  label, 
  percentage, 
  color 
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium w-10 text-right">{percentage}%</span>
      </div>
    </div>
  );
}