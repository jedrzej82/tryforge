/**
 * OpenRouter Client - Integration with free LLMs
 * 
 * Supports:
 * - Minimax M2 (FREE - best free model)
 * - Claude Code Max
 * - GPT-4 Turbo
 * - Mixtral 8x7B (FREE)
 * - Llama 3 70B (FREE)
 */

const axios = require('axios');

class OpenRouterClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.preferFree = config.preferFree !== false;  // Default true
    this.maxCostPerRequest = config.maxCostPerRequest || 0.05;
    
    // Model configurations
    this.models = {
      // FREE MODELS (Priority)
      'minimax-m2': {
        id: 'minimax/abab6-chat',
        name: 'Minimax M2',
        cost: 0,
        contextWindow: 245000,
        maxTokens: 16000,
        speed: 'fast',
        quality: 'excellent',
        free: true
      },
      'mixtral': {
        id: 'mistralai/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B',
        cost: 0,
        contextWindow: 32000,
        maxTokens: 8000,
        speed: 'very-fast',
        quality: 'good',
        free: true
      },
      'llama3-70b': {
        id: 'meta-llama/llama-3-70b-instruct',
        name: 'Llama 3 70B',
        cost: 0,
        contextWindow: 8000,
        maxTokens: 4000,
        speed: 'medium',
        quality: 'good',
        free: true
      },
      
      // PAID MODELS (Fallback)
      'claude-code-max': {
        id: 'anthropic/claude-3-opus-20240229',
        name: 'Claude Code Max',
        cost: 0.015,  // per 1K tokens
        contextWindow: 200000,
        maxTokens: 4096,
        speed: 'medium',
        quality: 'excellent',
        free: false
      },
      'claude-3.5-sonnet': {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        cost: 0.003,
        contextWindow: 200000,
        maxTokens: 4096,
        speed: 'fast',
        quality: 'excellent',
        free: false
      },
      'gpt-4-turbo': {
        id: 'openai/gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        cost: 0.01,
        contextWindow: 128000,
        maxTokens: 4096,
        speed: 'medium',
        quality: 'excellent',
        free: false
      }
    };
  }

  /**
   * Select best model based on task and preferences
   */
  selectModel(options = {}) {
    const { taskType, preferFree, maxCost } = options;
    
    // If prefer free, try free models first
    if (preferFree !== false && this.preferFree) {
      // Code generation tasks
      if (taskType === 'code' || taskType === 'generation') {
        return this.models['minimax-m2'];  // Best free model
      }
      
      // Fast responses
      if (taskType === 'quick' || taskType === 'simple') {
        return this.models['mixtral'];  // Fastest free
      }
      
      // Default free
      return this.models['minimax-m2'];
    }
    
    // Premium models
    if (taskType === 'code') {
      return this.models['claude-code-max'];
    }
    
    return this.models['claude-3.5-sonnet'];
  }

  /**
   * Generate completion using OpenRouter
   */
  async generate(options) {
    const {
      prompt,
      system = 'You are a helpful AI assistant specialized in code generation.',
      model,
      temperature = 0.7,
      maxTokens,
      stream = false
    } = options;

    // Select model if not specified
    const selectedModel = model 
      ? (this.models[model] || this.models['minimax-m2'])
      : this.selectModel(options);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: selectedModel.id,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens || selectedModel.maxTokens,
          stream
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://tryforge.dev',
            'X-Title': 'TryForge',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: selectedModel.name,
        modelId: selectedModel.id,
        usage: response.data.usage,
        cost: this.calculateCost(response.data.usage, selectedModel),
        free: selectedModel.free
      };

    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      
      // Fallback to next available model
      if (selectedModel.free) {
        console.log('Falling back to paid model...');
        return this.generate({
          ...options,
          model: 'claude-3.5-sonnet'
        });
      }
      
      throw error;
    }
  }

  /**
   * Generate code specifically
   */
  async generateCode(options) {
    const {
      description,
      language = 'javascript',
      framework,
      features = []
    } = options;

    const prompt = this.buildCodePrompt(description, language, framework, features);
    
    return this.generate({
      prompt,
      system: 'You are an expert software engineer. Generate clean, production-ready code.',
      taskType: 'code',
      temperature: 0.3,  // Lower for code
      ...options
    });
  }

  /**
   * Build code generation prompt
   */
  buildCodePrompt(description, language, framework, features) {
    let prompt = `Generate ${language} code for: ${description}\n\n`;
    
    if (framework) {
      prompt += `Framework: ${framework}\n`;
    }
    
    if (features.length > 0) {
      prompt += `Features to include:\n`;
      features.forEach(f => prompt += `- ${f}\n`);
    }
    
    prompt += `\nRequirements:
- Production-ready code
- Error handling
- Comments for complex logic
- Best practices
- Clean, readable structure

Please provide the complete, working code.`;

    return prompt;
  }

  /**
   * Calculate cost of request
   */
  calculateCost(usage, model) {
    if (model.free) return 0;
    
    const inputCost = (usage.prompt_tokens / 1000) * model.cost;
    const outputCost = (usage.completion_tokens / 1000) * model.cost * 2; // Output typically 2x
    
    return inputCost + outputCost;
  }

  /**
   * Batch generate multiple requests
   */
  async batchGenerate(requests) {
    const results = [];
    
    for (const request of requests) {
      const result = await this.generate(request);
      results.push(result);
      
      // Rate limiting (60 req/min for free models)
      await this.delay(1000);
    }
    
    return results;
  }

  /**
   * Stream generation (for real-time output)
   */
  async *streamGenerate(options) {
    const response = await this.generate({
      ...options,
      stream: true
    });
    
    // Process stream
    for await (const chunk of response) {
      yield chunk;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(freeOnly = false) {
    return Object.values(this.models)
      .filter(m => !freeOnly || m.free)
      .map(m => ({
        id: m.id,
        name: m.name,
        free: m.free,
        cost: m.cost,
        quality: m.quality,
        speed: m.speed
      }));
  }

  /**
   * Get model info
   */
  getModelInfo(modelKey) {
    return this.models[modelKey];
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      const result = await this.generate({
        prompt: 'Say "Hello from TryForge!"',
        model: 'minimax-m2'
      });
      
      return {
        success: true,
        message: result.content,
        model: result.model,
        free: result.free
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OpenRouterClient;
