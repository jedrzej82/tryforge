const { logger } = require('../../utils/logger');

/**
 * FastAPI Parser
 * Extracts routes from FastAPI Python applications
 */
class FastAPIParser {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Parse FastAPI routes from Python file
   */
  async parse(filePath, content) {
    const routes = [];
    const schemas = {};

    try {
      // Extract route decorators and functions
      const routePattern = /@(app|router)\.(get|post|put|patch|delete|head|options)\s*\(\s*["']([^"']+)["']/g;

      let match;
      while ((match = routePattern.exec(content)) !== null) {
        const [, decorator, method, path] = match;

        // Extract route function
        const routeInfo = this.extractRouteFunction(content, match.index);

        if (routeInfo) {
          const route = {
            method: method.toLowerCase(),
            path: this.normalizePath(path),
            name: routeInfo.name,
            description: routeInfo.docstring,
            ...routeInfo.details
          };

          routes.push(route);
        }
      }

      // Extract Pydantic models
      const models = this.extractPydanticModels(content);
      Object.assign(schemas, models);

      logger.debug(`Parsed ${routes.length} routes from ${filePath}`);

      return { routes, schemas };

    } catch (error) {
      logger.error(`Error parsing FastAPI file ${filePath}:`, error);
      return { routes, schemas };
    }
  }

  /**
   * Normalize path to OpenAPI format
   */
  normalizePath(path) {
    // FastAPI already uses {param} format
    return path;
  }

  /**
   * Extract route function after decorator
   */
  extractRouteFunction(content, decoratorPos) {
    // Find the function definition after the decorator
    const functionPattern = /(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/;

    const afterDecorator = content.substring(decoratorPos);
    const match = functionPattern.exec(afterDecorator);

    if (!match) return null;

    const [, functionName, params, returnType] = match;

    // Extract function body for docstring
    const bodyStart = match.index + match[0].length;
    const docstring = this.extractDocstring(afterDecorator, bodyStart);

    // Parse parameters
    const parsedParams = this.parseParameters(params);

    // Parse response type
    const responseType = returnType ? returnType.trim() : null;

    return {
      name: functionName,
      docstring: docstring ? this.parseDocstring(docstring) : null,
      params: parsedParams,
      returnType: responseType,
      details: this.buildRouteDetails(parsedParams, responseType, docstring)
    };
  }

  /**
   * Extract Python docstring
   */
  extractDocstring(content, startPos) {
    const tripleQuote = content.indexOf('"""', startPos);
    const tripleSingle = content.indexOf("'''", startPos);

    let quotePos = -1;
    let quoteType = '';

    if (tripleQuote !== -1 && (tripleSingle === -1 || tripleQuote < tripleSingle)) {
      quotePos = tripleQuote;
      quoteType = '"""';
    } else if (tripleSingle !== -1) {
      quotePos = tripleSingle;
      quoteType = "'''";
    }

    if (quotePos === -1) return null;

    const endQuote = content.indexOf(quoteType, quotePos + 3);
    if (endQuote === -1) return null;

    return content.substring(quotePos + 3, endQuote).trim();
  }

  /**
   * Parse Python docstring
   */
  parseDocstring(docstring) {
    const lines = docstring.split('\n').map(l => l.trim());

    let description = '';
    let currentSection = 'description';
    const sections = {
      description: [],
      args: [],
      returns: null,
      raises: []
    };

    for (const line of lines) {
      if (line.startsWith('Args:')) {
        currentSection = 'args';
        continue;
      } else if (line.startsWith('Returns:')) {
        currentSection = 'returns';
        continue;
      } else if (line.startsWith('Raises:')) {
        currentSection = 'raises';
        continue;
      }

      if (currentSection === 'description') {
        sections.description.push(line);
      } else if (currentSection === 'args' && line) {
        sections.args.push(line);
      } else if (currentSection === 'returns' && line) {
        sections.returns = line;
      } else if (currentSection === 'raises' && line) {
        sections.raises.push(line);
      }
    }

    return {
      description: sections.description.join(' ').trim(),
      args: sections.args,
      returns: sections.returns,
      raises: sections.raises
    };
  }

  /**
   * Parse function parameters
   */
  parseParameters(paramsString) {
    const params = [];

    if (!paramsString.trim()) return params;

    // Split by comma, but not commas inside brackets
    const paramsList = this.smartSplit(paramsString, ',');

    for (const param of paramsList) {
      const parsed = this.parseParameter(param.trim());
      if (parsed) {
        params.push(parsed);
      }
    }

    return params;
  }

  /**
   * Parse individual parameter
   */
  parseParameter(paramString) {
    // Handle different FastAPI parameter types
    // Examples:
    // - user_id: int
    // - user: User = Body(...)
    // - token: str = Header(None)
    // - q: Optional[str] = Query(None)

    const pattern = /(\w+)\s*:\s*([^=]+)(?:\s*=\s*(.+))?/;
    const match = paramString.match(pattern);

    if (!match) return null;

    const [, name, type, defaultValue] = match;

    const param = {
      name,
      type: type.trim(),
      required: !defaultValue || defaultValue.includes('...')
    };

    // Determine parameter location
    if (defaultValue) {
      if (defaultValue.includes('Path(')) {
        param.in = 'path';
      } else if (defaultValue.includes('Query(')) {
        param.in = 'query';
      } else if (defaultValue.includes('Header(')) {
        param.in = 'header';
      } else if (defaultValue.includes('Body(')) {
        param.in = 'body';
      } else if (defaultValue.includes('Form(')) {
        param.in = 'formData';
      } else {
        param.in = 'query';
      }
    } else {
      // Default to query for simple parameters
      param.in = 'query';
    }

    // Extract description from default value
    const descMatch = defaultValue ? defaultValue.match(/description=["']([^"']+)["']/) : null;
    if (descMatch) {
      param.description = descMatch[1];
    }

    return param;
  }

  /**
   * Build route details from parsed information
   */
  buildRouteDetails(params, returnType, docstring) {
    const details = {};

    // Group parameters by location
    const pathParams = {};
    const queryParams = {};
    const headerParams = {};
    let bodyParam = null;

    for (const param of params) {
      const paramInfo = {
        type: this.mapPythonType(param.type),
        description: param.description || '',
        required: param.required
      };

      if (param.in === 'path') {
        pathParams[param.name] = paramInfo;
      } else if (param.in === 'query') {
        queryParams[param.name] = paramInfo;
      } else if (param.in === 'header') {
        headerParams[param.name] = paramInfo;
      } else if (param.in === 'body') {
        bodyParam = {
          schema: this.isPydanticModel(param.type)
            ? { $ref: `#/components/schemas/${param.type}` }
            : { type: this.mapPythonType(param.type) },
          required: param.required
        };
      }
    }

    if (Object.keys(pathParams).length > 0) {
      details.params = pathParams;
    }

    if (Object.keys(queryParams).length > 0) {
      details.query = queryParams;
    }

    if (Object.keys(headerParams).length > 0) {
      details.headers = headerParams;
    }

    if (bodyParam) {
      details.requestBody = bodyParam;
    }

    // Add response information
    if (returnType) {
      details.responses = {
        '200': {
          description: docstring?.returns || 'Successful response',
          schema: this.isPydanticModel(returnType)
            ? { $ref: `#/components/schemas/${returnType}` }
            : { type: this.mapPythonType(returnType) }
        }
      };
    }

    // Add error responses from docstring
    if (docstring?.raises && docstring.raises.length > 0) {
      if (!details.responses) details.responses = {};

      for (const raise of docstring.raises) {
        const statusCode = this.extractStatusCode(raise);
        if (statusCode) {
          details.responses[statusCode] = {
            description: raise
          };
        }
      }
    }

    return details;
  }

  /**
   * Extract status code from error description
   */
  extractStatusCode(errorDesc) {
    // Look for HTTP status codes
    if (errorDesc.includes('404') || errorDesc.toLowerCase().includes('not found')) {
      return '404';
    }
    if (errorDesc.includes('400') || errorDesc.toLowerCase().includes('bad request')) {
      return '400';
    }
    if (errorDesc.includes('401') || errorDesc.toLowerCase().includes('unauthorized')) {
      return '401';
    }
    if (errorDesc.includes('403') || errorDesc.toLowerCase().includes('forbidden')) {
      return '403';
    }

    return '500'; // Default to internal server error
  }

  /**
   * Map Python type to OpenAPI type
   */
  mapPythonType(pythonType) {
    // Remove Optional[] wrapper
    let type = pythonType.replace(/Optional\[(.*)\]/, '$1');

    // Remove List[] wrapper
    if (type.startsWith('List[') || type.startsWith('list[')) {
      return 'array';
    }

    // Remove Dict[] wrapper
    if (type.startsWith('Dict[') || type.startsWith('dict[')) {
      return 'object';
    }

    const mapping = {
      'str': 'string',
      'int': 'integer',
      'float': 'number',
      'bool': 'boolean',
      'datetime': 'string',
      'date': 'string',
      'time': 'string',
      'Any': 'object',
      'dict': 'object',
      'list': 'array'
    };

    return mapping[type] || 'string';
  }

  /**
   * Check if type is a Pydantic model
   */
  isPydanticModel(type) {
    // Remove wrappers
    const clean = type.replace(/Optional\[(.*)\]/, '$1').replace(/List\[(.*)\]/, '$1');

    // Check if it's a custom type (starts with uppercase)
    return /^[A-Z]/.test(clean);
  }

  /**
   * Extract Pydantic models from content
   */
  extractPydanticModels(content) {
    const models = {};

    // Find classes that inherit from BaseModel
    const classPattern = /class\s+(\w+)\s*\(\s*BaseModel\s*\)\s*:\s*([\s\S]*?)(?=\nclass|\n@|\Z)/g;

    let match;
    while ((match = classPattern.exec(content)) !== null) {
      const [, className, classBody] = match;

      const schema = this.parsePydanticModel(classBody);
      if (schema) {
        models[className] = schema;
      }
    }

    return models;
  }

  /**
   * Parse Pydantic model class
   */
  parsePydanticModel(classBody) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    // Parse field definitions
    // Example: name: str = Field(description="User name")
    const fieldPattern = /(\w+)\s*:\s*([^=\n]+)(?:\s*=\s*Field\(([^)]*)\))?/g;

    let match;
    while ((match = fieldPattern.exec(classBody)) !== null) {
      const [, fieldName, fieldType, fieldConfig] = match;

      const type = this.mapPythonType(fieldType.trim());
      const isOptional = fieldType.includes('Optional');

      schema.properties[fieldName] = {
        type,
        ...this.parseFieldConfig(fieldConfig)
      };

      if (!isOptional && !fieldConfig?.includes('default')) {
        schema.required.push(fieldName);
      }
    }

    return Object.keys(schema.properties).length > 0 ? schema : null;
  }

