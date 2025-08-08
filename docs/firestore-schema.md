# Comprehensive Firestore Schema for Solar Marketplace

## Schema Overview

This document defines the complete Firestore database schema for the Solarify solar marketplace platform, designed to handle complex solar energy workflows, calculations, and marketplace operations.

## Collection Structure

### Core Collections

- **users** - User accounts and authentication
- **profiles** - Extended user profile data by type
- **rfqs** - Request for Quotes from homeowners
- **quotes** - Installer responses to RFQs
- **projects** - Accepted quotes that become active projects
- **products** - Solar equipment catalog
- **installations** - Completed solar installations
- **solar_systems** - Technical system specifications
- **energy_production** - Solar system performance data
- **weather_data** - Weather and irradiance data
- **utility_rates** - Electricity rate structures
- **notifications** - User notifications and messages
- **analytics** - Usage and performance analytics

---

## Detailed Schema Definitions

### 1. Users Collection (`users/{userId}`)

Base authentication and role information.

```typescript
interface User {
  id: string;                    // Firebase Auth UID
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
```

### 2. Profiles Collection (`profiles/{userId}`)

Extended profile data specific to user roles.

#### Homeowner Profile
```typescript
interface HomeownerProfile {
  userId: string;
  type: 'homeowner';
  
  // Personal Information
  firstName: string;
  lastName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Property Information
  properties: Array<{
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
      area: number; // sq ft
      pitch: number; // degrees
      azimuth: number; // degrees from south
      shading: 'none' | 'partial' | 'heavy';
      condition: 'excellent' | 'good' | 'fair' | 'poor';
    };
    electricalInfo: {
      panelAmps: number;
      panelLocation: string;
      meterType: string;
      utilityCompany: string;
      avgMonthlyUsage: number; // kWh
      avgMonthlyBill: number; // USD
      peakUsageMonths: string[];
    };
  }>;
  
  // Preferences
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
  
  // Verification
  verification: {
    identityVerified: boolean;
    incomeVerified: boolean;
    propertyOwnership: boolean;
    creditScore?: number;
    verificationDocuments: string[]; // Storage URLs
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Installer Profile
```typescript
interface InstallerProfile {
  userId: string;
  type: 'installer';
  
  // Business Information
  businessName: string;
  businessType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship';
  businessAddress: Address;
  website?: string;
  yearsInBusiness: number;
  employeeCount: number;
  
  // Licensing & Certifications
  licenses: Array<{
    type: string;
    number: string;
    issuingAuthority: string;
    issueDate: Timestamp;
    expirationDate: Timestamp;
    status: 'active' | 'expired' | 'suspended';
    verificationDocUrl: string;
  }>;
  
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    certificationNumber: string;
    issueDate: Timestamp;
    expirationDate?: Timestamp;
    documentUrl: string;
  }>;
  
  // Service Areas
  serviceAreas: Array<{
    state: string;
    counties: string[];
    cities: string[];
    zipCodes: string[];
    maxDistance: number; // miles from business address
  }>;
  
  // Capabilities
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
  
  // Performance Metrics
  metrics: {
    totalInstallations: number;
    totalCapacityInstalled: number; // kW
    averageProjectDuration: number; // days
    customerSatisfactionScore: number; // 1-5
    warrantyPeriod: number; // years
    responseTime: number; // hours
  };
  
  // Financial Information
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
  
  // Reviews and Portfolio
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    systemSize: number;
    completionDate: Timestamp;
    images: string[];
    customerTestimonial?: string;
    energyProduction?: number; // first year kWh
  }>;
  
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
```

#### Supplier Profile
```typescript
interface SupplierProfile {
  userId: string;
  type: 'supplier';
  
  // Business Information
  businessName: string;
  businessType: 'manufacturer' | 'distributor' | 'retailer';
  businessAddress: Address;
  website: string;
  yearsInBusiness: number;
  
  // Product Categories
  productCategories: ('solar_panels' | 'inverters' | 'batteries' | 'mounting' | 'monitoring' | 'accessories')[];
  
  // Brands Carried
  brands: Array<{
    name: string;
    type: 'exclusive' | 'authorized' | 'preferred';
    contractStartDate: Timestamp;
    contractEndDate?: Timestamp;
  }>;
  
