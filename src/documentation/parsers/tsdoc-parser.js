const { logger } = require('../../utils/logger');

/**
 * TSDoc Parser
 * Extracts and parses TSDoc comments for TypeScript
 */
class TSDocParser {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Extract all TSDoc comments from content
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
   * Parse TSDoc comment
   */
  parse(commentText) {
    const result = {
      description: '',
      summary: '',
      remarks: '',
      params: [],
      returns: null,
      typeParams: [],
      throws: [],
      example: null,
      deprecated: false,
      see: [],
      beta: false,
      alpha: false,
      public: true,
      internal: false
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

      // Extract summary (first paragraph)
      const paragraphs = description.split(/\n\n+/);
      if (paragraphs.length > 0) {
        result.summary = paragraphs[0].trim();
        result.description = description;
      }
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
          case 'typeParam':
            result.typeParams.push(parsed);
            break;
          case 'returns':
          case 'return':
            result.returns = parsed;
            break;
          case 'throws':
          case 'throw':
            result.throws.push(parsed);
            break;
          case 'example':
            result.example = this.parseExample(parsed.value);
            break;
          case 'remarks':
            result.remarks = parsed.value;
            break;
          case 'deprecated':
            result.deprecated = true;
            result.deprecationMessage = parsed.value;
            break;
          case 'see':
            result.see.push(parsed.value);
            break;
          case 'beta':
            result.beta = true;
            break;
          case 'alpha':
            result.alpha = true;
            break;
          case 'internal':
            result.internal = true;
            result.public = false;
            break;
          case 'public':
            result.public = true;
            result.internal = false;
            break;
          case 'privateRemarks':
            result.privateRemarks = parsed.value;
            break;
          default:
            // Custom tag
            if (!result.customTags) result.customTags = [];
            result.customTags.push(parsed);
        }
      }
    }

    return result;
  }

  /**
   * Parse individual TSDoc tag
   */
  parseTag(tagText) {
    // TSDoc format: @tagName {type} name - description
    // Or: @tagName description

    // Try standard format first
    const standardPattern = /^@(\w+)(?:\s+\{([^}]+)\})?(?:\s+(\S+))?(?:\s+-\s+(.*))?$/s;
    const match = tagText.match(standardPattern);

    if (!match) {
      // Try simple format: @tagName value
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
    // @param name - description
    const withTypePattern = /\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/s;
    const withoutTypePattern = /(\w+)\s*-?\s*(.*)/s;

    let match = paramText.match(withTypePattern);
    if (match) {
      const [, type, name, description] = match;
      return {
        name,
        type: type.trim(),
        description: description.trim()
      };
    }

    match = paramText.match(withoutTypePattern);
    if (match) {
      const [, name, description] = match;
      return {
        name,
        description: description.trim()
      };
    }

    return null;
  }

  /**
   * Parse @returns tag
   */
  parseReturns(returnsText) {
    // @returns {Type} description
    const withTypePattern = /\{([^}]+)\}\s*(.*)/s;
    const match = returnsText.match(withTypePattern);

    if (match) {
      const [, type, description] = match;
      return {
        type: type.trim(),
        description: description.trim()
      };
    }

    return {
      description: returnsText.trim()
    };
  }

  /**
   * Parse example tag
   */
  parseExample(exampleText) {
    // Try to parse code blocks
    const codeBlockPattern = /```(\w+)?\s*([\s\S]*?)```/;
    const match = exampleText.match(codeBlockPattern);

    if (match) {
      const [, language, code] = match;
      return {
        language: language || 'typescript',
        code: code.trim()
      };
    }

    return {
      text: exampleText.trim()
    };
  }

  /**
   * Extract TypeScript type information
   */
  extractTypeInfo(content) {
    const types = {
      interfaces: {},
      types: {},
      classes: {},
      enums: {}
    };

    // Extract interfaces
    const interfacePattern = /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*{([^}]*)}/g;
    let match;

    while ((match = interfacePattern.exec(content)) !== null) {
      const [, name, body] = match;
      types.interfaces[name] = this.parseInterface(body);
    }

    // Extract type aliases
    const typePattern = /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;

    while ((match = typePattern.exec(content)) !== null) {
      const [, name, definition] = match;
      types.types[name] = this.parseTypeAlias(definition);
    }

    // Extract classes
    const classPattern = /export\s+class\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+\w+)?\s*(?:implements\s+[\w,\s]+)?\s*{([^}]*)}/g;

    while ((match = classPattern.exec(content)) !== null) {
      const [, name, body] = match;
      types.classes[name] = this.parseClass(body);
    }

    // Extract enums
    const enumPattern = /export\s+enum\s+(\w+)\s*{([^}]*)}/g;

    while ((match = enumPattern.exec(content)) !== null) {
      const [, name, body] = match;
      types.enums[name] = this.parseEnum(body);
    }

    return types;
  }

  /**
   * Parse interface body
   */
  parseInterface(body) {
    const properties = {};

    // Parse properties: name: type;
    const propertyPattern = /(\w+)(\?)?:\s*([^;]+);/g;
    let match;

    while ((match = propertyPattern.exec(body)) !== null) {
      const [, name, optional, type] = match;

      properties[name] = {
        type: type.trim(),
        optional: !!optional,
        required: !optional
      };
    }

    return {
      type: 'object',
      properties: this.convertToOpenAPIProperties(properties)
    };
  }

  /**
   * Parse type alias
   */
  parseTypeAlias(definition) {
    const trimmed = definition.trim();

    // Union type: string | number
    if (trimmed.includes('|')) {
      return {
        oneOf: trimmed.split('|').map(t => ({ type: this.mapTSType(t.trim()) }))
      };
    }

    // Intersection type: Type1 & Type2
    if (trimmed.includes('&')) {
      return {
        allOf: trimmed.split('&').map(t => ({ $ref: `#/components/schemas/${t.trim()}` }))
      };
    }

    // Object type: { key: value }
    if (trimmed.startsWith('{')) {
      return this.parseInterface(trimmed);
    }

    // Simple type
    return {
      type: this.mapTSType(trimmed)
    };
  }

  /**
   * Parse class body
   */
  parseClass(body) {
    const properties = {};

    // Parse properties with access modifiers
    const propertyPattern = /(public|private|protected)?\s*(\w+)(\?)?:\s*([^;=]+)/g;
    let match;

    while ((match = propertyPattern.exec(body)) !== null) {
      const [, access, name, optional, type] = match;

      // Skip private properties
      if (access === 'private') continue;

      properties[name] = {
        type: type.trim(),
        optional: !!optional,
        required: !optional
      };
    }

    return {
      type: 'object',
      properties: this.convertToOpenAPIProperties(properties)
    };
  }

  /**
   * Parse enum body
   */
  parseEnum(body) {
    const values = [];

    // Parse enum values
    const valuePattern = /(\w+)\s*=?\s*(['"]?)([^,}]+)\2/g;
    let match;

    while ((match = valuePattern.exec(body)) !== null) {
      const [, , , value] = match;
      values.push(value.trim());
    }

    return {
      type: 'string',
      enum: values
    };
  }

  /**
   * Convert TypeScript properties to OpenAPI properties
   */
  convertToOpenAPIProperties(properties) {
    const openAPIProps = {};

    for (const [name, prop] of Object.entries(properties)) {
      openAPIProps[name] = {
        type: this.mapTSType(prop.type),
        description: prop.description
      };

      if (prop.optional) {
        openAPIProps[name].nullable = true;
      }
    }

    return openAPIProps;
  }

  /**
   * Map TypeScript type to OpenAPI type
   */
  mapTSType(tsType) {
    const type = tsType.toLowerCase().trim();

    const mapping = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'string',
      'any': 'object',
      'unknown': 'object',
      'void': 'null',
      'null': 'null',
      'undefined': 'null',
      'object': 'object',
      'array': 'array'
    };

    // Check for array types
    if (tsType.endsWith('[]') || tsType.startsWith('Array<')) {
      return 'array';
    }

    return mapping[type] || 'string';
  }

  /**
   * Convert TSDoc to OpenAPI documentation
   */
  toOpenAPIDoc(tsdoc) {
    const doc = {};

    if (tsdoc.summary) {
      doc.summary = tsdoc.summary;
    }

    if (tsdoc.description) {
      doc.description = tsdoc.description;
    }

    if (tsdoc.deprecated) {
      doc.deprecated = true;
    }

    if (tsdoc.example) {
      doc.example = tsdoc.example;
    }

    return doc;
  }
}

module.exports = TSDocParser;
