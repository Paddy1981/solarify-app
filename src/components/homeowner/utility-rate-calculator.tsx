'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  Battery, 
  Clock, 
  DollarSign,
  Info,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

// Mock data for demonstration - would come from the engines
const mockUtilityRates = [
  {
    id: 'pge-etou-c',
    name: 'PG&E E-TOU-C',
    utility: 'Pacific Gas & Electric',
    type: 'Time-of-Use',
    solarFriendly: true,
    estimatedCost: 2400
  },
  {
    id: 'pge-e1',
    name: 'PG&E E-1 Residential',
    utility: 'Pacific Gas & Electric', 
    type: 'Tiered',
    solarFriendly: false,
    estimatedCost: 2800
  },
  {
    id: 'pge-ev2-a',
    name: 'PG&E EV2-A',
    utility: 'Pacific Gas & Electric',
    type: 'Time-of-Use EV',
    solarFriendly: true,
    estimatedCost: 2200
  }
];

const mockNEMPolicies = [
  {
    id: 'nem-30',
    name: 'NEM 3.0',
    version: '3.0',
    effective: '2023-04-15',
    compensation: 'Avoided Cost (~$0.08/kWh)',
    gridBenefitsCharge: '$8.84/kW/month'
  },
  {
    id: 'nem-20',
    name: 'NEM 2.0 (Grandfathered)',
    version: '2.0', 
    effective: '2016-07-01',
    compensation: 'Retail Rate (~$0.30/kWh)',
    gridBenefitsCharge: 'None'
  }
];

interface UtilityRateCalculatorProps {
  systemCapacity?: number;
  hasExistingSystem?: boolean;
  installationDate?: Date;
}