  // Shipping & Logistics
  shipping: {
    warehouseLocations: Array<{
      address: Address;
      capacity: number;
      servicesArea: string[];
    }>;
    shippingMethods: ('ground' | 'air' | 'freight' | 'white_glove')[];
    freeShippingThreshold: number;
    averageProcessingTime: number; // days
    returnPolicy: {
      returnWindow: number; // days
      restockingFee: number; // percentage
      conditions: string[];
    };
  };
  
  // Financial Terms
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
  
  // Quality & Compliance
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    certificationNumber: string;
    issueDate: Timestamp;
    expirationDate?: Timestamp;
  }>;
  
  verification: {
    businessVerified: boolean;
    manufacturerAuthorized: boolean;
    complianceVerified: boolean;
    verificationDate?: Timestamp;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. RFQs Collection (`rfqs/{rfqId}`)

Request for Quotes from homeowners.

```typescript
interface RFQ {
  id: string;
  homeownerId: string;
  homeownerName: string;
  
  // Basic Information
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    isFlexible: boolean;
  };
  timeline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Property Details
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
      currentUsage: number; // kWh/month
      peakUsage: number;
      utilityCompany: string;
      currentRate: number; // $/kWh
      netMeteringAvailable: boolean;
    };
  };
  
  // System Requirements
  systemRequirements: {
    desiredCapacity: number; // kW
    panelPreference: string;
    inverterPreference: string;
    batteryRequired: boolean;
    batteryCapacity?: number; // kWh
    evChargerRequired: boolean;
    monitoring: boolean;
    aestheticPreferences: string[];
  };
  
  // Attachments & Documentation
  attachments: Array<{
    id: string;
    name: string;
    type: 'image' | 'document' | 'video';
    url: string;
    description?: string;
    uploadedAt: Timestamp;
  }>;
  
  // RFQ Management
  status: 'draft' | 'active' | 'paused' | 'closed' | 'awarded';
  visibility: 'public' | 'invited_only';
  selectedInstallerIds: string[];
  invitedInstallerIds: string[];
  
  // Responses
  quoteCount: number;
  viewCount: number;
  interestedInstallerIds: string[];
  
  // Dates
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expirationDate: Timestamp;
  awardedAt?: Timestamp;
  awardedInstallerId?: string;
  
  // Solar-Specific Calculations
  solarData: {
    annualSunHours: number;
    solarIrradiance: number; // kWh/m²/day
    shadingFactor: number; // 0-1
    roofSuitabilityScore: number; // 1-10
    estimatedProduction: number; // kWh/year
    estimatedSavings: number; // $/year
    paybackPeriod: number; // years
    roi: number; // percentage
  };
  
  // Compliance & Legal
  permitsRequired: string[];
  utilityInterconnection: boolean;
  hoa: {
    required: boolean;
    approved?: boolean;
    restrictions?: string[];
  };
}
```

### 4. Quotes Collection (`quotes/{quoteId}`)

Installer responses to RFQs.

```typescript
interface Quote {
  id: string;
  rfqId: string;
  installerId: string;
  installerName: string;
  homeownerId: string;
  
  // Quote Status
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  version: number;
  
  // System Design
  systemDesign: {
    totalCapacity: number; // kW
    panelCount: number;
    panels: Array<{
      brand: string;
      model: string;
      wattage: number;
      quantity: number;
      warrantyYears: number;
      efficiency: number;
      unitPrice: number;
      subtotal: number;
    }>;
    
    inverters: Array<{
      brand: string;
      model: string;
      type: 'string' | 'power_optimizer' | 'microinverter';
      capacity: number; // kW
      quantity: number;
      warrantyYears: number;
      efficiency: number;
      unitPrice: number;
      subtotal: number;
    }>;
    
    batteries?: Array<{
      brand: string;
      model: string;
      capacity: number; // kWh
      quantity: number;
      warrantyYears: number;
      cycleLife: number;
      unitPrice: number;
      subtotal: number;
    }>;
    
    mounting: {
      type: string;
      brand: string;
      model: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    };
    
    additionalEquipment: Array<{
      category: string;
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  };
  
  // Pricing Breakdown
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
    
    // Financing Options
    financingOptions: Array<{
      type: 'cash' | 'loan' | 'lease' | 'ppa';
      provider?: string;
      downPayment: number;
      monthlyPayment?: number;
      termYears?: number;
      interestRate?: number;
      totalCost: number;
    }>;
  };
  
  // Performance Projections
  performance: {
    firstYearProduction: number; // kWh
    year25Production: number; // kWh
    lifetimeProduction: number; // kWh
    degradationRate: number; // %/year
    
    savings: {
      firstYearSavings: number; // $
      lifetimeSavings: number; // $
      paybackPeriod: number; // years
      roi: number; // %
      npv: number; // Net present value
    };
    
    environmental: {
      co2OffsetFirstYear: number; // tons
      co2OffsetLifetime: number; // tons
      treesEquivalent: number;
    };
  };
  
  // Installation Details
  installation: {
    estimatedDuration: number; // days
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
  
  // Warranties & Support
  warranties: {
    workmanship: {
      duration: number; // years
      coverage: string[];
    };
    equipment: Array<{
      component: string;
      duration: number; // years
      type: 'performance' | 'product' | 'extended';
      coverage: string;
    }>;
    monitoring: {
      included: boolean;
      duration: number; // years
      type: string;
    };
  };
  
  // Documentation
  attachments: Array<{
    id: string;
    name: string;
    type: 'design' | 'permit' | 'specification' | 'warranty' | 'other';
    url: string;
    description?: string;
    uploadedAt: Timestamp;
  }>;
  
  // Quote Management
  validUntil: Timestamp;
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp;
  acceptedAt?: Timestamp;
  
  // Communication
  notes: string;
  internalNotes: string;
  revisionHistory: Array<{
    version: number;
    changes: string;
    modifiedAt: Timestamp;
    modifiedBy: string;
  }>;
}
```

### 5. Projects Collection (`projects/{projectId}`)

Active solar installation projects.

```typescript
interface Project {
  id: string;
  rfqId: string;
  quoteId: string;
  homeownerId: string;
  installerId: string;
  contractNumber: string;
  
  // Project Status
  status: 'planning' | 'permits_pending' | 'permits_approved' | 'installation_scheduled' | 
          'in_progress' | 'inspection_pending' | 'completed' | 'cancelled' | 'on_hold';
  
  // Contract Details
  contract: {
    signedDate: Timestamp;
    totalValue: number;
    paymentSchedule: Array<{
      milestone: string;
      percentage: number;
      amount: number;
      dueDate?: Timestamp;
      paidDate?: Timestamp;
      status: 'pending' | 'paid' | 'overdue';
    }>;
    terms: string;
    warranties: object; // From quote
  };
  
  // Timeline
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
    
    estimatedDuration: number; // days
    actualDuration?: number; // days
  };
  
  // Permit Information
  permits: Array<{
    type: string;
    jurisdiction: string;
    permitNumber?: string;
    applicationDate?: Timestamp;
    approvalDate?: Timestamp;
    expirationDate?: Timestamp;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    documents: string[];
  }>;
  
  // Installation Progress
  installation: {
    phases: Array<{
      name: string;
      status: 'pending' | 'in_progress' | 'completed' | 'delayed';
      startDate?: Timestamp;
      completionDate?: Timestamp;
      notes?: string;
      photos?: string[];
    }>;
    
    crew: Array<{
      name: string;
      role: string;
      certifications: string[];
    }>;
    
    equipment: {
      delivered: boolean;
      deliveryDate?: Timestamp;
      inspected: boolean;
      inspectionDate?: Timestamp;
      defects?: string[];
    };
    
    dailyLogs: Array<{
      date: Timestamp;
      weather: string;
      workPerformed: string;
      hoursWorked: number;
      crew: string[];
      issues?: string[];
      photos?: string[];
    }>;
  };
  
  // System Information (Final as-built)
  finalSystem: {
    totalCapacity: number; // kW
    panelCount: number;
    panels: Array<{
      serialNumbers: string[];
      location: string; // roof section
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
  
  // Quality Assurance
  inspections: Array<{
    type: 'pre_installation' | 'in_progress' | 'final' | 'utility' | 'ahj';
    inspector: string;
    scheduledDate: Timestamp;
    completedDate?: Timestamp;
    status: 'scheduled' | 'passed' | 'failed' | 'conditional';
    notes?: string;
    corrections?: string[];
    photos?: string[];
  }>;
  
  // Financial Tracking
  financials: {
    totalContract: number;
    totalPaid: number;
    totalDue: number;
    changeOrders: Array<{
      description: string;
      amount: number;
      approved: boolean;
      date: Timestamp;
    }>;
  };
  
  // Communication Log
  communications: Array<{
    date: Timestamp;
    type: 'email' | 'phone' | 'text' | 'meeting' | 'site_visit';
    participants: string[];
    subject: string;
    summary: string;
  }>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### 6. Products Collection (`products/{productId}`)

Solar equipment catalog.

```typescript
interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  
  // Basic Information
  name: string;
  brand: string;
  model: string;
  category: 'solar_panels' | 'inverters' | 'batteries' | 'mounting' | 'monitoring' | 'accessories';
  subcategory: string;
  description: string;
  longDescription: string;
  
  // Pricing
  pricing: {
    basePrice: number;
    currency: 'USD';
    priceUnit: 'each' | 'watt' | 'kwh' | 'linear_foot';
    bulkPricing: Array<{
      minQuantity: number;
      price: number;
      discountPercentage: number;
    }>;
    msrp?: number;
    costBasis: number; // supplier cost
  };
  
  // Inventory
  inventory: {
    inStock: boolean;
    quantity: number;
    lowStockThreshold: number;
    leadTime: number; // days
    backorderAllowed: boolean;
    location: string;
  };
  
  // Technical Specifications
  specifications: {
    // Solar Panel Specs
    power?: number; // watts
    efficiency?: number; // percentage
    voltage?: {
      vmp: number;
      voc: number;
      imp: number;
      isc: number;
    };
    temperature?: {
      coefficientPower: number; // %/°C
      coefficientVoltage: number; // %/°C
      operatingRange: {
        min: number; // °C
        max: number; // °C
      };
    };
    
    // Physical Dimensions
    dimensions: {
      length: number; // mm
      width: number; // mm
      thickness: number; // mm
      weight: number; // kg
    };
    
    // Inverter Specs
    inverterType?: 'string' | 'central' | 'microinverter' | 'power_optimizer';
    acPower?: number; // watts
    dcPower?: number; // watts
    channels?: number;
    efficiency?: number; // percentage
    
    // Battery Specs
    batteryType?: 'lithium_ion' | 'lead_acid' | 'saltwater';
    capacity?: number; // kWh or Ah
    voltage?: number; // V
    cycleLife?: number;
    depthOfDischarge?: number; // percentage
    roundTripEfficiency?: number; // percentage
    
    // General
    warranty: {
      product: number; // years
      performance?: number; // years
      performanceGuarantee?: number; // percentage at end of warranty
    };
    certifications: string[];
    countryOfOrigin: string;
  };
  
  // Product Media
  images: Array<{
    url: string;
    alt: string;
    type: 'primary' | 'gallery' | 'spec_sheet' | 'installation';
    order: number;
  }>;
  
  documents: Array<{
    name: string;
    type: 'spec_sheet' | 'manual' | 'warranty' | 'installation_guide' | 'certification';
    url: string;
    language: string;
    version: string;
  }>;
  
  // SEO & Search
  keywords: string[];
  tags: string[];
  searchTerms: string[];
  
  // Reviews & Ratings
  reviews: {
    averageRating: number; // 1-5
    totalReviews: number;
    ratingBreakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  
  // Compatibility
  compatibility: {
    panelTypes?: string[]; // for inverters
    inverterTypes?: string[]; // for panels
    mountingTypes?: string[]; // for panels
    roofTypes?: string[]; // for mounting
  };
  
  // Status
  status: 'active' | 'discontinued' | 'coming_soon' | 'out_of_stock';
  featured: boolean;
  bestSeller: boolean;
  newProduct: boolean;
  
  // Compliance
  compliance: {
    ul?: string; // UL listing number
    iec?: string; // IEC certification
    fcc?: string; // FCC ID
    california65?: boolean; // Prop 65 warning
    rohs?: boolean; // RoHS compliant
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPriceUpdate: Timestamp;
}
```

### 7. Solar Systems Collection (`solar_systems/{systemId}`)

Installed solar system specifications and performance.

```typescript
interface SolarSystem {
  id: string;
  projectId: string;
  homeownerId: string;
  installerId: string;
  
  // System Overview
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  installationDate: Timestamp;
  commissioningDate: Timestamp;
  lastMaintenanceDate?: Timestamp;
  
  // System Configuration
  configuration: {
    totalCapacity: number; // kW DC
    totalInverterCapacity: number; // kW AC
    systemType: 'grid_tied' | 'hybrid' | 'off_grid';
    orientation: number; // degrees from south
    tilt: number; // degrees from horizontal
    
    panels: Array<{
      brand: string;
      model: string;
      wattage: number;
      quantity: number;
      serialNumbers: string[];
      arrayId: string;
      stringId?: string;
    }>;
    
    inverters: Array<{
      brand: string;
      model: string;
      type: 'string' | 'central' | 'microinverter' | 'power_optimizer';
      capacity: number; // kW
      quantity: number;
      serialNumbers: string[];
      location: string;
    }>;
    
    batteries?: Array<{
      brand: string;
      model: string;
      capacity: number; // kWh
      quantity: number;
      serialNumbers: string[];
      configuration: 'series' | 'parallel' | 'series_parallel';
    }>;
    
    monitoring: {
      system: string;
      serialNumber: string;
      communicationType: 'ethernet' | 'wifi' | 'cellular' | 'zigbee';
      monitoringLevel: 'system' | 'string' | 'panel';
    };
  };
  
  // Performance Specifications
  specifications: {
    designProduction: number; // kWh/year
    expectedDegradation: number; // %/year
    performanceGuarantee: number; // % at year 25
    
    calculatedMetrics: {
      specificYield: number; // kWh/kWp/year
      performanceRatio: number; // actual/theoretical
      capacityFactor: number; // average/peak power
    };
  };
  
  // Environmental Data
  location: {
    address: Address;
    coordinates: {
      latitude: number;
      longitude: number;
      elevation: number; // meters
    };
    timezone: string;
    
    // Solar resource data
    solarResource: {
      annualGHI: number; // kWh/m²/year Global Horizontal Irradiance
      annualDNI: number; // kWh/m²/year Direct Normal Irradiance
      annualDHI: number; // kWh/m²/year Diffuse Horizontal Irradiance
      peakSunHours: number; // hours/day
      shadingFactor: number; // 0-1
    };
  };
  
  // Warranties
  warranties: Array<{
    component: string;
    type: 'workmanship' | 'product' | 'performance';
    startDate: Timestamp;
    duration: number; // years
    coverage: string;
    provider: string;
    warrantyNumber?: string;
  }>;
  
  // Maintenance Schedule
  maintenance: {
    schedule: Array<{
      type: 'inspection' | 'cleaning' | 'electrical' | 'mechanical';
      frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
      lastPerformed?: Timestamp;
      nextDue?: Timestamp;
      provider: string;
    }>;
    
    history: Array<{
      date: Timestamp;
      type: string;
      description: string;
      performedBy: string;
      findings: string[];
      recommendations: string[];
      cost?: number;
      photos?: string[];
    }>;
  };
  
  // Performance Targets
  targets: {
    monthly: Array<{
      month: number; // 1-12
      expectedProduction: number; // kWh
    }>;
    annual: number; // kWh
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 8. Energy Production Collection (`energy_production/{systemId}/data/{recordId}`)

Time-series energy production data.

```typescript
interface EnergyProductionRecord {
  id: string;
  systemId: string;
  timestamp: Timestamp;
  interval: '15min' | '1hour' | '1day' | '1month';
  
  // Production Data
  production: {
    dcPower: number; // kW
    acPower: number; // kW
    energy: number; // kWh for interval
    voltage: number; // V
    current: number; // A
    frequency: number; // Hz
  };
  
  // Environmental Conditions
  environmental: {
    irradiance?: number; // W/m²
    ambientTemp?: number; // °C
    moduleTemp?: number; // °C
    windSpeed?: number; // m/s
    humidity?: number; // %
  };
  
  // Performance Metrics
  performance: {
    efficiency: number; // %
    performanceRatio: number; // actual/expected
    specificYield: number; // kWh/kWp
    capacityFactor: number; // %
  };
  
  // System Status
  status: {
    operationalStatus: 'normal' | 'reduced' | 'offline' | 'maintenance';
    faults: Array<{
      code: string;
      description: string;
      severity: 'info' | 'warning' | 'error' | 'critical';
    }>;
    alerts: string[];
  };
  
  // String/Panel Level Data (if available)
  stringData?: Array<{
    stringId: string;
    dcPower: number;
    dcVoltage: number;
    dcCurrent: number;
    temperature?: number;
  }>;
  
  panelData?: Array<{
    panelId: string;
    power: number;
    voltage: number;
    current: number;
    temperature?: number;
    faults?: string[];
  }>;
  
  // Consumption Data (if hybrid/storage system)
  consumption?: {
    homeLoad: number; // kW
    batteryCharge: number; // kW (positive = charging)
    batteryDischarge: number; // kW
    gridImport: number; // kW
    gridExport: number; // kW
    batterySOC?: number; // % state of charge
  };
  
  // Data Quality
  dataQuality: {
    source: 'inverter' | 'monitoring_system' | 'utility_meter' | 'estimated';
    confidence: number; // 0-1
    gaps: boolean;
    interpolated: boolean;
  };
  
  createdAt: Timestamp;
}
```

### 9. Weather Data Collection (`weather_data/{locationId}/data/{recordId}`)

Weather and irradiance data for solar calculations.

```typescript
interface WeatherRecord {
  id: string;
  locationId: string; // zip code or coordinates
  timestamp: Timestamp;
  interval: '15min' | '1hour' | '1day';
  
  // Solar Irradiance
  irradiance: {
    ghi: number; // W/m² Global Horizontal Irradiance
    dni: number; // W/m² Direct Normal Irradiance  
    dhi: number; // W/m² Diffuse Horizontal Irradiance
    clearSkyGHI: number; // W/m² Clear sky GHI
    clearSkyIndex: number; // 0-1 actual/clear sky
  };
  
  // Weather Conditions
  weather: {
    temperature: number; // °C
    humidity: number; // %
    pressure: number; // hPa
    windSpeed: number; // m/s
    windDirection: number; // degrees
    precipitation: number; // mm
    snowDepth?: number; // cm
    visibility: number; // km
  };
  
  // Cloud Cover
  clouds: {
    totalCover: number; // % 0-100
    lowCover: number; // %
    midCover: number; // %  
    highCover: number; // %
  };
  
  // Sun Position
  solar: {
    elevation: number; // degrees above horizon
    azimuth: number; // degrees from north
    sunrise: Timestamp;
    sunset: Timestamp;
    solarNoon: Timestamp;
    dayLength: number; // hours
  };
  
  // Data Source
  source: {
    provider: 'NREL' | 'NOAA' | 'local_station' | 'satellite';
    stationId?: string;
    quality: 'measured' | 'modeled' | 'estimated';
  };
  
  createdAt: Timestamp;
}
```

### 10. Utility Rates Collection (`utility_rates/{utilityId}`)

Electricity rate structures for savings calculations.

```typescript
interface UtilityRate {
  id: string;
  utilityCompany: string;
  rateName: string;
  rateCode: string;
  
  // Service Territory
  serviceTerritory: {
    states: string[];
    counties: string[];
    cities: string[];
    zipCodes: string[];
  };
  
  // Rate Structure
  rateStructure: {
    type: 'tiered' | 'time_of_use' | 'demand' | 'net_metering';
    customerClass: 'residential' | 'commercial' | 'industrial';
    
    // Fixed Charges
    fixedCharges: {
      connectionFee: number; // $/month
      facilityFee?: number; // $/month
    };
    
    // Energy Charges
    energyCharges: Array<{
      tier?: number;
      timeOfUse?: {
        period: 'peak' | 'off_peak' | 'super_off_peak';
        months: number[];
        daysOfWeek: number[]; // 0=Sunday
        startTime: string; // HH:MM
        endTime: string; // HH:MM
      };
      price: number; // $/kWh
      threshold?: number; // kWh/month tier threshold
    }>;
    
    // Demand Charges (commercial)
    demandCharges?: Array<{
      type: 'facility' | 'time_of_use';
      price: number; // $/kW
      timeOfUse?: {
        period: string;
        months: number[];
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
      };
    }>;
  };
  
  // Net Metering
  netMetering: {
    available: boolean;
    type?: 'net_energy_metering' | 'net_billing' | 'buy_all_sell_all';
    creditRate?: number; // $/kWh or percentage of retail rate
    rolloverPolicy?: 'monthly' | 'annual' | 'expires';
    systemSizeLimit?: number; // kW
    aggregateCap?: number; // MW statewide cap
  };
  
  // Rate Schedule
  schedule: {
    effectiveDate: Timestamp;
    expirationDate?: Timestamp;
    seasonalSchedule?: Array<{
      season: 'summer' | 'winter';
      startMonth: number;
      endMonth: number;
      rates: object; // Different rates for season
    }>;
  };
  
  // Additional Fees
  additionalFees: Array<{
    name: string;
    type: 'fixed' | 'variable' | 'percentage';
    amount: number;
    applicability: string;
  }>;
  
  // Regulatory Information
  regulatory: {
    publicUtilitiesCommission: string;
    tarifNumber: string;
    lastApproved: Timestamp;
    nextReviewDate?: Timestamp;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Schema Relationships

### Primary Relationships

1. **User → Profile**: One-to-one relationship based on user role
2. **Homeowner → RFQs**: One-to-many (homeowner can create multiple RFQs)
3. **RFQ → Quotes**: One-to-many (RFQ can receive multiple quotes)
4. **Quote → Project**: One-to-one (accepted quote becomes project)
5. **Project → Solar System**: One-to-one (project results in installed system)
6. **Solar System → Energy Production**: One-to-many (system generates multiple data points)
7. **Supplier → Products**: One-to-many (supplier has multiple products)

### Secondary Relationships

- **Installer → Service Areas**: Spatial relationship for RFQ matching
- **Location → Weather Data**: Geographic relationship for performance calculations
- **Utility Company → Rates**: One-to-many for different rate schedules
- **System → Maintenance**: One-to-many for maintenance records

---

## Indexing Strategy

### Composite Indexes

```javascript
// RFQs - for installer dashboard filtering and sorting
[
  ['selectedInstallerIds', 'status', 'createdAt'],
  ['budget.min', 'budget.max', 'propertyAddress.zipCode'],
  ['status', 'timeline', 'priority']
]

// Quotes - for homeowner comparison and installer tracking
[
  ['rfqId', 'status', 'submittedAt'],
  ['homeownerId', 'status', 'pricing.totalCost'],
  ['installerId', 'status', 'submittedAt']
]

// Products - for supplier catalog and installer sourcing
[
  ['category', 'inStock', 'pricing.basePrice'],
  ['supplierId', 'status', 'updatedAt'],
  ['category', 'specifications.power', 'pricing.basePrice']
]

// Energy Production - for performance analytics
[
  ['systemId', 'timestamp'],
  ['systemId', 'interval', 'timestamp']
]

// Weather Data - for solar calculations
[
  ['locationId', 'timestamp'],
  ['locationId', 'interval', 'timestamp']
]
```

### Single Field Indexes

- All timestamp fields (`createdAt`, `updatedAt`, etc.)
- All status fields
- Geographic fields (`coordinates`, `zipCode`)
- Search fields (`email`, `businessName`, etc.)

---

## Data Validation Rules

### Field Validation

- **Email**: Valid email format, unique per collection
- **Phone**: E.164 format validation
- **Coordinates**: Valid latitude/longitude ranges
- **Pricing**: Positive numbers, reasonable ranges
- **Dates**: Logical ordering (start < end dates)
- **Percentages**: 0-100 range validation
- **Power Values**: Positive numbers, industry-standard ranges

### Business Logic Validation

- **System Sizing**: Panel count × wattage = total capacity
- **Quote Expiration**: Must be future date
- **Installation Timeline**: Realistic duration ranges
- **Performance Ratios**: Within industry norms (0.7-0.9)
- **Financial Calculations**: Net present value accuracy

### Security Validation

- **User Role Access**: Users can only access appropriate data
- **Data Sanitization**: XSS prevention on all text fields
- **File Uploads**: Type and size restrictions
- **API Rate Limiting**: Prevent abuse

---

## Migration Strategy

### Phase 1: Core Collections
1. Users and Profiles
2. RFQs and Quotes
3. Basic product catalog

### Phase 2: Project Management
1. Projects collection
2. Installation tracking
3. Document management

### Phase 3: Performance & Analytics
1. Solar systems
2. Energy production data
3. Weather data integration

### Phase 4: Advanced Features
1. Utility rates
2. Financial modeling
3. Maintenance scheduling

---

## Backup and Recovery

### Automated Backups
- **Daily**: Full database backup
- **Hourly**: Incremental backup for critical collections
- **Real-time**: Transaction log backup

### Recovery Procedures
- **Point-in-time recovery**: Any point within 35 days
- **Collection-level recovery**: Individual collection restoration
- **Cross-region replication**: Disaster recovery

### Data Retention
- **User data**: Retained while account active + 7 years
- **Financial data**: 7 years per regulatory requirements
- **Performance data**: Lifetime of solar system
- **Analytics data**: 5 years for trend analysis

This comprehensive schema provides a robust foundation for a production-ready solar marketplace platform with enterprise-grade data management capabilities.