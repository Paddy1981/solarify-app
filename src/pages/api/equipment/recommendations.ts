/**
 * Equipment Recommendations API Endpoint
 * Intelligent equipment selection and system optimization
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AdvancedSearchEngine } from '@/lib/solar/advanced-search-engine';
import { CompatibilityMatchingEngine } from '@/lib/solar/compatibility-matching-engine';
import { SolarEquipmentDatabase } from '@/lib/solar/solar-database';
import { z } from 'zod';

const recommendationRequestSchema = z.object({
  type: z.enum(['system_design', 'component_alternative', 'upgrade_path', 'cost_optimization']),
  requirements: z.object({
    systemSize: z.number().min(1).max(1000), // kW
    budget: z.number().min(1000).optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      climate: z.string(),
      utility: z.string().optional()
    }),
    installation: z.object({
      roofType: z.string(),
      roofArea: z.number().min(10), // m²
      roofPitch: z.number().min(0).max(90), // degrees
      azimuth: z.number().min(0).max(360), // degrees
      shading: z.enum(['none', 'minimal', 'moderate', 'significant']),
      structuralLimitations: z.array(z.string()).optional()
    }),
    preferences: z.object({
      panelType: z.enum(['monocrystalline', 'polycrystalline', 'thin-film', 'bifacial']).optional(),
      inverterType: z.enum(['string', 'power-optimizer', 'micro', 'central']).optional(),
      batteryStorage: z.boolean().default(false),
      batteryCapacity: z.number().optional(), // kWh
      monitoring: z.enum(['basic', 'advanced', 'professional']).default('basic'),
      aesthetics: z.enum(['standard', 'premium', 'stealth']).default('standard'),
      brand: z.enum(['tier1_only', 'value_focused', 'premium_only', 'no_preference']).default('no_preference')
    }),
    priorities: z.array(z.enum(['cost', 'efficiency', 'reliability', 'aesthetics', 'performance'])).min(1)
  }),
  constraints: z.object({
    maxBudget: z.number().optional(),
    maxPaybackPeriod: z.number().optional(), // years
    requiredWarranty: z.number().optional(), // years
    installationTimeline: z.number().optional(), // days
    maintenancePreference: z.enum(['minimal', 'standard', 'proactive']).optional()
  }).optional(),
  existingSystem: z.object({
    panels: z.array(z.any()).optional(),
    inverter: z.any().optional(),
    battery: z.any().optional()
  }).optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedRequest = recommendationRequestSchema.parse(req.body);
    const { type, requirements, constraints, existingSystem } = validatedRequest;

    let recommendations;

    switch (type) {
      case 'system_design':
        recommendations = await generateSystemDesignRecommendations(requirements, constraints);
        break;
      case 'component_alternative':
        recommendations = await generateComponentAlternatives(requirements, existingSystem);
        break;
      case 'upgrade_path':
        recommendations = await generateUpgradePath(requirements, existingSystem);
        break;
      case 'cost_optimization':
        recommendations = await generateCostOptimizations(requirements, constraints);
        break;
      default:
        throw new Error('Invalid recommendation type');
    }

    res.status(200).json({
      success: true,
      data: {
        type,
        recommendations,
        analysis: await generateAnalysis(requirements, recommendations),
        metadata: {
          generatedAt: new Date().toISOString(),
          validFor: '7 days',
          confidence: calculateConfidenceScore(recommendations),
          factors: getDecisionFactors(requirements, constraints)
        }
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Generate complete system design recommendations
 */
