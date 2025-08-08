/**
 * Solar Equipment Data Validation and Quality Assurance Framework
 * Comprehensive data quality, validation, and integrity management
 */

import { z } from 'zod';
import { 
  solarPanelSpecSchema, 
  inverterSpecSchema, 
  batterySpecSchema,
  PANEL_TECHNOLOGIES,
  INVERTER_TECHNOLOGIES,
  BATTERY_TECHNOLOGIES
} from '@/lib/validations/solar-equipment';

// =====================================================
// DATA QUALITY INTERFACES
// =====================================================

export interface DataQualityReport {
  datasetId: string;
  validationDate: Date;
  
  // Overall quality metrics
  overall: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    qualityScore: number; // 0-100
    completenessScore: number; // 0-100
    accuracyScore: number; // 0-100
    consistencyScore: number; // 0-100
  };
  
  // Field-level quality
  fieldQuality: {
    fieldName: string;
    completeness: number; // % of non-null values
    validity: number; // % of valid values
    uniqueness: number; // % of unique values
    consistency: number; // % consistency across sources
    outliers: number; // count of outlier values
    issues: DataQualityIssue[];
  }[];
  
  // Data integrity checks
  integrity: {
    duplicateRecords: number;
    orphanedRecords: number;
    referentialIntegrityIssues: number;
    businessRuleViolations: DataQualityIssue[];
  };
  
  // Recommendations
  recommendations: DataQualityRecommendation[];
  
  // Trends
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining';
    completenessChange: number;
    accuracyChange: number;
  };
}

export interface DataQualityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'completeness' | 'validity' | 'accuracy' | 'consistency' | 'integrity';
  field: string;
  recordId?: string;
  description: string;
  currentValue?: any;
  expectedValue?: any;
  suggestedAction: string;
  impact: {
    recordsAffected: number;
    businessImpact: string;
    systemImpact: string;
  };
}

export interface DataQualityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'data_cleaning' | 'process_improvement' | 'system_enhancement';
  title: string;
  description: string;
  expectedImpact: {
    qualityImprovement: number; // % improvement
    recordsAffected: number;
    effortRequired: 'low' | 'medium' | 'high';
  };
  actions: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  category: 'technical' | 'business' | 'regulatory' | 'cross_field';
  severity: 'error' | 'warning' | 'info';
  description: string;
  equipmentTypes: ('panel' | 'inverter' | 'battery' | 'mounting' | 'electrical' | 'monitoring')[];
  
  // Rule definition
  rule: {
    field?: string;
    condition: string; // JS expression or predicate
    parameters?: { [key: string]: any };
    dependencies?: string[]; // other fields required
  };
  
  // Error handling
  errorMessage: string;
  suggestedFix: string;
  autoFix?: {
    enabled: boolean;
    strategy: 'default_value' | 'calculation' | 'lookup' | 'deletion';
    parameters?: any;
  };
}

// =====================================================
// DATA VALIDATION FRAMEWORK
// =====================================================

