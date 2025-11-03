const { logger } = require('../../utils/logger');

/**
 * JSDoc Parser
 * Extracts and parses JSDoc comments
 */
class JSDocParser {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Extract all JSDoc comments from content
   */
  extractComments(content) {
    const comments = [];
    const commentPattern = /\/\*\*[\s\S]*?\*\//g;

    let match;
    while ((match = commentPattern.exec(content)) !== null) {
      comments.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return comments;
  }

  /**
   * Parse JSDoc comment
   */
  parse(commentText) {
    const result = {
      description: '',
      summary: '',
      tags: [],
      params: [],
      returns: null,
      responses: [],
      example: null,
      deprecated: false
    };

    // Remove comment markers
    const cleaned = commentText
      .replace(/^\/\*\*/, '')
      .replace(/\*\/$/, '')
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();

    // Split into description and tags
    const parts = cleaned.split(/^@/m);

    if (parts.length > 0) {
      // First part is description
      const description = parts[0].trim();

      // Extract summary (first line/sentence)
      const summaryMatch = description.match(/^([^\n.]+)/);
      if (summaryMatch) {
        result.summary = summaryMatch[1].trim();
      }

      result.description = description;
    }

    // Parse tags
    for (let i = 1; i < parts.length; i++) {
      const tagText = '@' + parts[i];
      const parsed = this.parseTag(tagText);

      if (parsed) {
        switch (parsed.tag) {
          case 'param':
            result.params.push(parsed);
            break;
          case 'return':
          case 'returns':
            result.returns = parsed;
            break;
          case 'api':
          case 'apiName':
          case 'apiGroup':
            if (!result.apiInfo) result.apiInfo = {};
            result.apiInfo[parsed.tag] = parsed.value;
            break;
          case 'apiParam':
            result.params.push(this.parseApiParam(parsed.value));
            break;
          case 'apiSuccess':
            if (!result.success) result.success = [];
            result.success.push(this.parseApiSuccess(parsed.value));
            break;
          case 'apiError':
            if (!result.errors) result.errors = [];
            result.errors.push(this.parseApiError(parsed.value));
            break;
          case 'apiResponse':
          case 'response':
            result.responses.push(this.parseResponse(parsed.value));
            break;
          case 'example':
            result.example = this.parseExample(parsed.value);
            break;
          case 'deprecated':
            result.deprecated = true;
            break;
          case 'tag':
          case 'tags':
            const tags = parsed.value.split(/[,\s]+/).filter(Boolean);
            result.tags.push(...tags.map(t => ({ name: t })));
            break;
          default:
            result.tags.push(parsed);
        }
      }
    }

    return result;
  }

  /**
   * Parse individual JSDoc tag
   */
  parseTag(tagText) {
    // Match @tagName {type} name - description
    const tagPattern = /^@(\w+)(?:\s+\{([^}]+)\})?(?:\s+(\S+))?(?:\s+(.*))?$/s;
    const match = tagText.match(tagPattern);

    if (!match) {
      // Try simpler pattern: @tagName value
      const simplePattern = /^@(\w+)\s+(.*)$/s;
      const simpleMatch = tagText.match(simplePattern);

      if (simpleMatch) {
        return {
          tag: simpleMatch[1],
          value: simpleMatch[2].trim()
        };
      }
      return null;
    }

    const [, tag, type, name, description] = match;

    return {
      tag,
      type: type ? type.trim() : undefined,
      name: name ? name.trim() : undefined,
      description: description ? description.trim() : undefined,
      value: description ? description.trim() : name ? name.trim() : undefined
    };
  }

  /**
   * Parse @param tag
   */
  parseParam(paramText) {
    // @param {Type} name - description
    const pattern = /\{([^}]+)\}\s+(\[?[\w.]+\]?)\s*-?\s*(.*)/;
    const match = paramText.match(pattern);

    if (!match) return null;

    const [, type, name, description] = match;
    const optional = name.startsWith('[') && name.endsWith(']');
    const cleanName = name.replace(/[\[\]]/g, '');

