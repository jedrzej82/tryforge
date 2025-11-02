/**
 * TryForge Database Seeding System
 *
 * Main entry point for the seeding system.
 * Exports all core components for easy importing.
 */

const BaseSeeder = require('./base-seeder');
const SeedManager = require('./seed-manager');
const SeederRegistry = require('./seeder-registry');
const DataGenerator = require('./generators/data-generator');
const seedConfig = require('./seed-config');
const SeedingCLI = require('./cli-integration');

module.exports = {
  // Core classes
  BaseSeeder,
  SeedManager,
  SeederRegistry,
  DataGenerator,

  // Configuration
  seedConfig,

  // CLI integration
  SeedingCLI,

  // Convenience methods
  async runAll(options = {}) {
    const manager = new SeedManager(options);
    return await manager.runAll(options);
  },

  async run(seederName, options = {}) {
    const manager = new SeedManager(options);
    await manager.initialize();
    return await manager.run(seederName, options);
  },

  async rollback(seederName = null, options = {}) {
    const manager = new SeedManager(options);
    await manager.initialize();
    return await manager.rollback(seederName, options);
  },

  async list(options = {}) {
    const manager = new SeedManager(options);
    return await manager.list();
  },

  async refresh(options = {}) {
    const manager = new SeedManager(options);
    return await manager.refresh(options);
  },

  async getStats(options = {}) {
    const manager = new SeedManager(options);
    await manager.initialize();
    return await manager.getStats();
  }
};
