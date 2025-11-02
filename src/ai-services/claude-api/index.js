/**
 * Claude API Integration - Real AI-powered code generation
 * Uses Anthropic Claude API for intelligent code creation
 */

const Anthropic = require('@anthropic-ai/sdk');
const chalk = require('chalk');
const ora = require('ora');

class ClaudeAPI {
  constructor() {
    this.client = null;
    this.model = 'claude-sonnet-4-20250514';
    this.initializeClient();
  }

  /**
   * Initialize Anthropic client
   */
  initializeClient() {
    const authMode = process.env.CLAUDE_AUTH_MODE || 'api';

    if (authMode === 'subscription') {
      this.initializeSubscriptionMode();
    } else {
      this.initializeApiMode();
    }
  }

  /**
   * Initialize API key mode
   */
  initializeApiMode() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes('your-key-here')) {
      console.warn(chalk.yellow('⚠️  ANTHROPIC_API_KEY not set. Using mock mode.'));
      this.mockMode = true;
      return;
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.authMode = 'api';
    this.mockMode = false;
  }

  /**
   * Initialize subscription token mode (Claude Pro/Max)
   */
  initializeSubscriptionMode() {
    const sessionToken = process.env.CLAUDE_SESSION_TOKEN;
    const organizationId = process.env.CLAUDE_ORGANIZATION_ID;

    if (!sessionToken || sessionToken.includes('your-session-token-here')) {
      console.warn(chalk.yellow('⚠️  CLAUDE_SESSION_TOKEN not set. Using mock mode.'));
      this.mockMode = true;
      return;
    }

    // For subscription mode, we'll use the Anthropic SDK but with custom headers
    // The SDK supports this via defaultHeaders option
    this.client = new Anthropic({
      apiKey: sessionToken, // Session token can be used as API key in some cases
      defaultHeaders: {
        'anthropic-version': '2023-06-01',
        'cookie': `sessionKey=${sessionToken}`,
        ...(organizationId && { 'anthropic-organization': organizationId }),
      },
    });
    this.authMode = 'subscription';
    this.sessionToken = sessionToken;
    this.organizationId = organizationId;
    this.mockMode = false;
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
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: this.getSystemPrompt(options.type),
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error(chalk.red(`Claude API error: ${error.message}`));
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
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: this.getSystemPrompt(options.type),
      });

      return message.content[0].text;
    } catch (error) {
      console.error(chalk.red(`Claude API error: ${error.message}`));
      return this.mockGenerate(prompt, options);
    }
  }

  /**
   * Generate React component with Claude
   */
  async generateReactComponent(description, context = {}) {
    const prompt = `Generate a complete, production-ready React component based on this description:

${description}

Context:
- Framework: React 18 with hooks
- Styling: ${context.styling || 'CSS Modules'}
- TypeScript: ${context.typescript ? 'Yes' : 'No'}
- Features needed: ${context.features?.join(', ') || 'standard functionality'}

Requirements:
1. Use modern React patterns (hooks, functional components)
2. Include proper PropTypes or TypeScript types
3. Add comprehensive error handling
4. Include loading and error states
5. Make it fully accessible (ARIA labels)
6. Add helpful comments
7. Export as default

Generate ONLY the component code, no explanations.`;

    return await this.generateCode(prompt, { type: 'react-component' });
  }

  /**
   * Generate Express API route with Claude
   */
  async generateExpressRoute(description, context = {}) {
    const prompt = `Generate a complete, production-ready Express.js API route based on this description:

${description}

Context:
- Database: ${context.database || 'PostgreSQL'}
- Authentication: ${context.auth || 'JWT'}
- Features needed: ${context.features?.join(', ') || 'standard CRUD'}

Requirements:
1. Include proper input validation (Joi)
2. Add authentication middleware if needed
3. Implement error handling
4. Add rate limiting
5. Include JSDoc comments
6. Follow REST best practices
7. Return proper HTTP status codes

Generate ONLY the route code, no explanations.`;

    return await this.generateCode(prompt, { type: 'express-route' });
  }

  /**
   * Generate database schema with Claude
   */
  async generateDatabaseSchema(description, tables) {
    const prompt = `Generate a complete PostgreSQL database schema for this application:

${description}

Tables needed:
${tables.map(t => `- ${t}`).join('\n')}

Requirements:
1. Proper data types for each field
2. Primary keys and foreign keys
3. Indexes for performance
4. Constraints (NOT NULL, UNIQUE, etc.)
5. Default values where appropriate
6. Timestamps (created_at, updated_at)
7. Triggers for automatic timestamp updates

Generate complete SQL schema with all tables, relationships, and indexes.`;

    return await this.generateCode(prompt, { type: 'database-schema' });
  }

  /**
   * Fix code errors with Claude
   */
  async fixCodeError(code, error, context = {}) {
    const prompt = `Fix this code error:

ERROR:
${error}

CODE:
\`\`\`
${code}
\`\`\`

Context:
- Language/Framework: ${context.language || 'JavaScript/React'}
- Error type: ${context.errorType || 'compilation/runtime'}

Requirements:
1. Identify the root cause
2. Fix the error
3. Ensure no new errors are introduced
4. Maintain code functionality
5. Keep the same code style

Return ONLY the fixed code, no explanations.`;

    return await this.generateCode(prompt, { type: 'code-fix' });
  }

  /**
   * Improve code with Claude
   */
  async improveCode(code, improvements, context = {}) {
    const prompt = `Improve this code:

CODE:
\`\`\`
${code}
\`\`\`

Improvements requested:
${improvements.join('\n')}

Context:
- Framework: ${context.framework || 'React/Express'}
- Focus: ${context.focus || 'performance, readability, best practices'}

Requirements:
1. Apply all requested improvements
2. Maintain existing functionality
3. Follow best practices
4. Add comments for complex logic
5. Keep code readable

Return ONLY the improved code, no explanations.`;

    return await this.generateCode(prompt, { type: 'code-improvement' });
  }

  /**
   * Generate tests with Claude
   */
  async generateTests(code, type = 'unit') {
    const prompt = `Generate comprehensive ${type} tests for this code:

\`\`\`
${code}
\`\`\`

Requirements:
1. Test framework: Jest
2. Cover all functions/components
3. Include edge cases
4. Test error handling
5. Add descriptive test names
6. Mock external dependencies

Generate complete test file.`;

    return await this.generateCode(prompt, { type: 'tests' });
  }

  /**
   * Analyze code and suggest improvements
   */
  async analyzeCode(code, focusAreas = []) {
    const prompt = `Analyze this code and suggest improvements:

\`\`\`
${code}
\`\`\`

Focus areas: ${focusAreas.join(', ') || 'all aspects'}

Provide:
1. Issues found (bugs, anti-patterns, security)
2. Performance improvements
3. Code quality suggestions
4. Best practices violations
5. Refactoring opportunities

Format as JSON with structure:
{
  "issues": [{"severity": "high/medium/low", "description": "...", "location": "..."}],
  "improvements": [{"category": "...", "suggestion": "...", "impact": "..."}],
  "score": "0-100"
}`;

    const result = await this.generateCode(prompt, { type: 'analysis' });

    try {
      return JSON.parse(result);
    } catch {
      return { issues: [], improvements: [], score: 0 };
    }
  }

  /**
   * Get system prompt for different generation types
   */
  getSystemPrompt(type) {
    const prompts = {
      'react-component': `You are an expert React developer. Generate production-ready, modern React components with hooks, proper TypeScript types, accessibility, and best practices.`,

      'express-route': `You are an expert backend developer. Generate secure, scalable Express.js API routes with proper validation, error handling, and database integration.`,

      'database-schema': `You are an expert database architect. Generate optimized PostgreSQL schemas with proper relationships, indexes, and constraints.`,

      'code-fix': `You are an expert debugging assistant. Fix code errors while maintaining functionality and following best practices.`,

      'code-improvement': `You are an expert code reviewer. Improve code quality, performance, and maintainability while preserving functionality.`,

      'tests': `You are an expert test engineer. Generate comprehensive, maintainable tests with good coverage.`,

      'analysis': `You are an expert code analyzer. Identify issues, suggest improvements, and provide actionable feedback.`,
    };

    return prompts[type] || 'You are an expert software developer. Generate high-quality, production-ready code.';
  }

  /**
   * Mock generate for when API key is not available
   */
  async *mockGenerateStream(prompt) {
    const mockResponse = this.mockGenerate(prompt);
    const words = mockResponse.split(' ');

    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Mock generate (non-streaming)
   */
  mockGenerate(prompt, options = {}) {
    const type = options.type || 'generic';

    const mockResponses = {
      'react-component': `import React, { useState } from 'react';

function GeneratedComponent({ data }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="generated-component">
      <h2>Generated Component</h2>
      {/* Component content */}
    </div>
  );
}

export default GeneratedComponent;`,

      'express-route': `const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Route logic
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;`,

      'database-schema': `CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_created_at ON items(created_at);`,
    };

    return mockResponses[type] || '// Generated code\nconsole.log("Mock code generation");';
  }
}

module.exports = ClaudeAPI;
