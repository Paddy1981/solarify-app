#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive test coverage script for Solarify
 * Runs all tests and generates detailed coverage reports
 */

console.log('🧪 Starting comprehensive test coverage analysis...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logSection(title) {
  console.log(`\n${colorize('='.repeat(60), 'cyan')}`);
  console.log(`${colorize(title, 'bright')}`);
  console.log(`${colorize('='.repeat(60), 'cyan')}\n`);
}

function logStep(step) {
  console.log(`${colorize('▶', 'blue')} ${step}`);
}

function logSuccess(message) {
  console.log(`${colorize('✅', 'green')} ${message}`);
}

function logWarning(message) {
  console.log(`${colorize('⚠️', 'yellow')} ${message}`);
}

function logError(message) {
  console.log(`${colorize('❌', 'red')} ${message}`);
}

// Step 1: Run unit tests with coverage
logSection('UNIT TESTS & COVERAGE');

try {
  logStep('Running Jest unit tests with coverage...');
  execSync('npm run test:coverage', { 
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' }
  });
  logSuccess('Unit tests completed successfully');
} catch (error) {
  logError('Unit tests failed');
  console.error(error.message);
  process.exit(1);
}

// Step 2: Parse coverage results
logSection('COVERAGE ANALYSIS');

try {
  const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
  
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const { total } = coverage;
    
    console.log('📊 Coverage Summary:');
    console.log(`   Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
    console.log(`   Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
    console.log(`   Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
    console.log(`   Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
    
    // Check if coverage meets thresholds
    const thresholds = {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    };
    
    let allThresholdsMet = true;
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const actualCoverage = total[metric].pct;
      if (actualCoverage >= threshold) {
        logSuccess(`${metric}: ${actualCoverage}% ≥ ${threshold}%`);
      } else {
        logWarning(`${metric}: ${actualCoverage}% < ${threshold}%`);
        allThresholdsMet = false;
      }
    });
    
    if (allThresholdsMet) {
      logSuccess('All coverage thresholds met! 🎉');
    } else {
      logWarning('Some coverage thresholds not met. Consider adding more tests.');
    }
    
    // Identify files with low coverage
    console.log('\n📋 Files with coverage below 80%:');
    Object.entries(coverage).forEach(([filePath, fileData]) => {
      if (filePath !== 'total' && fileData.lines && fileData.lines.pct < 80) {
        console.log(`   ${filePath}: ${fileData.lines.pct}% lines covered`);
      }
    });
    
  } else {
    logWarning('Coverage summary not found');
  }
} catch (error) {
  logError('Failed to parse coverage results');
  console.error(error.message);
}

// Step 3: Type checking
logSection('TYPE CHECKING');

