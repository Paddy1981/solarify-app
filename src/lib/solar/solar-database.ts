/**
 * Solar Equipment Database
 * Comprehensive database of solar panels, inverters, and system components
 */

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  type: 'monocrystalline' | 'polycrystalline' | 'thin-film';
  wattage: number; // Watts
  efficiency: number; // percentage
  dimensions: {
    length: number; // mm
    width: number; // mm
    thickness: number; // mm
  };
  weight: number; // kg
  temperatureCoefficient: number; // %/°C
  warranty: {
    performance: number; // years
    product: number; // years
  };
  certifications: string[];
  pricePerWatt: number; // USD/W
  availability: 'in-stock' | 'limited' | 'discontinued';
  tier: 1 | 2 | 3; // Tier 1 = Bloomberg Tier 1 manufacturers
}

export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  type: 'string' | 'power-optimizer' | 'micro';
  capacity: number; // Watts AC
  efficiency: {
    peak: number; // percentage
    cec: number; // CEC weighted efficiency
    euro: number; // European efficiency
  };
  inputVoltage: {
    min: number; // V DC
    max: number; // V DC
    nominal: number; // V DC
  };
  mpptChannels: number;
  monitoring: boolean;
  warranty: number; // years
  certifications: string[];
  pricePerWatt: number; // USD/W
  availability: 'in-stock' | 'limited' | 'discontinued';
}

export interface BatteryStorage {
  id: string;
  manufacturer: string;
  model: string;
  technology: 'lithium-ion' | 'lead-acid' | 'saltwater';
  capacity: number; // kWh
  power: number; // kW
  roundTripEfficiency: number; // percentage
  cycleLife: number; // cycles
  warranty: {
    years: number;
    cycles: number;
    capacity: number; // percentage retained
  };
  dimensions: {
    length: number; // mm
    width: number; // mm
    height: number; // mm
  };
  weight: number; // kg
  operatingTemperature: {
    min: number; // °C
    max: number; // °C
  };
  pricePerKWh: number; // USD/kWh
  availability: 'in-stock' | 'limited' | 'discontinued';
}

// Solar panel database
export const SOLAR_PANELS: SolarPanel[] = [
  {
    id: 'rec-alpha-pure-405',
    manufacturer: 'REC Solar',
    model: 'Alpha Pure 405W',
    type: 'monocrystalline',
    wattage: 405,
    efficiency: 21.7,
    dimensions: { length: 2009, width: 1016, thickness: 32 },
    weight: 22.0,
    temperatureCoefficient: -0.26,
    warranty: { performance: 25, product: 20 },
    certifications: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC Listed'],
    pricePerWatt: 0.65,
    availability: 'in-stock',
    tier: 1
  },
  {
    id: 'sunpower-maxeon-3-400',
    manufacturer: 'SunPower',
    model: 'Maxeon 3 400W',
    type: 'monocrystalline',
    wattage: 400,
    efficiency: 22.6,
    dimensions: { length: 2067, width: 1046, thickness: 40 },
    weight: 24.5,
    temperatureCoefficient: -0.29,
    warranty: { performance: 25, product: 25 },
    certifications: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC Listed'],
    pricePerWatt: 0.85,
    availability: 'in-stock',
    tier: 1
  },
  {
    id: 'qcells-qpeak-duo-l-g10-415',
    manufacturer: 'Q CELLS',
    model: 'Q.PEAK DUO L-G10.3 415W',
    type: 'monocrystalline',
    wattage: 415,
    efficiency: 20.6,
    dimensions: { length: 2108, width: 1048, thickness: 32 },
    weight: 22.5,
    temperatureCoefficient: -0.34,
    warranty: { performance: 25, product: 12 },
    certifications: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC Listed'],
    pricePerWatt: 0.55,
    availability: 'in-stock',
    tier: 1
  },
  {
    id: 'jinko-tiger-neo-420',
    manufacturer: 'JinkoSolar',
    model: 'Tiger Neo 420W',
    type: 'monocrystalline',
    wattage: 420,
    efficiency: 21.25,
    dimensions: { length: 2094, width: 1038, thickness: 30 },
    weight: 21.5,
    temperatureCoefficient: -0.30,
    warranty: { performance: 25, product: 12 },
    certifications: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC Listed'],
    pricePerWatt: 0.50,
    availability: 'in-stock',
    tier: 1
  },
  {
    id: 'canadian-solar-hiku6-410',
    manufacturer: 'Canadian Solar',
    model: 'HiKu6 410W',
    type: 'monocrystalline',
    wattage: 410,
    efficiency: 20.7,
    dimensions: { length: 2108, width: 1048, thickness: 32 },
    weight: 22.0,
    temperatureCoefficient: -0.35,
    warranty: { performance: 25, product: 12 },
    certifications: ['IEC 61215', 'IEC 61730', 'UL 1703', 'CEC Listed'],
    pricePerWatt: 0.48,
    availability: 'in-stock',
    tier: 1
  }
];

