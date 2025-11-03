/**
 * Configuration Validator
 *
 * This module validates configuration objects against the schema
 * and provides helpful error messages and suggestions for fixes.
 */

const { configSchema } = require('./schema');
const { getNestedValue } = require('./merge');

/**
 * Validate entire configuration object
 *
 * @param {object} config - Configuration object to validate
 * @param {object} options - Validation options
 * @param {boolean} options.abortEarly - Stop validation on first error
 * @param {boolean} options.allowUnknown - Allow unknown keys
 * @returns {object} Validation result
 */
function validateConfig(config, options = {}) {
  const {
    abortEarly = false,
    allowUnknown = false
  } = options;

  try {
    const { error, value, warning } = configSchema.validate(config, {
      abortEarly,
      allowUnknown,
      stripUnknown: !allowUnknown,
      presence: 'optional'
    });

    if (error) {
      const errors = formatValidationErrors(error);
      return {
        valid: false,
        errors,
        warnings: [],
        config: value || config
      };
    }

    // Check for deprecated options
    const deprecationWarnings = checkDeprecatedOptions(config);

    // Check for common misconfigurations
    const misconfigWarnings = checkCommonMisconfigurations(config);

    return {
      valid: true,
      errors: [],
      warnings: [...deprecationWarnings, ...misconfigWarnings],
      config: value
    };
  } catch (err) {
    return {
      valid: false,
      errors: [{
        path: '',
        message: `Validation error: ${err.message}`,
        type: 'validation.error'
      }],
      warnings: [],
      config
    };
  }
}

/**
 * Validate a specific configuration key
 *
 * @param {string} key - Configuration key (dot notation)
 * @param {*} value - Value to validate
 * @param {object} fullConfig - Full configuration object for context
 * @returns {object} Validation result
 */
function validateKey(key, value, fullConfig = {}) {
  // Build a minimal config object with just this key
  const testConfig = { ...fullConfig };
  const parts = key.split('.');
  let current = testConfig;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;

  // Validate the full config
  const result = validateConfig(testConfig, { abortEarly: true });

  // Filter errors to only those related to this key
  const keyErrors = result.errors.filter(err =>
    err.path === key || err.path.startsWith(key + '.')
  );

  return {
    valid: keyErrors.length === 0,
    errors: keyErrors,
    warnings: result.warnings.filter(warn =>
      warn.path === key || warn.path.startsWith(key + '.')
    )
  };
}

/**
 * Format Joi validation errors into a more readable format
 *
 * @param {object} error - Joi validation error
 * @returns {Array<object>} Formatted errors
 */
