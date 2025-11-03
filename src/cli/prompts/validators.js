/**
 * TryForge CLI - Prompt Validators
 * Input validation functions for interactive prompts
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate project name
 * Must be alphanumeric with hyphens/underscores
 */
function validateProjectName(input) {
  if (!input || input.trim().length === 0) {
    return 'Project name is required';
  }

  const projectName = input.trim();

  // Check length
  if (projectName.length < 2) {
    return 'Project name must be at least 2 characters long';
  }

  if (projectName.length > 100) {
    return 'Project name must be less than 100 characters';
  }

  // Check format - alphanumeric, hyphens, underscores
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$/;
  if (!validPattern.test(projectName)) {
    return 'Project name must start and end with alphanumeric characters and can only contain letters, numbers, hyphens, and underscores';
  }

  // Reserved names
  const reserved = [
    'node_modules', 'test', 'src', 'dist', 'build', 'public',
    'con', 'prn', 'aux', 'nul', 'com1', 'lpt1' // Windows reserved
  ];

  if (reserved.includes(projectName.toLowerCase())) {
    return `"${projectName}" is a reserved name`;
  }

  return true;
}

/**
 * Validate path
 */
function validatePath(input) {
  if (!input || input.trim().length === 0) {
    return 'Path is required';
  }

  const dirPath = input.trim();

  // Check if parent directory exists
  const parentDir = path.dirname(path.resolve(dirPath));
  if (!fs.existsSync(parentDir)) {
    return `Parent directory does not exist: ${parentDir}`;
  }

  // Check if path already exists and is not empty
  if (fs.existsSync(dirPath)) {
    try {
      const files = fs.readdirSync(dirPath);
      if (files.length > 0) {
        return `Directory already exists and is not empty: ${dirPath}`;
      }
    } catch (error) {
      return `Cannot access directory: ${error.message}`;
    }
  }

  return true;
}

/**
 * Validate API key
 */
function validateApiKey(input) {
  if (!input || input.trim().length === 0) {
    return 'API key is required';
  }

  const apiKey = input.trim();

  if (apiKey.length < 10) {
    return 'API key appears to be too short';
  }

  if (apiKey.length > 500) {
    return 'API key appears to be too long';
  }

  // Check for common placeholder values
  const placeholders = ['your-api-key', 'xxx', 'abc123', 'test', 'example'];
  if (placeholders.includes(apiKey.toLowerCase())) {
    return 'Please enter a valid API key, not a placeholder value';
  }

  return true;
}

/**
 * Validate email address
 */
function validateEmail(input) {
  if (!input || input.trim().length === 0) {
    return 'Email is required';
  }

  const email = input.trim();

  // RFC 5322 compliant email regex (simplified)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return 'Please enter a valid email address';
  }

  return true;
}

/**
 * Validate URL
 */
function validateUrl(input) {
  if (!input || input.trim().length === 0) {
    return 'URL is required';
  }

  const url = input.trim();

  try {
    const urlObject = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return 'URL must use http or https protocol';
    }

    return true;
  } catch (error) {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
}

/**
 * Validate port number
 */
function validatePort(input) {
  if (!input) {
    return 'Port number is required';
  }

  const port = parseInt(input, 10);

  if (isNaN(port)) {
    return 'Port must be a number';
  }

  if (port < 1 || port > 65535) {
    return 'Port must be between 1 and 65535';
  }

  // Reserved/common ports warning
  const reservedPorts = [20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 5432];
  if (reservedPorts.includes(port)) {
    return `Warning: Port ${port} is commonly reserved for system services`;
  }

  return true;
}

/**
 * Validate version string
 */
function validateVersion(input) {
  if (!input || input.trim().length === 0) {
    return 'Version is required';
  }

  const version = input.trim();

  // Semantic versioning pattern
  const versionPattern = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

  if (!versionPattern.test(version)) {
    return 'Please enter a valid semantic version (e.g., 1.0.0, 2.1.0-beta, 3.0.0-alpha.1)';
  }

  return true;
}

/**
 * Validate non-empty string
 */
function validateRequired(input) {
  if (!input || input.trim().length === 0) {
    return 'This field is required';
  }

  return true;
}

/**
 * Validate number
 */
function validateNumber(input) {
  const num = parseFloat(input);

  if (isNaN(num)) {
    return 'Please enter a valid number';
  }

  return true;
}

/**
 * Validate integer
 */
function validateInteger(input) {
  const num = parseInt(input, 10);

  if (isNaN(num) || num.toString() !== input.trim()) {
    return 'Please enter a valid integer';
  }

  return true;
}

/**
 * Validate positive number
 */
function validatePositive(input) {
  const num = parseFloat(input);

  if (isNaN(num)) {
    return 'Please enter a valid number';
  }

  if (num <= 0) {
    return 'Number must be positive';
  }

  return true;
}

/**
 * Create a minimum length validator
 */
function createMinLengthValidator(minLength) {
  return (input) => {
    if (!input || input.trim().length < minLength) {
      return `Must be at least ${minLength} characters long`;
    }
    return true;
  };
}

/**
 * Create a maximum length validator
 */
function createMaxLengthValidator(maxLength) {
  return (input) => {
    if (input && input.length > maxLength) {
      return `Must be less than ${maxLength} characters long`;
    }
    return true;
  };
}

/**
 * Create a range validator for numbers
 */
function createRangeValidator(min, max) {
  return (input) => {
    const num = parseFloat(input);

    if (isNaN(num)) {
      return 'Please enter a valid number';
    }

    if (num < min || num > max) {
      return `Number must be between ${min} and ${max}`;
    }

    return true;
  };
}

/**
 * Combine multiple validators
 */
function combineValidators(...validators) {
  return (input) => {
    for (const validator of validators) {
      const result = validator(input);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}

module.exports = {
  validateProjectName,
  validatePath,
  validateApiKey,
  validateEmail,
  validateUrl,
  validatePort,
  validateVersion,
  validateRequired,
  validateNumber,
  validateInteger,
  validatePositive,
  createMinLengthValidator,
  createMaxLengthValidator,
  createRangeValidator,
  combineValidators
};
