import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console log format (more readable for development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Daily rotate file transport for error logs
 */
const errorFileTransport = new DailyRotateFile({
  filename: path.join(env.logging.filePath, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d',
  maxSize: '20m',
  format: logFormat,
});

/**
 * Daily rotate file transport for combined logs
 */
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(env.logging.filePath, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
  format: logFormat,
});

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: env.logging.level,
  format: logFormat,
  transports: [
    // Console transport (only in development)
    ...(env.node.isDevelopment
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),
    // File transports
    errorFileTransport,
    combinedFileTransport,
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(env.logging.filePath, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(env.logging.filePath, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
    }),
  ],
  exitOnError: false,
});

/**
 * Stream for Morgan HTTP logger
 */
export const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
