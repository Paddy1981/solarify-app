'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  Sun,
  Battery,
  Calendar,
  ArrowUpDown,
  PieChart,
  BarChart3,
  LineChart,
  Info,
  Download,
  Settings,
  RefreshCw,
  Target,
  Award,
  Lightbulb
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

// Mock data - in production this would come from API calls
const mockSavingsData = {
  summary: {
    totalSavings: 2845.67,
    monthlySavings: 237.14,
    savingsPercent: 73,
    systemPayback: 8.2,
    environmentalImpact: {
      co2Avoided: 3420, // lbs
      treesEquivalent: 38
    }
  },
  
  monthlyData: [
    { month: 'Jan', year: 2024, production: 845, consumption: 1200, import: 455, export: 100, bill: 89.50, savings: 178.20, netMetering: 85.30 },
    { month: 'Feb', year: 2024, production: 920, consumption: 1100, import: 280, export: 200, bill: 52.40, savings: 198.60, netMetering: 120.50 },
    { month: 'Mar', year: 2024, production: 1150, consumption: 1180, import: 130, export: 320, bill: 15.80, savings: 245.70, netMetering: 185.40 },
    { month: 'Apr', year: 2024, production: 1240, consumption: 1050, import: 0, export: 190, bill: -28.50, savings: 278.90, netMetering: 155.60 },
    { month: 'May', year: 2024, production: 1380, consumption: 1150, import: 0, export: 230, bill: -45.20, savings: 295.80, netMetering: 198.40 },
    { month: 'Jun', year: 2024, production: 1420, consumption: 1300, import: 0, export: 120, bill: -18.30, savings: 268.40, netMetering: 142.80 },
    { month: 'Jul', year: 2024, production: 1390, consumption: 1480, import: 90, export: 0, bill: 42.60, savings: 287.90, netMetering: 98.20 },
    { month: 'Aug', year: 2024, production: 1340, consumption: 1520, import: 180, export: 0, bill: 78.20, savings: 252.30, netMetering: 76.50 },
    { month: 'Sep', year: 2024, production: 1180, consumption: 1380, import: 200, export: 0, bill: 95.40, savings: 215.60, netMetering: 68.90 },
    { month: 'Oct', year: 2024, production: 980, consumption: 1200, import: 320, export: 100, bill: 125.80, savings: 184.70, netMetering: 82.40 },
    { month: 'Nov', year: 2024, production: 750, consumption: 1100, import: 450, export: 100, bill: 165.30, savings: 145.20, netMetering: 78.60 },
    { month: 'Dec', year: 2024, production: 680, consumption: 1180, import: 600, export: 100, bill: 198.40, savings: 121.80, netMetering: 72.30 }
  ],
  
  nemPolicy: {
    name: 'NEM 2.0',
    version: '2.0',
    compensationRate: 'Retail Rate',
    rolloverPolicy: 'Annual',
    expirationDate: '2043-04-14',
    grandfathered: true
  },
  
  trueUpSummary: {
    year: 2024,
    totalProduction: 13355,
    totalConsumption: 14740,
    netUsage: 1385,
    finalBill: 485.20,
    excessGeneration: 0,
    carryoverCredit: 125.80
  },
  
  rateAnalysis: {
    currentRate: 'E-TOU-C',
    effectiveRate: 0.32,
    peakHoursUsage: 28,
    offPeakUsage: 72,
    touOptimizationScore: 85
  },
  
  projections: [
    { year: 2024, savings: 2845, cumulativeSavings: 2845 },
    { year: 2025, savings: 2920, cumulativeSavings: 5765 },
    { year: 2026, savings: 2890, cumulativeSavings: 8655 },
    { year: 2027, savings: 2875, cumulativeSavings: 11530 },
    { year: 2028, savings: 2860, cumulativeSavings: 14390 },
    { year: 2029, savings: 2840, cumulativeSavings: 17230 },
    { year: 2030, savings: 2825, cumulativeSavings: 20055 }
  ]
};

const COLORS = {
  production: '#22c55e',
  consumption: '#3b82f6',
  import: '#ef4444',
  export: '#f59e0b',
  savings: '#10b981',
  bill: '#6366f1'
};

