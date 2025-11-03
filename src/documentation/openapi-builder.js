const { logger } = require('../utils/logger');

/**
 * OpenAPI 3.0 Specification Builder
 * Builds OpenAPI specs from parsed routes and schemas
 */
class OpenAPIBuilder {
  constructor(options = {}) {
    this.options = {
      apiName: options.apiName || 'API Documentation',
      apiVersion: options.apiVersion || '1.0.0',
      apiDescription: options.apiDescription || 'Auto-generated API documentation',
      serverUrl: options.serverUrl || 'http://localhost:3000',
      contactEmail: options.contactEmail,
      licenseName: options.licenseName || 'MIT',
      licenseUrl: options.licenseUrl,
      securitySchemes: options.securitySchemes || this.getDefaultSecuritySchemes(),
      ...options
    };
  }

  /**
   * Build complete OpenAPI 3.0 specification
   */
  async build(routes, schemas = {}) {
    logger.debug('Building OpenAPI specification...');

    const spec = {
      openapi: '3.0.3',
      info: this.buildInfo(),
      servers: this.buildServers(),
      paths: this.buildPaths(routes),
      components: {
        schemas: this.buildSchemas(schemas),
        securitySchemes: this.options.securitySchemes,
        responses: this.buildCommonResponses(),
        parameters: this.buildCommonParameters()
      },
      tags: this.buildTags(routes),
      security: this.buildGlobalSecurity()
    };

    // Remove empty sections
    if (Object.keys(spec.components.schemas).length === 0) {
      delete spec.components.schemas;
    }
    if (Object.keys(spec.components.securitySchemes).length === 0) {
      delete spec.components.securitySchemes;
      delete spec.security;
    }

    logger.debug('OpenAPI specification built successfully');
    return spec;
  }

  /**
   * Build info section
   */
  buildInfo() {
    const info = {
      title: this.options.apiName,
      version: this.options.apiVersion,
      description: this.options.apiDescription
    };

    if (this.options.contactEmail) {
      info.contact = {
        email: this.options.contactEmail
      };
    }

    if (this.options.licenseName) {
      info.license = {
        name: this.options.licenseName
      };
      if (this.options.licenseUrl) {
        info.license.url = this.options.licenseUrl;
      }
    }

    return info;
  }

  /**
   * Build servers section
   */
  buildServers() {
    const servers = [];

    if (Array.isArray(this.options.serverUrl)) {
      servers.push(...this.options.serverUrl.map(url => ({
        url,
        description: this.getServerDescription(url)
      })));
    } else {
      servers.push({
        url: this.options.serverUrl,
        description: 'API Server'
      });
    }

    return servers;
  }

  /**
   * Get server description from URL
   */
  getServerDescription(url) {
    if (url.includes('localhost')) return 'Development Server';
    if (url.includes('staging')) return 'Staging Server';
    if (url.includes('prod')) return 'Production Server';
    return 'API Server';
  }

  /**
   * Build paths section from routes
   */
  buildPaths(routes) {
    const paths = {};

    for (const route of routes) {
      const path = this.normalizePath(route.path);

      if (!paths[path]) {
        paths[path] = {};
      }

      const method = route.method.toLowerCase();
      paths[path][method] = this.buildOperation(route);
    }

    return paths;
  }

