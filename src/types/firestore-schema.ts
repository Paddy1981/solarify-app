/**
 * Comprehensive TypeScript type definitions for Firestore schema
 * Generated from the solar marketplace schema specification
 */

import { Timestamp } from 'firebase/firestore';

// =====================================================
// SHARED TYPES
// =====================================================

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'design' | 'permit' | 'specification' | 'warranty' | 'other';
  url: string;
  description?: string;
  uploadedAt: Timestamp;
}

// =====================================================
// USER MANAGEMENT
// =====================================================

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  role: 'homeowner' | 'installer' | 'supplier' | 'admin';
  status: 'active' | 'suspended' | 'pending_verification';
  mfaEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  termsAcceptedAt: Timestamp;
  privacyAcceptedAt: Timestamp;
}

export interface PropertyInfo {
  id: string;
  isPrimary: boolean;
  type: 'single_family' | 'townhouse' | 'condo' | 'mobile_home' | 'commercial';
  address: Address;
  buildYear: number;
  squareFootage: number;
  stories: number;
  roofInfo: {
    type: 'asphalt_shingles' | 'tile' | 'metal' | 'flat_membrane' | 'wood_shake';
    age: number;
    area: number;
    pitch: number;
    azimuth: number;
    shading: 'none' | 'partial' | 'heavy';
    condition: 'excellent' | 'good' | 'fair' | 'poor';
  };
  electricalInfo: {
    panelAmps: number;
    panelLocation: string;
    meterType: string;
    utilityCompany: string;
    avgMonthlyUsage: number;
    avgMonthlyBill: number;
    peakUsageMonths: string[];
  };
}

