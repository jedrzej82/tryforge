const { logger } = require('../../utils/logger');
const JSDocParser = require('./jsdoc-parser');

/**
 * Express.js Route Parser
 * Extracts routes from Express applications
 */
class ExpressParser {
  constructor(options = {}) {
    this.options = options;
    this.jsdocParser = new JSDocParser(options);
  }

  /**
   * Parse Express routes from file
   */
  async parse(filePath, content) {
    const routes = [];
    const schemas = {};

    try {
      // Extract JSDoc comments first
      const jsdocComments = this.jsdocParser.extractComments(content);

      // Parse route definitions
      const routePatterns = [
        // router.get('/path', handler)
        /(?:router|app)\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        // router.route('/path').get(handler)
        /(?:router|app)\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.(\w+)/g,
        // Express 5+ style: router[method]('/path', handler)
        /(?:router|app)\[['"`](get|post|put|patch|delete)['"`]\]\s*\(\s*['"`]([^'"`]+)['"`]/g
      ];

      for (const pattern of routePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const route = this.extractRouteInfo(match, content, jsdocComments);
          if (route) {
            routes.push(route);
          }
        }
      }

      // Extract validation schemas (Joi, Yup, Zod)
      const validationSchemas = this.extractValidationSchemas(content);
      Object.assign(schemas, validationSchemas);

      // Parse middleware
      const middlewares = this.extractMiddlewares(content);

      logger.debug(`Parsed ${routes.length} routes from ${filePath}`);

      return { routes, schemas, middlewares };

    } catch (error) {
      logger.error(`Error parsing Express file ${filePath}:`, error);
      return { routes, schemas };
    }
  }

  /**
   * Extract route information
   */
  extractRouteInfo(match, content, jsdocComments) {
    let method, path;

    // Handle different regex patterns
    if (match[1] && match[2]) {
      method = match[1].toLowerCase();
      path = match[2];
    } else if (match[3]) {
      path = match[1];
      method = match[3].toLowerCase();
    } else {
      return null;
    }

    // Find associated JSDoc comment
    const jsdoc = this.findAssociatedJSDoc(match.index, content, jsdocComments);

    // Build route object
    const route = {
      method,
      path: this.normalizePath(path),
      filePath: match.input
    };

    // Add JSDoc information if available
    if (jsdoc) {
      Object.assign(route, this.parseJSDocForRoute(jsdoc));
    }

    // Extract middleware
    const middleware = this.extractRouteMiddleware(match.index, content);
    if (middleware.length > 0) {
      route.middleware = middleware;
    }

    // Extract handler function to look for validation
    const handler = this.extractHandlerFunction(match.index, content);
    if (handler) {
      const validation = this.extractValidationFromHandler(handler);
      if (validation) {
        route.requestBody = validation.requestBody;
        route.params = validation.params;
        route.query = validation.query;
      }
    }

    // Infer default responses if not specified
    if (!route.responses) {
      route.responses = this.inferDefaultResponses(method);
    }

    return route;
  }

