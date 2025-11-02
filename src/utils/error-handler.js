const logger = require('./logger');
const chalk = require('chalk');

/**
 * Custom Error Classes for better error categorization
 */

class TryForgeError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class AIServiceError extends TryForgeError {
  constructor(message, provider, context = {}) {
    super(message, { provider, ...context });
    this.provider = provider;
  }
}

class FileOperationError extends TryForgeError {
  constructor(message, filePath, operation, context = {}) {
    super(message, { filePath, operation, ...context });
    this.filePath = filePath;
    this.operation = operation;
  }
}

class ValidationError extends TryForgeError {
  constructor(message, field, context = {}) {
    super(message, { field, ...context });
    this.field = field;
  }
}

class NetworkError extends TryForgeError {
  constructor(message, url, context = {}) {
    super(message, { url, ...context });
    this.url = url;
  }
}

class ConfigurationError extends TryForgeError {
  constructor(message, configKey, context = {}) {
    super(message, { configKey, ...context });
    this.configKey = configKey;
  }
}

/**
 * Error Recovery Strategies
 */

const RecoveryStrategies = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  SKIP: 'skip',
  ABORT: 'abort',
  USER_INPUT: 'user_input'
};

/**
 * Error Handler with context and recovery
 */

class ErrorHandler {
  constructor() {
    this.errorHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Handle an error with context and recovery suggestions
   */
  handle(error, options = {}) {
    const {
      context = 'Unknown operation',
      recovery = null,
      suggestion = null,
      docs = null,
      silent = false,
      exitOnError = false
    } = options;

    // Record error in history
    this.recordError(error, context);

    // Log the error
    logger.error(`Error in ${context}:`, {
      error: error.message,
      type: error.name,
      context: error.context || {},
      stack: error.stack
    });

    // Display user-friendly error message (unless silent)
    if (!silent) {
      this.displayError(error, { context, recovery, suggestion, docs });
    }

    // Exit if requested
    if (exitOnError) {
      process.exit(1);
    }

    return {
      error,
      context,
      recovery,
      suggestion,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Display user-friendly error message
   */
  displayError(error, options = {}) {
    const { context, recovery, suggestion, docs } = options;

    console.error('\n' + chalk.red.bold('━'.repeat(60)));
    console.error(chalk.red.bold('❌ ERROR'));
    console.error(chalk.red.bold('━'.repeat(60)));

    // Error message
    console.error(chalk.red(`\n${error.message}\n`));

    // Context
    if (context) {
      console.error(chalk.yellow(`Context: ${context}`));
    }

    // Error type
    console.error(chalk.gray(`Type: ${error.name}`));

    // Additional context from error object
    if (error.context && Object.keys(error.context).length > 0) {
      console.error(chalk.gray(`Details: ${JSON.stringify(error.context, null, 2)}`));
    }

    // Recovery strategy
    if (recovery) {
      console.error(chalk.cyan(`\n💡 Recovery: ${recovery}`));
    }

    // Suggestion
    if (suggestion) {
      console.error(chalk.cyan(`💡 Suggestion: ${suggestion}`));
    }

    // Documentation link
    if (docs) {
      console.error(chalk.blue(`\n📖 Documentation: ${docs}`));
    }

    // Debug info
    if (logger.level === 'debug') {
      console.error(chalk.gray(`\nStack trace:\n${error.stack}`));
    } else {
      console.error(chalk.gray('\nRun with --verbose flag for detailed error information'));
    }

    console.error(chalk.red.bold('━'.repeat(60)) + '\n');
  }

  /**
   * Handle AI service errors with provider-specific recovery
   */
  handleAIError(error, provider, operation, options = {}) {
    const context = `AI Service: ${provider} - ${operation}`;

    // Determine recovery strategy based on error type
    let recovery = null;
    let suggestion = null;

    if (error.message.includes('API key')) {
      recovery = 'Check your API key configuration in the admin panel';
      suggestion = 'Run: tryforge admin';
    } else if (error.message.includes('rate limit')) {
      recovery = 'Wait a few moments and try again, or use a different AI provider';
      suggestion = 'Try: tryforge --provider openrouter';
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      recovery = 'Check your internet connection and try again';
      suggestion = 'Retry with: --retry flag';
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      recovery = 'Check your API quota or billing status';
      suggestion = 'Visit your AI provider dashboard';
    } else {
      recovery = 'Try using a different AI provider';
      suggestion = 'Available providers: claude, openrouter, pollinations';
    }

    return this.handle(new AIServiceError(error.message, provider, { operation }), {
      context,
      recovery,
      suggestion,
      ...options
    });
  }

  /**
   * Handle file operation errors
   */
  handleFileError(error, filePath, operation, options = {}) {
    const context = `File Operation: ${operation}`;

    let recovery = null;
    let suggestion = null;

    if (error.code === 'ENOENT') {
      recovery = 'The file or directory does not exist';
      suggestion = 'Check the file path and try again';
    } else if (error.code === 'EACCES') {
      recovery = 'Permission denied';
      suggestion = 'Check file permissions or run with appropriate privileges';
    } else if (error.code === 'EEXIST') {
      recovery = 'File or directory already exists';
      suggestion = 'Use a different name or remove the existing file';
    } else {
      recovery = 'File operation failed';
      suggestion = 'Check file path and permissions';
    }

    return this.handle(new FileOperationError(error.message, filePath, operation), {
      context,
      recovery,
      suggestion,
      ...options
    });
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error, url, options = {}) {
    const context = 'Network Request';

    let recovery = null;
    let suggestion = null;

    if (error.code === 'ENOTFOUND') {
      recovery = 'Domain not found or DNS resolution failed';
      suggestion = 'Check your internet connection and the URL';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      recovery = 'Request timed out';
      suggestion = 'Check your internet connection and try again';
    } else if (error.code === 'ECONNREFUSED') {
      recovery = 'Connection refused';
      suggestion = 'The server may be down or unreachable';
    } else {
      recovery = 'Network request failed';
      suggestion = 'Check your internet connection and try again';
    }

    return this.handle(new NetworkError(error.message, url), {
      context,
      recovery,
      suggestion,
      ...options
    });
  }

  /**
   * Record error in history
   */
  recordError(error, context) {
    this.errorHistory.push({
      error: {
        name: error.name,
        message: error.message,
        context: error.context || {}
      },
      context,
      timestamp: new Date().toISOString()
    });

    // Trim history if too large
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      recent: this.errorHistory.slice(-5)
    };

    this.errorHistory.forEach(record => {
      const type = record.error.name;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

/**
 * Convenience function for handling errors
 */
function handleError(error, options = {}) {
  return errorHandler.handle(error, options);
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(error, attempt + 1, maxRetries);
        }

        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: error.message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Try-catch wrapper with automatic error handling
 */
async function tryWithHandler(fn, context, options = {}) {
  try {
    return await fn();
  } catch (error) {
    handleError(error, { context, ...options });
    throw error;
  }
}

module.exports = {
  // Error classes
  TryForgeError,
  AIServiceError,
  FileOperationError,
  ValidationError,
  NetworkError,
  ConfigurationError,

  // Error handler
  ErrorHandler,
  errorHandler,
  handleError,

  // Recovery strategies
  RecoveryStrategies,

  // Utility functions
  retryWithBackoff,
  tryWithHandler
};
