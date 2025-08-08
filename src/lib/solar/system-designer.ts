/**
 * Solar System Designer
 * Automated solar system design and optimization engine
 */

import { SolarEquipmentDatabase, SolarPanel, Inverter, BatteryStorage } from './solar-database';
import { solarCalculationEngine, SolarSystemSpecs, Location, WeatherData, SolarCalculationResult } from './calculation-engine';
import { errorTracker } from '../monitoring/error-tracker';

export interface SystemDesignRequirements {
  location: Location;
  energyUsage: {
    monthlyUsage: number[]; // kWh per month (12 values)
    peakUsage?: number; // kW peak demand
  };
  budget?: {
    min?: number; // USD
    max?: number; // USD
  };
  preferences: {
    panelType?: 'monocrystalline' | 'polycrystalline' | 'thin-film';
    inverterType?: 'string' | 'power-optimizer' | 'micro';
    includeStorage?: boolean;
    storageCapacity?: number; // kWh
    roofConstraints?: {
      availableArea?: number; // m²
      tiltAngle?: number; // degrees
      azimuthAngle?: number; // degrees
      shadingFactor?: number; // percentage
    };
    designGoals?: {
      offsetPercentage?: number; // percentage of usage to offset (default 100%)
      prioritizeEfficiency?: boolean;
      prioritizeCost?: boolean;
      tier1Only?: boolean;
    };
  };
  utilityRates?: {
    energyRate: number; // USD/kWh
    demandCharge?: number; // USD/kW
    netMeteringRate?: number; // USD/kWh
    timeOfUseRates?: {
      peak: number; // USD/kWh
      offPeak: number; // USD/kWh
      peakHours: string[]; // e.g., ['16:00-21:00']
    };
  };
}

export interface SystemDesignResult {
  designId: string;
  systemSpecs: SolarSystemSpecs;
  components: {
    panels: {
      panel: SolarPanel;
      quantity: number;
      totalWattage: number;
      cost: number;
    };
    inverter: {
      inverter: Inverter;
      quantity: number;
      totalCapacity: number;
      cost: number;
    };
    battery?: {
      battery: BatteryStorage;
      quantity: number;
      totalCapacity: number;
      cost: number;
    };
  };
  performance: SolarCalculationResult;
  economics: {
    systemCost: number;
    incentives: number;
    netCost: number;
    financingOptions?: FinancingOption[];
  };
  energyAnalysis: {
    annualGeneration: number; // kWh
    annualConsumption: number; // kWh
    offsetPercentage: number; // percentage
    excessGeneration: number; // kWh
    gridPurchases: number; // kWh
    batteryUtilization?: number; // percentage
  };
  roofLayout?: RoofLayout;
  alternativeDesigns?: SystemDesignResult[];
  score: {
    overall: number; // 0-100
    cost: number; // 0-100
    performance: number; // 0-100
    aesthetics: number; // 0-100
    reliability: number; // 0-100
  };
}

export interface RoofLayout {
  totalPanels: number;
  rows: number;
  panelsPerRow: number[];
  spacing: {
    rowSpacing: number; // meters
    panelSpacing: number; // meters
  };
  orientation: {
    tilt: number; // degrees
    azimuth: number; // degrees
  };
  areaCoverage: {
    totalRoofArea: number; // m²
    panelArea: number; // m²
    utilizationPercentage: number; // percentage
  };
}

export interface FinancingOption {
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  provider: string;
  terms: {
    duration?: number; // years
    interestRate?: number; // percentage
    monthlyPayment?: number; // USD
    escalationRate?: number; // percentage for PPA/lease
  };
  economics: {
    totalCost: number; // USD
    monthlySavings: number; // USD
    netSavings: number; // USD over term
    breakEvenPoint: number; // years
  };
}

