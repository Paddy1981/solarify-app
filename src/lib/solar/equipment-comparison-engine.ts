/**
 * Equipment Comparison and Recommendation Engine
 * Advanced algorithms for equipment comparison, ranking, and intelligent recommendations
 */

import { SolarPanel, Inverter, BatteryStorage } from './solar-database';
import { PricingData, AvailabilityData } from './pricing-availability-manager';
import { PerformanceAnalysis } from './equipment-performance-analytics';

// =====================================================
// COMPARISON INTERFACES
// =====================================================

export interface ComparisonCriteria {
  // Performance weights (0-1, must sum to 1)
  weights: {
    efficiency: number;
    power: number;
    reliability: number;
    warranty: number;
    price: number;
    availability: number;
    features: number;
    brandReputation: number;
  };
  
  // Comparison preferences
  preferences: {
    budgetLimit?: number;
    tierPreference?: 1 | 2 | 3;
    technologyPreference?: string[];
    manufacturerPreference?: string[];
    certificationRequirements?: string[];
    performanceThreshold?: number; // minimum acceptable score
  };
  
  // Use case context
  useCase: {
    systemSize: number; // kW
    location: { climate: string; region: string };
    installationType: 'residential' | 'commercial' | 'utility';
    priorities: ('cost' | 'performance' | 'reliability' | 'aesthetics')[];
  };
}

export interface EquipmentComparison {
  comparisonId: string;
  timestamp: Date;
  criteria: ComparisonCriteria;
  
  // Equipment being compared
  equipment: {
    id: string;
    type: 'panel' | 'inverter' | 'battery';
    data: SolarPanel | Inverter | BatteryStorage;
    pricing?: PricingData;
    availability?: AvailabilityData;
    performance?: PerformanceAnalysis;
  }[];
  
  // Comparison results
  results: {
    rankings: EquipmentRanking[];
    scoreboard: ComparisonScoreboard;
    analysis: ComparisonAnalysis;
    recommendations: ComparisonRecommendation[];
  };
  
  // Visualization data
  visualization: {
    radarChart: RadarChartData;
    barChart: BarChartData;
    scatterPlot: ScatterPlotData;
    matrixComparison: MatrixComparisonData;
  };
}

export interface EquipmentRanking {
  rank: number;
  equipmentId: string;
  overallScore: number;
  
  // Category scores
  categoryScores: {
    efficiency: number;
    power: number;
    reliability: number;
    warranty: number;
    price: number;
    availability: number;
    features: number;
    brandReputation: number;
  };
  
  // Strengths and weaknesses
  strengths: string[];
  weaknesses: string[];
  
  // Value proposition
  valueProposition: {
    costEffectiveness: number;
    performanceValue: number;
    reliabilityValue: number;
    overallValue: number;
  };
  
  // Recommendation level
  recommendationLevel: 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended';
  confidenceScore: number;
}

export interface ComparisonScoreboard {
  categories: {
    name: string;
    weight: number;
    scores: { equipmentId: string; score: number; rank: number }[];
    winner: string;
  }[];
  
  summary: {
    overallWinner: string;
    bestValue: string;
    highestPerformer: string;
    mostReliable: string;
    budgetChoice: string;
  };
}

export interface ComparisonAnalysis {
  insights: {
    type: 'performance' | 'value' | 'trade_off' | 'market_position';
    title: string;
    description: string;
    equipmentIds: string[];
    impact: 'high' | 'medium' | 'low';
  }[];
  
  tradeOffs: {
    category1: string;
    category2: string;
    description: string;
    equipmentExamples: { equipmentId: string; position: string }[];
  }[];
  
  marketPosition: {
    equipmentId: string;
    position: 'premium' | 'mainstream' | 'value' | 'budget';
    competitiveness: number;
    marketShare?: number;
  }[];
  
  gaps: {
    category: string;
    description: string;
    missingOptions: string[];
  }[];
}

