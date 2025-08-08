/**
 * Equipment Management API Endpoint
 * CRUD operations for solar equipment
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { SolarEquipmentDatabase } from '@/lib/solar/solar-database';
import { 
  solarPanelSpecSchema, 
  inverterSpecSchema, 
  batterySpecSchema 
} from '@/lib/validations/solar-equipment';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await handleGetEquipment(req, res);
    case 'POST':
      return await handleCreateEquipment(req, res);
    case 'PUT':
      return await handleUpdateEquipment(req, res);
    case 'DELETE':
      return await handleDeleteEquipment(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get equipment with filtering and pagination
 */
async function handleGetEquipment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      type,
      manufacturer,
      minWattage,
      maxWattage,
      minEfficiency,
      maxPrice,
      tier,
      availability,
      page = 1,
      limit = 20
    } = req.query;

    let equipment: any[] = [];

    // Get equipment based on type
    switch (type) {
      case 'panels':
        equipment = SolarEquipmentDatabase.getPanels({
          minWattage: minWattage ? Number(minWattage) : undefined,
          maxWattage: maxWattage ? Number(maxWattage) : undefined,
          minEfficiency: minEfficiency ? Number(minEfficiency) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          tier: tier ? Number(tier) as 1 | 2 | 3 : undefined,
          availability: availability as string
        });
        break;
      
      case 'inverters':
        equipment = SolarEquipmentDatabase.getInverters({
          minCapacity: minWattage ? Number(minWattage) : undefined,
          maxCapacity: maxWattage ? Number(maxWattage) : undefined,
          minEfficiency: minEfficiency ? Number(minEfficiency) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          availability: availability as string
        });
        break;
      
      case 'batteries':
        equipment = SolarEquipmentDatabase.getBatteries({
          minCapacity: minWattage ? Number(minWattage) : undefined,
          maxCapacity: maxWattage ? Number(maxWattage) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          availability: availability as string
        });
        break;
      
      default:
        // Return all types
        equipment = [
          ...SolarEquipmentDatabase.getPanels(),
          ...SolarEquipmentDatabase.getInverters(),
          ...SolarEquipmentDatabase.getBatteries()
        ];
    }

    // Apply manufacturer filter
    if (manufacturer) {
      equipment = equipment.filter(e => 
        e.manufacturer.toLowerCase().includes((manufacturer as string).toLowerCase())
      );
    }

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const totalCount = equipment.length;
    const paginatedEquipment = equipment.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedEquipment,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: endIndex < totalCount,
        hasPrev: pageNum > 1
      },
      filters: {
        type,
        manufacturer,
        minWattage,
        maxWattage,
        minEfficiency,
        maxPrice,
        tier,
        availability
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Create new equipment
 */
async function handleCreateEquipment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, ...equipmentData } = req.body;

    // Validate equipment data based on type
    let validatedData;
    switch (type) {
      case 'panel':
        validatedData = solarPanelSpecSchema.parse(equipmentData);
        break;
      case 'inverter':
        validatedData = inverterSpecSchema.parse(equipmentData);
        break;
      case 'battery':
        validatedData = batterySpecSchema.parse(equipmentData);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid equipment type',
          validTypes: ['panel', 'inverter', 'battery']
        });
    }

    // In a real implementation, this would save to database
    // For now, we'll just return the validated data with an ID
    const newEquipment = {
      id: `${type}-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newEquipment,
      message: 'Equipment created successfully'
    });

  } catch (error) {
    console.error('Create equipment error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Update existing equipment
 */
async function handleUpdateEquipment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { type, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Equipment ID is required'
      });
    }

    // Validate updates based on type
    let validatedUpdates;
    switch (type) {
      case 'panel':
        validatedUpdates = solarPanelSpecSchema.partial().parse(updates);
        break;
      case 'inverter':
        validatedUpdates = inverterSpecSchema.partial().parse(updates);
        break;
      case 'battery':
        validatedUpdates = batterySpecSchema.partial().parse(updates);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid equipment type'
        });
    }

    // In a real implementation, this would update the database record
    const updatedEquipment = {
      id,
      ...validatedUpdates,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: updatedEquipment,
      message: 'Equipment updated successfully'
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Delete equipment
 */
async function handleDeleteEquipment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Equipment ID is required'
      });
    }

    // In a real implementation, this would delete from database
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}