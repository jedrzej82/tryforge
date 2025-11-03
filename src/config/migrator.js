/**
 * Configuration Migrator
 *
 * This module handles migrating configuration files between versions,
 * including backing up old configs and tracking migration history.
 */

const fs = require('fs');
const path = require('path');
const { cloneConfig } = require('./merge');

const CURRENT_VERSION = '1.0.0';
const MIGRATION_HISTORY_FILE = '.tryforge-migrations.json';

/**
 * Migration definitions
 * Each migration transforms config from one version to the next
 */
const migrations = [
  // Example migration from 0.9.0 to 1.0.0
  {
    from: '0.9.0',
    to: '1.0.0',
    description: 'Initial stable release',
    migrate: (config) => {
      // Example: rename old keys
      if (config.aiService) {
        config.ai = config.aiService;
        delete config.aiService;
      }

      // Example: change structure
      if (config.ai && config.ai.key) {
        config.ai.apiKey = config.ai.key;
        delete config.ai.key;
      }

      return config;
    }
  }

  // Add more migrations here as needed
  // {
  //   from: '1.0.0',
  //   to: '1.1.0',
  //   description: 'Add new feature X',
  //   migrate: (config) => {
  //     // Migration logic
  //     return config;
  //   }
  // }
];

/**
 * Check if configuration needs migration
 *
 * @param {object} config - Configuration object
 * @returns {object} Migration check result
 */
function needsMigration(config) {
  const configVersion = config.version || '0.0.0';

  if (compareVersions(configVersion, CURRENT_VERSION) >= 0) {
    return {
      needed: false,
      from: configVersion,
      to: CURRENT_VERSION,
      message: 'Configuration is up to date'
    };
  }

  const migrationPath = getMigrationPath(configVersion, CURRENT_VERSION);

  if (migrationPath.length === 0) {
    return {
      needed: false,
      from: configVersion,
      to: CURRENT_VERSION,
      message: 'No migrations defined for this version path'
    };
  }

  return {
    needed: true,
    from: configVersion,
    to: CURRENT_VERSION,
    migrations: migrationPath,
    message: `Migration available: ${configVersion} → ${CURRENT_VERSION}`
  };
}

/**
 * Migrate configuration to current version
 *
 * @param {object} config - Configuration object
 * @param {object} options - Migration options
 * @param {boolean} options.backup - Create backup before migration
 * @param {string} options.backupDir - Directory for backups
 * @returns {object} Migration result
 */
