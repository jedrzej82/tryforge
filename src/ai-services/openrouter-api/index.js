/**
 * OpenRouter API Integration - Access to multiple AI models via single API
 * Supports free models including MiniMax M2, Google Gemini Flash, Meta Llama, etc.
 */

const chalk = require('chalk');

class OpenRouterAPI {
  constructor() {
    this.client = null;
    this.apiKey = null;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'minimax/minimax-01'; // MiniMax M2 - Free model
    this.initializeClient();
  }

  /**
   * Initialize OpenRouter client
   */
  initializeClient() {
    this.apiKey = process.env.OPENROUTER_API_KEY;

    if (!this.apiKey || this.apiKey.includes('your-key-here')) {
      console.warn(chalk.yellow('⚠️  OPENROUTER_API_KEY not set. Using mock mode.'));
      this.mockMode = true;
      return;
    }

    this.mockMode = false;
    this.appName = process.env.APP_NAME || 'TryForge';
    this.siteUrl = process.env.SITE_URL || 'https://github.com/tryforge/tryforge';
  }

  /**
   * Get list of available free models
   */
  getFreeModels() {
    return [
      {
        id: 'minimax/minimax-01',
        name: 'MiniMax M2',
        description: 'MiniMax 01 - Fast and capable, completely free',
        context: 200000,
        isFree: true,
      },
      {
        id: 'google/gemini-flash-1.5',
        name: 'Google Gemini Flash 1.5',
        description: 'Fast Google model with long context',
        context: 1000000,
        isFree: true,
      },
      {
        id: 'google/gemini-flash-1.5-8b',
        name: 'Google Gemini Flash 1.5 8B',
        description: 'Lighter, faster Gemini model',
        context: 1000000,
        isFree: true,
      },
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Meta Llama 3.2 3B',
        description: 'Small but capable Llama model',
        context: 128000,
        isFree: true,
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Meta Llama 3.1 8B',
        description: 'Balanced Llama model',
        context: 128000,
        isFree: true,
      },
      {
        id: 'microsoft/phi-3-medium-128k-instruct:free',
        name: 'Microsoft Phi-3 Medium',
        description: 'Microsoft\'s efficient model',
        context: 128000,
        isFree: true,
      },
      {
        id: 'qwen/qwen-2-7b-instruct:free',
        name: 'Qwen 2 7B',
        description: 'Alibaba\'s multilingual model',
        context: 32000,
        isFree: true,
      },
    ];
  }

  /**
   * Generate code with streaming for real-time feedback
   * @param {string} prompt - Code generation prompt
   * @param {Object} options - Generation options
   * @returns {AsyncGenerator} Stream of generated code
   */
  async *generateCodeStream(prompt, options = {}) {
    if (this.mockMode) {
      yield* this.mockGenerateStream(prompt);
      return;
    }

    try {
      const model = options.model || this.defaultModel;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(options.type),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 4096,
          stream: true,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data:', '').trim();
          if (data === '[DONE]') continue;
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`OpenRouter API error: ${error.message}`));
      yield* this.mockGenerateStream(prompt);
    }
  }

  /**
   * Generate complete code (non-streaming)
   * @param {string} prompt - Code generation prompt
   * @param {Object} options - Generation options
   * @returns {string} Generated code
   */
  async generateCode(prompt, options = {}) {
    if (this.mockMode) {
      return this.mockGenerate(prompt, options);
    }

    try {
      const model = options.model || this.defaultModel;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(options.type),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error(chalk.red(`OpenRouter API error: ${error.message}`));
      return this.mockGenerate(prompt, options);
    }
  }

  /**
   * Generate React component
   */
  async generateReactComponent(description, context = {}) {
    const prompt = `Generate a complete React component based on this description:
${description}

Context:
- Project: ${context.projectName || 'React Application'}
- Styling: ${context.styling || 'CSS'}
- State management: ${context.stateManagement || 'useState'}

Requirements:
- Modern React (hooks, functional components)
- Clean, maintainable code
- Proper prop types or TypeScript
- Include necessary imports
- Add helpful comments

Return only the component code, no explanations.`;

    return await this.generateCode(prompt, { type: 'component', ...context });
  }

  /**
   * Generate Express route
   */
  async generateExpressRoute(description, context = {}) {
    const prompt = `Generate an Express.js route based on this description:
${description}

Context:
- API: ${context.apiName || 'REST API'}
- Database: ${context.database || 'PostgreSQL'}
- Authentication: ${context.auth || 'JWT'}

Requirements:
- RESTful best practices
- Error handling
- Input validation
- Proper status codes
- Add helpful comments

Return only the route code, no explanations.`;

    return await this.generateCode(prompt, { type: 'route', ...context });
  }

  /**
   * Fix code errors
   */
  async fixCodeError(code, error, context = {}) {
    const prompt = `Fix this code error:

CODE:
\`\`\`
${code}
\`\`\`

ERROR:
${error}

Context: ${JSON.stringify(context, null, 2)}

Return the complete fixed code with the error resolved. No explanations, just code.`;

    return await this.generateCode(prompt, { type: 'fix', ...context });
  }

  /**
   * Improve existing code
   */
  async improveCode(code, improvements, context = {}) {
    const prompt = `Improve this code with the following improvements:
${improvements.join('\n- ')}

CODE:
\`\`\`
${code}
\`\`\`

Context: ${JSON.stringify(context, null, 2)}

Return the improved code. No explanations, just code.`;

    return await this.generateCode(prompt, { type: 'improve', ...context });
  }

  /**
   * Get system prompt based on task type
   */
  getSystemPrompt(type) {
    const prompts = {
      component: 'You are an expert React developer. Generate clean, modern, production-ready React components.',
      route: 'You are an expert backend developer. Generate secure, efficient Express.js routes with proper error handling.',
      fix: 'You are an expert debugger. Fix code errors while maintaining functionality and best practices.',
      improve: 'You are an expert code reviewer. Improve code quality, performance, and maintainability.',
      default: 'You are an expert software developer. Generate clean, efficient, production-ready code.',
    };

    return prompts[type] || prompts.default;
  }

  /**
   * Mock code generation for when API is not configured
   */
  async *mockGenerateStream(prompt) {
    const mockResponse = `// Generated with OpenRouter (Mock Mode)
// Configure OPENROUTER_API_KEY to use real AI generation

// TODO: Implement based on: ${prompt.substring(0, 50)}...

export default function Component() {
  return <div>Configure OpenRouter API to generate real code</div>;
}`;

    for (const char of mockResponse) {
      yield char;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Mock code generation (non-streaming)
   */
  mockGenerate(prompt, options) {
    return `// Generated with OpenRouter (Mock Mode)
// Configure OPENROUTER_API_KEY to use real AI generation

// TODO: Implement based on: ${prompt.substring(0, 50)}...

export default function Component() {
  return <div>Configure OpenRouter API to generate real code</div>;
}`;
  }

  /**
   * Get model information
   */
  async getModelInfo(modelId) {
    if (this.mockMode) {
      return { name: modelId, mock: true };
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data.find(m => m.id === modelId);
    } catch (error) {
      console.error(chalk.red(`Error fetching model info: ${error.message}`));
      return null;
    }
  }

  /**
   * Get account credits/usage
   */
  async getCredits() {
    if (this.mockMode) {
      return { credits: 0, mock: true };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      return await response.json();
    } catch (error) {
      console.error(chalk.red(`Error fetching credits: ${error.message}`));
      return null;
    }
  }
}

module.exports = OpenRouterAPI;
