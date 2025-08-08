"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  Target,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb
} from "lucide-react";

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface BusinessIntelligenceDashboardProps {
  userRole: 'admin' | 'installer' | 'supplier';
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface DashboardData {
  summary: {
    totalRevenue: number;
    totalProjects: number;
    avgProjectValue: number;
    marketShare: number;
    growthRate: number;
    customerSatisfaction: number;
  };
  kpis: KPI[];
  charts: ChartConfig[];
  insights: Insight[];
  tables: TableData[];
  trends: TrendData[];
  lastUpdated: Date;
}

interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'poor';
  target?: number;
}

interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: { x: string | number; y: number; category?: string }[];
  config: {
    xLabel: string;
    yLabel: string;
    color: string;
  };
}

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionItems: string[];
  status: 'new' | 'reviewed' | 'acted_upon';
}

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  highlighted?: number[]; // Row indices to highlight
}

interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  significance: 'high' | 'medium' | 'low';
  timeframe: string;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function BusinessIntelligenceDashboard({ 
  userRole, 
  timeRange = 'month' 
}: BusinessIntelligenceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data generation for demonstration
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: DashboardData = generateMockData(userRole, selectedTimeRange);
        setDashboardData(mockData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole, selectedTimeRange]);

  const generateMockData = (role: string, timeRange: string): DashboardData => {
    const baseMultiplier = timeRange === 'year' ? 12 : timeRange === 'quarter' ? 3 : 1;
    
    return {
      summary: {
        totalRevenue: 2450000 * baseMultiplier,
        totalProjects: 156 * baseMultiplier,
        avgProjectValue: 15700,
        marketShare: 12.3,
        growthRate: 18.5,
        customerSatisfaction: 4.6
      },
      kpis: [
        {
          id: 'revenue',
          name: 'Total Revenue',
          value: 2450000 * baseMultiplier,
          unit: '$',
          change: 23.5,
          trend: 'up',
          status: 'excellent',
          target: 2000000 * baseMultiplier
        },
        {
          id: 'projects',
          name: 'Projects Completed',
          value: 156 * baseMultiplier,
          unit: '',
          change: 15.2,
          trend: 'up',
          status: 'good',
          target: 150 * baseMultiplier
        },
        {
          id: 'conversion',
          name: 'Lead Conversion',
          value: 28.5,
          unit: '%',
          change: 5.3,
          trend: 'up',
          status: 'good',
          target: 25
        },
        {
          id: 'satisfaction',
          name: 'Customer Satisfaction',
          value: 4.6,
          unit: '/5',
          change: 2.1,
          trend: 'up',
          status: 'excellent',
          target: 4.5
        }
      ],
      charts: [
        {
          id: 'revenue_trend',
          title: 'Revenue Trend',
          type: 'line',
          data: generateTimeSeriesData('revenue', baseMultiplier),
          config: {
            xLabel: 'Time Period',
            yLabel: 'Revenue ($)',
            color: '#3b82f6'
          }
        },
        {
          id: 'project_distribution',
          title: 'Projects by Size',
          type: 'pie',
          data: [
            { x: 'Small (0-10kW)', y: 45, category: 'small' },
            { x: 'Medium (10-25kW)', y: 35, category: 'medium' },
            { x: 'Large (25kW+)', y: 20, category: 'large' }
          ],
          config: {
            xLabel: 'System Size',
            yLabel: 'Number of Projects',
            color: '#10b981'
          }
        },
        {
          id: 'market_share',
          title: 'Market Share Analysis',
          type: 'bar',
          data: [
            { x: 'Competitor A', y: 28.5 },
            { x: 'Competitor B', y: 22.1 },
            { x: 'Our Company', y: 18.7 },
            { x: 'Competitor C', y: 15.3 },
            { x: 'Others', y: 15.4 }
          ],
          config: {
            xLabel: 'Company',
            yLabel: 'Market Share (%)',
            color: '#f59e0b'
          }
        }
      ],
      insights: [
        {
          id: 'growth_opportunity',
          type: 'opportunity',
          title: 'Strong Growth in Commercial Segment',
          description: 'Commercial solar installations have increased by 45% compared to last quarter, indicating a significant market opportunity.',
          impact: 'high',
          confidence: 0.85,
          actionItems: [
            'Expand commercial sales team',
            'Develop commercial-specific marketing materials',
            'Partner with commercial building contractors'
          ],
          status: 'new'
        },
        {
          id: 'pricing_trend',
          type: 'trend',
          title: 'Equipment Costs Stabilizing',
          description: 'Solar panel and inverter costs have stabilized after months of volatility, providing better project predictability.',
          impact: 'medium',
          confidence: 0.92,
          actionItems: [
            'Lock in equipment pricing for Q4',
            'Adjust profit margins accordingly',
            'Communicate stability to customers'
          ],
          status: 'reviewed'
        },
        {
          id: 'customer_satisfaction',
          type: 'recommendation',
          title: 'Improve Post-Installation Support',
          description: 'Customer satisfaction scores are excellent but post-installation support receives lower ratings.',
          impact: 'medium',
          confidence: 0.78,
          actionItems: [
            'Implement 90-day follow-up program',
            'Create comprehensive system monitoring guide',
            'Offer extended support packages'
          ],
          status: 'new'
        },
        {
          id: 'supply_chain_risk',
          type: 'risk',
          title: 'Potential Supply Chain Disruption',
          description: 'Key inverter supplier showing signs of delivery delays that could impact Q4 installations.',
          impact: 'high',
          confidence: 0.65,
          actionItems: [
            'Identify alternative suppliers',
            'Increase inventory buffer',
            'Communicate proactively with affected customers'
          ],
          status: 'new'
        }
      ],
      tables: [
        {
          id: 'top_projects',
          title: 'Top Projects by Value',
          headers: ['Project', 'Customer', 'System Size (kW)', 'Value ($)', 'Status'],
          rows: [
            ['PRJ-2024-001', 'ABC Corporation', '250', '$425,000', 'Completed'],
            ['PRJ-2024-002', 'Smith Residence', '15.2', '$38,500', 'In Progress'],
            ['PRJ-2024-003', 'Green Manufacturing', '500', '$750,000', 'Completed'],
            ['PRJ-2024-004', 'Johnson Family', '12.8', '$32,000', 'Completed'],
            ['PRJ-2024-005', 'Tech Startup HQ', '75', '$125,000', 'Planning']
          ],
          highlighted: [0, 2] // Highlight high-value projects
        },
        {
          id: 'installer_performance',
          title: 'Installer Performance Metrics',
          headers: ['Installer', 'Projects', 'Avg Rating', 'On-Time %', 'Revenue ($)'],
          rows: [
            ['Solar Pro Team', '45', '4.8', '96%', '$687,500'],
            ['Green Energy Install', '38', '4.6', '92%', '$578,000'],
            ['Sunshine Solutions', '32', '4.7', '89%', '$445,000'],
            ['Clean Power Co', '28', '4.5', '94%', '$398,000'],
            ['Eco Install Group', '23', '4.4', '88%', '$312,000']
          ]
        }
      ],
      trends: [
        {
          metric: 'Revenue Growth',
          direction: 'up',
          magnitude: 23.5,
          significance: 'high',
          timeframe: 'Last 3 months'
        },
        {
          metric: 'Customer Acquisition Cost',
          direction: 'down',
          magnitude: 12.3,
          significance: 'medium',
          timeframe: 'Last 6 months'
        },
        {
          metric: 'Project Completion Time',
          direction: 'down',
          magnitude: 8.7,
          significance: 'medium',
          timeframe: 'Last 2 months'
        }
      ],
      lastUpdated: new Date()
    };
  };

  const generateTimeSeriesData = (metric: string, multiplier: number) => {
    const data = [];
    const periods = selectedTimeRange === 'year' ? 12 : selectedTimeRange === 'quarter' ? 12 : 8;
    
    for (let i = periods - 1; i >= 0; i--) {
      const baseValue = metric === 'revenue' ? 200000 : 50;
      const variation = 0.8 + Math.random() * 0.4;
      const trend = 1 + (periods - i) * 0.05;
      
      data.push({
        x: selectedTimeRange === 'year' ? `Month ${periods - i}` : `Week ${periods - i}`,
        y: Math.round(baseValue * variation * trend * multiplier)
      });
    }
    
    return data;
  };

  const refreshData = () => {
    const event = new Event('refresh');
    window.dispatchEvent(event);
    
    // Simulate refresh
    setLoading(true);
    setTimeout(() => {
      setDashboardData(generateMockData(userRole, selectedTimeRange));
      setLoading(false);
    }, 1000);
  };

  const exportReport = () => {
    // Simulate report export
    const reportData = {
      type: selectedReport,
      timeRange: selectedTimeRange,
      generatedAt: new Date().toISOString(),
      data: dashboardData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-intelligence-report-${selectedReport}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-2">Loading business intelligence...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error || 'Failed to load dashboard data'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">Business Intelligence</h1>
          <p className="text-muted-foreground">
            Strategic insights and analytics for {userRole} operations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="month">1 Month</SelectItem>
              <SelectItem value="quarter">1 Quarter</SelectItem>
              <SelectItem value="year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={`$${(dashboardData.summary.totalRevenue / 1000000).toFixed(2)}M`}
          change={23.5}
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <SummaryCard
          title="Projects"
          value={dashboardData.summary.totalProjects.toString()}
          change={15.2}
          trend="up"
          icon={<Building className="h-4 w-4" />}
        />
        <SummaryCard
          title="Avg Project Value"
          value={`$${(dashboardData.summary.avgProjectValue / 1000).toFixed(0)}K`}
          change={8.7}
          trend="up"
          icon={<Target className="h-4 w-4" />}
        />
        <SummaryCard
          title="Market Share"
          value={`${dashboardData.summary.marketShare}%`}
          change={2.1}
          trend="up"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <SummaryCard
          title="Growth Rate"
          value={`${dashboardData.summary.growthRate}%`}
          change={5.3}
          trend="up"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <SummaryCard
          title="Customer Rating"
          value={`${dashboardData.summary.customerSatisfaction}/5`}
          change={4.2}
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Main Content */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KPIGrid kpis={dashboardData.kpis} />
            <InsightsPreview insights={dashboardData.insights.slice(0, 3)} />
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {dashboardData.kpis
              .filter(kpi => ['revenue', 'projects', 'conversion'].includes(kpi.id))
              .map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard chart={dashboardData.charts.find(c => c.id === 'revenue_trend')!} />
            <TableCard table={dashboardData.tables.find(t => t.id === 'top_projects')!} />
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard chart={dashboardData.charts.find(c => c.id === 'project_distribution')!} />
            <TableCard table={dashboardData.tables.find(t => t.id === 'installer_performance')!} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
              <CardDescription>Key operational performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OperationalMetric
                  label="Average Project Duration"
                  value="45 days"
                  change={-8.7}
                  isImprovement={true}
                />
                <OperationalMetric
                  label="Installation Success Rate"
                  value="98.2%"
                  change={2.1}
                  isImprovement={true}
                />
                <OperationalMetric
                  label="Customer Response Time"
                  value="2.3 hours"
                  change={-15.4}
                  isImprovement={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData.trends.map((trend, index) => (
              <TrendCard key={index} trend={trend} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis Summary</CardTitle>
              <CardDescription>Key trends and their business impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Positive Trends</span>
                  </div>
                  <Badge variant="secondary">
                    {dashboardData.trends.filter(t => t.direction === 'up').length} active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Optimization Opportunities</span>
                  </div>
                  <Badge variant="secondary">
                    {dashboardData.trends.filter(t => t.direction === 'down' && t.significance === 'high').length} identified
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

function SummaryCard({
  title,
  value,
  change,
  trend,
  icon
}: {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className={`flex items-center text-sm ${trendColor}`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </div>
          </div>
          <div className="text-accent">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ chart }: { chart: ChartConfig }) {
  const renderChart = () => {
    if (chart.type === 'pie') {
      return <PieChart data={chart.data} />;
    } else if (chart.type === 'bar') {
      return <BarChart data={chart.data} config={chart.config} />;
    } else {
      return <LineChart data={chart.data} config={chart.config} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chart.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}

function KPIGrid({ kpis }: { kpis: KPI[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {kpis.map((kpi) => (
            <KPIRow key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KPIRow({ kpi }: { kpi: KPI }) {
  const statusColor = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    warning: 'text-yellow-600',
    poor: 'text-red-600'
  }[kpi.status];

  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Eye;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium">{kpi.name}</p>
        <p className="text-2xl font-bold">
          {kpi.unit === '$' && '$'}{kpi.value.toLocaleString()}{kpi.unit !== '$' && kpi.unit}
        </p>
      </div>
      <div className="text-right">
        <div className={`flex items-center ${statusColor}`}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {kpi.change > 0 ? '+' : ''}{kpi.change}%
        </div>
        {kpi.target && (
          <p className="text-xs text-muted-foreground">
            Target: {kpi.target.toLocaleString()}{kpi.unit}
          </p>
        )}
      </div>
    </div>
  );
}

function KPICard({ kpi }: { kpi: KPI }) {
  const statusColor = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    poor: 'text-red-600 bg-red-50'
  }[kpi.status];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{kpi.name}</p>
          <p className="text-2xl font-bold">
            {kpi.unit === '$' && '$'}{kpi.value.toLocaleString()}{kpi.unit !== '$' && kpi.unit}
          </p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusColor}`}>
            {kpi.change > 0 ? '+' : ''}{kpi.change}% vs prev period
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsPreview({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Insights</CardTitle>
        <CardDescription>Top business insights and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightPreviewCard key={insight.id} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightPreviewCard({ insight }: { insight: Insight }) {
  const typeConfig = {
    opportunity: { icon: Lightbulb, color: 'text-green-600 bg-green-50' },
    risk: { icon: AlertCircle, color: 'text-red-600 bg-red-50' },
    trend: { icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    recommendation: { icon: Info, color: 'text-purple-600 bg-purple-50' }
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-start space-x-3">
        <div className={`p-1 rounded-full ${config.color}`}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{insight.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {insight.description}
          </p>
          <div className="flex items-center mt-2 space-x-2">
            <Badge variant="outline" className="text-xs">
              {insight.impact} impact
            </Badge>
            <span className="text-xs text-muted-foreground">
              {(insight.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeConfig = {
    opportunity: { icon: Lightbulb, color: 'border-green-200 bg-green-50' },
    risk: { icon: AlertCircle, color: 'border-red-200 bg-red-50' },
    trend: { icon: TrendingUp, color: 'border-blue-200 bg-blue-50' },
    recommendation: { icon: Info, color: 'border-purple-200 bg-purple-50' }
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card className={`${config.color} border-l-4`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Icon className="h-4 w-4 mr-2" />
            {insight.title}
          </CardTitle>
          <Badge variant={insight.status === 'new' ? 'default' : 'secondary'}>
            {insight.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
        
        <div className="flex items-center space-x-4 mb-4 text-sm">
          <span className="flex items-center">
            <Target className="h-3 w-3 mr-1" />
            {insight.impact} impact
          </span>
          <span className="flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            {(insight.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        <div>
          <p className="font-medium text-sm mb-2">Recommended Actions:</p>
          <ul className="space-y-1 text-sm">
            {insight.actionItems.map((action, index) => (
              <li key={index} className="flex items-start">
                <span className="text-muted-foreground mr-2">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function TableCard({ table }: { table: TableData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{table.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {table.headers.map((header, index) => (
                  <th key={index} className="text-left py-2 px-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`border-b ${table.highlighted?.includes(rowIndex) ? 'bg-blue-50' : ''}`}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-2 px-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard({ trend }: { trend: TrendData }) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend.direction === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{trend.metric}</h4>
          <div className={`${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${trendColor}`}>
            {trend.direction === 'up' ? '+' : '-'}{trend.magnitude.toFixed(1)}%
          </div>
          
          <div className="text-sm text-muted-foreground">
            {trend.timeframe}
          </div>
          
          <Badge variant={trend.significance === 'high' ? 'default' : 'secondary'}>
            {trend.significance} significance
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function OperationalMetric({
  label,
  value,
  change,
  isImprovement
}: {
  label: string;
  value: string;
  change: number;
  isImprovement: boolean;
}) {
  const changeColor = isImprovement ? 'text-green-600' : 'text-red-600';
  
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className={`text-sm ${changeColor}`}>
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </p>
    </div>
  );
}

// Simple chart components (in production, use a proper charting library)
function LineChart({ data, config }: { data: any[]; config: any }) {
  return (
    <div className="h-64 flex items-center justify-center border rounded">
      <div className="text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
        <p>Line Chart: {config.yLabel}</p>
        <p className="text-sm">{data.length} data points</p>
      </div>
    </div>
  );
}

function BarChart({ data, config }: { data: any[]; config: any }) {
  return (
    <div className="h-64 flex items-center justify-center border rounded">
      <div className="text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
        <p>Bar Chart: {config.yLabel}</p>
        <p className="text-sm">{data.length} categories</p>
      </div>
    </div>
  );
}

function PieChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 flex items-center justify-center border rounded">
      <div className="text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
        <p>Pie Chart</p>
        <p className="text-sm">{data.length} segments</p>
      </div>
    </div>
  );
}