export interface HomeownerProfile {
  userId: string;
  type: 'homeowner';
  firstName: string;
  lastName: string;
  address: Address;
  properties: PropertyInfo[];
  preferences: {
    budgetRange: {
      min: number;
      max: number;
    };
    timeline: '1-3 months' | '3-6 months' | '6-12 months' | 'flexible';
    systemType: 'grid_tied' | 'hybrid' | 'off_grid';
    batteryInterest: boolean;
    evChargerInterest: boolean;
    communicationPreference: 'email' | 'phone' | 'text' | 'app';
  };
  verification: {
    identityVerified: boolean;
    incomeVerified: boolean;
    propertyOwnership: boolean;
    creditScore?: number;
    verificationDocuments: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface License {
  type: string;
  number: string;
  issuingAuthority: string;
  issueDate: Timestamp;
  expirationDate: Timestamp;
  status: 'active' | 'expired' | 'suspended';
  verificationDocUrl: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  certificationNumber: string;
  issueDate: Timestamp;
  expirationDate?: Timestamp;
  documentUrl: string;
}

export interface ServiceArea {
  state: string;
  counties: string[];
  cities: string[];
  zipCodes: string[];
  maxDistance: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  systemSize: number;
  completionDate: Timestamp;
  images: string[];
  customerTestimonial?: string;
  energyProduction?: number;
}

export interface InstallerProfile {
  userId: string;
  type: 'installer';
  businessName: string;
  businessType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship';
  businessAddress: Address;
  website?: string;
  yearsInBusiness: number;
  employeeCount: number;
  licenses: License[];
  certifications: Certification[];
  serviceAreas: ServiceArea[];
  capabilities: {
    systemTypes: ('residential' | 'commercial' | 'industrial')[];
    systemSizes: {
      minKw: number;
      maxKw: number;
    };
    services: ('design' | 'installation' | 'maintenance' | 'monitoring' | 'financing')[];
    specialties: string[];
    equipmentBrands: string[];
  };
  metrics: {
    totalInstallations: number;
    totalCapacityInstalled: number;
    averageProjectDuration: number;
    customerSatisfactionScore: number;
    warrantyPeriod: number;
    responseTime: number;
  };
  financial: {
    insuranceInfo: {
      generalLiability: {
        carrier: string;
        policyNumber: string;
        coverageAmount: number;
        expirationDate: Timestamp;
      };
      workersComp: {
        carrier: string;
        policyNumber: string;
        expirationDate: Timestamp;
      };
      bonded: boolean;
      bondAmount?: number;
    };
    pricing: {
      laborRatePerWatt: number;
      markupPercentage: number;
      minProjectSize: number;
      preferredPaymentTerms: string;
    };
  };
  portfolio: PortfolioItem[];
  verification: {
    businessVerified: boolean;
    licenseVerified: boolean;
    insuranceVerified: boolean;
    backgroundCheckCompleted: boolean;
    verificationDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Brand {
  name: string;
  type: 'exclusive' | 'authorized' | 'preferred';
  contractStartDate: Timestamp;
  contractEndDate?: Timestamp;
}

export interface WarehouseLocation {
  address: Address;
  capacity: number;
  servicesArea: string[];
}

export interface SupplierProfile {
  userId: string;
  type: 'supplier';
  businessName: string;
  businessType: 'manufacturer' | 'distributor' | 'retailer';
  businessAddress: Address;
  website: string;
  yearsInBusiness: number;
  productCategories: ('solar_panels' | 'inverters' | 'batteries' | 'mounting' | 'monitoring' | 'accessories')[];
  brands: Brand[];
  shipping: {
    warehouseLocations: WarehouseLocation[];
    shippingMethods: ('ground' | 'air' | 'freight' | 'white_glove')[];
    freeShippingThreshold: number;
    averageProcessingTime: number;
    returnPolicy: {
      returnWindow: number;
      restockingFee: number;
      conditions: string[];
    };
  };
  financial: {
    paymentTerms: ('net_30' | 'net_60' | 'cod' | 'credit_card' | 'financing')[];
    creditLimit: number;
    discountTiers: Array<{
      minOrderValue: number;
      discountPercentage: number;
    }>;
    volumeDiscounts: Array<{
      minQuantity: number;
      discountPercentage: number;
    }>;
  };
  certifications: Certification[];
  verification: {
    businessVerified: boolean;
    manufacturerAuthorized: boolean;
    complianceVerified: boolean;
    verificationDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Profile = HomeownerProfile | InstallerProfile | SupplierProfile;

// =====================================================
// RFQ & QUOTES
// =====================================================

export interface RFQ {
  id: string;
  homeownerId: string;
  homeownerName: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    isFlexible: boolean;
  };
  timeline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  propertyId: string;
  propertyAddress: Address;
  propertyDetails: {
    type: string;
    buildYear: number;
    squareFootage: number;
    roofDetails: {
      type: string;
      age: number;
      area: number;
      pitch: number;
      azimuth: number;
      shading: string;
      condition: string;
      obstacles: string[];
    };
    electricalDetails: {
      panelAmps: number;
      currentUsage: number;
      peakUsage: number;
      utilityCompany: string;
      currentRate: number;
      netMeteringAvailable: boolean;
    };
  };
  systemRequirements: {
    desiredCapacity: number;
    panelPreference: string;
    inverterPreference: string;
    batteryRequired: boolean;
    batteryCapacity?: number;
    evChargerRequired: boolean;
    monitoring: boolean;
    aestheticPreferences: string[];
  };
  attachments: Attachment[];
  status: 'draft' | 'active' | 'paused' | 'closed' | 'awarded';
  visibility: 'public' | 'invited_only';
  selectedInstallerIds: string[];
  invitedInstallerIds: string[];
  quoteCount: number;
  viewCount: number;
  interestedInstallerIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expirationDate: Timestamp;
  awardedAt?: Timestamp;
  awardedInstallerId?: string;
  solarData: {
    annualSunHours: number;
    solarIrradiance: number;
    shadingFactor: number;
    roofSuitabilityScore: number;
    estimatedProduction: number;
    estimatedSavings: number;
    paybackPeriod: number;
    roi: number;
  };
  permitsRequired: string[];
  utilityInterconnection: boolean;
  hoa: {
    required: boolean;
    approved?: boolean;
    restrictions?: string[];
  };
}

export interface SystemPanel {
  brand: string;
  model: string;
  wattage: number;
  quantity: number;
  warrantyYears: number;
  efficiency: number;
  unitPrice: number;
  subtotal: number;
}

export interface SystemInverter {
  brand: string;
  model: string;
  type: 'string' | 'power_optimizer' | 'microinverter';
  capacity: number;
  quantity: number;
  warrantyYears: number;
  efficiency: number;
  unitPrice: number;
  subtotal: number;
}

export interface SystemBattery {
  brand: string;
  model: string;
  capacity: number;
  quantity: number;
  warrantyYears: number;
  cycleLife: number;
  unitPrice: number;
  subtotal: number;
}

export interface MountingSystem {
  type: string;
  brand: string;
  model: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AdditionalEquipment {
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface FinancingOption {
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  provider?: string;
  downPayment: number;
  monthlyPayment?: number;
  termYears?: number;
  interestRate?: number;
  totalCost: number;
}

export interface Quote {
  id: string;
  rfqId: string;
  installerId: string;
  installerName: string;
  homeownerId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  version: number;
  systemDesign: {
    totalCapacity: number;
    panelCount: number;
    panels: SystemPanel[];
    inverters: SystemInverter[];
    batteries?: SystemBattery[];
    mounting: MountingSystem;
    additionalEquipment: AdditionalEquipment[];
  };
  pricing: {
    equipmentCosts: {
      panels: number;
      inverters: number;
      batteries: number;
      mounting: number;
      monitoring: number;
      additional: number;
      subtotal: number;
    };
    laborCosts: {
      installation: number;
      electrical: number;
      permits: number;
      inspection: number;
      subtotal: number;
    };
    additionalCosts: {
      permits: number;
      interconnection: number;
      shipping: number;
      overhead: number;
      profit: number;
      subtotal: number;
    };
    totalCost: number;
    pricePerWatt: number;
    financingOptions: FinancingOption[];
  };
  performance: {
    firstYearProduction: number;
    year25Production: number;
    lifetimeProduction: number;
    degradationRate: number;
    savings: {
      firstYearSavings: number;
      lifetimeSavings: number;
      paybackPeriod: number;
      roi: number;
      npv: number;
    };
    environmental: {
      co2OffsetFirstYear: number;
      co2OffsetLifetime: number;
      treesEquivalent: number;
    };
  };
  installation: {
    estimatedDuration: number;
    proposedStartDate: Date;
    proposedCompletionDate: Date;
    installationProcess: string[];
    crewSize: number;
    projectManager: string;
    requirements: {
      permitsHandled: boolean;
      utilityCoordination: boolean;
      hoaApproval: boolean;
      structuralAssessment: boolean;
      electricalUpgrade: boolean;
    };
  };
  warranties: {
    workmanship: {
      duration: number;
      coverage: string[];
    };
    equipment: Array<{
      component: string;
      duration: number;
      type: 'performance' | 'product' | 'extended';
      coverage: string;
    }>;
    monitoring: {
      included: boolean;
      duration: number;
      type: string;
    };
  };
  attachments: Attachment[];
  validUntil: Timestamp;
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp;
  acceptedAt?: Timestamp;
  notes: string;
  internalNotes: string;
  revisionHistory: Array<{
    version: number;
    changes: string;
    modifiedAt: Timestamp;
    modifiedBy: string;
  }>;
}

// =====================================================
// PROJECTS & INSTALLATIONS
// =====================================================

export interface PaymentScheduleItem {
  milestone: string;
  percentage: number;
  amount: number;
  dueDate?: Timestamp;
  paidDate?: Timestamp;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Permit {
  type: string;
  jurisdiction: string;
  permitNumber?: string;
  applicationDate?: Timestamp;
  approvalDate?: Timestamp;
  expirationDate?: Timestamp;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  documents: string[];
}

export interface InstallationPhase {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  startDate?: Timestamp;
  completionDate?: Timestamp;
  notes?: string;
  photos?: string[];
}

export interface CrewMember {
  name: string;
  role: string;
  certifications: string[];
}

export interface DailyLog {
  date: Timestamp;
  weather: string;
  workPerformed: string;
  hoursWorked: number;
  crew: string[];
  issues?: string[];
  photos?: string[];
}

export interface Inspection {
  type: 'pre_installation' | 'in_progress' | 'final' | 'utility' | 'ahj';
  inspector: string;
  scheduledDate: Timestamp;
  completedDate?: Timestamp;
  status: 'scheduled' | 'passed' | 'failed' | 'conditional';
  notes?: string;
  corrections?: string[];
  photos?: string[];
}

export interface ChangeOrder {
  description: string;
  amount: number;
  approved: boolean;
  date: Timestamp;
}

export interface Communication {
  date: Timestamp;
  type: 'email' | 'phone' | 'text' | 'meeting' | 'site_visit';
  participants: string[];
  subject: string;
  summary: string;
}

export interface Project {
  id: string;
  rfqId: string;
  quoteId: string;
  homeownerId: string;
  installerId: string;
  contractNumber: string;
  status: 'planning' | 'permits_pending' | 'permits_approved' | 'installation_scheduled' | 
          'in_progress' | 'inspection_pending' | 'completed' | 'cancelled' | 'on_hold';
  contract: {
    signedDate: Timestamp;
    totalValue: number;
    paymentSchedule: PaymentScheduleItem[];
    terms: string;
    warranties: object;
  };
  timeline: {
    contractSigned: Timestamp;
    permitSubmission?: Timestamp;
    permitApproval?: Timestamp;
    installationStart?: Timestamp;
    installationComplete?: Timestamp;
    inspectionScheduled?: Timestamp;
    inspectionPassed?: Timestamp;
    utilityInterconnection?: Timestamp;
    projectComplete?: Timestamp;
    estimatedDuration: number;
    actualDuration?: number;
  };
  permits: Permit[];
  installation: {
    phases: InstallationPhase[];
    crew: CrewMember[];
    equipment: {
      delivered: boolean;
      deliveryDate?: Timestamp;
      inspected: boolean;
      inspectionDate?: Timestamp;
      defects?: string[];
    };
    dailyLogs: DailyLog[];
  };
  finalSystem: {
    totalCapacity: number;
    panelCount: number;
    panels: Array<{
      serialNumbers: string[];
      location: string;
    }>;
    inverters: Array<{
      serialNumbers: string[];
      location: string;
    }>;
    batteries?: Array<{
      serialNumbers: string[];
      location: string;
    }>;
    electricalDetails: {
      acDisconnect: string;
      dcDisconnect: string;
      productionMeter: string;
      monitoringSystem: string;
    };
  };
  inspections: Inspection[];
  financials: {
    totalContract: number;
    totalPaid: number;
    totalDue: number;
    changeOrders: ChangeOrder[];
  };
  communications: Communication[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// =====================================================
// PRODUCTS & CATALOG
// =====================================================

export interface BulkPricing {
  minQuantity: number;
  price: number;
  discountPercentage: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  type: 'primary' | 'gallery' | 'spec_sheet' | 'installation';
  order: number;
}

export interface ProductDocument {
  name: string;
  type: 'spec_sheet' | 'manual' | 'warranty' | 'installation_guide' | 'certification';
  url: string;
  language: string;
  version: string;
}

export interface ProductReviews {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  brand: string;
  model: string;
  category: 'solar_panels' | 'inverters' | 'batteries' | 'mounting' | 'monitoring' | 'accessories';
  subcategory: string;
  description: string;
  longDescription: string;
  pricing: {
    basePrice: number;
    currency: 'USD';
    priceUnit: 'each' | 'watt' | 'kwh' | 'linear_foot';
    bulkPricing: BulkPricing[];
    msrp?: number;
    costBasis: number;
  };
  inventory: {
    inStock: boolean;
    quantity: number;
    lowStockThreshold: number;
    leadTime: number;
    backorderAllowed: boolean;
    location: string;
  };
  specifications: {
    // Solar Panel Specs
    power?: number;
    efficiency?: number;
    voltage?: {
      vmp: number;
      voc: number;
      imp: number;
      isc: number;
    };
    temperature?: {
      coefficientPower: number;
      coefficientVoltage: number;
      operatingRange: {
        min: number;
        max: number;
      };
    };
    // Physical Dimensions
    dimensions: {
      length: number;
      width: number;
      thickness: number;
      weight: number;
    };
    // Inverter Specs
    inverterType?: 'string' | 'central' | 'microinverter' | 'power_optimizer';
    acPower?: number;
    dcPower?: number;
    channels?: number;
    // Battery Specs
    batteryType?: 'lithium_ion' | 'lead_acid' | 'saltwater';
    capacity?: number;
    cycleLife?: number;
    depthOfDischarge?: number;
    roundTripEfficiency?: number;
    // General
    warranty: {
      product: number;
      performance?: number;
      performanceGuarantee?: number;
    };
    certifications: string[];
    countryOfOrigin: string;
  };
  images: ProductImage[];
  documents: ProductDocument[];
  keywords: string[];
  tags: string[];
  searchTerms: string[];
  reviews: ProductReviews;
  compatibility: {
    panelTypes?: string[];
    inverterTypes?: string[];
    mountingTypes?: string[];
    roofTypes?: string[];
  };
  status: 'active' | 'discontinued' | 'coming_soon' | 'out_of_stock';
  featured: boolean;
  bestSeller: boolean;
  newProduct: boolean;
  compliance: {
    ul?: string;
    iec?: string;
    fcc?: string;
    california65?: boolean;
    rohs?: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPriceUpdate: Timestamp;
}

// =====================================================
// SOLAR SYSTEMS & PERFORMANCE
// =====================================================

export interface SystemPanel {
  brand: string;
  model: string;
  wattage: number;
  quantity: number;
  serialNumbers: string[];
  arrayId: string;
  stringId?: string;
}

export interface SystemInverterConfig {
  brand: string;
  model: string;
  type: 'string' | 'central' | 'microinverter' | 'power_optimizer';
  capacity: number;
  quantity: number;
  serialNumbers: string[];
  location: string;
}

export interface SystemBatteryConfig {
  brand: string;
  model: string;
  capacity: number;
  quantity: number;
  serialNumbers: string[];
  configuration: 'series' | 'parallel' | 'series_parallel';
}

export interface MonitoringSystem {
  system: string;
  serialNumber: string;
  communicationType: 'ethernet' | 'wifi' | 'cellular' | 'zigbee';
  monitoringLevel: 'system' | 'string' | 'panel';
}

export interface SystemWarranty {
  component: string;
  type: 'workmanship' | 'product' | 'performance';
  startDate: Timestamp;
  duration: number;
  coverage: string;
  provider: string;
  warrantyNumber?: string;
}

export interface MaintenanceScheduleItem {
  type: 'inspection' | 'cleaning' | 'electrical' | 'mechanical';
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  lastPerformed?: Timestamp;
  nextDue?: Timestamp;
  provider: string;
}

export interface MaintenanceRecord {
  date: Timestamp;
  type: string;
  description: string;
  performedBy: string;
  findings: string[];
  recommendations: string[];
  cost?: number;
  photos?: string[];
}

export interface SolarSystem {
  id: string;
  projectId: string;
  homeownerId: string;
  installerId: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  installationDate: Timestamp;
  commissioningDate: Timestamp;
  lastMaintenanceDate?: Timestamp;
  configuration: {
    totalCapacity: number;
    totalInverterCapacity: number;
    systemType: 'grid_tied' | 'hybrid' | 'off_grid';
    orientation: number;
    tilt: number;
    panels: SystemPanel[];
    inverters: SystemInverterConfig[];
    batteries?: SystemBatteryConfig[];
    monitoring: MonitoringSystem;
  };
  specifications: {
    designProduction: number;
    expectedDegradation: number;
    performanceGuarantee: number;
    calculatedMetrics: {
      specificYield: number;
      performanceRatio: number;
      capacityFactor: number;
    };
  };
  location: {
    address: Address;
    coordinates: {
      latitude: number;
      longitude: number;
      elevation: number;
    };
    timezone: string;
    solarResource: {
      annualGHI: number;
      annualDNI: number;
      annualDHI: number;
      peakSunHours: number;
      shadingFactor: number;
    };
  };
  warranties: SystemWarranty[];
  maintenance: {
    schedule: MaintenanceScheduleItem[];
    history: MaintenanceRecord[];
  };
  targets: {
    monthly: Array<{
      month: number;
      expectedProduction: number;
    }>;
    annual: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =====================================================
// ENERGY PRODUCTION & MONITORING
// =====================================================

export interface SystemFault {
  code: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface StringData {
  stringId: string;
  dcPower: number;
  dcVoltage: number;
  dcCurrent: number;
  temperature?: number;
}

export interface PanelData {
  panelId: string;
  power: number;
  voltage: number;
  current: number;
  temperature?: number;
  faults?: string[];
}

export interface ConsumptionData {
  homeLoad: number;
  batteryCharge: number;
  batteryDischarge: number;
  gridImport: number;
  gridExport: number;
  batterySOC?: number;
}

export interface EnergyProductionRecord {
  id: string;
  systemId: string;
  timestamp: Timestamp;
  interval: '15min' | '1hour' | '1day' | '1month';
  production: {
    dcPower: number;
    acPower: number;
    energy: number;
    voltage: number;
    current: number;
    frequency: number;
  };
  environmental: {
    irradiance?: number;
    ambientTemp?: number;
    moduleTemp?: number;
    windSpeed?: number;
    humidity?: number;
  };
  performance: {
    efficiency: number;
    performanceRatio: number;
    specificYield: number;
    capacityFactor: number;
  };
  status: {
    operationalStatus: 'normal' | 'reduced' | 'offline' | 'maintenance';
    faults: SystemFault[];
    alerts: string[];
  };
  stringData?: StringData[];
  panelData?: PanelData[];
  consumption?: ConsumptionData;
  dataQuality: {
    source: 'inverter' | 'monitoring_system' | 'utility_meter' | 'estimated';
    confidence: number;
    gaps: boolean;
    interpolated: boolean;
  };
  createdAt: Timestamp;
}

// =====================================================
// WEATHER & UTILITY DATA
// =====================================================

export interface WeatherRecord {
  id: string;
  locationId: string;
  timestamp: Timestamp;
  interval: '15min' | '1hour' | '1day';
  irradiance: {
    ghi: number;
    dni: number;
    dhi: number;
    clearSkyGHI: number;
    clearSkyIndex: number;
  };
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    snowDepth?: number;
    visibility: number;
  };
  clouds: {
    totalCover: number;
    lowCover: number;
    midCover: number;
    highCover: number;
  };
  solar: {
    elevation: number;
    azimuth: number;
    sunrise: Timestamp;
    sunset: Timestamp;
    solarNoon: Timestamp;
    dayLength: number;
  };
  source: {
    provider: 'NREL' | 'NOAA' | 'local_station' | 'satellite';
    stationId?: string;
    quality: 'measured' | 'modeled' | 'estimated';
  };
  createdAt: Timestamp;
}

export interface TimeOfUseRate {
  period: 'peak' | 'off_peak' | 'super_off_peak';
  months: number[];
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface EnergyCharge {
  tier?: number;
  timeOfUse?: TimeOfUseRate;
  price: number;
  threshold?: number;
}

export interface DemandCharge {
  type: 'facility' | 'time_of_use';
  price: number;
  timeOfUse?: TimeOfUseRate;
}

export interface UtilityRate {
  id: string;
  utilityCompany: string;
  rateName: string;
  rateCode: string;
  serviceTerritory: {
    states: string[];
    counties: string[];
    cities: string[];
    zipCodes: string[];
  };
  rateStructure: {
    type: 'tiered' | 'time_of_use' | 'demand' | 'net_metering';
    customerClass: 'residential' | 'commercial' | 'industrial';
    fixedCharges: {
      connectionFee: number;
      facilityFee?: number;
    };
    energyCharges: EnergyCharge[];
    demandCharges?: DemandCharge[];
  };
  netMetering: {
    available: boolean;
    type?: 'net_energy_metering' | 'net_billing' | 'buy_all_sell_all';
    creditRate?: number;
    rolloverPolicy?: 'monthly' | 'annual' | 'expires';
    systemSizeLimit?: number;
    aggregateCap?: number;
  };
  schedule: {
    effectiveDate: Timestamp;
    expirationDate?: Timestamp;
    seasonalSchedule?: Array<{
      season: 'summer' | 'winter';
      startMonth: number;
      endMonth: number;
      rates: object;
    }>;
  };
  additionalFees: Array<{
    name: string;
    type: 'fixed' | 'variable' | 'percentage';
    amount: number;
    applicability: string;
  }>;
  regulatory: {
    publicUtilitiesCommission: string;
    tarifNumber: string;
    lastApproved: Timestamp;
    nextReviewDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =====================================================
// NOTIFICATIONS & ANALYTICS
// =====================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'rfq_update' | 'quote_received' | 'project_status' | 'system_alert' | 'payment_due' | 'maintenance_due';
  title: string;
  message: string;
  data?: object;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

export interface AnalyticsRecord {
  id: string;
  userId?: string;
  sessionId: string;
  event: string;
  category: 'user' | 'rfq' | 'quote' | 'project' | 'system' | 'performance';
  properties: Record<string, any>;
  timestamp: Timestamp;
  source: 'web' | 'mobile' | 'api';
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country: string;
    state: string;
    city: string;
  };
}

// =====================================================
// TYPE GUARDS & UTILITIES
// =====================================================

export function isHomeownerProfile(profile: Profile): profile is HomeownerProfile {
  return profile.type === 'homeowner';
}

export function isInstallerProfile(profile: Profile): profile is InstallerProfile {
  return profile.type === 'installer';
}

export function isSupplierProfile(profile: Profile): profile is SupplierProfile {
  return profile.type === 'supplier';
}

// =====================================================
// COLLECTION NAMES
// =====================================================

export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  RFQS: 'rfqs',
  QUOTES: 'quotes',
  PROJECTS: 'projects',
  PRODUCTS: 'products',
  SOLAR_SYSTEMS: 'solar_systems',
  ENERGY_PRODUCTION: 'energy_production',
  WEATHER_DATA: 'weather_data',
  UTILITY_RATES: 'utility_rates',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];