export class SystemDesigner {
  private static readonly DESIGN_MARGINS = {
    dcToAcRatio: { min: 1.1, max: 1.4 }, // Typical DC/AC ratio range
    roofCoverage: { max: 0.8 }, // Maximum 80% roof coverage
    batteryToLoad: { min: 0.3, max: 2.0 }, // Battery capacity as multiple of daily usage
    systemOversizing: { max: 1.2 } // Maximum 20% oversizing
  };

  /**
   * Design optimal solar system based on requirements
   */
  public async designSystem(
    requirements: SystemDesignRequirements,
    weatherData: WeatherData[]
  ): Promise<SystemDesignResult> {
    try {
      errorTracker.addBreadcrumb('Starting system design', 'design', {
        location: `${requirements.location.latitude},${requirements.location.longitude}`,
        budget: requirements.budget?.max
      });

      // Calculate target system size
      const targetSize = this.calculateTargetSystemSize(requirements);
      
      // Generate multiple design options
      const designOptions = await this.generateDesignOptions(
        requirements,
        targetSize,
        weatherData
      );

      // Evaluate and rank designs
      const rankedDesigns = this.rankDesigns(designOptions, requirements);

      // Select best design
      const bestDesign = rankedDesigns[0];

      // Generate alternative designs
      const alternatives = rankedDesigns.slice(1, 4); // Top 3 alternatives

      // Add roof layout if constraints provided
      if (requirements.preferences.roofConstraints) {
        bestDesign.roofLayout = this.generateRoofLayout(
          bestDesign,
          requirements.preferences.roofConstraints
        );
      }

      // Add financing options
      if (requirements.utilityRates) {
        bestDesign.economics.financingOptions = this.generateFinancingOptions(
          bestDesign,
          requirements.utilityRates
        );
      }

      bestDesign.alternativeDesigns = alternatives;

      errorTracker.addBreadcrumb('System design completed', 'design', {
        systemSize: bestDesign.systemSpecs.dcCapacity,
        annualGeneration: bestDesign.performance.annualProduction,
        score: bestDesign.score.overall
      });

      return bestDesign;

    } catch (error) {
      errorTracker.captureException(error as Error, {
        requirements,
        weatherDataCount: weatherData.length
      });
      throw error;
    }
  }

  /**
   * Calculate target system size based on energy usage
   */
  private calculateTargetSystemSize(requirements: SystemDesignRequirements): number {
    const annualUsage = requirements.energyUsage.monthlyUsage.reduce((sum, usage) => sum + usage, 0);
    const offsetPercentage = requirements.preferences.designGoals?.offsetPercentage || 100;
    
    // Estimate system size based on typical production (1400 kWh/kW/year average)
    const estimatedProductionPerKW = 1400;
    const targetProduction = (annualUsage * offsetPercentage) / 100;
    const targetSize = targetProduction / estimatedProductionPerKW;

    return Math.max(1, targetSize); // Minimum 1kW system
  }

  /**
   * Generate multiple design options
   */
  private async generateDesignOptions(
    requirements: SystemDesignRequirements,
    targetSize: number,
    weatherData: WeatherData[]
  ): Promise<SystemDesignResult[]> {
    const designs: SystemDesignResult[] = [];

    // Generate designs with different panel types
    const panelTypes: Array<'monocrystalline' | 'polycrystalline'> = ['monocrystalline', 'polycrystalline'];
    const inverterTypes: Array<'string' | 'power-optimizer' | 'micro'> = ['string', 'power-optimizer', 'micro'];

    for (const panelType of panelTypes) {
      for (const inverterType of inverterTypes) {
        // Skip certain combinations that don't make sense
        if (requirements.preferences.panelType && requirements.preferences.panelType !== panelType) continue;
        if (requirements.preferences.inverterType && requirements.preferences.inverterType !== inverterType) continue;

        try {
          const design = await this.createDesignVariant(
            requirements,
            targetSize,
            panelType,
            inverterType,
            weatherData
          );
          
          if (design) {
            designs.push(design);
          }
        } catch (error) {
          // Log error but continue with other designs
          console.warn(`Failed to create design variant: ${panelType} + ${inverterType}`, error);
        }
      }
    }

    return designs;
  }

