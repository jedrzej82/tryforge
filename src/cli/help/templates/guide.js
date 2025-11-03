/**
 * Guide Help Template
 * Template for generating guide help
 */

const chalk = require('chalk');
const { formatHeader, formatSubheader, formatSteps } = require('../formatter');

/**
 * Generate guide help
 */
function generateGuideHelp(guideData) {
  const { title, emoji, sections } = guideData;

  let output = '';

  // Header
  output += formatHeader(title, emoji);
  output += '\n';

  // Sections
  sections.forEach(section => {
    output += formatSubheader(section.title + '\n');

    if (section.content) {
      if (typeof section.content === 'string') {
        output += chalk.gray(`  ${section.content}\n\n`);
      } else if (Array.isArray(section.content)) {
        output += formatSteps(section.content) + '\n';
      }
    }

    if (section.items) {
      section.items.forEach(item => {
        output += chalk.gray(`  • ${item}\n`);
      });
      output += '\n';
    }
  });

  return output;
}

module.exports = { generateGuideHelp };
