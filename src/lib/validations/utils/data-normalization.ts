/**
 * Data Normalization Utilities
 * 
 * Utility functions for normalizing, standardizing, and cleaning solar
 * industry data across different formats, sources, and systems.
 */

// =====================================================
// SOLAR EQUIPMENT DATA NORMALIZATION
// =====================================================

/**
 * Normalize solar panel specifications from various manufacturer formats
 */
export function normalizePanelSpecifications(rawData: any): {
  normalized: {
    manufacturer: string;
    model: string;
    nominalPower: number; // W
    efficiency: number; // %
    dimensions: { length: number; width: number; thickness: number }; // mm
    weight: number; // kg
    technology: string;
    certifications: string[];
    warranty: { performance: number; product: number }; // years
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Normalize manufacturer name
  const manufacturer = normalizeManufacturerName(rawData.manufacturer || rawData.brand || rawData.make);
  
  // Normalize power rating (handle different units)
  let nominalPower = parseFloat(rawData.power || rawData.watts || rawData.nominalPower || rawData.pMax);
  if (rawData.powerUnit === 'kW' || nominalPower < 10) {
    nominalPower *= 1000; // Convert kW to W
  }
  
  // Normalize efficiency (handle percentage vs decimal)
  let efficiency = parseFloat(rawData.efficiency || rawData.eff);
  if (efficiency <= 1 && efficiency > 0) {
    efficiency *= 100; // Convert decimal to percentage
  }
  
  // Normalize dimensions (convert various units to mm)
  const dimensions = normalizeDimensions(rawData.dimensions || rawData.size || {
    length: rawData.length,
    width: rawData.width,
    thickness: rawData.thickness || rawData.depth
  });
  
  // Normalize weight (convert to kg)
  let weight = parseFloat(rawData.weight || rawData.mass);
  const weightUnit = (rawData.weightUnit || '').toLowerCase();
  if (weightUnit === 'lbs' || weightUnit === 'lb') {
    weight *= 0.453592; // Convert lbs to kg
  }
  
  // Normalize technology name
  const technology = normalizeTechnology(rawData.technology || rawData.type || rawData.cellType);
  
  // Normalize certifications array
  const certifications = normalizeCertifications(rawData.certifications || rawData.certs || []);
  
  // Normalize warranty information
  const warranty = normalizeWarranty(rawData.warranty || {});
  
  // Validation warnings
  if (!manufacturer) warnings.push('Manufacturer name is missing or invalid');
  if (!nominalPower || nominalPower < 50) warnings.push('Nominal power is missing or below 50W');
  if (!efficiency || efficiency < 10) warnings.push('Efficiency is missing or below 10%');
  
  return {
    normalized: {
      manufacturer,
      model: rawData.model || rawData.modelNumber || '',
      nominalPower: Math.round(nominalPower),
      efficiency: Math.round(efficiency * 100) / 100,
      dimensions,
      weight: Math.round(weight * 100) / 100,
      technology,
      certifications,
      warranty
    },
    warnings
  };
}

/**
 * Normalize inverter specifications
 */
export function normalizeInverterSpecifications(rawData: any): {
  normalized: {
    manufacturer: string;
    model: string;
    nominalPower: number; // W
    maxPower: number; // W
    efficiency: number; // %
    inputVoltage: { min: number; max: number }; // V
    outputVoltage: number; // V
    phases: number;
    technology: string;
    certifications: string[];
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  
  const manufacturer = normalizeManufacturerName(rawData.manufacturer || rawData.brand);
  
  // Normalize power ratings
  let nominalPower = parseFloat(rawData.nominalPower || rawData.power || rawData.acPower);
  let maxPower = parseFloat(rawData.maxPower || rawData.peakPower || nominalPower * 1.1);
  
  if (rawData.powerUnit === 'kW' || nominalPower < 10) {
    nominalPower *= 1000;
    maxPower *= 1000;
  }
  
  // Normalize efficiency
  let efficiency = parseFloat(rawData.efficiency || rawData.maxEfficiency);
  if (efficiency <= 1) {
    efficiency *= 100;
  }
  
  // Normalize voltage ranges
  const inputVoltage = {
    min: parseFloat(rawData.inputVoltage?.min || rawData.dcVoltageMin || rawData.vdcMin || 200),
    max: parseFloat(rawData.inputVoltage?.max || rawData.dcVoltageMax || rawData.vdcMax || 600)
  };
  
  const outputVoltage = parseFloat(rawData.outputVoltage || rawData.acVoltage || rawData.vacNom || 240);
  
  // Normalize phases
  const phases = parseInt(rawData.phases || rawData.phaseCount || 
    (outputVoltage > 300 ? 3 : 1));
  
  const technology = normalizeInverterTechnology(rawData.technology || rawData.type);
  const certifications = normalizeCertifications(rawData.certifications || []);
  
  return {
    normalized: {
      manufacturer,
      model: rawData.model || '',
      nominalPower: Math.round(nominalPower),
      maxPower: Math.round(maxPower),
      efficiency: Math.round(efficiency * 100) / 100,
      inputVoltage,
      outputVoltage,
      phases,
      technology,
      certifications
    },
    warnings
  };
}

// =====================================================
// ENERGY DATA NORMALIZATION
// =====================================================

/**
 * Normalize utility bill data from various formats
 */
export function normalizeUtilityBillData(rawData: any): {
  normalized: {
    accountNumber: string;
    billingPeriod: { start: Date; end: Date };
    usage: number; // kWh
    cost: number; // $
    demand?: number; // kW
    rate: number; // $/kWh
    utilityProvider: string;
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Normalize account number
  const accountNumber = String(rawData.accountNumber || rawData.account || rawData.accountId || '').replace(/\D/g, '');
  
  // Normalize billing period
  const billingPeriod = normalizeBillingPeriod(rawData.billingPeriod || rawData.period || {
    start: rawData.startDate || rawData.fromDate,
    end: rawData.endDate || rawData.toDate
  });
  
  // Normalize usage (convert to kWh)
  let usage = parseFloat(rawData.usage || rawData.kWh || rawData.consumption || rawData.energy);
  const usageUnit = (rawData.usageUnit || rawData.unit || '').toLowerCase();
  if (usageUnit === 'mwh') {
    usage *= 1000;
  } else if (usageUnit === 'wh') {
    usage /= 1000;
  }
  
  // Normalize cost
  const cost = parseFloat(rawData.cost || rawData.amount || rawData.total || rawData.bill);
  
  // Normalize demand (if applicable)
  let demand: number | undefined;
  if (rawData.demand || rawData.kW || rawData.peakDemand) {
    demand = parseFloat(rawData.demand || rawData.kW || rawData.peakDemand);
  }
  
  // Calculate average rate
  const rate = usage > 0 ? cost / usage : 0;
  
  // Normalize utility provider name
  const utilityProvider = normalizeUtilityName(rawData.utility || rawData.provider || rawData.company || '');
  
  if (!accountNumber) warnings.push('Account number is missing');
  if (!usage || usage <= 0) warnings.push('Usage data is missing or invalid');
  if (!cost || cost <= 0) warnings.push('Cost data is missing or invalid');
  
  return {
    normalized: {
      accountNumber,
      billingPeriod,
      usage: Math.round(usage * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      demand,
      rate: Math.round(rate * 10000) / 10000,
      utilityProvider
    },
    warnings
  };
}

/**
 * Normalize weather and irradiance data
 */
export function normalizeWeatherData(rawData: any): {
  normalized: {
    timestamp: Date;
    location: { latitude: number; longitude: number };
    irradiance: {
      global: number; // W/m²
      direct?: number; // W/m²
      diffuse?: number; // W/m²
    };
    temperature: number; // °C
    windSpeed?: number; // m/s
    humidity?: number; // %
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Normalize timestamp
  const timestamp = normalizeTimestamp(rawData.timestamp || rawData.time || rawData.date);
  
  // Normalize location
  const location = {
    latitude: parseFloat(rawData.latitude || rawData.lat || rawData.location?.lat || 0),
    longitude: parseFloat(rawData.longitude || rawData.lon || rawData.lng || rawData.location?.lng || 0)
  };
  
  // Normalize irradiance (ensure W/m²)
  let global = parseFloat(rawData.irradiance || rawData.ghi || rawData.globalIrradiance || rawData.solar);
  const irradianceUnit = (rawData.irradianceUnit || '').toLowerCase();
  if (irradianceUnit === 'kw/m²') {
    global *= 1000;
  }
  
  const direct = rawData.directIrradiance || rawData.dni ? 
    parseFloat(rawData.directIrradiance || rawData.dni) : undefined;
  const diffuse = rawData.diffuseIrradiance || rawData.dhi ? 
    parseFloat(rawData.diffuseIrradiance || rawData.dhi) : undefined;
  
  // Normalize temperature (convert to Celsius)
  let temperature = parseFloat(rawData.temperature || rawData.temp || rawData.airTemp || 0);
  const tempUnit = (rawData.temperatureUnit || rawData.tempUnit || '').toLowerCase();
  if (tempUnit === 'f' || tempUnit === 'fahrenheit') {
    temperature = (temperature - 32) * 5 / 9;
  } else if (tempUnit === 'k' || tempUnit === 'kelvin') {
    temperature = temperature - 273.15;
  }
  
  // Normalize wind speed (convert to m/s)
  let windSpeed: number | undefined;
  if (rawData.windSpeed || rawData.wind) {
    windSpeed = parseFloat(rawData.windSpeed || rawData.wind);
    const windUnit = (rawData.windUnit || '').toLowerCase();
    if (windUnit === 'mph') {
      windSpeed *= 0.44704; // Convert mph to m/s
    } else if (windUnit === 'km/h') {
      windSpeed *= 0.277778; // Convert km/h to m/s
    }
  }
  
  // Normalize humidity
  let humidity: number | undefined;
  if (rawData.humidity || rawData.rh) {
    humidity = parseFloat(rawData.humidity || rawData.rh);
    if (humidity > 1 && humidity <= 100) {
      // Already in percentage
    } else if (humidity <= 1) {
      humidity *= 100; // Convert decimal to percentage
    }
  }
  
  if (!timestamp || isNaN(timestamp.getTime())) warnings.push('Invalid or missing timestamp');
  if (Math.abs(location.latitude) > 90) warnings.push('Invalid latitude');
  if (Math.abs(location.longitude) > 180) warnings.push('Invalid longitude');
  if (global > 1500) warnings.push('Irradiance value seems unusually high');
  
  return {
    normalized: {
      timestamp,
      location,
      irradiance: {
        global: Math.round(global),
        direct: direct ? Math.round(direct) : undefined,
        diffuse: diffuse ? Math.round(diffuse) : undefined
      },
      temperature: Math.round(temperature * 10) / 10,
      windSpeed: windSpeed ? Math.round(windSpeed * 10) / 10 : undefined,
      humidity: humidity ? Math.round(humidity) : undefined
    },
    warnings
  };
}

// =====================================================
// FINANCIAL DATA NORMALIZATION
// =====================================================

/**
 * Normalize financial incentive data
 */
export function normalizeIncentiveData(rawData: any): {
  normalized: {
    type: 'tax_credit' | 'rebate' | 'performance_payment' | 'grant' | 'loan';
    name: string;
    amount: number; // $ or $/kW
    unit: 'lump_sum' | 'per_watt' | 'per_kwh' | 'percentage';
    eligibility: {
      residential: boolean;
      commercial: boolean;
      systemSizeMin?: number; // kW
      systemSizeMax?: number; // kW
    };
    jurisdiction: 'federal' | 'state' | 'local' | 'utility';
    expirationDate?: Date;
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Normalize incentive type
  const type = normalizeIncentiveType(rawData.type || rawData.category || rawData.kind);
  
  const name = rawData.name || rawData.programName || rawData.title || '';
  
  // Normalize amount
  let amount = parseFloat(rawData.amount || rawData.value || rawData.incentive || 0);
  
  // Normalize unit
  const unit = normalizeIncentiveUnit(rawData.unit || rawData.amountUnit || 'lump_sum');
  
  // Normalize eligibility
  const eligibility = {
    residential: rawData.eligibility?.residential ?? rawData.residential ?? true,
    commercial: rawData.eligibility?.commercial ?? rawData.commercial ?? false,
    systemSizeMin: rawData.eligibility?.systemSizeMin || rawData.minSystemSize,
    systemSizeMax: rawData.eligibility?.systemSizeMax || rawData.maxSystemSize
  };
  
  // Normalize jurisdiction
  const jurisdiction = normalizeJurisdiction(rawData.jurisdiction || rawData.level || rawData.authority);
  
  // Normalize expiration date
  const expirationDate = rawData.expirationDate || rawData.expiry || rawData.endDate ? 
    new Date(rawData.expirationDate || rawData.expiry || rawData.endDate) : undefined;
  
  if (!name) warnings.push('Incentive name is missing');
  if (!amount || amount <= 0) warnings.push('Incentive amount is missing or invalid');
  
  return {
    normalized: {
      type,
      name,
      amount,
      unit,
      eligibility,
      jurisdiction,
      expirationDate
    },
    warnings
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Normalize manufacturer names to standard format
 */
function normalizeManufacturerName(name: string): string {
  if (!name) return '';
  
  const manufacturerMap: Record<string, string> = {
    'canadian solar': 'Canadian Solar',
    'canadian': 'Canadian Solar',
    'jinko': 'JinkoSolar',
    'jinko solar': 'JinkoSolar',
    'trina': 'Trina Solar',
    'trina solar': 'Trina Solar',
    'lg': 'LG Solar',
    'lg solar': 'LG Solar',
    'panasonic': 'Panasonic',
    'solaredge': 'SolarEdge',
    'solar edge': 'SolarEdge',
    'enphase': 'Enphase Energy',
    'sma': 'SMA Solar Technology',
    'fronius': 'Fronius',
    'tesla': 'Tesla Energy',
    'rec': 'REC Solar',
    'q cells': 'Q CELLS',
    'qcells': 'Q CELLS',
    'sunpower': 'SunPower',
    'sun power': 'SunPower'
  };
  
  const normalized = name.toLowerCase().trim();
  return manufacturerMap[normalized] || name.trim();
}

/**
 * Normalize solar panel technology types
 */
function normalizeTechnology(tech: string): string {
  if (!tech) return 'monocrystalline';
  
  const techMap: Record<string, string> = {
    'mono': 'monocrystalline',
    'mono-si': 'monocrystalline',
    'monocrystalline silicon': 'monocrystalline',
    'poly': 'polycrystalline',
    'poly-si': 'polycrystalline',
    'polycrystalline silicon': 'polycrystalline',
    'perc': 'monocrystalline',
    'n-type': 'monocrystalline',
    'heterojunction': 'monocrystalline',
    'thin film': 'thin_film_cdte',
    'a-si': 'thin_film_cigs',
    'cdte': 'thin_film_cdte',
    'cigs': 'thin_film_cigs',
    'bifacial': 'bifacial'
  };
  
  const normalized = tech.toLowerCase().trim();
  return techMap[normalized] || 'monocrystalline';
}

/**
 * Normalize inverter technology types
 */
function normalizeInverterTechnology(tech: string): string {
  if (!tech) return 'string';
  
  const techMap: Record<string, string> = {
    'central': 'central',
    'string': 'string',
    'micro': 'microinverter',
    'microinverter': 'microinverter',
    'power optimizer': 'power_optimizer',
    'optimizer': 'power_optimizer',
    'module level': 'microinverter'
  };
  
  const normalized = tech.toLowerCase().trim();
  return techMap[normalized] || 'string';
}

/**
 * Normalize dimensions from various input formats
 */
function normalizeDimensions(dims: any): { length: number; width: number; thickness: number } {
  let length = parseFloat(dims.length || dims.l || dims.height || dims.h || 0);
  let width = parseFloat(dims.width || dims.w || 0);
  let thickness = parseFloat(dims.thickness || dims.depth || dims.t || dims.d || 0);
  
  // Convert units if needed (assume inches if values are small)
  if (length < 100) length *= 25.4; // Convert inches to mm
  if (width < 100) width *= 25.4;
  if (thickness < 10) thickness *= 25.4;
  
  return {
    length: Math.round(length),
    width: Math.round(width),
    thickness: Math.round(thickness * 10) / 10
  };
}

/**
 * Normalize certifications array
 */
function normalizeCertifications(certs: any): string[] {
  if (!Array.isArray(certs)) {
    if (typeof certs === 'string') {
      certs = certs.split(/[,;|]/).map(s => s.trim());
    } else {
      return [];
    }
  }
  
  const certMap: Record<string, string> = {
    'ul1703': 'UL_1703',
    'ul 1703': 'UL_1703',
    'iec61215': 'IEC_61215',
    'iec 61215': 'IEC_61215',
    'iec61730': 'IEC_61730',
    'iec 61730': 'IEC_61730',
    'ul1741': 'UL_1741',
    'ul 1741': 'UL_1741'
  };
  
  return certs.map((cert: string) => {
    const normalized = cert.toLowerCase().replace(/\s+/g, '');
    return certMap[normalized] || cert.toUpperCase();
  });
}

/**
 * Normalize warranty information
 */
function normalizeWarranty(warranty: any): { performance: number; product: number } {
  return {
    performance: parseInt(warranty.performance || warranty.performanceYears || warranty.power || 25),
    product: parseInt(warranty.product || warranty.productYears || warranty.material || 12)
  };
}

/**
 * Normalize billing period dates
 */
function normalizeBillingPeriod(period: any): { start: Date; end: Date } {
  const start = new Date(period.start || period.from || period.startDate);
  const end = new Date(period.end || period.to || period.endDate);
  
  return { start, end };
}

/**
 * Normalize utility company names
 */
function normalizeUtilityName(name: string): string {
  if (!name) return '';
  
  const utilityMap: Record<string, string> = {
    'pge': 'Pacific Gas & Electric',
    'pg&e': 'Pacific Gas & Electric',
    'sce': 'Southern California Edison',
    'sdge': 'San Diego Gas & Electric',
    'con ed': 'Consolidated Edison',
    'con edison': 'Consolidated Edison',
    'national grid': 'National Grid'
  };
  
  const normalized = name.toLowerCase().trim();
  return utilityMap[normalized] || name.trim();
}

/**
 * Normalize timestamps from various formats
 */
function normalizeTimestamp(timestamp: any): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
}

/**
 * Normalize incentive types
 */
function normalizeIncentiveType(type: string): 'tax_credit' | 'rebate' | 'performance_payment' | 'grant' | 'loan' {
  if (!type) return 'rebate';
  
  const typeMap: Record<string, string> = {
    'tax credit': 'tax_credit',
    'credit': 'tax_credit',
    'itc': 'tax_credit',
    'rebate': 'rebate',
    'cash': 'rebate',
    'performance': 'performance_payment',
    'pbi': 'performance_payment',
    'grant': 'grant',
    'loan': 'loan'
  };
  
  const normalized = type.toLowerCase().trim();
  return (typeMap[normalized] || 'rebate') as any;
}

/**
 * Normalize incentive units
 */
function normalizeIncentiveUnit(unit: string): 'lump_sum' | 'per_watt' | 'per_kwh' | 'percentage' {
  if (!unit) return 'lump_sum';
  
  const unitMap: Record<string, string> = {
    'lump sum': 'lump_sum',
    '$': 'lump_sum',
    'dollar': 'lump_sum',
    'per watt': 'per_watt',
    '$/w': 'per_watt',
    'per kw': 'per_watt',
    '$/kw': 'per_watt',
    'per kwh': 'per_kwh',
    '$/kwh': 'per_kwh',
    'percent': 'percentage',
    '%': 'percentage'
  };
  
  const normalized = unit.toLowerCase().trim();
  return (unitMap[normalized] || 'lump_sum') as any;
}

/**
 * Normalize jurisdiction levels
 */
function normalizeJurisdiction(jurisdiction: string): 'federal' | 'state' | 'local' | 'utility' {
  if (!jurisdiction) return 'state';
  
  const jurisdictionMap: Record<string, string> = {
    'federal': 'federal',
    'national': 'federal',
    'state': 'state',
    'local': 'local',
    'city': 'local',
    'county': 'local',
    'municipal': 'local',
    'utility': 'utility'
  };
  
  const normalized = jurisdiction.toLowerCase().trim();
  return (jurisdictionMap[normalized] || 'state') as any;
}