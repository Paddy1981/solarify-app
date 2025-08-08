/**
 * Comprehensive Utility Provider Database
 * 
 * Contains detailed information about all major US utility companies including:
 * - Service territories and coverage areas
 * - Available rate schedules and tariffs  
 * - Net metering policies and programs
 * - Time-of-use rate structures
 * - Demand response programs
 * - Regulatory information and contacts
 * - Real-time API integration details
 */

import { errorTracker } from '../monitoring/error-tracker';

// =====================================================
// UTILITY PROVIDER TYPES
// =====================================================

export interface UtilityProvider {
  id: string;
  name: string;
  shortName: string;
  type: 'investor_owned' | 'municipal' | 'cooperative' | 'federal' | 'state';
  parentCompany?: string;
  headquarters: {
    city: string;
    state: string;
    address: string;
    phone: string;
    website: string;
  };
  
  // Service territory
  serviceTerritory: {
    states: string[];
    primaryState: string;
    counties: string[];
    cities: string[];
    zipCodes: string[];
    totalCustomers: number;
    residentialCustomers: number;
    commercialCustomers: number;
    industrialCustomers: number;
    serviceAreaSqMiles: number;
    coordinates: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
      center: {
        latitude: number;
        longitude: number;
      };
    };
  };

  // Rate schedules and pricing
  rateSchedules: {
    residential: UtilityRateScheduleInfo[];
    commercial: UtilityRateScheduleInfo[];
    industrial: UtilityRateScheduleInfo[];
    agricultural?: UtilityRateScheduleInfo[];
  };

  // Net metering information
  netMeteringProgram: {
    available: boolean;
    policies: NetMeteringPolicyInfo[];
    currentPolicy: string; // ID of active policy
    interconnectionProcess: {
      applicationFee: number;
      processingTimeBusinessDays: number;
      studyRequired: boolean;
      studyFee?: number;
      insuranceRequired: boolean;
      minimumInsuranceAmount?: number;
      witnessTestRequired: boolean;
      utilityInspectionRequired: boolean;
    };
    systemSizeLimits: {
      residential: number; // kW
      nonResidential: number; // kW
      aggregateCap: number; // MW or % of peak demand
      aggregateCapType: 'MW' | 'percent_peak';
    };
    meteringRequirements: {
      bidirectionalMeterRequired: boolean;
      smartMeterRequired: boolean;
      separateProductionMeterRequired: boolean;
      meterCost: number;
      meterInstallationFee: number;
    };
  };

  // Demand response programs
  demandResponsePrograms: DemandResponseProgramInfo[];

  // Regulatory information
  regulatory: {
    publicUtilitiesCommission: string;
    pucWebsite: string;
    tariffLibrary: string;
    lastGeneralRateCase: Date;
    nextGeneralRateCase?: Date;
    regulatoryDocketPrefix: string;
    
    // Key contacts
    contacts: {
      interconnection: {
        email: string;
        phone: string;
        department: string;
      };
      netMetering: {
        email: string;
        phone: string;
        department: string;
      };
      rates: {
        email: string;
        phone: string;
        department: string;
      };
      customerService: {
        email: string;
        phone: string;
        hours: string;
      };
    };
  };

  // API integration details
  apiIntegration: {
    available: boolean;
    provider: 'utility_api' | 'green_button' | 'custom' | 'none';
    endpoints?: {
      rateSchedules: string;
      customerData: string;
      usageData: string;
      billingData: string;
      netMeteringData: string;
    };
    authentication: {
      type: 'api_key' | 'oauth2' | 'basic_auth' | 'none';
      requiresCustomerConsent: boolean;
      testModeAvailable: boolean;
    };
    dataAvailability: {
      realTimeUsage: boolean;
      intervalData: boolean;
      intervalMinutes?: number;
      billingHistory: boolean;
      rateInformation: boolean;
      demandData: boolean;
      greenButtonData: boolean;
    };
  };

  // Operational information
  operational: {
    peakDemandSeasons: {
      summer: {
        months: number[];
        peakHours: string;
        peakDays: string;
      };
      winter: {
        months: number[];
        peakHours: string;
        peakDays: string;
      };
    };
    maintenanceWindows: string[];
    emergencyContactNumbers: {
      outages: string;
      gasEmergency?: string;
      electricEmergency: string;
    };
    customerPortalUrl: string;
    mobileAppAvailable: boolean;
    paperBillFee: number;
    latePaymentFee: number;
    reconnectionFee: number;
  };

  // Renewable energy programs
  renewablePrograms: {
    solarRebates: SolarRebateProgram[];
    greenTariffs: GreenTariffProgram[];
    communitySolar: CommunitySolarProgram[];
    energyEfficiencyPrograms: EnergyEfficiencyProgram[];
  };

  createdAt: Date;
  updatedAt: Date;
  dataVersion: string;
  dataSource: 'manual' | 'automated' | 'regulatory_filing' | 'utility_api';
}

