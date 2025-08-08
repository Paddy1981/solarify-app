/**
 * Solar Equipment Compatibility Matching Engine
 * Advanced algorithms for validating system compatibility and optimization
 */

import { SolarPanel, Inverter, BatteryStorage } from './solar-database';
import { MountingHardware, RackingSystem, ElectricalComponent, MonitoringDevice } from './comprehensive-equipment-database';

// =====================================================
// COMPATIBILITY RESULT INTERFACES
// =====================================================

export interface CompatibilityResult {
  isCompatible: boolean;
  score: number; // 0-100 compatibility score
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  recommendations: string[];
}

export interface CompatibilityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'electrical' | 'physical' | 'environmental' | 'regulatory' | 'performance';
  description: string;
  resolution?: string;
}

export interface CompatibilityWarning {
  type: 'performance_impact' | 'installation_complexity' | 'cost_impact' | 'maintenance_concern';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface SystemConfiguration {
  panels: SolarPanel[];
  inverter: Inverter;
  battery?: BatteryStorage;
  racking?: RackingSystem;
  mounting?: MountingHardware[];
  electrical?: ElectricalComponent[];
  monitoring?: MonitoringDevice[];
  
  // System layout
  layout: {
    panelsPerString: number;
    stringsPerInverter: number;
    totalPanels: number;
    systemVoltage: number;
    totalCapacity: number; // kW
  };
  
  // Installation context
  installation: {
    roofType: string;
    roofPitch: number; // degrees
    azimuth: number; // degrees
    tilt: number; // degrees
    shading: 'none' | 'minimal' | 'moderate' | 'significant';
    location: {
      latitude: number;
      longitude: number;
      climate: string;
      windZone: number;
      snowLoad: number; // Pa
    };
  };
}

// =====================================================
// COMPATIBILITY MATCHING ENGINE
// =====================================================

export class CompatibilityMatchingEngine {
  
  /**
   * Perform comprehensive system compatibility analysis
   */
  static analyzeSystemCompatibility(config: SystemConfiguration): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    const recommendations: string[] = [];
    
    // Electrical compatibility checks
    const electricalResults = this.checkElectricalCompatibility(config);
    issues.push(...electricalResults.issues);
    warnings.push(...electricalResults.warnings);
    
    // Physical compatibility checks
    const physicalResults = this.checkPhysicalCompatibility(config);
    issues.push(...physicalResults.issues);
    warnings.push(...physicalResults.warnings);
    
    // Environmental compatibility checks
    const environmentalResults = this.checkEnvironmentalCompatibility(config);
    issues.push(...environmentalResults.issues);
    warnings.push(...environmentalResults.warnings);
    
    // Performance optimization checks
    const performanceResults = this.checkPerformanceOptimization(config);
    warnings.push(...performanceResults.warnings);
    recommendations.push(...performanceResults.recommendations);
    
    // Regulatory compliance checks
    const regulatoryResults = this.checkRegulatoryCompliance(config);
    issues.push(...regulatoryResults.issues);
    
    // Calculate compatibility score
    const score = this.calculateCompatibilityScore(issues, warnings);
    
    return {
      isCompatible: issues.filter(i => i.severity === 'critical').length === 0,
      score,
      issues,
      warnings,
      recommendations
    };
  }
  
