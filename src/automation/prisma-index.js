/**
 * Prisma Integration Index
 * Central export point for all Prisma-related modules
 */

const PrismaSchemaBuilder = require('./prisma-schema-builder');
const PrismaMigrationHelper = require('./prisma-migration-helper');
const ModelGenerator = require('./model-generator');
const ModelDiscovery = require('./model-discovery');

// Export example schemas
const { getEcommerceSchema } = require('./examples/prisma-schemas/ecommerce');
const { getBlogSchema } = require('./examples/prisma-schemas/blog');
const { getSaaSSchema } = require('./examples/prisma-schemas/saas');
const { getSocialSchema } = require('./examples/prisma-schemas/social');

module.exports = {
  // Core classes
  PrismaSchemaBuilder,
  PrismaMigrationHelper,
  ModelGenerator,
  ModelDiscovery,

  // Example schemas
  examples: {
    ecommerce: getEcommerceSchema,
    blog: getBlogSchema,
    saas: getSaaSSchema,
    social: getSocialSchema
  },

  // Utility functions
  utils: {
    /**
     * Quick setup for a new Prisma project
     */
    async quickSetup(projectPath, provider = 'postgresql') {
      const helper = new PrismaMigrationHelper(projectPath);
      return await helper.quickSetup(provider);
    },

    /**
     * Generate schema from model definitions
     */
    generateSchema(models, options = {}) {
      const builder = new PrismaSchemaBuilder(options);

      models.forEach(model => {
        builder.addModel(model);
      });

      return builder.generateSchema();
    },

    /**
     * Validate model definitions
     */
    validateModels(models, options = {}) {
      const builder = new PrismaSchemaBuilder(options);

      models.forEach(model => {
        builder.addModel(model);
      });

      const isValid = builder.validateSchema();
      return {
        isValid,
        errors: isValid ? [] : builder.getValidationErrors()
      };
    }
  }
};