    return {
      name: cleanName,
      type: type.trim(),
      description: description.trim(),
      optional,
      required: !optional
    };
  }

  /**
   * Parse apiDoc style @apiParam
   */
  parseApiParam(paramText) {
    // @apiParam {Type} name Description
    const pattern = /\{([^}]+)\}\s+([\w.]+)\s+(.*)/;
    const match = paramText.match(pattern);

    if (!match) {
      // Try without type: name Description
      const simplePattern = /([\w.]+)\s+(.*)/;
      const simpleMatch = paramText.match(simplePattern);

      if (simpleMatch) {
        return {
          name: simpleMatch[1],
          type: 'string',
          description: simpleMatch[2].trim()
        };
      }
      return null;
    }

    const [, type, name, description] = match;

    return {
      name: name.trim(),
      type: type.trim(),
      description: description.trim()
    };
  }

  /**
   * Parse @apiSuccess
   */
  parseApiSuccess(successText) {
    // @apiSuccess {Type} field Description
    const pattern = /\{([^}]+)\}\s+([\w.]+)\s+(.*)/;
    const match = successText.match(pattern);

    if (!match) return { description: successText };

    const [, type, field, description] = match;

    return {
      type: type.trim(),
      field: field.trim(),
      description: description.trim()
    };
  }

  /**
   * Parse @apiError
   */
  parseApiError(errorText) {
    // @apiError {Type} field Description
    // OR @apiError (ErrorName) field Description
    const typePattern = /\{([^}]+)\}\s+([\w.]+)\s+(.*)/;
    const namePattern = /\(([^)]+)\)\s+([\w.]+)\s+(.*)/;

    let match = errorText.match(typePattern);
    if (match) {
      const [, type, field, description] = match;
      return {
        type: type.trim(),
        field: field.trim(),
        description: description.trim()
      };
    }

    match = errorText.match(namePattern);
    if (match) {
      const [, name, field, description] = match;
      return {
        name: name.trim(),
        field: field.trim(),
        description: description.trim()
      };
    }

    return { description: errorText };
  }

  /**
   * Parse response tag
   */
  parseResponse(responseText) {
    // @response 200 {Type} Description
    const pattern = /(\d{3})\s+\{([^}]+)\}\s+(.*)/;
    const match = responseText.match(pattern);

    if (!match) {
      // Try without type: 200 Description
      const simplePattern = /(\d{3})\s+(.*)/;
      const simpleMatch = responseText.match(simplePattern);

      if (simpleMatch) {
        return {
          code: simpleMatch[1],
          description: simpleMatch[2].trim()
        };
      }
      return null;
    }

    const [, code, type, description] = match;

    return {
      code,
      type: type.trim(),
      description: description.trim()
    };
  }

  /**
   * Parse example tag
   */
  parseExample(exampleText) {
    // Try to parse as JSON
    try {
      // Check if it looks like JSON
      if (exampleText.trim().startsWith('{') || exampleText.trim().startsWith('[')) {
        return JSON.parse(exampleText);
      }
    } catch (e) {
      // Not JSON, return as string
    }

    // Try to extract JSON from code block
    const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)```/;
    const match = exampleText.match(codeBlockPattern);

    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        return match[1].trim();
      }
    }

    return exampleText.trim();
  }

  /**
   * Parse OpenAPI/Swagger tags
   */
  parseSwaggerTags(commentText) {
    const result = {
      summary: null,
      description: null,
      tags: [],
      parameters: [],
      requestBody: null,
      responses: {}
    };

    // Extract swagger/openapi tags
    const swaggerPattern = /@swagger\s+([\s\S]*?)(?=@swagger|@openapi|$)/gi;
    const openapiPattern = /@openapi\s+([\s\S]*?)(?=@swagger|@openapi|$)/gi;

    let match;

    // Try to parse as YAML
    match = swaggerPattern.exec(commentText) || openapiPattern.exec(commentText);

    if (match) {
      try {
        const yaml = require('js-yaml');
        const parsed = yaml.load(match[1]);

        if (parsed) {
          Object.assign(result, parsed);
        }
      } catch (e) {
        logger.warn('Failed to parse Swagger/OpenAPI YAML in JSDoc:', e.message);
      }
    }

    return result;
  }

  /**
   * Convert JSDoc to OpenAPI parameter
   */
  toOpenAPIParameter(param) {
    return {
      name: param.name,
      in: this.inferParameterLocation(param.name),
      required: param.required || false,
      description: param.description || '',
      schema: {
        type: this.mapType(param.type)
      }
    };
  }

  /**
   * Infer parameter location from name
   */
  inferParameterLocation(name) {
    if (name.startsWith('query.')) return 'query';
    if (name.startsWith('body.')) return 'body';
    if (name.startsWith('header.')) return 'header';
    if (name.startsWith('path.')) return 'path';
    return 'query'; // Default
  }

  /**
   * Map JSDoc type to OpenAPI type
   */
  mapType(type) {
    if (!type) return 'string';

    const lowerType = type.toLowerCase();

    const mapping = {
      'string': 'string',
      'number': 'number',
      'integer': 'integer',
      'int': 'integer',
      'boolean': 'boolean',
      'bool': 'boolean',
      'array': 'array',
      'object': 'object',
      'date': 'string',
      'datetime': 'string'
    };

    return mapping[lowerType] || 'string';
  }

  /**
   * Extract route info from apiDoc style comments
   */
  parseApiDocRoute(comment) {
    const parsed = this.parse(comment);

    if (!parsed.apiInfo || !parsed.apiInfo.api) {
      return null;
    }

    // Parse api string: @api {method} /path title
    const apiPattern = /\{(\w+)\}\s+(\/[\w\/:\-{}]*)\s+(.*)/;
    const match = parsed.apiInfo.api.match(apiPattern);

    if (!match) return null;

    const [, method, path, title] = match;

    const route = {
      method: method.toLowerCase(),
      path,
      summary: title || parsed.apiInfo.apiName,
      description: parsed.description,
      tags: parsed.apiInfo.apiGroup ? [parsed.apiInfo.apiGroup] : []
    };

    // Add parameters
    if (parsed.params && parsed.params.length > 0) {
      route.params = {};
      route.query = {};
      route.requestBody = { schema: { type: 'object', properties: {} } };

      parsed.params.forEach(param => {
        if (param.name.includes('.')) {
          const [location, name] = param.name.split('.');

          if (location === 'body') {
            route.requestBody.schema.properties[name] = {
              type: this.mapType(param.type),
              description: param.description
            };
          } else if (location === 'query') {
            route.query[name] = {
              type: this.mapType(param.type),
              description: param.description,
              required: param.required
            };
          }
        } else {
          route.params[param.name] = {
            type: this.mapType(param.type),
            description: param.description
          };
        }
      });
    }

    // Add responses
    if (parsed.success || parsed.errors) {
      route.responses = {};

      if (parsed.success) {
        const successSchema = { type: 'object', properties: {} };

        parsed.success.forEach(field => {
          const fieldPath = field.field.split('.');
          let current = successSchema.properties;

          for (let i = 0; i < fieldPath.length - 1; i++) {
            if (!current[fieldPath[i]]) {
              current[fieldPath[i]] = { type: 'object', properties: {} };
            }
            current = current[fieldPath[i]].properties;
          }

          current[fieldPath[fieldPath.length - 1]] = {
            type: this.mapType(field.type),
            description: field.description
          };
        });

        route.responses['200'] = {
          description: 'Successful response',
          schema: successSchema
        };
      }

      if (parsed.errors) {
        parsed.errors.forEach(error => {
          const code = error.name === 'NotFound' ? '404' :
                       error.name === 'Unauthorized' ? '401' :
                       error.name === 'BadRequest' ? '400' : '500';

          route.responses[code] = {
            description: error.description || error.name
          };
        });
      }
    }

    return route;
  }
}

module.exports = JSDocParser;