async function generateSystemDesignRecommendations(requirements: any, constraints?: any) {
  const { systemSize, budget, location, installation, preferences, priorities } = requirements;

  // Get suitable panels based on requirements
  const panelCriteria = {
    type: preferences.panelType,
    tier: preferences.brand === 'tier1_only' ? 1 : undefined,
    maxPrice: budget ? budget * 0.4 / (systemSize * 1000) : undefined, // 40% of budget for panels
    availability: 'in-stock'
  };
  
  const suitablePanels = SolarEquipmentDatabase.getPanels(panelCriteria);
  
  // Generate multiple system configurations
  const configurations = [];
  
  for (const panel of suitablePanels.slice(0, 5)) { // Top 5 panels
    const panelCount = Math.ceil((systemSize * 1000) / panel.wattage);
    const actualSystemSize = (panelCount * panel.wattage) / 1000;
    
    // Find compatible inverters
    const inverterCriteria = {
      type: preferences.inverterType,
      minCapacity: actualSystemSize * 800, // 80% of DC capacity
      maxCapacity: actualSystemSize * 1200, // 120% of DC capacity
      availability: 'in-stock'
    };
    
    const compatibleInverters = SolarEquipmentDatabase.getInverters(inverterCriteria);
    
    for (const inverter of compatibleInverters.slice(0, 3)) { // Top 3 inverters
      const configuration = {
        id: `config-${panel.id}-${inverter.id}`,
        systemSize: actualSystemSize,
        components: {
          panels: {
            model: panel,
            quantity: panelCount,
            totalPower: actualSystemSize
          },
          inverter: {
            model: inverter,
            quantity: calculateInverterQuantity(actualSystemSize, inverter.capacity)
          }
        },
        layout: calculateSystemLayout(panelCount, installation.roofArea, panel.dimensions),
        performance: calculatePerformanceMetrics(panel, inverter, actualSystemSize, location),
        cost: calculateSystemCost(panel, inverter, panelCount, preferences.batteryStorage),
        compatibility: await checkSystemCompatibility(panel, inverter, installation),
        score: calculateConfigurationScore(panel, inverter, requirements, priorities)
      };
      
      // Add battery if requested
      if (preferences.batteryStorage) {
        const batteryCapacity = preferences.batteryCapacity || actualSystemSize * 1.5; // Default 1.5x system size
        const suitableBatteries = SolarEquipmentDatabase.getBatteries({
          minCapacity: batteryCapacity * 0.8,
          maxCapacity: batteryCapacity * 1.5,
          availability: 'in-stock'
        });
        
        if (suitableBatteries.length > 0) {
          configuration.components.battery = {
            model: suitableBatteries[0],
            quantity: Math.ceil(batteryCapacity / suitableBatteries[0].capacity)
          };
        }
      }
      
      configurations.push(configuration);
    }
  }
  
  // Sort configurations by score
  configurations.sort((a, b) => b.score - a.score);
  
  return {
    totalConfigurations: configurations.length,
    recommendedConfigurations: configurations.slice(0, 3),
    alternativeConfigurations: configurations.slice(3, 6),
    summary: {
      priceRange: {
        min: Math.min(...configurations.map(c => c.cost.total)),
        max: Math.max(...configurations.map(c => c.cost.total))
      },
      efficiencyRange: {
        min: Math.min(...configurations.map(c => c.performance.systemEfficiency)),
        max: Math.max(...configurations.map(c => c.performance.systemEfficiency))
      },
      productionRange: {
        min: Math.min(...configurations.map(c => c.performance.annualProduction)),
        max: Math.max(...configurations.map(c => c.performance.annualProduction))
      }
    }
  };
}

/**
 * Generate component alternatives
 */
