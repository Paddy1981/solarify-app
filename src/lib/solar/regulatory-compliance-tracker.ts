/**
 * Regulatory Compliance and Policy Tracking System
 * 
 * Comprehensive system for monitoring utility policy changes, regulatory updates,
 * and compliance requirements that affect net metering customers
 */

import { utilityProviderDatabase } from './utility-provider-database';
import { netMeteringEngine } from './net-metering-engine';
import { logger } from '../error-handling/logger';

// Types and Interfaces

export interface RegulatoryPolicy {
  id: string;
  type: 'federal' | 'state' | 'utility' | 'municipal';
  category: 'net_metering' | 'interconnection' | 'rates' | 'renewable_energy' | 'grid_modernization';
  title: string;
  description: string;
  jurisdiction: {
    state?: string;
    utility?: string;
    municipality?: string;
    counties?: string[];
  };
  status: 'proposed' | 'pending' | 'approved' | 'active' | 'expired' | 'superseded';
  effectiveDate: Date;
  expirationDate?: Date;
  lastUpdated: Date;
  source: string;
  documentUrl?: string;
  summary: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedCustomers: string[];
  changeHistory: PolicyChangeRecord[];
}

export interface PolicyChangeRecord {
  id: string;
  policyId: string;
  changeType: 'created' | 'modified' | 'status_change' | 'expired' | 'superseded';
  changeDate: Date;
  description: string;
  previousValue?: any;
  newValue?: any;
  impactAssessment: string;
  notificationsSent: boolean;
}

export interface InterconnectionRequirement {
  id: string;
  utilityId: string;
  systemSizeCategories: {
    smallScale: { max: number; requirements: string[] };
    mediumScale: { min: number; max: number; requirements: string[] };
    largeScale: { min: number; requirements: string[] };
  };
  applicationProcess: {
    steps: InterconnectionStep[];
    timeframes: { [stepId: string]: number }; // days
    fees: { [stepId: string]: number };
  };
  technicalRequirements: {
    standards: string[];
    equipmentRequirements: string[];
    safetyRequirements: string[];
    meteringRequirements: string[];
  };
  lastUpdated: Date;
}

export interface InterconnectionStep {
  id: string;
  name: string;
  description: string;
  requiredDocuments: string[];
  automated: boolean;
  maxDuration: number; // days
}

export interface RateCaseTracking {
  id: string;
  utilityId: string;
  caseNumber: string;
  type: 'general_rate_case' | 'nem_tariff' | 'special_rates';
  status: 'filed' | 'under_review' | 'public_comment' | 'hearing_scheduled' | 'decided' | 'implemented';
  filingDate: Date;
  proposedEffectiveDate?: Date;
  actualEffectiveDate?: Date;
  description: string;
  proposedChanges: {
    rateStructure?: any;
    nemCompensation?: any;
    fees?: any;
    terms?: any;
  };
  timeline: RateCaseEvent[];
  impactAnalysis: string;
  publicCommentsEnabled: boolean;
  hearingDates?: Date[];
}

export interface RateCaseEvent {
  date: Date;
  type: 'filing' | 'review_start' | 'public_comment_open' | 'hearing' | 'decision' | 'implementation';
  description: string;
  documents?: string[];
}