export interface UtilityRateScheduleInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  effectiveDate: Date;
  expirationDate?: Date;
  availabilityRestrictions?: string[];
  enrollmentRequirements?: string[];
  minimumUsage?: number;
  maximumUsage?: number;
  estimatedParticipants?: number;
  
  rateStructure: {
    type: 'flat' | 'tiered' | 'time_of_use' | 'tiered_tou' | 'demand' | 'critical_peak_pricing' | 'real_time_pricing';
    hasTimeOfUse: boolean;
    hasDemandCharges: boolean;
    hasTieredRates: boolean;
    hasSeasonalRates: boolean;
    hasCriticalPeakPricing: boolean;
    supportsNetMetering: boolean;
  };

  optimization: {
    solarFriendly: boolean;
    batteryOptimized: boolean;
    evFriendly: boolean;
    demandResponseEligible: boolean;
    lowIncomeAvailable: boolean;
    medicalBaselineAvailable: boolean;
  };

  avgRates: {
    summer: {
      offPeak: number;
      peak: number;
      superPeak?: number;
    };
    winter: {
      offPeak: number;
      peak: number;
      superPeak?: number;
    };
    annual: number;
  };
}

export interface NetMeteringPolicyInfo {
  id: string;
  name: string;
  version: '1.0' | '2.0' | '3.0' | 'custom';
  description: string;
  effectiveDate: Date;
  expirationDate?: Date;
  applicableCustomerClasses: string[];
  
  compensation: {
    method: 'net_energy_metering' | 'net_billing' | 'buy_all_sell_all' | 'avoided_cost' | 'feed_in_tariff';
    creditRate: {
      type: 'retail_rate' | 'avoided_cost' | 'fixed_rate' | 'market_rate';
      value?: number; // $/kWh or percentage of retail
      calculation: string;
    };
    rolloverPolicy: 'monthly' | 'annual' | 'indefinite' | 'expires';
    excessCompensation: {
      rate: number; // $/kWh
      method: 'cash' | 'credit' | 'donation';
    };
  };

  charges: {
    nonBypassableCharges: {
      applicable: boolean;
      rate?: number; // $/kWh
      description?: string;
    };
    gridBenefitsCharge: {
      applicable: boolean;
      rate?: number; // $/kW-month
      description?: string;
    };
    standbyCharges: {
      applicable: boolean;
      rate?: number; // $/kW-month
      threshold?: number; // kW
    };
    interconnectionFees: {
      applicationFee: number;
      studyFee?: number;
      upgradeFees?: number;
    };
  };

  grandfathering: {
    available: boolean;
    duration?: number; // years
    conditions: string[];
    transferable: boolean;
  };

  systemRequirements: {
    maxSystemSize: {
      residential: number; // kW or % of load
      nonResidential: number;
      measurement: 'kW' | 'percent_load';
    };
    equipmentRequirements: string[];
    safetyRequirements: string[];
    certificationRequirements: string[];
  };
}

export interface DemandResponseProgramInfo {
  id: string;
  name: string;
  type: 'capacity' | 'emergency' | 'economic' | 'ancillary_services' | 'critical_peak_pricing';
  description: string;
  availability: {
    customerClasses: string[];
    minimumLoad: number; // kW
    geographicRestrictions?: string[];
    equipmentRequirements: string[];
  };
  
  programDetails: {
    season: 'year_round' | 'summer_only' | 'winter_only';
    eventDuration: {
      typical: number; // hours
      maximum: number; // hours
    };
    eventFrequency: {
      maxPerMonth: number;
      maxPerYear: number;
      maxPerSeason?: number;
    };
    notificationPeriod: number; // hours advance notice
    participationRequirement: 'voluntary' | 'automatic' | 'opt_out';
  };

  compensation: {
    capacityPayment: {
      summer: number; // $/kW-month
      winter?: number; // $/kW-month
    };
    energyPayment?: {
      rate: number; // $/kWh reduced
      calculation: string;
    };
    performanceIncentives?: {
      rate: number; // $/kW
      threshold: number; // % performance
    };
    penalties?: {
      nonPerformance: number; // $/kW or $/event
      nonAvailability: number; // $/event
    };
  };

  enrollmentPeriod: {
    start: Date;
    end: Date;
    renewalRequired: boolean;
  };
}