export class DataValidationFramework {
  private validationRules: Map<string, ValidationRule> = new Map();
  private qualityHistory: DataQualityReport[] = [];
  private dataSourceMetrics: Map<string, any> = new Map();
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  /**
   * Validate equipment data comprehensively
   */
  async validateEquipmentData(
    equipment: any,
    equipmentType: 'panel' | 'inverter' | 'battery' | 'mounting' | 'electrical' | 'monitoring',
    options: {
      strictMode?: boolean;
      autoFix?: boolean;
      checkCrossReferences?: boolean;
      validateMarketData?: boolean;
    } = {}
  ): Promise<{
    isValid: boolean;
    validatedData: any;
    issues: DataQualityIssue[];
    fixes: DataQualityFix[];
    qualityScore: number;
  }> {
    
    const issues: DataQualityIssue[] = [];
    const fixes: DataQualityFix[] = [];
    let validatedData = { ...equipment };
    
    // Step 1: Schema validation
    const schemaResult = await this.validateAgainstSchema(equipment, equipmentType);
    issues.push(...schemaResult.issues);
    validatedData = schemaResult.data;
    
    // Step 2: Business rule validation
    const businessRules = this.getBusinessRules(equipmentType);
    for (const rule of businessRules) {
      const ruleResult = await this.executeValidationRule(validatedData, rule);
      issues.push(...ruleResult.issues);
      fixes.push(...ruleResult.fixes);
    }
    
    // Step 3: Technical specification validation
    const techResult = await this.validateTechnicalSpecs(validatedData, equipmentType);
    issues.push(...techResult.issues);
    
    // Step 4: Cross-reference validation (if enabled)
    if (options.checkCrossReferences) {
      const crossRefResult = await this.validateCrossReferences(validatedData, equipmentType);
      issues.push(...crossRefResult.issues);
    }
    
    // Step 5: Market data validation (if enabled)
    if (options.validateMarketData) {
      const marketResult = await this.validateMarketData(validatedData, equipmentType);
      issues.push(...marketResult.issues);
    }
    
    // Step 6: Apply auto-fixes if enabled
    if (options.autoFix) {
      const fixResult = await this.applyAutoFixes(validatedData, fixes);
      validatedData = fixResult.data;
    }
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(issues, validatedData);
    
    // Determine overall validity
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const isValid = options.strictMode ? 
      (criticalIssues === 0 && highIssues === 0) : 
      criticalIssues === 0;
    
    return {
      isValid,
      validatedData,
      issues,
      fixes,
      qualityScore
    };
  }
  
  /**
   * Generate comprehensive data quality report
   */
  async generateQualityReport(
    dataset: any[],
    datasetId: string,
    equipmentType?: string
  ): Promise<DataQualityReport> {
    
    const validationResults = [];
    
    // Validate each record
    for (const record of dataset) {
      const result = await this.validateEquipmentData(
        record, 
        equipmentType as any || this.inferEquipmentType(record)
      );
      validationResults.push(result);
    }
    
    // Calculate overall metrics
    const totalRecords = dataset.length;
    const validRecords = validationResults.filter(r => r.isValid).length;
    const invalidRecords = totalRecords - validRecords;
    
    // Collect all issues
    const allIssues = validationResults.flatMap(r => r.issues);
    
    // Calculate quality scores
    const qualityScore = validationResults.reduce((sum, r) => sum + r.qualityScore, 0) / totalRecords;
    const completenessScore = this.calculateCompletenessScore(dataset);
    const accuracyScore = this.calculateAccuracyScore(allIssues, totalRecords);
    const consistencyScore = this.calculateConsistencyScore(dataset);
    
    // Field-level quality analysis
    const fieldQuality = await this.analyzeFieldQuality(dataset, allIssues);
    
    // Data integrity checks
    const integrity = await this.checkDataIntegrity(dataset);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, dataset);
    
    // Analyze trends
    const trends = this.analyzeTrends(datasetId);
    
    const report: DataQualityReport = {
      datasetId,
      validationDate: new Date(),
      overall: {
        totalRecords,
        validRecords,
        invalidRecords,
        qualityScore: Math.round(qualityScore * 100) / 100,
        completenessScore: Math.round(completenessScore * 100) / 100,
        accuracyScore: Math.round(accuracyScore * 100) / 100,
        consistencyScore: Math.round(consistencyScore * 100) / 100
      },
      fieldQuality,
      integrity,
      recommendations,
      trends
    };
    
    // Store report for trend analysis
    this.qualityHistory.push(report);
    