export interface ComplianceAlert {
  id: string;
  type: 'policy_change' | 'rate_case' | 'interconnection_update' | 'compliance_deadline' | 'grandfathering_expiry';
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  title: string;
  message: string;
  affectedCustomers: string[];
  actionRequired: boolean;
  actionDescription?: string;
  deadline?: Date;
  relatedPolicy?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PolicySubscription {
  customerId: string;
  subscriptionTypes: string[];
  jurisdictions: string[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  lastNotificationSent?: Date;
}

// Main Regulatory Compliance Tracker Class

class RegulatoryComplianceTracker {
  private policies: Map<string, RegulatoryPolicy> = new Map();
  private interconnectionRequirements: Map<string, InterconnectionRequirement> = new Map();
  private rateCases: Map<string, RateCaseTracking> = new Map();
  private subscriptions: Map<string, PolicySubscription> = new Map();
  private alertQueue: ComplianceAlert[] = [];

  constructor() {
    this.initializeTracking();
  }

  // Policy Management

  async trackRegulatoryPolicy(policy: Omit<RegulatoryPolicy, 'id' | 'lastUpdated' | 'changeHistory'>): Promise<RegulatoryPolicy> {
    const id = this.generateId();
    const now = new Date();

    const newPolicy: RegulatoryPolicy = {
      ...policy,
      id,
      lastUpdated: now,
      changeHistory: [{
        id: this.generateId(),
        policyId: id,
        changeType: 'created',
        changeDate: now,
        description: 'Policy created',
        impactAssessment: `New ${policy.category} policy created`,
        notificationsSent: false
      }]
    };

    this.policies.set(id, newPolicy);

    // Generate alerts for affected customers
    await this.generatePolicyAlert(newPolicy, 'created');

    return newPolicy;
  }

  async updateRegulatoryPolicy(
    policyId: string, 
    updates: Partial<RegulatoryPolicy>
  ): Promise<RegulatoryPolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const now = new Date();
    const changeRecord: PolicyChangeRecord = {
      id: this.generateId(),
      policyId,
      changeType: 'modified',
      changeDate: now,
      description: 'Policy updated',
      impactAssessment: this.assessPolicyImpact(policy, updates),
      notificationsSent: false
    };

    const updatedPolicy: RegulatoryPolicy = {
      ...policy,
      ...updates,
      lastUpdated: now,
      changeHistory: [...policy.changeHistory, changeRecord]
    };

    this.policies.set(policyId, updatedPolicy);

    // Generate alerts if significant changes
    if (this.isSignificantChange(policy, updates)) {
      await this.generatePolicyAlert(updatedPolicy, 'modified');
    }

    return updatedPolicy;
  }

  async expirePolicy(policyId: string, reason: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    const now = new Date();
    const changeRecord: PolicyChangeRecord = {
      id: this.generateId(),
      policyId,
      changeType: 'expired',
      changeDate: now,
      description: reason,
      impactAssessment: 'Policy has expired',
      notificationsSent: false
    };

    const expiredPolicy: RegulatoryPolicy = {
      ...policy,
      status: 'expired',
      lastUpdated: now,
      changeHistory: [...policy.changeHistory, changeRecord]
    };

    this.policies.set(policyId, expiredPolicy);

    // Generate critical alert for expiration
    await this.generatePolicyAlert(expiredPolicy, 'expired');

    return true;
  }

  // Interconnection Requirements Management

  async updateInterconnectionRequirements(
    utilityId: string, 
    requirements: Omit<InterconnectionRequirement, 'id' | 'utilityId' | 'lastUpdated'>
  ): Promise<InterconnectionRequirement> {
    const id = this.generateId();
    const now = new Date();

    const interconnectionReq: InterconnectionRequirement = {
      ...requirements,
      id,
      utilityId,
      lastUpdated: now
    };

    this.interconnectionRequirements.set(utilityId, interconnectionReq);

    // Alert customers about interconnection changes
    await this.generateInterconnectionAlert(utilityId, interconnectionReq);

    return interconnectionReq;
  }

  getInterconnectionRequirements(utilityId: string): InterconnectionRequirement | null {
    return this.interconnectionRequirements.get(utilityId) || null;
  }

  async validateSystemCompliance(
    utilityId: string, 
    systemSpecs: { capacity: number; equipment: string[] }
  ): Promise<{
    compliant: boolean;
    requirements: string[];
    violations: string[];
    recommendations: string[];
  }> {
    const requirements = this.getInterconnectionRequirements(utilityId);
    if (!requirements) {
      return {
        compliant: false,
        requirements: [],
        violations: ['No interconnection requirements found for utility'],
        recommendations: ['Contact utility for interconnection requirements']
      };
    }

    const { capacity, equipment } = systemSpecs;
    let category: keyof typeof requirements.systemSizeCategories;

    if (capacity <= requirements.systemSizeCategories.smallScale.max) {
      category = 'smallScale';
    } else if (capacity <= requirements.systemSizeCategories.mediumScale.max) {
      category = 'mediumScale';
    } else {
      category = 'largeScale';
    }

    const categoryReqs = requirements.systemSizeCategories[category].requirements;
    const techReqs = requirements.technicalRequirements;

    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check equipment compliance
    techReqs.equipmentRequirements.forEach(req => {
      if (!equipment.some(eq => eq.includes(req))) {
        violations.push(`Missing required equipment: ${req}`);
        recommendations.push(`Install ${req} compliant equipment`);
      }
    });

    return {
      compliant: violations.length === 0,
      requirements: [...categoryReqs, ...techReqs.standards],
      violations,
      recommendations
    };
  }

  // Rate Case Tracking

  async trackRateCase(rateCase: Omit<RateCaseTracking, 'id'>): Promise<RateCaseTracking> {
    const id = this.generateId();
    const newRateCase: RateCaseTracking = {
      ...rateCase,
      id
    };

    this.rateCases.set(id, newRateCase);

    // Generate alert for rate case filing
    await this.generateRateCaseAlert(newRateCase);

    return newRateCase;
  }

  async updateRateCase(
    rateCaseId: string, 
    updates: Partial<RateCaseTracking>
  ): Promise<RateCaseTracking | null> {
    const rateCase = this.rateCases.get(rateCaseId);
    if (!rateCase) return null;

    const updatedRateCase: RateCaseTracking = {
      ...rateCase,
      ...updates
    };

    this.rateCases.set(rateCaseId, updatedRateCase);

    // Generate status update alert
    if (updates.status && updates.status !== rateCase.status) {
      await this.generateRateCaseStatusAlert(updatedRateCase, rateCase.status);
    }

    return updatedRateCase;
  }

  getActiveRateCases(utilityId?: string): RateCaseTracking[] {
    const activeCases = Array.from(this.rateCases.values())
      .filter(rateCase => 
        rateCase.status !== 'implemented' &&
        (!utilityId || rateCase.utilityId === utilityId)
      );

    return activeCases.sort((a, b) => b.filingDate.getTime() - a.filingDate.getTime());
  }

  // Customer Subscriptions and Notifications

  async subscribeToUpdates(subscription: PolicySubscription): Promise<boolean> {
    this.subscriptions.set(subscription.customerId, subscription);
    return true;
  }

  async unsubscribeFromUpdates(customerId: string): Promise<boolean> {
    return this.subscriptions.delete(customerId);
  }

  getCustomerSubscription(customerId: string): PolicySubscription | null {
    return this.subscriptions.get(customerId) || null;
  }

  // Alert Generation and Management

  private async generatePolicyAlert(
    policy: RegulatoryPolicy, 
    changeType: 'created' | 'modified' | 'expired'
  ): Promise<void> {
    let severity: ComplianceAlert['severity'] = 'info';
    let title = '';
    let message = '';

    switch (changeType) {
      case 'created':
        severity = policy.impactLevel === 'critical' ? 'critical' : 'warning';
        title = `New ${policy.category} Policy: ${policy.title}`;
        message = `A new ${policy.type} policy has been enacted that may affect your solar installation.`;
        break;
      case 'modified':
        severity = policy.impactLevel === 'critical' ? 'urgent' : 'warning';
        title = `Policy Update: ${policy.title}`;
        message = `An existing policy has been modified and may impact your net metering benefits.`;
        break;
      case 'expired':
        severity = 'critical';
        title = `Policy Expired: ${policy.title}`;
        message = `An important policy affecting your solar benefits has expired.`;
        break;
    }

    const alert: ComplianceAlert = {
      id: this.generateId(),
      type: 'policy_change',
      severity,
      title,
      message: `${message} ${policy.summary}`,
      affectedCustomers: policy.affectedCustomers,
      actionRequired: severity === 'critical' || severity === 'urgent',
      actionDescription: severity === 'critical' ? 'Review policy impact and contact your solar provider' : undefined,
      relatedPolicy: policy.id,
      createdAt: new Date()
    };

    this.alertQueue.push(alert);
    await this.processAlert(alert);
  }

  private async generateInterconnectionAlert(
    utilityId: string, 
    requirements: InterconnectionRequirement
  ): Promise<void> {
    const affectedCustomers = this.getCustomersForUtility(utilityId);

    const alert: ComplianceAlert = {
      id: this.generateId(),
      type: 'interconnection_update',
      severity: 'warning',
      title: 'Interconnection Requirements Updated',
      message: 'Your utility has updated their interconnection requirements for solar installations.',
      affectedCustomers,
      actionRequired: true,
      actionDescription: 'Review new requirements to ensure your system remains compliant',
      createdAt: new Date()
    };

    this.alertQueue.push(alert);
    await this.processAlert(alert);
  }

  private async generateRateCaseAlert(rateCase: RateCaseTracking): Promise<void> {
    const affectedCustomers = this.getCustomersForUtility(rateCase.utilityId);

    const alert: ComplianceAlert = {
      id: this.generateId(),
      type: 'rate_case',
      severity: 'warning',
      title: `New Rate Case Filed: ${rateCase.caseNumber}`,
      message: `Your utility has filed a new rate case that may affect solar customer rates and net metering compensation.`,
      affectedCustomers,
      actionRequired: rateCase.publicCommentsEnabled,
      actionDescription: rateCase.publicCommentsEnabled ? 
        'Consider submitting public comments to protect solar customer interests' : 
        undefined,
      deadline: rateCase.proposedEffectiveDate,
      createdAt: new Date()
    };

    this.alertQueue.push(alert);
    await this.processAlert(alert);
  }

  private async generateRateCaseStatusAlert(
    rateCase: RateCaseTracking, 
    previousStatus: string
  ): Promise<void> {
    const affectedCustomers = this.getCustomersForUtility(rateCase.utilityId);

    let severity: ComplianceAlert['severity'] = 'info';
    let actionRequired = false;
    let actionDescription: string | undefined;

    if (rateCase.status === 'decided') {
      severity = 'warning';
      actionRequired = true;
      actionDescription = 'Review final decision and prepare for upcoming changes';
    } else if (rateCase.status === 'implemented') {
      severity = 'critical';
      actionRequired = true;
      actionDescription = 'New rates and terms are now in effect';
    }

    const alert: ComplianceAlert = {
      id: this.generateId(),
      type: 'rate_case',
      severity,
      title: `Rate Case Update: ${rateCase.caseNumber}`,
      message: `Status changed from ${previousStatus} to ${rateCase.status}`,
      affectedCustomers,
      actionRequired,
      actionDescription,
      deadline: rateCase.actualEffectiveDate,
      createdAt: new Date()
    };

    this.alertQueue.push(alert);
    await this.processAlert(alert);
  }

  private async processAlert(alert: ComplianceAlert): Promise<void> {
    // Process notifications for subscribed customers
    for (const customerId of alert.affectedCustomers) {
      const subscription = this.subscriptions.get(customerId);
      if (subscription) {
        await this.sendNotification(customerId, alert, subscription.notificationPreferences);
      }
    }
  }

  private async sendNotification(
    customerId: string, 
    alert: ComplianceAlert, 
    preferences: PolicySubscription['notificationPreferences']
  ): Promise<void> {
    // Implementation would integrate with actual notification services
    logger.info('Sending compliance alert to customer', {
      context: 'solar_system',
      operation: 'send_notification',
      customerId,
      alertSeverity: alert.severity,
      alertType: alert.type,
      alertTitle: alert.title
    });
    
    // Email notification
    if (preferences.email) {
      await this.sendEmailNotification(customerId, alert);
    }

    // SMS notification
    if (preferences.sms && (alert.severity === 'critical' || alert.severity === 'urgent')) {
      await this.sendSMSNotification(customerId, alert);
    }

    // In-app notification
    if (preferences.inApp) {
      await this.sendInAppNotification(customerId, alert);
    }
  }

  // Compliance Monitoring

  async checkGrandfatheringExpiry(): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));

    // Check all active NEM policies for upcoming expiration
    for (const policy of this.policies.values()) {
      if (policy.status === 'active' && 
          policy.expirationDate && 
          policy.expirationDate <= sixMonthsFromNow) {
        
        const daysUntilExpiry = Math.ceil(
          (policy.expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        const alert: ComplianceAlert = {
          id: this.generateId(),
          type: 'grandfathering_expiry',
          severity: daysUntilExpiry <= 90 ? 'critical' : 'warning',
          title: `Grandfathering Protection Expiring: ${policy.title}`,
          message: `Your grandfathering protection expires in ${daysUntilExpiry} days`,
          affectedCustomers: policy.affectedCustomers,
          actionRequired: true,
          actionDescription: 'Review new policy terms and consider system modifications',
          deadline: policy.expirationDate,
          relatedPolicy: policy.id,
          createdAt: now
        };

        alerts.push(alert);
        this.alertQueue.push(alert);
      }
    }

    return alerts;
  }

  // Helper Methods

  private initializeTracking(): void {
    // Initialize with known policies and requirements
    this.loadInitialPolicies();
    this.loadInitialInterconnectionRequirements();
    
    // Start periodic monitoring
    setInterval(() => {
      this.checkGrandfatheringExpiry();
      this.monitorRateCaseDeadlines();
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private loadInitialPolicies(): void {
    // Load known NEM policies from existing engine
    const nemPolicies = netMeteringEngine.NEM_POLICIES;
    
    Object.values(nemPolicies).forEach(policy => {
      const regulatoryPolicy: RegulatoryPolicy = {
        id: policy.id,
        type: 'utility',
        category: 'net_metering',
        title: policy.name,
        description: policy.description,
        jurisdiction: { state: policy.state },
        status: 'active',
        effectiveDate: policy.effectiveDate,
        expirationDate: policy.expirationDate,
        lastUpdated: new Date(),
        source: 'Internal NEM Database',
        summary: `${policy.name} provides ${policy.compensationMethod.type} compensation`,
        impactLevel: 'high',
        affectedCustomers: [],
        changeHistory: []
      };

      this.policies.set(policy.id, regulatoryPolicy);
    });
  }

  private loadInitialInterconnectionRequirements(): void {
    // Load from utility provider database
    const providers = utilityProviderDatabase.getAllProviders();
    
    providers.forEach(provider => {
      // Create basic interconnection requirements from provider data
      const requirements: InterconnectionRequirement = {
        id: this.generateId(),
        utilityId: provider.id,
        systemSizeCategories: {
          smallScale: { 
            max: 10, 
            requirements: ['Simple interconnection application', 'Basic equipment standards'] 
          },
          mediumScale: { 
            min: 10, 
            max: 100, 
            requirements: ['Detailed application', 'Engineering review', 'Site inspection'] 
          },
          largeScale: { 
            min: 100, 
            requirements: ['Full impact study', 'System protection requirements', 'Grid upgrades if needed'] 
          }
        },
        applicationProcess: {
          steps: [
            {
              id: 'application',
              name: 'Submit Application',
              description: 'Submit interconnection application with system details',
              requiredDocuments: ['System specifications', 'Site plan', 'Equipment cut sheets'],
              automated: false,
              maxDuration: 5
            }
          ],
          timeframes: { application: 15 },
          fees: { application: 100 }
        },
        technicalRequirements: {
          standards: ['IEEE 1547', 'UL 1741'],
          equipmentRequirements: ['Smart inverters', 'Production meter'],
          safetyRequirements: ['AC disconnect switch', 'Rapid shutdown'],
          meteringRequirements: ['Bidirectional meter', 'Net metering capable']
        },
        lastUpdated: new Date()
      };

      this.interconnectionRequirements.set(provider.id, requirements);
    });
  }

  private monitorRateCaseDeadlines(): void {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    for (const rateCase of this.rateCases.values()) {
      if (rateCase.proposedEffectiveDate && 
          rateCase.proposedEffectiveDate <= thirtyDaysFromNow &&
          rateCase.status !== 'implemented') {
        
        // Generate deadline alert
        const alert: ComplianceAlert = {
          id: this.generateId(),
          type: 'compliance_deadline',
          severity: 'warning',
          title: `Rate Case Implementation Approaching: ${rateCase.caseNumber}`,
          message: 'Rate changes will take effect soon',
          affectedCustomers: this.getCustomersForUtility(rateCase.utilityId),
          actionRequired: true,
          actionDescription: 'Prepare for rate changes and review impact on solar savings',
          deadline: rateCase.proposedEffectiveDate,
          createdAt: now
        };

        this.alertQueue.push(alert);
      }
    }
  }

  private getCustomersForUtility(utilityId: string): string[] {
    // This would query actual customer database
    // For now, return empty array
    return [];
  }

  private assessPolicyImpact(
    originalPolicy: RegulatoryPolicy, 
    updates: Partial<RegulatoryPolicy>
  ): string {
    const changes = Object.keys(updates);
    
    if (changes.includes('status') && updates.status === 'expired') {
      return 'Critical impact - policy has expired';
    }
    
    if (changes.includes('effectiveDate') || changes.includes('expirationDate')) {
      return 'High impact - timeline changes affect customer benefits';
    }
    
    return 'Moderate impact - policy details updated';
  }

  private isSignificantChange(
    originalPolicy: RegulatoryPolicy, 
    updates: Partial<RegulatoryPolicy>
  ): boolean {
    const significantFields = ['status', 'effectiveDate', 'expirationDate', 'impactLevel'];
    return Object.keys(updates).some(key => significantFields.includes(key));
  }

  private async sendEmailNotification(customerId: string, alert: ComplianceAlert): Promise<void> {
    // Implementation would integrate with email service
    logger.info('Email notification sent', {
      context: 'solar_system',
      operation: 'send_email',
      customerId,
      alertTitle: alert.title
    });
  }

  private async sendSMSNotification(customerId: string, alert: ComplianceAlert): Promise<void> {
    // Implementation would integrate with SMS service
    logger.info('SMS notification sent', {
      context: 'solar_system',
      operation: 'send_sms',
      customerId,
      alertTitle: alert.title
    });
  }

  private async sendInAppNotification(customerId: string, alert: ComplianceAlert): Promise<void> {
    // Implementation would store in database for in-app display
    logger.info('In-app notification created', {
      context: 'solar_system',
      operation: 'send_in_app',
      customerId,
      alertTitle: alert.title
    });
  }

  private generateId(): string {
    return `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API Methods

  getAllPolicies(): RegulatoryPolicy[] {
    return Array.from(this.policies.values());
  }

  getPoliciesByJurisdiction(state?: string, utility?: string): RegulatoryPolicy[] {
    return Array.from(this.policies.values()).filter(policy => {
      if (state && policy.jurisdiction.state !== state) return false;
      if (utility && policy.jurisdiction.utility !== utility) return false;
      return true;
    });
  }

  getActiveAlerts(customerId?: string): ComplianceAlert[] {
    let alerts = this.alertQueue.filter(alert => !alert.resolvedAt);
    
    if (customerId) {
      alerts = alerts.filter(alert => alert.affectedCustomers.includes(customerId));
    }

    return alerts.sort((a, b) => {
      const severityOrder = { urgent: 4, critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  resolveAlert(alertId: string): boolean {
    const alertIndex = this.alertQueue.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alertQueue[alertIndex].resolvedAt = new Date();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const regulatoryComplianceTracker = new RegulatoryComplianceTracker();