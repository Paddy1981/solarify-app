'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  DollarSign,
  Calendar,
  Clock,
  Info,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Battery,
  Home,
  Grid3x3,
  ArrowUpDown,
  Lightbulb,
  Calculator
} from 'lucide-react';

// Mock data for demonstration - would come from the net metering engine
const mockNETMeteringData = {
  systemInfo: {
    capacity: 8.5,
    installationDate: '2022-03-15',
    nemPolicy: 'NEM 2.0',
    grandfathered: true,
    expirationDate: '2042-03-15'
  },
  currentMonth: {
    production: 1245,
    consumption: 890,
    gridImport: 156,
    gridExport: 511,
    netUsage: -355,
    credits: 153.30,
    charges: 45.20,
    netBill: -108.10
  },
  trueUpPeriod: {
    startDate: '2024-03-15',
    endDate: '2025-03-14',
    daysRemaining: 187,
    progressPercent: 49,
    cumulativeNetUsage: -2156,
    cumulativeCredits: 647.10,
    estimatedTrueUpBill: -425.60
  },
  monthlyBreakdown: [
    { month: 'Jan 2024', production: 856, consumption: 920, netUsage: 64, bill: 32.15 },
    { month: 'Feb 2024', production: 1102, consumption: 850, netUsage: -252, bill: -75.60 },
    { month: 'Mar 2024', production: 1380, consumption: 890, netUsage: -490, bill: -147.00 },
    { month: 'Apr 2024', production: 1456, consumption: 845, netUsage: -611, bill: -183.30 },
    { month: 'May 2024', production: 1523, consumption: 920, netUsage: -603, bill: -180.90 },
    { month: 'Jun 2024', production: 1498, consumption: 1050, netUsage: -448, bill: -134.40 },
    { month: 'Jul 2024', production: 1445, consumption: 1180, netUsage: -265, bill: -79.50 },
    { month: 'Aug 2024', production: 1356, consumption: 1200, netUsage: -156, bill: -46.80 },
    { month: 'Sep 2024', production: 1245, consumption: 890, netUsage: -355, bill: -106.50 }
  ],
  rateBreakdown: {
    energyRate: 0.30,
    exportRate: 0.30,
    fixedCharges: 10.25,
    nonBypassableCharges: 18.45,
    gridBenefitsCharge: 0 // NEM 2.0 grandfathered
  },
  projections: {
    annualProduction: 16500,
    annualConsumption: 12000,
    projectedSavings: 1850,
    paybackProgress: 68
  }
};

interface NetMeteringDashboardProps {
  systemId?: string;
  customerId?: string;
}

