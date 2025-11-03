/**
 * TryForge CLI - UI Themes and Color Styles
 *
 * Provides consistent color themes and styling for CLI output
 */

const chalk = require('chalk');

/**
 * Color palette
 */
const colors = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.magenta,
  dim: chalk.dim,
  bold: chalk.bold,
  underline: chalk.underline,
  white: chalk.white,
  bgSuccess: chalk.bgGreen.black,
  bgError: chalk.bgRed.white,
  bgWarning: chalk.bgYellow.black,
  bgInfo: chalk.bgBlue.white
};

/**
 * Status icons
 */
const icons = {
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  pending: '○',
  inProgress: '⠋',
  arrow: '→',
  bullet: '•',
  check: '✓',
  cross: '✗',
  star: '★',
  rocket: '🚀',
  sparkles: '✨',
  fire: '🔥',
  folder: '📁',
  file: '📄',
  package: '📦',
  gear: '⚙',
  wrench: '🔧',
  magnifyingGlass: '🔍',
  paintbrush: '🎨',
  robot: '🤖',
  celebration: '🎉',
  hourglass: '⏳',
  clock: '🕐',
  lightning: '⚡',
  chart: '📊',
  trophy: '🏆'
};

/**
 * Spinner frames for different styles
 */
const spinnerFrames = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  circle: ['◐', '◓', '◑', '◒'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  box: ['◰', '◳', '◲', '◱'],
  star: ['✶', '✸', '✹', '✺', '✹', '✸'],
  moon: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  earth: ['🌍', '🌎', '🌏'],
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛']
};

/**
 * Progress bar characters
 */
const progressChars = {
  complete: '█',
  incomplete: '░',
  head: '█',
  rounded: {
    complete: '●',
    incomplete: '○'
  },
  blocks: {
    complete: '■',
    incomplete: '□'
  },
  arrows: {
    complete: '▶',
    incomplete: '▷'
  }
};

/**
 * Box drawing characters
 */
const box = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftT: '├',
  rightT: '┤',
  topT: '┬',
  bottomT: '┴',
  cross: '┼'
};

/**
 * Format status message with color
 */
function formatStatus(status, message) {
  const statusConfig = {
    success: { icon: icons.success, color: colors.success },
    error: { icon: icons.error, color: colors.error },
    warning: { icon: icons.warning, color: colors.warning },
    info: { icon: icons.info, color: colors.info },
    pending: { icon: icons.pending, color: colors.muted },
    inProgress: { icon: icons.inProgress, color: colors.primary }
  };

  const config = statusConfig[status] || statusConfig.info;
  return `${config.color(config.icon)} ${message}`;
}

/**
 * Create a formatted section header
 */
function createHeader(title, width = 60) {
  const titleLength = title.length + 2; // Account for spaces
  const leftPadding = Math.floor((width - titleLength) / 2);
  const rightPadding = width - titleLength - leftPadding;

  const line = box.horizontal.repeat(width);
  const titleLine = box.horizontal.repeat(leftPadding) +
                    ` ${title} ` +
                    box.horizontal.repeat(rightPadding);

  return colors.primary(
    `${box.topLeft}${line}${box.topRight}\n` +
    `${box.vertical}${titleLine}${box.vertical}\n` +
    `${box.bottomLeft}${line}${box.bottomRight}`
  );
}

/**
 * Create a formatted box
 */
function createBox(content, options = {}) {
  const {
    width = 60,
    padding = 1,
    color = colors.primary,
    title = null
  } = options;

  const lines = content.split('\n');
  const paddingStr = ' '.repeat(padding);

  let box = color(this.box.topLeft + this.box.horizontal.repeat(width - 2) + this.box.topRight) + '\n';

  if (title) {
    const titleLine = ` ${title} `;
    const titlePadding = width - titleLine.length - 2;
    box += color(this.box.vertical) + titleLine + ' '.repeat(titlePadding) + color(this.box.vertical) + '\n';
    box += color(this.box.leftT + this.box.horizontal.repeat(width - 2) + this.box.rightT) + '\n';
  }

  lines.forEach(line => {
    const contentLength = line.length + (padding * 2);
    const rightPadding = width - contentLength - 2;
    box += color(this.box.vertical) + paddingStr + line + ' '.repeat(rightPadding + padding) + color(this.box.vertical) + '\n';
  });

  box += color(this.box.bottomLeft + this.box.horizontal.repeat(width - 2) + this.box.bottomRight);

  return box;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get theme by name
 */
function getTheme(name = 'default') {
  const themes = {
    default: {
      spinner: spinnerFrames.dots,
      progressChar: progressChars.complete,
      incompleteChar: progressChars.incomplete,
      successColor: colors.success,
      errorColor: colors.error,
      warningColor: colors.warning,
      infoColor: colors.info
    },
    minimal: {
      spinner: spinnerFrames.line,
      progressChar: '=',
      incompleteChar: '-',
      successColor: colors.success,
      errorColor: colors.error,
      warningColor: colors.warning,
      infoColor: colors.info
    },
    fancy: {
      spinner: spinnerFrames.star,
      progressChar: progressChars.complete,
      incompleteChar: progressChars.incomplete,
      successColor: colors.highlight,
      errorColor: colors.error,
      warningColor: colors.warning,
      infoColor: colors.primary
    }
  };

  return themes[name] || themes.default;
}

module.exports = {
  colors,
  icons,
  spinnerFrames,
  progressChars,
  box,
  formatStatus,
  createHeader,
  createBox,
  formatDuration,
  getTheme
};
