/**
 * Tests for PrismaSchemaBuilder
 */

const PrismaSchemaBuilder = require('../prisma-schema-builder');

describe('PrismaSchemaBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new PrismaSchemaBuilder();
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      expect(builder.config.provider).toBe('postgresql');
      expect(builder.config.clientProvider).toBe('prisma-client-js');
      expect(builder.models).toEqual([]);
      expect(builder.enums).toEqual([]);
    });

    test('should accept custom options', () => {
      const customBuilder = new PrismaSchemaBuilder({
        provider: 'mysql',
        previewFeatures: ['fullTextSearch']
      });

      expect(customBuilder.config.provider).toBe('mysql');
      expect(customBuilder.config.previewFeatures).toContain('fullTextSearch');
    });
  });

  describe('addModel', () => {
    test('should add a simple model', () => {
      const model = {
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'email', type: 'String', required: true }
        ]
      };

      builder.addModel(model);

      expect(builder.getModels()).toHaveLength(1);
      expect(builder.getModels()[0].name).toBe('User');
    });

    test('should throw error for model without name', () => {
      expect(() => {
        builder.addModel({ fields: [] });
      }).toThrow('Model name is required');
    });

    test('should throw error for model without fields', () => {
      expect(() => {
        builder.addModel({ name: 'User' });
      }).toThrow('must have at least one field');
    });

    test('should skip duplicate model names', () => {
      const model = {
        name: 'User',
        fields: [{ name: 'id', type: 'String', primary: true }]
      };

      builder.addModel(model);
      builder.addModel(model);

      expect(builder.getModels()).toHaveLength(1);
    });

    test('should extract enums from fields', () => {
      const model = {
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'role', type: 'enum', values: ['USER', 'ADMIN'], enumName: 'UserRole' }
        ]
      };

      builder.addModel(model);

      expect(builder.getEnums()).toHaveLength(1);
      expect(builder.getEnums()[0].name).toBe('UserRole');
      expect(builder.getEnums()[0].values).toEqual(['USER', 'ADMIN']);
    });
  });

  describe('addEnum', () => {
    test('should add an enum', () => {
      builder.addEnum('Status', ['ACTIVE', 'INACTIVE']);

      expect(builder.getEnums()).toHaveLength(1);
      expect(builder.getEnums()[0]).toEqual({
        name: 'Status',
        values: ['ACTIVE', 'INACTIVE']
      });
    });

    test('should not add duplicate enums', () => {
      builder.addEnum('Status', ['ACTIVE']);
      builder.addEnum('Status', ['ACTIVE']);

      expect(builder.getEnums()).toHaveLength(1);
    });
  });

  describe('validateSchema', () => {
    test('should validate a valid schema', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'email', type: 'String' }
        ]
      });

      expect(builder.validateSchema()).toBe(true);
      expect(builder.getValidationErrors()).toHaveLength(0);
    });

    test('should fail for duplicate model names', () => {
      builder.models = [
        { name: 'User', fields: [{ name: 'id', isId: true }] },
        { name: 'User', fields: [{ name: 'id', isId: true }] }
      ];

      expect(builder.validateSchema()).toBe(false);
      expect(builder.getValidationErrors()).toContain('Duplicate model names: User');
    });

    test('should fail for model without ID field', () => {
      builder.addModel({
        name: 'User',
        fields: [{ name: 'email', type: 'String' }]
      });

      expect(builder.validateSchema()).toBe(false);
      expect(builder.getValidationErrors()[0]).toContain('must have at least one @id field');
    });

    test('should fail for invalid relation', () => {
      builder.addModel({
        name: 'Post',
        fields: [{ name: 'id', type: 'String', primary: true }],
        relations: [{ model: 'User', type: 'belongsTo' }]
      });

      expect(builder.validateSchema()).toBe(false);
      expect(builder.getValidationErrors()[0]).toContain('relation to non-existent model');
    });
  });

  describe('generateSchema', () => {
    test('should generate a complete schema', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
          { name: 'email', type: 'String', unique: true, required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('datasource db');
      expect(schema).toContain('generator client');
      expect(schema).toContain('model User');
      expect(schema).toContain('@id');
      expect(schema).toContain('@unique');
      expect(schema).toContain('@default(cuid())');
      expect(schema).toContain('@default(now())');
    });

    test('should generate enums', () => {
      builder.addEnum('Role', ['USER', 'ADMIN']);
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'role', type: 'Role' }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('enum Role');
      expect(schema).toContain('USER');
      expect(schema).toContain('ADMIN');
    });

    test('should generate relations', () => {
      builder.addModel({
        name: 'User',
        fields: [{ name: 'id', type: 'String', primary: true }],
        relations: [{ name: 'posts', model: 'Post', type: 'hasMany' }]
      });

      builder.addModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'userId', type: 'String', required: true }
        ],
        relations: [{
          name: 'user',
          model: 'User',
          type: 'belongsTo',
          fields: ['userId'],
          references: ['id'],
          onDelete: 'Cascade'
        }]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('posts Post[]');
      expect(schema).toContain('user User?');
      expect(schema).toContain('@relation');
      expect(schema).toContain('onDelete: Cascade');
    });

    test('should generate indexes', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'email', type: 'String' },
          { name: 'status', type: 'String' }
        ],
        indexes: [['email'], { fields: ['email', 'status'], name: 'email_status_idx' }]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('@@index([email])');
      expect(schema).toContain('@@index([email, status], name: "email_status_idx")');
    });

    test('should generate unique constraints', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'email', type: 'String' },
          { name: 'username', type: 'String' }
        ],
        uniqueConstraints: [['email', 'username']]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('@@unique([email, username])');
    });
  });

  describe('Field Type Normalization', () => {
    test('should normalize uuid to String', () => {
      builder.addModel({
        name: 'User',
        fields: [{ name: 'id', type: 'uuid', primary: true }]
      });

      const model = builder.getModels()[0];
      expect(model.fields[0].type).toBe('String');
    });

    test('should normalize integer to Int', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'age', type: 'integer' }
        ]
      });

      const model = builder.getModels()[0];
      expect(model.fields[1].type).toBe('Int');
    });

    test('should normalize timestamp to DateTime', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'createdAt', type: 'timestamp' }
        ]
      });

      const model = builder.getModels()[0];
      expect(model.fields[1].type).toBe('DateTime');
    });
  });

  describe('Special Fields', () => {
    test('should handle updatedAt field', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'updatedAt', type: 'DateTime', updatedAt: true }
        ]
      });

      const schema = builder.generateSchema();
      expect(schema).toContain('updatedAt DateTime @updatedAt');
    });

    test('should handle JSON fields', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'metadata', type: 'Json', optional: true }
        ]
      });

      const schema = builder.generateSchema();
      expect(schema).toContain('metadata Json?');
    });

    test('should handle array fields', () => {
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'tags', type: 'String', isList: true }
        ]
      });

      const schema = builder.generateSchema();
      expect(schema).toContain('tags String[]');
    });
  });

  describe('clear', () => {
    test('should clear all models and enums', () => {
      builder.addModel({
        name: 'User',
        fields: [{ name: 'id', type: 'String', primary: true }]
      });
      builder.addEnum('Role', ['USER', 'ADMIN']);

      builder.clear();

      expect(builder.getModels()).toHaveLength(0);
      expect(builder.getEnums()).toHaveLength(0);
    });
  });
});
