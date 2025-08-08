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
  Leaf,
  Wifi,
  WifiOff,
  Settings,
  BarChart3,
  LineChart,
  PieChart,
  Monitor,
  Smartphone,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Home,
  Wrench,
  Bell
} from "lucide-react";
import { RealTimeSystem } from '../../lib/monitoring/real-time-monitoring-service';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface ComprehensiveMonitoringDashboardProps {
  systemId: string;
  viewMode?: 'homeowner' | 'installer' | 'admin';
  refreshInterval?: number;
  enableNotifications?: boolean;
}

interface DashboardState {
  realTimeSystem: RealTimeSystem | null;
  historicalData: HistoricalData | null;
  comparativeData: ComparativeData | null;
  forecastData: ForecastData | null;
  maintenanceData: MaintenanceData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface HistoricalData {
  daily: TimeSeriesPoint[];
  weekly: TimeSeriesPoint[];
  monthly: TimeSeriesPoint[];
  yearly: TimeSeriesPoint[];
}

interface ComparativeData {
  peerComparison: PeerComparisonData;
  industryBenchmark: BenchmarkData;
  weatherAdjusted: WeatherAdjustedData;
}

interface ForecastData {
  production: ProductionForecast;
  weather: WeatherForecast[];
  maintenance: MaintenanceForecast;
}

interface MaintenanceData {
  scheduledTasks: MaintenanceTask[];
  recommendations: MaintenanceRecommendation[];
  history: MaintenanceHistory[];
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  efficiency?: number;
  weather?: WeatherConditions;
}

interface PeerComparisonData {
  averagePerformance: number;
  ranking: number;
  totalSystems: number;
  category: string;
}

interface BenchmarkData {
  performanceRatio: number;
  specificYield: number;
  availability: number;
  industryAverage: number;
}

interface WeatherAdjustedData {
  expectedProduction: number;
  actualProduction: number;
  weatherImpact: number;
  adjustmentFactor: number;
}

interface ProductionForecast {
  hourly: ForecastPoint[];
  daily: ForecastPoint[];
  weekly: ForecastPoint[];
}

interface ForecastPoint {
  timestamp: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

interface WeatherForecast {
  timestamp: string;
  temperature: number;
  irradiance: number;
  cloudCover: number;
  precipitation: number;
}

interface MaintenanceForecast {
  nextInspection: Date;
  predictedIssues: PredictedIssue[];
  recommendedActions: RecommendedAction[];
}

interface MaintenanceTask {
  id: string;
  type: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  cost: number;
}

interface MaintenanceRecommendation {
  id: string;
  category: string;
  description: string;
  impact: string;
  urgency: 'immediate' | 'within_week' | 'within_month' | 'planned';
  estimatedCost: number;
  potentialSavings: number;
}

interface MaintenanceHistory {
  date: Date;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
}

interface PredictedIssue {
  component: string;
  issue: string;
  probability: number;
  timeframe: string;
  impact: string;
}

interface RecommendedAction {
  action: string;
  reason: string;
  urgency: string;
  estimatedCost: number;
}

interface WeatherConditions {
  temperature: number;
  irradiance: number;
  cloudCover: number;
  windSpeed: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ComprehensiveMonitoringDashboard({ 
  systemId, 
  viewMode = 'homeowner',
  refreshInterval = 30000,
  enableNotifications = true
}: ComprehensiveMonitoringDashboardProps) {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    realTimeSystem: null,
    historicalData: null,
    comparativeData: null,
    forecastData: null,
    maintenanceData: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardState(prev => ({ ...prev, loading: true, error: null }));

        // In production, these would be actual API calls
        const mockRealTimeSystem: RealTimeSystem = {
          systemId,
          status: {
            operational: 'online',
            health: 0.92,
            uptime: 98.5,
            availability: 99.2,
            communicationStatus: 'connected',
            lastCommunication: new Date(),
            errorCount: 0,
            warningCount: 1
          },
          currentProduction: {
            instantaneous: {
              dcPower: 8.7,
              acPower: 8.3,
              efficiency: 19.2,
              voltage: 385,
              current: 22.6,
              frequency: 60.0,
              powerFactor: 0.98
            },
            cumulative: {
              todayEnergy: 48.6,
              weekEnergy: 312.8,
              monthEnergy: 1389.5,
              yearEnergy: 14205.7,
              lifetimeEnergy: 52847.3
            },
            trends: {
              last15min: [7.8, 8.1, 8.4, 8.7],
              lastHour: [6.2, 6.8, 7.3, 7.8, 8.1, 8.4, 8.7, 8.6],
              last24Hours: Array.from({ length: 24 }, (_, i) => {
                const hour = i;
                if (hour < 6 || hour > 19) return 0;
                const peak = 12;
                const offset = Math.abs(hour - peak);
                return Math.max(0, 9 - (offset / 6) * 9) + (Math.random() - 0.5) * 2;
              }),
              last7Days: [45.2, 38.7, 52.1, 47.9, 41.3, 48.6, 42.8]
            }
          },
          performance: {
            metrics: {
              performanceRatio: 0.87,
              specificYield: 4.32,
              capacityFactor: 0.18,
              systemEfficiency: 19.2,
              inverterEfficiency: 96.8,
              dcToACRatio: 0.954
            },
            comparison: {
              expectedVsActual: 1.03,
              industryBenchmark: 0.91,
              historicalAverage: 0.89,
              weatherAdjusted: 0.95
            },
            degradation: {
              annualRate: 0.45,
              cumulativeImpact: 2.8,
              projectedLifetime: 26.5
            }
          },
          environmental: {
            solar: {
              irradiance: 825,
              clearSkyIrradiance: 950,
              clearSkyIndex: 0.87,
              peakSunHours: 6.8,
              uvIndex: 8
            },
            weather: {
              temperature: 32,
              moduleTemperature: 47,
              humidity: 48,
              pressure: 1016,
              windSpeed: 3.2,
              windDirection: 225,
              precipitation: 0,
              cloudCover: 15,
              visibility: 12
            },
            impact: {
              temperatureDerating: 2.8,
              shadingLoss: 1.2,
              weatherEfficiencyFactor: 0.92,
              soilingLoss: 2.5
            }
          },
          equipment: {
            inverters: [
              {
                id: 'inv_001',
                serialNumber: 'SE27.6K-US',
                status: 'online',
                power: 8.3,
                efficiency: 96.8,
                temperature: 42,
                errorCodes: [],
                lastCommunication: new Date(),
                firmware: '4.18.71',
                operatingHours: 18475
              }
            ],
            panels: [],
            optimizers: [],
            batteries: [],
            monitoring: {
              system: 'SolarEdge',
              dataLogger: 'SE1000-ZBGW3',
              communicationMethod: 'Ethernet',
              signalStrength: 95,
              lastUpdate: new Date(),
              dataQuality: 98,
              missedReadings: 2
            },
            grid: {
              connected: true,
              voltage: 240,
              frequency: 60.0,
              powerFactor: 0.98,
              gridExport: 8.3,
              gridImport: 0,
              netMetering: true,
              utilityAlerts: []
            }
          },
          alerts: [
            {
              id: 'alert_001',
              systemId,
              type: 'performance_degradation',
              severity: 'medium',
              category: 'performance',
              title: 'Slight Performance Decrease',
              message: 'System performance 3% below monthly average',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              acknowledged: false,
              resolved: false,
              impact: {
                productionLoss: 1.5,
                efficiencyImpact: 3,
                financialImpact: 0.45,
                urgency: 'planned'
              }
            }
          ],
          predictions: {
            nextHour: {
              production: 7.9,
              confidence: 88,
              factors: ['Decreasing solar angle', 'Stable weather', 'Historical pattern']
            },
            nextDay: {
              production: 42.5,
              peak: 9.2,
              confidence: 82,
              weatherForecast: {
                temperature: 29,
                irradiance: 790,
                cloudCover: 25,
                precipitation: 10,
                windSpeed: 2.8
              }
            },
            nextWeek: {
              production: 285,
              dailyForecast: [42.5, 38.1, 35.7, 44.2, 46.8, 41.3, 37.9],
              confidence: 75
            }
          },
          lastUpdated: new Date(),
          dataStreams: [
            {
              name: 'AC Power',
              value: 8.3,
              unit: 'kW',
              trend: 'stable',
              quality: 'excellent',
              lastUpdate: new Date()
            },
            {
              name: 'DC Power',
              value: 8.7,
              unit: 'kW',
              trend: 'stable',
              quality: 'excellent',
              lastUpdate: new Date()
            },
            {
              name: 'Efficiency',
              value: 19.2,
              unit: '%',
              trend: 'up',
              quality: 'good',
              lastUpdate: new Date()
            }
          ]
        };

        // Generate mock historical data
        const mockHistoricalData: HistoricalData = {
          daily: generateTimeSeriesData('day'),
          weekly: generateTimeSeriesData('week'),
          monthly: generateTimeSeriesData('month'),
          yearly: generateTimeSeriesData('year')
        };

        // Mock comparative data
        const mockComparativeData: ComparativeData = {
          peerComparison: {
            averagePerformance: 0.84,
            ranking: 23,
            totalSystems: 156,
            category: 'Residential 10kW Systems'
          },
          industryBenchmark: {
            performanceRatio: 0.85,
            specificYield: 4.2,
            availability: 98.5,
            industryAverage: 0.82
          },
          weatherAdjusted: {
            expectedProduction: 46.2,
            actualProduction: 48.6,
            weatherImpact: 0.95,
            adjustmentFactor: 1.05
          }
        };

        // Mock forecast data
        const mockForecastData: ForecastData = {
          production: {
            hourly: generateForecastData('hourly', 24),
            daily: generateForecastData('daily', 7),
            weekly: generateForecastData('weekly', 4)
          },
          weather: generateWeatherForecast(7),
          maintenance: {
            nextInspection: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            predictedIssues: [
              {
                component: 'Inverter',
                issue: 'Fan bearing wear',
                probability: 0.15,
                timeframe: '6-12 months',
                impact: 'Minor performance reduction'
              }
            ],
            recommendedActions: [
              {
                action: 'Panel cleaning',
                reason: 'Accumulated soiling reducing efficiency',
                urgency: 'within_month',
                estimatedCost: 150
              }
            ]
          }
        };

        // Mock maintenance data
        const mockMaintenanceData: MaintenanceData = {
          scheduledTasks: [
            {
              id: 'task_001',
              type: 'inspection',
              description: 'Annual system inspection',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              priority: 'medium',
              estimatedDuration: 2,
              cost: 250
            }
          ],
          recommendations: [
            {
              id: 'rec_001',
              category: 'cleaning',
              description: 'Panel cleaning to remove accumulated dust and debris',
              impact: 'Improve efficiency by 3-5%',
              urgency: 'within_month',
              estimatedCost: 150,
              potentialSavings: 45
            }
          ],
          history: [
            {
              date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              type: 'inspection',
              description: 'Quarterly system inspection and cleaning',
              cost: 200,
              performedBy: 'Solar Maintenance Pro'
            }
          ]
        };

        setDashboardState({
          realTimeSystem: mockRealTimeSystem,
          historicalData: mockHistoricalData,
          comparativeData: mockComparativeData,
          forecastData: mockForecastData,
          maintenanceData: mockMaintenanceData,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });

      } catch (error) {
        setDashboardState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        }));
      }
    };

    loadDashboardData();

    // Set up refresh interval
    const interval = setInterval(loadDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [systemId, refreshInterval]);

  // Generate mock time series data
  const generateTimeSeriesData = (period: string): TimeSeriesPoint[] => {
    const data: TimeSeriesPoint[] = [];
    const now = new Date();
    let points = 24;
    let intervalMs = 60 * 60 * 1000; // 1 hour

    switch (period) {
      case 'week':
        points = 168;
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case 'month':
        points = 30;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'year':
        points = 12;
        intervalMs = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
    }

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      const hour = timestamp.getHours();
      
      let baseValue = 0;
      if (hour >= 6 && hour <= 18) {
        const peak = 12;
        const offset = Math.abs(hour - peak);
        baseValue = Math.max(0, 10 - (offset / 6) ** 2 * 10);
      }
      
      const randomFactor = 0.8 + Math.random() * 0.4;
      const value = baseValue * randomFactor;
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 100) / 100,
        efficiency: 18 + Math.random() * 3,
        weather: {
          temperature: 25 + Math.random() * 15,
          irradiance: value > 0 ? 300 + Math.random() * 700 : 0,
          cloudCover: Math.random() * 100,
          windSpeed: Math.random() * 10
        }
      });
    }

    return data;
  };

  // Generate forecast data
  const generateForecastData = (type: string, points: number): ForecastPoint[] => {
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(Date.now() + i * (type === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
      const baseValue = type === 'hourly' ? 5 + Math.random() * 10 : 35 + Math.random() * 20;
      
      return {
        timestamp: timestamp.toISOString(),
        predicted: Math.round(baseValue * 100) / 100,
        confidence: 70 + Math.random() * 25,
        factors: ['Weather forecast', 'Historical patterns', 'Seasonal adjustments']
      };
    });
  };

  // Generate weather forecast
  const generateWeatherForecast = (days: number): WeatherForecast[] => {
    return Array.from({ length: days }, (_, i) => {
      const timestamp = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      
      return {
        timestamp: timestamp.toISOString(),
        temperature: 25 + Math.random() * 15,
        irradiance: 500 + Math.random() * 500,
        cloudCover: Math.random() * 80,
        precipitation: Math.random() * 50
      };
    });
  };

  if (dashboardState.loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-lg">Loading comprehensive monitoring dashboard...</p>
          <p className="text-sm text-muted-foreground">Gathering real-time data and analytics</p>
        </div>
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring dashboard: {dashboardState.error}
        </AlertDescription>
      </Alert>
    );
  }

  const { realTimeSystem } = dashboardState;
  if (!realTimeSystem) return null;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline tracking-tight text-accent">
            Solar Performance Monitoring
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">System {systemId}</span>
            </div>
            <Badge 
              variant="outline" 
              className={`flex items-center ${
                realTimeSystem.status.communicationStatus === 'connected' 
                  ? 'text-green-600 border-green-200' 
                  : 'text-red-600 border-red-200'
              }`}
            >
              {realTimeSystem.status.communicationStatus === 'connected' ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1" />
              )}
              {realTimeSystem.status.communicationStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Updated: {dashboardState.lastUpdated?.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {enableNotifications && (
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({realTimeSystem.alerts.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Monitor className="h-4 w-4 mr-2" />
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard
          title="Current Power"
          value={`${realTimeSystem.currentProduction.instantaneous.acPower.toFixed(1)} kW`}
          icon={<Zap className="h-4 w-4" />}
          status={realTimeSystem.status.operational}
          trend={realTimeSystem.currentProduction.instantaneous.acPower > 5 ? 'up' : 'stable'}
        />
        <StatusCard
          title="Today's Energy"
          value={`${realTimeSystem.currentProduction.cumulative.todayEnergy.toFixed(1)} kWh`}
          icon={<Sun className="h-4 w-4" />}
          status={realTimeSystem.status.operational}
          trend="up"
        />
        <StatusCard
          title="System Health"
          value={`${(realTimeSystem.status.health * 100).toFixed(0)}%`}
          icon={<Activity className="h-4 w-4" />}
          status={realTimeSystem.status.operational}
          trend={realTimeSystem.status.health > 0.9 ? 'up' : 'down'}
        />
        <StatusCard
          title="Performance Ratio"
          value={`${(realTimeSystem.performance.metrics.performanceRatio * 100).toFixed(1)}%`}
          icon={<BarChart3 className="h-4 w-4" />}
          status={realTimeSystem.status.operational}
          trend={realTimeSystem.performance.metrics.performanceRatio > 0.85 ? 'up' : 'down'}
        />
        <StatusCard
          title="System Efficiency"
          value={`${realTimeSystem.performance.metrics.systemEfficiency.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          status={realTimeSystem.status.operational}
          trend="stable"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Production Overview</CardTitle>
                  <CardDescription>Energy production and trends</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
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
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">
                        <LineChart className="h-4 w-4" />
                      </SelectItem>
                      <SelectItem value="bar">
                        <BarChart3 className="h-4 w-4" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ProductionChart 
                  data={dashboardState.historicalData?.daily || []} 
                  type={chartType}
                />
              </CardContent>
            </Card>

            {/* System Status & Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* System Health */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Health</span>
                      <span>{(realTimeSystem.status.health * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={realTimeSystem.status.health * 100} className="h-2" />
                  </div>

                  {/* Uptime */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uptime</span>
                      <span>{realTimeSystem.status.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={realTimeSystem.status.uptime} className="h-2" />
                  </div>

                  {/* Availability */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Availability</span>
                      <span>{realTimeSystem.status.availability.toFixed(1)}%</span>
                    </div>
                    <Progress value={realTimeSystem.status.availability} className="h-2" />
                  </div>

                  {/* Active Alerts */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
                    {realTimeSystem.alerts.length === 0 ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        No active alerts
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {realTimeSystem.alerts.slice(0, 3).map((alert) => (
                          <AlertCard key={alert.id} alert={alert} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <PerformanceCard
              title="Performance Ratio"
              value={realTimeSystem.performance.metrics.performanceRatio}
              unit="%"
              target={0.85}
              description="Actual vs theoretical yield"
            />
            <PerformanceCard
              title="Specific Yield"
              value={realTimeSystem.performance.metrics.specificYield}
              unit="kWh/kWp"
              target={4.5}
              description="Energy per installed capacity"
            />
            <PerformanceCard
              title="Capacity Factor"
              value={realTimeSystem.performance.metrics.capacityFactor}
              unit="%"
              target={0.25}
              description="Utilization of nameplate capacity"
            />
            <PerformanceCard
              title="Inverter Efficiency"
              value={realTimeSystem.performance.metrics.inverterEfficiency}
              unit="%"
              target={96}
              description="DC to AC conversion efficiency"
            />
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Production */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Live Production
                </CardTitle>
                <CardDescription>Real-time system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {realTimeSystem.currentProduction.instantaneous.acPower.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">AC Power (kW)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {realTimeSystem.currentProduction.instantaneous.dcPower.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">DC Power (kW)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {realTimeSystem.currentProduction.instantaneous.efficiency.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {realTimeSystem.currentProduction.instantaneous.voltage.toFixed(0)}V
                    </div>
                    <div className="text-sm text-muted-foreground">DC Voltage</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sun className="h-4 w-4 mr-2" />
                  Environmental Conditions
                </CardTitle>
                <CardDescription>Current weather and environmental factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>Solar Irradiance</span>
                    </div>
                    <span className="font-medium">{realTimeSystem.environmental.solar.irradiance} W/m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                      <span>Ambient Temperature</span>
                    </div>
                    <span className="font-medium">{realTimeSystem.environmental.weather.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-2 text-orange-500" />
                      <span>Module Temperature</span>
                    </div>
                    <span className="font-medium">{realTimeSystem.environmental.weather.moduleTemperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wind className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Wind Speed</span>
                    </div>
                    <span className="font-medium">{realTimeSystem.environmental.weather.windSpeed} m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Cloud Cover</span>
                    </div>
                    <span className="font-medium">{realTimeSystem.environmental.weather.cloudCover}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Equipment Status
                </CardTitle>
                <CardDescription>Real-time status of system components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Inverters */}
                  <div>
                    <h4 className="font-medium mb-2">Inverters</h4>
                    {realTimeSystem.equipment.inverters.map((inverter) => (
                      <div key={inverter.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{inverter.serialNumber}</span>
                          <Badge variant={inverter.status === 'online' ? 'default' : 'destructive'}>
                            {inverter.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Power:</span>
                            <span>{inverter.power.toFixed(1)} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efficiency:</span>
                            <span>{inverter.efficiency.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span>{inverter.temperature}°C</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monitoring System */}
                  <div>
                    <h4 className="font-medium mb-2">Monitoring System</h4>
                    <div className="border rounded p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>System:</span>
                          <span>{realTimeSystem.equipment.monitoring.system}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Logger:</span>
                          <span>{realTimeSystem.equipment.monitoring.dataLogger}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Signal Strength:</span>
                          <span>{realTimeSystem.equipment.monitoring.signalStrength}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Quality:</span>
                          <span>{realTimeSystem.equipment.monitoring.dataQuality}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid Connection */}
                  <div>
                    <h4 className="font-medium mb-2">Grid Connection</h4>
                    <div className="border rounded p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={realTimeSystem.equipment.grid.connected ? 'default' : 'destructive'}>
                            {realTimeSystem.equipment.grid.connected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Grid Export:</span>
                          <span>{realTimeSystem.equipment.grid.gridExport.toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span>{realTimeSystem.equipment.grid.frequency.toFixed(1)} Hz</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Power Factor:</span>
                          <span>{realTimeSystem.equipment.grid.powerFactor.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tabs would continue here... */}
        {/* For brevity, I'm showing the structure but not implementing all tabs */}
        
        <TabsContent value="analytics">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Advanced Analytics</h3>
            <p className="text-muted-foreground">Detailed performance analytics and comparisons</p>
          </div>
        </TabsContent>

        <TabsContent value="forecasts">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Production Forecasts</h3>
            <p className="text-muted-foreground">AI-powered production and weather forecasts</p>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Maintenance Management</h3>
            <p className="text-muted-foreground">Scheduled maintenance and recommendations</p>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="text-center py-8">
            <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Reports & Export</h3>
            <p className="text-muted-foreground">Generate and download detailed reports</p>
          </div>
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
  status,
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  trend?: 'up' | 'down' | 'stable';
}) {
  const statusColors = {
    online: 'text-green-600 bg-green-50 border-green-200',
    degraded: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    offline: 'text-red-600 bg-red-50 border-red-200',
    maintenance: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-600" />,
    down: <TrendingDown className="h-3 w-3 text-red-600" />,
    stable: <Activity className="h-3 w-3 text-muted-foreground" />
  };

  return (
    <Card className={`border ${statusColors[status]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              {trend && trendIcons[trend]}
            </div>
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

function ProductionChart({ data, type }: { data: TimeSeriesPoint[]; type: string }) {
  // Simplified chart implementation
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
        
        {/* Production line/bars */}
        {type === 'line' ? (
          <>
            <path
              d={pathData}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
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
          </>
        ) : (
          data.map((point, index) => {
            const x = padding + index * xScale;
            const y = height - padding - point.value * yScale;
            const barWidth = Math.max(2, xScale * 0.8);
            return (
              <rect
                key={index}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={point.value * yScale}
                fill="#3b82f6"
                opacity={0.7}
              />
            );
          })
        )}
        
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
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

function AlertCard({ alert }: { alert: any }) {
  const severityStyles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    low: 'border-green-200 bg-green-50 text-green-800',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    high: 'border-orange-200 bg-orange-50 text-orange-800',
    critical: 'border-red-200 bg-red-50 text-red-800'
  };

  return (
    <div className={`p-2 rounded border ${severityStyles[alert.severity]}`}>
      <div className="text-xs font-medium">{alert.title}</div>
      <div className="text-xs opacity-90">{alert.message}</div>
    </div>
  );
}

function PerformanceCard({ 
  title, 
  value, 
  unit, 
  target, 
  description 
}: {
  title: string;
  value: number;
  unit: string;
  target: number;
  description: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const displayValue = unit === '%' ? (value * 100).toFixed(1) : value.toFixed(2);
  const isPercentage = unit === '%';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-lg font-bold">
              {displayValue}{isPercentage ? '%' : unit}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}