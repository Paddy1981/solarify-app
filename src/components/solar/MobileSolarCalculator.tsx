import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MobileForm, MobileFormSection, MobileFormField, MobileFormGrid } from '../ui/mobile-form';
import { systemDesigner, SystemDesignRequirements } from '../../lib/solar/system-designer';
import { Loader2, Sun, Zap, DollarSign, Leaf, MapPin, Sliders, Home, Target } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSolarCalculatorProps {
  onDesignComplete?: (design: any) => void;
}

export function MobileSolarCalculator({ onDesignComplete }: MobileSolarCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [designResult, setDesignResult] = useState<any>(null);
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    // Location
    latitude: '',
    longitude: '',
    
    // Energy usage
    monthlyUsage: Array(12).fill(''),
    averageMonthlyUsage: '',
    
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

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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

  const fillAllMonthsWithAverage = () => {
    if (formData.averageMonthlyUsage) {
      const newUsage = Array(12).fill(formData.averageMonthlyUsage);
      setFormData(prev => ({
        ...prev,
        monthlyUsage: newUsage
      }));
    }
  };

  const generateMockWeatherData = (latitude: number) => {
    const baseIrradiance = 5.0;
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

  const calculatorSteps = [
    {
      id: 'location',
      title: 'Location',
      description: 'Enter your property location',
      content: (
        <MobileFormSection 
          title="Property Location" 
          description="We need your location to calculate solar irradiance"
        >
          <MobileFormGrid columns={1}>
            <MobileFormField 
              label="Latitude" 
              required
              description="Example: 37.7749 for San Francisco"
            >
              <Input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                placeholder="37.7749"
              />
            </MobileFormField>
            <MobileFormField 
              label="Longitude" 
              required
              description="Example: -122.4194 for San Francisco"
            >
              <Input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                placeholder="-122.4194"
              />
            </MobileFormField>
          </MobileFormGrid>
        </MobileFormSection>
      ),
      validation: () => !!(formData.latitude && formData.longitude)
    },
    {
      id: 'energy-usage',
      title: 'Energy Usage',
      description: 'Tell us about your electricity consumption',
      content: (
        <MobileFormSection 
          title="Monthly Energy Usage" 
          description="Enter your monthly electricity consumption in kWh"
        >
          <div className="space-y-4">
            <MobileFormField 
              label="Average Monthly Usage (kWh)" 
              description="Enter your average usage to fill all months quickly"
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.averageMonthlyUsage}
                  onChange={(e) => handleInputChange('averageMonthlyUsage', e.target.value)}
                  placeholder="800"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={fillAllMonthsWithAverage}
                  disabled={!formData.averageMonthlyUsage}
                  size="mobile"
                >
                  Fill All
                </Button>
              </div>
            </MobileFormField>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {monthNames.map((month, index) => (
                <MobileFormField key={month} label={month}>
                  <Input
                    type="number"
                    value={formData.monthlyUsage[index]}
                    onChange={(e) => handleMonthlyUsageChange(index, e.target.value)}
                    placeholder="0"
                  />
                </MobileFormField>
              ))}
            </div>
          </div>
        </MobileFormSection>
      ),
      validation: () => formData.monthlyUsage.some(usage => parseFloat(usage) > 0)
    },
    {
      id: 'system-preferences',
      title: 'System Preferences',
      description: 'Choose your solar system components',
      content: (
        <MobileFormSection 
          title="System Configuration" 
          description="Select your preferred components"
        >
          <MobileFormGrid columns={1}>
            <MobileFormField label="Panel Type" required>
              <Select value={formData.panelType} onValueChange={(value) => handleInputChange('panelType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select panel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monocrystalline">Monocrystalline (Most Efficient)</SelectItem>
                  <SelectItem value="polycrystalline">Polycrystalline (Cost Effective)</SelectItem>
                  <SelectItem value="thin-film">Thin Film (Flexible)</SelectItem>
                </SelectContent>
              </Select>
            </MobileFormField>
            
            <MobileFormField label="Inverter Type" required>
              <Select value={formData.inverterType} onValueChange={(value) => handleInputChange('inverterType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inverter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String Inverter (Most Common)</SelectItem>
                  <SelectItem value="power-optimizer">Power Optimizers (Better Performance)</SelectItem>
                  <SelectItem value="micro">Microinverters (Best Performance)</SelectItem>
                </SelectContent>
              </Select>
            </MobileFormField>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="includeStorage"
                  checked={formData.includeStorage}
                  onCheckedChange={(checked) => handleInputChange('includeStorage', checked)}
                />
                <Label htmlFor="includeStorage" className="text-sm font-medium">
                  Include Battery Storage
                </Label>
              </div>

              {formData.includeStorage && (
                <MobileFormField label="Storage Capacity (kWh)">
                  <Input
                    type="number"
                    value={formData.storageCapacity}
                    onChange={(e) => handleInputChange('storageCapacity', e.target.value)}
                    placeholder="13.5"
                  />
                </MobileFormField>
              )}
            </div>
          </MobileFormGrid>
        </MobileFormSection>
      ),
      validation: () => !!(formData.panelType && formData.inverterType)
    },
    {
      id: 'constraints',
      title: 'Property Details',
      description: 'Roof constraints and budget information',
      content: (
        <MobileFormSection 
          title="Property & Budget Constraints" 
          description="Help us design within your constraints"
        >
          <MobileFormGrid columns={1}>
            <MobileFormField 
              label="Available Roof Area (m²)" 
              description="Approximate area available for panels"
            >
              <Input
                type="number"
                value={formData.availableArea}
                onChange={(e) => handleInputChange('availableArea', e.target.value)}
                placeholder="50"
              />
            </MobileFormField>
            
            <MobileFormField 
              label="Maximum Budget (USD)" 
              description="Optional budget constraint"
            >
              <Input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                placeholder="25000"
              />
            </MobileFormField>

            <MobileFormGrid columns={2}>
              <MobileFormField label="Roof Tilt (degrees)">
                <Input
                  type="number"
                  value={formData.tiltAngle}
                  onChange={(e) => handleInputChange('tiltAngle', e.target.value)}
                  placeholder="30"
                />
              </MobileFormField>
              
              <MobileFormField label="Azimuth (degrees)">
                <Input
                  type="number"
                  value={formData.azimuthAngle}
                  onChange={(e) => handleInputChange('azimuthAngle', e.target.value)}
                  placeholder="180"
                />
              </MobileFormField>
            </MobileFormGrid>

            <MobileFormGrid columns={2}>
              <MobileFormField label="Electricity Rate ($/kWh)">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.energyRate}
                  onChange={(e) => handleInputChange('energyRate', e.target.value)}
                  placeholder="0.12"
                />
              </MobileFormField>
              
              <MobileFormField label="Desired Offset (%)">
                <Input
                  type="number"
                  value={formData.offsetPercentage}
                  onChange={(e) => handleInputChange('offsetPercentage', e.target.value)}
                  placeholder="100"
                />
              </MobileFormField>
            </MobileFormGrid>

            <div className="space-y-3 pt-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="prioritizeEfficiency"
                  checked={formData.prioritizeEfficiency}
                  onCheckedChange={(checked) => handleInputChange('prioritizeEfficiency', checked)}
                />
                <Label htmlFor="prioritizeEfficiency" className="text-sm">
                  Prioritize Efficiency Over Cost
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="prioritizeCost"
                  checked={formData.prioritizeCost}
                  onCheckedChange={(checked) => handleInputChange('prioritizeCost', checked)}
                />
                <Label htmlFor="prioritizeCost" className="text-sm">
                  Prioritize Cost Over Efficiency
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="tier1Only"
                  checked={formData.tier1Only}
                  onCheckedChange={(checked) => handleInputChange('tier1Only', checked)}
                />
                <Label htmlFor="tier1Only" className="text-sm">
                  Tier 1 Panels Only
                </Label>
              </div>
            </div>
          </MobileFormGrid>
        </MobileFormSection>
      )
    }
  ];

  const renderMobileResults = () => {
    if (!designResult) return null;

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <h2 className="text-xl font-bold mb-2">Your Solar System Design</h2>
          <p className="text-muted-foreground text-sm">
            Customized recommendations based on your requirements
          </p>
        </div>
        
        {/* Key Metrics - Mobile Optimized Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="text-center">
              <Sun className="mx-auto mb-2 text-orange-500" size={20} />
              <div className="text-lg font-bold">{designResult.systemSpecs.dcCapacity.toFixed(1)} kW</div>
              <div className="text-xs text-muted-foreground">System Size</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <Zap className="mx-auto mb-2 text-blue-500" size={20} />
              <div className="text-lg font-bold">{Math.round(designResult.performance.annualProduction / 1000)}k kWh</div>
              <div className="text-xs text-muted-foreground">Annual Production</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <DollarSign className="mx-auto mb-2 text-green-500" size={20} />
              <div className="text-lg font-bold">${Math.round(designResult.economics.netCost / 1000)}k</div>
              <div className="text-xs text-muted-foreground">Net Cost</div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="text-center">
              <Leaf className="mx-auto mb-2 text-green-600" size={20} />
              <div className="text-lg font-bold">{(designResult.performance.co2Savings / 1000).toFixed(1)}t</div>
              <div className="text-xs text-muted-foreground">CO₂ Savings/Year</div>
            </div>
          </Card>
        </div>

        {/* System Components */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">Solar Panels</h4>
              <p className="text-muted-foreground">
                {designResult.components.panels.quantity}x {designResult.components.panels.panel.manufacturer} {designResult.components.panels.panel.model}
              </p>
              <p className="text-xs text-muted-foreground">
                {designResult.components.panels.totalWattage.toLocaleString()}W • {designResult.components.panels.panel.efficiency}% Efficiency
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Inverter</h4>
              <p className="text-muted-foreground">
                {designResult.components.inverter.quantity}x {designResult.components.inverter.inverter.manufacturer}
              </p>
              <p className="text-xs text-muted-foreground">
                {designResult.components.inverter.inverter.efficiency.cec}% CEC Efficiency
              </p>
            </div>
            
            {designResult.components.battery && (
              <div>
                <h4 className="font-medium">Battery Storage</h4>
                <p className="text-muted-foreground">
                  {designResult.components.battery.quantity}x {designResult.components.battery.battery.manufacturer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {designResult.components.battery.totalCapacity}kWh Total
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold">{designResult.energyAnalysis.offsetPercentage.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Energy Offset</div>
              </div>
              <div>
                <div className="font-semibold">{designResult.performance.capacityFactor.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Capacity Factor</div>
              </div>
              <div>
                <div className="font-semibold">{Math.round(designResult.performance.specificYield)}</div>
                <div className="text-xs text-muted-foreground">kWh/kW/yr</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              setDesignResult(null);
              setCurrentStep(0);
            }}
            size="mobile"
            className="w-full"
          >
            Start New Calculation
          </Button>
        </div>
      </div>
    );
  };

  if (designResult) {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderMobileResults()}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Sun className="text-orange-500" size={24} />
          Solar System Calculator
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Get a customized solar system design for your property
        </p>
      </div>

      <MobileForm
        steps={calculatorSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleCalculate}
        showProgress={true}
      />
    </div>
  );
}