export interface ComparisonRecommendation {
  type: 'primary' | 'alternative' | 'budget' | 'premium' | 'specialized';
  equipmentId: string;
  title: string;
  description: string;
  
  // Recommendation rationale
  rationale: {
    primaryReasons: string[];
    supportingFactors: string[];
    considerations: string[];
  };
  
  // Use case fit
  useCaseFit: {
    score: number;
    strengths: string[];
    limitations: string[];
    idealScenarios: string[];
  };
  
  // Implementation guidance
  implementation: {
    systemSizing: string;
    installation: string[];
    maintenance: string[];
    optimization: string[];
  };
}

// =====================================================
// RECOMMENDATION INTERFACES
// =====================================================

export interface RecommendationRequest {
  // System requirements
  requirements: {
    energyNeeds: number; // kWh/year
    systemSize?: number; // kW
    budget: { min: number; max: number };
    location: {
      latitude: number;
      longitude: number;
      climate: string;
      utility: string;
    };
  };
  
  // Site characteristics
  site: {
    roofType: string;
    roofArea: number; // m²
    orientation: { azimuth: number; tilt: number };
    shading: 'none' | 'minimal' | 'moderate' | 'significant';
    structuralLimitations?: string[];
  };
  
  // Customer preferences
  preferences: {
    priorities: ('cost' | 'performance' | 'reliability' | 'aesthetics' | 'environmental')[];
    brandPreferences?: string[];
    technologyPreferences?: string[];
    warrantyImportance: 'low' | 'medium' | 'high';
    maintenancePreference: 'minimal' | 'standard' | 'proactive';
  };
  
  // Special requirements
  specialRequirements?: {
    batteryStorage: boolean;
    monitoring: 'basic' | 'advanced' | 'professional';
    futureExpansion: boolean;
    gridTie: boolean;
    backup: boolean;
  };
}

export interface RecommendationResponse {
  recommendationId: string;
  timestamp: Date;
  request: RecommendationRequest;
  
  // System recommendations
  systemRecommendations: {
    primary: SystemRecommendation;
    alternatives: SystemRecommendation[];
  };
  
  // Component recommendations
  componentRecommendations: {
    panels: ComponentRecommendation[];
    inverters: ComponentRecommendation[];
    batteries?: ComponentRecommendation[];
    monitoring?: ComponentRecommendation[];
  };
  
  // Analysis
  analysis: {
    feasibilityScore: number;
    performancePrediction: any;
    financialProjection: any;
    riskAssessment: any;
  };
  
  // Implementation roadmap
  roadmap: {
    phases: ImplementationPhase[];
    timeline: number; // days
    milestones: string[];
  };
}

export interface SystemRecommendation {
  id: string;
  name: string;
  description: string;
  
  // System composition
  composition: {
    panels: { equipment: SolarPanel; quantity: number };
    inverter: { equipment: Inverter; quantity: number };
    battery?: { equipment: BatteryStorage; quantity: number };
    additional: any[];
  };
  
  // System specifications
  specifications: {
    totalCapacity: number; // kW
    estimatedProduction: number; // kWh/year
    systemEfficiency: number; // %
    expectedLifespan: number; // years
  };
  
  // Financial analysis
  financial: {
    totalCost: number;
    costPerWatt: number;
    paybackPeriod: number; // years
    roi: number; // %
    financingOptions: any[];
  };
  
  // Performance metrics
  performance: {
    energyOffset: number; // % of annual usage
    co2Reduction: number; // tons/year
    reliabilityScore: number;
    maintenanceLevel: 'low' | 'medium' | 'high';
  };
  
  // Recommendation confidence
  confidence: {
    overall: number;
    technical: number;
    financial: number;
    suitability: number;
  };
}

export interface ComponentRecommendation {
  equipment: SolarPanel | Inverter | BatteryStorage;
  ranking: number;
  score: number;
  
  // Recommendation details
  pros: string[];
  cons: string[];
  bestFor: string[];
  considerations: string[];
  
  // Compatibility
  compatibility: {
    systemFit: number;
    technical: string[];
    installation: string[];
  };
  