async function migrateConfig(config, options = {}) {
  const {
    backup = true,
    backupDir = process.cwd()
  } = options;

  const check = needsMigration(config);

  if (!check.needed) {
    return {
      success: true,
      migrated: false,
      config,
      message: check.message
    };
  }

  try {
    // Create backup if requested
    let backupPath = null;
    if (backup) {
      backupPath = await createBackup(config, backupDir);
    }

    // Clone config to avoid mutating original
    let migratedConfig = cloneConfig(config);

    // Apply migrations in sequence
    const appliedMigrations = [];
    for (const migration of check.migrations) {
      try {
        migratedConfig = migration.migrate(migratedConfig);
        appliedMigrations.push({
          from: migration.from,
          to: migration.to,
          description: migration.description,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        throw new Error(
          `Migration ${migration.from} → ${migration.to} failed: ${error.message}`
        );
      }
    }

    // Update version in config
    migratedConfig.version = CURRENT_VERSION;

    // Record migration in history
    await recordMigration(backupDir, {
      from: check.from,
      to: CURRENT_VERSION,
      migrations: appliedMigrations,
      backupPath,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      migrated: true,
      config: migratedConfig,
      appliedMigrations,
      backupPath,
      message: `Successfully migrated from ${check.from} to ${CURRENT_VERSION}`
    };
  } catch (error) {
    return {
      success: false,
      migrated: false,
      config,
      error: error.message,
      message: `Migration failed: ${error.message}`
    };
  }
}

/**
 * Get migration path from one version to another
 *
 * @param {string} fromVersion - Starting version
 * @param {string} toVersion - Target version
 * @returns {Array<object>} Array of migrations to apply
 */
function getMigrationPath(fromVersion, toVersion) {
  const path = [];
  let currentVersion = fromVersion;

  while (compareVersions(currentVersion, toVersion) < 0) {
    const migration = migrations.find(m => m.from === currentVersion);

    if (!migration) {
      // No migration found, try to find any migration that starts after current
      const nextMigration = migrations.find(m =>
        compareVersions(m.from, currentVersion) > 0 &&
        compareVersions(m.from, toVersion) <= 0
      );

      if (!nextMigration) {
        break; // No more migrations available
      }

      // Skip to next available migration
      currentVersion = nextMigration.from;
      continue;
    }

    path.push(migration);
    currentVersion = migration.to;
  }

  return path;
}

/**
 * Create backup of configuration
 *
 * @param {object} config - Configuration object
 * @param {string} backupDir - Directory for backups
 * @returns {Promise<string>} Path to backup file
 */
async function createBackup(config, backupDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `tryforge.config.backup.${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  try {
    await fs.promises.writeFile(
      backupPath,
      JSON.stringify(config, null, 2),
      'utf8'
    );

    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Record migration in history file
 *
 * @param {string} dir - Directory for history file
 * @param {object} migrationRecord - Migration record
 * @returns {Promise<void>}
 */
async function recordMigration(dir, migrationRecord) {
  const historyPath = path.join(dir, MIGRATION_HISTORY_FILE);

  try {
    let history = [];

    // Read existing history if it exists
    if (fs.existsSync(historyPath)) {
      const content = await fs.promises.readFile(historyPath, 'utf8');
      history = JSON.parse(content);
    }

    // Add new record
    history.push(migrationRecord);

    // Write updated history
    await fs.promises.writeFile(
      historyPath,
      JSON.stringify(history, null, 2),
      'utf8'
    );
  } catch (error) {
    // Non-fatal: log error but don't fail migration
    console.error('Failed to record migration history:', error.message);
  }
}

/**
 * Get migration history
 *
 * @param {string} dir - Directory containing history file
 * @returns {Promise<Array<object>>} Migration history
 */
async function getMigrationHistory(dir) {
  const historyPath = path.join(dir, MIGRATION_HISTORY_FILE);

  try {
    if (fs.existsSync(historyPath)) {
      const content = await fs.promises.readFile(historyPath, 'utf8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error('Failed to read migration history:', error.message);
    return [];
  }
}

/**
 * Compare two semantic version strings
 *
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Check if a version is compatible with current version
 *
 * @param {string} version - Version to check
 * @returns {boolean} True if compatible
 */
function isCompatibleVersion(version) {
  // Compatible if major version matches
  const [major1] = CURRENT_VERSION.split('.').map(Number);
  const [major2] = version.split('.').map(Number);

  return major1 === major2;
}

/**
 * List all available backups
 *
 * @param {string} dir - Directory to search for backups
 * @returns {Promise<Array<object>>} Array of backup files
 */
async function listBackups(dir) {
  try {
    const files = await fs.promises.readdir(dir);
    const backups = files
      .filter(file => file.startsWith('tryforge.config.backup.') && file.endsWith('.json'))
      .map(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          path: fullPath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created); // Newest first

    return backups;
  } catch (error) {
    console.error('Failed to list backups:', error.message);
    return [];
  }
}

/**
 * Restore configuration from backup
 *
 * @param {string} backupPath - Path to backup file
 * @returns {Promise<object>} Restored configuration
 */
async function restoreFromBackup(backupPath) {
  try {
    const content = await fs.promises.readFile(backupPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to restore from backup: ${error.message}`);
  }
}

/**
 * Clean old backups, keeping only the most recent N
 *
 * @param {string} dir - Directory containing backups
 * @param {number} keepCount - Number of backups to keep
 * @returns {Promise<number>} Number of backups deleted
 */
async function cleanOldBackups(dir, keepCount = 5) {
  try {
    const backups = await listBackups(dir);

    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    let deleted = 0;

    for (const backup of toDelete) {
      try {
        await fs.promises.unlink(backup.path);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.filename}:`, error.message);
      }
    }

    return deleted;
  } catch (error) {
    console.error('Failed to clean old backups:', error.message);
    return 0;
  }
}

module.exports = {
  needsMigration,
  migrateConfig,
  getMigrationPath,
  createBackup,
  getMigrationHistory,
  compareVersions,
  isCompatibleVersion,
  listBackups,
  restoreFromBackup,
  cleanOldBackups,
  CURRENT_VERSION,
  migrations
};