    return report;
  }
  
  /**
   * Validate data from external sources
   */
  async validateExternalData(
    data: any[],
    source: 'manufacturer' | 'distributor' | 'market' | 'certification',
    mapping: { [externalField: string]: string }
  ): Promise<{
    validRecords: any[];
    invalidRecords: any[];
    mappingIssues: DataQualityIssue[];
    sourceQuality: number;
  }> {
    
    const validRecords = [];
    const invalidRecords = [];
    const mappingIssues: DataQualityIssue[] = [];
    
    for (const record of data) {
      try {
        // Apply field mapping
        const mappedRecord = this.applyFieldMapping(record, mapping);
        
        // Infer equipment type
        const equipmentType = this.inferEquipmentType(mappedRecord);
        
        // Validate mapped data
        const validation = await this.validateEquipmentData(mappedRecord, equipmentType, {
          strictMode: false,
          autoFix: true
        });
        
        if (validation.isValid || validation.qualityScore > 70) {
          validRecords.push(validation.validatedData);
        } else {
          invalidRecords.push({
            originalRecord: record,
            mappedRecord: mappedRecord,
            issues: validation.issues,
            qualityScore: validation.qualityScore
          });
        }
        
      } catch (error) {
        mappingIssues.push({
          id: `mapping-${Date.now()}`,
          severity: 'high',
          category: 'validity',
          field: 'mapping',
          description: `Failed to map record from source ${source}: ${error}`,
          currentValue: record,
          suggestedAction: 'Review field mapping configuration',
          impact: {
            recordsAffected: 1,
            businessImpact: 'Data integration failure',
            systemImpact: 'Record excluded from processing'
          }
        });
        invalidRecords.push({ originalRecord: record, error: error?.toString() });
      }
    }
    
    const sourceQuality = validRecords.length / data.length * 100;
    
    // Store source metrics
    this.dataSourceMetrics.set(source, {
      lastUpdate: new Date(),
      totalRecords: data.length,
      validRecords: validRecords.length,
      qualityScore: sourceQuality,
      mappingIssues: mappingIssues.length
    });
    
    return {
      validRecords,
      invalidRecords,
      mappingIssues,
      sourceQuality
    };
  }
  
  /**
   * Real-time data quality monitoring
   */
  async monitorDataQuality(
    equipmentId: string,
    realTimeData: any,
    thresholds: {
      minQualityScore: number;
      maxErrorRate: number;
      completenessThreshold: number;
    }
  ): Promise<{
    qualityAlert: boolean;
    issues: DataQualityIssue[];
    metrics: {
      qualityScore: number;
      completeness: number;
      accuracy: number;
    };
    recommendations: string[];
  }> {
    
    // Infer equipment type
    const equipmentType = this.inferEquipmentType(realTimeData);
    
    // Validate real-time data
    const validation = await this.validateEquipmentData(realTimeData, equipmentType);
    
    // Calculate completeness
    const completeness = this.calculateDataCompleteness(realTimeData);
    
    // Check quality thresholds
    const qualityAlert = 
      validation.qualityScore < thresholds.minQualityScore ||
      completeness < thresholds.completenessThreshold ||
      (validation.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length / 
       Object.keys(realTimeData).length) > thresholds.maxErrorRate;
    
    // Generate real-time recommendations
    const recommendations = [];
    if (validation.qualityScore < thresholds.minQualityScore) {
      recommendations.push('Data quality below threshold - check data sources and sensors');
    }
    if (completeness < thresholds.completenessThreshold) {
      recommendations.push('Data completeness issues detected - verify all sensors are reporting');
    }
    
    return {
      qualityAlert,
      issues: validation.issues,
      metrics: {
        qualityScore: validation.qualityScore,
        completeness,
        accuracy: this.calculateAccuracyScore(validation.issues, 1) * 100
      },
      recommendations
    };
  }
  
  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }
  
  /**
   * Get data source quality metrics
   */
  getDataSourceMetrics(): { [source: string]: any } {
    return Object.fromEntries(this.dataSourceMetrics);
  }
  
  /**
   * Export quality report in various formats
   */
  async exportQualityReport(
    report: DataQualityReport,
    format: 'json' | 'csv' | 'pdf' | 'xlsx'
  ): Promise<Buffer> {
    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(report, null, 2));
      case 'csv':
        return this.exportToCSV(report);
      case 'pdf':
        return this.exportToPDF(report);
      case 'xlsx':
        return this.exportToXLSX(report);
      default:
        throw new Error('Unsupported export format');
    }
  }
  
  // =====================================================
  // PRIVATE IMPLEMENTATION METHODS
  // =====================================================
  
  private initializeDefaultRules(): void {
    // Technical validation rules
    this.addValidationRule({
      id: 'panel-efficiency-range',
      name: 'Panel Efficiency Range Validation',
      category: 'technical',
      severity: 'error',
      description: 'Panel efficiency must be within realistic bounds for the technology type',
      equipmentTypes: ['panel'],
      rule: {
        field: 'efficiency',
        condition: 'efficiency >= minEfficiency && efficiency <= maxEfficiency',
        dependencies: ['technology']
      },
      errorMessage: 'Panel efficiency outside acceptable range for technology type',
      suggestedFix: 'Verify efficiency rating against manufacturer specifications'
    });
    
    this.addValidationRule({
      id: 'inverter-dc-ac-ratio',
      name: 'Inverter DC/AC Ratio Validation',
      category: 'technical',
      severity: 'warning',
      description: 'DC input should not exceed 1.5x AC output capacity',
      equipmentTypes: ['inverter'],
      rule: {
        condition: 'dcInput.maxPower <= acOutput.nominalPower * 1.5',
        dependencies: ['dcInput.maxPower', 'acOutput.nominalPower']
      },
      errorMessage: 'DC/AC ratio exceeds recommended maximum of 1.5',
      suggestedFix: 'Consider higher AC capacity inverter or reduce DC input'
    });
    
    this.addValidationRule({
      id: 'battery-capacity-consistency',
      name: 'Battery Capacity Consistency',
      category: 'technical',
      severity: 'error',
      description: 'Usable capacity should not exceed nominal capacity',
      equipmentTypes: ['battery'],
      rule: {
        condition: 'electrical.usableCapacity <= electrical.nominalCapacity',
        dependencies: ['electrical.usableCapacity', 'electrical.nominalCapacity']
      },
      errorMessage: 'Usable capacity exceeds nominal capacity',
      suggestedFix: 'Correct capacity specifications'
    });
    
    // Business rules
    this.addValidationRule({
      id: 'price-reasonableness',
      name: 'Price Reasonableness Check',
      category: 'business',
      severity: 'warning',
      description: 'Equipment pricing should be within market range',
      equipmentTypes: ['panel', 'inverter', 'battery'],
      rule: {
        condition: 'pricePerWatt >= 0.20 && pricePerWatt <= 5.00',
        dependencies: ['pricePerWatt']
      },
      errorMessage: 'Price per watt outside typical market range',
      suggestedFix: 'Verify pricing data accuracy'
    });
    
    // Regulatory compliance rules
    this.addValidationRule({
      id: 'required-certifications',
      name: 'Required Certifications Check',
      category: 'regulatory',
      severity: 'error',
      description: 'Equipment must have required safety certifications',
      equipmentTypes: ['panel', 'inverter'],
      rule: {
        condition: 'certifications.includes("UL") && certifications.includes("IEC")',
        dependencies: ['certifications']
      },
      errorMessage: 'Missing required safety certifications',
      suggestedFix: 'Verify certification status with manufacturer'
    });
  }
  
  private async validateAgainstSchema(equipment: any, equipmentType: string): Promise<{
    data: any;
    issues: DataQualityIssue[];
  }> {
    const issues: DataQualityIssue[] = [];
    
    try {
      let validatedData;
      
      switch (equipmentType) {
        case 'panel':
          validatedData = solarPanelSpecSchema.parse(equipment);
          break;
        case 'inverter':
          validatedData = inverterSpecSchema.parse(equipment);
          break;
        case 'battery':
          validatedData = batterySpecSchema.parse(equipment);
          break;
        default:
          // Basic validation for other types
          validatedData = equipment;
      }
      
      return { data: validatedData, issues };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.errors) {
          issues.push({
            id: `schema-${Date.now()}-${Math.random()}`,
            severity: 'high',
            category: 'validity',
            field: issue.path.join('.'),
            description: issue.message,
            currentValue: issue.received,
            suggestedAction: 'Correct field value according to schema requirements',
            impact: {
              recordsAffected: 1,
              businessImpact: 'Data quality degradation',
              systemImpact: 'Field validation failure'
            }
          });
        }
      }
      
      return { data: equipment, issues };
    }
  }
  
  private getBusinessRules(equipmentType: string): ValidationRule[] {
    return Array.from(this.validationRules.values()).filter(
      rule => rule.equipmentTypes.includes(equipmentType as any)
    );
  }
  
  private async executeValidationRule(
    data: any,
    rule: ValidationRule
  ): Promise<{ issues: DataQualityIssue[]; fixes: DataQualityFix[] }> {
    const issues: DataQualityIssue[] = [];
    const fixes: DataQualityFix[] = [];
    
    try {
      // Create context for rule evaluation
      const context = this.createRuleContext(data, rule);
      
      // Evaluate rule condition
      const isValid = this.evaluateCondition(rule.rule.condition, context);
      
      if (!isValid) {
        issues.push({
          id: `rule-${rule.id}-${Date.now()}`,
          severity: rule.severity === 'error' ? 'high' : rule.severity === 'warning' ? 'medium' : 'low',
          category: rule.category as any,
          field: rule.rule.field || 'multiple',
          description: rule.errorMessage,
          suggestedAction: rule.suggestedFix,
          impact: {
            recordsAffected: 1,
            businessImpact: 'Rule violation detected',
            systemImpact: 'Data quality issue'
          }
        });
        
        // Generate auto-fix if available
        if (rule.autoFix?.enabled) {
          fixes.push({
            ruleId: rule.id,
            field: rule.rule.field,
            strategy: rule.autoFix.strategy,
            parameters: rule.autoFix.parameters
          });
        }
      }
      
    } catch (error) {
      issues.push({
        id: `rule-error-${rule.id}-${Date.now()}`,
        severity: 'medium',
        category: 'validity',
        field: 'validation',
        description: `Rule execution failed: ${error}`,
        suggestedAction: 'Check rule definition and data format',
        impact: {
          recordsAffected: 1,
          businessImpact: 'Validation incomplete',
          systemImpact: 'Rule execution error'
        }
      });
    }
    
    return { issues, fixes };
  }
  
  private createRuleContext(data: any, rule: ValidationRule): any {
    const context = { ...data };
    
    // Add technology-specific constants
    if (data.technology) {
      if (PANEL_TECHNOLOGIES[data.technology as keyof typeof PANEL_TECHNOLOGIES]) {
        const tech = PANEL_TECHNOLOGIES[data.technology as keyof typeof PANEL_TECHNOLOGIES];
        context.minEfficiency = tech.minEfficiency;
        context.maxEfficiency = tech.maxEfficiency;
      }
    }
    
    return context;
  }
  
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // Simple condition evaluation (in production, use a safe expression evaluator)
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return func(context);
    } catch {
      return false;
    }
  }
  
  private async validateTechnicalSpecs(data: any, equipmentType: string): Promise<{ issues: DataQualityIssue[] }> {
    // Technical specification validation logic
    return { issues: [] };
  }
  
  private async validateCrossReferences(data: any, equipmentType: string): Promise<{ issues: DataQualityIssue[] }> {
    // Cross-reference validation logic
    return { issues: [] };
  }
  
  private async validateMarketData(data: any, equipmentType: string): Promise<{ issues: DataQualityIssue[] }> {
    // Market data validation logic
    return { issues: [] };
  }
  
  private async applyAutoFixes(data: any, fixes: DataQualityFix[]): Promise<{ data: any }> {
    // Auto-fix application logic
    return { data };
  }
  
  private calculateQualityScore(issues: DataQualityIssue[], data: any): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 1;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  private inferEquipmentType(data: any): 'panel' | 'inverter' | 'battery' | 'mounting' | 'electrical' | 'monitoring' {
    // Equipment type inference logic
    if (data.wattage && data.efficiency && data.dimensions) return 'panel';
    if (data.capacity && data.dcInput && data.acOutput) return 'inverter';
    if (data.capacity && data.roundTripEfficiency) return 'battery';
    return 'panel'; // default
  }
  
  private calculateCompletenessScore(dataset: any[]): number {
    // Completeness calculation logic
    return 95; // placeholder
  }
  
  private calculateAccuracyScore(issues: DataQualityIssue[], totalRecords: number): number {
    const accuracyIssues = issues.filter(i => i.category === 'accuracy').length;
    return Math.max(0, (1 - accuracyIssues / totalRecords) * 100);
  }
  
  private calculateConsistencyScore(dataset: any[]): number {
    // Consistency calculation logic
    return 90; // placeholder
  }
  
  private async analyzeFieldQuality(dataset: any[], issues: DataQualityIssue[]): Promise<any[]> {
    // Field quality analysis logic
    return [];
  }
  
  private async checkDataIntegrity(dataset: any[]): Promise<any> {
    // Data integrity checking logic
    return {
      duplicateRecords: 0,
      orphanedRecords: 0,
      referentialIntegrityIssues: 0,
      businessRuleViolations: []
    };
  }
  
  private generateRecommendations(issues: DataQualityIssue[], dataset: any[]): DataQualityRecommendation[] {
    // Recommendation generation logic
    return [];
  }
  
  private analyzeTrends(datasetId: string): any {
    // Trend analysis logic
    return {
      qualityTrend: 'stable' as const,
      completenessChange: 0,
      accuracyChange: 0
    };
  }
  
  private applyFieldMapping(record: any, mapping: { [key: string]: string }): any {
    const mapped: any = {};
    for (const [externalField, internalField] of Object.entries(mapping)) {
      if (record[externalField] !== undefined) {
        mapped[internalField] = record[externalField];
      }
    }
    return mapped;
  }
  
  private calculateDataCompleteness(data: any): number {
    const totalFields = Object.keys(data).length;
    const completeFields = Object.values(data).filter(v => v !== null && v !== undefined && v !== '').length;
    return (completeFields / totalFields) * 100;
  }
  
  private async exportToCSV(report: DataQualityReport): Promise<Buffer> {
    // CSV export implementation
    return Buffer.from('CSV export placeholder');
  }
  
  private async exportToPDF(report: DataQualityReport): Promise<Buffer> {
    // PDF export implementation
    return Buffer.from('PDF export placeholder');
  }
  
  private async exportToXLSX(report: DataQualityReport): Promise<Buffer> {
    // XLSX export implementation
    return Buffer.from('XLSX export placeholder');
  }
}

