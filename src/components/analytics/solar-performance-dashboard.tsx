"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sun, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Battery, 
  Thermometer, 
  Wind, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  Leaf
} from "lucide-react";

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface SolarPerformanceDashboardProps {
  systemId: string;
  refreshInterval?: number;
}

interface DashboardData {
  realTime: RealTimeMetrics;
  production: ProductionMetrics;
  performance: PerformanceMetrics;
  environmental: EnvironmentalMetrics;
  financial: FinancialMetrics;
  alerts: SystemAlert[];
  predictions: PredictionData;
  lastUpdated: Date;
}

interface RealTimeMetrics {
  currentPower: number; // kW
  todayEnergy: number; // kWh
  efficiency: number; // %
  status: 'excellent' | 'good' | 'warning' | 'error';
  temperature: number; // °C
  irradiance: number; // W/m²
}

interface ProductionMetrics {
  daily: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
  weekly: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
  monthly: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
  yearly: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
}

interface PerformanceMetrics {
  performanceRatio: number;
  systemEfficiency: number;
  availabilityFactor: number;
  capacityFactor: number;
  healthScore: number;
}

interface EnvironmentalMetrics {
  co2Avoided: number; // kg
  treesEquivalent: number;
  coalAvoided: number; // kg
  environmentalValue: number; // $
}

interface FinancialMetrics {
  todaySavings: number;
  monthSavings: number;
  totalSavings: number;
  roi: number; // %
  paybackProgress: number; // %
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  component?: string;
}

