/**
 * Equipment Search API Endpoint
 * Advanced search with faceted filtering and recommendations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AdvancedSearchEngine, SearchQuery, EquipmentType } from '@/lib/solar/advanced-search-engine';
import { SOLAR_PANELS, INVERTERS, BATTERY_SYSTEMS } from '@/lib/solar/solar-database';
import { 
  MOUNTING_HARDWARE_SAMPLES,
  RACKING_SYSTEMS_SAMPLES,
  ELECTRICAL_COMPONENTS_SAMPLES,
  MONITORING_DEVICES_SAMPLES
} from '@/lib/solar/comprehensive-equipment-database';

// Initialize search engine (would be done once in production)
let searchEngine: AdvancedSearchEngine | null = null;

async function initializeSearchEngine() {
  if (!searchEngine) {
    searchEngine = new AdvancedSearchEngine();
    await searchEngine.initialize({
      panels: SOLAR_PANELS,
      inverters: INVERTERS,
      batteries: BATTERY_SYSTEMS,
      racking: RACKING_SYSTEMS_SAMPLES,
      mounting: MOUNTING_HARDWARE_SAMPLES,
      electrical: ELECTRICAL_COMPONENTS_SAMPLES,
      monitoring: MONITORING_DEVICES_SAMPLES
    });
  }
  return searchEngine;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const engine = await initializeSearchEngine();

    // Parse search query
    const searchQuery: SearchQuery = {
      query: req.body.query,
      category: req.body.category as EquipmentType[],
      manufacturer: req.body.manufacturer,
      filters: req.body.filters || {},
      options: {
        sort: req.body.sort || { field: 'relevance', order: 'desc' },
        pagination: req.body.pagination || { page: 1, limit: 20 },
        includeAlternatives: req.body.includeAlternatives || false,
        includeCompatible: req.body.includeCompatible || false,
        includePricing: req.body.includePricing || false,
        includeAvailability: req.body.includeAvailability || false
      }
    };

    // Perform search
    const results = await engine.search(searchQuery);

    // Return results with metadata
    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });

  } catch (error) {
    console.error('Equipment search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}