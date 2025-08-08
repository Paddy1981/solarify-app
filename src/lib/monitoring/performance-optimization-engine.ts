/**
 * Performance Optimization Engine
 * AI-powered system optimization and actionable recommendations for solar systems
 */

import { collection, doc, addDoc, updateDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SolarSystem, EnergyProductionRecord } from '../../types/firestore-schema';
import { errorTracker } from './error-tracker';
import { realTimeMonitoringService, RealTimeSystem } from './real-time-monitoring-service';
import { anomalyDetectionEngine } from './anomaly-detection-engine';
import { EventEmitter } from 'events';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface OptimizationConfig {
  systemId: string;
  enabled: boolean;
  optimizationGoals: OptimizationGoal[];
  constraints: OptimizationConstraint[];
  analysisDepth: 'basic' | 'intermediate' | 'advanced';
  updateFrequency: number; // hours
  costConsideration: boolean;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export type OptimizationGoal = 
  | 'maximize_production'
  | 'maximize_efficiency'
  | 'minimize_costs'
  | 'extend_lifespan'
  | 'improve_reliability'
  | 'reduce_maintenance'
  | 'optimize_roi';

export interface OptimizationConstraint {
  type: 'budget' | 'time' | 'safety' | 'regulatory' | 'technical';
  description: string;
  value: number;
  unit: string;
  priority: 'hard' | 'soft';
}

export interface OptimizationResult {
  systemId: string;
  timestamp: Date;
  currentPerformance: PerformanceMetrics;
  optimizedPerformance: PerformanceMetrics;
  recommendations: OptimizationRecommendation[];
  projectedImpact: ProjectedImpact;
  implementationPlan: ImplementationPlan;
  riskAssessment: RiskAssessment;
  costBenefitAnalysis: CostBenefitAnalysis;
  confidence: number; // 0-1
}

export interface PerformanceMetrics {
  energyProduction: number; // kWh/day
  systemEfficiency: number; // %
  performanceRatio: number; // 0-1
  availabilityFactor: number; // 0-1
  degradationRate: number; // %/year
  maintenanceCost: number; // $/year
  operatingCost: number; // $/year
  carbonOffset: number; // kg CO2/year
}

export interface OptimizationRecommendation {
  id: string;
  category: RecommendationCategory;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  impact: RecommendationImpact;
  implementation: RecommendationImplementation;
  status: RecommendationStatus;
  dependencies: string[];
  alternatives: AlternativeRecommendation[];
  createdAt: Date;
  updatedAt: Date;
}

export type RecommendationCategory = 
  | 'equipment_upgrade'
  | 'maintenance_optimization'
  | 'operational_adjustment'
  | 'monitoring_enhancement'
  | 'system_expansion'
  | 'energy_management'
  | 'cost_reduction'
  | 'safety_improvement';

export type RecommendationType = 
  | 'hardware_replacement'
  | 'software_update'
  | 'configuration_change'
  | 'maintenance_schedule'
  | 'cleaning_optimization'
  | 'shading_mitigation'
  | 'inverter_optimization'
  | 'string_reconfiguration'
  | 'monitoring_upgrade'
  | 'battery_integration';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationStatus = 
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'deferred';

export interface RecommendationImpact {
  productionIncrease: number; // kWh/year
  efficiencyImprovement: number; // %
  costSavings: number; // $/year
  maintenanceReduction: number; // %
  lifespanExtension: number; // years
  co2ReductionIncrease: number; // kg/year
  paybackPeriod: number; // years
  roi: number; // %
  riskReduction: number; // %
}

export interface RecommendationImplementation {
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number; // hours
  estimatedCost: number; // $
  requiredSkills: string[];
  requiredTools: string[];
  safetyRequirements: string[];
  permits: string[];
  downtime: number; // hours
  bestTimeframe: string;
  contractor: 'diy' | 'certified_technician' | 'specialist';
}

export interface AlternativeRecommendation {
  title: string;
  description: string;
  cost: number;
  impact: number;
  complexity: string;
}

export interface ProjectedImpact {
  shortTerm: ImpactTimeframe; // 1 year
  mediumTerm: ImpactTimeframe; // 5 years
  longTerm: ImpactTimeframe; // 25 years
  cumulativeLifetime: LifetimeImpact;
}

export interface ImpactTimeframe {
  energyIncrease: number; // kWh
  costSavings: number; // $
  efficiencyGain: number; // %
  reliabilityImprovement: number; // %
  maintenanceReduction: number; // %
}

export interface LifetimeImpact {
  totalEnergyIncrease: number; // kWh
  totalCostSavings: number; // $
  totalCo2Reduction: number; // kg
  netPresentValue: number; // $
  internalRateOfReturn: number; // %
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalDuration: number; // days
  totalCost: number; // $
  riskMitigation: RiskMitigationStep[];
  successMetrics: SuccessMetric[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: number; // days
  cost: number; // $
  prerequisites: string[];
  deliverables: string[];
  risks: string[];
  recommendations: string[];
}

export interface RiskMitigationStep {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency: string;
}

export interface SuccessMetric {
  metric: string;
  baseline: number;
  target: number;
  unit: string;
  measurementMethod: string;
  frequency: string;
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high';
  technicalRisks: Risk[];
  financialRisks: Risk[];
  operationalRisks: Risk[];
  safetyRisks: Risk[];
  regulatoryRisks: Risk[];
  mitigationStrategies: MitigationStrategy[];
}

export interface Risk {
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export interface MitigationStrategy {
  risk: string;
  strategy: string;
  cost: number;
  effectiveness: number; // 0-1
}

export interface CostBenefitAnalysis {
  totalCost: number;
  totalBenefit: number;
  netBenefit: number;
  benefitCostRatio: number;
  paybackPeriod: number; // years
  netPresentValue: number;
  internalRateOfReturn: number; // %
  sensitivity: SensitivityAnalysis;
}

export interface SensitivityAnalysis {
  scenarios: Scenario[];
  breakEvenPoint: number;
  riskAdjustedReturn: number;
}

export interface Scenario {
  name: string;
  probability: number;
  outcome: {
    cost: number;
    benefit: number;
    npv: number;
    irr: number;
  };
}

// =====================================================
// PERFORMANCE OPTIMIZATION ENGINE CLASS
// =====================================================

export class PerformanceOptimizationEngine extends EventEmitter {
  private optimizationConfigs: Map<string, OptimizationConfig> = new Map();
  private optimizationResults: Map<string, OptimizationResult[]> = new Map();
  private benchmarkData: Map<string, any> = new Map();
  private industryStandards: Map<string, any> = new Map();
  private weatherData: Map<string, any> = new Map();
  private costDatabase: Map<string, any> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
    this.initializeBenchmarkData();
    this.initializeIndustryStandards();
    this.initializeCostDatabase();
  }

  /**
   * Initialize optimization for a system
   */
  public async initializeOptimization(
    systemId: string,
    config?: Partial<OptimizationConfig>
  ): Promise<void> {
    try {
      const defaultConfig: OptimizationConfig = {
        systemId,
        enabled: true,
        optimizationGoals: ['maximize_production', 'maximize_efficiency', 'minimize_costs'],
        constraints: [
          {
            type: 'budget',
            description: 'Maximum optimization investment',
            value: 5000,
            unit: '$',
            priority: 'hard'
          },
          {
            type: 'time',
            description: 'Maximum system downtime',
            value: 8,
            unit: 'hours',
            priority: 'soft'
          }
        ],
        analysisDepth: 'intermediate',
        updateFrequency: 24, // daily
        costConsideration: true,
        riskTolerance: 'moderate'
      };

      const optimizationConfig = { ...defaultConfig, ...config };
      this.optimizationConfigs.set(systemId, optimizationConfig);

      // Initialize empty results array
      this.optimizationResults.set(systemId, []);

      // Run initial optimization analysis
      await this.runOptimizationAnalysis(systemId);

      this.emit('optimization_initialized', { systemId, config: optimizationConfig });

      errorTracker.addBreadcrumb('Performance optimization initialized', 'optimization', { systemId });

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Run comprehensive optimization analysis
   */
  public async runOptimizationAnalysis(systemId: string): Promise<OptimizationResult> {
    try {
      const config = this.optimizationConfigs.get(systemId);
      if (!config) {
        throw new Error(`Optimization not configured for system ${systemId}`);
      }

      // Get current system data
      const realTimeSystem = realTimeMonitoringService.getRealTimeSystem(systemId);
      const systemInfo = await this.getSystemInfo(systemId);
      const historicalPerformance = await this.getHistoricalPerformance(systemId);

      if (!realTimeSystem || !systemInfo) {
        throw new Error(`System data not available for ${systemId}`);
      }

      // Calculate current performance metrics
      const currentPerformance = this.calculateCurrentPerformance(realTimeSystem, historicalPerformance);

      // Analyze optimization opportunities
      const recommendations = await this.generateOptimizationRecommendations(
        systemId,
        realTimeSystem,
        systemInfo,
        currentPerformance,
        config
      );

      // Calculate projected optimized performance
      const optimizedPerformance = this.calculateOptimizedPerformance(currentPerformance, recommendations);

      // Assess projected impact
      const projectedImpact = this.assessProjectedImpact(currentPerformance, optimizedPerformance);

      // Create implementation plan
      const implementationPlan = this.createImplementationPlan(recommendations);

      // Assess risks
      const riskAssessment = this.assessRisks(recommendations, systemInfo);

      // Perform cost-benefit analysis
      const costBenefitAnalysis = this.performCostBenefitAnalysis(recommendations, projectedImpact);

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(
        realTimeSystem,
        historicalPerformance,
        recommendations
      );

      const optimizationResult: OptimizationResult = {
        systemId,
        timestamp: new Date(),
        currentPerformance,
        optimizedPerformance,
        recommendations,
        projectedImpact,
        implementationPlan,
        riskAssessment,
        costBenefitAnalysis,
        confidence
      };

      // Store result
      this.storeOptimizationResult(systemId, optimizationResult);

      // Emit event
      this.emit('optimization_completed', { systemId, result: optimizationResult });

      return optimizationResult;

    } catch (error) {
      errorTracker.captureException(error as Error, { systemId });
      throw error;
    }
  }

  /**
   * Get optimization recommendations for a system
   */
  public getOptimizationRecommendations(
    systemId: string,
    filters?: {
      category?: RecommendationCategory[];
      priority?: RecommendationPriority[];
      status?: RecommendationStatus[];
      maxCost?: number;
    }
  ): OptimizationRecommendation[] {
    const results = this.optimizationResults.get(systemId) || [];
    if (results.length === 0) return [];

    const latestResult = results[results.length - 1];
    let recommendations = latestResult.recommendations;

    // Apply filters
    if (filters) {
      if (filters.category) {
        recommendations = recommendations.filter(r => filters.category!.includes(r.category));
      }
      if (filters.priority) {
        recommendations = recommendations.filter(r => filters.priority!.includes(r.priority));
      }
      if (filters.status) {
        recommendations = recommendations.filter(r => filters.status!.includes(r.status));
      }
      if (filters.maxCost) {
        recommendations = recommendations.filter(r => r.implementation.estimatedCost <= filters.maxCost!);
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Update recommendation status
   */
  public async updateRecommendationStatus(
    recommendationId: string,
    status: RecommendationStatus,
    notes?: string
  ): Promise<void> {
    try {
      // Find and update recommendation
      for (const results of this.optimizationResults.values()) {
        for (const result of results) {
          const recommendation = result.recommendations.find(r => r.id === recommendationId);
          if (recommendation) {
            recommendation.status = status;
            recommendation.updatedAt = new Date();

            // Store in database
            await updateDoc(doc(db, 'optimization_recommendations', recommendationId), {
              status,
              updatedAt: serverTimestamp(),
              notes
            });

            this.emit('recommendation_updated', { recommendationId, status, notes });
            return;
          }
        }
      }

      throw new Error(`Recommendation ${recommendationId} not found`);

    } catch (error) {
      errorTracker.captureException(error as Error, { recommendationId });
      throw error;
    }
  }

  /**
   * Get optimization statistics
   */
  public getOptimizationStatistics(systemId?: string): {
    totalRecommendations: number;
    completedRecommendations: number;
    pendingRecommendations: number;
    totalPotentialSavings: number;
    realizedSavings: number;
    averagePaybackPeriod: number;
    averageRoi: number;
  } {
    const systems = systemId ? [systemId] : Array.from(this.optimizationResults.keys());
    const allResults = systems.flatMap(id => this.optimizationResults.get(id) || []);
    const allRecommendations = allResults.flatMap(result => result.recommendations);

    return {
      totalRecommendations: allRecommendations.length,
      completedRecommendations: allRecommendations.filter(r => r.status === 'completed').length,
      pendingRecommendations: allRecommendations.filter(r => r.status === 'pending').length,
      totalPotentialSavings: allRecommendations.reduce((sum, r) => sum + r.impact.costSavings, 0),
      realizedSavings: allRecommendations
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.impact.costSavings, 0),
      averagePaybackPeriod: allRecommendations.reduce((sum, r) => sum + r.impact.paybackPeriod, 0) / allRecommendations.length || 0,
      averageRoi: allRecommendations.reduce((sum, r) => sum + r.impact.roi, 0) / allRecommendations.length || 0
    };
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private setupEventHandlers(): void {
    this.on('optimization_completed', this.handleOptimizationCompleted.bind(this));
    this.on('recommendation_updated', this.handleRecommendationUpdated.bind(this));
  }

  private initializeBenchmarkData(): void {
    // Initialize benchmark data for different system types and regions
    this.benchmarkData.set('residential_10kw', {
      averageProduction: 40, // kWh/day
      averageEfficiency: 18.5, // %
      averagePerformanceRatio: 0.82,
      averageDegradationRate: 0.5 // %/year
    });
  }

  private initializeIndustryStandards(): void {
    // Initialize industry standards and best practices
    this.industryStandards.set('performance_ratio_excellent', 0.85);
    this.industryStandards.set('performance_ratio_good', 0.75);
    this.industryStandards.set('efficiency_excellent', 20.0);
    this.industryStandards.set('degradation_rate_excellent', 0.4);
  }

  private initializeCostDatabase(): void {
    // Initialize cost database for different components and services
    this.costDatabase.set('panel_cleaning', { cost: 150, frequency: 'quarterly' });
    this.costDatabase.set('inverter_replacement', { cost: 2500, lifespan: 15 });
    this.costDatabase.set('optimizer_replacement', { cost: 150, lifespan: 20 });
    this.costDatabase.set('monitoring_upgrade', { cost: 500, benefits: 'improved_diagnostics' });
  }

  private calculateCurrentPerformance(
    realTimeSystem: RealTimeSystem,
    historicalData?: any
  ): PerformanceMetrics {
    return {
      energyProduction: realTimeSystem.currentProduction.cumulative.todayEnergy,
      systemEfficiency: realTimeSystem.performance.metrics.systemEfficiency,
      performanceRatio: realTimeSystem.performance.metrics.performanceRatio,
      availabilityFactor: realTimeSystem.performance.metrics.capacityFactor,
      degradationRate: realTimeSystem.performance.degradation.annualRate,
      maintenanceCost: 500, // Annual estimate
      operatingCost: 200, // Annual estimate
      carbonOffset: 2500 // Annual kg CO2
    };
  }

  private async generateOptimizationRecommendations(
    systemId: string,
    realTimeSystem: RealTimeSystem,
    systemInfo: SolarSystem,
    currentPerformance: PerformanceMetrics,
    config: OptimizationConfig
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze different optimization opportunities
    recommendations.push(...await this.analyzeMaintenanceOptimization(systemId, realTimeSystem, currentPerformance));
    recommendations.push(...await this.analyzeEquipmentUpgrades(systemId, systemInfo, currentPerformance));
    recommendations.push(...await this.analyzeOperationalAdjustments(systemId, realTimeSystem, currentPerformance));
    recommendations.push(...await this.analyzeMonitoringEnhancements(systemId, realTimeSystem));
    recommendations.push(...await this.analyzeCostReductionOpportunities(systemId, currentPerformance));

    // Filter by constraints and goals
    return this.filterRecommendationsByConstraints(recommendations, config);
  }

  private async analyzeMaintenanceOptimization(
    systemId: string,
    realTimeSystem: RealTimeSystem,
    currentPerformance: PerformanceMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check if cleaning is needed
    if (currentPerformance.performanceRatio < 0.8) {
      recommendations.push(this.createRecommendation({
        category: 'maintenance_optimization',
        type: 'cleaning_optimization',
        priority: 'high',
        title: 'Optimize Panel Cleaning Schedule',
        description: 'Increase cleaning frequency to improve system performance',
        rationale: 'Performance ratio below optimal range indicates potential soiling',
        impact: {
          productionIncrease: 1200, // kWh/year
          efficiencyImprovement: 3,
          costSavings: 180,
          paybackPeriod: 0.8,
          roi: 25
        },
        implementation: {
          complexity: 'simple',
          estimatedTime: 4,
          estimatedCost: 150,
          requiredSkills: ['basic_maintenance'],
          contractor: 'diy'
        }
      }));
    }

    // Check inverter performance
    if (realTimeSystem.performance.metrics.inverterEfficiency < 95) {
      recommendations.push(this.createRecommendation({
        category: 'maintenance_optimization',
        type: 'maintenance_schedule',
        priority: 'medium',
        title: 'Inverter Maintenance Optimization',
        description: 'Schedule preventive inverter maintenance to improve efficiency',
        rationale: 'Inverter efficiency below industry standard',
        impact: {
          productionIncrease: 800,
          efficiencyImprovement: 2,
          costSavings: 120,
          paybackPeriod: 1.5,
          roi: 18
        },
        implementation: {
          complexity: 'moderate',
          estimatedTime: 3,
          estimatedCost: 200,
          requiredSkills: ['electrical'],
          contractor: 'certified_technician'
        }
      }));
    }

    return recommendations;
  }

  private async analyzeEquipmentUpgrades(
    systemId: string,
    systemInfo: SolarSystem,
    currentPerformance: PerformanceMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check system age for upgrade opportunities
    const systemAge = new Date().getFullYear() - systemInfo.installationDate.toDate().getFullYear();
    
    if (systemAge > 10 && currentPerformance.performanceRatio < 0.75) {
      recommendations.push(this.createRecommendation({
        category: 'equipment_upgrade',
        type: 'hardware_replacement',
        priority: 'medium',
        title: 'Consider Inverter Upgrade',
        description: 'Upgrade to newer, more efficient inverter technology',
        rationale: 'System age and performance suggest inverter efficiency degradation',
        impact: {
          productionIncrease: 2500,
          efficiencyImprovement: 5,
          costSavings: 375,
          paybackPeriod: 6.7,
          roi: 15
        },
        implementation: {
          complexity: 'complex',
          estimatedTime: 8,
          estimatedCost: 2500,
          requiredSkills: ['electrical', 'certified_installation'],
          contractor: 'specialist'
        }
      }));
    }

    // Check for monitoring upgrade opportunities
    if (realTimeSystem.equipment.monitoring.dataQuality < 95) {
      recommendations.push(this.createRecommendation({
        category: 'monitoring_enhancement',
        type: 'monitoring_upgrade',
        priority: 'low',
        title: 'Upgrade Monitoring System',
        description: 'Install advanced monitoring for better system diagnostics',
        rationale: 'Current monitoring quality affects optimization capabilities',
        impact: {
          productionIncrease: 500,
          efficiencyImprovement: 1,
          costSavings: 75,
          paybackPeriod: 6.7,
          roi: 12
        },
        implementation: {
          complexity: 'moderate',
          estimatedTime: 4,
          estimatedCost: 500,
          requiredSkills: ['networking', 'installation'],
          contractor: 'certified_technician'
        }
      }));
    }

    return recommendations;
  }

  private async analyzeOperationalAdjustments(
    systemId: string,
    realTimeSystem: RealTimeSystem,
    currentPerformance: PerformanceMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze shading impact
    const shadingLoss = realTimeSystem.environmental.impact.shadingLoss;
    if (shadingLoss > 3) {
      recommendations.push(this.createRecommendation({
        category: 'operational_adjustment',
        type: 'shading_mitigation',
        priority: 'high',
        title: 'Mitigate Shading Issues',
        description: 'Address vegetation or obstruction causing shading',
        rationale: `Shading causing ${shadingLoss}% production loss`,
        impact: {
          productionIncrease: 1800,
          efficiencyImprovement: 4,
          costSavings: 270,
          paybackPeriod: 1.1,
          roi: 90
        },
        implementation: {
          complexity: 'simple',
          estimatedTime: 6,
          estimatedCost: 300,
          requiredSkills: ['landscaping'],
          contractor: 'diy'
        }
      }));
    }

    return recommendations;
  }

  private async analyzeMonitoringEnhancements(
    systemId: string,
    realTimeSystem: RealTimeSystem
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for data quality issues
    if (realTimeSystem.equipment.monitoring.missedReadings > 5) {
      recommendations.push(this.createRecommendation({
        category: 'monitoring_enhancement',
        type: 'configuration_change',
        priority: 'medium',
        title: 'Improve Data Collection Reliability',
        description: 'Optimize monitoring system configuration for better data quality',
        rationale: 'Frequent missed readings affect performance analysis accuracy',
        impact: {
          productionIncrease: 200,
          efficiencyImprovement: 0.5,
          costSavings: 30,
          paybackPeriod: 0.5,
          roi: 200
        },
        implementation: {
          complexity: 'simple',
          estimatedTime: 2,
          estimatedCost: 0,
          requiredSkills: ['configuration'],
          contractor: 'diy'
        }
      }));
    }

    return recommendations;
  }

  private async analyzeCostReductionOpportunities(
    systemId: string,
    currentPerformance: PerformanceMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze maintenance cost optimization
    if (currentPerformance.maintenanceCost > 600) {
      recommendations.push(this.createRecommendation({
        category: 'cost_reduction',
        type: 'maintenance_schedule',
        priority: 'medium',
        title: 'Optimize Maintenance Scheduling',
        description: 'Consolidate maintenance tasks to reduce costs',
        rationale: 'Current maintenance costs are above industry average',
        impact: {
          productionIncrease: 0,
          efficiencyImprovement: 0,
          costSavings: 200,
          paybackPeriod: 0,
          roi: 100
        },
        implementation: {
          complexity: 'simple',
          estimatedTime: 1,
          estimatedCost: 0,
          requiredSkills: ['planning'],
          contractor: 'diy'
        }
      }));
    }

    return recommendations;
  }

  private createRecommendation(params: {
    category: RecommendationCategory;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    rationale: string;
    impact: Partial<RecommendationImpact>;
    implementation: Partial<RecommendationImplementation>;
  }): OptimizationRecommendation {
    const now = new Date();
    
    return {
      id: `rec_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      category: params.category,
      type: params.type,
      priority: params.priority,
      title: params.title,
      description: params.description,
      rationale: params.rationale,
      impact: {
        productionIncrease: params.impact.productionIncrease || 0,
        efficiencyImprovement: params.impact.efficiencyImprovement || 0,
        costSavings: params.impact.costSavings || 0,
        maintenanceReduction: params.impact.maintenanceReduction || 0,
        lifespanExtension: params.impact.lifespanExtension || 0,
        co2ReductionIncrease: params.impact.co2ReductionIncrease || 0,
        paybackPeriod: params.impact.paybackPeriod || 5,
        roi: params.impact.roi || 10,
        riskReduction: params.impact.riskReduction || 0
      },
      implementation: {
        complexity: params.implementation.complexity || 'moderate',
        estimatedTime: params.implementation.estimatedTime || 4,
        estimatedCost: params.implementation.estimatedCost || 0,
        requiredSkills: params.implementation.requiredSkills || [],
        requiredTools: params.implementation.requiredTools || [],
        safetyRequirements: params.implementation.safetyRequirements || [],
        permits: params.implementation.permits || [],
        downtime: params.implementation.downtime || 0,
        bestTimeframe: params.implementation.bestTimeframe || 'any',
        contractor: params.implementation.contractor || 'certified_technician'
      },
      status: 'pending',
      dependencies: [],
      alternatives: [],
      createdAt: now,
      updatedAt: now
    };
  }

  private filterRecommendationsByConstraints(
    recommendations: OptimizationRecommendation[],
    config: OptimizationConfig
  ): OptimizationRecommendation[] {
    return recommendations.filter(rec => {
      // Check budget constraints
      const budgetConstraint = config.constraints.find(c => c.type === 'budget');
      if (budgetConstraint && rec.implementation.estimatedCost > budgetConstraint.value) {
        if (budgetConstraint.priority === 'hard') return false;
      }

      // Check time constraints
      const timeConstraint = config.constraints.find(c => c.type === 'time');
      if (timeConstraint && rec.implementation.downtime > timeConstraint.value) {
        if (timeConstraint.priority === 'hard') return false;
      }

      return true;
    });
  }

  private calculateOptimizedPerformance(
    currentPerformance: PerformanceMetrics,
    recommendations: OptimizationRecommendation[]
  ): PerformanceMetrics {
    const totalProductionIncrease = recommendations.reduce((sum, rec) => sum + rec.impact.productionIncrease, 0);
    const totalEfficiencyImprovement = recommendations.reduce((sum, rec) => sum + rec.impact.efficiencyImprovement, 0);
    const totalCostSavings = recommendations.reduce((sum, rec) => sum + rec.impact.costSavings, 0);

    return {
      ...currentPerformance,
      energyProduction: currentPerformance.energyProduction + (totalProductionIncrease / 365),
      systemEfficiency: currentPerformance.systemEfficiency + totalEfficiencyImprovement,
      performanceRatio: Math.min(currentPerformance.performanceRatio + (totalEfficiencyImprovement / 100), 1),
      operatingCost: Math.max(currentPerformance.operatingCost - totalCostSavings, 0)
    };
  }

  private assessProjectedImpact(
    currentPerformance: PerformanceMetrics,
    optimizedPerformance: PerformanceMetrics
  ): ProjectedImpact {
    const annualEnergyIncrease = (optimizedPerformance.energyProduction - currentPerformance.energyProduction) * 365;
    const annualCostSavings = optimizedPerformance.operatingCost - currentPerformance.operatingCost;

    return {
      shortTerm: {
        energyIncrease: annualEnergyIncrease,
        costSavings: annualCostSavings,
        efficiencyGain: optimizedPerformance.systemEfficiency - currentPerformance.systemEfficiency,
        reliabilityImprovement: 5,
        maintenanceReduction: 10
      },
      mediumTerm: {
        energyIncrease: annualEnergyIncrease * 5,
        costSavings: annualCostSavings * 5,
        efficiencyGain: (optimizedPerformance.systemEfficiency - currentPerformance.systemEfficiency) * 1.2,
        reliabilityImprovement: 15,
        maintenanceReduction: 25
      },
      longTerm: {
        energyIncrease: annualEnergyIncrease * 20,
        costSavings: annualCostSavings * 20,
        efficiencyGain: (optimizedPerformance.systemEfficiency - currentPerformance.systemEfficiency) * 1.5,
        reliabilityImprovement: 30,
        maintenanceReduction: 40
      },
      cumulativeLifetime: {
        totalEnergyIncrease: annualEnergyIncrease * 25,
        totalCostSavings: annualCostSavings * 25,
        totalCo2Reduction: annualEnergyIncrease * 25 * 0.4, // kg CO2 per kWh
        netPresentValue: this.calculateNPV(annualCostSavings, 25, 0.05),
        internalRateOfReturn: 12
      }
    };
  }

  private createImplementationPlan(recommendations: OptimizationRecommendation[]): ImplementationPlan {
    // Group recommendations by complexity and dependencies
    const phases = this.groupRecommendationsIntoPhases(recommendations);
    
    return {
      phases,
      totalDuration: phases.reduce((sum, phase) => sum + phase.duration, 0),
      totalCost: recommendations.reduce((sum, rec) => sum + rec.implementation.estimatedCost, 0),
      riskMitigation: [
        {
          risk: 'System downtime',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Schedule work during low production periods',
          contingency: 'Have backup power available'
        }
      ],
      successMetrics: [
        {
          metric: 'Production increase',
          baseline: 0,
          target: recommendations.reduce((sum, rec) => sum + rec.impact.productionIncrease, 0),
          unit: 'kWh/year',
          measurementMethod: 'Monthly energy production comparison',
          frequency: 'Monthly'
        }
      ]
    };
  }

  private groupRecommendationsIntoPhases(recommendations: OptimizationRecommendation[]): ImplementationPhase[] {
    // Simplified phase grouping - in production, this would be more sophisticated
    const simplePhase: ImplementationPhase = {
      phase: 1,
      name: 'Quick Wins',
      description: 'Low-cost, high-impact optimizations',
      duration: 7,
      cost: recommendations.filter(r => r.implementation.complexity === 'simple')
                       .reduce((sum, r) => sum + r.implementation.estimatedCost, 0),
      prerequisites: [],
      deliverables: recommendations.filter(r => r.implementation.complexity === 'simple')
                                  .map(r => r.title),
      risks: ['Weather delays'],
      recommendations: recommendations.filter(r => r.implementation.complexity === 'simple')
                                     .map(r => r.id)
    };

    const complexPhase: ImplementationPhase = {
      phase: 2,
      name: 'Major Upgrades',
      description: 'Complex optimizations requiring specialists',
      duration: 21,
      cost: recommendations.filter(r => r.implementation.complexity === 'complex')
                          .reduce((sum, r) => sum + r.implementation.estimatedCost, 0),
      prerequisites: ['Complete Phase 1'],
      deliverables: recommendations.filter(r => r.implementation.complexity === 'complex')
                                  .map(r => r.title),
      risks: ['Extended downtime', 'Contractor availability'],
      recommendations: recommendations.filter(r => r.implementation.complexity === 'complex')
                                     .map(r => r.id)
    };

    return [simplePhase, complexPhase].filter(phase => phase.cost > 0);
  }

  private assessRisks(recommendations: OptimizationRecommendation[], systemInfo: SolarSystem): RiskAssessment {
    const risks: Risk[] = [
      {
        description: 'System downtime during implementation',
        probability: 0.8,
        impact: 0.6,
        severity: 'medium',
        mitigation: 'Schedule work during low production periods'
      },
      {
        description: 'Cost overruns',
        probability: 0.3,
        impact: 0.4,
        severity: 'medium',
        mitigation: 'Get detailed quotes and maintain contingency budget'
      }
    ];

    return {
      overall: 'medium',
      technicalRisks: risks.filter(r => r.description.includes('technical')),
      financialRisks: risks.filter(r => r.description.includes('cost')),
      operationalRisks: risks.filter(r => r.description.includes('downtime')),
      safetyRisks: [],
      regulatoryRisks: [],
      mitigationStrategies: risks.map(risk => ({
        risk: risk.description,
        strategy: risk.mitigation,
        cost: 0,
        effectiveness: 0.8
      }))
    };
  }

  private performCostBenefitAnalysis(
    recommendations: OptimizationRecommendation[],
    projectedImpact: ProjectedImpact
  ): CostBenefitAnalysis {
    const totalCost = recommendations.reduce((sum, rec) => sum + rec.implementation.estimatedCost, 0);
    const totalBenefit = projectedImpact.cumulativeLifetime.totalCostSavings;
    const netBenefit = totalBenefit - totalCost;

    return {
      totalCost,
      totalBenefit,
      netBenefit,
      benefitCostRatio: totalCost > 0 ? totalBenefit / totalCost : 0,
      paybackPeriod: totalCost > 0 ? totalCost / (totalBenefit / 25) : 0,
      netPresentValue: projectedImpact.cumulativeLifetime.netPresentValue,
      internalRateOfReturn: projectedImpact.cumulativeLifetime.internalRateOfReturn,
      sensitivity: {
        scenarios: [
          {
            name: 'Best Case',
            probability: 0.2,
            outcome: {
              cost: totalCost * 0.9,
              benefit: totalBenefit * 1.2,
              npv: this.calculateNPV(totalBenefit * 1.2 / 25, 25, 0.05),
              irr: 18
            }
          },
          {
            name: 'Most Likely',
            probability: 0.6,
            outcome: {
              cost: totalCost,
              benefit: totalBenefit,
              npv: projectedImpact.cumulativeLifetime.netPresentValue,
              irr: projectedImpact.cumulativeLifetime.internalRateOfReturn
            }
          },
          {
            name: 'Worst Case',
            probability: 0.2,
            outcome: {
              cost: totalCost * 1.2,
              benefit: totalBenefit * 0.8,
              npv: this.calculateNPV(totalBenefit * 0.8 / 25, 25, 0.05),
              irr: 6
            }
          }
        ],
        breakEvenPoint: totalCost,
        riskAdjustedReturn: projectedImpact.cumulativeLifetime.internalRateOfReturn * 0.85
      }
    };
  }

  private calculateConfidenceScore(
    realTimeSystem: RealTimeSystem,
    historicalData: any,
    recommendations: OptimizationRecommendation[]
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on data quality
    if (realTimeSystem.equipment.monitoring.dataQuality > 95) {
      confidence += 0.1;
    }

    // Adjust based on system age (newer systems have more predictable behavior)
    // This would use actual system age in production

    // Adjust based on recommendation complexity
    const complexRecommendations = recommendations.filter(r => r.implementation.complexity === 'complex').length;
    confidence -= complexRecommendations * 0.05;

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private calculateNPV(annualCashFlow: number, years: number, discountRate: number): number {
    let npv = 0;
    for (let year = 1; year <= years; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }
    return npv;
  }

  private storeOptimizationResult(systemId: string, result: OptimizationResult): void {
    const results = this.optimizationResults.get(systemId) || [];
    results.push(result);
    this.optimizationResults.set(systemId, results);

    // Keep only last 10 results
    if (results.length > 10) {
      results.splice(0, results.length - 10);
    }
  }

  // Helper methods
  private async getSystemInfo(systemId: string): Promise<SolarSystem | null> {
    try {
      const systemQuery = query(
        collection(db, COLLECTIONS.SOLAR_SYSTEMS),
        where('id', '==', systemId),
        limit(1)
      );
      
      const snapshot = await getDocs(systemQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as SolarSystem;
    } catch (error) {
      return null;
    }
  }

  private async getHistoricalPerformance(systemId: string): Promise<any> {
    // Get historical performance data for analysis
    return null; // Simplified implementation
  }

  // Event handlers
  private handleOptimizationCompleted(event: { systemId: string; result: OptimizationResult }): void {
    console.log(`Optimization completed for system ${event.systemId}: ${event.result.recommendations.length} recommendations`);
  }

  private handleRecommendationUpdated(event: { recommendationId: string; status: RecommendationStatus }): void {
    console.log(`Recommendation ${event.recommendationId} updated to ${event.status}`);
  }
}

// Export singleton instance
export const performanceOptimizationEngine = new PerformanceOptimizationEngine();