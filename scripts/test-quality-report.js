const fs = require('fs');
const path = require('path');

function generateReport() {
  const testResultsDir = path.join(__dirname, '../test-results');
  const coverageDir = path.join(__dirname, '../coverage');

  // Ensure directories exist
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Initialize default values
  let unitResults = {
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    testDuration: 0
  };

  let integrationResults = {
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    testDuration: 0
  };

  let e2eResults = {
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    testDuration: 0
  };

  let coverage = {
    total: {
      statements: { pct: 0 },
      branches: { pct: 0 },
      functions: { pct: 0 },
      lines: { pct: 0 }
    }
  };

  // Read test results if they exist
  const unitPath = path.join(testResultsDir, 'unit-results.json');
  const integrationPath = path.join(testResultsDir, 'integration-results.json');
  const e2ePath = path.join(testResultsDir, 'e2e-results.json');
  const coveragePath = path.join(coverageDir, 'coverage-summary.json');

  if (fs.existsSync(unitPath)) {
    unitResults = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
  }

  if (fs.existsSync(integrationPath)) {
    integrationResults = JSON.parse(fs.readFileSync(integrationPath, 'utf8'));
  }

  if (fs.existsSync(e2ePath)) {
    e2eResults = JSON.parse(fs.readFileSync(e2ePath, 'utf8'));
  }

  if (fs.existsSync(coveragePath)) {
    coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      unit: {
        total: unitResults.numTotalTests,
        passed: unitResults.numPassedTests,
        failed: unitResults.numFailedTests,
        duration: unitResults.testDuration
      },
      integration: {
        total: integrationResults.numTotalTests,
        passed: integrationResults.numPassedTests,
        failed: integrationResults.numFailedTests,
        duration: integrationResults.testDuration
      },
      e2e: {
        total: e2eResults.numTotalTests,
        passed: e2eResults.numPassedTests,
        failed: e2eResults.numFailedTests,
        duration: e2eResults.testDuration
      }
    },
    coverage: {
      statements: coverage.total.statements.pct,
      branches: coverage.total.branches.pct,
      functions: coverage.total.functions.pct,
      lines: coverage.total.lines.pct
    },
    qualityGate: {
      passed: coverage.total.lines.pct >= 80,
      threshold: 80,
      actual: coverage.total.lines.pct
    }
  };

  // Calculate totals
  const totalTests = report.summary.unit.total +
                     report.summary.integration.total +
                     report.summary.e2e.total;

  const totalPassed = report.summary.unit.passed +
                      report.summary.integration.passed +
                      report.summary.e2e.passed;

  const totalFailed = report.summary.unit.failed +
                      report.summary.integration.failed +
                      report.summary.e2e.failed;

  // Write report
  fs.writeFileSync(
    path.join(testResultsDir, 'quality-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log('\n=== Test Quality Report ===\n');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nTests:`);
  console.log(`  Total:  ${totalTests}`);
  console.log(`  Passed: ${totalPassed}`);
  console.log(`  Failed: ${totalFailed}`);

  console.log(`\nUnit Tests:`);
  console.log(`  Total:    ${report.summary.unit.total}`);
  console.log(`  Passed:   ${report.summary.unit.passed}`);
  console.log(`  Failed:   ${report.summary.unit.failed}`);
  console.log(`  Duration: ${report.summary.unit.duration}ms`);

  console.log(`\nIntegration Tests:`);
  console.log(`  Total:    ${report.summary.integration.total}`);
  console.log(`  Passed:   ${report.summary.integration.passed}`);
  console.log(`  Failed:   ${report.summary.integration.failed}`);
  console.log(`  Duration: ${report.summary.integration.duration}ms`);

  console.log(`\nE2E Tests:`);
  console.log(`  Total:    ${report.summary.e2e.total}`);
  console.log(`  Passed:   ${report.summary.e2e.passed}`);
  console.log(`  Failed:   ${report.summary.e2e.failed}`);
  console.log(`  Duration: ${report.summary.e2e.duration}ms`);

  console.log(`\nCoverage:`);
  console.log(`  Statements: ${report.coverage.statements.toFixed(2)}%`);
  console.log(`  Branches:   ${report.coverage.branches.toFixed(2)}%`);
  console.log(`  Functions:  ${report.coverage.functions.toFixed(2)}%`);
  console.log(`  Lines:      ${report.coverage.lines.toFixed(2)}%`);

  console.log(`\nQuality Gate:`);
  console.log(`  Status:    ${report.qualityGate.passed ? 'PASSED' : 'FAILED'}`);
  console.log(`  Threshold: ${report.qualityGate.threshold}%`);
  console.log(`  Actual:    ${report.qualityGate.actual.toFixed(2)}%`);
  console.log('');

  return report;
}

// Run if called directly
if (require.main === module) {
  try {
    generateReport();
  } catch (error) {
    console.error('Error generating test quality report:', error.message);
    process.exit(1);
  }
}

module.exports = generateReport;