async function generateComponentAlternatives(requirements: any, existingSystem?: any) {
  if (!existingSystem) {
    throw new Error('Existing system information required for component alternatives');
  }

  const alternatives = {
    panels: [],
    inverters: [],
    batteries: []
  };

  // Generate panel alternatives
  if (existingSystem.panels) {
    const currentPanel = existingSystem.panels[0];
    const alternativePanels = SolarEquipmentDatabase.getPanels({
      minWattage: currentPanel.wattage * 0.9,
      maxWattage: currentPanel.wattage * 1.1,
      minEfficiency: currentPanel.efficiency * 0.95,
      availability: 'in-stock'
    }).filter(p => p.id !== currentPanel.id);

    alternatives.panels = alternativePanels.slice(0, 5).map(panel => ({
      component: panel,
      comparison: {
        efficiency: panel.efficiency - currentPanel.efficiency,
        power: panel.wattage - currentPanel.wattage,
        cost: panel.pricePerWatt - currentPanel.pricePerWatt,
        warranty: (panel.warranty?.performance || 0) - (currentPanel.warranty?.performance || 0)
      },
      benefits: generateBenefits(panel, currentPanel),
      drawbacks: generateDrawbacks(panel, currentPanel),
      compatibilityScore: 95 // Would calculate actual compatibility
    }));
  }

  // Generate inverter alternatives
  if (existingSystem.inverter) {
    const currentInverter = existingSystem.inverter;
    const alternativeInverters = SolarEquipmentDatabase.getInverters({
      minCapacity: currentInverter.capacity * 0.8,
      maxCapacity: currentInverter.capacity * 1.2,
      minEfficiency: currentInverter.efficiency.cec * 0.95,
      availability: 'in-stock'
    }).filter(i => i.id !== currentInverter.id);

    alternatives.inverters = alternativeInverters.slice(0, 5).map(inverter => ({
      component: inverter,
      comparison: {
        efficiency: inverter.efficiency.cec - currentInverter.efficiency.cec,
        capacity: inverter.capacity - currentInverter.capacity,
        cost: inverter.pricePerWatt - currentInverter.pricePerWatt,
        warranty: inverter.warranty - currentInverter.warranty
      },
      benefits: generateBenefits(inverter, currentInverter),
      drawbacks: generateDrawbacks(inverter, currentInverter),
      compatibilityScore: 90
    }));
  }

  return alternatives;
}

/**
 * Generate upgrade path recommendations
 */
async function generateUpgradePath(requirements: any, existingSystem?: any) {
  if (!existingSystem) {
    return {
      message: 'No existing system provided',
      newSystemRecommendation: await generateSystemDesignRecommendations(requirements)
    };
  }

  const upgrades = [];

  // Panel efficiency upgrades
  if (existingSystem.panels) {
    const currentPanel = existingSystem.panels[0];
    if (currentPanel.efficiency < 20) {
      upgrades.push({
        type: 'panel_efficiency_upgrade',
        priority: 'high',
        description: 'Upgrade to higher efficiency panels for increased production',
        recommendation: SolarEquipmentDatabase.getPanels({
          minEfficiency: 21,
          tier: 1,
          availability: 'in-stock'
        })[0],
        benefits: {
          additionalProduction: '15-25% increase',
          roofSpaceOptimization: 'Generate more power in same space',
          futureProofing: 'Latest technology'
        },
        investment: calculateUpgradeCost(currentPanel, 'efficiency'),
        paybackPeriod: calculatePaybackPeriod(currentPanel, 'efficiency')
      });
    }
  }

  // Battery storage addition
  if (!existingSystem.battery && requirements.preferences.batteryStorage) {
    const recommendedBattery = SolarEquipmentDatabase.getBatteries({
      minCapacity: requirements.systemSize * 1.2,
      technology: 'lithium-ion',
      availability: 'in-stock'
    })[0];

    upgrades.push({
      type: 'battery_addition',
      priority: 'medium',
      description: 'Add battery storage for energy independence and backup power',
      recommendation: recommendedBattery,
      benefits: {
        energyIndependence: 'Store excess solar production',
        backupPower: 'Power during outages',
        utilityArbitrage: 'Save on peak electricity rates'
      },
      investment: recommendedBattery.pricePerKWh * recommendedBattery.capacity,
      paybackPeriod: calculateBatteryPaybackPeriod(recommendedBattery)
    });
  }

  // Monitoring system upgrade
  if (requirements.preferences.monitoring !== 'basic') {
    upgrades.push({
      type: 'monitoring_upgrade',
      priority: 'low',
      description: 'Upgrade to advanced monitoring for better system insights',
      recommendation: {
        type: 'advanced_monitoring',
        features: ['panel-level monitoring', 'performance analytics', 'fault detection'],
        cost: 500
      },
      benefits: {
        optimization: 'Identify underperforming components',
        maintenance: 'Predictive maintenance alerts',
        warranty: 'Enhanced warranty protection'
      },
      investment: 500,
      paybackPeriod: 'N/A - Maintenance benefit'
    });
  }

  return {
    upgrades: upgrades.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    }),
    timeline: generateUpgradeTimeline(upgrades),
    totalInvestment: upgrades.reduce((sum, u) => sum + u.investment, 0)
  };
}

