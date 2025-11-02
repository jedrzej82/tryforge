const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs-extra');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      const metaStr = JSON.stringify(metadata, null, 2);
      msg += `\n${metaStr}`;
    }

    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Daily rotate file transport for general logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'tryforge-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'info'
});

// Daily rotate file transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error'
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: process.env.TRYFORGE_LOG_LEVEL || 'info'
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.TRYFORGE_LOG_LEVEL || 'info',
  transports: [
    consoleTransport,
    dailyRotateTransport,
    errorRotateTransport
  ],
  // Don't exit on error
  exitOnError: false
});

// Add debug mode support
logger.enableDebug = () => {
  logger.level = 'debug';
  consoleTransport.level = 'debug';
  logger.debug('Debug mode enabled');
};

logger.disableDebug = () => {
  logger.level = 'info';
  consoleTransport.level = 'info';
};

// Add helper method for structured logging
logger.logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    timestamp: new Date().toISOString(),
    ...context
  });
};

// Add helper methods for common operations
logger.logOperation = (operation, status, details = {}) => {
  const message = `${operation}: ${status}`;
  const level = status === 'success' ? 'info' : status === 'failed' ? 'error' : 'warn';

  logger.logWithContext(level, message, {
    operation,
    status,
    ...details
  });
};

logger.logAIRequest = (provider, model, operation, details = {}) => {
  logger.logWithContext('info', `AI Request: ${provider}`, {
    provider,
    model,
    operation,
    ...details
  });
};

logger.logAIResponse = (provider, success, details = {}) => {
  const level = success ? 'info' : 'error';
  logger.logWithContext(level, `AI Response: ${provider}`, {
    provider,
    success,
    ...details
  });
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString()
  });
});

module.exports = logger;
