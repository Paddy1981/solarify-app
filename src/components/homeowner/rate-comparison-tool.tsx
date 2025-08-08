'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, 
  TrendingDown,
  Zap, 
  DollarSign,
  Clock,
  Info,
  CheckCircle,
  AlertCircle,
  Star,
  Battery,
  Car,
  Home,
  BarChart3,
  PieChart,
  Calculator,
  Lightbulb,
  ArrowRight,
  Shield,
  Calendar
} from 'lucide-react';

// Mock data for rate comparison - would come from the rate optimization engine
const mockRateComparison = {
  currentRate: {
    id: 'pge-e1',
    name: 'PG&E E-1 Residential',
    utility: 'Pacific Gas & Electric',
    type: 'Tiered',
    description: 'Traditional tiered residential rate',
    annualCost: 3240,
    monthlyCost: 270,
    solarFriendly: false,
    suitabilityScore: 65,
    pros: ['Simple billing structure', 'No time-of-use complexity'],
    cons: ['Higher rates for solar customers', 'No TOU optimization'],
    rateStructure: {
      tier1: { threshold: 300, rate: 0.25 },
      tier2: { threshold: 400, rate: 0.32 },
      tier3: { threshold: 999999, rate: 0.42 }
    }
  },
  recommendedRates: [
    {
      id: 'pge-etou-c',
      name: 'PG&E E-TOU-C',
      utility: 'Pacific Gas & Electric',
      type: 'Time-of-Use',
      description: 'Time-of-use rate optimized for solar',
      annualCost: 2680,
      monthlyCost: 223,
      annualSavings: 560,
      savingsPercent: 17.3,
      solarFriendly: true,
      suitabilityScore: 92,
      recommended: true,
      pros: [
        'Lower off-peak rates for charging EVs/batteries',
        'Better compensation for solar exports',
        'Peak rate periods align with solar production'
      ],
      cons: [
        'Requires attention to usage timing',
        'Higher peak rates (4-9 PM weekdays)'
      ],
      rateStructure: {
        offPeak: { hours: '11 PM - 3 PM', rate: 0.28 },
        peak: { hours: '4 PM - 9 PM', rate: 0.46 }
      },
      requirements: ['Smart meter required', 'Minimum 12-month commitment']
    },
    {
      id: 'pge-ev2-a',
      name: 'PG&E EV2-A',
      utility: 'Pacific Gas & Electric',
      type: 'Time-of-Use EV',
      description: 'Special rate for electric vehicle owners',
      annualCost: 2520,
      monthlyCost: 210,
      annualSavings: 720,
      savingsPercent: 22.2,
      solarFriendly: true,
      suitabilityScore: 88,
      eligibilityRequired: true,
      pros: [
        'Super off-peak rates for EV charging',
        'Great for solar + EV combination',
        'Significant savings potential'
      ],
      cons: [
        'Requires EV ownership',
        'Higher peak rates',
        'More complex rate structure'
      ],
      rateStructure: {
        superOffPeak: { hours: '11 PM - 7 AM', rate: 0.15 },
        offPeak: { hours: '7 AM - 3 PM', rate: 0.32 },
        peak: { hours: '3 PM - 12 AM', rate: 0.48 }
      },
      requirements: ['Electric vehicle required', 'Separate EV meter or sub-meter']
    },
    {
      id: 'pge-etou-d-prime',
      name: 'PG&E E-TOU-D-PRIME',
      utility: 'Pacific Gas & Electric',
      type: 'Time-of-Use Prime',
      description: 'Premium TOU rate for high-usage customers',
      annualCost: 2820,
      monthlyCost: 235,
      annualSavings: 420,
      savingsPercent: 13.0,
      solarFriendly: true,
      suitabilityScore: 78,
      pros: [
        'Lower baseline allocation',
        'Good for high-usage homes',
        'Solar export compensation'
      ],
      cons: [
        'Higher usage threshold required',
        'Complex tier structure'
      ],
      rateStructure: {
        offPeak: { hours: '10 PM - 4 PM', rate: 0.30 },
        peak: { hours: '4 PM - 9 PM', rate: 0.44 }
      },
      requirements: ['Historical usage > 700 kWh/month average']
    }
  ],
  customerProfile: {
    averageUsage: 850,
    peakUsage: 1200,
    hasEV: false,
    hasBattery: false,
    hasSolar: true,
    solarCapacity: 8.5,
    usagePattern: 'standard_residential'
  },
  optimizationOpportunities: [
    {
      type: 'rate_switch',
      title: 'Switch to E-TOU-C',
      savings: 560,
      description: 'Switch to time-of-use rate for better solar compensation',
      effort: 'low',
      timeframe: '1-2 weeks',
      impact: 'high'
    },
    {
      type: 'load_shifting',
      title: 'Shift Peak Usage',
      savings: 200,
      description: 'Move energy-intensive tasks to off-peak hours',
      effort: 'medium',
      timeframe: 'ongoing',
      impact: 'medium'
    },
    {
      type: 'battery_storage',
      title: 'Add Battery Storage',
      savings: 480,
      description: 'Store solar energy for use during peak hours',
      effort: 'high',
      timeframe: '2-3 months',
      impact: 'high'
    }
  ]
};