// Inverter database
export const INVERTERS: Inverter[] = [
  {
    id: 'solaredge-hd-wave-7600',
    manufacturer: 'SolarEdge',
    model: 'HD-Wave 7600W',
    type: 'power-optimizer',
    capacity: 7600,
    efficiency: { peak: 99.0, cec: 97.5, euro: 98.0 },
    inputVoltage: { min: 125, max: 1000, nominal: 400 },
    mpptChannels: 1,
    monitoring: true,
    warranty: 12,
    certifications: ['UL 1741', 'IEEE 1547', 'CEC Listed'],
    pricePerWatt: 0.35,
    availability: 'in-stock'
  },
  {
    id: 'enphase-iq8plus',
    manufacturer: 'Enphase',
    model: 'IQ8+ Microinverter',
    type: 'micro',
    capacity: 290,
    efficiency: { peak: 97.0, cec: 96.5, euro: 96.8 },
    inputVoltage: { min: 16, max: 60, nominal: 40 },
    mpptChannels: 1,
    monitoring: true,
    warranty: 25,
    certifications: ['UL 1741', 'IEEE 1547', 'CEC Listed'],
    pricePerWatt: 0.45,
    availability: 'in-stock'
  },
  {
    id: 'sma-sunny-boy-7700',
    manufacturer: 'SMA',
    model: 'Sunny Boy 7.7kW',
    type: 'string',
    capacity: 7700,
    efficiency: { peak: 98.0, cec: 97.0, euro: 97.5 },
    inputVoltage: { min: 100, max: 1000, nominal: 580 },
    mpptChannels: 2,
    monitoring: true,
    warranty: 10,
    certifications: ['UL 1741', 'IEEE 1547', 'CEC Listed'],
    pricePerWatt: 0.25,
    availability: 'in-stock'
  },
  {
    id: 'fronius-primo-8.2',
    manufacturer: 'Fronius',
    model: 'Primo 8.2kW',
    type: 'string',
    capacity: 8200,
    efficiency: { peak: 98.1, cec: 97.0, euro: 97.3 },
    inputVoltage: { min: 80, max: 1000, nominal: 580 },
    mpptChannels: 2,
    monitoring: true,
    warranty: 10,
    certifications: ['UL 1741', 'IEEE 1547', 'CEC Listed'],
    pricePerWatt: 0.28,
    availability: 'in-stock'
  }
];

