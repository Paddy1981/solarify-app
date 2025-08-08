/**
 * Equipment Pricing API Endpoint
 * Real-time pricing, availability, and cost optimization
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PricingAvailabilityManager } from '@/lib/solar/pricing-availability-manager';
import { z } from 'zod';

const pricingRequestSchema = z.object({
  equipmentIds: z.array(z.string()).min(1),
  quantity: z.number().min(1).default(1),
  customerType: z.enum(['retail', 'installer', 'distributor']).default('retail'),
  location: z.string().optional(),
  includeComparison: z.boolean().default(false),
  includeForecasting: z.boolean().default(false)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedRequest = pricingRequestSchema.parse(req.body);
    const { 
      equipmentIds, 
      quantity, 
      customerType, 
      location,
      includeComparison,
      includeForecasting
    } = validatedRequest;

    const pricingManager = new PricingAvailabilityManager();
    const results = [];

    // Get pricing and availability for each equipment
    for (const equipmentId of equipmentIds) {
      try {
        // Get current pricing
        const pricing = await pricingManager.getCurrentPricing(equipmentId, quantity, customerType);
        const availability = await pricingManager.getAvailability(equipmentId, location);

        let comparison = null;
        let trends = null;

        // Include price comparison if requested
        if (includeComparison) {
          comparison = await pricingManager.comparePrices(equipmentId, quantity, customerType);
        }

        // Include price trends if requested
        if (includeForecasting) {
          trends = await pricingManager.getPriceTrends(equipmentId, 'month');
        }

        results.push({
          equipmentId,
          pricing,
          availability,
          comparison: includeComparison ? comparison : undefined,
          trends: includeForecasting ? trends : undefined,
          totalCost: pricing ? pricing.pricing.pricePerUnit * quantity : null,
          savings: pricing ? calculatePotentialSavings(pricing, quantity) : null
        });

      } catch (error) {
        console.warn(`Failed to get pricing for equipment ${equipmentId}:`, error);
        results.push({
          equipmentId,
          error: 'Unable to fetch pricing data',
          pricing: null,
          availability: null
        });
      }
    }

    // Generate bulk pricing analysis
    const bulkAnalysis = generateBulkPricingAnalysis(results, quantity);

    // Generate cost optimization recommendations
    const optimizations = generateCostOptimizations(results, quantity, customerType);

    res.status(200).json({
      success: true,
      data: {
        results,
        summary: {
          totalEquipment: equipmentIds.length,
          totalCost: results.reduce((sum, r) => sum + (r.totalCost || 0), 0),
          averageLeadTime: calculateAverageLeadTime(results),
          inStockItems: results.filter(r => r.availability?.inventory.status === 'in-stock').length,
          bulkAnalysis,
          optimizations
        },
        requestParams: {
          quantity,
          customerType,
          location,
          includeComparison,
          includeForecasting
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pricing API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
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
 * Calculate potential savings based on quantity breaks
 */
function calculatePotentialSavings(pricing: any, quantity: number) {
  if (!pricing.pricing.quantityBreaks || pricing.pricing.quantityBreaks.length === 0) {
    return null;
  }

  const currentPrice = pricing.pricing.pricePerUnit * quantity;
  const savings = [];

  for (const qtyBreak of pricing.pricing.quantityBreaks) {
    if (qtyBreak.minQuantity > quantity) {
      const savingsPerUnit = pricing.pricing.pricePerUnit - qtyBreak.pricePerUnit;
      const additionalQuantity = qtyBreak.minQuantity - quantity;
      const totalSavings = savingsPerUnit * qtyBreak.minQuantity;

      savings.push({
        tier: qtyBreak.minQuantity,
        additionalQuantity,
        pricePerUnit: qtyBreak.pricePerUnit,
        totalSavings,
        percentSavings: (totalSavings / currentPrice) * 100,
        additionalInvestment: qtyBreak.pricePerUnit * additionalQuantity
      });
    }
  }

  return savings;
}

/**
 * Generate bulk pricing analysis
 */
