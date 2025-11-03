/**
 * Plugin Validator
 * Validates plugin structure and metadata
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const semver = require('semver');

class PluginValidator {
  /**
   * Validate plugin structure
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Object} Validation result
   */
  static async validateStructure(pluginPath) {
    const errors = [];
    const warnings = [];

    // Check if directory exists
    if (!await fs.pathExists(pluginPath)) {
      errors.push('Plugin directory does not exist');
      return { valid: false, errors, warnings };
    }

    // Check for package.json
    const packagePath = path.join(pluginPath, 'package.json');
    if (!await fs.pathExists(packagePath)) {
      errors.push('Missing package.json file');
      return { valid: false, errors, warnings };
    }

    // Validate package.json
    let packageJson;
    try {
      packageJson = await fs.readJson(packagePath);
    } catch (error) {
      errors.push('Invalid package.json format');
      return { valid: false, errors, warnings };
    }

    // Validate metadata
    const metadataValidation = this.validateMetadata(packageJson);
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);

    // Check for index.js or main entry point
    const mainFile = packageJson.main || 'index.js';
    const mainPath = path.join(pluginPath, mainFile);
    if (!await fs.pathExists(mainPath)) {
      errors.push(`Missing main entry file: ${mainFile}`);
    }

    // Check for README
    const readmePath = path.join(pluginPath, 'README.md');
    if (!await fs.pathExists(readmePath)) {
      warnings.push('Missing README.md file');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: packageJson
    };
  }

  /**
   * Validate plugin metadata
   * @param {Object} metadata - Plugin metadata
   * @returns {Object} Validation result
   */
  static validateMetadata(metadata) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate plugin name
    if (metadata.name) {
      if (!/^[a-z0-9-]+$/.test(metadata.name)) {
        errors.push('Plugin name must contain only lowercase letters, numbers, and hyphens');
      }
      if (!metadata.name.startsWith('tryforge-plugin-') && !metadata.name.startsWith('@')) {
        warnings.push('Plugin name should start with "tryforge-plugin-" for consistency');
      }
    }

    // Validate version
    if (metadata.version && !semver.valid(metadata.version)) {
      errors.push('Invalid version format (must be valid semver)');
    }

    // Validate tryforge field
    if (metadata.tryforge) {
      const tryforgeValidation = this.validateTryForgeConfig(metadata.tryforge);
      errors.push(...tryforgeValidation.errors);
      warnings.push(...tryforgeValidation.warnings);
    } else {
      warnings.push('Missing "tryforge" configuration field');
    }

    // Validate dependencies
    if (metadata.peerDependencies && metadata.peerDependencies.tryforge) {
      const requiredVersion = metadata.peerDependencies.tryforge;
      if (!semver.validRange(requiredVersion)) {
        errors.push('Invalid TryForge version range in peerDependencies');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate TryForge-specific configuration
   * @param {Object} config - TryForge configuration
   * @returns {Object} Validation result
   */
  static validateTryForgeConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate plugin type
    const validTypes = ['template', 'generator', 'transformer', 'cli', 'integration'];
    if (config.type && !validTypes.includes(config.type)) {
      errors.push(`Invalid plugin type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate hooks
    if (config.hooks) {
      if (!Array.isArray(config.hooks)) {
        errors.push('hooks must be an array');
      } else {
        const validHooks = [
          'before:create', 'after:create',
          'before:generate', 'after:generate',
          'before:build', 'after:build',
          'before:deploy', 'after:deploy',
          'before:migrate', 'after:migrate'
        ];

        for (const hook of config.hooks) {
          if (!validHooks.includes(hook)) {
            warnings.push(`Unknown hook: ${hook}`);
          }
        }
      }
    }

    // Validate permissions
    if (config.permissions) {
      if (!Array.isArray(config.permissions)) {
        errors.push('permissions must be an array');
      } else {
        const validPermissions = [
          'filesystem:read', 'filesystem:write',
          'network:request', 'network:server',
          'process:spawn', 'process:env',
          'database:read', 'database:write'
        ];

        for (const permission of config.permissions) {
          if (!validPermissions.includes(permission)) {
            warnings.push(`Unknown permission: ${permission}`);
          }
        }
      }
    }

    // Validate compatibility
    if (config.compatibility) {
      if (config.compatibility.node && !semver.validRange(config.compatibility.node)) {
        errors.push('Invalid Node.js version range in compatibility');
      }
      if (config.compatibility.tryforge && !semver.validRange(config.compatibility.tryforge)) {
        errors.push('Invalid TryForge version range in compatibility');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate plugin code (basic security checks)
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Object} Validation result
   */
  static async validateCode(pluginPath) {
    const warnings = [];
    const dangerousPatterns = [
      { pattern: /require\(['"]child_process['"]\)/g, message: 'Uses child_process (potential security risk)' },
      { pattern: /require\(['"]fs['"]\)/g, message: 'Uses fs module (file system access)' },
      { pattern: /eval\(/g, message: 'Uses eval() (security risk)' },
      { pattern: /Function\(/g, message: 'Uses Function constructor (security risk)' },
      { pattern: /process\.env/g, message: 'Accesses environment variables' },
      { pattern: /require\(['"]net['"]\)/g, message: 'Uses net module (network access)' },
      { pattern: /require\(['"]http['"]\)/g, message: 'Uses http module (network access)' },
    ];

    try {
      const jsFiles = await this.findJsFiles(pluginPath);

      for (const file of jsFiles) {
        const content = await fs.readFile(file, 'utf-8');

        for (const { pattern, message } of dangerousPatterns) {
          if (pattern.test(content)) {
            warnings.push(`${path.basename(file)}: ${message}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error validating plugin code:', error);
    }

    return { warnings };
  }

  /**
   * Find all JavaScript files in plugin directory
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Promise<Array<string>>}
   */
  static async findJsFiles(pluginPath) {
    const jsFiles = [];

    async function scan(dir) {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          await scan(filePath);
        } else if (file.endsWith('.js')) {
          jsFiles.push(filePath);
        }
      }
    }

    await scan(pluginPath);
    return jsFiles;
  }

  /**
   * Validate plugin compatibility with current TryForge version
   * @param {Object} metadata - Plugin metadata
   * @param {string} tryforgeVersion - Current TryForge version
   * @returns {Object} Validation result
   */
  static validateCompatibility(metadata, tryforgeVersion) {
    const errors = [];
    const warnings = [];

    // Check peerDependencies
    if (metadata.peerDependencies && metadata.peerDependencies.tryforge) {
      const requiredVersion = metadata.peerDependencies.tryforge;

      if (!semver.satisfies(tryforgeVersion, requiredVersion)) {
        errors.push(
          `Plugin requires TryForge ${requiredVersion}, but current version is ${tryforgeVersion}`
        );
      }
    }

    // Check tryforge.compatibility
    if (metadata.tryforge && metadata.tryforge.compatibility) {
      const { node, tryforge } = metadata.tryforge.compatibility;

      if (node && !semver.satisfies(process.version, node)) {
        errors.push(
          `Plugin requires Node.js ${node}, but current version is ${process.version}`
        );
      }

      if (tryforge && !semver.satisfies(tryforgeVersion, tryforge)) {
        errors.push(
          `Plugin requires TryForge ${tryforge}, but current version is ${tryforgeVersion}`
        );
      }
    }

    return {
      compatible: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Perform full validation
   * @param {string} pluginPath - Path to plugin directory
   * @param {string} tryforgeVersion - Current TryForge version
   * @returns {Promise<Object>} Validation result
   */
  static async validate(pluginPath, tryforgeVersion) {
    const structureValidation = await this.validateStructure(pluginPath);

    if (!structureValidation.valid) {
      return structureValidation;
    }

    const codeValidation = await this.validateCode(pluginPath);
    const compatibilityValidation = this.validateCompatibility(
      structureValidation.metadata,
      tryforgeVersion
    );

    return {
      valid: structureValidation.valid && compatibilityValidation.compatible,
      errors: [
        ...structureValidation.errors,
        ...compatibilityValidation.errors
      ],
      warnings: [
        ...structureValidation.warnings,
        ...codeValidation.warnings,
        ...compatibilityValidation.warnings
      ],
      metadata: structureValidation.metadata
    };
  }
}

module.exports = PluginValidator;
