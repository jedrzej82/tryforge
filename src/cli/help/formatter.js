/**
 * TryForge Help Formatter
 * Provides formatting utilities for help content
 */

const chalk = require('chalk');
const boxen = require('boxen');
const terminalLink = require('terminal-link');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

// Configure marked with terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer()
});

/**
 * Format a section header
 */
function formatHeader(text, emoji = '') {
  const content = emoji ? `${emoji} ${text}` : text;
  return chalk.cyan.bold(`\n${content}\n`);
}

/**
 * Format a subsection header
 */
function formatSubheader(text) {
  return chalk.white.bold(text);
}

/**
 * Format command syntax
 */
function formatCommand(command, options = {}) {
  const { highlight = true } = options;

  if (!highlight) {
    return chalk.gray(`  $ ${command}`);
  }

  // Parse and highlight command parts
  const parts = command.split(' ');
  const cmd = chalk.cyan(parts[0]);
  const args = parts.slice(1).map(part => {
    if (part.startsWith('--') || part.startsWith('-')) {
      return chalk.yellow(part);
    } else if (part.startsWith('<') && part.endsWith('>')) {
      return chalk.green(part);
    } else if (part.startsWith('[') && part.endsWith(']')) {
      return chalk.gray(part);
    }
    return chalk.white(part);
  });

  return `  $ ${cmd} ${args.join(' ')}`;
}

/**
 * Format an option/flag
 */
function formatOption(flag, description, defaultValue = null) {
  const flagText = chalk.yellow(flag.padEnd(25));
  const descText = chalk.gray(description);
  const defText = defaultValue ? chalk.dim(` (default: ${defaultValue})`) : '';
  return `  ${flagText} ${descText}${defText}`;
}

/**
 * Format a list item
 */
function formatListItem(number, title, description = '') {
  const num = chalk.cyan.bold(`${number}`);
  const titleText = chalk.white(title);
  const descText = description ? chalk.gray(`\n     ${description}`) : '';
  return `${num}  ${titleText}${descText}`;
}

/**
 * Format a code block
 */
function formatCodeBlock(code, language = 'bash') {
  const lines = code.trim().split('\n');
  const formatted = lines.map(line => {
    if (line.startsWith('#')) {
      return chalk.gray(line);
    } else if (line.startsWith('$')) {
      return chalk.cyan(line);
    }
    return chalk.white(line);
  }).join('\n');

  return `\n${chalk.gray('```')}\n${formatted}\n${chalk.gray('```')}\n`;
}

/**
 * Format a table
 */
function formatTable(headers, rows) {
  const colWidths = headers.map((header, i) => {
    const maxContentWidth = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return Math.min(maxContentWidth, 40);
  });

  const headerRow = headers.map((header, i) =>
    chalk.cyan.bold(header.padEnd(colWidths[i]))
  ).join('  ');

  const separator = colWidths.map(width => '-'.repeat(width)).join('  ');

  const dataRows = rows.map(row =>
    row.map((cell, i) => {
      const text = String(cell || '');
      const truncated = text.length > colWidths[i]
        ? text.substring(0, colWidths[i] - 3) + '...'
        : text;
      return chalk.gray(truncated.padEnd(colWidths[i]));
    }).join('  ')
  ).join('\n  ');

  return `\n  ${headerRow}\n  ${separator}\n  ${dataRows}\n`;
}

/**
 * Format a link
 */
function formatLink(text, url) {
  return terminalLink(chalk.cyan(text), url, {
    fallback: () => `${chalk.cyan(text)} (${chalk.gray(url)})`
  });
}

/**
 * Format a box
 */
function formatBox(content, options = {}) {
  const {
    title = '',
    type = 'info', // info, success, warning, error
    padding = 1,
    margin = 1
  } = options;

  const borderColors = {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  };

  return boxen(content, {
    title: title || undefined,
    padding,
    margin,
    borderStyle: 'round',
    borderColor: borderColors[type] || 'cyan'
  });
}

/**
 * Format success message
 */
function formatSuccess(message) {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format error message
 */
function formatError(message) {
  return chalk.red(`✗ ${message}`);
}

/**
 * Format warning message
 */
function formatWarning(message) {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format info message
 */
function formatInfo(message) {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Format a tip
 */
function formatTip(message) {
  return formatBox(chalk.yellow(`💡 Tip: ${message}`), {
    type: 'warning',
    padding: 1
  });
}

/**
 * Format an example
 */
function formatExample(title, command, description = '') {
  const output = [];
  output.push(chalk.white.bold(title));
  if (description) {
    output.push(chalk.gray(`  ${description}\n`));
  }
  output.push(formatCommand(command));
  return output.join('\n');
}

/**
 * Format markdown content
 */
function formatMarkdown(content) {
  return marked(content);
}

/**
 * Format a progress indicator
 */
function formatProgress(current, total, label = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  return `${label} ${chalk.cyan(bar)} ${chalk.white.bold(`${percentage}%`)} (${current}/${total})`;
}

/**
 * Format a key-value pair
 */
function formatKeyValue(key, value, indent = 0) {
  const spaces = ' '.repeat(indent);
  const keyText = chalk.white.bold(key.padEnd(20));
  const valueText = chalk.gray(value);
  return `${spaces}${keyText} ${valueText}`;
}

/**
 * Format a section divider
 */
function formatDivider(char = '─', length = 60) {
  return chalk.gray(char.repeat(length));
}

/**
 * Format a badge
 */
function formatBadge(text, type = 'info') {
  const colors = {
    info: chalk.bgBlue.white,
    success: chalk.bgGreen.white,
    warning: chalk.bgYellow.black,
    error: chalk.bgRed.white,
    default: chalk.bgGray.white
  };

  const colorFn = colors[type] || colors.default;
  return colorFn(` ${text} `);
}

/**
 * Format a checklist item
 */
function formatChecklistItem(text, checked = false) {
  const icon = checked ? chalk.green('✓') : chalk.gray('○');
  const textColor = checked ? chalk.gray : chalk.white;
  return `  ${icon} ${textColor(text)}`;
}

/**
 * Format numbered steps
 */
function formatSteps(steps) {
  return steps.map((step, index) => {
    const num = chalk.cyan.bold(`${index + 1}.`);
    return `${num} ${chalk.white(step)}`;
  }).join('\n');
}

/**
 * Center text
 */
function centerText(text, width = 80) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Wrap text to specified width
 */
function wrapText(text, width = 80, indent = 0) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = ' '.repeat(indent);

  words.forEach(word => {
    if (currentLine.length + word.length + 1 > width) {
      lines.push(currentLine);
      currentLine = ' '.repeat(indent) + word;
    } else {
      currentLine += (currentLine.length > indent ? ' ' : '') + word;
    }
  });

  if (currentLine.length > indent) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

module.exports = {
  formatHeader,
  formatSubheader,
  formatCommand,
  formatOption,
  formatListItem,
  formatCodeBlock,
  formatTable,
  formatLink,
  formatBox,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatTip,
  formatExample,
  formatMarkdown,
  formatProgress,
  formatKeyValue,
  formatDivider,
  formatBadge,
  formatChecklistItem,
  formatSteps,
  centerText,
  wrapText
};