// Battery storage database
export const BATTERY_SYSTEMS: BatteryStorage[] = [
  {
    id: 'tesla-powerwall-2',
    manufacturer: 'Tesla',
    model: 'Powerwall 2',
    technology: 'lithium-ion',
    capacity: 13.5,
    power: 5.0,
    roundTripEfficiency: 90,
    cycleLife: 4000,
    warranty: { years: 10, cycles: 4000, capacity: 70 },
    dimensions: { length: 1150, width: 755, height: 155 },
    weight: 114,
    operatingTemperature: { min: -20, max: 50 },
    pricePerKWh: 550,
    availability: 'limited'
  },
  {
    id: 'lg-resu10h',
    manufacturer: 'LG Chem',
    model: 'RESU10H',
    technology: 'lithium-ion',
    capacity: 9.8,
    power: 5.0,
    roundTripEfficiency: 95,
    cycleLife: 6000,
    warranty: { years: 10, cycles: 6000, capacity: 70 },
    dimensions: { length: 452, width: 226, height: 690 },
    weight: 98,
    operatingTemperature: { min: -10, max: 45 },
    pricePerKWh: 600,
    availability: 'in-stock'
  },
  {
    id: 'enphase-iq-battery-10',
    manufacturer: 'Enphase',
    model: 'IQ Battery 10',
    technology: 'lithium-ion',
    capacity: 10.08,
    power: 3.84,
    roundTripEfficiency: 89,
    cycleLife: 4000,
    warranty: { years: 10, cycles: 4000, capacity: 70 },
    dimensions: { length: 1050, width: 340, height: 175 },
    weight: 105,
    operatingTemperature: { min: -15, max: 55 },
    pricePerKWh: 700,
    availability: 'in-stock'
  }
];

/**
 * Solar equipment database service
 */
export class SolarEquipmentDatabase {
  /**
   * Get solar panels by criteria
   */
  public static getPanels(criteria?: {
    type?: string;
    minWattage?: number;
    maxWattage?: number;
    minEfficiency?: number;
    maxPrice?: number;
    tier?: number;
    availability?: string;
  }): SolarPanel[] {
    let panels = SOLAR_PANELS;

    if (criteria) {
      if (criteria.type) {
        panels = panels.filter(p => p.type === criteria.type);
      }
      if (criteria.minWattage) {
        panels = panels.filter(p => p.wattage >= criteria.minWattage!);
      }
      if (criteria.maxWattage) {
        panels = panels.filter(p => p.wattage <= criteria.maxWattage!);
      }
      if (criteria.minEfficiency) {
        panels = panels.filter(p => p.efficiency >= criteria.minEfficiency!);
      }
      if (criteria.maxPrice) {
        panels = panels.filter(p => p.pricePerWatt <= criteria.maxPrice!);
      }
      if (criteria.tier) {
        panels = panels.filter(p => p.tier === criteria.tier);
      }
      if (criteria.availability) {
        panels = panels.filter(p => p.availability === criteria.availability);
      }
    }

    return panels.sort((a, b) => b.efficiency - a.efficiency);
  }

  /**
   * Get inverters by criteria
   */
  public static getInverters(criteria?: {
    type?: string;
    minCapacity?: number;
    maxCapacity?: number;
    minEfficiency?: number;
    maxPrice?: number;
    availability?: string;
  }): Inverter[] {
    let inverters = INVERTERS;

    if (criteria) {
      if (criteria.type) {
        inverters = inverters.filter(i => i.type === criteria.type);
      }
      if (criteria.minCapacity) {
        inverters = inverters.filter(i => i.capacity >= criteria.minCapacity!);
      }
      if (criteria.maxCapacity) {
        inverters = inverters.filter(i => i.capacity <= criteria.maxCapacity!);
      }
      if (criteria.minEfficiency) {
        inverters = inverters.filter(i => i.efficiency.cec >= criteria.minEfficiency!);
      }
      if (criteria.maxPrice) {
        inverters = inverters.filter(i => i.pricePerWatt <= criteria.maxPrice!);
      }
      if (criteria.availability) {
        inverters = inverters.filter(i => i.availability === criteria.availability);
      }
    }

    return inverters.sort((a, b) => b.efficiency.cec - a.efficiency.cec);
  }

