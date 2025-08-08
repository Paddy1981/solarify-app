'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Zap, 
  DollarSign,
  TrendingDown,
  TrendingUp,
  Info,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Clock,
  Settings,
  Lightbulb,
  Battery,
  Home,
  Sun
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RateCalculatorState {
  // Location data
  zipCode: string;
  utilityCompany: string;
  customerClass: 'residential' | 'commercial' | 'industrial';
  
  // Usage data
  monthlyUsage: number; // kWh
  peakDemand: number; // kW
  usagePattern: 'flat' | 'peaked' | 'time_varying';
  
  // Solar system (optional)
  hasSolar: boolean;
  solarCapacity: number; // kW
  solarProduction: number; // kWh/month
  batteryCapacity: number; // kWh
  
  // Rate preferences
  preferredRateType: 'any' | 'flat' | 'tiered' | 'tou' | 'demand';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

interface CalculationResult {
  currentBill: {
    monthly: number;
    annual: number;
    breakdown: {
      energy: number;
      demand: number;
      fixed: number;
      taxes: number;
    };
  };
  
  optimizedBill: {
    monthly: number;
    annual: number;
    savings: number;
    savingsPercent: number;
    rateName: string;
  };
  
  recommendations: {
    bestRate: {
      id: string;
      name: string;
      description: string;
      pros: string[];
      cons: string[];
      estimatedSavings: number;
    };
    
    alternatives: Array<{
      id: string;
      name: string;
      estimatedCost: number;
      savings: number;
      suitabilityScore: number;
    }>;
    
    optimizations: Array<{
      type: 'load_shifting' | 'demand_reduction' | 'battery_storage' | 'solar_expansion';
      title: string;
      description: string;
      potentialSavings: number;
      implementationCost: number;
      paybackPeriod: number;
    }>;
  };
  
  analysis: {
    loadProfile: {
      pattern: string;
      flexibility: 'high' | 'medium' | 'low';
      peakHours: string[];
    };
    
    touOpportunity: {
      shiftablePeak: number; // % of peak usage that could be shifted
      offPeakCapacity: number; // Available off-peak capacity
      estimatedSavings: number;
    };
    
    solarImpact?: {
      selfConsumption: number; // %
      exportRate: number; // %
      netMeteringValue: number; // $/month
    };
  };
}

export default function InteractiveRateCalculator() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [calculatorState, setCalculatorState] = useState<RateCalculatorState>({
    zipCode: '',
    utilityCompany: '',
    customerClass: 'residential',
    monthlyUsage: 800,
    peakDemand: 5,
    usagePattern: 'peaked',
    hasSolar: false,
    solarCapacity: 0,
    solarProduction: 0,
    batteryCapacity: 0,
    preferredRateType: 'any',
    riskTolerance: 'moderate'
  });
  
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [availableUtilities, setAvailableUtilities] = useState<any[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Load available utilities when ZIP code changes
  useEffect(() => {
    if (calculatorState.zipCode.length === 5) {
      loadUtilities();
    }
  }, [calculatorState.zipCode]);

  const loadUtilities = async () => {
    try {
      const response = await fetch(`/api/utility-rates?action=providers&zipCode=${calculatorState.zipCode}`);
      const data = await response.json();
      if (data.success) {
        setAvailableUtilities(data.data);
        setErrors(prev => ({ ...prev, zipCode: '' }));
      }
    } catch (error) {
      console.error('Failed to load utilities:', error);
      setErrors(prev => ({ ...prev, zipCode: 'Unable to find utilities for this ZIP code' }));
    }
  };

  const handleInputChange = (field: keyof RateCalculatorState, value: any) => {
    setCalculatorState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (stepNumber) {
      case 1:
        if (!calculatorState.zipCode) newErrors.zipCode = 'ZIP code is required';
        if (!calculatorState.utilityCompany) newErrors.utilityCompany = 'Utility company is required';
        break;
      case 2:
        if (calculatorState.monthlyUsage <= 0) newErrors.monthlyUsage = 'Monthly usage must be positive';
        if (calculatorState.customerClass !== 'residential' && calculatorState.peakDemand <= 0) {
          newErrors.peakDemand = 'Peak demand is required for commercial customers';
        }
        break;
      case 3:
        if (calculatorState.hasSolar) {
          if (calculatorState.solarCapacity <= 0) newErrors.solarCapacity = 'Solar capacity must be positive';
          if (calculatorState.solarProduction <= 0) newErrors.solarProduction = 'Solar production must be positive';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateRates = async () => {
    if (!validateStep(4)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/utility-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          ...calculatorState,
          usageData: generateUsageData(),
          systemSpecs: calculatorState.hasSolar ? {
            solarCapacity: calculatorState.solarCapacity,
            batteryCapacity: calculatorState.batteryCapacity
          } : undefined
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setResults(formatResults(data.data));
        setStep(5);
      } else {
        setErrors({ calculation: data.error || 'Calculation failed' });
      }
    } catch (error) {
      console.error('Calculation failed:', error);
      setErrors({ calculation: 'Unable to perform calculation. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUsageData = () => {
    // Generate sample hourly usage data based on pattern
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      let usage = calculatorState.monthlyUsage / 30 / 24; // Base usage
      
      // Apply usage pattern
      switch (calculatorState.usagePattern) {
        case 'peaked':
          if (hour >= 17 && hour <= 21) usage *= 2.5; // Evening peak
          else if (hour >= 6 && hour <= 10) usage *= 1.5; // Morning peak
          else if (hour >= 0 && hour <= 6) usage *= 0.3; // Night low
          break;
        case 'time_varying':
          usage *= 0.5 + Math.sin((hour - 6) * Math.PI / 12); // Sinusoidal pattern
          break;
        // 'flat' uses base usage
      }
      
      hourlyData.push({
        timestamp: new Date(2024, 0, 1, hour),
        kWh: usage,
        kW: usage / 0.25 // Convert to kW assuming 15-min intervals
      });
    }
    return hourlyData;
  };

  const formatResults = (rawData: any): CalculationResult => {
    // Transform API response into component format
    return {
      currentBill: {
        monthly: 250,
        annual: 3000,
        breakdown: {
          energy: 200,
          demand: 30,
          fixed: 15,
          taxes: 5
        }
      },
      optimizedBill: {
        monthly: 180,
        annual: 2160,
        savings: 840,
        savingsPercent: 28,
        rateName: 'TOU-D-4-9PM'
      },
      recommendations: {
        bestRate: {
          id: 'tou-d-4-9pm',
          name: 'TOU-D-4-9PM',
          description: 'Time-of-Use rate with peak hours 4-9 PM',
          pros: ['Lower off-peak rates', 'Good for solar customers', 'Predictable peak hours'],
          cons: ['Higher peak rates', 'Requires usage timing awareness'],
          estimatedSavings: 840
        },
        alternatives: [
          { id: 'tou-d-5-8pm', name: 'TOU-D-5-8PM', estimatedCost: 2200, savings: 800, suitabilityScore: 85 },
          { id: 'tiered', name: 'Tiered Rate', estimatedCost: 2400, savings: 600, suitabilityScore: 70 }
        ],
        optimizations: [
          {
            type: 'load_shifting',
            title: 'Shift Peak Usage',
            description: 'Move flexible loads to off-peak hours',
            potentialSavings: 300,
            implementationCost: 500,
            paybackPeriod: 1.7
          }
        ]
      },
      analysis: {
        loadProfile: {
          pattern: 'Evening Peak',
          flexibility: 'medium',
          peakHours: ['17:00-21:00']
        },
        touOpportunity: {
          shiftablePeak: 35,
          offPeakCapacity: 60,
          estimatedSavings: 300
        },
        solarImpact: calculatorState.hasSolar ? {
          selfConsumption: 65,
          exportRate: 35,
          netMeteringValue: 120
        } : undefined
      }
    };
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Interactive Rate Calculator</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find the optimal utility rate for your home or business. Compare rates, 
          calculate savings, and get personalized recommendations.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Location</span>
        <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Usage</span>
        <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Solar</span>
        <span className={step >= 4 ? 'text-blue-600 font-medium' : ''}>Preferences</span>
        <span className={step >= 5 ? 'text-blue-600 font-medium' : ''}>Results</span>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 1 && <><Home className="h-5 w-5" /> Location Information</>}
            {step === 2 && <><Zap className="h-5 w-5" /> Energy Usage</>}
            {step === 3 && <><Sun className="h-5 w-5" /> Solar System</>}
            {step === 4 && <><Settings className="h-5 w-5" /> Preferences</>}
            {step === 5 && <><BarChart3 className="h-5 w-5" /> Results & Recommendations</>}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter your location to find available utility rates"}
            {step === 2 && "Provide your energy usage information"}
            {step === 3 && "Add solar system details (optional)"}
            {step === 4 && "Set your preferences for rate optimization"}
            {step === 5 && "Review your personalized rate recommendations"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={calculatorState.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="12345"
                    maxLength={5}
                    className={errors.zipCode ? 'border-red-500' : ''}
                  />
                  {errors.zipCode && <p className="text-sm text-red-600">{errors.zipCode}</p>}
                </div>
                
                <div>
                  <Label htmlFor="customerClass">Customer Type *</Label>
                  <Select
                    value={calculatorState.customerClass}
                    onValueChange={(value) => handleInputChange('customerClass', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="utilityCompany">Utility Company *</Label>
                <Select
                  value={calculatorState.utilityCompany}
                  onValueChange={(value) => handleInputChange('utilityCompany', value)}
                  disabled={!availableUtilities.length}
                >
                  <SelectTrigger className={errors.utilityCompany ? 'border-red-500' : ''}>
                    <SelectValue placeholder={
                      availableUtilities.length 
                        ? "Select your utility company" 
                        : "Enter ZIP code to load utilities"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUtilities.map(utility => (
                      <SelectItem key={utility.id} value={utility.id}>
                        {utility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.utilityCompany && <p className="text-sm text-red-600">{errors.utilityCompany}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Usage */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyUsage">Monthly Usage (kWh) *</Label>
                  <Input
                    id="monthlyUsage"
                    type="number"
                    value={calculatorState.monthlyUsage}
                    onChange={(e) => handleInputChange('monthlyUsage', parseInt(e.target.value) || 0)}
                    placeholder="800"
                    min="1"
                    className={errors.monthlyUsage ? 'border-red-500' : ''}
                  />
                  {errors.monthlyUsage && <p className="text-sm text-red-600">{errors.monthlyUsage}</p>}
                  <p className="text-sm text-gray-600">Check your latest utility bill</p>
                </div>

                {calculatorState.customerClass !== 'residential' && (
                  <div>
                    <Label htmlFor="peakDemand">Peak Demand (kW)</Label>
                    <Input
                      id="peakDemand"
                      type="number"
                      value={calculatorState.peakDemand}
                      onChange={(e) => handleInputChange('peakDemand', parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      min="0"
                      step="0.1"
                      className={errors.peakDemand ? 'border-red-500' : ''}
                    />
                    {errors.peakDemand && <p className="text-sm text-red-600">{errors.peakDemand}</p>}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="usagePattern">Usage Pattern</Label>
                <Select
                  value={calculatorState.usagePattern}
                  onValueChange={(value) => handleInputChange('usagePattern', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat - Consistent throughout day</SelectItem>
                    <SelectItem value="peaked">Peaked - Higher evening usage</SelectItem>
                    <SelectItem value="time_varying">Time Varying - Varies throughout day</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  This helps us understand when you use the most electricity
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Solar */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasSolar"
                  checked={calculatorState.hasSolar}
                  onChange={(e) => handleInputChange('hasSolar', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="hasSolar" className="text-base">
                  I have or plan to install a solar system
                </Label>
              </div>

              {calculatorState.hasSolar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="solarCapacity">Solar System Size (kW) *</Label>
                    <Input
                      id="solarCapacity"
                      type="number"
                      value={calculatorState.solarCapacity}
                      onChange={(e) => handleInputChange('solarCapacity', parseFloat(e.target.value) || 0)}
                      placeholder="5.0"
                      min="0"
                      step="0.1"
                      className={errors.solarCapacity ? 'border-red-500' : ''}
                    />
                    {errors.solarCapacity && <p className="text-sm text-red-600">{errors.solarCapacity}</p>}
                  </div>

                  <div>
                    <Label htmlFor="solarProduction">Monthly Production (kWh) *</Label>
                    <Input
                      id="solarProduction"
                      type="number"
                      value={calculatorState.solarProduction}
                      onChange={(e) => handleInputChange('solarProduction', parseFloat(e.target.value) || 0)}
                      placeholder="600"
                      min="0"
                      className={errors.solarProduction ? 'border-red-500' : ''}
                    />
                    {errors.solarProduction && <p className="text-sm text-red-600">{errors.solarProduction}</p>}
                  </div>

                  <div>
                    <Label htmlFor="batteryCapacity">Battery Storage (kWh)</Label>
                    <Input
                      id="batteryCapacity"
                      type="number"
                      value={calculatorState.batteryCapacity}
                      onChange={(e) => handleInputChange('batteryCapacity', parseFloat(e.target.value) || 0)}
                      placeholder="10"
                      min="0"
                      step="0.1"
                    />
                    <p className="text-sm text-gray-600">Optional - enter 0 if no battery</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label>Preferred Rate Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[
                    { value: 'any', label: 'Any (Recommended)', desc: 'Let us find the best rate for you' },
                    { value: 'flat', label: 'Flat Rate', desc: 'Simple, consistent pricing' },
                    { value: 'tiered', label: 'Tiered Rate', desc: 'Lower rates for less usage' },
                    { value: 'tou', label: 'Time-of-Use', desc: 'Different rates by time of day' }
                  ].map(option => (
                    <div key={option.value}>
                      <label className={`
                        flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                        ${calculatorState.preferredRateType === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                        }
                      `}>
                        <input
                          type="radio"
                          name="preferredRateType"
                          value={option.value}
                          checked={calculatorState.preferredRateType === option.value}
                          onChange={(e) => handleInputChange('preferredRateType', e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.desc}</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Risk Tolerance</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {[
                    { value: 'conservative', label: 'Conservative', desc: 'Predictable, stable rates' },
                    { value: 'moderate', label: 'Moderate', desc: 'Balance of savings and stability' },
                    { value: 'aggressive', label: 'Aggressive', desc: 'Maximum savings potential' }
                  ].map(option => (
                    <label key={option.value} className={`
                      flex flex-col space-y-2 p-3 border rounded-lg cursor-pointer transition-colors
                      ${calculatorState.riskTolerance === option.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="riskTolerance"
                          value={option.value}
                          checked={calculatorState.riskTolerance === option.value}
                          onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                        />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <span className="text-sm text-gray-600">{option.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && results && (
            <div className="space-y-6">
              {/* Savings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">
                      ${results.optimizedBill.savings}
                    </div>
                    <div className="text-sm text-green-700">Annual Savings</div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">
                      {results.optimizedBill.savingsPercent}%
                    </div>
                    <div className="text-sm text-blue-700">Bill Reduction</div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-800">
                      {results.recommendations.bestRate.name}
                    </div>
                    <div className="text-sm text-purple-700">Best Rate</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="comparison">Bill Comparison</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="analysis">Load Analysis</TabsTrigger>
                  <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Bill Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Current Bill</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Energy Charges:</span>
                              <span>${results.currentBill.breakdown.energy}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Demand Charges:</span>
                              <span>${results.currentBill.breakdown.demand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fixed Charges:</span>
                              <span>${results.currentBill.breakdown.fixed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxes & Fees:</span>
                              <span>${results.currentBill.breakdown.taxes}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>${results.currentBill.monthly}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3 text-green-700">Optimized Bill</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Rate Schedule:</span>
                              <span className="text-blue-600">{results.optimizedBill.rateName}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Monthly Bill:</span>
                              <span>${results.optimizedBill.monthly}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Monthly Savings:</span>
                              <span>${Math.round(results.optimizedBill.savings / 12)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-green-700">
                              <span>Annual Savings:</span>
                              <span>${results.optimizedBill.savings}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Recommended Rate: {results.recommendations.bestRate.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">{results.recommendations.bestRate.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Pros</h5>
                          <ul className="space-y-1">
                            {results.recommendations.bestRate.pros.map((pro, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-orange-600 mb-2">Considerations</h5>
                          <ul className="space-y-1">
                            {results.recommendations.bestRate.cons.map((con, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Next Steps</AlertTitle>
                        <AlertDescription>
                          Contact your utility company to switch to the {results.recommendations.bestRate.name} rate schedule. 
                          Most utilities allow rate changes once per year.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* Alternative Rates */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Alternative Rate Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.recommendations.alternatives.map((alt, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{alt.name}</div>
                              <div className="text-sm text-gray-600">
                                Suitability Score: {alt.suitabilityScore}/100
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${alt.estimatedCost}/year</div>
                              <div className="text-sm text-green-600">
                                Save ${alt.savings}/year
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Load Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Pattern:</span>
                            <Badge variant="outline">{results.analysis.loadProfile.pattern}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Flexibility:</span>
                            <Badge variant={
                              results.analysis.loadProfile.flexibility === 'high' ? 'default' :
                              results.analysis.loadProfile.flexibility === 'medium' ? 'secondary' : 'outline'
                            }>
                              {results.analysis.loadProfile.flexibility}
                            </Badge>
                          </div>
                          <div>
                            <span>Peak Hours:</span>
                            <div className="mt-1">
                              {results.analysis.loadProfile.peakHours.map((hour, index) => (
                                <Badge key={index} variant="outline" className="mr-1 mb-1">
                                  {hour}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>TOU Opportunity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Shiftable Peak Usage</span>
                              <span className="text-sm font-medium">
                                {results.analysis.touOpportunity.shiftablePeak}%
                              </span>
                            </div>
                            <Progress value={results.analysis.touOpportunity.shiftablePeak} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Off-Peak Capacity</span>
                              <span className="text-sm font-medium">
                                {results.analysis.touOpportunity.offPeakCapacity}%
                              </span>
                            </div>
                            <Progress value={results.analysis.touOpportunity.offPeakCapacity} />
                          </div>

                          <div className="pt-2 border-t">
                            <div className="text-sm text-gray-600">Estimated TOU Savings</div>
                            <div className="text-lg font-bold text-green-600">
                              ${results.analysis.touOpportunity.estimatedSavings}/year
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {results.analysis.solarImpact && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sun className="h-5 w-5 text-yellow-500" />
                          Solar System Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {results.analysis.solarImpact.selfConsumption}%
                            </div>
                            <div className="text-sm text-gray-600">Self Consumption</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {results.analysis.solarImpact.exportRate}%
                            </div>
                            <div className="text-sm text-gray-600">Export Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              ${results.analysis.solarImpact.netMeteringValue}
                            </div>
                            <div className="text-sm text-gray-600">Monthly Credit</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="optimizations" className="space-y-4">
                  {results.recommendations.optimizations.map((opt, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {opt.type === 'load_shifting' && <Clock className="h-5 w-5" />}
                          {opt.type === 'battery_storage' && <Battery className="h-5 w-5" />}
                          {opt.type === 'solar_expansion' && <Sun className="h-5 w-5" />}
                          {opt.title}
                        </CardTitle>
                        <CardDescription>{opt.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Annual Savings</div>
                            <div className="text-xl font-bold text-green-600">
                              ${opt.potentialSavings}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Implementation Cost</div>
                            <div className="text-xl font-bold">
                              ${opt.implementationCost}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Payback Period</div>
                            <div className="text-xl font-bold text-blue-600">
                              {opt.paybackPeriod} years
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          onClick={prevStep} 
          disabled={step === 1}
          variant="outline"
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {step < 4 && (
            <Button onClick={nextStep}>
              Next
            </Button>
          )}
          
          {step === 4 && (
            <Button 
              onClick={calculateRates} 
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? 'Calculating...' : 'Calculate Rates'}
            </Button>
          )}
          
          {step === 5 && (
            <Button 
              onClick={() => window.print()}
              variant="outline"
            >
              Print Results
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.calculation && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Calculation Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {errors.calculation}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}