  /**
   * Normalize path to OpenAPI format
   */
  normalizePath(path) {
    // Convert :param to {param}
    return path.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * Build operation object for a route
   */
  buildOperation(route) {
    const operation = {
      summary: route.summary || route.name,
      operationId: route.operationId || this.generateOperationId(route),
      tags: route.tags || ['Default']
    };

    if (route.description) {
      operation.description = route.description;
    }

    if (route.deprecated) {
      operation.deprecated = true;
    }

    // Parameters (path, query, header)
    const parameters = this.buildParameters(route);
    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Request body
    if (route.requestBody) {
      operation.requestBody = this.buildRequestBody(route.requestBody);
    }

    // Responses
    operation.responses = this.buildResponses(route);

    // Security
    if (route.security) {
      operation.security = route.security;
    }

    return operation;
  }

  /**
   * Generate operation ID from route
   */
  generateOperationId(route) {
    const method = route.method.toLowerCase();
    const pathParts = route.path
      .split('/')
      .filter(Boolean)
      .map(part => part.replace(/[{}:]/g, ''))
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    return method + pathParts;
  }

  /**
   * Build parameters array
   */
  buildParameters(route) {
    const parameters = [];

    // Path parameters
    if (route.params) {
      for (const [name, param] of Object.entries(route.params)) {
        parameters.push({
          name,
          in: 'path',
          required: true,
          description: param.description || `${name} parameter`,
          schema: {
            type: param.type || 'string',
            ...param.schema
          },
          example: param.example
        });
      }
    }

    // Query parameters
    if (route.query) {
      for (const [name, param] of Object.entries(route.query)) {
        parameters.push({
          name,
          in: 'query',
          required: param.required || false,
          description: param.description || `${name} query parameter`,
          schema: {
            type: param.type || 'string',
            ...param.schema
          },
          example: param.example
        });
      }
    }

    // Header parameters
    if (route.headers) {
      for (const [name, param] of Object.entries(route.headers)) {
        parameters.push({
          name,
          in: 'header',
          required: param.required || false,
          description: param.description || `${name} header`,
          schema: {
            type: param.type || 'string',
            ...param.schema
          }
        });
      }
    }

    return parameters;
  }

  /**
   * Build request body object
   */
  buildRequestBody(requestBody) {
    const body = {
      required: requestBody.required !== false,
      content: {}
    };

    if (requestBody.description) {
      body.description = requestBody.description;
    }

    // Default to application/json
    const contentType = requestBody.contentType || 'application/json';

    body.content[contentType] = {
      schema: requestBody.schema || { type: 'object' }
    };

    // Add examples
    if (requestBody.example) {
      body.content[contentType].example = requestBody.example;
    }

    if (requestBody.examples) {
      body.content[contentType].examples = requestBody.examples;
    }

    return body;
  }

  /**
   * Build responses object
   */
  buildResponses(route) {
    const responses = {};

    // Success responses
    if (route.responses) {
      for (const [statusCode, response] of Object.entries(route.responses)) {
        responses[statusCode] = this.buildResponse(response);
      }
    } else {
      // Default 200 response
      responses['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      };
    }

    // Add common error responses
    if (!responses['400']) {
      responses['400'] = { $ref: '#/components/responses/BadRequest' };
    }
    if (!responses['401'] && route.security) {
      responses['401'] = { $ref: '#/components/responses/Unauthorized' };
    }
    if (!responses['500']) {
      responses['500'] = { $ref: '#/components/responses/InternalServerError' };
    }

    return responses;
  }

  /**
   * Build individual response object
   */
  buildResponse(response) {
    const resp = {
      description: response.description || 'Successful response'
    };

    if (response.schema || response.content) {
      resp.content = {
        'application/json': {
          schema: response.schema || response.content
        }
      };

      if (response.example) {
        resp.content['application/json'].example = response.example;
      }
    }

    if (response.headers) {
      resp.headers = response.headers;
    }

    return resp;
  }

  /**
   * Build schemas section
   */
  buildSchemas(schemas) {
    const openApiSchemas = {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (typeof schema === 'object') {
        openApiSchemas[name] = this.normalizeSchema(schema);
      }
    }

    return openApiSchemas;
  }

  /**
   * Normalize schema to OpenAPI format
   */
  normalizeSchema(schema) {
    // If already valid OpenAPI schema, return as-is
    if (schema.type || schema.$ref || schema.oneOf || schema.anyOf) {
      return schema;
    }

    // Convert TypeScript-like schema to OpenAPI
    const normalized = {
      type: 'object',
      properties: {},
      required: []
    };

    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        // Simple type definition
        normalized.properties[key] = { type: value };
      } else if (typeof value === 'object') {
        if (value.type) {
          normalized.properties[key] = value;
        } else {
          // Nested object
          normalized.properties[key] = this.normalizeSchema(value);
        }

        if (value.required) {
          normalized.required.push(key);
        }
      }
    }

    if (normalized.required.length === 0) {
      delete normalized.required;
    }

    return normalized;
  }

  /**
   * Build common responses
   */
  buildCommonResponses() {
    return {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Bad Request'
                },
                message: {
                  type: 'string',
                  example: 'Invalid request parameters'
                }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Unauthorized'
                },
                message: {
                  type: 'string',
                  example: 'Authentication required'
                }
              }
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Forbidden'
                },
                message: {
                  type: 'string',
                  example: 'Insufficient permissions'
                }
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Not Found'
                },
                message: {
                  type: 'string',
                  example: 'Resource not found'
                }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Internal Server Error'
                },
                message: {
                  type: 'string',
                  example: 'An unexpected error occurred'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Build common parameters
   */
  buildCommonParameters() {
    return {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and order (e.g., "name:asc")',
        schema: {
          type: 'string'
        }
      }
    };
  }

  /**
   * Build tags array
   */
  buildTags(routes) {
    const tagSet = new Set();

    for (const route of routes) {
      if (route.tags) {
        route.tags.forEach(tag => tagSet.add(tag));
      }
    }

    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: `${tag} endpoints`
    }));
  }

  /**
   * Build global security
   */
  buildGlobalSecurity() {
    if (Object.keys(this.options.securitySchemes).length === 0) {
      return undefined;
    }

    // Apply first security scheme globally by default
    const firstScheme = Object.keys(this.options.securitySchemes)[0];
    return [{ [firstScheme]: [] }];
  }

  /**
   * Get default security schemes
   */
  getDefaultSecuritySchemes() {
    return {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication'
      }
    };
  }

  /**
   * Add custom security scheme
   */
  addSecurityScheme(name, scheme) {
    this.options.securitySchemes[name] = scheme;
  }

  /**
   * Remove security scheme
   */
  removeSecurityScheme(name) {
    delete this.options.securitySchemes[name];
  }
}

module.exports = OpenAPIBuilder;
