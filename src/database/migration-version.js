/**
 * Migration Versioning System
 * Manages semantic versioning for database schema
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { MigrationVersionError } = require('./migration-errors');

class MigrationVersioning {
  constructor(adapter, config) {
    this.adapter = adapter;
    this.config = config;
    this.versionTable = '_schema_versions';
    this.currentVersion = null;
  }

  /**
   * Initialize versioning table
   */
  async initialize() {
    try {
      await this.adapter.ensureConnection();

      // Create versions table
      const sql = `
        CREATE TABLE IF NOT EXISTS ${this.versionTable} (
          id INTEGER PRIMARY KEY ${this.adapter.getDatabaseType() === 'postgresql' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
          version VARCHAR(50) NOT NULL,
          description TEXT,
          environment VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100)
        );

        CREATE INDEX IF NOT EXISTS idx_version ON ${this.versionTable}(version);
        CREATE INDEX IF NOT EXISTS idx_environment ON ${this.versionTable}(environment);
      `;

      await this.adapter.query(sql);

      logger.debug('Versioning system initialized');
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to initialize versioning: ${error.message}`,
        null,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Get current schema version
   */
  async getCurrentVersion(environment = null) {
    try {
      const env = environment || this.config.environment || 'development';

      let sql = `
        SELECT version
        FROM ${this.versionTable}
        WHERE environment = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.adapter.query(sql, [env]);

      if (result.length === 0) {
        return '0.0.0';
      }

      this.currentVersion = result[0].version;

      logger.debug('Current version retrieved', {
        version: this.currentVersion,
        environment: env
      });

      return this.currentVersion;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to get current version: ${error.message}`,
        null,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Parse semantic version
   */
  parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
      throw new MigrationVersionError(
        `Invalid version format: ${version}. Expected: major.minor.patch`,
        null,
        version
      );
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3])
    };
  }

  /**
   * Format version object to string
   */
  formatVersion(versionObj) {
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
  }

  /**
   * Bump version
   */
  async bumpVersion(type, description = null, environment = null) {
    try {
      const currentVersion = await this.getCurrentVersion(environment);
      const parsed = this.parseVersion(currentVersion);

      // Bump version based on type
      switch (type.toLowerCase()) {
        case 'major':
          parsed.major++;
          parsed.minor = 0;
          parsed.patch = 0;
          break;

        case 'minor':
          parsed.minor++;
          parsed.patch = 0;
          break;

        case 'patch':
          parsed.patch++;
          break;

        default:
          throw new MigrationVersionError(
            `Invalid version bump type: ${type}. Use: major, minor, or patch`,
            currentVersion,
            null
          );
      }

      const newVersion = this.formatVersion(parsed);

      // Insert new version
      await this.setVersion(
        newVersion,
        description || `${type.charAt(0).toUpperCase() + type.slice(1)} version bump`,
        environment
      );

      logger.info('Version bumped', {
        from: currentVersion,
        to: newVersion,
        type
      });

      return newVersion;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to bump version: ${error.message}`,
        null,
        null,
        { type, error: error.message }
      );
    }
  }

  /**
   * Set specific version
   */
  async setVersion(version, description = null, environment = null) {
    try {
      // Validate version format
      this.parseVersion(version);

      const env = environment || this.config.environment || 'development';
      const user = process.env.USER || 'system';

      const sql = `
        INSERT INTO ${this.versionTable}
        (version, description, environment, created_by)
        VALUES (?, ?, ?, ?)
      `;

      await this.adapter.query(sql, [
        version,
        description || `Set to version ${version}`,
        env,
        user
      ]);

      this.currentVersion = version;

      logger.info('Version set', {
        version,
        environment: env
      });

      return version;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to set version: ${error.message}`,
        this.currentVersion,
        version,
        { error: error.message }
      );
    }
  }

  /**
   * Compare two versions
   */
  compareVersions(version1, version2) {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (v1.major !== v2.major) {
      return v1.major - v2.major;
    }

    if (v1.minor !== v2.minor) {
      return v1.minor - v2.minor;
    }

    return v1.patch - v2.patch;
  }

  /**
   * Check if version is compatible
   */
  isCompatible(currentVersion, requiredVersion) {
    const current = this.parseVersion(currentVersion);
    const required = this.parseVersion(requiredVersion);

    // Major version must match
    if (current.major !== required.major) {
      return false;
    }

    // Current minor must be >= required minor
    if (current.minor < required.minor) {
      return false;
    }

    // If minor versions match, current patch must be >= required patch
    if (current.minor === required.minor && current.patch < required.patch) {
      return false;
    }

    return true;
  }

  /**
   * Get version history
   */
  async getVersionHistory(environment = null, limit = 10) {
    try {
      const env = environment || this.config.environment || 'development';

      const sql = `
        SELECT *
        FROM ${this.versionTable}
        WHERE environment = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const history = await this.adapter.query(sql, [env, limit]);

      logger.debug('Version history retrieved', {
        count: history.length,
        environment: env
      });

      return history;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to get version history: ${error.message}`,
        null,
        null,
        { error: error.message }
      );
    }
  }

  /**
   * Compare versions between environments
   */
  async compareEnvironments(env1, env2) {
    try {
      const version1 = await this.getCurrentVersion(env1);
      const version2 = await this.getCurrentVersion(env2);

      const comparison = {
        env1: {
          environment: env1,
          version: version1
        },
        env2: {
          environment: env2,
          version: version2
        },
        comparison: this.compareVersions(version1, version2),
        compatible: this.isCompatible(version2, version1)
      };

      logger.debug('Environments compared', comparison);

      return comparison;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to compare environments: ${error.message}`,
        null,
        null,
        { env1, env2, error: error.message }
      );
    }
  }

  /**
   * Tag a version with a name
   */
  async tagVersion(version, tagName, description = null) {
    try {
      // Validate version exists
      const versionExists = await this.versionExists(version);

      if (!versionExists) {
        throw new MigrationVersionError(
          `Version ${version} does not exist`,
          null,
          version
        );
      }

      const sql = `
        UPDATE ${this.versionTable}
        SET description = ?
        WHERE version = ?
      `;

      await this.adapter.query(sql, [
        `[${tagName}] ${description || ''}`,
        version
      ]);

      logger.info('Version tagged', {
        version,
        tag: tagName
      });

      return true;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to tag version: ${error.message}`,
        null,
        version,
        { tag: tagName, error: error.message }
      );
    }
  }

  /**
   * Check if version exists
   */
  async versionExists(version) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM ${this.versionTable}
        WHERE version = ?
      `;

      const result = await this.adapter.query(sql, [version]);
      return result[0].count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate changelog from version history
   */
  async generateChangelog(options = {}) {
    const {
      fromVersion = null,
      toVersion = null,
      environment = null,
      format = 'markdown'
    } = options;

    try {
      const env = environment || this.config.environment || 'development';

      let sql = `
        SELECT *
        FROM ${this.versionTable}
        WHERE environment = ?
      `;

      const params = [env];

      if (fromVersion) {
        sql += ' AND version >= ?';
        params.push(fromVersion);
      }

      if (toVersion) {
        sql += ' AND version <= ?';
        params.push(toVersion);
      }

      sql += ' ORDER BY created_at DESC';

      const versions = await this.adapter.query(sql, params);

      // Format changelog
      if (format === 'markdown') {
        return this.formatChangelogMarkdown(versions);
      } else if (format === 'json') {
        return JSON.stringify(versions, null, 2);
      } else {
        return versions;
      }
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to generate changelog: ${error.message}`,
        fromVersion,
        toVersion,
        { error: error.message }
      );
    }
  }

  /**
   * Format changelog as Markdown
   */
  formatChangelogMarkdown(versions) {
    const lines = [
      '# Database Schema Changelog',
      '',
      `Generated: ${new Date().toISOString()}`,
      ''
    ];

    versions.forEach(version => {
      lines.push(`## Version ${version.version}`);
      lines.push('');
      lines.push(`- **Date**: ${version.created_at}`);
      lines.push(`- **Environment**: ${version.environment}`);
      lines.push(`- **Created By**: ${version.created_by}`);

      if (version.description) {
        lines.push(`- **Description**: ${version.description}`);
      }

      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Export version information
   */
  async exportVersionInfo(filePath, environment = null) {
    try {
      const env = environment || this.config.environment || 'development';
      const currentVersion = await this.getCurrentVersion(env);
      const history = await this.getVersionHistory(env, 100);

      const versionInfo = {
        environment: env,
        currentVersion,
        lastUpdated: new Date().toISOString(),
        history
      };

      await fs.writeJSON(filePath, versionInfo, { spaces: 2 });

      logger.info('Version info exported', { filePath, environment: env });

      return versionInfo;
    } catch (error) {
      throw new MigrationVersionError(
        `Failed to export version info: ${error.message}`,
        null,
        null,
        { filePath, error: error.message }
      );
    }
  }
}

module.exports = MigrationVersioning;
