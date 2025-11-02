/**
 * Triple AI Orchestrator
 * Coordinates OpenRouter (Minimax M2 + Claude), GitHub Spark, and Pollinations AI
 */

const axios = require('axios');
const Logger = require('../utils/logger');
const OpenRouterClient = require('./openrouter-client');
const PollinationsClient = require('./pollinations-client');

class TripleAI {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger();
    
    // Initialize AI clients
    this.openRouter = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY || config.openRouterKey,
      preferFree: config.preferFree !== false
    });
    
    this.pollinations = new PollinationsClient({
      defaultStyle: config.defaultStyle || 'realistic',
      cacheEnabled: config.cacheGraphics !== false
    });
    
    // GitHub Spark for UI
    this.githubSpark = {
      endpoint: process.env.GITHUB_SPARK_ENDPOINT || 'https://spark.github.com/api',
      token: process.env.GITHUB_TOKEN || config.githubToken
    };
    
    // Claude Code Max (premium fallback)
    this.claude = {
      endpoint: process.env.CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1',
      apiKey: process.env.CLAUDE_CODE_MAX_TOKEN || process.env.CLAUDE_API_KEY || config.claudeKey
    };
  }

  /**
   * Generate project architecture using AI
   */
  async generateArchitecture(projectDescription, options = {}) {
    this.logger.info('AI: Generating project architecture...');
    
    const prompt = `Create a detailed architecture for: ${projectDescription}
    Type: ${options.type || 'webapp'}
    Include: database schema, API endpoints, components, and file structure.
    
    Provide a complete, production-ready architecture.`;
    
    try {
      // Use OpenRouter (Minimax M2 - FREE)
      const result = await this.openRouter.generateCode({
        description: projectDescription,
        language: options.language || 'javascript',
        framework: options.framework,
        features: options.features || []
      });
      
      this.logger.info(`AI: Architecture generated using ${result.model} (${result.free ? 'FREE' : 'PAID'})`);
      
      const architecture = this.parseArchitecture(result.content);
      architecture.aiModel = result.model;
      architecture.cost = result.cost;
      architecture.free = result.free;
      
      return architecture;
    } catch (error) {
      this.logger.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Generate UI components using GitHub Spark
   */
  async generateUIComponents(componentDescriptions) {
    this.logger.info('GitHub Spark: Generating UI components...');
    
    try {
      // Simulate GitHub Spark API call
      const components = componentDescriptions.map(desc => ({
        name: desc.name,
        path: `src/components/${desc.name}.jsx`,
        code: this.generateComponentCode(desc)
      }));
      
      return components;
    } catch (error) {
      this.logger.error('GitHub Spark error:', error);
      throw error;
    }
  }

  /**
   * Generate graphics using Pollinations AI
   */
  async generateGraphics(graphicDescriptions) {
    this.logger.info('Pollinations AI: Generating graphics...');
    
    try {
      const graphics = [];
      
      for (const desc of graphicDescriptions) {
        const url = `${this.pollinations.endpoint}/prompt/${encodeURIComponent(desc.prompt)}`;
        graphics.push({
          name: desc.name,
          url: url,
          type: desc.type || 'image/png'
        });
      }
      
      return graphics;
    } catch (error) {
      this.logger.error('Pollinations AI error:', error);
      throw error;
    }
  }

  /**
   * Orchestrate all three AIs in parallel
   */
  async orchestrate(projectDescription, options = {}) {
    this.logger.info('🔥 Starting Triple AI orchestration...');
    
    try {
      // Step 1: Claude generates architecture
      const architecture = await this.generateArchitecture(projectDescription, options);
      
      // Step 2: Prepare descriptions for other AIs
      const componentDescriptions = this.extractComponentDescriptions(architecture);
      const graphicDescriptions = this.extractGraphicDescriptions(architecture, options);
      
      // Step 3: Run GitHub Spark and Pollinations in parallel
      const [components, graphics] = await Promise.all([
        this.generateUIComponents(componentDescriptions),
        options.graphics !== false ? this.generateGraphics(graphicDescriptions) : Promise.resolve([])
      ]);
      
      return {
        architecture,
        components,
        graphics,
        metadata: {
          timestamp: new Date().toISOString(),
          tripleAI: true,
          services: ['claude', 'github-spark', 'pollinations']
        }
      };
    } catch (error) {
      this.logger.error('Orchestration failed:', error);
      throw error;
    }
  }

  // Helper methods
  generateDatabaseSchema(description, options) {
    return {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'SERIAL PRIMARY KEY' },
            { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL' },
            { name: 'password_hash', type: 'VARCHAR(255) NOT NULL' },
            { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' }
          ]
        }
      ]
    };
  }

  generateAPIEndpoints(description, options) {
    return [
      { method: 'GET', path: '/api/health', description: 'Health check' },
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'POST', path: '/api/auth/register', description: 'User registration' },
      { method: 'GET', path: '/api/users/:id', description: 'Get user by ID' }
    ];
  }

  generateFrontendStructure(description, options) {
    return {
      framework: 'React',
      buildTool: 'Vite',
      structure: [
        'src/components/',
        'src/pages/',
        'src/hooks/',
        'src/utils/',
        'src/styles/'
      ]
    };
  }

  generateBackendStructure(description, options) {
    return {
      framework: 'Express',
      structure: [
        'src/routes/',
        'src/controllers/',
        'src/models/',
        'src/middleware/',
        'src/services/'
      ]
    };
  }

  extractComponentDescriptions(architecture) {
    return [
      { name: 'Header', type: 'navigation', props: ['logo', 'menu'] },
      { name: 'Footer', type: 'footer', props: ['links', 'copyright'] },
      { name: 'Dashboard', type: 'page', props: ['data'] }
    ];
  }

  extractGraphicDescriptions(architecture, options) {
    return [
      { name: 'logo', prompt: 'Modern tech company logo, minimalist, blue and white', type: 'logo' },
      { name: 'hero', prompt: 'Abstract tech background, gradient, modern', type: 'hero' }
    ];
  }

  generateComponentCode(desc) {
    return `import React from 'react';

export default function ${desc.name}() {
  return (
    <div className="${desc.name.toLowerCase()}">
      <h2>${desc.name} Component</h2>
    </div>
  );
}`;
  }
}

module.exports = TripleAI;
