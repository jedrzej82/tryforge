/**
 * TryForge CLI - Prompt Transformers
 * Data transformation utilities for prompt inputs
 */

const path = require('path');

/**
 * Sanitize project name
 * Converts to kebab-case, removes invalid characters
 */
function sanitizeProjectName(input) {
  if (!input) return '';

  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Format path to absolute path
 */
function formatPath(input) {
  if (!input) return '';

  const trimmed = input.trim();

  // Expand home directory
  if (trimmed.startsWith('~')) {
    return path.join(process.env.HOME || process.env.USERPROFILE, trimmed.slice(1));
  }

  // Convert to absolute path
  return path.resolve(trimmed);
}

/**
 * Parse comma-separated list
 */
function parseCommaSeparatedList(input) {
  if (!input) return [];

  return input
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Parse boolean value from string
 */
function parseBoolean(input) {
  if (typeof input === 'boolean') return input;
  if (!input) return false;

  const normalized = input.toString().toLowerCase().trim();

  const trueValues = ['true', 'yes', 'y', '1', 'on', 'enable', 'enabled'];
  const falseValues = ['false', 'no', 'n', '0', 'off', 'disable', 'disabled'];

  if (trueValues.includes(normalized)) return true;
  if (falseValues.includes(normalized)) return false;

  return false;
}

/**
 * Parse JSON safely
 */
function parseJSON(input, defaultValue = null) {
  if (!input) return defaultValue;

  try {
    return JSON.parse(input);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Transform email to lowercase
 */
function normalizeEmail(input) {
  if (!input) return '';
  return input.trim().toLowerCase();
}

/**
 * Normalize URL (add protocol if missing)
 */
function normalizeUrl(input) {
  if (!input) return '';

  const trimmed = input.trim();

  // Add protocol if missing
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Transform to kebab-case
 */
function toKebabCase(input) {
  if (!input) return '';

  return input
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Transform to snake_case
 */
function toSnakeCase(input) {
  if (!input) return '';

  return input
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Handle camelCase
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens
    .toLowerCase()
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Transform to camelCase
 */
function toCamelCase(input) {
  if (!input) return '';

  return input
    .trim()
    .toLowerCase()
    .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, char => char.toLowerCase());
}

/**
 * Transform to PascalCase
 */
function toPascalCase(input) {
  if (!input) return '';

  return input
    .trim()
    .toLowerCase()
    .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, char => char.toUpperCase());
}

/**
 * Trim and collapse whitespace
 */
function normalizeWhitespace(input) {
  if (!input) return '';

  return input
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Parse port number
 */
function parsePort(input, defaultPort = 3000) {
  const port = parseInt(input, 10);
  return isNaN(port) ? defaultPort : port;
}

/**
 * Parse version string
 */
function parseVersion(input) {
  if (!input) return null;

  const match = input.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/);

  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    metadata: match[5] || null,
    full: `${match[1]}.${match[2]}.${match[3]}${match[4] || ''}${match[5] || ''}`
  };
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Parse environment variables from string
 */
function parseEnvVars(input) {
  if (!input) return {};

  const vars = {};
  const lines = input.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      vars[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return vars;
}

/**
 * Format configuration object as env vars string
 */
function formatAsEnvVars(config) {
  if (!config || typeof config !== 'object') return '';

  return Object.entries(config)
    .map(([key, value]) => {
      // Convert to uppercase snake_case for env var names
      const envKey = toSnakeCase(key).toUpperCase();

      // Quote values with spaces
      const envValue = String(value).includes(' ')
        ? `"${value}"`
        : value;

      return `${envKey}=${envValue}`;
    })
    .join('\n');
}

/**
 * Strip ANSI color codes from string
 */
function stripAnsi(input) {
  if (!input) return '';

  // eslint-disable-next-line no-control-regex
  return input.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Truncate string to max length
 */
function truncate(input, maxLength = 50, suffix = '...') {
  if (!input || input.length <= maxLength) return input;

  return input.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Create a default value transformer
 */
function createDefaultTransformer(defaultValue) {
  return (input) => {
    return input || defaultValue;
  };
}

/**
 * Chain multiple transformers
 */
function chainTransformers(...transformers) {
  return (input) => {
    return transformers.reduce((value, transformer) => transformer(value), input);
  };
}

module.exports = {
  sanitizeProjectName,
  formatPath,
  parseCommaSeparatedList,
  parseBoolean,
  parseJSON,
  normalizeEmail,
  normalizeUrl,
  toKebabCase,
  toSnakeCase,
  toCamelCase,
  toPascalCase,
  normalizeWhitespace,
  parsePort,
  parseVersion,
  formatBytes,
  parseEnvVars,
  formatAsEnvVars,
  stripAnsi,
  truncate,
  createDefaultTransformer,
  chainTransformers
};
