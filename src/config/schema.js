/**
 * Configuration Schema Definition
 *
 * This file defines the Joi validation schema for all configuration options.
 * It ensures configuration values are valid and provides helpful error messages.
 */

const Joi = require('joi');

/**
 * API Key validation pattern
 * Supports various API key formats:
 * - Anthropic: sk-ant-...
 * - OpenAI: sk-...
 * - Custom: any alphanumeric with dashes/underscores
 */
const apiKeyPattern = /^(sk-ant-[a-zA-Z0-9-_]{20,}|sk-[a-zA-Z0-9-_]{20,}|[a-zA-Z0-9-_]{20,})$/;

/**
 * Validate API key format
 */
const apiKeySchema = Joi.string()
  .pattern(apiKeyPattern)
  .allow(null)
  .messages({
    'string.pattern.base': 'Must be a valid API key (e.g., sk-ant-... for Anthropic or sk-... for OpenAI)',
    'string.empty': 'API key cannot be empty'
  });

/**
 * AI Service configuration schema
 */
const aiSchema = Joi.object({
  provider: Joi.string()
    .valid('claude', 'openai', 'custom')
    .default('claude')
    .messages({
      'any.only': 'Provider must be one of: claude, openai, custom'
    }),

  apiKey: apiKeySchema,

  model: Joi.string()
    .min(1)
    .max(100)
    .default('claude-3-sonnet-20240229')
    .messages({
      'string.min': 'Model name must not be empty',
      'string.max': 'Model name is too long'
    }),

  maxTokens: Joi.number()
    .integer()
    .min(1)
    .max(200000)
    .default(4096)
    .messages({
      'number.min': 'maxTokens must be at least 1',
      'number.max': 'maxTokens cannot exceed 200000'
    }),

  temperature: Joi.number()
    .min(0)
    .max(2)
    .default(0.7)
    .messages({
      'number.min': 'Temperature must be at least 0',
      'number.max': 'Temperature cannot exceed 2'
    }),

  timeout: Joi.number()
    .integer()
    .min(1000)
    .max(300000)
    .default(30000)
    .messages({
      'number.min': 'Timeout must be at least 1000ms (1 second)',
      'number.max': 'Timeout cannot exceed 300000ms (5 minutes)'
    }),

  retries: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .messages({
      'number.min': 'Retries cannot be negative',
      'number.max': 'Retries cannot exceed 10'
    }),

  retryDelay: Joi.number()
    .integer()
    .min(0)
    .max(60000)
    .default(1000),

  fallbackModels: Joi.array()
    .items(Joi.string())
    .default([])
}).required();

/**
 * Template configuration schema
 */
const templatesSchema = Joi.object({
  directory: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Template directory path cannot be empty'
    }),

  autoUpdate: Joi.boolean()
    .default(true),

  updateInterval: Joi.number()
    .integer()
    .min(60000)
    .default(86400000),

  custom: Joi.array()
    .items(Joi.string())
    .default([]),

  cache: Joi.boolean()
    .default(true),

  cacheDir: Joi.string()
    .min(1)
}).required();

/**
 * Database configuration schema
 */
const databaseSchema = Joi.object({
  provider: Joi.string()
    .valid('postgresql', 'mysql', 'sqlite', 'mongodb')
    .default('postgresql')
    .messages({
      'any.only': 'Database provider must be one of: postgresql, mysql, sqlite, mongodb'
    }),

  host: Joi.string()
    .hostname()
    .default('localhost')
    .messages({
      'string.hostname': 'Database host must be a valid hostname or IP address'
    }),

  port: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(5432)
    .messages({
      'number.min': 'Port must be at least 1',
      'number.max': 'Port cannot exceed 65535'
    }),

  name: Joi.string()
    .min(1)
    .max(63)
    .required()
    .messages({
      'string.empty': 'Database name cannot be empty',
      'string.max': 'Database name is too long (max 63 characters)'
    }),

  username: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Database username cannot be empty'
    }),

  password: Joi.string()
    .allow(null)
    .messages({
      'string.empty': 'Database password should be set via environment variable'
    }),

  ssl: Joi.boolean()
    .default(false),

  poolMin: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(2),

  poolMax: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(10)
    .greater(Joi.ref('poolMin'))
    .messages({
      'number.greater': 'poolMax must be greater than poolMin'
    }),

  timeout: Joi.number()
    .integer()
    .min(1000)
    .default(30000),

  migrations: Joi.object({
    directory: Joi.string().default('migrations'),
    tableName: Joi.string().default('knex_migrations'),
    autoRun: Joi.boolean().default(false)
  })
}).required();

/**
 * Project configuration schema
 */
const projectSchema = Joi.object({
  defaultTemplate: Joi.string()
    .min(1)
    .default('react-typescript'),

  defaultDatabase: Joi.string()
    .valid('postgresql', 'mysql', 'sqlite', 'mongodb', 'none')
    .default('postgresql'),

  includeTests: Joi.boolean()
    .default(true),

  includeDocs: Joi.boolean()
    .default(true),

  includeGitignore: Joi.boolean()
    .default(true),

  includeEnvFile: Joi.boolean()
    .default(true),

  gitInit: Joi.boolean()
    .default(true),

  installDeps: Joi.boolean()
    .default(true),

  outputDir: Joi.string()
    .min(1)
    .default(process.cwd()),

  overwrite: Joi.boolean()
    .default(false),

  backup: Joi.boolean()
    .default(true)
}).required();

