const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), '.env');
    this.configStorePath = path.join(process.cwd(), '.tryforge', 'config.json');
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Get or create encryption key for secure storage
   */
  getOrCreateEncryptionKey() {
    const keyPath = path.join(process.cwd(), '.tryforge', 'encryption.key');
    try {
      return fs.readFileSync(keyPath, 'utf8');
    } catch (error) {
      // Generate new key if doesn't exist
      const key = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(path.dirname(keyPath), { recursive: true });
      fs.writeFileSync(keyPath, key);
      return key;
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'hex'),
        iv
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return encryptedText; // Return as-is if not encrypted
    }
  }

  /**
   * Read current configuration
   */
  async readConfig() {
    try {
      const envContent = await fs.readFile(this.configPath, 'utf8');
      const config = this.parseEnvFile(envContent);

      // Read encrypted config store if exists
      try {
        const storeContent = await fs.readFile(this.configStorePath, 'utf8');
        const store = JSON.parse(storeContent);

        // Decrypt sensitive values
        Object.keys(store).forEach(key => {
          if (store[key].encrypted) {
            config[key] = this.decrypt(store[key].value);
          }
        });
      } catch (error) {
        // Store doesn't exist yet
      }

      return this.formatConfigForDisplay(config);
    } catch (error) {
      return this.getDefaultConfig();
    }
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
    const config = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return config;
  }

  /**
   * Format config for display (mask sensitive values)
   */
  formatConfigForDisplay(config) {
    const formatted = {
      aiProvider: config.AI_PROVIDER || 'claude',
      claude: {
        authMode: config.CLAUDE_AUTH_MODE || 'api',
        apiKey: this.maskValue(config.ANTHROPIC_API_KEY),
        sessionToken: this.maskValue(config.CLAUDE_SESSION_TOKEN),
        organizationId: config.CLAUDE_ORGANIZATION_ID || '',
      },
      openrouter: {
        apiKey: this.maskValue(config.OPENROUTER_API_KEY),
        model: config.OPENROUTER_MODEL || 'minimax/minimax-01',
      },
      github: {
        username: config.GITHUB_USERNAME || '',
        email: config.GITHUB_EMAIL || '',
      },
      deployment: {
        vercel: this.maskValue(config.VERCEL_TOKEN),
        netlify: this.maskValue(config.NETLIFY_TOKEN),
        railway: this.maskValue(config.RAILWAY_TOKEN),
        render: this.maskValue(config.RENDER_API_KEY),
      },
      database: {
        url: this.maskDatabaseUrl(config.DATABASE_URL),
        user: config.POSTGRES_USER || '',
      },
      redis: {
        url: this.maskValue(config.REDIS_URL),
      },
      ports: {
        frontend: config.FRONTEND_PORT || '5173',
        backend: config.BACKEND_PORT || '3000',
        preview: config.PREVIEW_PORT || '4000',
      },
      settings: {
        nodeEnv: config.NODE_ENV || 'development',
        logLevel: config.LOG_LEVEL || 'info',
        playwrightHeadless: config.PLAYWRIGHT_HEADLESS === 'true',
      },
    };

    return formatted;
  }

  /**
   * Mask sensitive value for display
   */
  maskValue(value) {
    if (!value || value === 'your-key-here' || value.includes('your-')) {
      return '';
    }
    if (value.length <= 8) {
      return '***';
    }
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }

  /**
   * Mask database URL
   */
  maskDatabaseUrl(url) {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return this.maskValue(url);
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(updates) {
    const currentEnv = await this.readCurrentEnv();
    const encryptedStore = {};

    // Update values
    if (updates.aiProvider) {
      currentEnv.AI_PROVIDER = updates.aiProvider;
    }

    if (updates.claude?.authMode) {
      currentEnv.CLAUDE_AUTH_MODE = updates.claude.authMode;
    }
    if (updates.claude?.apiKey) {
      currentEnv.ANTHROPIC_API_KEY = updates.claude.apiKey;
      encryptedStore.ANTHROPIC_API_KEY = {
        encrypted: true,
        value: this.encrypt(updates.claude.apiKey),
      };
    }
    if (updates.claude?.sessionToken) {
      currentEnv.CLAUDE_SESSION_TOKEN = updates.claude.sessionToken;
      encryptedStore.CLAUDE_SESSION_TOKEN = {
        encrypted: true,
        value: this.encrypt(updates.claude.sessionToken),
      };
    }
    if (updates.claude?.organizationId) {
      currentEnv.CLAUDE_ORGANIZATION_ID = updates.claude.organizationId;
    }

    if (updates.openrouter?.apiKey) {
      currentEnv.OPENROUTER_API_KEY = updates.openrouter.apiKey;
      encryptedStore.OPENROUTER_API_KEY = {
        encrypted: true,
        value: this.encrypt(updates.openrouter.apiKey),
      };
    }
    if (updates.openrouter?.model) {
      currentEnv.OPENROUTER_MODEL = updates.openrouter.model;
    }

    if (updates.github?.username) {
      currentEnv.GITHUB_USERNAME = updates.github.username;
    }
    if (updates.github?.email) {
      currentEnv.GITHUB_EMAIL = updates.github.email;
    }

    if (updates.deployment?.vercel) {
      currentEnv.VERCEL_TOKEN = updates.deployment.vercel;
      encryptedStore.VERCEL_TOKEN = {
        encrypted: true,
        value: this.encrypt(updates.deployment.vercel),
      };
    }
    if (updates.deployment?.netlify) {
      currentEnv.NETLIFY_TOKEN = updates.deployment.netlify;
      encryptedStore.NETLIFY_TOKEN = {
        encrypted: true,
        value: this.encrypt(updates.deployment.netlify),
      };
    }
    if (updates.deployment?.railway) {
      currentEnv.RAILWAY_TOKEN = updates.deployment.railway;
      encryptedStore.RAILWAY_TOKEN = {
        encrypted: true,
        value: this.encrypt(updates.deployment.railway),
      };
    }
    if (updates.deployment?.render) {
      currentEnv.RENDER_API_KEY = updates.deployment.render;
      encryptedStore.RENDER_API_KEY = {
        encrypted: true,
        value: this.encrypt(updates.deployment.render),
      };
    }

    if (updates.database?.url) {
      currentEnv.DATABASE_URL = updates.database.url;
    }
    if (updates.database?.user) {
      currentEnv.POSTGRES_USER = updates.database.user;
    }

    if (updates.redis?.url) {
      currentEnv.REDIS_URL = updates.redis.url;
    }

    if (updates.ports) {
      if (updates.ports.frontend) currentEnv.FRONTEND_PORT = updates.ports.frontend;
      if (updates.ports.backend) currentEnv.BACKEND_PORT = updates.ports.backend;
      if (updates.ports.preview) currentEnv.PREVIEW_PORT = updates.ports.preview;
    }

    if (updates.settings) {
      if (updates.settings.nodeEnv) currentEnv.NODE_ENV = updates.settings.nodeEnv;
      if (updates.settings.logLevel) currentEnv.LOG_LEVEL = updates.settings.logLevel;
      if (updates.settings.playwrightHeadless !== undefined) {
        currentEnv.PLAYWRIGHT_HEADLESS = updates.settings.playwrightHeadless.toString();
      }
    }

    // Write .env file
    await this.writeEnvFile(currentEnv);

    // Write encrypted store
    await fs.mkdir(path.dirname(this.configStorePath), { recursive: true });
    await fs.writeFile(this.configStorePath, JSON.stringify(encryptedStore, null, 2));

    return { success: true, message: 'Configuration updated successfully' };
  }

  /**
   * Read current .env file
   */
  async readCurrentEnv() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      return this.parseEnvFile(content);
    } catch {
      return {};
    }
  }

  /**
   * Write .env file
   */
  async writeEnvFile(config) {
    let content = '# TryForge Environment Variables\n';
    content += '# Managed by Admin Panel\n';
    content += `# Last updated: ${new Date().toISOString()}\n\n`;

    // AI Provider Selection
    content += '# AI Provider Selection\n';
    content += '# Choose: "claude" or "openrouter"\n';
    content += `AI_PROVIDER=${config.AI_PROVIDER || 'claude'}\n\n`;

    // Claude API
    content += '# Claude Configuration\n';
    content += '# Auth Mode: "api" for API Key or "subscription" for Claude Pro/Max tokens\n';
    content += `CLAUDE_AUTH_MODE=${config.CLAUDE_AUTH_MODE || 'api'}\n\n`;
    content += '# API Key (for api mode)\n';
    content += `ANTHROPIC_API_KEY=${config.ANTHROPIC_API_KEY || 'sk-ant-api03-your-key-here'}\n\n`;
    content += '# Subscription Token (for subscription mode - Claude Pro/Max)\n';
    content += `CLAUDE_SESSION_TOKEN=${config.CLAUDE_SESSION_TOKEN || 'sessKey-ant-your-session-token-here'}\n`;
    content += `CLAUDE_ORGANIZATION_ID=${config.CLAUDE_ORGANIZATION_ID || ''}\n\n`;

    // OpenRouter API
    content += '# OpenRouter Configuration (Access to multiple free AI models)\n';
    content += `OPENROUTER_API_KEY=${config.OPENROUTER_API_KEY || 'sk-or-v1-your-key-here'}\n`;
    content += '# Default model (minimax/minimax-01 is free!)\n';
    content += `OPENROUTER_MODEL=${config.OPENROUTER_MODEL || 'minimax/minimax-01'}\n\n`;

    // GitHub
    content += '# GitHub Configuration\n';
    content += `GITHUB_USERNAME=${config.GITHUB_USERNAME || 'your-github-username'}\n`;
    content += `GITHUB_EMAIL=${config.GITHUB_EMAIL || 'your-email@example.com'}\n\n`;

    // Deployment
    content += '# Deployment Platforms\n';
    content += `VERCEL_TOKEN=${config.VERCEL_TOKEN || 'your-vercel-token-here'}\n`;
    content += `NETLIFY_TOKEN=${config.NETLIFY_TOKEN || 'your-netlify-token-here'}\n`;
    content += `RAILWAY_TOKEN=${config.RAILWAY_TOKEN || 'your-railway-token-here'}\n`;
    content += `RENDER_API_KEY=${config.RENDER_API_KEY || 'your-render-api-key-here'}\n\n`;

    // Database
    content += '# Database Configuration\n';
    content += `DATABASE_URL=${config.DATABASE_URL || 'postgresql://devuser:devpass123@localhost:5432/tryforge_db'}\n`;
    content += `POSTGRES_USER=${config.POSTGRES_USER || 'devuser'}\n`;
    content += `POSTGRES_PASSWORD=${config.POSTGRES_PASSWORD || 'devpass123'}\n\n`;

    // Redis
    content += '# Redis Configuration\n';
    content += `REDIS_URL=${config.REDIS_URL || 'redis://localhost:6379'}\n\n`;

    // Pollinations
    content += '# Pollinations AI\n';
    content += `POLLINATIONS_BASE_URL=${config.POLLINATIONS_BASE_URL || 'https://image.pollinations.ai'}\n\n`;

    // Ports
    content += '# Port Configuration\n';
    content += `FRONTEND_PORT=${config.FRONTEND_PORT || '5173'}\n`;
    content += `BACKEND_PORT=${config.BACKEND_PORT || '3000'}\n`;
    content += `PREVIEW_PORT=${config.PREVIEW_PORT || '4000'}\n\n`;

    // Settings
    content += '# Development Settings\n';
    content += `NODE_ENV=${config.NODE_ENV || 'development'}\n`;
    content += `LOG_LEVEL=${config.LOG_LEVEL || 'info'}\n\n`;

    // Playwright
    content += '# Playwright Settings\n';
    content += `PLAYWRIGHT_HEADLESS=${config.PLAYWRIGHT_HEADLESS || 'false'}\n\n`;

    // App info
    content += '# Application Settings\n';
    content += `APP_NAME=${config.APP_NAME || 'TryForge'}\n`;
    content += `APP_VERSION=${config.APP_VERSION || '1.0.0'}\n`;

    await fs.writeFile(this.configPath, content);
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      aiProvider: 'claude',
      claude: { authMode: 'api', apiKey: '', sessionToken: '', organizationId: '' },
      openrouter: { apiKey: '', model: 'minimax/minimax-01' },
      github: { username: '', email: '' },
      deployment: { vercel: '', netlify: '', railway: '', render: '' },
      database: { url: '', user: '' },
      redis: { url: '' },
      ports: { frontend: '5173', backend: '3000', preview: '4000' },
      settings: { nodeEnv: 'development', logLevel: 'info', playwrightHeadless: false },
    };
  }

  /**
   * Test API key validity
   */
  async testApiKey(service, key) {
    switch (service) {
      case 'claude':
        return await this.testClaudeKey(key);
      case 'claude-subscription':
        return await this.testClaudeSubscriptionToken(key);
      case 'openrouter':
        return await this.testOpenRouterKey(key);
      case 'vercel':
        return await this.testVercelKey(key);
      case 'netlify':
        return await this.testNetlifyKey(key);
      case 'railway':
        return await this.testRailwayKey(key);
      case 'render':
        return await this.testRenderKey(key);
      default:
        return { valid: false, message: 'Unknown service' };
    }
  }

  /**
   * Test Claude API key
   */
  async testClaudeKey(apiKey) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      // Try a minimal API call
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return {
        valid: true,
        message: 'Claude API key is valid',
        details: `Model: ${response.model}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid Claude API key',
        error: error.message,
      };
    }
  }

  /**
   * Test Claude subscription token (Claude Pro/Max)
   */
  async testClaudeSubscriptionToken(sessionToken) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');

      // Try to use session token with custom headers
      const client = new Anthropic({
        apiKey: sessionToken,
        defaultHeaders: {
          'anthropic-version': '2023-06-01',
          'cookie': `sessionKey=${sessionToken}`,
        },
      });

      // Try a minimal API call
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return {
        valid: true,
        message: 'Claude subscription token is valid',
        details: `Using Claude Pro/Max subscription`,
      };
    } catch (error) {
      // If that fails, it might be an authentication issue
      return {
        valid: false,
        message: 'Invalid Claude subscription token',
        error: 'Please check your session token from claude.ai cookies',
      };
    }
  }

  /**
   * Test OpenRouter API key
   */
  async testOpenRouterKey(apiKey) {
    try {
      // Test with a minimal request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: 'OpenRouter API key is valid',
          details: `Credits: $${data.data?.usage || 0} | Limit: $${data.data?.limit || 'Unlimited'}`,
        };
      }

      return {
        valid: false,
        message: 'Invalid OpenRouter API key',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Error testing OpenRouter key',
        error: error.message,
      };
    }
  }

  /**
   * Test Vercel token
   */
  async testVercelKey(token) {
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: 'Vercel token is valid',
          details: `User: ${data.user.username}`,
        };
      }

      return { valid: false, message: 'Invalid Vercel token' };
    } catch (error) {
      return { valid: false, message: 'Error testing Vercel token', error: error.message };
    }
  }

  /**
   * Test Netlify token
   */
  async testNetlifyKey(token) {
    try {
      const response = await fetch('https://api.netlify.com/api/v1/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: 'Netlify token is valid',
          details: `User: ${data.email}`,
        };
      }

      return { valid: false, message: 'Invalid Netlify token' };
    } catch (error) {
      return { valid: false, message: 'Error testing Netlify token', error: error.message };
    }
  }

  /**
   * Test Railway token
   */
  async testRailwayKey(token) {
    try {
      const response = await fetch('https://backboard.railway.app/graphql/v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ me { id email } }',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.me) {
          return {
            valid: true,
            message: 'Railway token is valid',
            details: `User: ${data.data.me.email}`,
          };
        }
      }

      return { valid: false, message: 'Invalid Railway token' };
    } catch (error) {
      return { valid: false, message: 'Error testing Railway token', error: error.message };
    }
  }

  /**
   * Test Render API key
   */
  async testRenderKey(apiKey) {
    try {
      const response = await fetch('https://api.render.com/v1/owners', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: 'Render API key is valid',
          details: `Owner: ${data[0]?.owner?.name || 'Valid'}`,
        };
      }

      return { valid: false, message: 'Invalid Render API key' };
    } catch (error) {
      return { valid: false, message: 'Error testing Render key', error: error.message };
    }
  }
}

module.exports = ConfigManager;