export function NetMeteringDashboard({ systemId, customerId }: NetMeteringDashboardProps) {
  const [data, setData] = useState(mockNETMeteringData);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // Calculate percentage values for the current month
  const selfConsumptionRate = Math.round(
    ((data.currentMonth.production - data.currentMonth.gridExport) / data.currentMonth.production) * 100
  );
  
  const gridIndependence = Math.round(
    ((data.currentMonth.consumption - data.currentMonth.gridImport) / data.currentMonth.consumption) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">
            Net Metering Dashboard
          </h2>
          <Badge variant={data.systemInfo.grandfathered ? "secondary" : "default"}>
            {data.systemInfo.nemPolicy} {data.systemInfo.grandfathered && "(Grandfathered)"}
          </Badge>
        </div>
        <p className="text-lg text-gray-600">
          Track your solar production, consumption, and net metering credits
        </p>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Capacity</p>
                <p className="text-2xl font-bold">{data.systemInfo.capacity} kW</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Net Bill</p>
                <p className={`text-2xl font-bold ${data.currentMonth.netBill < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(data.currentMonth.netBill).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.currentMonth.netBill < 0 ? 'Credit' : 'Owed'}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${data.currentMonth.netBill < 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Self-Consumption</p>
                <p className="text-2xl font-bold">{selfConsumptionRate}%</p>
                <Progress value={selfConsumptionRate} className="w-full mt-1" />
              </div>
              <Home className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Grid Independence</p>
                <p className="text-2xl font-bold">{gridIndependence}%</p>
                <Progress value={gridIndependence} className="w-full mt-1" />
              </div>
              <Grid3x3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Period</TabsTrigger>
          <TabsTrigger value="true-up">True-Up Status</TabsTrigger>
          <TabsTrigger value="history">Historical Data</TabsTrigger>
          <TabsTrigger value="analysis">Bill Analysis</TabsTrigger>
        </TabsList>

        {/* Current Period Tab */}
        <TabsContent value="current" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Energy Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Monthly Energy Flow
                </CardTitle>
                <CardDescription>
                  Current month production, consumption, and grid interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Production */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Zap className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Solar Production</p>
                        <p className="text-sm text-gray-600">Energy generated by your system</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{data.currentMonth.production.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">kWh</p>
                    </div>
                  </div>

                  {/* Consumption */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Home className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Home Consumption</p>
                        <p className="text-sm text-gray-600">Total energy used by your home</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{data.currentMonth.consumption.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">kWh</p>
                    </div>
                  </div>

                  {/* Grid Export */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Grid Export</p>
                        <p className="text-sm text-gray-600">Excess energy sent to grid</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{data.currentMonth.gridExport.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">kWh</p>
                    </div>
                  </div>

                  {/* Grid Import */}
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Grid Import</p>
                        <p className="text-sm text-gray-600">Energy purchased from grid</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{data.currentMonth.gridImport.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">kWh</p>
                    </div>
                  </div>
                </div>

                {/* Net Usage Summary */}
                <Separator />
                <div className={`text-center p-4 rounded-lg ${
                  data.currentMonth.netUsage < 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                } border`}>
                  <p className="text-sm font-medium text-gray-700">Net Energy Usage</p>
                  <p className={`text-2xl font-bold ${
                    data.currentMonth.netUsage < 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {Math.abs(data.currentMonth.netUsage).toLocaleString()} kWh
                  </p>
                  <p className="text-sm text-gray-600">
                    {data.currentMonth.netUsage < 0 ? 'Net Export' : 'Net Import'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bill Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Bill Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your current month's bill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Fixed Charges */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fixed Charges</span>
                    <span className="font-medium">${data.rateBreakdown.fixedCharges.toFixed(2)}</span>
                  </div>

                  {/* Non-Bypassable Charges */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Non-Bypassable Charges</span>
                    <span className="font-medium">${data.rateBreakdown.nonBypassableCharges.toFixed(2)}</span>
                  </div>

                  {/* Energy Charges */}
                  {data.currentMonth.netUsage > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Energy Charges</span>
                      <span className="font-medium text-red-600">
                        ${(data.currentMonth.netUsage * data.rateBreakdown.energyRate).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Export Credits</span>
                      <span className="font-medium text-green-600">
                        -${(Math.abs(data.currentMonth.netUsage) * data.rateBreakdown.exportRate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Grid Benefits Charge (NEM 3.0 only) */}
                  {data.rateBreakdown.gridBenefitsCharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grid Benefits Charge</span>
                      <span className="font-medium">${data.rateBreakdown.gridBenefitsCharge.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Net Amount</span>
                    <span className={data.currentMonth.netBill < 0 ? 'text-green-600' : 'text-red-600'}>
                      ${Math.abs(data.currentMonth.netBill).toFixed(2)}
                      {data.currentMonth.netBill < 0 && ' Credit'}
                    </span>
                  </div>
                </div>

                {data.systemInfo.grandfathered && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Grandfathered Benefits</AlertTitle>
                    <AlertDescription>
                      You receive full retail rate credit (${data.rateBreakdown.exportRate}/kWh) for exported energy 
                      and have no Grid Benefits Charge until {data.systemInfo.expirationDate}.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* True-Up Status Tab */}
        <TabsContent value="true-up" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  True-Up Period Progress
                </CardTitle>
                <CardDescription>
                  Your annual net metering settlement period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium">
                    {data.trueUpPeriod.startDate} to {data.trueUpPeriod.endDate}
                  </p>
                  <div className="mt-2">
                    <Progress value={data.trueUpPeriod.progressPercent} className="w-full" />
                    <p className="text-sm text-purple-600 mt-1">
                      {data.trueUpPeriod.progressPercent}% Complete ({data.trueUpPeriod.daysRemaining} days remaining)
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Cumulative Net Usage</span>
                    <span className={`font-bold ${
                      data.trueUpPeriod.cumulativeNetUsage < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.trueUpPeriod.cumulativeNetUsage.toLocaleString()} kWh
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Cumulative Credits</span>
                    <span className="font-bold text-green-600">
                      ${data.trueUpPeriod.cumulativeCredits.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="font-medium">Estimated True-Up Bill</span>
                    <span className={`font-bold ${
                      data.trueUpPeriod.estimatedTrueUpBill < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(data.trueUpPeriod.estimatedTrueUpBill).toFixed(2)}
                      {data.trueUpPeriod.estimatedTrueUpBill < 0 && ' Credit'}
                    </span>
                  </div>
                </div>

                {data.trueUpPeriod.estimatedTrueUpBill < 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Projected Credit Balance</AlertTitle>
                    <AlertDescription>
                      Based on current trends, you're on track for a credit balance at your true-up. 
                      Excess credits may be paid out or carried forward depending on your utility's policy.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Projected Balance Due</AlertTitle>
                    <AlertDescription>
                      You may owe money at your true-up. Consider increasing self-consumption 
                      or reducing overall usage to minimize the balance due.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Annual Projections
                </CardTitle>
                <CardDescription>
                  Projected annual performance and savings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">Projected Annual Production</p>
                    <p className="text-xl font-bold text-yellow-800">
                      {data.projections.annualProduction.toLocaleString()} kWh
                    </p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Projected Annual Consumption</p>
                    <p className="text-xl font-bold text-blue-800">
                      {data.projections.annualConsumption.toLocaleString()} kWh
                    </p>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Projected Annual Savings</p>
                    <p className="text-xl font-bold text-green-800">
                      ${data.projections.projectedSavings.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Payback Progress</span>
                    <span className="text-sm font-medium">{data.projections.paybackProgress}%</span>
                  </div>
                  <Progress value={data.projections.paybackProgress} className="w-full" />
                  <p className="text-xs text-gray-500 text-center">
                    Estimated {Math.round((100 - data.projections.paybackProgress) / 12)} years remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Historical Data Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Monthly Performance History
              </CardTitle>
              <CardDescription>
                Track your solar system's performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Month</th>
                        <th className="text-right p-2">Production (kWh)</th>
                        <th className="text-right p-2">Consumption (kWh)</th>
                        <th className="text-right p-2">Net Usage (kWh)</th>
                        <th className="text-right p-2">Net Bill ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthlyBreakdown.map((month, index) => (
                        <tr key={month.month} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{month.month}</td>
                          <td className="text-right p-2">{month.production.toLocaleString()}</td>
                          <td className="text-right p-2">{month.consumption.toLocaleString()}</td>
                          <td className={`text-right p-2 font-medium ${
                            month.netUsage < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {month.netUsage.toLocaleString()}
                          </td>
                          <td className={`text-right p-2 font-medium ${
                            month.bill < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${Math.abs(month.bill).toFixed(2)}
                            {month.bill < 0 && ' CR'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bill Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Optimization Insights
                </CardTitle>
                <CardDescription>
                  Recommendations to maximize your solar savings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-800">Self-Consumption Rate: {selfConsumptionRate}%</h4>
                    <p className="text-sm text-blue-700">
                      {selfConsumptionRate < 70 ? 
                        'Consider shifting more usage to daytime hours when your solar is producing.' :
                        'Great job! You\'re using most of your solar production directly.'
                      }
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-800">Grid Independence: {gridIndependence}%</h4>
                    <p className="text-sm text-green-700">
                      {gridIndependence < 80 ?
                        'Adding battery storage could increase your grid independence and savings.' :
                        'Excellent! You\'re highly self-sufficient with your solar system.'
                      }
                    </p>
                  </div>

                  {data.systemInfo.grandfathered && (
                    <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                      <h4 className="font-semibold text-amber-800">Grandfathering Expires {data.systemInfo.expirationDate}</h4>
                      <p className="text-sm text-amber-700">
                        Plan for the transition to current net metering policies. Consider battery storage 
                        or system expansion before your grandfathering period ends.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Summary
                </CardTitle>
                <CardDescription>
                  Your solar investment performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Year-to-Date Savings</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${data.monthlyBreakdown.reduce((sum, month) => sum + Math.abs(month.bill), 0).toFixed(0)}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Average Monthly Savings</p>
                    <p className="text-2xl font-bold text-blue-800">
                      ${(data.monthlyBreakdown.reduce((sum, month) => sum + Math.abs(month.bill), 0) / data.monthlyBreakdown.length).toFixed(0)}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">Return on Investment</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {data.projections.paybackProgress}%
                    </p>
                    <Progress value={data.projections.paybackProgress} className="w-full mt-2" />
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Performance Summary</AlertTitle>
                  <AlertDescription>
                    Your solar system is performing {data.projections.paybackProgress > 60 ? 'excellently' : 'well'} 
                    and is on track to pay for itself within the expected timeframe. 
                    {data.projections.paybackProgress > 70 && ' You may achieve payback earlier than projected!'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}