interface RateComparisonToolProps {
  customerId?: string;
  systemId?: string;
}

export function RateComparisonTool({ customerId, systemId }: RateComparisonToolProps) {
  const [data, setData] = useState(mockRateComparison);
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState(data.recommendedRates[0].id);
  const [showDetails, setShowDetails] = useState(false);

  const selectedRateData = data.recommendedRates.find(rate => rate.id === selectedRate) || data.recommendedRates[0];

  const handleRateSwitch = async (rateId: string) => {
    setLoading(true);
    // Simulate API call for rate switch
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    // Show success message or redirect
    alert(`Rate switch request submitted for ${data.recommendedRates.find(r => r.id === rateId)?.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Rate Comparison & Optimization
        </h2>
        <p className="text-lg text-gray-600">
          Compare utility rates and find the best option for your solar system and usage pattern
        </p>
      </div>

      {/* Current Rate Overview */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Your Current Rate
              </CardTitle>
              <CardDescription>{data.currentRate.name}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">
              Current
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Monthly Cost</p>
              <p className="text-2xl font-bold text-blue-800">${data.currentRate.monthlyCost}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Annual Cost</p>
              <p className="text-2xl font-bold text-blue-800">${data.currentRate.annualCost.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Solar Friendly</p>
              <p className="text-2xl font-bold">
                {data.currentRate.solarFriendly ? (
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Optimization Score</p>
              <div className="flex items-center justify-center gap-2">
                <Progress value={data.currentRate.suitabilityScore} className="w-16" />
                <span className="text-xl font-bold">{data.currentRate.suitabilityScore}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Rate Recommendations</TabsTrigger>
          <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Plan</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {data.recommendedRates.map((rate, index) => (
              <Card 
                key={rate.id} 
                className={`transition-all ${
                  rate.recommended ? 'border-2 border-green-500 bg-green-50' : 
                  selectedRate === rate.id ? 'border-2 border-blue-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{rate.name}</CardTitle>
                        {rate.recommended && (
                          <Badge className="bg-green-600">
                            <Star className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {rate.eligibilityRequired && (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Eligibility Required
                          </Badge>
                        )}
                        {rate.solarFriendly && (
                          <Badge variant="secondary">
                            <Zap className="h-3 w-3 mr-1" />
                            Solar Optimized
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{rate.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Suitability Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={rate.suitabilityScore} className="w-20" />
                        <span className="font-semibold">{rate.suitabilityScore}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cost Comparison */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600">Monthly Cost</p>
                      <p className="text-xl font-bold">${rate.monthlyCost}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600">Annual Cost</p>
                      <p className="text-xl font-bold">${rate.annualCost.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700">Annual Savings</p>
                      <p className="text-xl font-bold text-green-800">${rate.annualSavings.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">Savings Percent</p>
                      <p className="text-xl font-bold text-blue-800">{rate.savingsPercent}%</p>
                    </div>
                  </div>

                  {/* Rate Structure Preview */}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Rate Structure</h4>
                      <div className="space-y-2">
                        {Object.entries(rate.rateStructure).map(([period, info]: [string, any]) => (
                          <div key={period} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                            <span className="font-medium capitalize">{period.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="text-right">
                              <div className="font-semibold">${info.rate}</div>
                              {info.hours && <div className="text-xs text-gray-500">{info.hours}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {rate.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-sm text-green-800 mb-2">Advantages</h4>
                      <ul className="space-y-1">
                        {rate.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-amber-800 mb-2">Considerations</h4>
                      <ul className="space-y-1">
                        {rate.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedRate(rate.id)}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    <Button 
                      onClick={() => handleRateSwitch(rate.id)}
                      disabled={loading}
                      className={rate.recommended ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Switch to This Rate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best Choice Alert */}
          {data.recommendedRates[0].recommended && (
            <Alert className="border-green-200 bg-green-50">
              <Star className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Best Choice for Your Profile</AlertTitle>
              <AlertDescription className="text-green-700">
                Based on your usage pattern and solar system, <strong>{data.recommendedRates[0].name}</strong> offers 
                the highest savings potential of <strong>${data.recommendedRates[0].annualSavings}/year</strong> ({data.recommendedRates[0].savingsPercent}% reduction).
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Detailed Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Side-by-Side Comparison
              </CardTitle>
              <CardDescription>
                Detailed comparison of rate structures and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Rate Schedule</th>
                      <th className="text-right p-3">Monthly Cost</th>
                      <th className="text-right p-3">Annual Savings</th>
                      <th className="text-center p-3">Solar Friendly</th>
                      <th className="text-right p-3">Score</th>
                      <th className="text-center p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-blue-50">
                      <td className="p-3">
                        <div>
                          <div className="font-semibold">{data.currentRate.name}</div>
                          <div className="text-xs text-gray-500">Current Rate</div>
                        </div>
                      </td>
                      <td className="text-right p-3 font-medium">${data.currentRate.monthlyCost}</td>
                      <td className="text-right p-3 text-gray-500">-</td>
                      <td className="text-center p-3">
                        {data.currentRate.solarFriendly ? 
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> :
                          <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
                        }
                      </td>
                      <td className="text-right p-3 font-medium">{data.currentRate.suitabilityScore}</td>
                      <td className="text-center p-3">
                        <Badge variant="outline">Current</Badge>
                      </td>
                    </tr>
                    {data.recommendedRates.map(rate => (
                      <tr key={rate.id} className={`border-b hover:bg-gray-50 ${rate.recommended ? 'bg-green-50' : ''}`}>
                        <td className="p-3">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {rate.name}
                              {rate.recommended && <Star className="h-3 w-3 text-green-600" />}
                            </div>
                            <div className="text-xs text-gray-500">{rate.type}</div>
                          </div>
                        </td>
                        <td className="text-right p-3 font-medium">${rate.monthlyCost}</td>
                        <td className="text-right p-3 text-green-600 font-medium">
                          ${rate.annualSavings} ({rate.savingsPercent}%)
                        </td>
                        <td className="text-center p-3">
                          {rate.solarFriendly && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                        </td>
                        <td className="text-right p-3 font-medium">{rate.suitabilityScore}</td>
                        <td className="text-center p-3">
                          <Button size="sm" variant="outline">Switch</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Rate Structure Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Rate Structure Details
              </CardTitle>
              <CardDescription>
                Time-of-use periods and pricing for {selectedRateData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(selectedRateData.rateStructure).map(([period, info]: [string, any]) => (
                  <div key={period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold capitalize">
                        {period.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      {info.hours && (
                        <p className="text-sm text-gray-600">{info.hours}</p>
                      )}
                      {info.threshold && (
                        <p className="text-sm text-gray-600">Up to {info.threshold} kWh</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${info.rate}</p>
                      <p className="text-sm text-gray-500">per kWh</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Plan Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Optimization Opportunities
              </CardTitle>
              <CardDescription>
                Maximize your savings with these actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.optimizationOpportunities.map((opportunity, index) => (
                  <Card key={opportunity.type} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            opportunity.type === 'rate_switch' ? 'bg-green-100' :
                            opportunity.type === 'load_shifting' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            {opportunity.type === 'rate_switch' && <ArrowRight className="h-4 w-4 text-green-600" />}
                            {opportunity.type === 'load_shifting' && <Clock className="h-4 w-4 text-blue-600" />}
                            {opportunity.type === 'battery_storage' && <Battery className="h-4 w-4 text-purple-600" />}
                          </div>
                          <div>
                            <h4 className="font-semibold">{opportunity.title}</h4>
                            <p className="text-sm text-gray-600">{opportunity.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${opportunity.savings}/year
                          </p>
                          <Badge variant={
                            opportunity.impact === 'high' ? 'default' :
                            opportunity.impact === 'medium' ? 'secondary' : 'outline'
                          }>
                            {opportunity.impact} impact
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Effort Level</p>
                          <p className="capitalize">{opportunity.effort}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Timeframe</p>
                          <p>{opportunity.timeframe}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Priority</p>
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </div>

                      {index === 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <Button className="w-full">
                            Get Started with {opportunity.title}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertTitle>Total Savings Potential</AlertTitle>
                <AlertDescription>
                  By implementing all optimization opportunities, you could save up to{' '}
                  <strong>${data.optimizationOpportunities.reduce((sum, opp) => sum + opp.savings, 0)}/year</strong>{' '}
                  ({Math.round((data.optimizationOpportunities.reduce((sum, opp) => sum + opp.savings, 0) / data.currentRate.annualCost) * 100)}% reduction from current costs).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Implementation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Implementation Timeline
              </CardTitle>
              <CardDescription>
                Suggested order and timeline for implementing optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Switch to Optimal Rate (Weeks 1-2)</h4>
                    <p className="text-sm text-gray-600">
                      Contact your utility to switch to {data.recommendedRates[0].name}. This provides immediate savings with minimal effort.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+${data.optimizationOpportunities[0].savings}/year</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Optimize Usage Patterns (Month 1)</h4>
                    <p className="text-sm text-gray-600">
                      Adjust your energy usage to take advantage of off-peak rates. Use timers for major appliances.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">+${data.optimizationOpportunities[1].savings}/year</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Consider Battery Storage (Months 2-4)</h4>
                    <p className="text-sm text-gray-600">
                      Evaluate battery storage options to maximize the value of your solar system and provide backup power.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">+${data.optimizationOpportunities[2].savings}/year</p>
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