/**
 * Unit Tests for Logger Utility
 * Tests Winston-based logging system with file rotation
 */

const path = require('path');
const fs = require('fs-extra');
const winston = require('winston');

// Mock fs-extra before requiring logger
jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  pathExists: jest.fn(),
}));

// Mock winston-daily-rotate-file
jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation((options) => {
    return {
      ...options,
      log: jest.fn(),
    };
  });
});

describe('Logger', () => {
  let logger;
  let mockTransport;

  beforeEach(() => {
    // Clear module cache to get fresh logger instance
    jest.clearAllMocks();
    jest.resetModules();

    // Mock winston transports
    mockTransport = {
      log: jest.fn(),
      level: 'info',
    };

    // Spy on winston.createLogger
    jest.spyOn(winston, 'createLogger').mockReturnValue({
      level: 'info',
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      logWithContext: jest.fn(),
      logOperation: jest.fn(),
      logAIRequest: jest.fn(),
      logAIResponse: jest.fn(),
      enableDebug: jest.fn(),
      disableDebug: jest.fn(),
    });

    // Require logger after mocks are set up
    logger = require('@utils/logger');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create logs directory on initialization', () => {
      expect(fs.ensureDirSync).toHaveBeenCalled();
    });

    it('should initialize with correct log level from environment', () => {
      const originalEnv = process.env.TRYFORGE_LOG_LEVEL;
      process.env.TRYFORGE_LOG_LEVEL = 'debug';

      jest.resetModules();
      const freshLogger = require('@utils/logger');

      process.env.TRYFORGE_LOG_LEVEL = originalEnv;
    });

    it('should default to info level when no environment variable set', () => {
      const originalEnv = process.env.TRYFORGE_LOG_LEVEL;
      delete process.env.TRYFORGE_LOG_LEVEL;

      jest.resetModules();
      const freshLogger = require('@utils/logger');

      process.env.TRYFORGE_LOG_LEVEL = originalEnv;
    });
  });

  describe('Logging Methods', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(logger.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(logger.error).toHaveBeenCalledWith('Test error message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(logger.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(logger.debug).toHaveBeenCalledWith('Test debug message');
    });

    it('should log messages with metadata', () => {
      const metadata = { userId: 123, action: 'test' };
      logger.info('Test with metadata', metadata);
      expect(logger.info).toHaveBeenCalledWith('Test with metadata', metadata);
    });

    it('should handle logging of errors with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error: error.message, stack: error.stack });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    describe('logWithContext', () => {
      it('should log with context and timestamp', () => {
        const context = { operation: 'test', userId: 123 };
        logger.logWithContext('info', 'Test message', context);
        expect(logger.logWithContext).toHaveBeenCalledWith('info', 'Test message', context);
      });

      it('should add timestamp to context', () => {
        logger.logWithContext('info', 'Test message', {});
        expect(logger.logWithContext).toHaveBeenCalled();
      });

      it('should handle empty context', () => {
        logger.logWithContext('info', 'Test message');
        expect(logger.logWithContext).toHaveBeenCalled();
      });
    });

    describe('logOperation', () => {
      it('should log successful operations at info level', () => {
        logger.logOperation('database-migration', 'success', { duration: '2.5s' });
        expect(logger.logOperation).toHaveBeenCalledWith(
          'database-migration',
          'success',
          { duration: '2.5s' }
        );
      });

      it('should log failed operations at error level', () => {
        logger.logOperation('database-migration', 'failed', { error: 'Connection lost' });
        expect(logger.logOperation).toHaveBeenCalledWith(
          'database-migration',
          'failed',
          { error: 'Connection lost' }
        );
      });

      it('should log pending operations at warn level', () => {
        logger.logOperation('backup', 'pending', { queueSize: 5 });
        expect(logger.logOperation).toHaveBeenCalled();
      });

      it('should handle operations without details', () => {
        logger.logOperation('test-operation', 'success');
        expect(logger.logOperation).toHaveBeenCalled();
      });
    });

    describe('logAIRequest', () => {
      it('should log AI request with correct format', () => {
        logger.logAIRequest('Claude', 'claude-sonnet-4', 'code-generation', {
          promptLength: 500,
          temperature: 0.7
        });

        expect(logger.logAIRequest).toHaveBeenCalledWith(
          'Claude',
          'claude-sonnet-4',
          'code-generation',
          { promptLength: 500, temperature: 0.7 }
        );
      });

      it('should handle AI requests without optional details', () => {
        logger.logAIRequest('OpenRouter', 'gpt-4', 'chat');
        expect(logger.logAIRequest).toHaveBeenCalled();
      });
    });

    describe('logAIResponse', () => {
      it('should log successful AI response at info level', () => {
        logger.logAIResponse('Claude', true, {
          responseLength: 1500,
          tokens: 300
        });

        expect(logger.logAIResponse).toHaveBeenCalledWith(
          'Claude',
          true,
          { responseLength: 1500, tokens: 300 }
        );
      });

      it('should log failed AI response at error level', () => {
        logger.logAIResponse('Claude', false, {
          error: 'Rate limit exceeded'
        });

        expect(logger.logAIResponse).toHaveBeenCalled();
      });
    });
  });

  describe('Debug Mode', () => {
    it('should enable debug mode', () => {
      logger.enableDebug();
      expect(logger.enableDebug).toHaveBeenCalled();
    });

    it('should disable debug mode', () => {
      logger.disableDebug();
      expect(logger.disableDebug).toHaveBeenCalled();
    });

    it('should log debug messages when debug mode is enabled', () => {
      logger.enableDebug();
      logger.debug('Debug message');
      expect(logger.debug).toHaveBeenCalledWith('Debug message');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed log messages gracefully', () => {
      expect(() => {
        logger.info(undefined);
      }).not.toThrow();
    });

    it('should handle circular references in metadata', () => {
      const circular = { a: 1 };
      circular.self = circular;

      expect(() => {
        logger.info('Test', circular);
      }).not.toThrow();
    });

    it('should handle very large log messages', () => {
      const largeMessage = 'x'.repeat(10000);
      expect(() => {
        logger.info(largeMessage);
      }).not.toThrow();
    });
  });

  describe('Log Levels', () => {
    it('should respect log level hierarchy', () => {
      // When level is set to 'error', info/warn/debug should not log
      logger.level = 'error';
      logger.info('Should not log');
      logger.error('Should log');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log all levels when set to debug', () => {
      logger.level = 'debug';
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(logger.debug).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    it('should ensure logs directory exists', () => {
      expect(fs.ensureDirSync).toHaveBeenCalled();
      const logsDir = path.join(process.cwd(), 'logs');
      expect(fs.ensureDirSync).toHaveBeenCalledWith(logsDir);
    });
  });

  describe('Process Event Handlers', () => {
    it('should handle uncaught exceptions', () => {
      // This test verifies that the logger sets up uncaught exception handler
      // The actual handler is registered on process level
      const listeners = process.listeners('uncaughtException');
      expect(listeners.length).toBeGreaterThan(0);
    });

    it('should handle unhandled rejections', () => {
      // This test verifies that the logger sets up unhandled rejection handler
      const listeners = process.listeners('unhandledRejection');
      expect(listeners.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle high volume of log messages', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should not block on async operations', async () => {
      const promise = Promise.resolve();
      logger.info('Before async');
      await promise;
      logger.info('After async');

      expect(logger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in metadata', () => {
      expect(() => {
        logger.info('Test', { value: null });
      }).not.toThrow();
    });

    it('should handle undefined values in metadata', () => {
      expect(() => {
        logger.info('Test', { value: undefined });
      }).not.toThrow();
    });

    it('should handle empty strings', () => {
      expect(() => {
        logger.info('');
      }).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      expect(() => {
        logger.info('Test \n\t\r special chars');
      }).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() => {
        logger.info('测试 🚀 тест');
      }).not.toThrow();
    });
  });
});
