import { SolarEquipmentDatabase } from '../solar-database';

describe('SolarEquipmentDatabase', () => {
  describe('getPanels', () => {
    it('should return all panels when no criteria provided', () => {
      const panels = SolarEquipmentDatabase.getPanels();
      expect(panels.length).toBeGreaterThan(0);
      expect(panels[0]).toHaveProperty('manufacturer');
      expect(panels[0]).toHaveProperty('wattage');
      expect(panels[0]).toHaveProperty('efficiency');
    });

    it('should filter panels by type', () => {
      const monoPanels = SolarEquipmentDatabase.getPanels({ type: 'monocrystalline' });
      expect(monoPanels.every(panel => panel.type === 'monocrystalline')).toBe(true);
    });

    it('should filter panels by minimum wattage', () => {
      const highWattagePanels = SolarEquipmentDatabase.getPanels({ minWattage: 400 });
      expect(highWattagePanels.every(panel => panel.wattage >= 400)).toBe(true);
    });

    it('should filter panels by minimum efficiency', () => {
      const highEfficiencyPanels = SolarEquipmentDatabase.getPanels({ minEfficiency: 21 });
      expect(highEfficiencyPanels.every(panel => panel.efficiency >= 21)).toBe(true);
    });

    it('should filter panels by maximum price', () => {
      const affordablePanels = SolarEquipmentDatabase.getPanels({ maxPrice: 0.60 });
      expect(affordablePanels.every(panel => panel.pricePerWatt <= 0.60)).toBe(true);
    });

    it('should filter panels by tier', () => {
      const tier1Panels = SolarEquipmentDatabase.getPanels({ tier: 1 });
      expect(tier1Panels.every(panel => panel.tier === 1)).toBe(true);
    });

    it('should filter panels by availability', () => {
      const inStockPanels = SolarEquipmentDatabase.getPanels({ availability: 'in-stock' });
      expect(inStockPanels.every(panel => panel.availability === 'in-stock')).toBe(true);
    });

    it('should return panels sorted by efficiency (highest first)', () => {
      const panels = SolarEquipmentDatabase.getPanels();
      for (let i = 1; i < panels.length; i++) {
        expect(panels[i].efficiency).toBeLessThanOrEqual(panels[i - 1].efficiency);
      }
    });

    it('should apply multiple filters correctly', () => {
      const filteredPanels = SolarEquipmentDatabase.getPanels({
        type: 'monocrystalline',
        minWattage: 400,
        maxPrice: 0.70,
        tier: 1
      });

      expect(filteredPanels.every(panel => 
        panel.type === 'monocrystalline' &&
        panel.wattage >= 400 &&
        panel.pricePerWatt <= 0.70 &&
        panel.tier === 1
      )).toBe(true);
    });
  });

  describe('getInverters', () => {
    it('should return all inverters when no criteria provided', () => {
      const inverters = SolarEquipmentDatabase.getInverters();
      expect(inverters.length).toBeGreaterThan(0);
      expect(inverters[0]).toHaveProperty('manufacturer');
      expect(inverters[0]).toHaveProperty('capacity');
      expect(inverters[0]).toHaveProperty('efficiency');
    });

    it('should filter inverters by type', () => {
      const stringInverters = SolarEquipmentDatabase.getInverters({ type: 'string' });
      expect(stringInverters.every(inv => inv.type === 'string')).toBe(true);
    });

    it('should filter inverters by capacity range', () => {
      const midSizeInverters = SolarEquipmentDatabase.getInverters({ 
        minCapacity: 5000, 
        maxCapacity: 8000 
      });
      expect(midSizeInverters.every(inv => 
        inv.capacity >= 5000 && inv.capacity <= 8000
      )).toBe(true);
    });

    it('should filter inverters by minimum efficiency', () => {
      const efficientInverters = SolarEquipmentDatabase.getInverters({ minEfficiency: 97 });
      expect(efficientInverters.every(inv => inv.efficiency.cec >= 97)).toBe(true);
    });

    it('should return inverters sorted by CEC efficiency (highest first)', () => {
      const inverters = SolarEquipmentDatabase.getInverters();
      for (let i = 1; i < inverters.length; i++) {
        expect(inverters[i].efficiency.cec).toBeLessThanOrEqual(inverters[i - 1].efficiency.cec);
      }
    });
  });

  describe('getBatteries', () => {
    it('should return all batteries when no criteria provided', () => {
      const batteries = SolarEquipmentDatabase.getBatteries();
      expect(batteries.length).toBeGreaterThan(0);
      expect(batteries[0]).toHaveProperty('manufacturer');
      expect(batteries[0]).toHaveProperty('capacity');
      expect(batteries[0]).toHaveProperty('technology');
    });

    it('should filter batteries by technology', () => {
      const lithiumBatteries = SolarEquipmentDatabase.getBatteries({ technology: 'lithium-ion' });
      expect(lithiumBatteries.every(battery => battery.technology === 'lithium-ion')).toBe(true);
    });

    it('should filter batteries by capacity range', () => {
      const largeBatteries = SolarEquipmentDatabase.getBatteries({ 
        minCapacity: 10,
        maxCapacity: 15
      });
      expect(largeBatteries.every(battery => 
        battery.capacity >= 10 && battery.capacity <= 15
      )).toBe(true);
    });

    it('should return batteries sorted by round-trip efficiency (highest first)', () => {
      const batteries = SolarEquipmentDatabase.getBatteries();
      for (let i = 1; i < batteries.length; i++) {
        expect(batteries[i].roundTripEfficiency).toBeLessThanOrEqual(batteries[i - 1].roundTripEfficiency);
      }
    });
  });

  describe('getRecommendedSystem', () => {
    it('should return a complete system recommendation', () => {
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10); // 10kW system

      expect(recommendation).toHaveProperty('panels');
      expect(recommendation).toHaveProperty('inverter');
      expect(recommendation).toHaveProperty('totalCost');
      expect(recommendation).toHaveProperty('systemSize');

      expect(recommendation.panels.length).toBeGreaterThan(0);
      expect(recommendation.inverter).toBeDefined();
      expect(recommendation.totalCost).toBeGreaterThan(0);
      expect(recommendation.systemSize).toBeGreaterThanOrEqual(10);
    });

    it('should include battery when storage is requested', () => {
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10, undefined, {
        includeStorage: true
      });

      expect(recommendation.battery).toBeDefined();
    });

    it('should respect budget constraints', () => {
      const budget = 20000;
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10, budget);

      expect(recommendation.totalCost).toBeLessThanOrEqual(budget);
    });

    it('should respect panel type preferences', () => {
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10, undefined, {
        panelType: 'monocrystalline'
      });

      expect(recommendation.panels[0].type).toBe('monocrystalline');
    });

    it('should respect inverter type preferences', () => {
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10, undefined, {
        inverterType: 'string'
      });

      expect(recommendation.inverter.type).toBe('string');
    });

    it('should only recommend tier 1 panels when requested', () => {
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(10, undefined, {
        tier1Only: true
      });

      expect(recommendation.panels[0].tier).toBe(1);
    });

    it('should calculate appropriate number of panels', () => {
      const targetCapacity = 10; // 10kW
      const recommendation = SolarEquipmentDatabase.getRecommendedSystem(targetCapacity);

      const totalPanelWattage = recommendation.panels.length * recommendation.panels[0].wattage;
      const actualCapacity = totalPanelWattage / 1000;

      expect(actualCapacity).toBeGreaterThanOrEqual(targetCapacity);
      expect(actualCapacity).toBeLessThan(targetCapacity * 1.2); // Not more than 20% oversized
    });
  });

  describe('component lookup methods', () => {
    it('should find panel by ID', () => {
      const panel = SolarEquipmentDatabase.getPanelById('rec-alpha-pure-405');
      expect(panel).toBeDefined();
      expect(panel?.id).toBe('rec-alpha-pure-405');
      expect(panel?.manufacturer).toBe('REC Solar');
    });

    it('should return undefined for non-existent panel ID', () => {
      const panel = SolarEquipmentDatabase.getPanelById('non-existent-id');
      expect(panel).toBeUndefined();
    });

    it('should find inverter by ID', () => {
      const inverter = SolarEquipmentDatabase.getInverterById('solaredge-hd-wave-7600');
      expect(inverter).toBeDefined();
      expect(inverter?.id).toBe('solaredge-hd-wave-7600');
      expect(inverter?.manufacturer).toBe('SolarEdge');
    });

    it('should return undefined for non-existent inverter ID', () => {
      const inverter = SolarEquipmentDatabase.getInverterById('non-existent-id');
      expect(inverter).toBeUndefined();
    });

    it('should find battery by ID', () => {
      const battery = SolarEquipmentDatabase.getBatteryById('tesla-powerwall-2');
      expect(battery).toBeDefined();
      expect(battery?.id).toBe('tesla-powerwall-2');
      expect(battery?.manufacturer).toBe('Tesla');
    });

    it('should return undefined for non-existent battery ID', () => {
      const battery = SolarEquipmentDatabase.getBatteryById('non-existent-id');
      expect(battery).toBeUndefined();
    });
  });

  describe('data integrity', () => {
    it('should have valid panel data', () => {
      const panels = SolarEquipmentDatabase.getPanels();
      
      panels.forEach(panel => {
        expect(panel.id).toBeTruthy();
        expect(panel.manufacturer).toBeTruthy();
        expect(panel.model).toBeTruthy();
        expect(panel.wattage).toBeGreaterThan(0);
        expect(panel.efficiency).toBeGreaterThan(0);
        expect(panel.efficiency).toBeLessThan(50);
        expect(panel.pricePerWatt).toBeGreaterThan(0);
        expect(['monocrystalline', 'polycrystalline', 'thin-film']).toContain(panel.type);
        expect([1, 2, 3]).toContain(panel.tier);
        expect(['in-stock', 'limited', 'discontinued']).toContain(panel.availability);
      });
    });

    it('should have valid inverter data', () => {
      const inverters = SolarEquipmentDatabase.getInverters();
      
      inverters.forEach(inverter => {
        expect(inverter.id).toBeTruthy();
        expect(inverter.manufacturer).toBeTruthy();
        expect(inverter.model).toBeTruthy();
        expect(inverter.capacity).toBeGreaterThan(0);
        expect(inverter.efficiency.peak).toBeGreaterThan(90);
        expect(inverter.efficiency.peak).toBeLessThan(100);
        expect(inverter.efficiency.cec).toBeGreaterThan(90);
        expect(inverter.efficiency.cec).toBeLessThan(100);
        expect(inverter.pricePerWatt).toBeGreaterThan(0);
        expect(['string', 'power-optimizer', 'micro']).toContain(inverter.type);
        expect(['in-stock', 'limited', 'discontinued']).toContain(inverter.availability);
      });
    });

    it('should have valid battery data', () => {
      const batteries = SolarEquipmentDatabase.getBatteries();
      
      batteries.forEach(battery => {
        expect(battery.id).toBeTruthy();
        expect(battery.manufacturer).toBeTruthy();
        expect(battery.model).toBeTruthy();
        expect(battery.capacity).toBeGreaterThan(0);
        expect(battery.power).toBeGreaterThan(0);
        expect(battery.roundTripEfficiency).toBeGreaterThan(80);
        expect(battery.roundTripEfficiency).toBeLessThan(100);
        expect(battery.cycleLife).toBeGreaterThan(1000);
        expect(battery.pricePerKWh).toBeGreaterThan(0);
        expect(['lithium-ion', 'lead-acid', 'saltwater']).toContain(battery.technology);
        expect(['in-stock', 'limited', 'discontinued']).toContain(battery.availability);
      });
    });
  });
});