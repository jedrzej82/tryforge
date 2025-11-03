/**
 * Configuration Merging Logic
 *
 * This module provides utilities for merging configuration objects
 * from multiple sources with proper priority and type handling.
 *
 * Priority order (highest to lowest):
 * 1. CLI flags
 * 2. Environment variables
 * 3. Project config file
 * 4. User config file
 * 5. Default values
 */

/**
 * Deep merge multiple configuration objects
 *
 * @param {...object} configs - Configuration objects to merge (left to right priority)
 * @returns {object} Merged configuration object
 */
function mergeConfigs(...configs) {
  return configs.reduce((result, config) => {
    return deepMerge(result, config);
  }, {});
}

/**
 * Deep merge two objects with special handling for arrays and null values
 *
 * @param {object} target - Target object (lower priority)
 * @param {object} source - Source object (higher priority)
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  // Handle null/undefined cases
  if (source === null || source === undefined) {
    return target;
  }
  if (target === null || target === undefined) {
    return source;
  }

  // If source is not an object, return it directly
  if (!isObject(source)) {
    return source;
  }

  // Start with a copy of target
  const output = { ...target };

  // Merge each key from source
  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    const targetValue = target[key];

    // Handle arrays - replace instead of merge
    if (Array.isArray(sourceValue)) {
      output[key] = [...sourceValue];
    }
    // Handle nested objects - recurse
    else if (isObject(sourceValue)) {
      if (isObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = deepMerge({}, sourceValue);
      }
    }
    // Handle primitives - overwrite
    else {
      output[key] = sourceValue;
    }
  });

  return output;
}

/**
 * Merge configurations with priority levels
 *
 * @param {object} options - Merge options
 * @param {object} options.defaults - Default configuration
 * @param {object} options.user - User configuration
 * @param {object} options.project - Project configuration
 * @param {object} options.env - Environment variable configuration
 * @param {object} options.cli - CLI flag configuration
 * @returns {object} Merged configuration
 */
function mergeWithPriority({ defaults = {}, user = {}, project = {}, env = {}, cli = {} }) {
  // Merge in priority order: defaults < user < project < env < cli
  return mergeConfigs(defaults, user, project, env, cli);
}

/**
 * Check if value is a plain object
 *
 * @param {*} item - Value to check
 * @returns {boolean} True if value is a plain object
 */
function isObject(item) {
  return item !== null &&
         typeof item === 'object' &&
         !Array.isArray(item) &&
         !(item instanceof Date) &&
         !(item instanceof RegExp);
}

/**
 * Get a nested value from an object using a dot-notation path
 *
 * @param {object} obj - Object to query
 * @param {string} path - Dot-notation path (e.g., 'ai.apiKey')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Value at path or default value
 */
function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || !path) {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Set a nested value in an object using a dot-notation path
 *
 * @param {object} obj - Object to modify
 * @param {string} path - Dot-notation path (e.g., 'ai.apiKey')
 * @param {*} value - Value to set
 * @returns {object} Modified object
 */
function setNestedValue(obj, path, value) {
  if (!obj || !path) {
    return obj;
  }

  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;

  // Create nested objects as needed
  for (const key of keys) {
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  // Set the final value
  current[lastKey] = value;

  return obj;
}

/**
 * Remove a nested value from an object using a dot-notation path
 *
 * @param {object} obj - Object to modify
 * @param {string} path - Dot-notation path (e.g., 'ai.apiKey')
 * @returns {object} Modified object
 */
function removeNestedValue(obj, path) {
  if (!obj || !path) {
    return obj;
  }

  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;

  // Navigate to parent object
  for (const key of keys) {
    if (!(key in current)) {
      return obj; // Path doesn't exist
    }
    current = current[key];
  }

  // Delete the final key
  delete current[lastKey];

  return obj;
}

/**
 * Check if an object has a nested path
 *
 * @param {object} obj - Object to check
 * @param {string} path - Dot-notation path (e.g., 'ai.apiKey')
 * @returns {boolean} True if path exists
 */
function hasNestedPath(obj, path) {
  if (!obj || !path) {
    return false;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

/**
 * Flatten a nested object into dot-notation paths
 *
 * @param {object} obj - Object to flatten
 * @param {string} prefix - Prefix for keys (used internally for recursion)
 * @returns {object} Flattened object with dot-notation keys
 */
function flattenObject(obj, prefix = '') {
  const result = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (isObject(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

/**
 * Unflatten an object with dot-notation keys into nested structure
 *
 * @param {object} obj - Object with dot-notation keys
 * @returns {object} Nested object
 */
function unflattenObject(obj) {
  const result = {};

  Object.keys(obj).forEach(key => {
    setNestedValue(result, key, obj[key]);
  });

  return result;
}

/**
 * Get all paths in a nested object
 *
 * @param {object} obj - Object to analyze
 * @param {string} prefix - Prefix for paths (used internally for recursion)
 * @returns {Array<string>} Array of dot-notation paths
 */
function getAllPaths(obj, prefix = '') {
  const paths = [];

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newPath = prefix ? `${prefix}.${key}` : key;

    if (isObject(value)) {
      paths.push(newPath);
      paths.push(...getAllPaths(value, newPath));
    } else {
      paths.push(newPath);
    }
  });

  return paths;
}

/**
 * Compare two configuration objects and return differences
 *
 * @param {object} obj1 - First object
 * @param {object} obj2 - Second object
 * @returns {object} Object containing added, removed, and changed keys
 */
function diffConfigs(obj1, obj2) {
  const flat1 = flattenObject(obj1);
  const flat2 = flattenObject(obj2);

  const added = [];
  const removed = [];
  const changed = [];

  // Find added and changed keys
  Object.keys(flat2).forEach(key => {
    if (!(key in flat1)) {
      added.push({ path: key, value: flat2[key] });
    } else if (flat1[key] !== flat2[key]) {
      changed.push({
        path: key,
        oldValue: flat1[key],
        newValue: flat2[key]
      });
    }
  });

  // Find removed keys
  Object.keys(flat1).forEach(key => {
    if (!(key in flat2)) {
      removed.push({ path: key, value: flat1[key] });
    }
  });

  return { added, removed, changed };
}

/**
 * Clone a configuration object deeply
 *
 * @param {object} obj - Object to clone
 * @returns {object} Deep clone of object
 */
function cloneConfig(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cloneConfig(item));
  }

  if (isObject(obj)) {
    const clone = {};
    Object.keys(obj).forEach(key => {
      clone[key] = cloneConfig(obj[key]);
    });
    return clone;
  }

  return obj;
}

module.exports = {
  mergeConfigs,
  deepMerge,
  mergeWithPriority,
  isObject,
  getNestedValue,
  setNestedValue,
  removeNestedValue,
  hasNestedPath,
  flattenObject,
  unflattenObject,
  getAllPaths,
  diffConfigs,
  cloneConfig
};
