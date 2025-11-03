const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');
const ExpressParser = require('./parsers/express-parser');
const NestJSParser = require('./parsers/nestjs-parser');
const JSDocParser = require('./parsers/jsdoc-parser');
const TSDocParser = require('./parsers/tsdoc-parser');
const FastAPIParser = require('./parsers/fastapi-parser');
const OpenAPIBuilder = require('./openapi-builder');
const SwaggerUIGenerator = require('./swagger-ui-generator');
const MarkdownGenerator = require('./markdown-generator');

/**
 * API Documentation Generator
 * Generates OpenAPI/Swagger documentation from code
 */
class APIDocGenerator {
  constructor(options = {}) {
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      outputDir: options.outputDir || './docs/api',
      framework: options.framework || 'auto', // auto, express, nestjs, fastapi
      format: options.format || 'openapi', // openapi, swagger, markdown, all
      includePrivate: options.includePrivate || false,
      validateSpec: options.validateSpec !== false,
      generateExamples: options.generateExamples !== false,
      theme: options.theme || 'default',
      ...options
    };

    this.routes = [];
    this.schemas = {};
    this.parsers = this.initializeParsers();
    this.openAPIBuilder = new OpenAPIBuilder(this.options);
    this.swaggerUIGenerator = new SwaggerUIGenerator(this.options);
    this.markdownGenerator = new MarkdownGenerator(this.options);
  }

  /**
   * Initialize parsers based on detected framework
   */
  initializeParsers() {
    return {
      express: new ExpressParser(this.options),
      nestjs: new NestJSParser(this.options),
      jsdoc: new JSDocParser(this.options),
      tsdoc: new TSDocParser(this.options),
      fastapi: new FastAPIParser(this.options)
    };
  }

  /**
   * Detect framework from project files
   */
  async detectFramework() {
    try {
      const packageJsonPath = path.join(this.options.projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check for frameworks
      if (dependencies['@nestjs/core']) {
        return 'nestjs';
      }
      if (dependencies['express']) {
        return 'express';
      }
      if (dependencies['fastify']) {
        return 'fastify';
      }

      // Check for Python FastAPI
      const requirementsPath = path.join(this.options.projectPath, 'requirements.txt');
      try {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        if (requirements.includes('fastapi')) {
          return 'fastapi';
        }
      } catch (err) {
        // No requirements.txt
      }

      logger.warn('Could not auto-detect framework, defaulting to Express');
      return 'express';
    } catch (error) {
      logger.error('Error detecting framework:', error);
      return 'express';
    }
  }

  /**
   * Find all route files in project
   */
  async findRouteFiles() {
    const routeFiles = [];
    const framework = this.options.framework === 'auto'
      ? await this.detectFramework()
      : this.options.framework;

    const searchPatterns = {
      express: ['**/routes/**/*.js', '**/routes/**/*.ts', '**/controllers/**/*.js', '**/controllers/**/*.ts'],
      nestjs: ['**/*.controller.ts', '**/controllers/**/*.ts'],
      fastapi: ['**/routers/**/*.py', '**/routes/**/*.py', '**/main.py']
    };

    const patterns = searchPatterns[framework] || searchPatterns.express;

    for (const pattern of patterns) {
      const files = await this.globFiles(pattern);
      routeFiles.push(...files);
    }

    // Remove duplicates
    return [...new Set(routeFiles)];
  }

  /**
   * Glob files matching pattern
   */
  async globFiles(pattern) {
    const glob = require('glob');
    return new Promise((resolve, reject) => {
      glob(pattern, {
        cwd: this.options.projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      }, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  /**
   * Parse all routes from project
   */
  async parseRoutes() {
    logger.info('Parsing routes from project...');

    const framework = this.options.framework === 'auto'
      ? await this.detectFramework()
      : this.options.framework;

    logger.info(`Detected framework: ${framework}`);

    const routeFiles = await this.findRouteFiles();
    logger.info(`Found ${routeFiles.length} route files`);

    this.routes = [];
    this.schemas = {};

    for (const file of routeFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const parser = this.getParser(framework, file);

        if (parser) {
          const result = await parser.parse(file, content);

          if (result.routes && result.routes.length > 0) {
            this.routes.push(...result.routes);
            logger.debug(`Parsed ${result.routes.length} routes from ${file}`);
          }

          if (result.schemas) {
            this.schemas = { ...this.schemas, ...result.schemas };
          }
        }
      } catch (error) {
        logger.error(`Error parsing file ${file}:`, error);
      }
    }

    logger.info(`Total routes parsed: ${this.routes.length}`);
    logger.info(`Total schemas extracted: ${Object.keys(this.schemas).length}`);

    return {
      routes: this.routes,
      schemas: this.schemas
    };
  }

  /**
   * Get appropriate parser for file
   */
  getParser(framework, filePath) {
    const ext = path.extname(filePath);

    // Python files
    if (ext === '.py') {
      return this.parsers.fastapi;
    }

    // TypeScript/JavaScript files
    if (framework === 'nestjs') {
      return this.parsers.nestjs;
    }

    if (framework === 'express') {
      return this.parsers.express;
    }

    return this.parsers.express; // Default
  }

  /**
   * Generate documentation in specified format
   */
  async generate() {
    logger.info('Starting API documentation generation...');

    try {
      // Parse routes
      await this.parseRoutes();

      // Filter private routes if needed
      const routesToDocument = this.options.includePrivate
        ? this.routes
        : this.routes.filter(r => !r.private);

      if (routesToDocument.length === 0) {
        logger.warn('No routes found to document');
        return null;
      }

      // Create output directory
      await fs.mkdir(this.options.outputDir, { recursive: true });

      const results = {};

      // Generate OpenAPI spec
      if (['openapi', 'swagger', 'all'].includes(this.options.format)) {
        logger.info('Generating OpenAPI specification...');
        const openApiSpec = await this.openAPIBuilder.build(routesToDocument, this.schemas);

        // Validate if enabled
        if (this.options.validateSpec) {
          await this.validateOpenAPISpec(openApiSpec);
        }

        const specPath = path.join(this.options.outputDir, 'openapi.json');
        await fs.writeFile(specPath, JSON.stringify(openApiSpec, null, 2));
        logger.success(`OpenAPI spec saved to ${specPath}`);
        results.openapi = specPath;

        // Generate YAML version
        const yaml = require('js-yaml');
        const yamlPath = path.join(this.options.outputDir, 'openapi.yaml');
        await fs.writeFile(yamlPath, yaml.dump(openApiSpec));
        logger.success(`OpenAPI YAML saved to ${yamlPath}`);
        results.openapi_yaml = yamlPath;
      }

      // Generate Swagger UI
      if (['swagger', 'all'].includes(this.options.format)) {
        logger.info('Generating Swagger UI...');
        const swaggerPath = await this.swaggerUIGenerator.generate(
          path.join(this.options.outputDir, 'openapi.json')
        );
        logger.success(`Swagger UI saved to ${swaggerPath}`);
        results.swagger = swaggerPath;
      }

      // Generate Markdown
      if (['markdown', 'all'].includes(this.options.format)) {
        logger.info('Generating Markdown documentation...');
        const markdownPath = await this.markdownGenerator.generate(
          routesToDocument,
          this.schemas
        );
        logger.success(`Markdown docs saved to ${markdownPath}`);
        results.markdown = markdownPath;
      }

      logger.success('API documentation generation complete!');
      return results;

    } catch (error) {
      logger.error('Error generating documentation:', error);
      throw error;
    }
  }

  /**
   * Validate OpenAPI specification
   */
  async validateOpenAPISpec(spec) {
    try {
      const SwaggerParser = require('@apidevtools/swagger-parser');
      await SwaggerParser.validate(spec);
      logger.success('OpenAPI specification is valid');
      return true;
    } catch (error) {
      logger.error('OpenAPI specification validation failed:', error.message);
      if (!this.options.ignoreValidationErrors) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Serve documentation with live server
   */
  async serve(port = 3000) {
    logger.info('Starting documentation server...');

    // Generate if not exists
    const outputPath = path.join(this.options.outputDir, 'index.html');
    try {
      await fs.access(outputPath);
    } catch {
      logger.info('Documentation not found, generating...');
      await this.generate();
    }

    // Start server
    const express = require('express');
    const app = express();

    app.use(express.static(this.options.outputDir));

    app.get('/', (req, res) => {
      res.sendFile(path.join(this.options.outputDir, 'index.html'));
    });

    app.listen(port, () => {
      logger.success(`Documentation server running at http://localhost:${port}`);
      logger.info('Press Ctrl+C to stop');
    });
  }

  /**
   * Export documentation to different formats
   */
  async export(format, outputPath) {
    const validFormats = ['json', 'yaml', 'html', 'markdown', 'postman'];

    if (!validFormats.includes(format)) {
      throw new Error(`Invalid export format: ${format}. Valid formats: ${validFormats.join(', ')}`);
    }

    logger.info(`Exporting documentation to ${format}...`);

    await this.parseRoutes();

    switch (format) {
      case 'json':
        const spec = await this.openAPIBuilder.build(this.routes, this.schemas);
        await fs.writeFile(outputPath, JSON.stringify(spec, null, 2));
        break;

      case 'yaml':
        const yaml = require('js-yaml');
        const yamlSpec = await this.openAPIBuilder.build(this.routes, this.schemas);
        await fs.writeFile(outputPath, yaml.dump(yamlSpec));
        break;

      case 'html':
        await this.swaggerUIGenerator.generate(outputPath);
        break;

      case 'markdown':
        await this.markdownGenerator.generate(this.routes, this.schemas, outputPath);
        break;

      case 'postman':
        const postmanCollection = await this.generatePostmanCollection();
        await fs.writeFile(outputPath, JSON.stringify(postmanCollection, null, 2));
        break;

      default:
        throw new Error(`Export format ${format} not implemented`);
    }

    logger.success(`Documentation exported to ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate Postman collection from routes
   */
  async generatePostmanCollection() {
    const collection = {
      info: {
        name: this.options.apiName || 'API Documentation',
        description: this.options.apiDescription || 'Generated API collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: []
    };

    // Group routes by tags
    const groupedRoutes = this.groupRoutesByTag();

    for (const [tag, routes] of Object.entries(groupedRoutes)) {
      const folder = {
        name: tag,
        item: routes.map(route => this.routeToPostmanItem(route))
      };
      collection.item.push(folder);
    }

    return collection;
  }

  /**
   * Group routes by tag
   */
  groupRoutesByTag() {
    const grouped = {};

    for (const route of this.routes) {
      const tag = route.tags && route.tags[0] || 'Default';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(route);
    }

    return grouped;
  }

  /**
   * Convert route to Postman item
   */
  routeToPostmanItem(route) {
    return {
      name: route.summary || `${route.method.toUpperCase()} ${route.path}`,
      request: {
        method: route.method.toUpperCase(),
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        url: {
          raw: `{{baseUrl}}${route.path}`,
          host: ['{{baseUrl}}'],
          path: route.path.split('/').filter(Boolean)
        },
        description: route.description || '',
        body: route.requestBody ? {
          mode: 'raw',
          raw: JSON.stringify(route.requestBody.example || {}, null, 2)
        } : undefined
      },
      response: []
    };
  }

  /**
   * Get documentation statistics
   */
  getStats() {
    return {
      totalRoutes: this.routes.length,
      routesByMethod: this.groupRoutesByMethod(),
      routesByTag: Object.keys(this.groupRoutesByTag()).length,
      totalSchemas: Object.keys(this.schemas).length,
      documentedRoutes: this.routes.filter(r => r.description).length,
      undocumentedRoutes: this.routes.filter(r => !r.description).length
    };
  }

  /**
   * Group routes by HTTP method
   */
  groupRoutesByMethod() {
    const grouped = {};

    for (const route of this.routes) {
      const method = route.method.toUpperCase();
      grouped[method] = (grouped[method] || 0) + 1;
    }

    return grouped;
  }
}

module.exports = APIDocGenerator;