try {
  logStep('Running TypeScript type checking...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  logSuccess('Type checking passed');
} catch (error) {
  logError('Type checking failed');
  console.error(error.message);
}

// Step 4: Linting
logSection('CODE QUALITY');

try {
  logStep('Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });
  logSuccess('Linting passed');
} catch (error) {
  logWarning('Linting issues found (see output above)');
}

// Step 5: Generate detailed reports
logSection('GENERATING REPORTS');

try {
  logStep('Generating HTML coverage report...');
  const htmlReportPath = path.join(__dirname, '../coverage/lcov-report/index.html');
  
  if (fs.existsSync(htmlReportPath)) {
    logSuccess(`HTML coverage report: file://${htmlReportPath}`);
  } else {
    logWarning('HTML coverage report not generated');
  }
  
  logStep('Generating LCOV report for CI...');
  const lcovPath = path.join(__dirname, '../coverage/lcov.info');
  
  if (fs.existsSync(lcovPath)) {
    logSuccess(`LCOV report: ${lcovPath}`);
  } else {
    logWarning('LCOV report not generated');
  }
  
} catch (error) {
  logError('Failed to generate reports');
  console.error(error.message);
}

// Step 6: Test file statistics
logSection('TEST STATISTICS');

try {
  const testFiles = [];
  
  function findTestFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findTestFiles(filePath);
      } else if (file.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/)) {
        testFiles.push(filePath);
      }
    });
  }
  
  const srcDir = path.join(__dirname, '../src');
  if (fs.existsSync(srcDir)) {
    findTestFiles(srcDir);
  }
  
  const cypressDir = path.join(__dirname, '../cypress');  
  if (fs.existsSync(cypressDir)) {
    findTestFiles(cypressDir);
  }
  
  console.log(`📈 Test File Statistics:`);
  console.log(`   Total test files: ${testFiles.length}`);
  
  const testsByType = {
    unit: testFiles.filter(f => f.includes('__tests__') || f.includes('.test.')).length,
    e2e: testFiles.filter(f => f.includes('cypress')).length,
  };
  
  console.log(`   Unit test files: ${testsByType.unit}`);  
  console.log(`   E2E test files: ${testsByType.e2e}`);
  
  // Estimate test coverage across different areas
  const testAreas = {
    components: testFiles.filter(f => f.includes('components')).length,
    hooks: testFiles.filter(f => f.includes('hooks')).length,
    lib: testFiles.filter(f => f.includes('lib')).length,
    context: testFiles.filter(f => f.includes('context')).length,
  };
  
  console.log(`\n📂 Test Coverage by Area:`);
  Object.entries(testAreas).forEach(([area, count]) => {
    console.log(`   ${area}: ${count} test files`);
  });
  
} catch (error) {
  logError('Failed to analyze test statistics');
  console.error(error.message);
}

// Step 7: Performance testing recommendations
logSection('PERFORMANCE TESTING');

logStep('Checking for performance test setup...');

const performanceChecks = [
  {
    name: 'Bundle analyzer',
    check: () => fs.existsSync(path.join(__dirname, '../analyze-bundle.js')),
    recommendation: 'Run "npm run analyze" to check bundle sizes'
  },
  {
    name: 'Lighthouse CI config',
    check: () => fs.existsSync(path.join(__dirname, '../lighthouserc.js')),
    recommendation: 'Set up Lighthouse CI for automated performance testing'
  },
  {
    name: 'Load testing config',
    check: () => fs.existsSync(path.join(__dirname, '../loadtest.js')),
    recommendation: 'Consider adding load testing with Artillery or k6'
  }
];

performanceChecks.forEach(({ name, check, recommendation }) => {
  if (check()) {
    logSuccess(`${name} is configured`);
  } else {
    logWarning(`${name} not found - ${recommendation}`);
  }
});

// Step 8: Security testing
logSection('SECURITY TESTING');

const securityChecks = [
  {
    name: 'Environment validation',
    check: () => fs.existsSync(path.join(__dirname, '../src/lib/env.ts')),
    status: true
  },
  {
    name: 'Input validation tests',
    check: () => fs.existsSync(path.join(__dirname, '../src/lib/validations/__tests__')),
    status: true
  },
  {
    name: 'Firebase security rules',
    check: () => fs.existsSync(path.join(__dirname, '../firestore.rules')),
    status: true
  }
];

securityChecks.forEach(({ name, check, status }) => {
  if (check()) {
    logSuccess(`${name} implemented`);
  } else {
    logWarning(`${name} not found`);
  }
});

// Final summary
logSection('SUMMARY');

console.log('🎯 Test Coverage Analysis Complete!');
console.log('\n📋 Next Steps:');
console.log('   1. Review HTML coverage report for detailed analysis');
console.log('   2. Add tests for files with low coverage');
console.log('   3. Run E2E tests: npm run e2e');
console.log('   4. Consider performance testing setup');
console.log('   5. Review security test coverage');

console.log(`\n${colorize('Happy testing! 🚀', 'green')}`);

// Exit with appropriate code
process.exit(0);