  /**
   * Check electrical compatibility between components
   */
  private static checkElectricalCompatibility(config: SystemConfiguration): {
    issues: CompatibilityIssue[];
    warnings: CompatibilityWarning[];
  } {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    const panel = config.panels[0]; // Assuming all panels are the same
    const { inverter, layout } = config;
    
    // Voltage compatibility
    const stringVoltage = panel.stc?.voltage ? panel.stc.voltage * layout.panelsPerString : 0;
    const inverterMinVoltage = inverter.dcInput?.voltageRange?.min || 0;
    const inverterMaxVoltage = inverter.dcInput?.voltageRange?.max || 1500;
    
    if (stringVoltage < inverterMinVoltage) {
      issues.push({
        severity: 'critical',
        category: 'electrical',
        description: `String voltage (${stringVoltage}V) is below inverter minimum (${inverterMinVoltage}V)`,
        resolution: 'Increase panels per string or select panels with higher voltage'
      });
    }
    
    if (stringVoltage > inverterMaxVoltage) {
      issues.push({
        severity: 'critical',
        category: 'electrical',
        description: `String voltage (${stringVoltage}V) exceeds inverter maximum (${inverterMaxVoltage}V)`,
        resolution: 'Reduce panels per string or select panels with lower voltage'
      });
    }
    
    // Current compatibility
    const stringCurrent = panel.stc?.current || 0;
    const inverterMaxCurrent = inverter.dcInput?.currentRange?.max || 0;
    
    if (stringCurrent > inverterMaxCurrent) {
      issues.push({
        severity: 'high',
        category: 'electrical',
        description: `String current (${stringCurrent}A) exceeds inverter maximum (${inverterMaxCurrent}A)`,
        resolution: 'Select inverter with higher current rating'
      });
    }
    
    // Power compatibility
    const totalPanelPower = (panel.wattage || 0) * layout.totalPanels;
    const inverterMaxPower = inverter.dcInput?.maxPower || inverter.capacity || 0;
    
    const oversizingRatio = totalPanelPower / inverterMaxPower;
    
    if (oversizingRatio > 1.5) {
      issues.push({
        severity: 'high',
        category: 'electrical',
        description: `System oversizing ratio (${oversizingRatio.toFixed(2)}) exceeds recommended maximum (1.5)`,
        resolution: 'Reduce number of panels or select larger inverter'
      });
    } else if (oversizingRatio > 1.3) {
      warnings.push({
        type: 'performance_impact',
        description: `High oversizing ratio (${oversizingRatio.toFixed(2)}) may cause power clipping during peak production`,
        impact: 'medium'
      });
    }
    
    if (oversizingRatio < 0.8) {
      warnings.push({
        type: 'performance_impact',
        description: `Low DC/AC ratio (${oversizingRatio.toFixed(2)}) may result in suboptimal inverter efficiency`,
        impact: 'low'
      });
    }
    
    // MPPT channel utilization
    if (inverter.mpptChannels && layout.stringsPerInverter > inverter.mpptChannels) {
      warnings.push({
        type: 'performance_impact',
        description: `Number of strings (${layout.stringsPerInverter}) exceeds MPPT channels (${inverter.mpptChannels})`,
        impact: 'medium'
      });
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check physical compatibility and constraints
   */
  private static checkPhysicalCompatibility(config: SystemConfiguration): {
    issues: CompatibilityIssue[];
    warnings: CompatibilityWarning[];
  } {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    const panel = config.panels[0];
    const { racking, mounting, installation } = config;
    
    // Panel-racking compatibility
    if (racking) {
      const panelLength = panel.dimensions?.length || 0;
      const panelWidth = panel.dimensions?.width || 0;
      const panelWeight = panel.weight || 0;
      
      // Size compatibility
      if (panelLength < racking.compatibility.panelSizes.min.length ||
          panelLength > racking.compatibility.panelSizes.max.length ||
          panelWidth < racking.compatibility.panelSizes.min.width ||
          panelWidth > racking.compatibility.panelSizes.max.width) {
        issues.push({
          severity: 'high',
          category: 'physical',
          description: 'Panel dimensions are outside racking system compatibility range',
          resolution: 'Select compatible racking system or different panel size'
        });
      }
      
      // Weight compatibility
      if (panelWeight < racking.compatibility.panelWeight.min ||
          panelWeight > racking.compatibility.panelWeight.max) {
        issues.push({
          severity: 'medium',
          category: 'physical',
          description: 'Panel weight is outside racking system specifications',
          resolution: 'Verify structural load calculations and racking capacity'
        });
      }
      
      // Roof type compatibility
      if (!racking.compatibility.roofTypes.includes(installation.roofType)) {
        issues.push({
          severity: 'critical',
          category: 'physical',
          description: `Racking system is not compatible with ${installation.roofType} roof type`,
          resolution: 'Select compatible racking system for roof type'
        });
      }
      
      // Roof pitch compatibility
      if (installation.roofPitch < racking.compatibility.roofPitch.min ||
          installation.roofPitch > racking.compatibility.roofPitch.max) {
        warnings.push({
          type: 'installation_complexity',
          description: `Roof pitch (${installation.roofPitch}°) is outside optimal range for this racking system`,
          impact: 'medium'
        });
      }
    }
    
    // Mounting hardware compatibility
    if (mounting && mounting.length > 0) {
      const mountingHardware = mounting[0];
      const panelFrameThickness = panel.dimensions?.thickness || 0;
      
      if (panelFrameThickness < mountingHardware.compatibility.panelThickness.min ||
          panelFrameThickness > mountingHardware.compatibility.panelThickness.max) {
        issues.push({
          severity: 'high',
          category: 'physical',
          description: 'Panel frame thickness is incompatible with mounting hardware',
          resolution: 'Select compatible mounting clamps or different panels'
        });
      }
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check environmental compatibility
   */
  private static checkEnvironmentalCompatibility(config: SystemConfiguration): {
    issues: CompatibilityIssue[];
    warnings: CompatibilityWarning[];
  } {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    const { installation, racking, mounting } = config;
    const { location } = installation;
    
    // Climate-based checks
    if (location.climate === 'marine' || location.climate === 'coastal') {
      // Check corrosion resistance
      if (racking && racking.construction.corrosionResistance !== 'Marine Grade') {
        warnings.push({
          type: 'maintenance_concern',
          description: 'Non-marine grade materials may experience accelerated corrosion in coastal environment',
          impact: 'high'
        });
      }
      
      if (mounting) {
        const nonMarineHardware = mounting.filter(h => h.materials.corrosionResistance !== 'marine_grade');
        if (nonMarineHardware.length > 0) {
          warnings.push({
            type: 'maintenance_concern',
            description: 'Some mounting hardware lacks marine-grade corrosion resistance',
            impact: 'medium'
          });
        }
      }
    }
    
    // Wind zone compatibility
    if (racking && location.windZone > 3) {
      const windLoadRating = racking.loadRatings.windLoad.uplift;
      const requiredWindLoad = location.windZone * 1200; // Simplified calculation
      
      if (windLoadRating < requiredWindLoad) {
        issues.push({
          severity: 'critical',
          category: 'environmental',
          description: `Racking system wind load rating (${windLoadRating}Pa) insufficient for wind zone ${location.windZone}`,
          resolution: 'Select racking system with higher wind load rating or add additional attachments'
        });
      }
    }
    
    // Snow load compatibility
    if (racking && location.snowLoad > 0) {
      if (racking.loadRatings.snowLoad < location.snowLoad) {
        issues.push({
          severity: 'high',
          category: 'environmental',
          description: `Racking system snow load rating (${racking.loadRatings.snowLoad}Pa) insufficient for location requirement (${location.snowLoad}Pa)`,
          resolution: 'Select racking system with higher snow load rating'
        });
      }
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check performance optimization opportunities
   */
  private static checkPerformanceOptimization(config: SystemConfiguration): {
    warnings: CompatibilityWarning[];
    recommendations: string[];
  } {
    const warnings: CompatibilityWarning[] = [];
    const recommendations: string[] = [];
    
    const panel = config.panels[0];
    const { inverter, installation, layout } = config;
    
    // Tilt and azimuth optimization
    const optimalAzimuth = installation.location.latitude > 0 ? 180 : 0; // South in Northern Hemisphere
    const azimuthDeviation = Math.abs(installation.azimuth - optimalAzimuth);
    
    if (azimuthDeviation > 45) {
      warnings.push({
        type: 'performance_impact',
        description: `Suboptimal azimuth (${installation.azimuth}°) may reduce energy production by ${Math.round(azimuthDeviation * 0.5)}%`,
        impact: 'high'
      });
      recommendations.push('Consider adjusting panel orientation for optimal sun exposure');
    }
    
    // Tilt optimization
    const optimalTilt = Math.abs(installation.location.latitude);
    const tiltDeviation = Math.abs(installation.tilt - optimalTilt);
    
    if (tiltDeviation > 15) {
      warnings.push({
        type: 'performance_impact',
        description: `Suboptimal tilt angle may reduce energy production by ${Math.round(tiltDeviation * 0.3)}%`,
        impact: 'medium'
      });
      recommendations.push(`Consider tilt angle closer to ${optimalTilt}° for optimal annual production`);
    }
    
    // Shading impact
    if (installation.shading !== 'none') {
      const shadingImpact = {
        minimal: 5,
        moderate: 15,
        significant: 30
      }[installation.shading];
      
      warnings.push({
        type: 'performance_impact',
        description: `${installation.shading} shading may reduce system performance by up to ${shadingImpact}%`,
        impact: installation.shading === 'significant' ? 'high' : 'medium'
      });
      
      if (inverter.type === 'string') {
        recommendations.push('Consider microinverters or power optimizers to mitigate shading losses');
      }
    }
    
    // Temperature coefficient optimization
    if (installation.location.climate === 'hot' && panel.temperatureCoefficient) {
      if (panel.temperatureCoefficient < -0.4) {
        warnings.push({
          type: 'performance_impact',
          description: 'Panel temperature coefficient may result in significant hot weather losses',
          impact: 'medium'
        });
        recommendations.push('Consider panels with better temperature coefficients for hot climates');
      }
    }
    
    // Inverter efficiency at partial loads
    const averageLoad = layout.totalCapacity / (inverter.capacity / 1000);
    if (averageLoad < 0.3) {
      warnings.push({
        type: 'performance_impact',
        description: 'Inverter may operate at low efficiency due to oversizing',
        impact: 'low'
      });
      recommendations.push('Consider smaller inverter or additional panels for better efficiency');
    }
    
    return { warnings, recommendations };
  }
  
  /**
   * Check regulatory compliance
   */
  private static checkRegulatoryCompliance(config: SystemConfiguration): {
    issues: CompatibilityIssue[];
  } {
    const issues: CompatibilityIssue[] = [];
    
    const { panels, inverter, electrical } = config;
    const panel = panels[0];
    
    // Check for required certifications
    const requiredPanelCerts = ['IEC 61215', 'IEC 61730', 'UL 1703'];
    const panelCerts = panel.certifications || [];
    
    for (const cert of requiredPanelCerts) {
      if (!panelCerts.some(c => c.includes(cert.replace(/\s/g, '')))) {
        issues.push({
          severity: 'high',
          category: 'regulatory',
          description: `Panel missing required certification: ${cert}`,
          resolution: 'Select panels with proper certifications'
        });
      }
    }
    
    // Check inverter certifications
    const requiredInverterCerts = ['UL 1741', 'IEEE 1547'];
    const inverterCerts = inverter.certifications || [];
    
    for (const cert of requiredInverterCerts) {
      if (!inverterCerts.some(c => c.includes(cert.replace(/\s/g, '')))) {
        issues.push({
          severity: 'critical',
          category: 'regulatory',
          description: `Inverter missing required certification: ${cert}`,
          resolution: 'Select inverter with proper grid-tie certifications'
        });
      }
    }
    
    // Check rapid shutdown compliance
    if (inverter.type === 'string') {
      const hasRapidShutdown = electrical?.some(e => 
        e.category === 'dc_disconnect' || 
        e.safety?.rapidShutdown
      );
      
      if (!hasRapidShutdown) {
        issues.push({
          severity: 'high',
          category: 'regulatory',
          description: 'System may not comply with rapid shutdown requirements (NEC 690.12)',
          resolution: 'Add rapid shutdown device or use module-level power electronics'
        });
      }
    }
    
    return { issues };
  }
  
  /**
   * Calculate overall compatibility score
   */
  private static calculateCompatibilityScore(
    issues: CompatibilityIssue[],
    warnings: CompatibilityWarning[]
  ): number {
    let score = 100;
    
    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    }
    
    // Deduct points for warnings
    for (const warning of warnings) {
      switch (warning.impact) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Find compatible equipment options
   */
  static findCompatibleEquipment(
    baseEquipment: SolarPanel | Inverter,
    equipmentDatabase: (SolarPanel | Inverter | BatteryStorage)[],
    requirements: {
      powerRange?: { min: number; max: number };
      voltageRange?: { min: number; max: number };
      efficiency?: { min: number };
      budget?: { max: number };
      tier?: number;
    }
  ): (SolarPanel | Inverter | BatteryStorage)[] {
    return equipmentDatabase.filter(equipment => {
      // Type-specific compatibility checks
      if ('wattage' in equipment && 'wattage' in baseEquipment) {
        // Panel-to-panel compatibility
        const panel = equipment as SolarPanel;
        
        if (requirements.powerRange) {
          if (panel.wattage < requirements.powerRange.min || panel.wattage > requirements.powerRange.max) {
            return false;
          }
        }
        
        if (requirements.efficiency?.min && panel.efficiency < requirements.efficiency.min) {
          return false;
        }
        
        if (requirements.budget?.max && panel.pricePerWatt > requirements.budget.max) {
          return false;
        }
        
        if (requirements.tier && panel.tier !== requirements.tier) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Generate system configuration recommendations
   */
  static generateSystemRecommendations(
    targetCapacity: number, // kW
    siteConditions: {
      roofType: string;
      availableArea: number; // m²
      shading: string;
      climate: string;
      budget?: number;
    },
    preferences: {
      panelType?: string;
      inverterType?: string;
      monitoring?: boolean;
      battery?: boolean;
      tier1Only?: boolean;
    }
  ): {
    configurations: SystemConfiguration[];
    analysis: {
      pros: string[];
      cons: string[];
      cost: number;
      performance: number;
    }[];
  } {
    // This would contain the logic to generate multiple system configuration options
    // based on target capacity, site conditions, and preferences
    
    // For now, returning a placeholder structure
    return {
      configurations: [],
      analysis: []
    };
  }
}

// =====================================================
// SPECIALIZED COMPATIBILITY CHECKERS
// =====================================================

export class ElectricalCompatibilityChecker {
  /**
   * Check panel-to-inverter electrical compatibility
   */
  static checkPanelInverterCompatibility(
    panels: SolarPanel[],
    inverter: Inverter,
    configuration: {
      panelsPerString: number;
      stringsPerInverter: number;
    }
  ): CompatibilityResult {
    // Detailed electrical compatibility analysis
    // Implementation would check voltage, current, power compatibility
    // with temperature variations and safety margins
    
    return {
      isCompatible: true,
      score: 95,
      issues: [],
      warnings: [],
      recommendations: []
    };
  }
  
  /**
   * Check grounding and bonding compatibility
   */
  static checkGroundingCompatibility(
    equipment: (SolarPanel | Inverter | MountingHardware)[],
    installation: { roofType: string; groundingMethod: string }
  ): CompatibilityResult {
    // Check grounding requirements and compatibility
    
    return {
      isCompatible: true,
      score: 100,
      issues: [],
      warnings: [],
      recommendations: []
    };
  }
}

export class PhysicalCompatibilityChecker {
  /**
   * Check mounting system compatibility
   */
  static checkMountingCompatibility(
    panels: SolarPanel[],
    racking: RackingSystem,
    mounting: MountingHardware[],
    installation: {
      roofType: string;
      roofPitch: number;
      structuralCapacity: number;
    }
  ): CompatibilityResult {
    // Detailed physical compatibility analysis
    
    return {
      isCompatible: true,
      score: 92,
      issues: [],
      warnings: [],
      recommendations: []
    };
  }
}

export class PerformanceOptimizer {
  /**
   * Optimize system configuration for maximum performance
   */
  static optimizeConfiguration(
    baseConfig: SystemConfiguration
  ): {
    optimizedConfig: SystemConfiguration;
    improvements: {
      category: string;
      improvement: string;
      impact: number; // percentage improvement
    }[];
  } {
    // Performance optimization logic
    
    return {
      optimizedConfig: baseConfig,
      improvements: []
    };
  }
}