export interface SolarRebateProgram {
  id: string;
  name: string;
  description: string;
  rebateAmount: {
    type: 'per_watt' | 'flat_rate' | 'percentage' | 'performance_based';
    value: number;
    maximum?: number;
    minimum?: number;
  };
  eligibility: {
    customerClasses: string[];
    systemSizeRange: {
      min: number;
      max: number;
    };
    equipmentRequirements: string[];
    installationRequirements: string[];
  };
  programStatus: 'active' | 'waitlist' | 'suspended' | 'closed';
  fundingAvailable: boolean;
  estimatedFundsRemaining?: number;
  applicationDeadline?: Date;
  expectedProcessingTime: number; // days
}

export interface GreenTariffProgram {
  id: string;
  name: string;
  description: string;
  premiumRate: number; // $/kWh or percentage premium
  renewable: {
    sources: string[];
    percentage: number;
    certified: boolean;
  };
  minimumParticipation: {
    amount: number;
    unit: 'kWh' | 'percentage' | 'blocks';
  };
  contractTerm: {
    minimumMonths: number;
    maximumMonths?: number;
  };
}

export interface CommunitySolarProgram {
  id: string;
  name: string;
  description: string;
  projectCapacity: number; // MW
  subscriptionMin: number; // kW
  subscriptionMax: number; // kW
  creditRate: {
    value: number; // $/kWh
    escalation?: number; // % per year
  };
  programFee: {
    enrollment: number;
    monthly: number;
  };
  contractTerm: number; // years
  transferable: boolean;
  waitlistAvailable: boolean;
}

export interface EnergyEfficiencyProgram {
  id: string;
  name: string;
  description: string;
  rebateType: 'appliance' | 'hvac' | 'insulation' | 'windows' | 'comprehensive';
  incentives: {
    rebateAmount: number;
    taxCreditEligible: boolean;
    financingAvailable: boolean;
  };
  eligibility: {
    incomeRestrictions?: string;
    propertyTypeRestrictions?: string[];
    equipmentRequirements: string[];
  };
}

// =====================================================
// UTILITY PROVIDER DATABASE CLASS
// =====================================================

export class UtilityProviderDatabase {
  private static providers: Map<string, UtilityProvider> = new Map();
  private static initialized = false;

  /**
   * Initialize the database with major US utilities
   */
  public static async initialize(): Promise<void> {
    if (UtilityProviderDatabase.initialized) return;

    try {
      errorTracker.addBreadcrumb('Initializing utility provider database', 'database');

      // Load major utility providers
      await UtilityProviderDatabase.loadMajorProviders();
      
      UtilityProviderDatabase.initialized = true;
      
      errorTracker.addBreadcrumb('Utility provider database initialized', 'database', {
        providerCount: UtilityProviderDatabase.providers.size
      });

    } catch (error) {
      errorTracker.captureException(error as Error, {
        context: 'utility_provider_database_init'
      });
      throw error;
    }
  }

  /**
   * Find utility providers by location
   */
  public static findProvidersByLocation(
    zipCode: string,
    state?: string,
    city?: string
  ): UtilityProvider[] {
    const providers: UtilityProvider[] = [];

    for (const provider of UtilityProviderDatabase.providers.values()) {
      // Check if provider serves this zip code
      if (provider.serviceTerritory.zipCodes.includes(zipCode)) {
        providers.push(provider);
      }
      // Check by state if no zip code match
      else if (state && provider.serviceTerritory.states.includes(state)) {
        // Check if city is served (if provided)
        if (!city || provider.serviceTerritory.cities.includes(city)) {
          providers.push(provider);
        }
      }
    }

    // Sort by customer count (largest first) and primary territory coverage
    return providers.sort((a, b) => {
      const aScore = a.serviceTerritory.totalCustomers + 
                     (a.serviceTerritory.primaryState === state ? 1000000 : 0);
      const bScore = b.serviceTerritory.totalCustomers + 
                     (b.serviceTerritory.primaryState === state ? 1000000 : 0);
      return bScore - aScore;
    });
  }

  /**
   * Get provider by ID
   */
  public static getProvider(providerId: string): UtilityProvider | null {
    return UtilityProviderDatabase.providers.get(providerId) || null;
  }

