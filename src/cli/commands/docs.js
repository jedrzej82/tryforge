const path = require('path');
const { logger } = require('../../utils/logger');
const APIDocGenerator = require('../../documentation/api-doc-generator');

/**
 * Documentation commands for TryForge CLI
 */
class DocsCommand {
  /**
   * Generate API documentation
   */
  static async generate(options = {}) {
    try {
      logger.info('Starting API documentation generation...');

      const generator = new APIDocGenerator({
        projectPath: options.path || process.cwd(),
        outputDir: options.output || './docs/api',
        framework: options.framework || 'auto',
        format: options.format || 'all',
        includePrivate: options.includePrivate || false,
        validateSpec: options.validate !== false,
        generateExamples: options.examples !== false,
        apiName: options.name || 'API Documentation',
        apiVersion: options.version || '1.0.0',
        apiDescription: options.description || 'Auto-generated API documentation',
        serverUrl: options.serverUrl || 'http://localhost:3000',
        theme: options.theme || 'default'
      });

      const results = await generator.generate();

      if (results) {
        logger.success('API documentation generated successfully!');
        logger.info('\nGenerated files:');

        for (const [format, filePath] of Object.entries(results)) {
          logger.info(`  ${format}: ${filePath}`);
        }

        // Show statistics
        const stats = generator.getStats();
        logger.info('\nDocumentation Statistics:');
        logger.info(`  Total routes: ${stats.totalRoutes}`);
        logger.info(`  Documented routes: ${stats.documentedRoutes}`);
        logger.info(`  Undocumented routes: ${stats.undocumentedRoutes}`);
        logger.info(`  Total schemas: ${stats.totalSchemas}`);
        logger.info(`  Tags: ${stats.routesByTag}`);
        logger.info('\nRoutes by method:');

        for (const [method, count] of Object.entries(stats.routesByMethod)) {
          logger.info(`  ${method}: ${count}`);
        }

        logger.info('\nNext steps:');
        logger.info(`  - View documentation: tryforge docs:serve`);
        logger.info(`  - Validate spec: tryforge docs:validate`);
      } else {
        logger.warn('No documentation was generated');
      }

      return results;

    } catch (error) {
      logger.error('Failed to generate documentation:', error.message);
      throw error;
    }
  }

  /**
   * Serve documentation with live server
   */
  static async serve(options = {}) {
    try {
      const port = options.port || 3000;
      const outputDir = options.output || './docs/api';

      logger.info(`Starting documentation server on port ${port}...`);

      const generator = new APIDocGenerator({
        projectPath: options.path || process.cwd(),
        outputDir
      });

      await generator.serve(port);

    } catch (error) {
      logger.error('Failed to start documentation server:', error.message);
      throw error;
    }
  }

  /**
   * Export documentation to different formats
   */
  static async export(format, outputPath, options = {}) {
    try {
      if (!format) {
        throw new Error('Export format is required');
      }

      if (!outputPath) {
        throw new Error('Output path is required');
      }

      logger.info(`Exporting documentation to ${format}...`);

      const generator = new APIDocGenerator({
        projectPath: options.path || process.cwd(),
        framework: options.framework || 'auto',
        apiName: options.name,
        apiVersion: options.version,
        apiDescription: options.description,
        serverUrl: options.serverUrl
      });

      const result = await generator.export(format, outputPath);

      logger.success(`Documentation exported to ${result}`);
      return result;

    } catch (error) {
      logger.error('Failed to export documentation:', error.message);
      throw error;
    }
  }

  /**
   * Validate OpenAPI specification
   */
  static async validate(options = {}) {
    try {
      const specPath = options.spec || './docs/api/openapi.json';

      logger.info('Validating OpenAPI specification...');

      const fs = require('fs').promises;
      const specContent = await fs.readFile(specPath, 'utf-8');
      const spec = JSON.parse(specContent);

      const SwaggerParser = require('@apidevtools/swagger-parser');
      const api = await SwaggerParser.validate(spec);

      logger.success('OpenAPI specification is valid!');
      logger.info(`API name: ${api.info.title}`);
      logger.info(`API version: ${api.info.version}`);
      logger.info(`Paths: ${Object.keys(api.paths).length}`);

      return true;

    } catch (error) {
      logger.error('OpenAPI specification validation failed:');
      logger.error(error.message);

      if (options.verbose) {
        logger.error(error);
      }

      throw error;
    }
  }

