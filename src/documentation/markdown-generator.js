const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Markdown Documentation Generator
 * Generates Markdown API documentation
 */
class MarkdownGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './docs/api',
      title: options.apiName || 'API Documentation',
      description: options.apiDescription || '',
      includeTableOfContents: options.includeTableOfContents !== false,
      includeExamples: options.includeExamples !== false,
      groupByTag: options.groupByTag !== false,
      ...options
    };
  }

  /**
   * Generate complete Markdown documentation
   */
  async generate(routes, schemas = {}, outputPath = null) {
    logger.debug('Generating Markdown documentation...');

    // Build markdown content
    const markdown = this.buildMarkdown(routes, schemas);

    // Write to file
    const finalPath = outputPath || path.join(this.options.outputDir, 'API.md');
    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.writeFile(finalPath, markdown);

    logger.debug(`Markdown documentation generated at ${finalPath}`);
    return finalPath;
  }

  /**
   * Build complete markdown document
   */
  buildMarkdown(routes, schemas) {
    const sections = [];

    // Title and description
    sections.push(`# ${this.options.title}\n`);
    if (this.options.description) {
      sections.push(`${this.options.description}\n`);
    }

    // Table of contents
    if (this.options.includeTableOfContents) {
      sections.push(this.buildTableOfContents(routes));
    }

    // Base URL
    if (this.options.serverUrl) {
      sections.push(`## Base URL\n`);
      sections.push(`\`${this.options.serverUrl}\`\n`);
    }

    // Authentication
    if (this.options.securitySchemes) {
      sections.push(this.buildAuthenticationSection());
    }

    // Endpoints
    sections.push('## Endpoints\n');

    if (this.options.groupByTag) {
      sections.push(this.buildGroupedEndpoints(routes));
    } else {
      sections.push(this.buildEndpointsList(routes));
    }

    // Schemas
    if (Object.keys(schemas).length > 0) {
      sections.push(this.buildSchemasSection(schemas));
    }

    // Error codes
    sections.push(this.buildErrorCodesSection());

    return sections.join('\n');
  }

  /**
   * Build table of contents
   */
  buildTableOfContents(routes) {
    const toc = ['## Table of Contents\n'];

    if (this.options.securitySchemes) {
      toc.push('- [Authentication](#authentication)');
    }

    toc.push('- [Endpoints](#endpoints)');

    if (this.options.groupByTag) {
      const tags = this.getUniqueTags(routes);
      tags.forEach(tag => {
        const anchor = this.createAnchor(tag);
        toc.push(`  - [${tag}](#${anchor})`);
      });
    } else {
      routes.forEach(route => {
        const title = route.summary || `${route.method.toUpperCase()} ${route.path}`;
        const anchor = this.createAnchor(title);
        toc.push(`  - [${title}](#${anchor})`);
      });
    }

    toc.push('- [Schemas](#schemas)');
    toc.push('- [Error Codes](#error-codes)');

    return toc.join('\n') + '\n';
  }

  /**
   * Create anchor link from text
   */
  createAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Get unique tags from routes
   */
  getUniqueTags(routes) {
    const tags = new Set();
    routes.forEach(route => {
      if (route.tags && route.tags.length > 0) {
        route.tags.forEach(tag => tags.add(tag));
      } else {
        tags.add('Other');
      }
    });
    return Array.from(tags).sort();
  }

  /**
   * Build authentication section
   */
  buildAuthenticationSection() {
    const auth = ['## Authentication\n'];

    if (this.options.securitySchemes) {
      const schemes = this.options.securitySchemes;

      if (schemes.bearerAuth) {
        auth.push('### Bearer Token\n');
        auth.push('Include the JWT token in the Authorization header:\n');
        auth.push('```');
        auth.push('Authorization: Bearer <your-token>');
        auth.push('```\n');
      }

      if (schemes.apiKey) {
        auth.push('### API Key\n');
        auth.push('Include your API key in the X-API-Key header:\n');
        auth.push('```');
        auth.push('X-API-Key: <your-api-key>');
        auth.push('```\n');
      }

      if (schemes.oauth2) {
        auth.push('### OAuth 2.0\n');
        auth.push('Use OAuth 2.0 for authentication. See OAuth documentation for details.\n');
      }
    }

    return auth.join('\n');
  }

  /**
   * Build grouped endpoints by tag
   */
  buildGroupedEndpoints(routes) {
    const sections = [];
    const tags = this.getUniqueTags(routes);

    tags.forEach(tag => {
      sections.push(`### ${tag}\n`);

      const tagRoutes = routes.filter(route => {
        if (!route.tags || route.tags.length === 0) {
          return tag === 'Other';
        }
        return route.tags.includes(tag);
      });

      tagRoutes.forEach(route => {
        sections.push(this.buildEndpointSection(route));
      });
    });

    return sections.join('\n');
  }

  /**
   * Build endpoints list
   */
  buildEndpointsList(routes) {
    return routes.map(route => this.buildEndpointSection(route)).join('\n');
  }

  /**
   * Build individual endpoint section
   */
  buildEndpointSection(route) {
    const sections = [];

    // Title
    const title = route.summary || `${route.method.toUpperCase()} ${route.path}`;
    sections.push(`#### ${title}\n`);

    // Method and path
    sections.push('```');
    sections.push(`${route.method.toUpperCase()} ${route.path}`);
    sections.push('```\n');

    // Description
    if (route.description) {
      sections.push(`${route.description}\n`);
    }

    // Parameters
    if (route.params || route.query || route.headers) {
      sections.push('**Parameters:**\n');

      // Path parameters
      if (route.params) {
        sections.push('*Path Parameters:*\n');
        sections.push(this.buildParametersTable(route.params));
      }

      // Query parameters
      if (route.query) {
        sections.push('*Query Parameters:*\n');
        sections.push(this.buildParametersTable(route.query));
      }

      // Headers
      if (route.headers) {
        sections.push('*Headers:*\n');
        sections.push(this.buildParametersTable(route.headers));
      }
    }

    // Request body
    if (route.requestBody) {
      sections.push('**Request Body:**\n');
      sections.push(this.buildRequestBodySection(route.requestBody));
    }

    // Responses
    if (route.responses) {
      sections.push('**Responses:**\n');
      sections.push(this.buildResponsesSection(route.responses));
    }

    // Example
    if (this.options.includeExamples && route.example) {
      sections.push('**Example:**\n');
      sections.push(this.buildExampleSection(route));
    }

    sections.push('---\n');

    return sections.join('\n');
  }

  /**
   * Build parameters table
   */
  buildParametersTable(params) {
    const rows = ['| Name | Type | Required | Description |', '|------|------|----------|-------------|'];

    for (const [name, param] of Object.entries(params)) {
      const type = param.type || 'string';
      const required = param.required ? 'Yes' : 'No';
      const description = param.description || '-';

      rows.push(`| \`${name}\` | ${type} | ${required} | ${description} |`);
    }

    return rows.join('\n') + '\n';
  }

  /**
   * Build request body section
   */
  buildRequestBodySection(requestBody) {
    const sections = [];

    if (requestBody.description) {
      sections.push(requestBody.description + '\n');
    }

    if (requestBody.schema) {
      sections.push('```json');
      sections.push(this.schemaToExample(requestBody.schema));
      sections.push('```\n');
    }

    if (requestBody.example) {
      sections.push('**Example:**\n');
      sections.push('```json');
      sections.push(JSON.stringify(requestBody.example, null, 2));
      sections.push('```\n');
    }

    return sections.join('\n');
  }

  /**
   * Build responses section
   */
  buildResponsesSection(responses) {
    const sections = [];

    for (const [statusCode, response] of Object.entries(responses)) {
      sections.push(`*${statusCode} - ${response.description || 'Response'}*\n`);

      if (response.schema || response.content) {
        sections.push('```json');
        const schema = response.schema || response.content;
        sections.push(this.schemaToExample(schema));
        sections.push('```\n');
      }

      if (response.example) {
        sections.push('```json');
        sections.push(JSON.stringify(response.example, null, 2));
        sections.push('```\n');
      }
    }

    return sections.join('\n');
  }

  /**
   * Convert schema to example JSON
   */
  schemaToExample(schema, depth = 0) {
    if (depth > 5) return '...'; // Prevent infinite recursion

    if (!schema || typeof schema !== 'object') {
      return JSON.stringify({}, null, 2);
    }

    const example = {};

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        example[key] = this.getExampleValue(prop, depth + 1);
      }
    }

    return JSON.stringify(example, null, 2);
  }

  /**
   * Get example value for schema property
   */
  getExampleValue(prop, depth = 0) {
    if (prop.example !== undefined) {
      return prop.example;
    }

    if (prop.type === 'string') {
      return prop.format === 'email' ? 'user@example.com' : 'string';
    }
    if (prop.type === 'number' || prop.type === 'integer') {
      return 0;
    }
    if (prop.type === 'boolean') {
      return true;
    }
    if (prop.type === 'array') {
      const itemExample = prop.items ? this.getExampleValue(prop.items, depth + 1) : {};
      return [itemExample];
    }
    if (prop.type === 'object' || prop.properties) {
      if (depth > 3) return {};
      return JSON.parse(this.schemaToExample(prop, depth + 1));
    }

    return null;
  }

  /**
   * Build example section
   */
  buildExampleSection(route) {
    const sections = [];

    sections.push('**Request:**\n');
    sections.push('```bash');
    sections.push(this.buildCurlExample(route));
    sections.push('```\n');

    if (route.example && route.example.response) {
      sections.push('**Response:**\n');
      sections.push('```json');
      sections.push(JSON.stringify(route.example.response, null, 2));
      sections.push('```\n');
    }

    return sections.join('\n');
  }

  /**
   * Build curl example
   */
  buildCurlExample(route) {
    const parts = [`curl -X ${route.method.toUpperCase()}`];

    // Add headers
    parts.push(`  "${this.options.serverUrl || 'http://localhost:3000'}${route.path}"`);

    if (route.headers) {
      for (const [name, header] of Object.entries(route.headers)) {
        parts.push(`  -H "${name}: ${header.example || 'value'}"`);
      }
    }

    // Add content type for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(route.method.toLowerCase())) {
      parts.push(`  -H "Content-Type: application/json"`);

      if (route.requestBody && route.requestBody.example) {
        parts.push(`  -d '${JSON.stringify(route.requestBody.example)}'`);
      }
    }

    return parts.join(' \\\n');
  }

  /**
   * Build schemas section
   */
  buildSchemasSection(schemas) {
    const sections = ['## Schemas\n'];

    for (const [name, schema] of Object.entries(schemas)) {
      sections.push(`### ${name}\n`);

      if (schema.description) {
        sections.push(`${schema.description}\n`);
      }

      sections.push('```json');
      sections.push(this.schemaToExample(schema));
      sections.push('```\n');

      if (schema.properties) {
        sections.push('**Properties:**\n');
        sections.push(this.buildSchemaPropertiesTable(schema.properties, schema.required || []));
      }
    }

    return sections.join('\n');
  }

  /**
   * Build schema properties table
   */
  buildSchemaPropertiesTable(properties, required = []) {
    const rows = ['| Property | Type | Required | Description |', '|----------|------|----------|-------------|'];

    for (const [name, prop] of Object.entries(properties)) {
      const type = prop.type || 'object';
      const isRequired = required.includes(name) ? 'Yes' : 'No';
      const description = prop.description || '-';

      rows.push(`| \`${name}\` | ${type} | ${isRequired} | ${description} |`);
    }

    return rows.join('\n') + '\n';
  }

  /**
   * Build error codes section
   */
  buildErrorCodesSection() {
    return `## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format

All errors follow this format:

\`\`\`json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    // Additional error details (optional)
  }
}
\`\`\`
`;
  }

  /**
   * Generate README section for API
   */
  async generateReadmeSection(routes) {
    const sections = [];

    sections.push('## API Documentation\n');
    sections.push(`This project provides a RESTful API with ${routes.length} endpoints.\n`);

    // Quick start
    sections.push('### Quick Start\n');
    sections.push('```bash');
    sections.push('# Start the server');
    sections.push('npm start');
    sections.push('');
    sections.push('# API will be available at:');
    sections.push(`${this.options.serverUrl || 'http://localhost:3000'}`);
    sections.push('```\n');

    // Available endpoints
    sections.push('### Available Endpoints\n');

    const groupedRoutes = this.groupRoutesByTag(routes);
    for (const [tag, tagRoutes] of Object.entries(groupedRoutes)) {
      sections.push(`**${tag}**\n`);
      tagRoutes.forEach(route => {
        sections.push(`- \`${route.method.toUpperCase()} ${route.path}\` - ${route.summary || 'Endpoint'}`);
      });
      sections.push('');
    }

    sections.push(`\nFor complete API documentation, see [API.md](./docs/api/API.md)\n`);

    return sections.join('\n');
  }

  /**
   * Group routes by tag
   */
  groupRoutesByTag(routes) {
    const grouped = {};

    routes.forEach(route => {
      const tag = (route.tags && route.tags[0]) || 'Other';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(route);
    });

    return grouped;
  }
}

module.exports = MarkdownGenerator;