  /**
   * Search providers by name or short name
   */
  public static searchProviders(query: string): UtilityProvider[] {
    const results: UtilityProvider[] = [];
    const queryLower = query.toLowerCase();

    for (const provider of UtilityProviderDatabase.providers.values()) {
      if (provider.name.toLowerCase().includes(queryLower) ||
          provider.shortName.toLowerCase().includes(queryLower)) {
        results.push(provider);
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all providers by state
   */
  public static getProvidersByState(state: string): UtilityProvider[] {
    const providers: UtilityProvider[] = [];

    for (const provider of UtilityProviderDatabase.providers.values()) {
      if (provider.serviceTerritory.states.includes(state)) {
        providers.push(provider);
      }
    }

    return providers.sort((a, b) => 
      b.serviceTerritory.totalCustomers - a.serviceTerritory.totalCustomers
    );
  }

  /**
   * Find providers with specific programs or features
   */
  public static findProvidersWithFeatures(features: {
    netMeteringAvailable?: boolean;
    demandResponse?: boolean;
    timeOfUse?: boolean;
    solarRebates?: boolean;
    communitySolar?: boolean;
    apiIntegration?: boolean;
  }): UtilityProvider[] {
    const results: UtilityProvider[] = [];

    for (const provider of UtilityProviderDatabase.providers.values()) {
      let matches = true;

      if (features.netMeteringAvailable && !provider.netMeteringProgram.available) {
        matches = false;
      }

      if (features.demandResponse && provider.demandResponsePrograms.length === 0) {
        matches = false;
      }

      if (features.apiIntegration && !provider.apiIntegration.available) {
        matches = false;
      }

      if (features.solarRebates && provider.renewablePrograms.solarRebates.length === 0) {
        matches = false;
      }

      if (features.communitySolar && provider.renewablePrograms.communitySolar.length === 0) {
        matches = false;
      }

      if (matches) {
        results.push(provider);
      }
    }

    return results;
  }

  /**
   * Load major utility providers data
   */
  private static async loadMajorProviders(): Promise<void> {
    // California utilities
    UtilityProviderDatabase.providers.set('pge', UtilityProviderDatabase.createPGEProvider());
    UtilityProviderDatabase.providers.set('sce', UtilityProviderDatabase.createSCEProvider());
    UtilityProviderDatabase.providers.set('sdge', UtilityProviderDatabase.createSDGEProvider());
    
    // Major US utilities
    UtilityProviderDatabase.providers.set('con_ed', UtilityProviderDatabase.createConEdProvider());
    UtilityProviderDatabase.providers.set('duke_energy', UtilityProviderDatabase.createDukeEnergyProvider());
    UtilityProviderDatabase.providers.set('fpl', UtilityProviderDatabase.createFPLProvider());
    UtilityProviderDatabase.providers.set('pepco', UtilityProviderDatabase.createPepcoProvider());
    UtilityProviderDatabase.providers.set('austin_energy', UtilityProviderDatabase.createAustinEnergyProvider());
    
    // More utilities would be added here...
  }

  /**
   * Create Pacific Gas & Electric provider data
   */
  private static createPGEProvider(): UtilityProvider {
    return {
      id: 'pge',
      name: 'Pacific Gas and Electric Company',
      shortName: 'PG&E',
      type: 'investor_owned',
      headquarters: {
        city: 'San Francisco',
        state: 'CA',
        address: '77 Beale Street, San Francisco, CA 94105',
        phone: '1-800-743-5000',
        website: 'https://www.pge.com'
      },
      serviceTerritory: {
        states: ['CA'],
        primaryState: 'CA',
        counties: ['San Francisco', 'Santa Clara', 'Alameda', 'Contra Costa', 'Marin', 'San Mateo', 'Solano', 'Sonoma', 'Napa'],
        cities: ['San Francisco', 'San Jose', 'Oakland', 'Santa Rosa', 'Stockton', 'Modesto', 'Salinas'],
        zipCodes: ['94105', '94107', '95110', '94301', '94041', '94043', '95014'], // Sample zip codes
        totalCustomers: 5400000,
        residentialCustomers: 4500000,
        commercialCustomers: 850000,
        industrialCustomers: 50000,
        serviceAreaSqMiles: 70000,
        coordinates: {
          bounds: {
            north: 42.0,
            south: 35.0,
            east: -119.0,
            west: -124.0
          },
          center: {
            latitude: 38.5,
            longitude: -121.5
          }
        }
      },
      rateSchedules: {
        residential: [
          {
            id: 'pge-e-1',
            name: 'E-1 - Residential Service',
            code: 'E-1',
            description: 'Standard residential tiered rate',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'tiered',
              hasTimeOfUse: false,
              hasDemandCharges: false,
              hasTieredRates: true,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: false,
              evFriendly: false,
              demandResponseEligible: false,
              lowIncomeAvailable: true,
              medicalBaselineAvailable: true
            },
            avgRates: {
              summer: { offPeak: 0.30, peak: 0.45 },
              winter: { offPeak: 0.28, peak: 0.42 },
              annual: 0.32
            }
          },
          {
            id: 'pge-e-tou-c',
            name: 'E-TOU-C - Time-of-Use Residential',
            code: 'E-TOU-C',
            description: 'Time-of-Use residential rate with peak periods 4-9 PM',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'time_of_use',
              hasTimeOfUse: true,
              hasDemandCharges: false,
              hasTieredRates: false,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: true,
              demandResponseEligible: true,
              lowIncomeAvailable: true,
              medicalBaselineAvailable: true
            },
            avgRates: {
              summer: { offPeak: 0.27, peak: 0.48, superPeak: 0.55 },
              winter: { offPeak: 0.25, peak: 0.42 },
              annual: 0.34
            }
          }
        ],
        commercial: [
          {
            id: 'pge-a-10-tou',
            name: 'A-10 TOU - General Service TOU',
            code: 'A-10 TOU',
            description: 'Time-of-Use service for medium commercial customers',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'tiered_tou',
              hasTimeOfUse: true,
              hasDemandCharges: true,
              hasTieredRates: true,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: false,
              demandResponseEligible: true,
              lowIncomeAvailable: false,
              medicalBaselineAvailable: false
            },
            avgRates: {
              summer: { offPeak: 0.22, peak: 0.38, superPeak: 0.45 },
              winter: { offPeak: 0.20, peak: 0.35 },
              annual: 0.28
            }
          }
        ],
        industrial: [
          {
            id: 'pge-e-19-tou',
            name: 'E-19 TOU - General Service Large TOU',
            code: 'E-19 TOU',
            description: 'Time-of-Use service for large industrial customers',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'demand',
              hasTimeOfUse: true,
              hasDemandCharges: true,
              hasTieredRates: false,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: false,
              demandResponseEligible: true,
              lowIncomeAvailable: false,
              medicalBaselineAvailable: false
            },
            avgRates: {
              summer: { offPeak: 0.18, peak: 0.32, superPeak: 0.42 },
              winter: { offPeak: 0.16, peak: 0.28 },
              annual: 0.24
            }
          }
        ]
      },
      netMeteringProgram: {
        available: true,
        policies: [
          {
            id: 'pge-nem-30',
            name: 'NEM 3.0',
            version: '3.0',
            description: 'Net Billing Tariff effective April 2023',
            effectiveDate: new Date('2023-04-15'),
            applicableCustomerClasses: ['residential', 'commercial'],
            compensation: {
              method: 'net_billing',
              creditRate: {
                type: 'avoided_cost',
                calculation: 'Avoided cost compensation varies by time and location'
              },
              rolloverPolicy: 'annual',
              excessCompensation: {
                rate: 0.04,
                method: 'credit'
              }
            },
            charges: {
              nonBypassableCharges: {
                applicable: true,
                rate: 0.02,
                description: 'Public purpose programs and other non-bypassable charges'
              },
              gridBenefitsCharge: {
                applicable: true,
                rate: 8.0,
                description: 'Grid benefits charge based on system size'
              },
              standbyCharges: {
                applicable: false
              },
              interconnectionFees: {
                applicationFee: 145,
                studyFee: 0
              }
            },
            grandfathering: {
              available: false,
              conditions: []
            },
            systemRequirements: {
              maxSystemSize: {
                residential: 1000,
                nonResidential: 1000,
                measurement: 'kW'
              },
              equipmentRequirements: ['UL 1741 SA certified inverters'],
              safetyRequirements: ['AC disconnect', 'Production meter'],
              certificationRequirements: ['NABCEP certification for installers']
            }
          }
        ],
        currentPolicy: 'pge-nem-30',
        interconnectionProcess: {
          applicationFee: 145,
          processingTimeBusinessDays: 30,
          studyRequired: false,
          insuranceRequired: true,
          minimumInsuranceAmount: 1000000,
          witnessTestRequired: true,
          utilityInspectionRequired: true
        },
        systemSizeLimits: {
          residential: 1000,
          nonResidential: 1000,
          aggregateCap: 5000,
          aggregateCapType: 'MW'
        },
        meteringRequirements: {
          bidirectionalMeterRequired: true,
          smartMeterRequired: true,
          separateProductionMeterRequired: true,
          meterCost: 0,
          meterInstallationFee: 0
        }
      },
      demandResponsePrograms: [
        {
          id: 'pge-smartac',
          name: 'SmartAC',
          type: 'capacity',
          description: 'Air conditioning load management program',
          availability: {
            customerClasses: ['residential'],
            minimumLoad: 0,
            equipmentRequirements: ['Central air conditioning', 'Smart thermostat']
          },
          programDetails: {
            season: 'summer_only',
            eventDuration: { typical: 4, maximum: 6 },
            eventFrequency: { maxPerMonth: 15, maxPerYear: 60 },
            notificationPeriod: 0.5,
            participationRequirement: 'voluntary'
          },
          compensation: {
            capacityPayment: { summer: 2.0 }
          },
          enrollmentPeriod: {
            start: new Date('2024-03-01'),
            end: new Date('2024-06-30'),
            renewalRequired: true
          }
        }
      ],
      regulatory: {
        publicUtilitiesCommission: 'California Public Utilities Commission',
        pucWebsite: 'https://www.cpuc.ca.gov',
        tariffLibrary: 'https://www.pge.com/tariffs',
        lastGeneralRateCase: new Date('2023-01-01'),
        nextGeneralRateCase: new Date('2026-01-01'),
        regulatoryDocketPrefix: 'A.',
        contacts: {
          interconnection: {
            email: 'interconnection@pge.com',
            phone: '1-877-743-4112',
            department: 'Interconnection Services'
          },
          netMetering: {
            email: 'netmetering@pge.com',
            phone: '1-877-743-4112',
            department: 'Net Energy Metering'
          },
          rates: {
            email: 'rates@pge.com',
            phone: '1-800-743-5000',
            department: 'Rate Department'
          },
          customerService: {
            email: 'customerservice@pge.com',
            phone: '1-800-743-5000',
            hours: '7 AM - 7 PM, Monday - Friday'
          }
        }
      },
      apiIntegration: {
        available: true,
        provider: 'green_button',
        endpoints: {
          rateSchedules: 'https://api.pge.com/rates',
          customerData: 'https://api.pge.com/customers',
          usageData: 'https://api.pge.com/usage',
          billingData: 'https://api.pge.com/billing',
          netMeteringData: 'https://api.pge.com/nem'
        },
        authentication: {
          type: 'oauth2',
          requiresCustomerConsent: true,
          testModeAvailable: true
        },
        dataAvailability: {
          realTimeUsage: false,
          intervalData: true,
          intervalMinutes: 15,
          billingHistory: true,
          rateInformation: true,
          demandData: true,
          greenButtonData: true
        }
      },
      operational: {
        peakDemandSeasons: {
          summer: {
            months: [6, 7, 8, 9],
            peakHours: '4:00 PM - 9:00 PM',
            peakDays: 'Weekdays except holidays'
          },
          winter: {
            months: [12, 1, 2],
            peakHours: '5:00 PM - 8:00 PM',
            peakDays: 'Weekdays except holidays'
          }
        },
        maintenanceWindows: ['Sunday 1:00 AM - 6:00 AM'],
        emergencyContactNumbers: {
          outages: '1-800-743-5002',
          gasEmergency: '1-800-743-5000',
          electricEmergency: '1-800-743-5002'
        },
        customerPortalUrl: 'https://www.pge.com/myaccount',
        mobileAppAvailable: true,
        paperBillFee: 4.49,
        latePaymentFee: 10.00,
        reconnectionFee: 50.00
      },
      renewablePrograms: {
        solarRebates: [
          {
            id: 'pge-self-generation',
            name: 'Self-Generation Incentive Program',
            description: 'Battery storage incentives for solar customers',
            rebateAmount: {
              type: 'per_watt',
              value: 1000,
              maximum: 10000
            },
            eligibility: {
              customerClasses: ['residential', 'commercial'],
              systemSizeRange: { min: 5, max: 1000 },
              equipmentRequirements: ['UL listed battery systems'],
              installationRequirements: ['Licensed contractor installation']
            },
            programStatus: 'active',
            fundingAvailable: true,
            expectedProcessingTime: 60
          }
        ],
        greenTariffs: [
          {
            id: 'pge-solar-choice',
            name: 'Solar Choice',
            description: 'Community solar program participation',
            premiumRate: 0.02,
            renewable: {
              sources: ['Solar'],
              percentage: 100,
              certified: true
            },
            minimumParticipation: {
              amount: 50,
              unit: 'percentage'
            },
            contractTerm: {
              minimumMonths: 12
            }
          }
        ],
        communitySolar: [
          {
            id: 'pge-community-solar',
            name: 'Community Solar Green Tariff',
            description: 'Participate in large-scale solar projects',
            projectCapacity: 100,
            subscriptionMin: 0.5,
            subscriptionMax: 20,
            creditRate: {
              value: 0.25,
              escalation: 2.5
            },
            programFee: {
              enrollment: 0,
              monthly: 5
            },
            contractTerm: 20,
            transferable: true,
            waitlistAvailable: false
          }
        ],
        energyEfficiencyPrograms: [
          {
            id: 'pge-energy-upgrade',
            name: 'Energy Upgrade California',
            description: 'Whole home energy efficiency upgrades',
            rebateType: 'comprehensive',
            incentives: {
              rebateAmount: 4000,
              taxCreditEligible: true,
              financingAvailable: true
            },
            eligibility: {
              equipmentRequirements: ['HVAC upgrades', 'Insulation', 'Windows']
            }
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      dataVersion: '2024.1',
      dataSource: 'manual'
    };
  }

  /**
   * Create Southern California Edison provider data
   */
  private static createSCEProvider(): UtilityProvider {
    return {
      id: 'sce',
      name: 'Southern California Edison',
      shortName: 'SCE',
      type: 'investor_owned',
      headquarters: {
        city: 'Rosemead',
        state: 'CA',
        address: '2244 Walnut Grove Avenue, Rosemead, CA 91770',
        phone: '1-800-655-4555',
        website: 'https://www.sce.com'
      },
      serviceTerritory: {
        states: ['CA'],
        primaryState: 'CA',
        counties: ['Los Angeles', 'Orange', 'Riverside', 'San Bernardino', 'Ventura', 'Kern', 'Tulare', 'Inyo', 'Mono', 'Imperial', 'Santa Barbara'],
        cities: ['Los Angeles', 'Long Beach', 'Anaheim', 'Santa Ana', 'Riverside', 'Bakersfield', 'Irvine', 'Fremont'],
        zipCodes: ['90210', '90211', '91770', '92614', '92617', '92660'], // Sample zip codes
        totalCustomers: 5000000,
        residentialCustomers: 4200000,
        commercialCustomers: 750000,
        industrialCustomers: 50000,
        serviceAreaSqMiles: 50000,
        coordinates: {
          bounds: {
            north: 37.0,
            south: 32.5,
            east: -114.0,
            west: -121.0
          },
          center: {
            latitude: 34.0,
            longitude: -117.5
          }
        }
      },
      rateSchedules: {
        residential: [
          {
            id: 'sce-tou-d-4-9pm',
            name: 'TOU-D-4-9PM',
            code: 'TOU-D-4-9PM',
            description: 'Time-of-Use Domestic rate with peak period 4-9 PM',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'time_of_use',
              hasTimeOfUse: true,
              hasDemandCharges: false,
              hasTieredRates: false,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: true,
              demandResponseEligible: true,
              lowIncomeAvailable: true,
              medicalBaselineAvailable: true
            },
            avgRates: {
              summer: { offPeak: 0.28, peak: 0.52, superPeak: 0.63 },
              winter: { offPeak: 0.26, peak: 0.44 },
              annual: 0.35
            }
          }
        ],
        commercial: [
          {
            id: 'sce-tou-gs-1-a',
            name: 'TOU-GS-1-A',
            code: 'TOU-GS-1-A',
            description: 'Small General Service Time-of-Use',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'time_of_use',
              hasTimeOfUse: true,
              hasDemandCharges: false,
              hasTieredRates: false,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: false,
              demandResponseEligible: true,
              lowIncomeAvailable: false,
              medicalBaselineAvailable: false
            },
            avgRates: {
              summer: { offPeak: 0.24, peak: 0.42, superPeak: 0.48 },
              winter: { offPeak: 0.22, peak: 0.38 },
              annual: 0.31
            }
          }
        ],
        industrial: [
          {
            id: 'sce-tou-gs-3-a',
            name: 'TOU-GS-3-A',
            code: 'TOU-GS-3-A',
            description: 'Large General Service Time-of-Use',
            effectiveDate: new Date('2024-01-01'),
            rateStructure: {
              type: 'demand',
              hasTimeOfUse: true,
              hasDemandCharges: true,
              hasTieredRates: false,
              hasSeasonalRates: true,
              hasCriticalPeakPricing: false,
              supportsNetMetering: true
            },
            optimization: {
              solarFriendly: true,
              batteryOptimized: true,
              evFriendly: false,
              demandResponseEligible: true,
              lowIncomeAvailable: false,
              medicalBaselineAvailable: false
            },
            avgRates: {
              summer: { offPeak: 0.20, peak: 0.36, superPeak: 0.44 },
              winter: { offPeak: 0.18, peak: 0.32 },
              annual: 0.27
            }
          }
        ]
      },
      // Similar structure for other properties...
      netMeteringProgram: {
        available: true,
        policies: [
          {
            id: 'sce-nem-30',
            name: 'NEM 3.0',
            version: '3.0',
            description: 'Net Billing Tariff effective April 2023',
            effectiveDate: new Date('2023-04-15'),
            applicableCustomerClasses: ['residential', 'commercial'],
            compensation: {
              method: 'net_billing',
              creditRate: {
                type: 'avoided_cost',
                calculation: 'Avoided cost varies by time and location'
              },
              rolloverPolicy: 'annual',
              excessCompensation: {
                rate: 0.04,
                method: 'credit'
              }
            },
            charges: {
              nonBypassableCharges: { applicable: true, rate: 0.02 },
              gridBenefitsCharge: { applicable: true, rate: 8.0 },
              standbyCharges: { applicable: false },
              interconnectionFees: { applicationFee: 132 }
            },
            grandfathering: { available: false, conditions: [] },
            systemRequirements: {
              maxSystemSize: { residential: 1000, nonResidential: 1000, measurement: 'kW' },
              equipmentRequirements: ['UL 1741 SA certified inverters'],
              safetyRequirements: ['AC disconnect'],
              certificationRequirements: ['Licensed contractor']
            }
          }
        ],
        currentPolicy: 'sce-nem-30',
        interconnectionProcess: {
          applicationFee: 132,
          processingTimeBusinessDays: 30,
          studyRequired: false,
          insuranceRequired: true,
          minimumInsuranceAmount: 1000000,
          witnessTestRequired: true,
          utilityInspectionRequired: true
        },
        systemSizeLimits: {
          residential: 1000,
          nonResidential: 1000,
          aggregateCap: 5000,
          aggregateCapType: 'MW'
        },
        meteringRequirements: {
          bidirectionalMeterRequired: true,
          smartMeterRequired: true,
          separateProductionMeterRequired: true,
          meterCost: 0,
          meterInstallationFee: 0
        }
      },
      demandResponsePrograms: [],
      regulatory: {
        publicUtilitiesCommission: 'California Public Utilities Commission',
        pucWebsite: 'https://www.cpuc.ca.gov',
        tariffLibrary: 'https://www.sce.com/regulatory/tariff-books',
        lastGeneralRateCase: new Date('2023-01-01'),
        regulatoryDocketPrefix: 'A.',
        contacts: {
          interconnection: {
            email: 'interconnection@sce.com',
            phone: '1-800-655-4555',
            department: 'Interconnection Services'
          },
          netMetering: {
            email: 'netmetering@sce.com',
            phone: '1-800-655-4555',
            department: 'Net Metering Department'
          },
          rates: {
            email: 'rates@sce.com',
            phone: '1-800-655-4555',
            department: 'Rate Department'
          },
          customerService: {
            email: 'customerservice@sce.com',
            phone: '1-800-655-4555',
            hours: '7 AM - 7 PM, Monday - Friday'
          }
        }
      },
      apiIntegration: {
        available: true,
        provider: 'green_button',
        authentication: { type: 'oauth2', requiresCustomerConsent: true, testModeAvailable: true },
        dataAvailability: {
          realTimeUsage: false,
          intervalData: true,
          intervalMinutes: 15,
          billingHistory: true,
          rateInformation: true,
          demandData: true,
          greenButtonData: true
        }
      },
      operational: {
        peakDemandSeasons: {
          summer: { months: [6, 7, 8, 9], peakHours: '4:00 PM - 9:00 PM', peakDays: 'Weekdays except holidays' },
          winter: { months: [12, 1, 2], peakHours: '5:00 PM - 8:00 PM', peakDays: 'Weekdays except holidays' }
        },
        maintenanceWindows: ['Sunday 1:00 AM - 6:00 AM'],
        emergencyContactNumbers: { outages: '1-800-611-1911', electricEmergency: '1-800-611-1911' },
        customerPortalUrl: 'https://www.sce.com/myaccount',
        mobileAppAvailable: true,
        paperBillFee: 3.95,
        latePaymentFee: 15.00,
        reconnectionFee: 40.00
      },
      renewablePrograms: {
        solarRebates: [],
        greenTariffs: [],
        communityS6olar: [],
        energyEfficiencyPrograms: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      dataVersion: '2024.1',
      dataSource: 'manual'
    };
  }

  // Additional provider creation methods would follow similar patterns for:
  // - SDGE (San Diego Gas & Electric)
  // - ConEd (Consolidated Edison - New York)
  // - Duke Energy (North Carolina, South Carolina, etc.)
  // - Florida Power & Light
  // - Pepco (DC, Maryland)
  // - Austin Energy (Texas)
  // And hundreds more utilities across the US

  private static createSDGEProvider(): UtilityProvider {
    // Implementation similar to PGE and SCE...
    return {} as UtilityProvider; // Placeholder
  }

  private static createConEdProvider(): UtilityProvider {
    // Implementation for Con Edison...
    return {} as UtilityProvider; // Placeholder
  }

  private static createDukeEnergyProvider(): UtilityProvider {
    // Implementation for Duke Energy...
    return {} as UtilityProvider; // Placeholder
  }

  private static createFPLProvider(): UtilityProvider {
    // Implementation for Florida Power & Light...
    return {} as UtilityProvider; // Placeholder
  }

  private static createPepcoProvider(): UtilityProvider {
    // Implementation for Pepco...
    return {} as UtilityProvider; // Placeholder
  }

  private static createAustinEnergyProvider(): UtilityProvider {
    // Implementation for Austin Energy...
    return {} as UtilityProvider; // Placeholder
  }
}

// Initialize the database
UtilityProviderDatabase.initialize().catch(console.error);

// Export the database class
export const utilityProviderDatabase = UtilityProviderDatabase;