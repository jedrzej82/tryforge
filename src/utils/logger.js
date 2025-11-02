/**
 * Logger Utility
 * Centralized logging for TryForge
 */

const chalk = require('chalk');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.silent = options.silent || false;
  }

  info(message, ...args) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ'), message, ...args);
    }
  }

  success(message, ...args) {
    if (!this.silent) {
      console.log(chalk.green('✓'), message, ...args);
    }
  }

  warn(message, ...args) {
    if (!this.silent) {
      console.log(chalk.yellow('⚠'), message, ...args);
    }
  }

  error(message, ...args) {
    if (!this.silent) {
      console.error(chalk.red('✗'), message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.level === 'debug' && !this.silent) {
      console.log(chalk.gray('🐛'), message, ...args);
    }
  }

  log(message, ...args) {
    if (!this.silent) {
      console.log(message, ...args);
    }
  }
}

module.exports = Logger;
