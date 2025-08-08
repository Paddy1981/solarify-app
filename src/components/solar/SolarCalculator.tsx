"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { systemDesigner, SystemDesignRequirements } from '../../lib/solar/system-designer';
import { Loader2, Sun, Zap, DollarSign, Leaf } from 'lucide-react';

interface SolarCalculatorProps {
  onDesignComplete?: (design: any) => void;
}

export function SolarCalculator({ onDesignComplete }: SolarCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Location
    latitude: '',
    longitude: '',
    
    // Energy usage
    monthlyUsage: Array(12).fill(''),
    
    // Preferences
    panelType: '',
    inverterType: '',
    includeStorage: false,
    storageCapacity: '',
    
    // Roof constraints
    availableArea: '',
    tiltAngle: '',
    azimuthAngle: '',
    shadingFactor: '',
    
    // Budget
    maxBudget: '',
    
    // Utility rates
    energyRate: '0.12',
    netMeteringRate: '0.12',
    
    // Design goals
    offsetPercentage: '100',
    prioritizeEfficiency: false,
    prioritizeCost: false,
    tier1Only: false
  });
  
  const [designResult, setDesignResult] = useState<any>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMonthlyUsageChange = (month: number, value: string) => {
    const newUsage = [...formData.monthlyUsage];
    newUsage[month] = value;
    setFormData(prev => ({
      ...prev,
      monthlyUsage: newUsage
    }));
  };

  const generateMockWeatherData = (latitude: number) => {
    // Generate simplified weather data based on latitude
    // In production, this would fetch from NREL or other weather APIs
    const baseIrradiance = 5.0; // kWh/m²/day
    const seasonalVariation = 0.3;
    
    return Array.from({ length: 12 }, (_, month) => ({
      month: month + 1,
      globalHorizontalIrradiance: baseIrradiance + 
        seasonalVariation * Math.sin((month - 3) * Math.PI / 6),
      directNormalIrradiance: 6.0,
      diffuseHorizontalIrradiance: 2.0,
      ambientTemperature: 20 + 10 * Math.sin((month - 3) * Math.PI / 6),
      windSpeed: 3.0,
      relativeHumidity: 60
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    
    try {
      const requirements: SystemDesignRequirements = {
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        },
        energyUsage: {
          monthlyUsage: formData.monthlyUsage.map(usage => parseFloat(usage) || 0)
        },
        budget: formData.maxBudget ? {
          max: parseFloat(formData.maxBudget)
        } : undefined,
        preferences: {
          panelType: formData.panelType as any,
          inverterType: formData.inverterType as any,
          includeStorage: formData.includeStorage,
          storageCapacity: formData.storageCapacity ? parseFloat(formData.storageCapacity) : undefined,
          roofConstraints: {
            availableArea: formData.availableArea ? parseFloat(formData.availableArea) : undefined,
            tiltAngle: formData.tiltAngle ? parseFloat(formData.tiltAngle) : undefined,
            azimuthAngle: formData.azimuthAngle ? parseFloat(formData.azimuthAngle) : undefined,
            shadingFactor: formData.shadingFactor ? parseFloat(formData.shadingFactor) : undefined
          },
          designGoals: {
            offsetPercentage: parseFloat(formData.offsetPercentage),
            prioritizeEfficiency: formData.prioritizeEfficiency,
            prioritizeCost: formData.prioritizeCost,
            tier1Only: formData.tier1Only
          }
        },
        utilityRates: {
          energyRate: parseFloat(formData.energyRate),
          netMeteringRate: parseFloat(formData.netMeteringRate)
        }
      };

      const weatherData = generateMockWeatherData(parseFloat(formData.latitude));
      const design = await systemDesigner.designSystem(requirements, weatherData);
      
      setDesignResult(design);
      onDesignComplete?.(design);
      
    } catch (error) {
      console.error('Solar calculation failed:', error);
      alert('Solar calculation failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Location & Energy Usage</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => handleInputChange('latitude', e.target.value)}
            placeholder="e.g., 37.7749"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => handleInputChange('longitude', e.target.value)}
            placeholder="e.g., -122.4194"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">Monthly Energy Usage (kWh)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {monthNames.map((month, index) => (
            <div key={month}>
              <Label htmlFor={`month-${index}`} className="text-sm">{month}</Label>
              <Input
                id={`month-${index}`}
                type="number"
                value={formData.monthlyUsage[index]}
                onChange={(e) => handleMonthlyUsageChange(index, e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">System Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="panelType">Panel Type</Label>
          <Select value={formData.panelType} onValueChange={(value) => handleInputChange('panelType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select panel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monocrystalline">Monocrystalline</SelectItem>
              <SelectItem value="polycrystalline">Polycrystalline</SelectItem>
              <SelectItem value="thin-film">Thin Film</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="inverterType">Inverter Type</Label>
          <Select value={formData.inverterType} onValueChange={(value) => handleInputChange('inverterType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select inverter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String Inverter</SelectItem>
              <SelectItem value="power-optimizer">Power Optimizers</SelectItem>
              <SelectItem value="micro">Microinverters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="includeStorage"
          checked={formData.includeStorage}
          onChange={(e) => handleInputChange('includeStorage', e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="includeStorage">Include Battery Storage</Label>
      </div>

      {formData.includeStorage && (
        <div>
          <Label htmlFor="storageCapacity">Storage Capacity (kWh)</Label>
          <Input
            id="storageCapacity"
            type="number"
            value={formData.storageCapacity}
            onChange={(e) => handleInputChange('storageCapacity', e.target.value)}
            placeholder="e.g., 13.5"
          />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Roof & Budget Constraints</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="availableArea">Available Roof Area (m²)</Label>
          <Input
            id="availableArea"
            type="number"
            value={formData.availableArea}
            onChange={(e) => handleInputChange('availableArea', e.target.value)}
            placeholder="e.g., 50"
          />
        </div>
        
        <div>
          <Label htmlFor="maxBudget">Maximum Budget (USD)</Label>
          <Input
            id="maxBudget"
            type="number"
            value={formData.maxBudget}
            onChange={(e) => handleInputChange('maxBudget', e.target.value)}
            placeholder="e.g., 25000"
          />
        </div>
        
        <div>
          <Label htmlFor="tiltAngle">Roof Tilt Angle (degrees)</Label>
          <Input
            id="tiltAngle"
            type="number"
            value={formData.tiltAngle}
            onChange={(e) => handleInputChange('tiltAngle', e.target.value)}
            placeholder="e.g., 30"
          />
        </div>
        
        <div>
          <Label htmlFor="azimuthAngle">Azimuth Angle (degrees from south)</Label>
          <Input
            id="azimuthAngle"
            type="number"
            value={formData.azimuthAngle}
            onChange={(e) => handleInputChange('azimuthAngle', e.target.value)}
            placeholder="180 (south-facing)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="energyRate">Electricity Rate (USD/kWh)</Label>
          <Input
            id="energyRate"
            type="number"
            step="0.01"
            value={formData.energyRate}
            onChange={(e) => handleInputChange('energyRate', e.target.value)}
            placeholder="e.g., 0.12"
          />
        </div>
        
        <div>
          <Label htmlFor="offsetPercentage">Desired Offset (%)</Label>
          <Input
            id="offsetPercentage"
            type="number"
            value={formData.offsetPercentage}
            onChange={(e) => handleInputChange('offsetPercentage', e.target.value)}
            placeholder="100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="prioritizeEfficiency"
            checked={formData.prioritizeEfficiency}
            onChange={(e) => handleInputChange('prioritizeEfficiency', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="prioritizeEfficiency">Prioritize Efficiency</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="prioritizeCost"
            checked={formData.prioritizeCost}
            onChange={(e) => handleInputChange('prioritizeCost', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="prioritizeCost">Prioritize Cost</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tier1Only"
            checked={formData.tier1Only}
            onChange={(e) => handleInputChange('tier1Only', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="tier1Only">Tier 1 Panels Only</Label>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!designResult) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Solar System Design Results</h3>
        
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Sun className="mx-auto mb-2 text-orange-500" size={24} />
              <div className="text-2xl font-bold">{designResult.systemSpecs.dcCapacity.toFixed(1)} kW</div>
              <div className="text-sm text-gray-600">System Size</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="mx-auto mb-2 text-blue-500" size={24} />
              <div className="text-2xl font-bold">{designResult.performance.annualProduction.toLocaleString()} kWh</div>
              <div className="text-sm text-gray-600">Annual Production</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="mx-auto mb-2 text-green-500" size={24} />
              <div className="text-2xl font-bold">${designResult.economics.netCost.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Net Cost</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Leaf className="mx-auto mb-2 text-green-600" size={24} />
              <div className="text-2xl font-bold">{(designResult.performance.co2Savings / 1000).toFixed(1)}t</div>
              <div className="text-sm text-gray-600">CO₂ Savings/Year</div>
            </CardContent>
          </Card>
        </div>

        {/* System Components */}
        <Card>
          <CardHeader>
            <CardTitle>System Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Solar Panels</h4>
                <p className="text-sm text-gray-600">
                  {designResult.components.panels.quantity}x {designResult.components.panels.panel.manufacturer} {designResult.components.panels.panel.model}
                </p>
                <p className="text-sm text-gray-600">
                  {designResult.components.panels.totalWattage.toLocaleString()}W Total • {designResult.components.panels.panel.efficiency}% Efficiency
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Inverter</h4>
                <p className="text-sm text-gray-600">
                  {designResult.components.inverter.quantity}x {designResult.components.inverter.inverter.manufacturer} {designResult.components.inverter.inverter.model}
                </p>
                <p className="text-sm text-gray-600">
                  {designResult.components.inverter.inverter.efficiency.cec}% CEC Efficiency
                </p>
              </div>
              
              {designResult.components.battery && (
                <div>
                  <h4 className="font-semibold">Battery Storage</h4>
                  <p className="text-sm text-gray-600">
                    {designResult.components.battery.quantity}x {designResult.components.battery.battery.manufacturer} {designResult.components.battery.battery.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    {designResult.components.battery.totalCapacity}kWh Total Capacity
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-semibold">{designResult.energyAnalysis.offsetPercentage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Energy Offset</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{designResult.performance.capacityFactor.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Capacity Factor</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{designResult.performance.specificYield.toFixed(0)} kWh/kW</div>
                <div className="text-sm text-gray-600">Specific Yield</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Score */}
        <Card>
          <CardHeader>
            <CardTitle>Design Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Overall Score</span>
                <span className="font-semibold">{designResult.score.overall}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost</span>
                <span>{designResult.score.cost}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Performance</span>
                <span>{designResult.score.performance}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reliability</span>
                <span>{designResult.score.reliability}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="text-orange-500" size={24} />
            Solar System Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!designResult ? (
            <>
              {/* Step Navigation */}
              <div className="flex justify-center mb-6">
                <div className="flex space-x-4">
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      className={`w-8 h-8 rounded-full text-sm font-medium ${
                        currentStep === step
                          ? 'bg-blue-500 text-white'
                          : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                      onClick={() => setCurrentStep(step)}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    disabled={
                      currentStep === 1 && (!formData.latitude || !formData.longitude) ||
                      currentStep === 2 && (!formData.panelType || !formData.inverterType)
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleCalculate}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'Calculate System'
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {renderResults()}
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDesignResult(null);
                    setCurrentStep(1);
                  }}
                >
                  Start New Calculation
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}