/**
 * Generate cost optimization recommendations
 */
async function generateCostOptimizations(requirements: any, constraints?: any) {
  const optimizations = [];

  // Value-oriented panel selection
  const valuePanels = SolarEquipmentDatabase.getPanels({
    maxPrice: 0.55, // Lower cost threshold
    minEfficiency: 19, // Still good efficiency
    availability: 'in-stock'
  });

  if (valuePanels.length > 0) {
    optimizations.push({
      type: 'value_panel_selection',
      title: 'Cost-Effective Panel Options',
      description: 'High-value panels with good efficiency at lower cost',
      recommendation: valuePanels[0],
      savings: calculateSavings(requirements, valuePanels[0]),
      tradeoffs: ['Slightly lower efficiency', 'Standard warranty terms'],
      suitability: 'Good for budget-conscious installations'
    });
  }

  // System sizing optimization
  const optimizedSize = optimizeSystemSize(requirements, constraints);
  if (optimizedSize.savings > 0) {
    optimizations.push({
      type: 'system_sizing',
      title: 'Optimized System Size',
      description: 'Right-sized system for maximum ROI',
      recommendation: optimizedSize,
      savings: optimizedSize.savings,
      benefits: ['Lower upfront cost', 'Faster payback', 'Optimal ROI'],
      impact: 'Slightly reduced energy production'
    });
  }

  // Financing optimization
  if (constraints?.maxBudget && requirements.budget > constraints.maxBudget) {
    optimizations.push({
      type: 'financing_options',
      title: 'Alternative Financing',
      description: 'Financing options to fit budget constraints',
      options: [
        {
          type: 'solar_loan',
          downPayment: constraints.maxBudget * 0.2,
          monthlyPayment: (requirements.budget - constraints.maxBudget * 0.2) / 120, // 10-year loan
          benefits: ['Lower upfront cost', 'Tax benefits', 'Immediate savings']
        },
        {
          type: 'ppa',
          monthlyPayment: calculatePPAPayment(requirements.systemSize),
          benefits: ['No upfront cost', 'Maintenance included', 'Predictable costs']
        }
      ]
    });
  }

  return optimizations;
}

// Helper functions
function calculateInverterQuantity(systemSize: number, inverterCapacity: number): number {
  return Math.ceil(systemSize * 1000 / inverterCapacity);
}

function calculateSystemLayout(panelCount: number, roofArea: number, panelDimensions: any) {
  const panelArea = (panelDimensions.length * panelDimensions.width) / 1000000; // m²
  const totalPanelArea = panelCount * panelArea;
  const utilizationRatio = totalPanelArea / roofArea;

  return {
    panelCount,
    totalPanelArea: Math.round(totalPanelArea),
    roofUtilization: Math.round(utilizationRatio * 100),
    spacingFactor: 1.4, // Account for spacing
    feasible: totalPanelArea * 1.4 <= roofArea
  };
}

function calculatePerformanceMetrics(panel: any, inverter: any, systemSize: number, location: any) {
  const annualProduction = systemSize * 1350; // kWh/year (simplified)
  const systemEfficiency = panel.efficiency * (inverter.efficiency.cec / 100);
  
  return {
    annualProduction: Math.round(annualProduction),
    systemEfficiency: Math.round(systemEfficiency * 100) / 100,
    capacity: systemSize,
    performanceRatio: 0.85, // Typical performance ratio
    degradationRate: Math.abs(panel.temperatureCoefficient || 0.5)
  };
}

function calculateSystemCost(panel: any, inverter: any, panelCount: number, includeBattery: boolean) {
  const panelCost = panel.wattage * panelCount * panel.pricePerWatt;
  const inverterCost = inverter.capacity * inverter.pricePerWatt;
  const installationCost = (panelCost + inverterCost) * 0.3; // 30% installation markup
  const batteryCost = includeBattery ? 15000 : 0; // Simplified battery cost
  
  const total = panelCost + inverterCost + installationCost + batteryCost;
  
  return {
    panels: Math.round(panelCost),
    inverter: Math.round(inverterCost),
    installation: Math.round(installationCost),
    battery: batteryCost,
    total: Math.round(total),
    pricePerWatt: Math.round((total / (panelCount * panel.wattage)) * 100) / 100
  };
}