function generateBulkPricingAnalysis(results: any[], quantity: number) {
  const totalValue = results.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const availableItems = results.filter(r => r.availability?.inventory.status === 'in-stock');
  
  // Calculate bulk discount opportunities
  const bulkOpportunities = [];
  for (const result of results) {
    if (result.pricing?.pricing.quantityBreaks) {
      const nextTier = result.pricing.pricing.quantityBreaks.find(
        (qb: any) => qb.minQuantity > quantity
      );
      if (nextTier) {
        bulkOpportunities.push({
          equipmentId: result.equipmentId,
          currentQuantity: quantity,
          nextTier: nextTier.minQuantity,
          potentialSavings: (result.pricing.pricing.pricePerUnit - nextTier.pricePerUnit) * nextTier.minQuantity
        });
      }
    }
  }

  return {
    totalValue,
    averagePricePerItem: totalValue / results.length,
    availability: {
      inStock: availableItems.length,
      total: results.length,
      percentage: (availableItems.length / results.length) * 100
    },
    bulkOpportunities: bulkOpportunities.slice(0, 3), // Top 3 opportunities
    volumeDiscountPotential: bulkOpportunities.reduce((sum, bo) => sum + bo.potentialSavings, 0)
  };
}

/**
 * Generate cost optimization recommendations
 */
function generateCostOptimizations(results: any[], quantity: number, customerType: string) {
  const recommendations = [];

  // Alternative supplier recommendations
  const alternativeSuppliers = results
    .filter(r => r.comparison && r.comparison.length > 1)
    .map(r => ({
      equipmentId: r.equipmentId,
      alternatives: r.comparison.slice(1, 3).map((alt: any) => ({
        supplier: alt.supplier.name,
        price: alt.totalCost,
        savings: r.totalCost - alt.totalCost,
        leadTime: alt.deliveryTime
      }))
    }))
    .filter(r => r.alternatives.some(alt => alt.savings > 0));

  if (alternativeSuppliers.length > 0) {
    recommendations.push({
      type: 'alternative_suppliers',
      title: 'Alternative Supplier Savings',
      description: 'Consider these suppliers for potential cost savings',
      items: alternativeSuppliers,
      totalPotentialSavings: alternativeSuppliers.reduce((sum, as) => 
        sum + Math.max(...as.alternatives.map(alt => alt.savings)), 0
      )
    });
  }

  // Quantity optimization
  const quantityOptimizations = results
    .filter(r => r.savings && r.savings.length > 0)
    .map(r => ({
      equipmentId: r.equipmentId,
      currentCost: r.totalCost,
      optimizations: r.savings.slice(0, 2)
    }));

  if (quantityOptimizations.length > 0) {
    recommendations.push({
      type: 'quantity_optimization',
      title: 'Volume Purchase Savings',
      description: 'Increase quantities to access volume discounts',
      items: quantityOptimizations
    });
  }

  // Timing recommendations based on trends
  const timingRecommendations = results
    .filter(r => r.trends && r.trends.trend === 'decreasing')
    .map(r => ({
      equipmentId: r.equipmentId,
      trend: r.trends.trend,
      recommendation: 'Consider delaying purchase as prices are trending downward',
      potentialSavings: r.trends.forecast[0]?.predictedPrice ? 
        r.totalCost - (r.trends.forecast[0].predictedPrice * quantity) : 0
    }));

  if (timingRecommendations.length > 0) {
    recommendations.push({
      type: 'timing_optimization',
      title: 'Purchase Timing Recommendations',
      description: 'Optimize purchase timing based on price trends',
      items: timingRecommendations
    });
  }

  // Customer type upgrades
  if (customerType === 'retail') {
    recommendations.push({
      type: 'customer_type_upgrade',
      title: 'Professional Account Benefits',
      description: 'Consider upgrading to installer or distributor account for better pricing',
      estimatedSavings: results.reduce((sum, r) => sum + (r.totalCost * 0.15), 0), // Estimated 15% savings
      benefits: [
        'Volume pricing tiers',
        'Extended payment terms',
        'Technical support',
        'Priority availability'
      ]
    });
  }

  return recommendations;
}

/**
 * Calculate average lead time
 */
function calculateAverageLeadTime(results: any[]): number {
  const leadTimes = results
    .filter(r => r.availability?.inventory.leadTime)
    .map(r => r.availability.inventory.leadTime);
  
  if (leadTimes.length === 0) return 0;
  
  return leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;
}