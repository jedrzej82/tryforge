/**
 * TryForge Configuration (JavaScript Format)
 *
 * This is an example configuration file in JavaScript format.
 * You can use this as a template for your own configuration.
 *
 * Place this file in your project root or user home directory (~/.tryforge/)
 */

module.exports = {
  // General settings
  version: '1.0.0',
  logLevel: 'info', // debug, info, warn, error

  // AI Service settings
  ai: {
    provider: 'claude', // claude, openai, custom
    // NOTE: API key should be set via environment variable TRYFORGE_AI_API_KEY
    // apiKey: process.env.TRYFORGE_AI_API_KEY,
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000,
    retries: 3
  },

  // Template settings
  templates: {
    autoUpdate: true,
    custom: []
  },

  // Database settings
  database: {
    provider: 'postgresql',
    host: 'localhost',
    port: 5432,
    name: 'tryforge',
    username: 'postgres',
    // NOTE: Password should be set via environment variable
    // password: process.env.TRYFORGE_DATABASE_PASSWORD,
    ssl: false,
    poolMin: 2,
    poolMax: 10
  },

  // Project settings
  project: {
    defaultTemplate: 'react-typescript',
    defaultDatabase: 'postgresql',
    includeTests: true,
    includeDocs: true,
    gitInit: true,
    installDeps: true
  },

  // CLI settings
  cli: {
    interactive: true,
    verbose: false,
    color: true,
    progress: true
  },

  // Generation settings
  generate: {
    fileCase: 'kebab', // kebab, camel, pascal, snake
    importStyle: 'named', // named, default, namespace
    quotes: 'single', // single, double
    semicolons: true,
    trailingComma: 'es5' // none, es5, all
  }
};
