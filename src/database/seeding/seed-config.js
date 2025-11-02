/**
 * Seed Configuration
 *
 * Configuration for the database seeding system including
 * paths, environments, and seeding options.
 */

const path = require('path');

module.exports = {
  // Seeder paths
  paths: {
    seeders: path.join(__dirname, 'seeders'),
    templates: path.join(__dirname, 'templates'),
    registry: path.join(process.cwd(), '.tryforge', 'seeder-registry.json')
  },

  // Registry configuration
  registry: {
    type: 'file', // 'file' or 'database'
    tableName: 'seeder_registry'
  },

  // Seeder execution order (optional - otherwise use dependencies and priority)
  order: [
    'UsersSeeder',
    'CategoriesSeeder',
    'ProductsSeeder',
    'OrdersSeeder',
    'PostsSeeder',
    'ReviewsSeeder'
  ],

  // Environment-specific settings
  environments: {
    development: {
      runSeeders: true,
      counts: {
        users: 50,
        categories: 15,
        products: 100,
        orders: 200,
        posts: 50,
        reviews: 300
      },
      options: {
        truncateBefore: false,
        checkRegistry: true,
        skipIfExists: true,
        continueOnError: false
      }
    },
    staging: {
      runSeeders: true,
      counts: {
        users: 20,
        categories: 10,
        products: 50,
        orders: 100,
        posts: 25,
        reviews: 150
      },
      options: {
        truncateBefore: false,
        checkRegistry: true,
        skipIfExists: true,
        continueOnError: false
      }
    },
    production: {
      runSeeders: false, // NEVER seed production!
      counts: {},
      options: {
        truncateBefore: false,
        checkRegistry: true,
        skipIfExists: true,
        continueOnError: false
      }
    },
    test: {
      runSeeders: true,
      counts: {
        users: 10,
        categories: 5,
        products: 20,
        orders: 30,
        posts: 10,
        reviews: 50
      },
      options: {
        truncateBefore: true,
        checkRegistry: false,
        skipIfExists: false,
        continueOnError: false
      }
    }
  },

  // Global seeding options
  options: {
    // Batch size for bulk inserts
    batchSize: 100,

    // Delay between batches (ms)
    batchDelay: 0,

    // Maximum retry attempts on failure
    maxRetries: 3,

    // Retry delay (ms)
    retryDelay: 1000,

    // Enable progress logging
    showProgress: true,

    // Enable verbose logging
    verbose: false,

    // Dry run mode (don't actually insert data)
    dryRun: false,

    // Truncate tables before seeding
    truncateBefore: false,

    // Check registry before running seeders
    checkRegistry: true,

    // Skip seeder if it has already run
    skipIfExists: false,

    // Continue on error
    continueOnError: false,

    // Force run even if already seeded
    force: false
  },

  // Database connection settings
  database: {
    // Type of database
    type: process.env.DB_TYPE || 'postgresql', // postgresql, mysql, mongodb, etc.

    // Connection string
    url: process.env.DATABASE_URL || 'postgresql://devuser:devpass123@localhost:5432/app_db',

    // Connection pool settings
    pool: {
      min: 2,
      max: 10,
      idle: 10000
    },

    // Logging
    logging: process.env.DB_LOGGING === 'true'
  },

  // Seeder metadata
  metadata: {
    version: '1.0.0',
    author: 'TryForge Team',
    description: 'TryForge Database Seeding System'
  },

  // Hooks (optional)
  hooks: {
    // Before all seeders run
    beforeAll: async (db) => {
      // Example: Set up database connections, transactions, etc.
      console.log('Running before all seeders hook...');
    },

    // After all seeders run
    afterAll: async (db, stats) => {
      // Example: Cleanup, logging, etc.
      console.log('Running after all seeders hook...');
      console.log(`Total records created: ${stats.seeders.reduce((sum, s) => sum + s.recordsCreated, 0)}`);
    },

    // Before each seeder
    beforeEach: async (seeder, db) => {
      // Example: Start transaction, logging, etc.
      // console.log(`Before seeder: ${seeder.name}`);
    },

    // After each seeder
    afterEach: async (seeder, db, result) => {
      // Example: Commit transaction, logging, etc.
      // console.log(`After seeder: ${seeder.name}`);
    },

    // On seeder error
    onError: async (seeder, error, db) => {
      // Example: Rollback transaction, error logging, notifications, etc.
      console.error(`Seeder error: ${seeder.name} - ${error.message}`);
    }
  },

  // Validation rules
  validation: {
    // Ensure required seeders are present
    requiredSeeders: [],

    // Maximum execution time per seeder (ms)
    maxExecutionTime: 300000, // 5 minutes

    // Minimum free disk space (MB)
    minDiskSpace: 100
  },

  // Custom seeder settings (can be accessed by seeders)
  custom: {
    // Password for seeded users
    defaultPassword: 'password123',

    // Images
    useRealImages: false,
    imageProvider: 'faker', // 'faker', 'unsplash', 'local'

    // Localization
    locale: 'en',

    // Data quality
    dataQuality: 'high', // 'low', 'medium', 'high'

    // Relationships
    createRelationships: true,
    relationshipDensity: 0.3 // 0-1, percentage of possible relationships to create
  }
};
