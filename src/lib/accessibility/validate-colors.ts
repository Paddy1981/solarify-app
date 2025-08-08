/**
 * Color validation script for WCAG 2.1 AA compliance
 * Validates the design system colors against accessibility standards
 */

import { validateDesignSystemColors, generateColorReport } from './color-contrast';
import { logger } from '../error-handling/logger';

/**
 * Run color validation and generate report
 */
export function validateApplicationColors() {
  logger.info('Running WCAG 2.1 AA Color Contrast Validation', {
    context: 'accessibility',
    operation: 'validate_colors'
  });
  
  const results = validateDesignSystemColors();
  const report = generateColorReport();
  
  console.log(report);
  
  // Check for violations
  const violations = Object.entries(results).filter(
    ([, result]) => result.grade === 'Fail'
  );
  
  const warnings = Object.entries(results).filter(
    ([, result]) => result.grade === 'A'
  );
  
  if (violations.length > 0) {
    logger.error('Critical color contrast violations found', {
      context: 'accessibility',
      operation: 'validate_colors',
      violationsCount: violations.length,
      violations: violations.map(([name, result]) => ({
        name,
        ratio: result.ratio,
        grade: result.grade
      }))
    });
    console.log('❌ CRITICAL ISSUES FOUND:');
    violations.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`);
    });
    console.log('\nThese color combinations do not meet WCAG AA standards and must be fixed.\n');
  }
  
  if (warnings.length > 0) {
    logger.warn('Color contrast warnings found', {
      context: 'accessibility',
      operation: 'validate_colors',
      warningsCount: warnings.length,
      warnings: warnings.map(([name, result]) => ({
        name,
        ratio: result.ratio,
        grade: result.grade
      }))
    });
    console.log('⚠️  WARNINGS:');
    warnings.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`);
    });
    console.log('\nThese combinations only pass for large text (18pt+ or 14pt+ bold).\n');
  }
  
  const passing = Object.entries(results).filter(
    ([, result]) => result.grade === 'AA' || result.grade === 'AAA'
  );
  
  if (passing.length > 0) {
    logger.info('Color contrast validation passed combinations', {
      context: 'accessibility',
      operation: 'validate_colors',
      passingCount: passing.length
    });
    console.log('✅ PASSING COMBINATIONS:');
    passing.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`);
    });
  }
  
  // Summary
  const overallCompliance = violations.length === 0 ? 
    (warnings.length === 0 ? 'FULL COMPLIANCE' : 'MOSTLY COMPLIANT') : 
    'NON-COMPLIANT';
    
  logger.info('Color contrast validation summary', {
    context: 'accessibility',
    operation: 'validate_colors',
    totalCombinations: Object.keys(results).length,
    passingCount: passing.length,
    warningsCount: warnings.length,
    violationsCount: violations.length,
    overallCompliance
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`   Total combinations checked: ${Object.keys(results).length}`);
  console.log(`   Passing (AA/AAA): ${passing.length}`);
  console.log(`   Warnings (large text only): ${warnings.length}`);
  console.log(`   Violations: ${violations.length}`);
  console.log(`   Overall status: ${overallCompliance}\n`);
  
  return {
    results,
    violations,
    warnings,
    passing,
    compliant: violations.length === 0
  };
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateApplicationColors();
}