  /**
   * Initialize documentation configuration
   */
  static async init(options = {}) {
    try {
      logger.info('Initializing API documentation configuration...');

      const fs = require('fs').promises;
      const configPath = path.join(process.cwd(), '.tryforge-docs.json');

      const config = {
        framework: options.framework || 'auto',
        output: './docs/api',
        format: 'all',
        api: {
          name: 'API Documentation',
          version: '1.0.0',
          description: 'Auto-generated API documentation',
          serverUrl: 'http://localhost:3000'
        },
        options: {
          includePrivate: false,
          validateSpec: true,
          generateExamples: true,
          theme: 'default'
        },
        security: {
          schemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      logger.success(`Configuration file created: ${configPath}`);
      logger.info('\nYou can now customize the configuration and run:');
      logger.info('  tryforge docs:generate');

      return config;

    } catch (error) {
      logger.error('Failed to initialize documentation configuration:', error.message);
      throw error;
    }
  }

  /**
   * Show documentation statistics
   */
  static async stats(options = {}) {
    try {
      logger.info('Analyzing API documentation...');

      const generator = new APIDocGenerator({
        projectPath: options.path || process.cwd(),
        framework: options.framework || 'auto'
      });

      await generator.parseRoutes();

      const stats = generator.getStats();

      logger.info('\nAPI Documentation Statistics:');
      logger.info('─'.repeat(50));
      logger.info(`Total routes: ${stats.totalRoutes}`);
      logger.info(`Documented routes: ${stats.documentedRoutes}`);
      logger.info(`Undocumented routes: ${stats.undocumentedRoutes}`);
      logger.info(`Documentation coverage: ${Math.round((stats.documentedRoutes / stats.totalRoutes) * 100)}%`);
      logger.info(`Total schemas: ${stats.totalSchemas}`);
      logger.info(`Total tags: ${stats.routesByTag}`);

      logger.info('\nRoutes by HTTP method:');
      logger.info('─'.repeat(50));
      for (const [method, count] of Object.entries(stats.routesByMethod)) {
        logger.info(`  ${method.padEnd(10)}: ${count}`);
      }

      if (stats.undocumentedRoutes > 0) {
        logger.warn(`\n⚠️  ${stats.undocumentedRoutes} routes are missing documentation`);
        logger.info('Run with --show-undocumented to see them');
      }

      return stats;

    } catch (error) {
      logger.error('Failed to analyze documentation:', error.message);
      throw error;
    }
  }

  /**
   * Watch for changes and regenerate documentation
   */
  static async watch(options = {}) {
    try {
      logger.info('Starting documentation watch mode...');

      const chokidar = require('chokidar');

      const watchPatterns = [
        '**/routes/**/*.{js,ts}',
        '**/controllers/**/*.{js,ts}',
        '**/routers/**/*.py'
      ];

      const watcher = chokidar.watch(watchPatterns, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        cwd: options.path || process.cwd()
      });

      logger.info('Watching for changes...');
      logger.info('Press Ctrl+C to stop');

      let isGenerating = false;

      const regenerate = async () => {
        if (isGenerating) return;

        isGenerating = true;
        try {
          logger.info('\nDetected changes, regenerating documentation...');
          await DocsCommand.generate(options);
        } catch (error) {
          logger.error('Failed to regenerate documentation:', error.message);
        } finally {
          isGenerating = false;
        }
      };

      watcher
        .on('add', path => {
          logger.debug(`File added: ${path}`);
          regenerate();
        })
        .on('change', path => {
          logger.debug(`File changed: ${path}`);
          regenerate();
        })
        .on('unlink', path => {
          logger.debug(`File removed: ${path}`);
          regenerate();
        });

      // Generate initial documentation
      await DocsCommand.generate(options);

      // Keep process running
      await new Promise(() => {});

    } catch (error) {
      logger.error('Failed to start watch mode:', error.message);
      throw error;
    }
  }
}

module.exports = DocsCommand;