/**
 * CLI configuration schema
 */
const cliSchema = Joi.object({
  interactive: Joi.boolean()
    .default(true),

  verbose: Joi.boolean()
    .default(false),

  color: Joi.boolean()
    .default(true),

  progress: Joi.boolean()
    .default(true),

  emoji: Joi.boolean()
    .default(true),

  timestamps: Joi.boolean()
    .default(false),

  editor: Joi.string()
    .min(1)
    .default(process.env.EDITOR || 'vim'),

  pager: Joi.string()
    .min(1)
    .default(process.env.PAGER || 'less'),

  confirmDestructive: Joi.boolean()
    .default(true)
}).required();

/**
 * Code generation configuration schema
 */
const generateSchema = Joi.object({
  fileCase: Joi.string()
    .valid('kebab', 'camel', 'pascal', 'snake')
    .default('kebab')
    .messages({
      'any.only': 'fileCase must be one of: kebab, camel, pascal, snake'
    }),

  importStyle: Joi.string()
    .valid('named', 'default', 'namespace')
    .default('named')
    .messages({
      'any.only': 'importStyle must be one of: named, default, namespace'
    }),

  quotes: Joi.string()
    .valid('single', 'double')
    .default('single')
    .messages({
      'any.only': 'quotes must be either single or double'
    }),

  semicolons: Joi.boolean()
    .default(true),

  trailingComma: Joi.string()
    .valid('none', 'es5', 'all')
    .default('es5')
    .messages({
      'any.only': 'trailingComma must be one of: none, es5, all'
    }),

  tabWidth: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .default(2),

  useTabs: Joi.boolean()
    .default(false),

  lineWidth: Joi.number()
    .integer()
    .min(40)
    .max(200)
    .default(80),

  endOfLine: Joi.string()
    .valid('lf', 'crlf', 'auto')
    .default('lf'),

  bracketSpacing: Joi.boolean()
    .default(true),

  arrowParens: Joi.string()
    .valid('always', 'avoid')
    .default('always')
}).required();

/**
 * Server configuration schema
 */
const serverSchema = Joi.object({
  host: Joi.string()
    .hostname()
    .default('localhost'),

  port: Joi.number()
    .integer()
    .min(0)
    .max(65535)
    .default(3000)
    .messages({
      'number.min': 'Port must be between 0 and 65535',
      'number.max': 'Port must be between 0 and 65535'
    }),

  https: Joi.boolean()
    .default(false),

  cors: Joi.boolean()
    .default(true),

  corsOrigins: Joi.array()
    .items(Joi.string().uri())
    .default(['http://localhost:3000', 'http://localhost:3001']),

  rateLimit: Joi.object({
    enabled: Joi.boolean().default(true),
    windowMs: Joi.number().integer().min(1000).default(900000),
    max: Joi.number().integer().min(1).default(100)
  }),

  compression: Joi.boolean()
    .default(true),

  helmet: Joi.boolean()
    .default(true)
});

/**
 * Cache configuration schema
 */
const cacheSchema = Joi.object({
  enabled: Joi.boolean()
    .default(true),

  type: Joi.string()
    .valid('memory', 'redis', 'filesystem')
    .default('memory'),

  ttl: Joi.number()
    .integer()
    .min(0)
    .default(3600),

  directory: Joi.string()
    .min(1),

  maxSize: Joi.number()
    .integer()
    .min(0)
    .default(104857600)
});

/**
 * Plugin configuration schema
 */
const pluginsSchema = Joi.object({
  enabled: Joi.boolean()
    .default(true),

  directory: Joi.string()
    .min(1),

  autoLoad: Joi.boolean()
    .default(true),

  custom: Joi.array()
    .items(Joi.string())
    .default([])
});

/**
 * Analytics configuration schema
 */
const analyticsSchema = Joi.object({
  enabled: Joi.boolean()
    .default(false),

  anonymous: Joi.boolean()
    .default(true),

  endpoint: Joi.string()
    .uri()
    .allow(null)
    .default(null)
});

/**
 * Update configuration schema
 */
const updatesSchema = Joi.object({
  checkOnStart: Joi.boolean()
    .default(true),

  autoUpdate: Joi.boolean()
    .default(false),

  channel: Joi.string()
    .valid('stable', 'beta', 'nightly')
    .default('stable')
});

/**
 * Main configuration schema
 */
const configSchema = Joi.object({
  // General settings
  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'Version must follow semantic versioning (e.g., 1.0.0)'
    }),

  logLevel: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info')
    .messages({
      'any.only': 'logLevel must be one of: debug, info, warn, error'
    }),

  // Component schemas
  ai: aiSchema,
  templates: templatesSchema,
  database: databaseSchema,
  project: projectSchema,
  cli: cliSchema,
  generate: generateSchema,
  server: serverSchema,
  cache: cacheSchema,
  plugins: pluginsSchema,
  analytics: analyticsSchema,
  updates: updatesSchema

}).unknown(false).messages({
  'object.unknown': 'Unknown configuration option: {#label}'
});

module.exports = {
  configSchema,
  aiSchema,
  templatesSchema,
  databaseSchema,
  projectSchema,
  cliSchema,
  generateSchema,
  serverSchema,
  cacheSchema,
  pluginsSchema,
  analyticsSchema,
  updatesSchema
};