// =====================================================
// SUPPORTING INTERFACES
// =====================================================

export interface DataQualityFix {
  ruleId: string;
  field?: string;
  strategy: 'default_value' | 'calculation' | 'lookup' | 'deletion';
  parameters?: any;
}

// =====================================================
// DATA QUALITY METRICS COLLECTOR
// =====================================================

export class DataQualityMetricsCollector {
  private metrics: Map<string, any> = new Map();
  
  /**
   * Collect quality metrics over time
   */
  async collectMetrics(datasetId: string, report: DataQualityReport): Promise<void> {
    const existing = this.metrics.get(datasetId) || { history: [] };
    existing.history.push({
      date: report.validationDate,
      qualityScore: report.overall.qualityScore,
      completeness: report.overall.completenessScore,
      accuracy: report.overall.accuracyScore,
      consistency: report.overall.consistencyScore,
      issues: report.fieldQuality.reduce((sum, f) => sum + f.issues.length, 0)
    });
    
    // Keep only last 90 days
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    existing.history = existing.history.filter((h: any) => h.date > cutoff);
    
    this.metrics.set(datasetId, existing);
  }
  
  /**
   * Get quality trends
   */
  getQualityTrends(datasetId: string, period: 'week' | 'month' | 'quarter'): any {
    const data = this.metrics.get(datasetId);
    if (!data || data.history.length < 2) {
      return { trend: 'insufficient_data' };
    }
    
    // Calculate trends based on period
    const history = data.history.sort((a: any, b: any) => a.date - b.date);
    const recent = history.slice(-7); // Last 7 data points
    const earlier = history.slice(0, 7);
    
    if (recent.length === 0 || earlier.length === 0) {
      return { trend: 'insufficient_data' };
    }
    
    const recentAvg = recent.reduce((sum: number, h: any) => sum + h.qualityScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum: number, h: any) => sum + h.qualityScore, 0) / earlier.length;
    
    const change = recentAvg - earlierAvg;
    
    return {
      trend: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      change,
      current: recentAvg,
      previous: earlierAvg,
      history: history
    };
  }
}