function formatValidationErrors(error) {
  if (!error || !error.details) {
    return [];
  }

  return error.details.map(detail => {
    const path = detail.path.join('.');
    const message = detail.message.replace(/"/g, "'");
    const type = detail.type;

    // Add helpful suggestions based on error type
    const suggestion = getSuggestionForError(type, path, detail.context);

    return {
      path,
      message,
      type,
      suggestion
    };
  });
}

/**
 * Get helpful suggestion for a validation error
 *
 * @param {string} type - Error type
 * @param {string} path - Configuration path
 * @param {object} context - Error context
 * @returns {string|null} Suggestion or null
 */
function getSuggestionForError(type, path, context = {}) {
  // Common suggestions based on error type
  const suggestions = {
    'any.required': `Set ${path} in your config file or use environment variable TRYFORGE_${path.toUpperCase().replace(/\./g, '_')}`,
    'any.only': `Valid values for ${path} are: ${context.valids?.join(', ') || 'see documentation'}`,
    'string.pattern.base': `Check the format of ${path}. ${getPatternSuggestion(path)}`,
    'string.min': `${path} must be at least ${context.limit} characters long`,
    'string.max': `${path} must be no more than ${context.limit} characters long`,
    'string.empty': `${path} cannot be empty`,
    'number.min': `${path} must be at least ${context.limit}`,
    'number.max': `${path} must be no more than ${context.limit}`,
    'number.base': `${path} must be a number`,
    'boolean.base': `${path} must be true or false`,
    'object.unknown': `Unknown configuration option: ${path}. Check for typos or refer to documentation.`
  };

  return suggestions[type] || null;
}

/**
 * Get pattern-specific suggestion
 *
 * @param {string} path - Configuration path
 * @returns {string} Pattern suggestion
 */
function getPatternSuggestion(path) {
  const patterns = {
    'ai.apiKey': 'API key should start with "sk-ant-" (Anthropic) or "sk-" (OpenAI)',
    'version': 'Version should follow semantic versioning (e.g., 1.0.0)',
    'database.host': 'Host should be a valid hostname or IP address'
  };

  return patterns[path] || 'Check the documentation for the correct format';
}

/**
 * Check for deprecated configuration options
 *
 * @param {object} config - Configuration object
 * @returns {Array<object>} Deprecation warnings
 */
function checkDeprecatedOptions(config) {
  const warnings = [];

  // Define deprecated options and their replacements
  const deprecatedOptions = {
    // Example: 'oldKey': 'newKey'
  };

  Object.keys(deprecatedOptions).forEach(oldKey => {
    const newKey = deprecatedOptions[oldKey];
    if (getNestedValue(config, oldKey) !== undefined) {
      warnings.push({
        path: oldKey,
        message: `Configuration option '${oldKey}' is deprecated. Use '${newKey}' instead.`,
        type: 'deprecation',
        suggestion: `Update your config: change '${oldKey}' to '${newKey}'`
      });
    }
  });

  return warnings;
}

/**
 * Check for common misconfigurations
 *
 * @param {object} config - Configuration object
 * @returns {Array<object>} Misconfiguration warnings
 */
function checkCommonMisconfigurations(config) {
  const warnings = [];

  // Check if API key is set in config file (should use env var)
  if (config.ai?.apiKey && config.ai.apiKey.length > 0) {
    warnings.push({
      path: 'ai.apiKey',
      message: 'API key should be set via environment variable for security',
      type: 'security',
      suggestion: 'Set TRYFORGE_AI_API_KEY environment variable instead of storing in config file'
    });
  }

  // Check if database password is set in config file
  if (config.database?.password && config.database.password.length > 0) {
    warnings.push({
      path: 'database.password',
      message: 'Database password should be set via environment variable for security',
      type: 'security',
      suggestion: 'Set TRYFORGE_DATABASE_PASSWORD environment variable instead of storing in config file'
    });
  }

  // Check if pool max is less than pool min
  if (config.database?.poolMax && config.database?.poolMin) {
    if (config.database.poolMax < config.database.poolMin) {
      warnings.push({
        path: 'database.poolMax',
        message: 'poolMax should be greater than poolMin',
        type: 'misconfiguration',
        suggestion: `Set poolMax to a value greater than ${config.database.poolMin}`
      });
    }
  }

  // Check if SSL is disabled in production
  if (config.database?.ssl === false && process.env.NODE_ENV === 'production') {
    warnings.push({
      path: 'database.ssl',
      message: 'SSL is disabled in production environment',
      type: 'security',
      suggestion: 'Enable SSL for database connections in production'
    });
  }

  // Check if server port is privileged (< 1024) without proper permissions
  if (config.server?.port && config.server.port < 1024 && process.platform !== 'win32') {
    warnings.push({
      path: 'server.port',
      message: 'Port below 1024 requires elevated privileges',
      type: 'misconfiguration',
      suggestion: 'Use a port >= 1024 or run with sudo (not recommended)'
    });
  }

  // Check if CORS is disabled with multiple origins
  if (config.server?.cors === false && config.server?.corsOrigins?.length > 0) {
    warnings.push({
      path: 'server.cors',
      message: 'CORS is disabled but corsOrigins is configured',
      type: 'misconfiguration',
      suggestion: 'Either enable CORS or remove corsOrigins configuration'
    });
  }

  return warnings;
}

/**
 * Format validation result for display
 *
 * @param {object} result - Validation result
 * @returns {string} Formatted result
 */
function formatValidationResult(result) {
  const lines = [];

  if (result.valid) {
    lines.push('✓ Configuration is valid');
  } else {
    lines.push('✗ Configuration validation failed:');
    lines.push('');

    result.errors.forEach(error => {
      lines.push(`  ${error.path}:`);
      lines.push(`    ${error.message}`);
      if (error.suggestion) {
        lines.push(`    Suggestion: ${error.suggestion}`);
      }
      lines.push('');
    });
  }

  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    lines.push('');

    result.warnings.forEach(warning => {
      lines.push(`  ${warning.path}:`);
      lines.push(`    ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`);
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Validate and throw error if invalid
 *
 * @param {object} config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
function validateOrThrow(config) {
  const result = validateConfig(config);

  if (!result.valid) {
    const message = formatValidationResult(result);
    throw new Error(`Configuration validation failed:\n${message}`);
  }

  return result.config;
}

/**
 * Check if a configuration value is valid
 *
 * @param {string} key - Configuration key
 * @param {*} value - Value to check
 * @returns {boolean} True if valid
 */
function isValidValue(key, value) {
  const result = validateKey(key, value);
  return result.valid;
}

module.exports = {
  validateConfig,
  validateKey,
  validateOrThrow,
  isValidValue,
  formatValidationErrors,
  formatValidationResult,
  checkDeprecatedOptions,
  checkCommonMisconfigurations
};