  /**
   * Create a specific design variant
   */
  private async createDesignVariant(
    requirements: SystemDesignRequirements,
    targetSize: number,
    panelType: 'monocrystalline' | 'polycrystalline',
    inverterType: 'string' | 'power-optimizer' | 'micro',
    weatherData: WeatherData[]
  ): Promise<SystemDesignResult | null> {
    // Get equipment options
    const panelOptions = SolarEquipmentDatabase.getPanels({
      type: panelType,
      tier: requirements.preferences.designGoals?.tier1Only ? 1 : undefined,
      availability: 'in-stock'
    });

    const inverterOptions = SolarEquipmentDatabase.getInverters({
      type: inverterType,
      availability: 'in-stock'
    });

    if (panelOptions.length === 0 || inverterOptions.length === 0) {
      return null;
    }

    // Select components based on preferences
    const selectedPanel = this.selectOptimalPanel(panelOptions, requirements);
    const panelCount = Math.ceil((targetSize * 1000) / selectedPanel.wattage);
    const actualSystemSize = (panelCount * selectedPanel.wattage) / 1000;

    const selectedInverter = this.selectOptimalInverter(
      inverterOptions,
      actualSystemSize,
      inverterType
    );

    // Select battery if required
    let selectedBattery: BatteryStorage | undefined;
    let batteryQuantity = 0;
    if (requirements.preferences.includeStorage) {
      const batteryOptions = SolarEquipmentDatabase.getBatteries({
        availability: 'in-stock'
      });
      
      if (batteryOptions.length > 0) {
        const targetBatteryCapacity = requirements.preferences.storageCapacity || 
          this.calculateOptimalBatterySize(requirements.energyUsage);
        
        selectedBattery = batteryOptions.find(b => b.capacity >= targetBatteryCapacity * 0.8) || 
                         batteryOptions[0];
        batteryQuantity = Math.ceil(targetBatteryCapacity / selectedBattery.capacity);
      }
    }

    // Create system specifications
    const systemSpecs: SolarSystemSpecs = {
      dcCapacity: actualSystemSize,
      moduleEfficiency: selectedPanel.efficiency,
      inverterEfficiency: selectedInverter.efficiency.cec,
      systemLosses: this.calculateSystemLosses(requirements.preferences.roofConstraints),
      tiltAngle: requirements.preferences.roofConstraints?.tiltAngle || 
                this.calculateOptimalTilt(requirements.location.latitude),
      azimuthAngle: requirements.preferences.roofConstraints?.azimuthAngle || 180,
      moduleType: panelType,
      trackingType: 'fixed',
      inverterType: inverterType
    };

    // Calculate performance
    const performance = await solarCalculationEngine.calculateSolarProduction(
      requirements.location,
      systemSpecs,
      weatherData,
      {
        includeFinancialAnalysis: true,
        electricityRate: requirements.utilityRates?.energyRate || 0.12,
        systemListime: 25
      }
    );

    // Calculate costs
    const panelCost = panelCount * selectedPanel.wattage * selectedPanel.pricePerWatt;
    const inverterCost = this.calculateInverterCost(selectedInverter, actualSystemSize, inverterType);
    const batteryCost = selectedBattery ? batteryQuantity * selectedBattery.capacity * selectedBattery.pricePerKWh : 0;
    const installationCost = (panelCost + inverterCost + batteryCost) * 0.3; // 30% installation markup
    const totalSystemCost = panelCost + inverterCost + batteryCost + installationCost;

    // Calculate energy analysis
    const annualConsumption = requirements.energyUsage.monthlyUsage.reduce((sum, usage) => sum + usage, 0);
    const offsetPercentage = Math.min(100, (performance.annualProduction / annualConsumption) * 100);
    const excessGeneration = Math.max(0, performance.annualProduction - annualConsumption);
    const gridPurchases = Math.max(0, annualConsumption - performance.annualProduction);

    // Generate design ID
    const designId = `${panelType.substr(0, 4)}-${inverterType}-${Math.round(actualSystemSize * 10)}`;

    // Calculate score
    const score = this.calculateDesignScore(
      {
        systemCost: totalSystemCost,
        performance: performance.annualProduction,
        efficiency: selectedPanel.efficiency,
        reliability: this.calculateReliabilityScore(selectedPanel, selectedInverter),
        offsetPercentage
      },
      requirements
    );

    return {
      designId,
      systemSpecs,
      components: {
        panels: {
          panel: selectedPanel,
          quantity: panelCount,
          totalWattage: panelCount * selectedPanel.wattage,
          cost: panelCost
        },
        inverter: {
          inverter: selectedInverter,
          quantity: inverterType === 'micro' ? panelCount : 
                   inverterType === 'string' ? Math.ceil(actualSystemSize / (selectedInverter.capacity / 1000)) : 1,
          totalCapacity: selectedInverter.capacity,
          cost: inverterCost
        },
        ...(selectedBattery && {
          battery: {
            battery: selectedBattery,
            quantity: batteryQuantity,
            totalCapacity: batteryQuantity * selectedBattery.capacity,
            cost: batteryCost
          }
        })
      },
      performance,
      economics: {
        systemCost: totalSystemCost,
        incentives: totalSystemCost * 0.3, // 30% federal tax credit
        netCost: totalSystemCost * 0.7
      },
      energyAnalysis: {
        annualGeneration: performance.annualProduction,
        annualConsumption,
        offsetPercentage,
        excessGeneration,
        gridPurchases,
        ...(selectedBattery && {
          batteryUtilization: this.calculateBatteryUtilization(
            selectedBattery.capacity * batteryQuantity,
            requirements.energyUsage
          )
        })
      },
      score
    };
  }