  /**
   * Get battery systems by criteria
   */
  public static getBatteries(criteria?: {
    technology?: string;
    minCapacity?: number;
    maxCapacity?: number;
    minPower?: number;
    maxPrice?: number;
    availability?: string;
  }): BatteryStorage[] {
    let batteries = BATTERY_SYSTEMS;

    if (criteria) {
      if (criteria.technology) {
        batteries = batteries.filter(b => b.technology === criteria.technology);
      }
      if (criteria.minCapacity) {
        batteries = batteries.filter(b => b.capacity >= criteria.minCapacity!);
      }
      if (criteria.maxCapacity) {
        batteries = batteries.filter(b => b.capacity <= criteria.maxCapacity!);
      }
      if (criteria.minPower) {
        batteries = batteries.filter(b => b.power >= criteria.minPower!);
      }
      if (criteria.maxPrice) {
        batteries = batteries.filter(b => b.pricePerKWh <= criteria.maxPrice!);
      }
      if (criteria.availability) {
        batteries = batteries.filter(b => b.availability === criteria.availability);
      }
    }

    return batteries.sort((a, b) => b.roundTripEfficiency - a.roundTripEfficiency);
  }

  /**
   * Get recommended system configuration
   */
  public static getRecommendedSystem(
    targetCapacity: number, // kW
    budget?: number, // USD
    preferences?: {
      panelType?: string;
      inverterType?: string;
      includeStorage?: boolean;
      tier1Only?: boolean;
    }
  ): {
    panels: SolarPanel[];
    inverter: Inverter;
    battery?: BatteryStorage;
    totalCost: number;
    systemSize: number;
  } {
    const prefs = preferences || {};
    
    // Find suitable panels
    const panelCriteria = {
      type: prefs.panelType,
      tier: prefs.tier1Only ? 1 : undefined,
      availability: 'in-stock'
    };
    const availablePanels = this.getPanels(panelCriteria);
    
    // Select optimal panel based on efficiency and cost
    const selectedPanel = availablePanels.find(p => 
      budget ? (targetCapacity * 1000 * p.pricePerWatt <= budget * 0.7) : true
    ) || availablePanels[0];

    // Calculate number of panels needed
    const panelCount = Math.ceil((targetCapacity * 1000) / selectedPanel.wattage);
    const actualSystemSize = (panelCount * selectedPanel.wattage) / 1000;

    // Find suitable inverter
    const inverterCriteria = {
      type: prefs.inverterType,
      minCapacity: actualSystemSize * 800, // 80% of DC capacity
      maxCapacity: actualSystemSize * 1200, // 120% of DC capacity
      availability: 'in-stock'
    };
    const availableInverters = this.getInverters(inverterCriteria);
    const selectedInverter = availableInverters[0];

    // Calculate costs
    const panelCost = panelCount * selectedPanel.wattage * selectedPanel.pricePerWatt;
    const inverterCost = selectedInverter.capacity * selectedInverter.pricePerWatt;
    let batteryCost = 0;
    let selectedBattery: BatteryStorage | undefined;

    if (prefs.includeStorage) {
      const batteries = this.getBatteries({ availability: 'in-stock' });
      if (batteries.length > 0) {
        selectedBattery = batteries[0];
        batteryCost = selectedBattery.capacity * selectedBattery.pricePerKWh;
      }
    }

    return {
      panels: Array(panelCount).fill(selectedPanel),
      inverter: selectedInverter,
      battery: selectedBattery,
      totalCost: panelCost + inverterCost + batteryCost,
      systemSize: actualSystemSize
    };
  }

  /**
   * Get panel by ID
   */
  public static getPanelById(id: string): SolarPanel | undefined {
    return SOLAR_PANELS.find(p => p.id === id);
  }

  /**
   * Get inverter by ID
   */
  public static getInverterById(id: string): Inverter | undefined {
    return INVERTERS.find(i => i.id === id);
  }

  /**
   * Get battery by ID
   */
  public static getBatteryById(id: string): BatteryStorage | undefined {
    return BATTERY_SYSTEMS.find(b => b.id === id);
  }
}