interface PredictionData {
  nextHour: number;
  nextDay: number;
  nextWeek: number;
  confidence: number;
}

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  efficiency?: number;
  temperature?: number;
  irradiance?: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function SolarPerformanceDashboard({ 
  systemId, 
  refreshInterval = 30000 
}: SolarPerformanceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In real implementation, this would fetch from your analytics API
        const mockData: DashboardData = {
          realTime: {
            currentPower: 8.5,
            todayEnergy: 45.2,
            efficiency: 18.7,
            status: 'good',
            temperature: 32,
            irradiance: 850
          },
          production: {
            daily: { value: 45.2, change: 5.8, trend: 'up' },
            weekly: { value: 298.5, change: -2.3, trend: 'down' },
            monthly: { value: 1247.8, change: 12.5, trend: 'up' },
            yearly: { value: 12850.0, change: 8.9, trend: 'up' }
          },
          performance: {
            performanceRatio: 0.85,
            systemEfficiency: 18.7,
            availabilityFactor: 0.98,
            capacityFactor: 0.22,
            healthScore: 0.92
          },
          environmental: {
            co2Avoided: 235.6,
            treesEquivalent: 4.9,
            coalAvoided: 142.8,
            environmentalValue: 47.12
          },
          financial: {
            todaySavings: 5.42,
            monthSavings: 149.78,
            totalSavings: 2847.65,
            roi: 12.5,
            paybackProgress: 24.8
          },
          alerts: [
            {
              id: '1',
              type: 'warning',
              title: 'Performance Below Expected',
              message: 'System producing 5% below forecast due to partial shading',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              component: 'panels'
            },
            {
              id: '2',
              type: 'info',
              title: 'Maintenance Reminder',
              message: 'Annual inspection scheduled for next month',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          ],
          predictions: {
            nextHour: 7.2,
            nextDay: 38.5,
            nextWeek: 265.0,
            confidence: 0.85
          },
          lastUpdated: new Date()
        };

        // Generate mock time series data
        const mockTimeSeriesData = generateMockTimeSeriesData(selectedTimeRange);
        
        setDashboardData(mockData);
        setTimeSeriesData(mockTimeSeriesData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up refresh interval
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [systemId, selectedTimeRange, refreshInterval]);

  const generateMockTimeSeriesData = (timeRange: string): TimeSeriesDataPoint[] => {
    const data: TimeSeriesDataPoint[] = [];
    const now = new Date();
    let dataPoints: number;
    let intervalMinutes: number;

    switch (timeRange) {
      case 'day':
        dataPoints = 24;
        intervalMinutes = 60;
        break;
      case 'week':
        dataPoints = 168;
        intervalMinutes = 60;
        break;
      case 'month':
        dataPoints = 30;
        intervalMinutes = 24 * 60;
        break;
      case 'year':
        dataPoints = 12;
        intervalMinutes = 30 * 24 * 60;
        break;
      default:
        dataPoints = 24;
        intervalMinutes = 60;
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
      const hour = timestamp.getHours();
      
      // Solar production curve (bell curve centered at noon)
      let baseProduction = 0;
      if (hour >= 6 && hour <= 18) {
        const peakHour = 12;
        const hourOffset = Math.abs(hour - peakHour);
        baseProduction = Math.max(0, 10 - (hourOffset / 6) ** 2 * 10);
      }
      
      // Add some randomness
      const randomFactor = 0.8 + Math.random() * 0.4;
      const production = baseProduction * randomFactor;
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(production * 100) / 100,
        efficiency: 18 + Math.random() * 3,
        temperature: 25 + Math.random() * 15,
        irradiance: production > 0 ? 300 + Math.random() * 700 : 0
      });
    }

    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertTriangle className="h-5 w-5 mr-2" />
        {error || 'Failed to load dashboard data'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">Solar Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for System {systemId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <span className="text-sm text-muted-foreground">
            Updated: {dashboardData.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Real-time Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Current Power"
          value={`${dashboardData.realTime.currentPower} kW`}
          icon={<Zap className="h-4 w-4" />}
          status={dashboardData.realTime.status}
        />
        <StatusCard
          title="Today's Energy"
          value={`${dashboardData.realTime.todayEnergy} kWh`}
          icon={<Sun className="h-4 w-4" />}
          status={dashboardData.realTime.status}
        />
        <StatusCard
          title="System Efficiency"
          value={`${dashboardData.realTime.efficiency}%`}
          icon={<Activity className="h-4 w-4" />}
          status={dashboardData.realTime.status}
        />
        <StatusCard
          title="Solar Irradiance"
          value={`${dashboardData.realTime.irradiance} W/m²`}
          icon={<Eye className="h-4 w-4" />}
          status={dashboardData.realTime.status}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Production Timeline</CardTitle>
                  <CardDescription>Energy production over time</CardDescription>
                </div>
                <Select 
                  value={selectedTimeRange} 
                  onValueChange={(value: any) => setSelectedTimeRange(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">24 Hours</SelectItem>
                    <SelectItem value="week">7 Days</SelectItem>
                    <SelectItem value="month">30 Days</SelectItem>
                    <SelectItem value="year">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <ProductionChart data={timeSeriesData} />
              </CardContent>
            </Card>

            {/* Alerts & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                  {dashboardData.alerts.length === 0 && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      No active alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <MetricCard
              title="Performance Ratio"
              value={`${(dashboardData.performance.performanceRatio * 100).toFixed(1)}%`}
              description="Actual vs theoretical yield"
              trend={dashboardData.performance.performanceRatio > 0.8 ? 'good' : 'warning'}
            />
            <MetricCard
              title="System Health"
              value={`${(dashboardData.performance.healthScore * 100).toFixed(0)}%`}
              description="Overall system condition"
              trend={dashboardData.performance.healthScore > 0.9 ? 'good' : 'warning'}
            />
            <MetricCard
              title="Availability"
              value={`${(dashboardData.performance.availabilityFactor * 100).toFixed(1)}%`}
              description="System uptime"
              trend={dashboardData.performance.availabilityFactor > 0.95 ? 'good' : 'warning'}
            />
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProductionSummaryCard
              title="Daily Production"
              value={dashboardData.production.daily.value}
              change={dashboardData.production.daily.change}
              trend={dashboardData.production.daily.trend}
              unit="kWh"
            />
            <ProductionSummaryCard
              title="Weekly Production"
              value={dashboardData.production.weekly.value}
              change={dashboardData.production.weekly.change}
              trend={dashboardData.production.weekly.trend}
              unit="kWh"
            />
            <ProductionSummaryCard
              title="Monthly Production"
              value={dashboardData.production.monthly.value}
              change={dashboardData.production.monthly.change}
              trend={dashboardData.production.monthly.trend}
              unit="kWh"
            />
            <ProductionSummaryCard
              title="Yearly Production"
              value={dashboardData.production.yearly.value}
              change={dashboardData.production.yearly.change}
              trend={dashboardData.production.yearly.trend}
              unit="kWh"
            />
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Production Analysis</CardTitle>
              <CardDescription>Detailed breakdown of energy production patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Peak Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Peak Power:</span>
                      <span className="font-medium">9.8 kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Peak Time:</span>
                      <span className="font-medium">12:30 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Best Day:</span>
                      <span className="font-medium">52.3 kWh</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">System Utilization</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Capacity Factor:</span>
                      <span className="font-medium">{(dashboardData.performance.capacityFactor * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Utilization Rate:</span>
                      <span className="font-medium">87.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Operating Hours:</span>
                      <span className="font-medium">11.2 hrs/day</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PerformanceMetric
                    label="Performance Ratio"
                    value={dashboardData.performance.performanceRatio}
                    unit="%"
                    target={0.85}
                    description="Ratio of actual to theoretical energy yield"
                  />
                  <PerformanceMetric
                    label="System Efficiency"
                    value={dashboardData.performance.systemEfficiency / 100}
                    unit="%"
                    target={0.18}
                    description="Overall system conversion efficiency"
                  />
                  <PerformanceMetric
                    label="Capacity Factor"
                    value={dashboardData.performance.capacityFactor}
                    unit="%"
                    target={0.25}
                    description="Ratio of actual to nameplate capacity"
                  />
                  <PerformanceMetric
                    label="Availability Factor"
                    value={dashboardData.performance.availabilityFactor}
                    unit="%"
                    target={0.95}
                    description="System uptime and availability"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environmental Conditions</CardTitle>
                <CardDescription>Current environmental factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>Solar Irradiance</span>
                    </div>
                    <span className="font-medium">{dashboardData.realTime.irradiance} W/m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                      <span>Ambient Temperature</span>
                    </div>
                    <span className="font-medium">{dashboardData.realTime.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wind className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Wind Speed</span>
                    </div>
                    <span className="font-medium">2.3 m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 mr-2 text-green-500" />
                      <span>Humidity</span>
                    </div>
                    <span className="font-medium">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Environmental Tab */}
        <TabsContent value="environmental">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnvironmentalCard
              title="CO₂ Avoided"
              value={dashboardData.environmental.co2Avoided}
              unit="kg"
              icon={<Leaf className="h-4 w-4" />}
              description="Carbon dioxide emissions prevented"
            />
            <EnvironmentalCard
              title="Trees Equivalent"
              value={dashboardData.environmental.treesEquivalent}
              unit="trees"
              icon={<Leaf className="h-4 w-4" />}
              description="Equivalent number of trees planted"
            />
            <EnvironmentalCard
              title="Coal Avoided"
              value={dashboardData.environmental.coalAvoided}
              unit="kg"
              icon={<Leaf className="h-4 w-4" />}
              description="Coal consumption avoided"
            />
            <EnvironmentalCard
              title="Environmental Value"
              value={dashboardData.environmental.environmentalValue}
              unit="$"
              icon={<DollarSign className="h-4 w-4" />}
              description="Estimated environmental benefit value"
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Environmental Impact Summary</CardTitle>
              <CardDescription>Your solar system's positive environmental contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>
                  Your solar system has generated <strong>{dashboardData.production.yearly.value.toLocaleString()} kWh</strong> of clean energy this year, 
                  avoiding approximately <strong>{dashboardData.environmental.co2Avoided} kg of CO₂ emissions</strong>. 
                  This is equivalent to planting <strong>{Math.round(dashboardData.environmental.treesEquivalent)} trees</strong> or 
                  avoiding the burning of <strong>{Math.round(dashboardData.environmental.coalAvoided)} kg of coal</strong>.
                </p>
                <p>
                  The environmental value of these avoided emissions is estimated at 
                  <strong> ${dashboardData.environmental.environmentalValue}</strong> based on current carbon pricing models.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PredictionCard
              title="Next Hour"
              value={dashboardData.predictions.nextHour}
              unit="kW"
              confidence={dashboardData.predictions.confidence}
              timeframe="1 hour"
            />
            <PredictionCard
              title="Next Day"
              value={dashboardData.predictions.nextDay}
              unit="kWh"
              confidence={dashboardData.predictions.confidence * 0.9}
              timeframe="24 hours"
            />
            <PredictionCard
              title="Next Week"
              value={dashboardData.predictions.nextWeek}
              unit="kWh"
              confidence={dashboardData.predictions.confidence * 0.8}
              timeframe="7 days"
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Prediction Accuracy & Methodology</CardTitle>
              <CardDescription>How we generate these forecasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Data Sources</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Historical production patterns</li>
                    <li>• Weather forecasts</li>
                    <li>• Seasonal adjustments</li>
                    <li>• System degradation factors</li>
                    <li>• Real-time performance data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Model Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Hourly Accuracy:</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Daily Accuracy:</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Accuracy:</span>
                      <span className="font-medium">72%</span>
                    </div>
                  </div>
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

function StatusCard({ 
  title, 
  value, 
  icon, 
  status 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  status: 'excellent' | 'good' | 'warning' | 'error';
}) {
  const statusColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${statusColors[status]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductionChart({ data }: { data: TimeSeriesDataPoint[] }) {
  // Simple SVG chart - in production, use a proper charting library like Recharts or Chart.js
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 600;
  const height = 200;
  const padding = 40;

  const xScale = (width - 2 * padding) / (data.length - 1);
  const yScale = (height - 2 * padding) / maxValue;

  const pathData = data
    .map((point, index) => {
      const x = padding + index * xScale;
      const y = height - padding - point.value * yScale;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border rounded">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + ratio * (height - 2 * padding)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Production line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + index * xScale;
          const y = height - padding - point.value * yScale;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#3b82f6"
            />
          );
        })}
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <text
            key={ratio}
            x={padding - 10}
            y={height - padding - ratio * (height - 2 * padding) + 4}
            textAnchor="end"
            fontSize="12"
            fill="#6b7280"
          >
            {(maxValue * ratio).toFixed(1)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function AlertCard({ alert }: { alert: SystemAlert }) {
  const alertStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    critical: 'border-red-300 bg-red-100 text-red-900'
  };

  const alertIcons = {
    info: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <AlertTriangle className="h-4 w-4" />,
    critical: <AlertTriangle className="h-4 w-4" />
  };

  return (
    <div className={`p-3 rounded-lg border ${alertStyles[alert.type]}`}>
      <div className="flex items-start space-x-2">
        {alertIcons[alert.type]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-xs opacity-90">{alert.message}</p>
          <p className="text-xs opacity-75 mt-1">
            {alert.timestamp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  description, 
  trend 
}: { 
  title: string; 
  value: string; 
  description: string; 
  trend: 'good' | 'warning' | 'error';
}) {
  const trendColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const trendIcons = {
    good: <TrendingUp className="h-4 w-4" />,
    warning: <TrendingDown className="h-4 w-4" />,
    error: <TrendingDown className="h-4 w-4" />
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`${trendColors[trend]}`}>
            {trendIcons[trend]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductionSummaryCard({ 
  title, 
  value, 
  change, 
  trend, 
  unit 
}: {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-muted-foreground'
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3" />,
    down: <TrendingDown className="h-3 w-3" />,
    stable: <Activity className="h-3 w-3" />
  };

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value.toLocaleString()} {unit}</p>
        <div className={`flex items-center text-sm ${trendColors[trend]}`}>
          {trendIcons[trend]}
          <span className="ml-1">
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetric({ 
  label, 
  value, 
  unit, 
  target, 
  description 
}: {
  label: string;
  value: number;
  unit: string;
  target: number;
  description: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const displayValue = unit === '%' ? (value * 100).toFixed(1) : value.toFixed(3);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{displayValue}{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-accent h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function EnvironmentalCard({ 
  title, 
  value, 
  unit, 
  icon, 
  description 
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-green-600">{icon}</div>
        </div>
        <p className="text-2xl font-bold">
          {unit === '$' && '$'}{value.toLocaleString()}{unit !== '$' && ` ${unit}`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function PredictionCard({ 
  title, 
  value, 
  unit, 
  confidence, 
  timeframe 
}: {
  title: string;
  value: number;
  unit: string;
  confidence: number;
  timeframe: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value.toFixed(1)} {unit}</p>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
            <span>{(confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div 
              className="bg-blue-600 h-1 rounded-full" 
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">For next {timeframe}</p>
      </CardContent>
    </Card>
  );
}