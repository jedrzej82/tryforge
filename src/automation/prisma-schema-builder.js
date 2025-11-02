/**
 * Prisma Schema Builder
 * Comprehensive Prisma schema generation with full feature support
 */

const chalk = require('chalk');

class PrismaSchemaBuilder {
  constructor(options = {}) {
    this.models = [];
    this.enums = [];
    this.config = {
      provider: options.provider || 'postgresql',
      databaseUrl: options.databaseUrl || 'env("DATABASE_URL")',
      clientProvider: options.clientProvider || 'prisma-client-js',
      previewFeatures: options.previewFeatures || [],
      ...options
    };
    this.validationErrors = [];
  }

  /**
   * Add a model to the schema
   */
  addModel(modelDef) {
    // Validate model definition
    if (!modelDef.name) {
      throw new Error('Model name is required');
    }

    if (!modelDef.fields || modelDef.fields.length === 0) {
      throw new Error(`Model ${modelDef.name} must have at least one field`);
    }

    // Check for duplicate model names
    if (this.models.find(m => m.name === modelDef.name)) {
      console.log(chalk.yellow(`Warning: Model ${modelDef.name} already exists, skipping`));
      return this;
    }

    // Normalize and validate model
    const normalizedModel = this.normalizeModel(modelDef);
    this.models.push(normalizedModel);

    // Extract and register enums
    this.extractEnums(normalizedModel);

    return this;
  }

  /**
   * Normalize model definition
   */
  normalizeModel(modelDef) {
    return {
      name: modelDef.name,
      fields: modelDef.fields.map(f => this.normalizeField(f, modelDef.name)),
      relations: modelDef.relations || [],
      indexes: modelDef.indexes || [],
      uniqueConstraints: modelDef.uniqueConstraints || [],
      compositeId: modelDef.compositeId || null,
      tableName: modelDef.tableName || null,
      documentation: modelDef.documentation || null
    };
  }

  /**
   * Normalize field definition
   */
  normalizeField(field, modelName) {
    const normalized = {
      name: field.name,
      type: this.normalizeFieldType(field),
      isRequired: field.required !== false && !field.optional,
      isUnique: field.unique || false,
      isId: field.primary || field.isId || false,
      default: field.default || null,
      isUpdatedAt: field.updatedAt || false,
      relation: field.relation || null,
      map: field.map || null,
      dbType: field.dbType || null,
      documentation: field.documentation || null,
      isList: field.isList || field.isArray || false
    };

    // Handle special field names
    if (field.name === 'id' && !field.type) {
      normalized.type = 'String';
      normalized.isId = true;
      normalized.default = { function: 'uuid' };
    }

    return normalized;
  }