export function UtilityRateCalculator({ 
  systemCapacity = 0, 
  hasExistingSystem = false,
  installationDate
}: UtilityRateCalculatorProps) {
  const [formData, setFormData] = useState({
    zipCode: '',
    utilityCompany: '',
    averageMonthlyBill: '',
    averageMonthlyUsage: '',
    customerClass: 'residential',
    hasSolar: hasExistingSystem,
    solarCapacity: systemCapacity.toString(),
    hasEV: false,
    hasBattery: false,
    batteryCapacity: ''
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState('');
  const [selectedNEMPolicy, setSelectedNEMPolicy] = useState('');

  const handleCalculate = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock results
    setResults({
      currentBill: {
        monthly: 280,
        annual: 3360
      },
      withSolar: {
        monthly: 45,
        annual: 540,
        savings: 2820,
        paybackPeriod: 8.5
      },
      rateComparison: mockUtilityRates.map(rate => ({
        ...rate,
        monthlySavings: Math.floor(Math.random() * 200) + 50,
        annualSavings: Math.floor(Math.random() * 2000) + 600,
        recommendationScore: Math.floor(Math.random() * 30) + 70
      })),
      nemAnalysis: {
        currentPolicy: 'NEM 3.0',
        grandfathered: installationDate && installationDate < new Date('2023-04-15'),
        monthlyGridBenefitsCharge: systemCapacity * 8.84,
        exportCompensation: 0.08,
        estimatedAnnualExport: systemCapacity * 400
      },
      batteryOptimization: formData.hasBattery ? {
        recommendedCapacity: 20,
        annualSavings: 800,
        chargingSchedule: '11:00 PM - 6:00 AM',
        dischargingSchedule: '4:00 PM - 9:00 PM'
      } : null
    });

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Utility Rate Calculator
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Analyze your utility rates, optimize your solar savings, and find the best rate schedule for your home
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Rate Calculator</TabsTrigger>
          <TabsTrigger value="comparison">Rate Comparison</TabsTrigger>
          <TabsTrigger value="nem-analysis">NEM Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Rate Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Enter your location and usage details for accurate analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location */}
                <div className="space-y-4">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="94105"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utility">Utility Company</Label>
                      <Select 
                        value={formData.utilityCompany}
                        onValueChange={(value) => handleInputChange('utilityCompany', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select utility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pge">Pacific Gas & Electric</SelectItem>
                          <SelectItem value="sce">Southern California Edison</SelectItem>
                          <SelectItem value="sdge">San Diego Gas & Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerClass">Customer Class</Label>
                    <Select 
                      value={formData.customerClass}
                      onValueChange={(value) => handleInputChange('customerClass', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Usage Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Usage</h4>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyBill">Average Monthly Bill ($)</Label>
                      <Input
                        id="monthlyBill"
                        type="number"
                        placeholder="280"
                        value={formData.averageMonthlyBill}
                        onChange={(e) => handleInputChange('averageMonthlyBill', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyUsage">Average Monthly Usage (kWh)</Label>
                      <Input
                        id="monthlyUsage"
                        type="number"
                        placeholder="850"
                        value={formData.averageMonthlyUsage}
                        onChange={(e) => handleInputChange('averageMonthlyUsage', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Solar System */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Solar System</h4>
                    <Switch 
                      checked={formData.hasSolar}
                      onCheckedChange={(checked) => handleInputChange('hasSolar', checked)}
                    />
                  </div>
                  
                  {formData.hasSolar && (
                    <div className="space-y-2">
                      <Label htmlFor="solarCapacity">System Capacity (kW)</Label>
                      <Input
                        id="solarCapacity"
                        type="number"
                        placeholder="8.5"
                        value={formData.solarCapacity}
                        onChange={(e) => handleInputChange('solarCapacity', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Additional Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Electric Vehicle</Label>
                      <p className="text-sm text-gray-500">Do you have or plan to get an EV?</p>
                    </div>
                    <Switch 
                      checked={formData.hasEV}
                      onCheckedChange={(checked) => handleInputChange('hasEV', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Battery Storage</Label>
                      <p className="text-sm text-gray-500">Do you have battery storage?</p>
                    </div>
                    <Switch 
                      checked={formData.hasBattery}
                      onCheckedChange={(checked) => handleInputChange('hasBattery', checked)}
                    />
                  </div>

                  {formData.hasBattery && (
                    <div className="space-y-2">
                      <Label htmlFor="batteryCapacity">Battery Capacity (kWh)</Label>
                      <Input
                        id="batteryCapacity"
                        type="number"
                        placeholder="20"
                        value={formData.batteryCapacity}
                        onChange={(e) => handleInputChange('batteryCapacity', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCalculate}
                  disabled={loading || !formData.zipCode || !formData.utilityCompany}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Savings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Cost Analysis
                  </CardTitle>
                  <CardDescription>
                    Your current costs vs. potential savings with solar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Bill */}
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">Current Annual Bill</p>
                    <p className="text-3xl font-bold text-red-800">
                      ${results.currentBill.annual.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-600">
                      ${results.currentBill.monthly}/month average
                    </p>
                  </div>

                  {formData.hasSolar && (
                    <>
                      {/* With Solar */}
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 font-medium">Annual Bill with Solar</p>
                        <p className="text-3xl font-bold text-green-800">
                          ${results.withSolar.annual.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">
                          ${results.withSolar.monthly}/month average
                        </p>
                      </div>

                      {/* Savings */}
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">Annual Savings</p>
                        <p className="text-3xl font-bold text-blue-800">
                          ${results.withSolar.savings.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <TrendingDown className="h-4 w-4 text-blue-600" />
                          <p className="text-sm text-blue-600">
                            {Math.round((results.withSolar.savings / results.currentBill.annual) * 100)}% reduction
                          </p>
                        </div>
                      </div>

                      {/* Payback Period */}
                      <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-700 font-medium">Payback Period</p>
                        <p className="text-2xl font-bold text-amber-800">
                          {results.withSolar.paybackPeriod} years
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Rate Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {results ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Rate Schedule Comparison
                </CardTitle>
                <CardDescription>
                  Compare different utility rate schedules available in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.rateComparison.map((rate: any, index: number) => (
                    <div key={rate.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{rate.name}</h4>
                          <p className="text-sm text-gray-600">{rate.utility}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {rate.solarFriendly && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Solar Friendly
                            </Badge>
                          )}
                          <Badge variant="outline">{rate.type}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Estimated Annual Cost</p>
                          <p className="font-semibold">${rate.estimatedCost.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Annual Savings</p>
                          <p className="font-semibold text-green-600">
                            ${rate.annualSavings.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Recommendation Score</p>
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={rate.recommendationScore} className="w-16" />
                            <span className="text-sm font-medium">{rate.recommendationScore}</span>
                          </div>
                        </div>
                      </div>

                      {index === 0 && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Recommended Rate</AlertTitle>
                          <AlertDescription>
                            This rate schedule offers the best value for your usage profile and solar system.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Run the rate calculator first to see comparison results
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* NEM Analysis Tab */}
        <TabsContent value="nem-analysis" className="space-y-6">
          {results && formData.hasSolar ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Net Energy Metering Status
                  </CardTitle>
                  <CardDescription>
                    Your current NEM policy and grandfathering status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {results.nemAnalysis.grandfathered ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Grandfathered Status</AlertTitle>
                        <AlertDescription>
                          Your system is grandfathered under NEM 2.0 with retail rate compensation.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>NEM 3.0 Policy</AlertTitle>
                        <AlertDescription>
                          Your system follows the current NEM 3.0 policy with avoided cost compensation.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Export Compensation</p>
                        <p className="font-semibold">
                          ${results.nemAnalysis.exportCompensation}/kWh
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Estimated Annual Export</p>
                        <p className="font-semibold">
                          {results.nemAnalysis.estimatedAnnualExport.toLocaleString()} kWh
                        </p>
                      </div>
                    </div>

                    {!results.nemAnalysis.grandfathered && (
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-700">Monthly Grid Benefits Charge</p>
                        <p className="font-semibold text-amber-800">
                          ${results.nemAnalysis.monthlyGridBenefitsCharge.toFixed(2)}
                        </p>
                        <p className="text-xs text-amber-600">
                          Based on {formData.solarCapacity} kW system capacity
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Available NEM Policies
                  </CardTitle>
                  <CardDescription>
                    Current and historical net metering policies in your area
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockNEMPolicies.map(policy => (
                    <div key={policy.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{policy.name}</h4>
                        {policy.id === 'nem-30' && !results.nemAnalysis.grandfathered && (
                          <Badge>Current</Badge>
                        )}
                        {policy.id === 'nem-20' && results.nemAnalysis.grandfathered && (
                          <Badge variant="secondary">Grandfathered</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Effective:</span> {policy.effective}</p>
                        <p><span className="font-medium">Compensation:</span> {policy.compensation}</p>
                        <p><span className="font-medium">Grid Benefits Charge:</span> {policy.gridBenefitsCharge}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {!formData.hasSolar ? 
                    'Enable solar system to see NEM analysis' :
                    'Run the rate calculator first to see NEM analysis'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          {results ? (
            <div className="space-y-6">
              {/* Battery Optimization */}
              {results.batteryOptimization && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="h-5 w-5 text-green-600" />
                      Battery Storage Optimization
                    </CardTitle>
                    <CardDescription>
                      Optimize your battery operation for maximum savings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">Recommended Capacity</p>
                        <p className="text-2xl font-bold text-green-800">
                          {results.batteryOptimization.recommendedCapacity} kWh
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">Annual Savings</p>
                        <p className="text-2xl font-bold text-blue-800">
                          ${results.batteryOptimization.annualSavings.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Optimal Charging Schedule</p>
                          <p className="text-sm text-gray-600">
                            {results.batteryOptimization.chargingSchedule} (Off-peak rates)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">Optimal Discharging Schedule</p>
                          <p className="text-sm text-gray-600">
                            {results.batteryOptimization.dischargingSchedule} (Peak rates)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* General Optimization Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Optimization Recommendations
                  </CardTitle>
                  <CardDescription>
                    Smart strategies to maximize your solar savings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Load Shifting</h4>
                      <p className="text-sm text-gray-600">
                        Run energy-intensive appliances during off-peak hours (11 PM - 6 AM) to save up to 40% on those loads.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Self-Consumption</h4>
                      <p className="text-sm text-gray-600">
                        Maximize daytime energy usage when your solar system is producing to reduce grid dependency.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-800">Rate Schedule</h4>
                      <p className="text-sm text-gray-600">
                        Switch to a Time-of-Use rate to take advantage of lower off-peak pricing and higher solar export values.
                      </p>
                    </div>

                    {formData.hasEV && (
                      <div className="border-l-4 border-indigo-500 pl-4">
                        <h4 className="font-semibold text-indigo-800">EV Charging</h4>
                        <p className="text-sm text-gray-600">
                          Charge your electric vehicle during off-peak hours or directly from solar during the day for maximum savings.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Run the rate calculator first to see optimization recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}