  /**
   * Select optimal panel from available options
   */
  private selectOptimalPanel(
    panels: SolarPanel[],
    requirements: SystemDesignRequirements
  ): SolarPanel {
    const goals = requirements.preferences.designGoals;
    
    if (goals?.prioritizeEfficiency) {
      return panels.sort((a, b) => b.efficiency - a.efficiency)[0];
    } else if (goals?.prioritizeCost) {
      return panels.sort((a, b) => a.pricePerWatt - b.pricePerWatt)[0];
    } else {
      // Balance efficiency and cost
      return panels.sort((a, b) => {
        const aScore = a.efficiency / a.pricePerWatt;
        const bScore = b.efficiency / b.pricePerWatt;
        return bScore - aScore;
      })[0];
    }
  }

  /**
   * Select optimal inverter
   */
  private selectOptimalInverter(
    inverters: Inverter[],
    systemSize: number,
    inverterType: string
  ): Inverter {
    if (inverterType === 'micro') {
      // For microinverters, select based on panel compatibility
      return inverters.sort((a, b) => b.efficiency.cec - a.efficiency.cec)[0];
    } else {
      // For string and power optimizers, match capacity to system size
      const targetCapacity = systemSize * 1000 * 0.9; // 90% of DC capacity
      
      const suitableInverters = inverters.filter(inv => 
        inv.capacity >= targetCapacity * 0.8 && inv.capacity <= targetCapacity * 1.2
      );
      
      if (suitableInverters.length === 0) {
        return inverters.sort((a, b) => Math.abs(a.capacity - targetCapacity) - Math.abs(b.capacity - targetCapacity))[0];
      }
      
      return suitableInverters.sort((a, b) => b.efficiency.cec - a.efficiency.cec)[0];
    }
  }

