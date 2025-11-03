/**
 * TryForge CLI - Formatting Utilities
 *
 * Provides utilities for formatting various types of data for CLI display
 */

const { colors } = require('./themes');

/**
 * Format file size from bytes to human-readable format
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (bytes === 1) return '1 Byte';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration from milliseconds to human-readable format
 */
function formatDuration(ms, options = {}) {
  const {
    long = false,
    precise = false
  } = options;

  if (ms < 0) return '0ms';

  const units = [
    { value: 3600000, long: 'hour', short: 'h' },
    { value: 60000, long: 'minute', short: 'm' },
    { value: 1000, long: 'second', short: 's' },
    { value: 1, long: 'millisecond', short: 'ms' }
  ];

  const parts = [];
  let remaining = ms;

  for (const unit of units) {
    if (remaining >= unit.value || (precise && parts.length > 0)) {
      const count = Math.floor(remaining / unit.value);
      if (count > 0 || (precise && parts.length > 0)) {
        const label = long
          ? `${unit.long}${count !== 1 ? 's' : ''}`
          : unit.short;
        parts.push(`${count}${label}`);
        remaining %= unit.value;
      }

      // Stop after first two non-zero parts unless precise
      if (parts.length === 2 && !precise) break;
    }
  }

  if (parts.length === 0) {
    return long ? '0 milliseconds' : '0ms';
  }

  return parts.join(' ');
}

/**
 * Format percentage
 */