  /**
   * Normalize field type
   */
  normalizeFieldType(field) {
    const typeMap = {
      'uuid': 'String',
      'string': 'String',
      'text': 'String',
      'integer': 'Int',
      'int': 'Int',
      'bigint': 'BigInt',
      'decimal': 'Decimal',
      'float': 'Float',
      'double': 'Float',
      'boolean': 'Boolean',
      'bool': 'Boolean',
      'timestamp': 'DateTime',
      'datetime': 'DateTime',
      'date': 'DateTime',
      'json': 'Json',
      'jsonb': 'Json',
      'bytes': 'Bytes',
      'enum': field.enumName || `${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`,
    };

    // If type is already a valid Prisma type, use it
    const prismaTypes = ['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes'];
    if (prismaTypes.includes(field.type)) {
      return field.type;
    }

    // Check if it's an enum
    if (field.values || field.enum) {
      return field.enumName || `${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
    }

    // Map the type
    return typeMap[field.type?.toLowerCase()] || 'String';
  }

  /**
   * Extract enums from model
   */
  extractEnums(model) {
    model.fields.forEach(field => {
      const originalField = model.fields.find(f => f.name === field.name);

      if (originalField && (originalField.values || originalField.enum)) {
        const enumName = field.type;
        const values = originalField.values || originalField.enum;

        // Check if enum already exists
        if (!this.enums.find(e => e.name === enumName)) {
          this.enums.push({
            name: enumName,
            values: values
          });
        }
      }
    });
  }

  /**
   * Add enum to schema
   */
  addEnum(name, values) {
    if (!this.enums.find(e => e.name === name)) {
      this.enums.push({ name, values });
    }
    return this;
  }

  /**
   * Validate schema
   */
  validateSchema() {
    this.validationErrors = [];

    // Check for naming conflicts
    const modelNames = this.models.map(m => m.name);
    const duplicates = modelNames.filter((name, index) => modelNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      this.validationErrors.push(`Duplicate model names: ${duplicates.join(', ')}`);
    }

    // Validate relations
    this.models.forEach(model => {
      model.relations?.forEach(relation => {
        const relatedModel = this.models.find(m => m.name === relation.model);
        if (!relatedModel) {
          this.validationErrors.push(
            `Model ${model.name} has relation to non-existent model ${relation.model}`
          );
        }
      });
    });

    // Check for reserved words
    const reserved = ['user', 'model', 'enum', 'type', 'interface'];
    this.models.forEach(model => {
      if (reserved.includes(model.name.toLowerCase())) {
        this.validationErrors.push(
          `Model name "${model.name}" is a reserved word`
        );
      }
    });

    // Validate each model has an ID field
    this.models.forEach(model => {
      const hasId = model.fields.some(f => f.isId) || model.compositeId;
      if (!hasId) {
        this.validationErrors.push(
          `Model ${model.name} must have at least one @id field or @@id`
        );
      }
    });

    return this.validationErrors.length === 0;
  }

  /**
   * Generate complete Prisma schema
   */
  generateSchema() {
    let schema = '';

    // Add header comment
    schema += '// This Prisma schema was generated by TryForge\n';
    schema += `// Generated at: ${new Date().toISOString()}\n\n`;

    // Generate datasource block
    schema += this.generateDatasource();
    schema += '\n\n';

    // Generate generator block
    schema += this.generateGenerator();
    schema += '\n\n';

    // Generate enums
    if (this.enums.length > 0) {
      this.enums.forEach(enumDef => {
        schema += this.generateEnum(enumDef);
        schema += '\n\n';
      });
    }

    // Generate models
    this.models.forEach(model => {
      schema += this.generateModel(model);
      schema += '\n\n';
    });

    return schema.trim();
  }

  /**
   * Generate datasource block
   */
  generateDatasource() {
    return `datasource db {
  provider = "${this.config.provider}"
  url      = ${this.config.databaseUrl}
}`;
  }

  /**
   * Generate generator block
   */
  generateGenerator() {
    let generator = `generator client {
  provider = "${this.config.clientProvider}"`;

    if (this.config.previewFeatures && this.config.previewFeatures.length > 0) {
      generator += `\n  previewFeatures = [${this.config.previewFeatures.map(f => `"${f}"`).join(', ')}]`;
    }

    if (this.config.binaryTargets && this.config.binaryTargets.length > 0) {
      generator += `\n  binaryTargets = [${this.config.binaryTargets.map(t => `"${t}"`).join(', ')}]`;
    }

    generator += '\n}';

    return generator;
  }

  /**
   * Generate enum definition
   */
  generateEnum(enumDef) {
    let enumStr = `enum ${enumDef.name} {\n`;
    enumDef.values.forEach(value => {
      enumStr += `  ${value}\n`;
    });
    enumStr += '}';
    return enumStr;
  }

  /**
   * Generate model definition
   */
  generateModel(model) {
    let modelStr = '';

    // Add documentation if available
    if (model.documentation) {
      modelStr += `/// ${model.documentation}\n`;
    }

    modelStr += `model ${model.name} {\n`;

    // Generate fields
    model.fields.forEach(field => {
      modelStr += this.generateField(field, model);
    });

    // Add relations
    if (model.relations && model.relations.length > 0) {
      modelStr += '\n  // Relations\n';
      model.relations.forEach(relation => {
        modelStr += this.generateRelation(relation, model);
      });
    }

    // Add block attributes
    const blockAttrs = this.generateBlockAttributes(model);
    if (blockAttrs) {
      modelStr += '\n' + blockAttrs;
    }

    modelStr += '}';

    return modelStr;
  }

  /**
   * Generate field definition
   */
  generateField(field, model) {
    let fieldStr = '  ';

    // Add field documentation
    if (field.documentation) {
      fieldStr = `  /// ${field.documentation}\n  `;
    }

    // Field name
    fieldStr += field.name;

    // Spacing for alignment
    const maxFieldLength = Math.max(...model.fields.map(f => f.name.length));
    const padding = ' '.repeat(maxFieldLength - field.name.length + 2);
    fieldStr += padding;

    // Field type
    fieldStr += field.type;

    // Array type
    if (field.isList) {
      fieldStr += '[]';
    }

    // Optional marker
    if (!field.isRequired && !field.isId) {
      fieldStr += '?';
    }

    // Attributes
    const attributes = this.generateFieldAttributes(field);
    if (attributes) {
      fieldStr += ' ' + attributes;
    }

    fieldStr += '\n';

    return fieldStr;
  }

  /**
   * Generate field attributes
   */
  generateFieldAttributes(field) {
    const attrs = [];

    // @id
    if (field.isId) {
      attrs.push('@id');
    }

    // @default
    if (field.default) {
      if (typeof field.default === 'object' && field.default.function) {
        // Function defaults like uuid(), now(), autoincrement()
        attrs.push(`@default(${field.default.function}())`);
      } else if (field.default === 'now') {
        attrs.push('@default(now())');
      } else if (field.default === 'uuid') {
        attrs.push('@default(uuid())');
      } else if (field.default === 'autoincrement') {
        attrs.push('@default(autoincrement())');
      } else if (field.default === 'cuid') {
        attrs.push('@default(cuid())');
      } else if (typeof field.default === 'string') {
        attrs.push(`@default("${field.default}")`);
      } else if (typeof field.default === 'boolean' || typeof field.default === 'number') {
        attrs.push(`@default(${field.default})`);
      }
    }

    // @unique
    if (field.isUnique) {
      attrs.push('@unique');
    }

    // @updatedAt
    if (field.isUpdatedAt) {
      attrs.push('@updatedAt');
    }

    // @map
    if (field.map) {
      attrs.push(`@map("${field.map}")`);
    }

    // @db (database-specific types)
    if (field.dbType) {
      attrs.push(`@db.${field.dbType}`);
    }

    return attrs.join(' ');
  }

  /**
   * Generate relation field
   */
  generateRelation(relation, model) {
    let relStr = '  ';

    // Relation field name
    relStr += relation.name || relation.model.toLowerCase();

    // Padding
    const maxFieldLength = Math.max(
      ...model.fields.map(f => f.name.length),
      ...(model.relations || []).map(r => (r.name || r.model.toLowerCase()).length)
    );
    const padding = ' '.repeat(maxFieldLength - (relation.name || relation.model.toLowerCase()).length + 2);
    relStr += padding;

    // Relation type (model name)
    relStr += relation.model;

    // Array for one-to-many or many-to-many
    if (relation.type === 'hasMany' || relation.type === 'manyToMany') {
      relStr += '[]';
    } else {
      relStr += '?';
    }

    // @relation attribute
    const relationAttr = this.generateRelationAttribute(relation);
    if (relationAttr) {
      relStr += ' ' + relationAttr;
    }

    relStr += '\n';

    return relStr;
  }

  /**
   * Generate @relation attribute
   */
  generateRelationAttribute(relation) {
    const parts = [];

    // Relation name (for disambiguation)
    if (relation.relationName) {
      parts.push(`"${relation.relationName}"`);
    }

    // Fields and references for belongsTo/manyToOne
    if (relation.type === 'belongsTo' || relation.type === 'manyToOne') {
      const fields = relation.fields || [relation.foreignKey];
      const references = relation.references || ['id'];

      parts.push(`fields: [${fields.join(', ')}]`);
      parts.push(`references: [${references.join(', ')}]`);

      // Referential actions
      if (relation.onDelete) {
        parts.push(`onDelete: ${relation.onDelete}`);
      }
      if (relation.onUpdate) {
        parts.push(`onUpdate: ${relation.onUpdate}`);
      }
    }

    return parts.length > 0 ? `@relation(${parts.join(', ')})` : '';
  }

  /**
   * Generate block attributes (@@index, @@unique, @@id, @@map)
   */
  generateBlockAttributes(model) {
    const attrs = [];

    // @@id (composite primary key)
    if (model.compositeId) {
      attrs.push(`  @@id([${model.compositeId.join(', ')}])`);
    }

    // @@unique (composite unique constraints)
    if (model.uniqueConstraints && model.uniqueConstraints.length > 0) {
      model.uniqueConstraints.forEach(constraint => {
        if (Array.isArray(constraint)) {
          attrs.push(`  @@unique([${constraint.join(', ')}])`);
        } else if (constraint.fields) {
          const name = constraint.name ? `, name: "${constraint.name}"` : '';
          attrs.push(`  @@unique([${constraint.fields.join(', ')}]${name})`);
        }
      });
    }

    // @@index
    if (model.indexes && model.indexes.length > 0) {
      model.indexes.forEach(index => {
        if (Array.isArray(index)) {
          attrs.push(`  @@index([${index.join(', ')}])`);
        } else if (typeof index === 'string') {
          attrs.push(`  @@index([${index}])`);
        } else if (index.fields) {
          const name = index.name ? `, name: "${index.name}"` : '';
          attrs.push(`  @@index([${index.fields.join(', ')}]${name})`);
        }
      });
    }

    // @@map (custom table name)
    if (model.tableName) {
      attrs.push(`  @@map("${model.tableName}")`);
    }

    return attrs.join('\n');
  }

  /**
   * Get validation errors
   */
  getValidationErrors() {
    return this.validationErrors;
  }

  /**
   * Clear all models and enums
   */
  clear() {
    this.models = [];
    this.enums = [];
    this.validationErrors = [];
    return this;
  }

  /**
   * Get all models
   */
  getModels() {
    return this.models;
  }

  /**
   * Get all enums
   */
  getEnums() {
    return this.enums;
  }
}

module.exports = PrismaSchemaBuilder;