  /**
   * Calculate inverter cost based on type
   */
  private calculateInverterCost(
    inverter: Inverter,
    systemSize: number,
    inverterType: string
  ): number {
    if (inverterType === 'micro') {
      // Microinverters are priced per unit
      const unitsNeeded = Math.ceil((systemSize * 1000) / inverter.capacity);
      return unitsNeeded * inverter.capacity * inverter.pricePerWatt;
    } else {
      // String and power optimizers are priced per system capacity
      return systemSize * 1000 * inverter.pricePerWatt;
    }
  }

  /**
   * Calculate optimal battery size
   */
  private calculateOptimalBatterySize(energyUsage: { monthlyUsage: number[] }): number {
    const averageDailyUsage = energyUsage.monthlyUsage.reduce((sum, usage) => sum + usage, 0) / 365;
    // Size battery for 1-2 days of backup power
    return averageDailyUsage * 1.5;
  }

  /**
   * Calculate system losses based on roof constraints
   */
  private calculateSystemLosses(roofConstraints?: { shadingFactor?: number }): number {
    let baseLosses = 14; // Standard system losses (wiring, soiling, etc.)
    
    if (roofConstraints?.shadingFactor) {
      baseLosses += roofConstraints.shadingFactor;
    }
    
    return Math.min(25, baseLosses); // Cap at 25% total losses
  }

  /**
   * Calculate optimal tilt angle based on latitude
   */
  private calculateOptimalTilt(latitude: number): number {
    // Rule of thumb: tilt angle = latitude ± 15°
    return Math.abs(latitude);
  }

