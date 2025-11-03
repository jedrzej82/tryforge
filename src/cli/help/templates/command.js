/**
 * Command Help Template
 * Template for generating command help
 */

const chalk = require('chalk');
const { formatHeader, formatSubheader, formatCommand, formatOption } = require('../formatter');

/**
 * Generate command help
 */
function generateCommandHelp(command) {
  const { name, description, usage, options, examples, relatedCommands } = command;

  let output = '';

  // Header
  output += formatHeader(name, '📝');
  output += '\n';

  // Description
  output += formatSubheader('DESCRIPTION\n');
  output += chalk.gray(`  ${description}\n\n`);

  // Usage
  output += formatSubheader('USAGE\n');
  if (Array.isArray(usage)) {
    usage.forEach(u => {
      output += formatCommand(u) + '\n';
    });
  } else {
    output += formatCommand(usage) + '\n';
  }
  output += '\n';

  // Options
  if (options && options.length > 0) {
    output += formatSubheader('OPTIONS\n');
    options.forEach(opt => {
      output += formatOption(opt.flag, opt.description, opt.default) + '\n';
    });
    output += '\n';
  }

  // Examples
  if (examples && examples.length > 0) {
    output += formatSubheader('EXAMPLES\n');
    examples.forEach(example => {
      output += chalk.white(`  ${example.description}\n`);
      output += formatCommand(example.command) + '\n\n';
    });
  }

  // Related Commands
  if (relatedCommands && relatedCommands.length > 0) {
    output += formatSubheader('RELATED COMMANDS\n');
    relatedCommands.forEach(cmd => {
      output += chalk.gray(`  • ${chalk.cyan(cmd)}\n`);
    });
    output += '\n';
  }

  return output;
}

module.exports = { generateCommandHelp };