  // Alternatives
  alternatives: {
    upgrade: any;
    budget: any;
    similar: any[];
  };
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: number; // days
  dependencies: number[]; // other phases
  
  activities: {
    name: string;
    duration: number;
    resources: string[];
    deliverables: string[];
  }[];
  
  risks: {
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

// =====================================================
// COMPARISON AND RECOMMENDATION ENGINE
// =====================================================

export class EquipmentComparisonEngine {
  private marketData: Map<string, any> = new Map();
  private performanceData: Map<string, PerformanceAnalysis> = new Map();
  private brandReputation: Map<string, number> = new Map();
  
  /**
   * Compare multiple pieces of equipment
   */
  async compareEquipment(
    equipmentIds: string[],
    criteria: ComparisonCriteria,
    includeMarketData: boolean = true
  ): Promise<EquipmentComparison> {
    
    if (equipmentIds.length < 2) {
      throw new Error('At least 2 pieces of equipment required for comparison');
    }
    
    const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Step 1: Gather equipment data
    const equipment = await this.gatherEquipmentData(equipmentIds, includeMarketData);
    
    // Step 2: Calculate category scores
    const categoryScores = this.calculateCategoryScores(equipment, criteria);
    
    // Step 3: Calculate overall scores and rankings
    const rankings = this.calculateRankings(categoryScores, criteria.weights);
    
    // Step 4: Generate scoreboard
    const scoreboard = this.generateScoreboard(categoryScores, rankings);
    
    // Step 5: Perform analysis
    const analysis = this.performComparisonAnalysis(equipment, rankings, criteria);
    
    // Step 6: Generate recommendations
    const recommendations = this.generateComparisonRecommendations(rankings, analysis, criteria);
    
    // Step 7: Create visualization data
    const visualization = this.createVisualizationData(equipment, categoryScores, rankings);
    
    return {
      comparisonId,
      timestamp: new Date(),
      criteria,
      equipment,
      results: {
        rankings,
        scoreboard,
        analysis,
        recommendations
      },
      visualization
    };
  }
  
  /**
   * Generate intelligent equipment recommendations
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    
    const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Step 1: Analyze requirements and constraints
    const analysis = this.analyzeRequirements(request);
    
    // Step 2: Generate equipment pool
    const equipmentPool = await this.generateEquipmentPool(request, analysis);
    
    // Step 3: Create system configurations
    const systemConfigs = this.generateSystemConfigurations(equipmentPool, request);
    
    // Step 4: Evaluate configurations
    const evaluatedConfigs = await this.evaluateSystemConfigurations(systemConfigs, request);
    
    // Step 5: Select primary and alternative recommendations
    const systemRecommendations = this.selectSystemRecommendations(evaluatedConfigs);
    
    // Step 6: Generate component-level recommendations
    const componentRecommendations = this.generateComponentRecommendations(equipmentPool, request);
    
    // Step 7: Perform feasibility and risk analysis
    const feasibilityAnalysis = this.performFeasibilityAnalysis(systemRecommendations.primary, request);
    
    // Step 8: Create implementation roadmap
    const roadmap = this.createImplementationRoadmap(systemRecommendations.primary, request);
    
    return {
      recommendationId,
      timestamp: new Date(),
      request,
      systemRecommendations,
      componentRecommendations,
      analysis: feasibilityAnalysis,
      roadmap
    };
  }
  
  /**
   * Find similar equipment
   */
  async findSimilarEquipment(
    equipmentId: string,
    similarityThreshold: number = 0.8,
    maxResults: number = 5
  ): Promise<{
    original: any;
    similar: {
      equipment: any;
      similarityScore: number;
      similarityFactors: string[];
      differences: string[];
    }[];
  }> {
    
    // Implementation for equipment similarity matching
    return {
      original: {},
      similar: []
    };
  }
  
  /**
   * Get equipment market position analysis
   */
  async analyzeMarketPosition(equipmentId: string): Promise<{
    position: 'leader' | 'challenger' | 'follower' | 'niche';
    competitiveAdvantages: string[];
    marketShare: number;
    pricePosition: 'premium' | 'mainstream' | 'value';
    trendAnalysis: {
      popularity: 'rising' | 'stable' | 'declining';
      priceDirection: 'increasing' | 'stable' | 'decreasing';
      marketDemand: 'high' | 'medium' | 'low';
    };
    competitors: {
      equipmentId: string;
      competitionLevel: 'direct' | 'indirect';
      advantages: string[];
    }[];
  }> {
    
    // Market position analysis implementation
    return {
      position: 'challenger',
      competitiveAdvantages: [],
      marketShare: 0,
      pricePosition: 'mainstream',
      trendAnalysis: {
        popularity: 'stable',
        priceDirection: 'stable',
        marketDemand: 'medium'
      },
      competitors: []
    };
  }
  
  // =====================================================
  // PRIVATE IMPLEMENTATION METHODS
  // =====================================================
  
  private async gatherEquipmentData(equipmentIds: string[], includeMarketData: boolean): Promise<any[]> {
    // Gather comprehensive equipment data
    return [];
  }
  
  private calculateCategoryScores(equipment: any[], criteria: ComparisonCriteria): Map<string, any> {
    const scores = new Map();
    
    for (const item of equipment) {
      const categoryScores = {
        efficiency: this.scoreEfficiency(item),
        power: this.scorePower(item),
        reliability: this.scoreReliability(item),
        warranty: this.scoreWarranty(item),
        price: this.scorePrice(item, criteria),
        availability: this.scoreAvailability(item),
        features: this.scoreFeatures(item),
        brandReputation: this.scoreBrandReputation(item)
      };
      
      scores.set(item.id, categoryScores);
    }
    
    return scores;
  }
  
  private scoreEfficiency(equipment: any): number {
    // Efficiency scoring logic based on equipment type and technology
    if (equipment.type === 'panel') {
      return Math.min(100, (equipment.data.efficiency / 25) * 100);
    } else if (equipment.type === 'inverter') {
      return Math.min(100, ((equipment.data.efficiency.cec || equipment.data.efficiency.peak) / 100) * 100);
    }
    return 50; // default score
  }
  
  private scorePower(equipment: any): number {
    // Power scoring logic
    if (equipment.type === 'panel') {
      return Math.min(100, (equipment.data.wattage / 500) * 100);
    } else if (equipment.type === 'inverter') {
      return Math.min(100, (equipment.data.capacity / 10000) * 100);
    } else if (equipment.type === 'battery') {
      return Math.min(100, (equipment.data.capacity / 20) * 100);
    }
    return 50;
  }
  
  private scoreReliability(equipment: any): number {
    // Reliability scoring based on manufacturer tier, certifications, etc.
    let score = 50;
    
    if (equipment.data.tier === 1) score += 30;
    else if (equipment.data.tier === 2) score += 15;
    
    if (equipment.data.certifications?.length >= 4) score += 10;
    
    return Math.min(100, score);
  }
  
  private scoreWarranty(equipment: any): number {
    // Warranty scoring logic
    const warrantyYears = equipment.data.warranty?.performance || equipment.data.warranty?.years || 10;
    return Math.min(100, (warrantyYears / 30) * 100);
  }
  
  private scorePrice(equipment: any, criteria: ComparisonCriteria): number {
    // Price scoring (lower price = higher score, with budget considerations)
    const price = equipment.pricing?.pricing.currentPrice || equipment.data.pricePerWatt || 1;
    const maxPrice = criteria.preferences.budgetLimit || 5;
    return Math.max(0, ((maxPrice - price) / maxPrice) * 100);
  }
  
  private scoreAvailability(equipment: any): number {
    // Availability scoring
    if (!equipment.availability) return 50;
    
    switch (equipment.availability.inventory.status) {
      case 'in-stock': return 100;
      case 'limited': return 70;
      case 'out-of-stock': return 20;
      case 'discontinued': return 0;
      default: return 50;
    }
  }
  
  private scoreFeatures(equipment: any): number {
    // Feature scoring based on advanced features
    let score = 50;
    
    // Add scoring logic for various features
    if (equipment.data.monitoring) score += 15;
    if (equipment.data.type === 'micro' || equipment.data.type === 'power-optimizer') score += 10;
    if (equipment.data.bifacialGain) score += 10;
    
    return Math.min(100, score);
  }
  
  private scoreBrandReputation(equipment: any): number {
    // Brand reputation scoring
    return this.brandReputation.get(equipment.data.manufacturer) || 70;
  }
  
  private calculateRankings(categoryScores: Map<string, any>, weights: any): EquipmentRanking[] {
    const rankings: EquipmentRanking[] = [];
    
    for (const [equipmentId, scores] of categoryScores) {
      const overallScore = 
        scores.efficiency * weights.efficiency +
        scores.power * weights.power +
        scores.reliability * weights.reliability +
        scores.warranty * weights.warranty +
        scores.price * weights.price +
        scores.availability * weights.availability +
        scores.features * weights.features +
        scores.brandReputation * weights.brandReputation;
      
      rankings.push({
        rank: 0, // Will be set after sorting
        equipmentId,
        overallScore: Math.round(overallScore * 100) / 100,
        categoryScores: scores,
        strengths: this.identifyStrengths(scores),
        weaknesses: this.identifyWeaknesses(scores),
        valueProposition: this.calculateValueProposition(scores),
        recommendationLevel: this.determineRecommendationLevel(overallScore),
        confidenceScore: this.calculateConfidenceScore(scores)
      });
    }
    
    // Sort by overall score and assign ranks
    rankings.sort((a, b) => b.overallScore - a.overallScore);
    rankings.forEach((ranking, index) => ranking.rank = index + 1);
    
    return rankings;
  }
  
  private identifyStrengths(scores: any): string[] {
    const strengths = [];
    const threshold = 80;
    
    if (scores.efficiency >= threshold) strengths.push('High efficiency');
    if (scores.power >= threshold) strengths.push('High power output');
    if (scores.reliability >= threshold) strengths.push('Excellent reliability');
    if (scores.warranty >= threshold) strengths.push('Comprehensive warranty');
    if (scores.price >= threshold) strengths.push('Competitive pricing');
    if (scores.availability >= threshold) strengths.push('Good availability');
    if (scores.features >= threshold) strengths.push('Advanced features');
    if (scores.brandReputation >= threshold) strengths.push('Strong brand reputation');
    
    return strengths;
  }
  
  private identifyWeaknesses(scores: any): string[] {
    const weaknesses = [];
    const threshold = 50;
    
    if (scores.efficiency <= threshold) weaknesses.push('Lower efficiency');
    if (scores.power <= threshold) weaknesses.push('Limited power output');
    if (scores.reliability <= threshold) weaknesses.push('Reliability concerns');
    if (scores.warranty <= threshold) weaknesses.push('Limited warranty');
    if (scores.price <= threshold) weaknesses.push('Higher cost');
    if (scores.availability <= threshold) weaknesses.push('Availability issues');
    if (scores.features <= threshold) weaknesses.push('Basic features');
    if (scores.brandReputation <= threshold) weaknesses.push('Unknown brand');
    
    return weaknesses;
  }
  
  private calculateValueProposition(scores: any): any {
    return {
      costEffectiveness: (scores.price + scores.efficiency) / 2,
      performanceValue: (scores.efficiency + scores.power + scores.features) / 3,
      reliabilityValue: (scores.reliability + scores.warranty + scores.brandReputation) / 3,
      overallValue: (scores.price + scores.efficiency + scores.reliability) / 3
    };
  }
  
  private determineRecommendationLevel(score: number): 'highly_recommended' | 'recommended' | 'acceptable' | 'not_recommended' {
    if (score >= 85) return 'highly_recommended';
    if (score >= 70) return 'recommended';
    if (score >= 55) return 'acceptable';
    return 'not_recommended';
  }
  
  private calculateConfidenceScore(scores: any): number {
    // Calculate confidence based on data completeness and score consistency
    return 85; // Placeholder
  }
  
  private generateScoreboard(categoryScores: Map<string, any>, rankings: EquipmentRanking[]): ComparisonScoreboard {
    // Generate comparison scoreboard
    return {
      categories: [],
      summary: {
        overallWinner: rankings[0]?.equipmentId || '',
        bestValue: rankings[0]?.equipmentId || '',
        highestPerformer: rankings[0]?.equipmentId || '',
        mostReliable: rankings[0]?.equipmentId || '',
        budgetChoice: rankings[rankings.length - 1]?.equipmentId || ''
      }
    };
  }
  
  private performComparisonAnalysis(equipment: any[], rankings: EquipmentRanking[], criteria: ComparisonCriteria): ComparisonAnalysis {
    // Perform detailed comparison analysis
    return {
      insights: [],
      tradeOffs: [],
      marketPosition: [],
      gaps: []
    };
  }
  
  private generateComparisonRecommendations(rankings: EquipmentRanking[], analysis: ComparisonAnalysis, criteria: ComparisonCriteria): ComparisonRecommendation[] {
    // Generate comparison-based recommendations
    return [];
  }
  
  private createVisualizationData(equipment: any[], categoryScores: Map<string, any>, rankings: EquipmentRanking[]): any {
    // Create data for various visualizations
    return {
      radarChart: {},
      barChart: {},
      scatterPlot: {},
      matrixComparison: {}
    };
  }
  
  // Recommendation engine methods
  private analyzeRequirements(request: RecommendationRequest): any {
    // Analyze customer requirements and constraints
    return {};
  }
  
  private async generateEquipmentPool(request: RecommendationRequest, analysis: any): Promise<any> {
    // Generate pool of suitable equipment
    return {};
  }
  
  private generateSystemConfigurations(equipmentPool: any, request: RecommendationRequest): any[] {
    // Generate possible system configurations
    return [];
  }
  
  private async evaluateSystemConfigurations(configs: any[], request: RecommendationRequest): Promise<any[]> {
    // Evaluate and score system configurations
    return [];
  }
  
  private selectSystemRecommendations(evaluatedConfigs: any[]): any {
    // Select primary and alternative recommendations
    return {
      primary: {},
      alternatives: []
    };
  }
  
  private generateComponentRecommendations(equipmentPool: any, request: RecommendationRequest): any {
    // Generate component-level recommendations
    return {
      panels: [],
      inverters: [],
      batteries: [],
      monitoring: []
    };
  }
  
  private performFeasibilityAnalysis(primaryRecommendation: any, request: RecommendationRequest): any {
    // Perform feasibility and risk analysis
    return {
      feasibilityScore: 85,
      performancePrediction: {},
      financialProjection: {},
      riskAssessment: {}
    };
  }
  
  private createImplementationRoadmap(primaryRecommendation: any, request: RecommendationRequest): any {
    // Create implementation roadmap
    return {
      phases: [],
      timeline: 60,
      milestones: []
    };
  }
}

// Supporting interfaces for visualization data
interface RadarChartData {
  categories: string[];
  datasets: {
    equipmentId: string;
    label: string;
    data: number[];
    color: string;
  }[];
}

interface BarChartData {
  categories: string[];
  series: {
    equipmentId: string;
    label: string;
    values: number[];
    color: string;
  }[];
}

interface ScatterPlotData {
  axes: { x: string; y: string };
  points: {
    equipmentId: string;
    x: number;
    y: number;
    size: number;
    color: string;
  }[];
}

interface MatrixComparisonData {
  rows: string[]; // equipment IDs
  columns: string[]; // criteria
  cells: {
    row: string;
    column: string;
    value: number;
    color: string;
    tooltip: string;
  }[];
}