  /**
   * Calculate battery utilization
   */
  private calculateBatteryUtilization(
    batteryCapacity: number,
    energyUsage: { monthlyUsage: number[] }
  ): number {
    const averageDailyUsage = energyUsage.monthlyUsage.reduce((sum, usage) => sum + usage, 0) / 365;
    const utilizationRatio = averageDailyUsage / batteryCapacity;
    return Math.min(100, utilizationRatio * 100);
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(panel: SolarPanel, inverter: Inverter): number {
    const panelScore = (panel.tier === 1 ? 40 : panel.tier === 2 ? 30 : 20) + 
                      (panel.warranty.performance >= 25 ? 20 : 10);
    const inverterScore = (inverter.warranty >= 20 ? 20 : inverter.warranty >= 10 ? 15 : 10) +
                         (inverter.efficiency.cec >= 97 ? 10 : 5);
    
    return Math.min(100, panelScore + inverterScore);
  }

  /**
   * Calculate design score
   */
  private calculateDesignScore(
    metrics: {
      systemCost: number;
      performance: number;
      efficiency: number;
      reliability: number;
      offsetPercentage: number;
    },
    requirements: SystemDesignRequirements
  ): {
    overall: number;
    cost: number;
    performance: number;
    aesthetics: number;
    reliability: number;
  } {
    // Cost score (lower cost = higher score)
    const maxBudget = requirements.budget?.max || metrics.systemCost * 1.5;
    const costScore = Math.max(0, 100 - ((metrics.systemCost / maxBudget) * 100));

    // Performance score
    const targetOffset = requirements.preferences.designGoals?.offsetPercentage || 100;
    const performanceScore = Math.min(100, (metrics.offsetPercentage / targetOffset) * 100);

    // Aesthetics score (based on panel type and efficiency)
    const aestheticsScore = metrics.efficiency * 2; // Higher efficiency = better aesthetics

    // Reliability score
    const reliabilityScore = metrics.reliability;

    // Overall score (weighted average)
    const weights = {
      cost: 0.3,
      performance: 0.4,
      aesthetics: 0.1,
      reliability: 0.2
    };

    const overallScore = 
      costScore * weights.cost +
      performanceScore * weights.performance +
      aestheticsScore * weights.aesthetics +
      reliabilityScore * weights.reliability;

    return {
      overall: Math.round(overallScore),
      cost: Math.round(costScore),
      performance: Math.round(performanceScore),
      aesthetics: Math.round(aestheticsScore),
      reliability: Math.round(reliabilityScore)
    };
  }

  /**
   * Rank designs by score
   */
  private rankDesigns(
    designs: SystemDesignResult[],
    requirements: SystemDesignRequirements
  ): SystemDesignResult[] {
    return designs.sort((a, b) => {
      // Primary sort by overall score
      if (b.score.overall !== a.score.overall) {
        return b.score.overall - a.score.overall;
      }
      
      // Secondary sort by cost (lower is better)
      if (requirements.preferences.designGoals?.prioritizeCost) {
        return a.economics.netCost - b.economics.netCost;
      }
      
      // Tertiary sort by performance
      return b.performance.annualProduction - a.performance.annualProduction;
    });
  }

  /**
   * Generate roof layout
   */
  private generateRoofLayout(
    design: SystemDesignResult,
    roofConstraints: NonNullable<SystemDesignRequirements['preferences']['roofConstraints']>
  ): RoofLayout {
    const panel = design.components.panels.panel;
    const panelCount = design.components.panels.quantity;
    
    // Panel dimensions in meters
    const panelLength = panel.dimensions.length / 1000;
    const panelWidth = panel.dimensions.width / 1000;
    const panelArea = panelLength * panelWidth;
    
    // Calculate layout
    const availableArea = roofConstraints.availableArea || 100; // Default 100 m²
    const maxPanelsPerRow = Math.floor(Math.sqrt(availableArea / panelArea));
    const rows = Math.ceil(panelCount / maxPanelsPerRow);
    
    const panelsPerRow: number[] = [];
    let remainingPanels = panelCount;
    
    for (let i = 0; i < rows; i++) {
      const panelsInThisRow = Math.min(maxPanelsPerRow, remainingPanels);
      panelsPerRow.push(panelsInThisRow);
      remainingPanels -= panelsInThisRow;
    }

    return {
      totalPanels: panelCount,
      rows,
      panelsPerRow,
      spacing: {
        rowSpacing: 1.5, // 1.5m between rows
        panelSpacing: 0.02 // 2cm between panels
      },
      orientation: {
        tilt: roofConstraints.tiltAngle || 30,
        azimuth: roofConstraints.azimuthAngle || 180
      },
      areaCoverage: {
        totalRoofArea: availableArea,
        panelArea: panelCount * panelArea,
        utilizationPercentage: (panelCount * panelArea / availableArea) * 100
      }
    };
  }

  /**
   * Generate financing options
   */
  private generateFinancingOptions(
    design: SystemDesignResult,
    utilityRates: NonNullable<SystemDesignRequirements['utilityRates']>
  ): FinancingOption[] {
    const systemCost = design.economics.netCost;
    const annualSavings = design.performance.financialAnalysis.annualSavings;

    return [
      // Cash purchase
      {
        type: 'cash',
        provider: 'Self-financed',
        terms: {},
        economics: {
          totalCost: systemCost,
          monthlySavings: annualSavings / 12,
          netSavings: design.performance.financialAnalysis.totalLifetimeSavings - systemCost,
          breakEvenPoint: design.performance.financialAnalysis.paybackPeriod
        }
      },
      // Solar loan (7% APR, 20 years)
      {
        type: 'loan',
        provider: 'Solar Loan Provider',
        terms: {
          duration: 20,
          interestRate: 7.0,
          monthlyPayment: this.calculateLoanPayment(systemCost, 7.0, 20)
        },
        economics: {
          totalCost: this.calculateLoanPayment(systemCost, 7.0, 20) * 12 * 20,
          monthlySavings: annualSavings / 12 - this.calculateLoanPayment(systemCost, 7.0, 20),
          netSavings: annualSavings * 20 - (this.calculateLoanPayment(systemCost, 7.0, 20) * 12 * 20),
          breakEvenPoint: 0 // Immediate positive cash flow potential
        }
      }
    ];
  }

  /**
   * Calculate loan payment
   */
  private calculateLoanPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
}

// Export singleton instance
export const systemDesigner = new SystemDesigner();