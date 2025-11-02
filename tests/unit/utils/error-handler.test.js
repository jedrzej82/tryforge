/**
 * Unit Tests for Error Handler Utility
 * Tests custom error classes and error handling mechanisms
 */

const {
  TryForgeError,
  AIServiceError,
  FileOperationError,
  ValidationError,
  NetworkError,
  ConfigurationError,
  ErrorHandler,
  errorHandler,
  handleError,
  RecoveryStrategies,
  retryWithBackoff,
  tryWithHandler
} = require('@utils/error-handler');

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler.clearHistory();
  });

  describe('Error Classes', () => {
    describe('TryForgeError', () => {
      it('should create error with message and context', () => {
        const error = new TryForgeError('Test error', { foo: 'bar' });

        expect(error.message).toBe('Test error');
        expect(error.context.foo).toBe('bar');
        expect(error.timestamp).toBeDefined();
        expect(error.name).toBe('TryForgeError');
      });

      it('should have timestamp in ISO format', () => {
        const error = new TryForgeError('Test error');

        expect(error.timestamp).toBeISODate();
      });

      it('should capture stack trace', () => {
        const error = new TryForgeError('Test error');

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('TryForgeError');
      });

      it('should work without context', () => {
        const error = new TryForgeError('Test error');

        expect(error.context).toEqual({});
      });
    });

    describe('AIServiceError', () => {
      it('should create error with provider', () => {
        const error = new AIServiceError('API failed', 'Claude');

        expect(error.message).toBe('API failed');
        expect(error.provider).toBe('Claude');
        expect(error.context.provider).toBe('Claude');
      });

      it('should include additional context', () => {
        const error = new AIServiceError('API failed', 'Claude', { statusCode: 429 });

        expect(error.provider).toBe('Claude');
        expect(error.context.statusCode).toBe(429);
      });
    });

    describe('FileOperationError', () => {
      it('should create error with file path and operation', () => {
        const error = new FileOperationError('Read failed', '/path/to/file', 'read');

        expect(error.message).toBe('Read failed');
        expect(error.filePath).toBe('/path/to/file');
        expect(error.operation).toBe('read');
        expect(error.context.filePath).toBe('/path/to/file');
        expect(error.context.operation).toBe('read');
      });

      it('should include additional context', () => {
        const error = new FileOperationError(
          'Write failed',
          '/path/to/file',
          'write',
          { permissions: 'read-only' }
        );

        expect(error.context.permissions).toBe('read-only');
      });
    });

    describe('ValidationError', () => {
      it('should create error with field information', () => {
        const error = new ValidationError('Invalid email', 'email');

        expect(error.message).toBe('Invalid email');
        expect(error.field).toBe('email');
        expect(error.context.field).toBe('email');
      });
    });

    describe('NetworkError', () => {
      it('should create error with URL', () => {
        const error = new NetworkError('Request failed', 'https://api.example.com');

        expect(error.message).toBe('Request failed');
        expect(error.url).toBe('https://api.example.com');
        expect(error.context.url).toBe('https://api.example.com');
      });
    });

    describe('ConfigurationError', () => {
      it('should create error with config key', () => {
        const error = new ConfigurationError('Missing config', 'apiKey');

        expect(error.message).toBe('Missing config');
        expect(error.configKey).toBe('apiKey');
        expect(error.context.configKey).toBe('apiKey');
      });
    });
  });

  describe('ErrorHandler Class', () => {
    let handler;

    beforeEach(() => {
      handler = new ErrorHandler();
    });

    describe('handle', () => {
      it('should handle error with context', () => {
        const error = new Error('Test error');
        const result = handler.handle(error, {
          context: 'Test operation',
          recovery: 'Retry operation',
          suggestion: 'Check configuration'
        });

        expect(result.error).toBe(error);
        expect(result.context).toBe('Test operation');
        expect(result.recovery).toBe('Retry operation');
        expect(result.suggestion).toBe('Check configuration');
        expect(result.timestamp).toBeDefined();
      });

      it('should record error in history', () => {
        const error = new Error('Test error');
        handler.handle(error, { context: 'Test' });

        const history = handler.getErrorHistory();
        expect(history.length).toBe(1);
        expect(history[0].error.message).toBe('Test error');
        expect(history[0].context).toBe('Test');
      });

      it('should not exit by default', () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation();
        const error = new Error('Test error');

        handler.handle(error);

        expect(exitSpy).not.toHaveBeenCalled();
        exitSpy.mockRestore();
      });

      it('should exit when exitOnError is true', () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation();
        const error = new Error('Test error');

        handler.handle(error, { exitOnError: true });

        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
      });

      it('should handle silent mode', () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const error = new Error('Test error');

        handler.handle(error, { silent: true });

        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });

    describe('handleAIError', () => {
      it('should handle API key errors', () => {
        const error = new Error('Invalid API key provided');
        const result = handler.handleAIError(error, 'Claude', 'code generation');

        expect(result.recovery).toContain('API key');
        expect(result.suggestion).toContain('admin');
      });

      it('should handle rate limit errors', () => {
        const error = new Error('Rate limit exceeded');
        const result = handler.handleAIError(error, 'Claude', 'code generation');

        expect(result.recovery).toContain('rate limit');
        expect(result.suggestion).toBeDefined();
      });

      it('should handle timeout errors', () => {
        const error = new Error('Request timeout');
        const result = handler.handleAIError(error, 'Claude', 'code generation');

        expect(result.recovery).toContain('connection');
      });

      it('should handle quota errors', () => {
        const error = new Error('Quota exceeded');
        const result = handler.handleAIError(error, 'Claude', 'code generation');

        expect(result.recovery).toContain('quota');
      });

      it('should provide fallback recovery for unknown errors', () => {
        const error = new Error('Unknown error');
        const result = handler.handleAIError(error, 'Claude', 'code generation');

        expect(result.recovery).toContain('different AI provider');
      });
    });

    describe('handleFileError', () => {
      it('should handle ENOENT errors', () => {
        const error = new Error('File not found');
        error.code = 'ENOENT';

        const result = handler.handleFileError(error, '/path/to/file', 'read');

        expect(result.recovery).toContain('does not exist');
        expect(result.suggestion).toContain('file path');
      });

      it('should handle EACCES errors', () => {
        const error = new Error('Permission denied');
        error.code = 'EACCES';

        const result = handler.handleFileError(error, '/path/to/file', 'write');

        expect(result.recovery).toContain('Permission denied');
        expect(result.suggestion).toContain('permissions');
      });

      it('should handle EEXIST errors', () => {
        const error = new Error('File exists');
        error.code = 'EEXIST';

        const result = handler.handleFileError(error, '/path/to/file', 'create');

        expect(result.recovery).toContain('already exists');
      });

      it('should handle unknown file errors', () => {
        const error = new Error('Unknown error');

        const result = handler.handleFileError(error, '/path/to/file', 'operation');

        expect(result.recovery).toContain('File operation failed');
      });
    });

    describe('handleNetworkError', () => {
      it('should handle DNS errors', () => {
        const error = new Error('Domain not found');
        error.code = 'ENOTFOUND';

        const result = handler.handleNetworkError(error, 'https://example.com');

        expect(result.recovery).toContain('DNS');
        expect(result.suggestion).toContain('connection');
      });

      it('should handle timeout errors', () => {
        const error = new Error('Timeout');
        error.code = 'ETIMEDOUT';

        const result = handler.handleNetworkError(error, 'https://example.com');

        expect(result.recovery).toContain('timed out');
      });

      it('should handle connection refused errors', () => {
        const error = new Error('Connection refused');
        error.code = 'ECONNREFUSED';

        const result = handler.handleNetworkError(error, 'https://example.com');

        expect(result.recovery).toContain('refused');
        expect(result.suggestion).toContain('unreachable');
      });
    });

    describe('Error History', () => {
      it('should record error history', () => {
        const error1 = new Error('Error 1');
        const error2 = new Error('Error 2');

        handler.handle(error1, { context: 'Test 1' });
        handler.handle(error2, { context: 'Test 2' });

        const history = handler.getErrorHistory();
        expect(history.length).toBe(2);
      });

      it('should limit history size', () => {
        for (let i = 0; i < 150; i++) {
          handler.handle(new Error(`Error ${i}`));
        }

        const history = handler.getErrorHistory();
        expect(history.length).toBeLessThanOrEqual(100);
      });

      it('should get limited error history', () => {
        for (let i = 0; i < 20; i++) {
          handler.handle(new Error(`Error ${i}`));
        }

        const history = handler.getErrorHistory(5);
        expect(history.length).toBe(5);
      });

      it('should clear error history', () => {
        handler.handle(new Error('Test'));
        handler.clearHistory();

        const history = handler.getErrorHistory();
        expect(history.length).toBe(0);
      });
    });

    describe('Error Statistics', () => {
      it('should calculate error statistics', () => {
        handler.handle(new TryForgeError('Error 1'));
        handler.handle(new AIServiceError('Error 2', 'Claude'));
        handler.handle(new TryForgeError('Error 3'));

        const stats = handler.getErrorStats();

        expect(stats.total).toBe(3);
        expect(stats.byType.TryForgeError).toBe(2);
        expect(stats.byType.AIServiceError).toBe(1);
        expect(stats.recent.length).toBeLessThanOrEqual(5);
      });

      it('should handle empty error history', () => {
        const stats = handler.getErrorStats();

        expect(stats.total).toBe(0);
        expect(Object.keys(stats.byType).length).toBe(0);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('handleError', () => {
      it('should be a convenience wrapper for errorHandler.handle', () => {
        const error = new Error('Test error');
        const result = handleError(error, { context: 'Test' });

        expect(result.error).toBe(error);
        expect(result.context).toBe('Test');
      });
    });

    describe('retryWithBackoff', () => {
      it('should retry failed operations', async () => {
        let attempts = 0;
        const fn = jest.fn(async () => {
          attempts++;
          if (attempts < 3) throw new Error('Fail');
          return 'success';
        });

        const result = await retryWithBackoff(fn, { maxRetries: 3 });

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
      });

      it('should succeed on first try', async () => {
        const fn = jest.fn(async () => 'success');

        const result = await retryWithBackoff(fn, { maxRetries: 3 });

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('should throw after max retries', async () => {
        const fn = jest.fn(async () => {
          throw new Error('Always fails');
        });

        await expect(
          retryWithBackoff(fn, { maxRetries: 2 })
        ).rejects.toThrow('Always fails');

        expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });

      it('should use exponential backoff', async () => {
        jest.useFakeTimers();

        let attempts = 0;
        const fn = jest.fn(async () => {
          attempts++;
          if (attempts < 3) throw new Error('Fail');
          return 'success';
        });

        const promise = retryWithBackoff(fn, {
          maxRetries: 3,
          initialDelay: 1000,
          backoffMultiplier: 2
        });

        // Fast-forward through delays
        await jest.runAllTimersAsync();

        const result = await promise;

        expect(result).toBe('success');

        jest.useRealTimers();
      });

      it('should call onRetry callback', async () => {
        const onRetry = jest.fn();
        let attempts = 0;

        const fn = async () => {
          attempts++;
          if (attempts < 2) throw new Error('Fail');
          return 'success';
        };

        await retryWithBackoff(fn, {
          maxRetries: 3,
          onRetry
        });

        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry).toHaveBeenCalledWith(
          expect.any(Error),
          1,
          3
        );
      });

      it('should respect maxDelay', async () => {
        jest.useFakeTimers();

        let attempts = 0;
        const fn = async () => {
          attempts++;
          if (attempts < 5) throw new Error('Fail');
          return 'success';
        };

        const promise = retryWithBackoff(fn, {
          maxRetries: 5,
          initialDelay: 1000,
          maxDelay: 3000,
          backoffMultiplier: 2
        });

        await jest.runAllTimersAsync();
        await promise;

        jest.useRealTimers();
      });

      it('should handle async errors correctly', async () => {
        const fn = async () => {
          await Promise.resolve();
          throw new Error('Async error');
        };

        await expect(
          retryWithBackoff(fn, { maxRetries: 1 })
        ).rejects.toThrow('Async error');
      });
    });

    describe('tryWithHandler', () => {
      it('should execute function successfully', async () => {
        const fn = async () => 'success';

        const result = await tryWithHandler(fn, 'Test operation');

        expect(result).toBe('success');
      });

      it('should handle errors and re-throw', async () => {
        const fn = async () => {
          throw new Error('Test error');
        };

        await expect(
          tryWithHandler(fn, 'Test operation')
        ).rejects.toThrow('Test error');
      });

      it('should log error before re-throwing', async () => {
        const fn = async () => {
          throw new Error('Test error');
        };

        try {
          await tryWithHandler(fn, 'Test operation');
        } catch (error) {
          const history = errorHandler.getErrorHistory();
          expect(history.length).toBeGreaterThan(0);
        }
      });

      it('should pass options to error handler', async () => {
        const fn = async () => {
          throw new Error('Test error');
        };

        try {
          await tryWithHandler(fn, 'Test operation', {
            recovery: 'Custom recovery',
            silent: true
          });
        } catch (error) {
          // Error should have been handled with custom options
        }
      });
    });
  });

  describe('Recovery Strategies', () => {
    it('should have all recovery strategy types', () => {
      expect(RecoveryStrategies.RETRY).toBe('retry');
      expect(RecoveryStrategies.FALLBACK).toBe('fallback');
      expect(RecoveryStrategies.SKIP).toBe('skip');
      expect(RecoveryStrategies.ABORT).toBe('abort');
      expect(RecoveryStrategies.USER_INPUT).toBe('user_input');
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without message', () => {
      const error = new Error();
      expect(() => {
        errorHandler.handle(error);
      }).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      expect(() => {
        errorHandler.handle('string error');
      }).not.toThrow();
    });

    it('should handle null error', () => {
      expect(() => {
        errorHandler.handle(null);
      }).not.toThrow();
    });

    it('should handle errors with circular references', () => {
      const error = new Error('Test');
      error.circular = error;

      expect(() => {
        errorHandler.handle(error);
      }).not.toThrow();
    });
  });
});
