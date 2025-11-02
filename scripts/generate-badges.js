const fs = require('fs');
const path = require('path');

function generateBadge(label, value, color) {
  return `![${label}](https://img.shields.io/badge/${label}-${value}%25-${color})`;
}

function getColor(percentage) {
  if (percentage >= 95) return 'brightgreen';
  if (percentage >= 80) return 'green';
  if (percentage >= 60) return 'yellow';
  return 'red';
}

// Read coverage summary
const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coveragePath)) {
  console.error('Coverage summary not found. Please run tests with coverage first.');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

const total = coverage.total;
const badges = [
  generateBadge('Statements', total.statements.pct.toFixed(0), getColor(total.statements.pct)),
  generateBadge('Branches', total.branches.pct.toFixed(0), getColor(total.branches.pct)),
  generateBadge('Functions', total.functions.pct.toFixed(0), getColor(total.functions.pct)),
  generateBadge('Lines', total.lines.pct.toFixed(0), getColor(total.lines.pct))
];

// Update README
const readmePath = path.join(__dirname, '../README.md');

if (!fs.existsSync(readmePath)) {
  console.error('README.md not found.');
  process.exit(1);
}

let readme = fs.readFileSync(readmePath, 'utf8');

// Replace badges section
const badgesMarkdown = `## Test Coverage\n\n${badges.join(' ')}\n`;

// Check if coverage section exists
if (readme.includes('## Test Coverage')) {
  readme = readme.replace(/## Test Coverage[\s\S]*?\n\n/, badgesMarkdown + '\n');
} else {
  // Add coverage section after the first heading
  const firstHeadingEnd = readme.indexOf('\n\n');
  if (firstHeadingEnd !== -1) {
    readme = readme.slice(0, firstHeadingEnd) + '\n\n' + badgesMarkdown + readme.slice(firstHeadingEnd);
  } else {
    readme = badgesMarkdown + '\n\n' + readme;
  }
}

fs.writeFileSync(readmePath, readme);

console.log('Coverage badges updated!');
console.log(badgesMarkdown);
console.log('\nCoverage Summary:');
console.log(`  Statements: ${total.statements.pct.toFixed(2)}%`);
console.log(`  Branches:   ${total.branches.pct.toFixed(2)}%`);
console.log(`  Functions:  ${total.functions.pct.toFixed(2)}%`);
console.log(`  Lines:      ${total.lines.pct.toFixed(2)}%`);
