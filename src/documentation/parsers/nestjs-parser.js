const { logger } = require('../../utils/logger');
const TSDocParser = require('./tsdoc-parser');

/**
 * NestJS Route Parser
 * Extracts routes from NestJS controllers
 */
class NestJSParser {
  constructor(options = {}) {
    this.options = options;
    this.tsdocParser = new TSDocParser(options);
  }

  /**
   * Parse NestJS controller file
   */
  async parse(filePath, content) {
    const routes = [];
    const schemas = {};

    try {
      // Extract controller decorator
      const controllerInfo = this.extractControllerInfo(content);

      // Extract route methods
      const methods = this.extractRouteMethods(content);

      // Process each method
      for (const method of methods) {
        const route = this.buildRoute(method, controllerInfo);
        if (route) {
          routes.push(route);
        }
      }

      // Extract DTOs (Data Transfer Objects)
      const dtos = this.extractDTOs(content);
      Object.assign(schemas, dtos);

      logger.debug(`Parsed ${routes.length} routes from ${filePath}`);

      return { routes, schemas };

    } catch (error) {
      logger.error(`Error parsing NestJS file ${filePath}:`, error);
      return { routes, schemas };
    }
  }

  /**
   * Extract controller information
   */
  extractControllerInfo(content) {
    const info = {
      path: '',
      tags: []
    };

    // Extract @Controller decorator
    const controllerPattern = /@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/;
    const match = content.match(controllerPattern);

    if (match) {
      info.path = match[1];
    }

    // Extract @ApiTags decorator
    const apiTagsPattern = /@ApiTags\(\s*['"`]([^'"`]*)['"`]\s*\)/;
    const tagsMatch = content.match(apiTagsPattern);

    if (tagsMatch) {
      info.tags = tagsMatch[1].split(',').map(t => t.trim());
    }

    return info;
  }

  /**
   * Extract route methods from controller
   */
  extractRouteMethods(content) {
    const methods = [];

    // Pattern to match route decorators and methods
    const methodPattern = /@(Get|Post|Put|Patch|Delete|Head|Options)\s*(?:\(\s*['"`]([^'"`]*)['"`]\s*\))?\s*(?:@[\w()'"`,.\s]*)*\s*(?:async\s+)?(\w+)\s*\(/g;

    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      const [fullMatch, httpMethod, path, methodName] = match;

      // Get the position to extract more details
      const startPos = match.index;

      // Extract all decorators for this method
      const decorators = this.extractMethodDecorators(content, startPos);

      // Extract method signature and body
      const methodBody = this.extractMethodBody(content, match.index);

      methods.push({
        httpMethod: httpMethod.toLowerCase(),
        path: path || '',
        name: methodName,
        decorators,
        body: methodBody,
        position: startPos
      });
    }

    return methods;
  }

  /**
   * Extract decorators for a method
   */
  extractMethodDecorators(content, methodPos) {
    const decorators = [];

    // Look backwards from method position to find decorators
    const beforeMethod = content.substring(Math.max(0, methodPos - 1000), methodPos);

    // Find the last occurrence of a non-decorator line
    const lines = beforeMethod.split('\n').reverse();
    const decoratorLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@')) {
        decoratorLines.unshift(trimmed);
      } else if (trimmed && !trimmed.startsWith('//')) {
        break;
      }
    }

    // Parse each decorator
    for (const line of decoratorLines) {
      const parsed = this.parseDecorator(line);
      if (parsed) {
        decorators.push(parsed);
      }
    }

    return decorators;
  }

  /**
   * Parse decorator
   */
  parseDecorator(decoratorText) {
    // @DecoratorName(args)
    const pattern = /@(\w+)(?:\(([^)]*)\))?/;
    const match = decoratorText.match(pattern);

    if (!match) return null;

    const [, name, args] = match;

    return {
      name,
      args: args ? this.parseDecoratorArgs(args) : null
    };
  }

  /**
   * Parse decorator arguments
   */
  parseDecoratorArgs(argsText) {
    // Try to parse as JSON-like object
    try {
      // Remove quotes and clean up
      const cleaned = argsText.replace(/'/g, '"');

      // Try to parse as JSON
      if (cleaned.startsWith('{')) {
        return JSON.parse(cleaned);
      }

      // Single value
      return cleaned.replace(/['"]/g, '');
    } catch (e) {
      return argsText;
    }
  }

  /**
   * Extract method body
   */
  extractMethodBody(content, startPos) {
    // Find opening brace
    const openBrace = content.indexOf('{', startPos);
    if (openBrace === -1) return '';

    let depth = 0;
    let i = openBrace;

    while (i < content.length) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') depth--;

      if (depth === 0) {
        return content.substring(openBrace, i + 1);
      }

      i++;
    }

    return '';
  }

  /**
   * Build route object from method
   */
  buildRoute(method, controllerInfo) {
    const route = {
      method: method.httpMethod,
      path: this.buildFullPath(controllerInfo.path, method.path),
      name: method.name,
      tags: [...controllerInfo.tags]
    };

    // Process decorators
    for (const decorator of method.decorators) {
      this.processDecorator(decorator, route);
    }

    // Extract parameters from method signature
    const params = this.extractMethodParameters(method.body);
    if (params.length > 0) {
      this.processParameters(params, route);
    }

    // Set default responses if not specified
    if (!route.responses) {
      route.responses = this.getDefaultResponses(method.httpMethod);
    }

    return route;
  }

  /**
   * Build full path from controller and method paths
   */
  buildFullPath(controllerPath, methodPath) {
    const parts = [];

    if (controllerPath) {
      parts.push(controllerPath.replace(/^\/|\/$/g, ''));
    }

    if (methodPath) {
      parts.push(methodPath.replace(/^\/|\/$/g, ''));
    }

    const fullPath = '/' + parts.join('/');

    // Convert :param to {param}
    return fullPath.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * Process decorator and add to route
   */
  processDecorator(decorator, route) {
    switch (decorator.name) {
      case 'ApiOperation':
        if (decorator.args && typeof decorator.args === 'object') {
          route.summary = decorator.args.summary;
          route.description = decorator.args.description;
        }
        break;

      case 'ApiResponse':
      case 'ApiOkResponse':
      case 'ApiCreatedResponse':
      case 'ApiBadRequestResponse':
      case 'ApiNotFoundResponse':
        this.processApiResponse(decorator, route);
        break;

      case 'ApiTags':
        if (typeof decorator.args === 'string') {
          route.tags.push(decorator.args);
        }
        break;

      case 'ApiParam':
        if (!route.params) route.params = {};
        this.processApiParam(decorator, route.params);
        break;

      case 'ApiQuery':
        if (!route.query) route.query = {};
        this.processApiQuery(decorator, route.query);
        break;

      case 'ApiBody':
        route.requestBody = this.processApiBody(decorator);
        break;

      case 'ApiHeader':
        if (!route.headers) route.headers = {};
        this.processApiHeader(decorator, route.headers);
        break;

      case 'ApiBearerAuth':
      case 'ApiBasicAuth':
      case 'ApiApiKey':
        if (!route.security) route.security = [];
        route.security.push(this.getSecurityScheme(decorator.name));
        break;

      case 'ApiProperty':
        // Used in DTOs, handled separately
        break;
    }
  }

  /**
   * Process API response decorator
   */
  processApiResponse(decorator, route) {
    if (!route.responses) route.responses = {};

    const statusCode = this.getStatusCodeFromDecorator(decorator.name);
    const args = decorator.args || {};

    route.responses[statusCode] = {
      description: args.description || this.getDefaultDescription(statusCode),
      schema: args.type ? { $ref: `#/components/schemas/${args.type}` } : undefined
    };
  }

  /**
   * Get status code from decorator name
   */
  getStatusCodeFromDecorator(name) {
    const mapping = {
      'ApiOkResponse': '200',
      'ApiCreatedResponse': '201',
      'ApiAcceptedResponse': '202',
      'ApiNoContentResponse': '204',
      'ApiBadRequestResponse': '400',
      'ApiUnauthorizedResponse': '401',
      'ApiForbiddenResponse': '403',
      'ApiNotFoundResponse': '404',
      'ApiConflictResponse': '409',
      'ApiInternalServerErrorResponse': '500'
    };

    return mapping[name] || '200';
  }

  /**
   * Get default description for status code
   */
  getDefaultDescription(statusCode) {
    const descriptions = {
      '200': 'Successful response',
      '201': 'Resource created',
      '204': 'No content',
      '400': 'Bad request',
      '401': 'Unauthorized',
      '403': 'Forbidden',
      '404': 'Not found',
      '500': 'Internal server error'
    };

    return descriptions[statusCode] || 'Response';
  }

  /**
   * Process API param decorator
   */
  processApiParam(decorator, params) {
    const args = decorator.args || {};

    params[args.name] = {
      type: args.type || 'string',
      description: args.description,
      required: args.required !== false
    };
  }

  /**
   * Process API query decorator
   */
  processApiQuery(decorator, query) {
    const args = decorator.args || {};

    query[args.name] = {
      type: args.type || 'string',
      description: args.description,
      required: args.required || false
    };
  }

  /**
   * Process API body decorator
   */
  processApiBody(decorator) {
    const args = decorator.args || {};

    return {
      description: args.description,
      schema: args.type ? { $ref: `#/components/schemas/${args.type}` } : { type: 'object' },
      required: args.required !== false
    };
  }

  /**
   * Process API header decorator
   */
  processApiHeader(decorator, headers) {
    const args = decorator.args || {};

    headers[args.name] = {
      type: 'string',
      description: args.description,
      required: args.required || false
    };
  }

  /**
   * Get security scheme from decorator
   */
  getSecurityScheme(decoratorName) {
    const mapping = {
      'ApiBearerAuth': { bearerAuth: [] },
      'ApiBasicAuth': { basicAuth: [] },
      'ApiApiKey': { apiKey: [] }
    };

    return mapping[decoratorName] || {};
  }

  /**
   * Extract method parameters
   */
  extractMethodParameters(methodBody) {
    const params = [];

    // Find method signature
    const signaturePattern = /\(([^)]*)\)/;
    const match = methodBody.match(signaturePattern);

    if (!match) return params;

    const paramsText = match[1];

    // Parse each parameter
    // @Param('id') id: string, @Body() dto: CreateUserDto, @Query() query: QueryDto
    const paramPattern = /@(\w+)\(['"]?(\w+)?['"]?\)\s+(\w+):\s*(\w+)/g;

    let paramMatch;
    while ((paramMatch = paramPattern.exec(paramsText)) !== null) {
      const [, decorator, decoratorArg, paramName, paramType] = paramMatch;

      params.push({
        decorator,
        decoratorArg,
        name: paramName,
        type: paramType
      });
    }

    return params;
  }

  /**
   * Process parameters and add to route
   */
  processParameters(params, route) {
    for (const param of params) {
      switch (param.decorator) {
        case 'Param':
          if (!route.params) route.params = {};
          route.params[param.decoratorArg || param.name] = {
            type: this.mapType(param.type),
            description: `Path parameter: ${param.name}`
          };
          break;

        case 'Query':
          if (!route.query) route.query = {};
          if (param.decoratorArg) {
            route.query[param.decoratorArg] = {
              type: this.mapType(param.type),
              description: `Query parameter: ${param.name}`
            };
          }
          break;

        case 'Body':
          if (!route.requestBody) {
            route.requestBody = {
              schema: param.type ? { $ref: `#/components/schemas/${param.type}` } : { type: 'object' }
            };
          }
          break;

        case 'Headers':
        case 'Header':
          if (!route.headers) route.headers = {};
          if (param.decoratorArg) {
            route.headers[param.decoratorArg] = {
              type: 'string',
              description: `Header: ${param.name}`
            };
          }
          break;
      }
    }
  }

  /**
   * Map TypeScript type to OpenAPI type
   */
  mapType(type) {
    const mapping = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'Date': 'string',
      'any': 'object'
    };

    return mapping[type] || 'string';
  }

  /**
   * Get default responses for HTTP method
   */
  getDefaultResponses(method) {
    const responses = {
      '200': {
        description: 'Successful response'
      }
    };

    if (method === 'post') {
      responses['201'] = {
        description: 'Resource created'
      };
    }

    if (method === 'delete') {
      responses['204'] = {
        description: 'Resource deleted'
      };
    }

    return responses;
  }

  /**
   * Extract DTOs from file
   */
  extractDTOs(content) {
    const dtos = {};

    // Find classes that look like DTOs
    const classPattern = /export\s+class\s+(\w+(?:Dto|DTO))\s*{([^}]*)}/g;

    let match;
    while ((match = classPattern.exec(content)) !== null) {
      const [, className, classBody] = match;

      const schema = this.parseDTOClass(classBody);
      if (schema) {
        dtos[className] = schema;
      }
    }

    return dtos;
  }

  /**
   * Parse DTO class to schema
   */
  parseDTOClass(classBody) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    // Parse properties with @ApiProperty decorator
    const propertyPattern = /@ApiProperty\((.*?)\)\s+(\w+)(?:\?)?:\s*(\w+(?:\[\])?)/g;

    let match;
    while ((match = propertyPattern.exec(classBody)) !== null) {
      const [, decorator, propertyName, propertyType] = match;

      const isOptional = classBody.includes(`${propertyName}?:`);

      schema.properties[propertyName] = {
        type: this.mapType(propertyType.replace('[]', '')),
        ...this.parseApiPropertyDecorator(decorator)
      };

      if (propertyType.includes('[]')) {
        schema.properties[propertyName] = {
          type: 'array',
          items: { type: this.mapType(propertyType.replace('[]', '')) }
        };
      }

      if (!isOptional) {
        schema.required.push(propertyName);
      }
    }

    return Object.keys(schema.properties).length > 0 ? schema : null;
  }

  /**
   * Parse @ApiProperty decorator arguments
   */
  parseApiPropertyDecorator(args) {
    const props = {};

    try {
      // Try to parse as object
      const cleaned = args.replace(/'/g, '"');
      const parsed = JSON.parse(cleaned);

      if (parsed.description) props.description = parsed.description;
      if (parsed.example !== undefined) props.example = parsed.example;
      if (parsed.minimum !== undefined) props.minimum = parsed.minimum;
      if (parsed.maximum !== undefined) props.maximum = parsed.maximum;

    } catch (e) {
      // Couldn't parse, ignore
    }

    return props;
  }
}

module.exports = NestJSParser;