export default function NetMeteringSavingsDashboard() {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'savings' | 'production' | 'consumption'>('savings');
  const [comparisonMode, setComparisonMode] = useState<'current' | 'projected'>('current');
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const exportData = () => {
    // Export functionality
    const data = JSON.stringify(mockSavingsData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'net-metering-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTimeRangeData = () => {
    switch (timeRange) {
      case 'quarter':
        return mockSavingsData.monthlyData.slice(-3);
      case 'year':
        return mockSavingsData.monthlyData;
      default:
        return mockSavingsData.monthlyData.slice(-1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sun className="h-8 w-8 text-yellow-500" />
            Net Metering Savings Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your solar savings, production, and net metering credits in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Savings</p>
                <p className="text-2xl font-bold text-green-800">
                  ${mockSavingsData.summary.totalSavings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">This year</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Monthly Savings</p>
                <p className="text-2xl font-bold text-blue-800">
                  ${mockSavingsData.summary.monthlySavings}
                </p>
                <p className="text-xs text-blue-600">Average</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Bill Reduction</p>
                <p className="text-2xl font-bold text-purple-800">
                  {mockSavingsData.summary.savingsPercent}%
                </p>
                <p className="text-xs text-purple-600">vs pre-solar</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">System Payback</p>
                <p className="text-2xl font-bold text-orange-800">
                  {mockSavingsData.summary.systemPayback} yrs
                </p>
                <p className="text-xs text-orange-600">Estimated</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Metering Policy Status */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">
          Net Metering Status - {mockSavingsData.nemPolicy.name}
          {mockSavingsData.nemPolicy.grandfathered && (
            <Badge className="ml-2" variant="secondary">Grandfathered</Badge>
          )}
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          Your system is enrolled in {mockSavingsData.nemPolicy.name} with {mockSavingsData.nemPolicy.compensationRate} compensation. 
          Protection expires on {mockSavingsData.nemPolicy.expirationDate}.
        </AlertDescription>
      </Alert>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Detail</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="true-up">True-Up</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Savings Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={mockSavingsData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          `$${value}`,
                          name === 'savings' ? 'Savings' : 'Bill'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke={COLORS.savings}
                        strokeWidth={2}
                        dot={{ fill: COLORS.savings }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bill"
                        stroke={COLORS.bill}
                        strokeWidth={2}
                        dot={{ fill: COLORS.bill }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Energy Flow Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Energy Flow Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={mockSavingsData.monthlyData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="production" fill={COLORS.production} name="Production" />
                      <Bar dataKey="consumption" fill={COLORS.consumption} name="Consumption" />
                      <Bar dataKey="export" fill={COLORS.export} name="Export" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Self Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                  <p className="text-sm text-gray-600">
                    You use 78% of your solar production directly
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grid Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">22%</span>
                  </div>
                  <Progress value={22} className="h-2" />
                  <p className="text-sm text-gray-600">
                    22% of production exported for credits
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">TOU Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">85/100</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-sm text-gray-600">
                    Good alignment with TOU periods
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Environmental Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-500" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {mockSavingsData.summary.environmentalImpact.co2Avoided.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">lbs CO₂ Avoided</div>
                  <p className="text-xs text-gray-500 mt-1">This year</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {mockSavingsData.summary.environmentalImpact.treesEquivalent}
                  </div>
                  <div className="text-sm text-gray-600">Trees Planted Equivalent</div>
                  <p className="text-xs text-gray-500 mt-1">Environmental benefit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Detail Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Detail</CardTitle>
              <CardDescription>
                Detailed breakdown of production, consumption, and savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Production</th>
                      <th className="text-right p-2">Consumption</th>
                      <th className="text-right p-2">Import</th>
                      <th className="text-right p-2">Export</th>
                      <th className="text-right p-2">Bill</th>
                      <th className="text-right p-2">Savings</th>
                      <th className="text-right p-2">NEM Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSavingsData.monthlyData.map((month, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{month.month} {month.year}</td>
                        <td className="p-2 text-right text-green-600">{month.production} kWh</td>
                        <td className="p-2 text-right text-blue-600">{month.consumption} kWh</td>
                        <td className="p-2 text-right text-red-600">{month.import} kWh</td>
                        <td className="p-2 text-right text-orange-600">{month.export} kWh</td>
                        <td className={`p-2 text-right font-medium ${month.bill < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          ${Math.abs(month.bill).toFixed(2)}{month.bill < 0 && ' Credit'}
                        </td>
                        <td className="p-2 text-right font-medium text-green-600">
                          ${month.savings.toFixed(2)}
                        </td>
                        <td className="p-2 text-right text-purple-600">
                          ${month.netMetering.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Production vs Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockSavingsData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="production"
                        stackId="1"
                        stroke={COLORS.production}
                        fill={COLORS.production}
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="consumption"
                        stackId="2"
                        stroke={COLORS.consumption}
                        fill={COLORS.consumption}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>System Performance</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <Progress value={94} />
                  <p className="text-sm text-gray-600 mt-1">
                    Performing above expected levels
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Capacity Factor</span>
                    <span className="font-medium">18.2%</span>
                  </div>
                  <Progress value={18.2} />
                  <p className="text-sm text-gray-600 mt-1">
                    Good for your location and system orientation
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Weather Impact</span>
                    <span className="font-medium">+5%</span>
                  </div>
                  <Progress value={55} />
                  <p className="text-sm text-gray-600 mt-1">
                    Favorable weather conditions this period
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Pattern</CardTitle>
              <CardDescription>
                Understanding your system's seasonal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockSavingsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="production" fill={COLORS.production} name="Production (kWh)" />
                    <Line yAxisId="right" type="monotone" dataKey="savings" stroke={COLORS.savings} strokeWidth={2} name="Savings ($)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* True-Up Tab */}
        <TabsContent value="true-up" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">True-Up Period Status</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your true-up period runs from April to March. Current status shows your accumulated position.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mockSavingsData.trueUpSummary.totalProduction.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Production (kWh)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mockSavingsData.trueUpSummary.totalConsumption.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Consumption (kWh)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {mockSavingsData.trueUpSummary.netUsage.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Net Usage (kWh)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${mockSavingsData.trueUpSummary.carryoverCredit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${mockSavingsData.trueUpSummary.carryoverCredit}
                </div>
                <div className="text-sm text-gray-600">Credit Balance</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>True-Up Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Energy Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Annual Production:</span>
                        <span className="font-medium">{mockSavingsData.trueUpSummary.totalProduction.toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Consumption:</span>
                        <span className="font-medium">{mockSavingsData.trueUpSummary.totalConsumption.toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Grid Usage:</span>
                        <span className="font-medium">{mockSavingsData.trueUpSummary.netUsage.toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Self Consumption Rate:</span>
                        <span className="font-medium">
                          {Math.round(((mockSavingsData.trueUpSummary.totalProduction - (mockSavingsData.trueUpSummary.totalConsumption - mockSavingsData.trueUpSummary.netUsage)) / mockSavingsData.trueUpSummary.totalProduction) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Financial Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>True-Up Bill:</span>
                        <span className="font-medium">${mockSavingsData.trueUpSummary.finalBill}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Excess Generation:</span>
                        <span className="font-medium">{mockSavingsData.trueUpSummary.excessGeneration} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Carryover:</span>
                        <span className="font-medium text-green-600">${mockSavingsData.trueUpSummary.carryoverCredit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Annual Savings:</span>
                        <span className="font-medium text-green-600">${mockSavingsData.summary.totalSavings}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {mockSavingsData.trueUpSummary.carryoverCredit > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <Award className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Excellent Performance!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      You have a credit balance of ${mockSavingsData.trueUpSummary.carryoverCredit} carrying forward to next year. 
                      Your system is performing better than expected.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Long-term Savings Projection</CardTitle>
              <CardDescription>
                Estimated savings over the next 6 years based on current performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={mockSavingsData.projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `$${value.toLocaleString()}`,
                        name === 'savings' ? 'Annual Savings' : 'Cumulative Savings'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke={COLORS.savings}
                      strokeWidth={2}
                      name="Annual Savings"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeSavings"
                      stroke={COLORS.bill}
                      strokeWidth={2}
                      name="Cumulative Savings"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projection Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Annual rate escalation:</span>
                    <span className="font-medium">3.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System degradation:</span>
                    <span className="font-medium">0.5% per year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NEM policy:</span>
                    <span className="font-medium">Grandfathered until 2043</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage growth:</span>
                    <span className="font-medium">1% per year</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>System payback:</span>
                    <span className="font-medium">{mockSavingsData.summary.systemPayback} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10-year savings:</span>
                    <span className="font-medium text-green-600">$32,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>25-year savings:</span>
                    <span className="font-medium text-green-600">$78,900</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NEM protection expires:</span>
                    <span className="font-medium">2043</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Projection Disclaimer</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Projections are estimates based on current performance and assumptions. 
              Actual results may vary due to weather, policy changes, equipment performance, and usage patterns.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}