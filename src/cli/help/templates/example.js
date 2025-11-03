/**
 * Example Help Template
 * Template for generating example help
 */

const chalk = require('chalk');
const { formatHeader, formatListItem } = require('../formatter');

/**
 * Generate example help
 */
function generateExampleHelp(exampleData) {
  const { title, examples } = exampleData;

  let output = '';

  // Header
  output += formatHeader(title, '📚');
  output += '\n';

  // Examples
  examples.forEach((example, index) => {
    output += formatListItem(index + 1, example.title);
    output += '\n';

    if (example.description) {
      output += chalk.gray(`   ${example.description}\n`);
    }

    output += '\n';
    output += chalk.gray('   $') + ' ' + chalk.white(example.command) + '\n';

    if (example.explanation) {
      output += '\n';
      const explanationLines = example.explanation.split('\n');
      explanationLines.forEach(line => {
        output += chalk.gray(`   ${line}\n`);
      });
    }

    output += '\n';
  });

  return output;
}

module.exports = { generateExampleHelp };