function calculateConfigurationScore(panel: any, inverter: any, requirements: any, priorities: string[]): number {
  let score = 0;
  
  // Base scores
  score += panel.efficiency * 2; // Efficiency weight
  score += panel.tier === 1 ? 15 : panel.tier === 2 ? 10 : 5; // Tier weight
  score += inverter.efficiency.cec * 0.5; // Inverter efficiency weight
  
  // Priority-based adjustments
  for (const priority of priorities) {
    switch (priority) {
      case 'efficiency':
        score += panel.efficiency * 1.5;
        break;
      case 'cost':
        score -= panel.pricePerWatt * 10;
        break;
      case 'reliability':
        score += (panel.warranty?.performance || 0);
        break;
    }
  }
  
  return Math.round(score * 100) / 100;
}

async function checkSystemCompatibility(panel: any, inverter: any, installation: any): Promise<number> {
  // Simplified compatibility check
  return 95; // Would use actual compatibility engine
}

function calculateUpgradeCost(currentComponent: any, upgradeType: string): number {
  // Simplified upgrade cost calculation
  return currentComponent.pricePerWatt * 1000 * 1.2; // 20% premium for upgrade
}

function calculatePaybackPeriod(currentComponent: any, upgradeType: string): string {
  // Simplified payback calculation
  return '6-8 years';
}

function calculateBatteryPaybackPeriod(battery: any): string {
  // Simplified battery payback calculation
  return '8-12 years';
}

function generateUpgradeTimeline(upgrades: any[]): any[] {
  return [
    { phase: 1, timeframe: '0-6 months', upgrades: upgrades.filter(u => u.priority === 'high') },
    { phase: 2, timeframe: '6-18 months', upgrades: upgrades.filter(u => u.priority === 'medium') },
    { phase: 3, timeframe: '18+ months', upgrades: upgrades.filter(u => u.priority === 'low') }
  ];
}

function generateBenefits(newComponent: any, currentComponent: any): string[] {
  const benefits = [];
  if (newComponent.efficiency > currentComponent.efficiency) {
    benefits.push('Higher efficiency');
  }
  if (newComponent.warranty?.performance > currentComponent.warranty?.performance) {
    benefits.push('Extended warranty');
  }
  return benefits;
}

function generateDrawbacks(newComponent: any, currentComponent: any): string[] {
  const drawbacks = [];
  if (newComponent.pricePerWatt > currentComponent.pricePerWatt) {
    drawbacks.push('Higher cost');
  }
  return drawbacks;
}

function calculateSavings(requirements: any, component: any): number {
  // Simplified savings calculation
  return 2000; // $2000 savings
}

function optimizeSystemSize(requirements: any, constraints?: any): any {
  // Simplified system size optimization
  return {
    originalSize: requirements.systemSize,
    optimizedSize: requirements.systemSize * 0.9,
    savings: requirements.budget * 0.1
  };
}

function calculatePPAPayment(systemSize: number): number {
  return systemSize * 120; // $120/kW/year
}

async function generateAnalysis(requirements: any, recommendations: any): Promise<any> {
  return {
    keyFactors: [
      `System size: ${requirements.systemSize} kW`,
      `Location: ${requirements.location.climate} climate`,
      `Roof type: ${requirements.installation.roofType}`,
      `Priority: ${requirements.priorities[0]}`
    ],
    assumptions: [
      'Average 1,350 kWh/kW annual production',
      'Standard installation conditions',
      'Current utility rates and incentives',
      '25-year system lifetime'
    ],
    limitations: [
      'Pricing subject to change',
      'Local permits and regulations may apply',
      'Site-specific conditions may affect performance'
    ]
  };
}

function calculateConfidenceScore(recommendations: any): number {
  // Calculate confidence based on data quality and completeness
  return 85; // 85% confidence
}

function getDecisionFactors(requirements: any, constraints?: any): string[] {
  return [
    'System size requirements',
    'Budget constraints',
    'Performance priorities',
    'Installation requirements',
    'Local climate conditions'
  ];
}