function formatPercentage(value, total, decimals = 1) {
  if (total === 0) return '0%';

  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format speed (bytes per second)
 */
function formatSpeed(bytesPerSecond) {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Truncate string with ellipsis
 */
function truncate(str, maxLength, position = 'end') {
  if (!str || str.length <= maxLength) return str;

  const ellipsis = '...';

  switch (position) {
    case 'start':
      return ellipsis + str.slice(-(maxLength - ellipsis.length));
    case 'middle': {
      const startLength = Math.ceil((maxLength - ellipsis.length) / 2);
      const endLength = Math.floor((maxLength - ellipsis.length) / 2);
      return str.slice(0, startLength) + ellipsis + str.slice(-endLength);
    }
    case 'end':
    default:
      return str.slice(0, maxLength - ellipsis.length) + ellipsis;
  }
}

/**
 * Pad string to specified length
 */
function pad(str, length, char = ' ', position = 'end') {
  const strLength = str.length;
  if (strLength >= length) return str;

  const padding = char.repeat(length - strLength);

  switch (position) {
    case 'start':
      return padding + str;
    case 'center': {
      const leftPadding = Math.floor((length - strLength) / 2);
      const rightPadding = length - strLength - leftPadding;
      return char.repeat(leftPadding) + str + char.repeat(rightPadding);
    }
    case 'end':
    default:
      return str + padding;
  }
}

/**
 * Format a list of items
 */
function formatList(items, options = {}) {
  const {
    bullet = '•',
    indent = 2,
    color = null,
    numbered = false
  } = options;

  const indentStr = ' '.repeat(indent);

  return items.map((item, index) => {
    const prefix = numbered ? `${index + 1}.` : bullet;
    const formattedItem = `${indentStr}${prefix} ${item}`;
    return color ? color(formattedItem) : formattedItem;
  }).join('\n');
}

/**
 * Format a table
 */
function formatTable(data, options = {}) {
  const {
    headers = null,
    columnSpacing = 3,
    headerColor = colors.bold,
    borderColor = colors.muted
  } = options;

  if (!data || data.length === 0) return '';

  // Determine columns from headers or first row
  const columns = headers || Object.keys(data[0]);
  const numColumns = columns.length;

  // Calculate column widths
  const columnWidths = columns.map((col, i) => {
    const headerWidth = col.length;
    const dataWidth = Math.max(...data.map(row => {
      const value = headers ? row[col] : row[Object.keys(row)[i]];
      return String(value || '').length;
    }));
    return Math.max(headerWidth, dataWidth);
  });

  // Create separator
  const separator = columnWidths
    .map(width => '─'.repeat(width + columnSpacing))
    .join('┼');

  // Format header
  const headerRow = columns
    .map((col, i) => pad(col, columnWidths[i] + columnSpacing))
    .join('│');

  // Format data rows
  const dataRows = data.map(row => {
    return columns
      .map((col, i) => {
        const value = headers ? row[col] : row[Object.keys(row)[i]];
        return pad(String(value || ''), columnWidths[i] + columnSpacing);
      })
      .join('│');
  });

  // Assemble table
  const lines = [
    borderColor('┌' + separator + '┐'),
    '│' + headerColor(headerRow) + '│',
    borderColor('├' + separator + '┤'),
    ...dataRows.map(row => '│' + row + '│'),
    borderColor('└' + separator + '┘')
  ];

  return lines.join('\n');
}

/**
 * Format key-value pairs
 */
function formatKeyValue(data, options = {}) {
  const {
    keyColor = colors.bold,
    valueColor = null,
    separator = ': ',
    indent = 0,
    maxKeyWidth = null
  } = options;

  const entries = Object.entries(data);
  const indentStr = ' '.repeat(indent);

  // Calculate max key width
  const keyWidth = maxKeyWidth || Math.max(...entries.map(([key]) => key.length));

  return entries.map(([key, value]) => {
    const paddedKey = pad(key, keyWidth);
    const formattedKey = keyColor ? keyColor(paddedKey) : paddedKey;
    const formattedValue = valueColor ? valueColor(value) : value;
    return `${indentStr}${formattedKey}${separator}${formattedValue}`;
  }).join('\n');
}

/**
 * Format a tree structure
 */
function formatTree(node, options = {}, level = 0) {
  const {
    childKey = 'children',
    labelKey = 'label',
    indent = 2,
    lastChild = true,
    prefix = ''
  } = options;

  const lines = [];
  const indentStr = ' '.repeat(indent);

  // Current node
  const connector = level === 0 ? '' : (lastChild ? '└── ' : '├── ');
  const label = typeof node === 'string' ? node : node[labelKey];
  lines.push(prefix + connector + label);

  // Children
  const children = typeof node === 'object' && node[childKey] ? node[childKey] : [];
  children.forEach((child, index) => {
    const isLast = index === children.length - 1;
    const childPrefix = prefix + (level === 0 ? '' : (lastChild ? indentStr : '│' + ' '.repeat(indent - 1)));

    lines.push(...formatTree(child, {
      ...options,
      lastChild: isLast,
      prefix: childPrefix
    }, level + 1));
  });

  return level === 0 ? lines.join('\n') : lines;
}

/**
 * Format a progress indicator (simple text-based)
 */
function formatProgress(current, total, options = {}) {
  const {
    width = 20,
    completeChar = '█',
    incompleteChar = '░',
    showPercentage = true,
    showNumbers = true,
    color = colors.primary
  } = options;

  const percentage = total > 0 ? current / total : 0;
  const completed = Math.floor(percentage * width);
  const incomplete = width - completed;

  const bar = completeChar.repeat(completed) + incompleteChar.repeat(incomplete);
  const coloredBar = color ? color(bar) : bar;

  const parts = [coloredBar];

  if (showPercentage) {
    parts.push(formatPercentage(current, total, 0));
  }

  if (showNumbers) {
    parts.push(`${current}/${total}`);
  }

  return parts.join(' ');
}

/**
 * Format ETA (estimated time of arrival)
 */
function formatETA(remainingMs) {
  if (remainingMs < 0 || !isFinite(remainingMs)) {
    return 'calculating...';
  }

  if (remainingMs < 1000) {
    return '< 1s';
  }

  return formatDuration(remainingMs);
}

/**
 * Format a number with thousands separator
 */
function formatNumber(num, separator = ',') {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Pluralize a word based on count
 */
function pluralize(word, count, suffix = 's') {
  return count === 1 ? word : word + suffix;
}

/**
 * Format a summary with counts
 */
function formatSummary(items, options = {}) {
  const {
    separator = ' | ',
    color = colors.bold,
    indent = 0
  } = options;

  const indentStr = ' '.repeat(indent);
  const parts = Object.entries(items).map(([label, count]) => {
    return `${label}: ${colors.bold(count)}`;
  });

  const summary = parts.join(separator);
  return indentStr + (color ? color(summary) : summary);
}

module.exports = {
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatSpeed,
  truncate,
  pad,
  formatList,
  formatTable,
  formatKeyValue,
  formatTree,
  formatProgress,
  formatETA,
  formatNumber,
  pluralize,
  formatSummary
};