  /**
   * Normalize path to OpenAPI format
   */
  normalizePath(path) {
    // Convert :param to {param}
    return path.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * Find JSDoc comment associated with route
   */
  findAssociatedJSDoc(routeIndex, content, jsdocComments) {
    // Find the closest JSDoc comment before the route
    let closestComment = null;
    let closestDistance = Infinity;

    for (const comment of jsdocComments) {
      const distance = routeIndex - comment.end;
      if (distance > 0 && distance < closestDistance) {
        // Check if there's only whitespace between comment and route
        const between = content.substring(comment.end, routeIndex);
        if (/^\s*$/.test(between)) {
          closestComment = comment;
          closestDistance = distance;
        }
      }
    }

    return closestComment;
  }

  /**
   * Parse JSDoc for route information
   */
  parseJSDocForRoute(jsdoc) {
    const parsed = this.jsdocParser.parse(jsdoc.text);

    const route = {};

    // Summary and description
    if (parsed.summary) route.summary = parsed.summary;
    if (parsed.description) route.description = parsed.description;

    // Tags
    if (parsed.tags) {
      route.tags = parsed.tags.map(t => t.value || t.name);
    }

    // Parameters
    if (parsed.params) {
      route.params = {};
      route.query = {};

      parsed.params.forEach(param => {
        const paramInfo = {
          type: param.type || 'string',
          description: param.description,
          required: !param.optional
        };

        if (param.name.includes('.')) {
          // Nested parameter (e.g., body.email)
          const [location, name] = param.name.split('.');
          if (location === 'query') {
            route.query[name] = paramInfo;
          } else if (location === 'body') {
            if (!route.requestBody) {
              route.requestBody = { schema: { type: 'object', properties: {} } };
            }
            route.requestBody.schema.properties[name] = {
              type: paramInfo.type,
              description: paramInfo.description
            };
          } else {
            route.params[name] = paramInfo;
          }
        } else {
          // Assume path parameter
          route.params[param.name] = paramInfo;
        }
      });
    }

    // Responses
    if (parsed.returns || parsed.responses) {
      route.responses = {};

      if (parsed.returns) {
        route.responses['200'] = {
          description: parsed.returns.description || 'Successful response',
          schema: { type: parsed.returns.type || 'object' }
        };
      }

      if (parsed.responses) {
        parsed.responses.forEach(resp => {
          route.responses[resp.code || '200'] = {
            description: resp.description,
            schema: resp.schema
          };
        });
      }
    }

    // Examples
    if (parsed.example) {
      route.example = parsed.example;
    }

    // Deprecated
    if (parsed.deprecated) {
      route.deprecated = true;
    }

    return route;
  }

  /**
   * Extract route middleware
   */
  extractRouteMiddleware(routeIndex, content) {
    const middlewares = [];

    // Look for middleware in the route definition
    // Example: router.get('/path', authenticate, authorize('admin'), handler)
    const routeLine = this.extractLine(routeIndex, content);

    // Match function names between path and handler
    const middlewarePattern = /\(\s*['"`][^'"`]+['"`]\s*,\s*([^,\)]+)/g;
    let match;

    while ((match = middlewarePattern.exec(routeLine)) !== null) {
      const middleware = match[1].trim();
      // Skip if it looks like a handler function definition
      if (!middleware.startsWith('async') && !middleware.startsWith('function')) {
        middlewares.push(middleware);
      }
    }

    return middlewares;
  }

  /**
   * Extract handler function
   */
  extractHandlerFunction(routeIndex, content) {
    // Extract the handler function body
    const start = content.indexOf('(', routeIndex);
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let stringChar = '';
    let end = start;

    for (let i = start; i < content.length; i++) {
      const char = content[i];

      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && content[i - 1] !== '\\') {
        inString = false;
      } else if (!inString) {
        if (char === '(' || char === '{') depth++;
        if (char === ')' || char === '}') depth--;

        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    return content.substring(start, end + 1);
  }

  /**
   * Extract validation from handler
   */
  extractValidationFromHandler(handler) {
    const validation = {};

    // Look for Joi validation
    const joiPattern = /Joi\.object\(\{([^}]+)\}\)/g;
    let match = joiPattern.exec(handler);
    if (match) {
      validation.requestBody = this.parseJoiSchema(match[1]);
    }

    // Look for Yup validation
    const yupPattern = /yup\.object\(\{([^}]+)\}\)/g;
    match = yupPattern.exec(handler);
    if (match) {
      validation.requestBody = this.parseYupSchema(match[1]);
    }

    // Look for Zod validation
    const zodPattern = /z\.object\(\{([^}]+)\}\)/g;
    match = zodPattern.exec(handler);
    if (match) {
      validation.requestBody = this.parseZodSchema(match[1]);
    }

    return Object.keys(validation).length > 0 ? validation : null;
  }

  /**
   * Parse Joi schema
   */
  parseJoiSchema(schemaText) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    // Simple parsing - can be enhanced
    const fieldPattern = /(\w+):\s*Joi\.(\w+)\(\)/g;
    let match;

    while ((match = fieldPattern.exec(schemaText)) !== null) {
      const [, fieldName, type] = match;
      schema.properties[fieldName] = {
        type: this.mapValidationType(type)
      };

      if (schemaText.includes(`${fieldName}:`)) {
        if (schemaText.includes('.required()')) {
          schema.required.push(fieldName);
        }
      }
    }

    return { schema };
  }

  /**
   * Parse Yup schema
   */
  parseYupSchema(schemaText) {
    // Similar to Joi parsing
    return this.parseJoiSchema(schemaText.replace(/yup\./g, 'Joi.'));
  }

  /**
   * Parse Zod schema
   */
  parseZodSchema(schemaText) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    // Parse z.string(), z.number(), etc.
    const fieldPattern = /(\w+):\s*z\.(\w+)\(\)/g;
    let match;

    while ((match = fieldPattern.exec(schemaText)) !== null) {
      const [, fieldName, type] = match;
      schema.properties[fieldName] = {
        type: this.mapValidationType(type)
      };
      schema.required.push(fieldName); // Zod fields are required by default
    }

    return { schema };
  }

  /**
   * Map validation type to OpenAPI type
   */
  mapValidationType(type) {
    const mapping = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'string',
      array: 'array',
      object: 'object',
      email: 'string',
      url: 'string'
    };

    return mapping[type.toLowerCase()] || 'string';
  }

  /**
   * Extract validation schemas
   */
  extractValidationSchemas(content) {
    const schemas = {};

    // Extract Joi schemas
    const joiPattern = /const\s+(\w+Schema)\s*=\s*Joi\.object\(\{([^}]+)\}\)/g;
    let match;

    while ((match = joiPattern.exec(content)) !== null) {
      const [, name, schemaBody] = match;
      schemas[name] = this.parseJoiSchema(schemaBody).schema;
    }

    return schemas;
  }

  /**
   * Extract middlewares from file
   */
  extractMiddlewares(content) {
    const middlewares = [];

    // Look for common middleware patterns
    const patterns = [
      /(?:router|app)\.use\(([^)]+)\)/g,
      /function\s+(\w+)\s*\([^)]*req[^)]*res[^)]*next[^)]*\)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        middlewares.push({
          name: match[1].trim(),
          type: 'middleware'
        });
      }
    }

    return middlewares;
  }

  /**
   * Extract line from content at index
   */
  extractLine(index, content) {
    const start = content.lastIndexOf('\n', index) + 1;
    const end = content.indexOf('\n', index);
    return content.substring(start, end === -1 ? content.length : end);
  }

  /**
   * Infer default responses based on method
   */
  inferDefaultResponses(method) {
    const responses = {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    };

    if (method === 'post') {
      responses['201'] = {
        description: 'Resource created',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }

    if (method === 'delete') {
      responses['204'] = {
        description: 'Resource deleted'
      };
    }

    return responses;
  }
}

module.exports = ExpressParser;
