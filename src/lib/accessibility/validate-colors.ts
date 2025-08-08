/**
 * Color validation script for WCAG 2.1 AA compliance
 * Validates the design system colors against accessibility standards
 */

import { validateDesignSystemColors, generateColorReport } from './color-contrast';

/**
 * Run color validation and generate report
 */
export function validateApplicationColors() {
  console.log('🎨 Running WCAG 2.1 AA Color Contrast Validation...\n');
  
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
    console.log('❌ CRITICAL ISSUES FOUND:');
    violations.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`);
    });
    console.log('\nThese color combinations do not meet WCAG AA standards and must be fixed.\n');
  }
  
  if (warnings.length > 0) {
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
    console.log('✅ PASSING COMBINATIONS:');
    passing.forEach(([name, result]) => {
      console.log(`   ${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`);
    });
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`   Total combinations checked: ${Object.keys(results).length}`);
  console.log(`   Passing (AA/AAA): ${passing.length}`);
  console.log(`   Warnings (large text only): ${warnings.length}`);
  console.log(`   Violations: ${violations.length}`);
  
  const overallCompliance = violations.length === 0 ? 
    (warnings.length === 0 ? 'FULL COMPLIANCE' : 'MOSTLY COMPLIANT') : 
    'NON-COMPLIANT';
    
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