  /**
   * Parse Field() configuration
   */
  parseFieldConfig(configString) {
    const config = {};

    if (!configString) return config;

    // Extract description
    const descMatch = configString.match(/description=["']([^"']+)["']/);
    if (descMatch) {
      config.description = descMatch[1];
    }

    // Extract example
    const exampleMatch = configString.match(/example=([^,)]+)/);
    if (exampleMatch) {
      try {
        config.example = JSON.parse(exampleMatch[1]);
      } catch (e) {
        config.example = exampleMatch[1].replace(/["']/g, '');
      }
    }

    // Extract min/max
    const minMatch = configString.match(/min_length=(\d+)|ge=(\d+)/);
    if (minMatch) {
      config.minimum = parseInt(minMatch[1] || minMatch[2]);
    }

    const maxMatch = configString.match(/max_length=(\d+)|le=(\d+)/);
    if (maxMatch) {
      config.maximum = parseInt(maxMatch[1] || maxMatch[2]);
    }

    return config;
  }

  /**
   * Smart split string by delimiter, respecting brackets
   */
  smartSplit(str, delimiter) {
    const parts = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === '[' || char === '(') {
        depth++;
      } else if (char === ']' || char === ')') {
        depth--;
      }

      if (char === delimiter && depth === 0) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }
}

module.exports = FastAPIParser;
