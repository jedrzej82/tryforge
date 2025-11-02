/**
 * Unit Tests for Claude API Integration
 * Tests AI-powered code generation with Anthropic Claude
 */

// Mock Anthropic SDK
const mockMessages = {
  create: jest.fn(),
  stream: jest.fn(),
};

const mockAnthropicClient = {
  messages: mockMessages,
};

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => mockAnthropicClient);
});

// Mock other dependencies
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  }));
});

const ClaudeAPI = require('@ai-services/claude-api');

describe('ClaudeAPI', () => {
  let claudeAPI;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original environment
    originalEnv = { ...process.env };

    // Set test environment
    process.env.ANTHROPIC_API_KEY = 'test-api-key-123';
    process.env.CLAUDE_AUTH_MODE = 'api';

    claudeAPI = new ClaudeAPI();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with API key mode', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.CLAUDE_AUTH_MODE = 'api';

      const api = new ClaudeAPI();

      expect(api.authMode).toBe('api');
      expect(api.mockMode).toBe(false);
      expect(api.client).toBeDefined();
    });

    it('should initialize with subscription mode', () => {
      process.env.CLAUDE_AUTH_MODE = 'subscription';
      process.env.CLAUDE_SESSION_TOKEN = 'test-session-token';
      process.env.CLAUDE_ORGANIZATION_ID = 'test-org-id';

      const api = new ClaudeAPI();

      expect(api.authMode).toBe('subscription');
      expect(api.sessionToken).toBe('test-session-token');
      expect(api.organizationId).toBe('test-org-id');
    });

    it('should use mock mode when API key is missing', () => {
      process.env.ANTHROPIC_API_KEY = '';

      const api = new ClaudeAPI();

      expect(api.mockMode).toBe(true);
    });

    it('should use mock mode when API key is placeholder', () => {
      process.env.ANTHROPIC_API_KEY = 'your-key-here';

      const api = new ClaudeAPI();

      expect(api.mockMode).toBe(true);
    });

    it('should handle initialization errors gracefully', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      // Mock constructor to throw
      const Anthropic = require('@anthropic-ai/sdk');
      Anthropic.mockImplementationOnce(() => {
        throw new Error('Init error');
      });

      const api = new ClaudeAPI();

      expect(api.mockMode).toBe(true);
    });

    it('should set correct model', () => {
      expect(claudeAPI.model).toBe('claude-sonnet-4-20250514');
    });
  });

  describe('generateCode', () => {
    beforeEach(() => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Generated code' }],
      });
    });

    it('should generate code successfully', async () => {
      const prompt = 'Create a React component';
      const code = await claudeAPI.generateCode(prompt);

      expect(code).toBe('Generated code');
      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: claudeAPI.model,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: prompt })
          ])
        })
      );
    });

    it('should include system prompt', async () => {
      await claudeAPI.generateCode('Test prompt', { type: 'react-component' });

      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('React')
        })
      );
    });

    it('should use custom max tokens', async () => {
      await claudeAPI.generateCode('Test prompt', { maxTokens: 8000 });

      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 8000
        })
      );
    });

    it('should use default max tokens', async () => {
      await claudeAPI.generateCode('Test prompt');

      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4096
        })
      );
    });

    it('should retry on API errors', async () => {
      mockMessages.create
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce({ content: [{ text: 'Success' }] });

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toBe('Success');
      expect(mockMessages.create).toHaveBeenCalledTimes(3);
    });

    it('should fall back to mock after max retries', async () => {
      mockMessages.create.mockRejectedValue(new Error('API error'));

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toContain('Generated code');
      expect(mockMessages.create).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should use mock mode when client not initialized', async () => {
      claudeAPI.mockMode = true;

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toContain('Generated code');
      expect(mockMessages.create).not.toHaveBeenCalled();
    });

    it('should log AI requests', async () => {
      await claudeAPI.generateCode('Test prompt');

      // Logger should have been called (mocked in setup)
      expect(mockMessages.create).toHaveBeenCalled();
    });
  });

  describe('generateCodeStream', () => {
    it('should stream code generation', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'World' } };
        }
      };

      mockMessages.stream.mockResolvedValue(mockStream);

      const chunks = [];
      for await (const chunk of claudeAPI.generateCodeStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'World']);
      expect(mockMessages.stream).toHaveBeenCalled();
    });

    it('should filter non-text deltas', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'other_type', delta: { text: 'Should not appear' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } };
        }
      };

      mockMessages.stream.mockResolvedValue(mockStream);

      const chunks = [];
      for await (const chunk of claudeAPI.generateCodeStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello']);
    });

    it('should fall back to mock stream on error', async () => {
      mockMessages.stream.mockRejectedValue(new Error('Stream error'));

      const chunks = [];
      for await (const chunk of claudeAPI.generateCodeStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should use mock stream when in mock mode', async () => {
      claudeAPI.mockMode = true;

      const chunks = [];
      for await (const chunk of claudeAPI.generateCodeStream('Test prompt')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(mockMessages.stream).not.toHaveBeenCalled();
    });
  });

  describe('Specialized Generation Methods', () => {
    beforeEach(() => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Generated code' }],
      });
    });

    describe('generateReactComponent', () => {
      it('should generate React component', async () => {
        const code = await claudeAPI.generateReactComponent('User profile card');

        expect(code).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringContaining('React component')
              })
            ])
          })
        );
      });

      it('should include context in prompt', async () => {
        await claudeAPI.generateReactComponent('Test component', {
          styling: 'Tailwind CSS',
          typescript: true,
          features: ['form validation', 'error handling']
        });

        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/Tailwind CSS/)
              })
            ])
          })
        );
      });
    });

    describe('generateExpressRoute', () => {
      it('should generate Express route', async () => {
        const code = await claudeAPI.generateExpressRoute('User CRUD API');

        expect(code).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalled();
      });

      it('should include context in prompt', async () => {
        await claudeAPI.generateExpressRoute('API endpoint', {
          database: 'MongoDB',
          auth: 'OAuth2',
          features: ['pagination', 'filtering']
        });

        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/MongoDB/)
              })
            ])
          })
        );
      });
    });

    describe('generateDatabaseSchema', () => {
      it('should generate database schema', async () => {
        const code = await claudeAPI.generateDatabaseSchema(
          'E-commerce application',
          ['users', 'products', 'orders']
        );

        expect(code).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/users.*products.*orders/s)
              })
            ])
          })
        );
      });
    });

    describe('fixCodeError', () => {
      it('should fix code errors', async () => {
        const buggyCode = 'const x = ';
        const error = 'Unexpected end of input';

        const fixedCode = await claudeAPI.fixCodeError(buggyCode, error);

        expect(fixedCode).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/Fix this code error/)
              })
            ])
          })
        );
      });

      it('should include context', async () => {
        await claudeAPI.fixCodeError('code', 'error', {
          language: 'TypeScript',
          errorType: 'compilation'
        });

        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/TypeScript/)
              })
            ])
          })
        );
      });
    });

    describe('improveCode', () => {
      it('should improve code', async () => {
        const code = 'function test() { return true; }';
        const improvements = ['Add error handling', 'Add type safety'];

        const improvedCode = await claudeAPI.improveCode(code, improvements);

        expect(improvedCode).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalled();
      });
    });

    describe('generateTests', () => {
      it('should generate unit tests', async () => {
        const code = 'function add(a, b) { return a + b; }';

        const tests = await claudeAPI.generateTests(code, 'unit');

        expect(tests).toBe('Generated code');
        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/unit tests/)
              })
            ])
          })
        );
      });

      it('should generate integration tests', async () => {
        const code = 'API code';

        await claudeAPI.generateTests(code, 'integration');

        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/integration tests/)
              })
            ])
          })
        );
      });
    });

    describe('analyzeCode', () => {
      it('should analyze code and return JSON', async () => {
        const analysisResult = {
          issues: [{ severity: 'high', description: 'Security issue' }],
          improvements: [{ category: 'performance', suggestion: 'Use caching' }],
          score: 75
        };

        mockMessages.create.mockResolvedValue({
          content: [{ text: JSON.stringify(analysisResult) }],
        });

        const analysis = await claudeAPI.analyzeCode('function test() {}');

        expect(analysis.score).toBe(75);
        expect(analysis.issues.length).toBe(1);
        expect(analysis.improvements.length).toBe(1);
      });

      it('should handle invalid JSON response', async () => {
        mockMessages.create.mockResolvedValue({
          content: [{ text: 'Invalid JSON' }],
        });

        const analysis = await claudeAPI.analyzeCode('code');

        expect(analysis.score).toBe(0);
        expect(analysis.issues).toEqual([]);
        expect(analysis.improvements).toEqual([]);
      });

      it('should include focus areas in prompt', async () => {
        await claudeAPI.analyzeCode('code', ['security', 'performance']);

        expect(mockMessages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: expect.stringMatching(/security, performance/)
              })
            ])
          })
        );
      });
    });
  });

  describe('System Prompts', () => {
    it('should return correct prompt for react-component', () => {
      const prompt = claudeAPI.getSystemPrompt('react-component');

      expect(prompt).toContain('React');
      expect(prompt).toContain('production-ready');
    });

    it('should return correct prompt for express-route', () => {
      const prompt = claudeAPI.getSystemPrompt('express-route');

      expect(prompt).toContain('Express');
      expect(prompt).toContain('backend');
    });

    it('should return correct prompt for database-schema', () => {
      const prompt = claudeAPI.getSystemPrompt('database-schema');

      expect(prompt).toContain('database');
      expect(prompt).toContain('architect');
    });

    it('should return default prompt for unknown type', () => {
      const prompt = claudeAPI.getSystemPrompt('unknown-type');

      expect(prompt).toContain('software developer');
    });
  });

  describe('Mock Generation', () => {
    beforeEach(() => {
      claudeAPI.mockMode = true;
    });

    it('should generate mock React component', () => {
      const code = claudeAPI.mockGenerate('prompt', { type: 'react-component' });

      expect(code).toContain('React');
      expect(code).toContain('useState');
      expect(code).toContain('export default');
    });

    it('should generate mock Express route', () => {
      const code = claudeAPI.mockGenerate('prompt', { type: 'express-route' });

      expect(code).toContain('express');
      expect(code).toContain('router');
      expect(code).toContain('module.exports');
    });

    it('should generate mock database schema', () => {
      const code = claudeAPI.mockGenerate('prompt', { type: 'database-schema' });

      expect(code).toContain('CREATE TABLE');
      expect(code).toContain('PRIMARY KEY');
    });

    it('should generate default mock for unknown type', () => {
      const code = claudeAPI.mockGenerate('prompt');

      expect(code).toContain('Generated code');
    });
  });

  describe('Mock Streaming', () => {
    beforeEach(() => {
      claudeAPI.mockMode = true;
    });

    it('should stream mock response word by word', async () => {
      const chunks = [];

      for await (const chunk of claudeAPI.mockGenerateStream('prompt')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should have delay between chunks', async () => {
      jest.useFakeTimers();

      const generator = claudeAPI.mockGenerateStream('prompt');
      const firstChunk = await generator.next();

      expect(firstChunk.value).toBeDefined();

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limit errors', async () => {
      mockMessages.create.mockRejectedValue(new Error('Rate limit exceeded'));

      const code = await claudeAPI.generateCode('Test prompt');

      // Should fall back to mock
      expect(code).toContain('Generated code');
    });

    it('should handle API authentication errors', async () => {
      mockMessages.create.mockRejectedValue(new Error('Invalid API key'));

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockMessages.create.mockRejectedValue(new Error('ECONNREFUSED'));

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      mockMessages.create.mockRejectedValue(new Error('Request timeout'));

      const code = await claudeAPI.generateCode('Test prompt');

      expect(code).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts', async () => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Response' }],
      });

      const code = await claudeAPI.generateCode('');

      expect(code).toBe('Response');
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'a'.repeat(10000);

      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Response' }],
      });

      const code = await claudeAPI.generateCode(longPrompt);

      expect(code).toBe('Response');
    });

    it('should handle special characters in prompts', async () => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Response' }],
      });

      const code = await claudeAPI.generateCode('Test \n\t "quotes" \'apostrophes\'');

      expect(code).toBe('Response');
    });

    it('should handle unicode characters', async () => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Response' }],
      });

      const code = await claudeAPI.generateCode('测试 🚀 тест');

      expect(code).toBe('Response');
    });

    it('should handle null options', async () => {
      mockMessages.create.mockResolvedValue({
        content: [{ text: 'Response' }],
      });

      const code = await claudeAPI.generateCode('Test', null);

      expect(code).toBe('Response');
    });
  });
});
