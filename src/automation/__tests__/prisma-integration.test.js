/**
 * Integration Tests for Prisma System
 * Tests the complete workflow of model generation and schema building
 */

const PrismaSchemaBuilder = require('../prisma-schema-builder');
const ModelGenerator = require('../model-generator');
const ModelDiscovery = require('../model-discovery');

describe('Prisma Integration', () => {
  describe('Complete E-commerce Schema', () => {
    test('should generate a complete e-commerce schema', () => {
      const builder = new PrismaSchemaBuilder();

      // User model
      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
          { name: 'email', type: 'String', unique: true, required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
          { name: 'updatedAt', type: 'DateTime', updatedAt: true }
        ],
        relations: [
          { name: 'orders', model: 'Order', type: 'hasMany' }
        ]
      });

      // Product model
      builder.addModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
          { name: 'name', type: 'String', required: true },
          { name: 'price', type: 'Decimal', required: true },
          { name: 'stock', type: 'Int', default: 0 },
          { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
        ],
        indexes: [['name']]
      });

      // Order model
      builder.addModel({
        name: 'Order',
        fields: [
          { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
          { name: 'userId', type: 'String', required: true },
          { name: 'total', type: 'Decimal', required: true },
          { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
        ],
        relations: [
          {
            name: 'user',
            model: 'User',
            type: 'belongsTo',
            fields: ['userId'],
            references: ['id'],
            onDelete: 'Cascade'
          }
        ],
        indexes: [['userId'], ['createdAt']]
      });

      const schema = builder.generateSchema();

      // Verify schema contains all models
      expect(schema).toContain('model User');
      expect(schema).toContain('model Product');
      expect(schema).toContain('model Order');

      // Verify relations
      expect(schema).toContain('orders Order[]');
      expect(schema).toContain('user User?');

      // Verify indexes
      expect(schema).toContain('@@index([userId])');
      expect(schema).toContain('@@index([createdAt])');

      // Verify validation passes
      expect(builder.validateSchema()).toBe(true);
    });
  });

  describe('Blog Schema with Many-to-Many', () => {
    test('should handle many-to-many relations', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'title', type: 'String', required: true }
        ],
        relations: [
          { name: 'tags', model: 'Tag', type: 'manyToMany' }
        ]
      });

      builder.addModel({
        name: 'Tag',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'name', type: 'String', required: true }
        ],
        relations: [
          { name: 'posts', model: 'Post', type: 'manyToMany' }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('tags Tag[]');
      expect(schema).toContain('posts Post[]');
    });
  });

  describe('Self-Referential Relations', () => {
    test('should handle self-referential relations', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'Category',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'name', type: 'String', required: true },
          { name: 'parentId', type: 'String', optional: true }
        ],
        relations: [
          {
            name: 'parent',
            model: 'Category',
            type: 'belongsTo',
            fields: ['parentId'],
            references: ['id']
          },
          {
            name: 'children',
            model: 'Category',
            type: 'hasMany'
          }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('parent Category?');
      expect(schema).toContain('children Category[]');
      expect(builder.validateSchema()).toBe(true);
    });
  });

  describe('Composite Keys and Constraints', () => {
    test('should handle composite primary keys', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'OrderItem',
        fields: [
          { name: 'orderId', type: 'String', required: true },
          { name: 'productId', type: 'String', required: true },
          { name: 'quantity', type: 'Int', required: true }
        ],
        compositeId: ['orderId', 'productId']
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('@@id([orderId, productId])');
    });

    test('should handle composite unique constraints', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'Membership',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'userId', type: 'String', required: true },
          { name: 'organizationId', type: 'String', required: true }
        ],
        uniqueConstraints: [['userId', 'organizationId']]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('@@unique([userId, organizationId])');
    });
  });

  describe('Enums Integration', () => {
    test('should properly integrate enums with models', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addEnum('UserRole', ['USER', 'ADMIN', 'MODERATOR']);
      builder.addEnum('OrderStatus', ['PENDING', 'COMPLETED', 'CANCELLED']);

      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'role', type: 'UserRole', default: 'USER' }
        ]
      });

      builder.addModel({
        name: 'Order',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'status', type: 'OrderStatus', default: 'PENDING' }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('enum UserRole');
      expect(schema).toContain('enum OrderStatus');
      expect(schema).toContain('role UserRole @default(USER)');
      expect(schema).toContain('status OrderStatus @default(PENDING)');
    });
  });

  describe('Model Discovery Integration', () => {
    test('should convert Prisma types to generic types', () => {
      const discovery = new ModelDiscovery();

      expect(discovery.convertPrismaTypeToGeneric('String')).toBe('string');
      expect(discovery.convertPrismaTypeToGeneric('Int')).toBe('integer');
      expect(discovery.convertPrismaTypeToGeneric('DateTime')).toBe('timestamp');
      expect(discovery.convertPrismaTypeToGeneric('Json')).toBe('json');
      expect(discovery.convertPrismaTypeToGeneric('Boolean')).toBe('boolean');
    });
  });

  describe('Schema Validation Edge Cases', () => {
    test('should allow models with composite IDs', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'Vote',
        fields: [
          { name: 'userId', type: 'String', required: true },
          { name: 'postId', type: 'String', required: true },
          { name: 'value', type: 'Int', required: true }
        ],
        compositeId: ['userId', 'postId']
      });

      expect(builder.validateSchema()).toBe(true);
    });

    test('should fail for models without ID', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'InvalidModel',
        fields: [
          { name: 'name', type: 'String', required: true }
        ]
      });

      expect(builder.validateSchema()).toBe(false);
      expect(builder.getValidationErrors()[0]).toContain('must have at least one @id field');
    });
  });

  describe('Complex Relation Scenarios', () => {
    test('should handle multiple relations between same models', () => {
      const builder = new PrismaSchemaBuilder();

      builder.addModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'String', primary: true }
        ],
        relations: [
          { name: 'sentMessages', model: 'Message', type: 'hasMany', relationName: 'SentMessages' },
          { name: 'receivedMessages', model: 'Message', type: 'hasMany', relationName: 'ReceivedMessages' }
        ]
      });

      builder.addModel({
        name: 'Message',
        fields: [
          { name: 'id', type: 'String', primary: true },
          { name: 'senderId', type: 'String', required: true },
          { name: 'receiverId', type: 'String', required: true }
        ],
        relations: [
          {
            name: 'sender',
            model: 'User',
            type: 'belongsTo',
            fields: ['senderId'],
            references: ['id'],
            relationName: 'SentMessages'
          },
          {
            name: 'receiver',
            model: 'User',
            type: 'belongsTo',
            fields: ['receiverId'],
            references: ['id'],
            relationName: 'ReceivedMessages'
          }
        ]
      });

      const schema = builder.generateSchema();

      expect(schema).toContain('sentMessages Message[]');
      expect(schema).toContain('receivedMessages Message[]');
      expect(builder.validateSchema()).toBe(true);
    });
  });

  describe('Schema Generation with All Features', () => {
    test('should generate schema with all supported features', () => {
      const builder = new PrismaSchemaBuilder({
        provider: 'postgresql',
        previewFeatures: ['fullTextSearch']
      });

      builder.addEnum('Status', ['ACTIVE', 'INACTIVE']);

      builder.addModel({
        name: 'CompleteModel',
        documentation: 'A model with all features',
        fields: [
          // Primary key
          {
            name: 'id',
            type: 'String',
            primary: true,
            default: { function: 'cuid' },
            documentation: 'Unique identifier'
          },
          // Unique field
          {
            name: 'email',
            type: 'String',
            unique: true,
            required: true
          },
          // Optional field
          {
            name: 'bio',
            type: 'String',
            optional: true
          },
          // Enum field
          {
            name: 'status',
            type: 'Status',
            default: 'ACTIVE'
          },
          // JSON field
          {
            name: 'metadata',
            type: 'Json',
            optional: true
          },
          // Array field
          {
            name: 'tags',
            type: 'String',
            isList: true
          },
          // Timestamps
          {
            name: 'createdAt',
            type: 'DateTime',
            default: { function: 'now' }
          },
          {
            name: 'updatedAt',
            type: 'DateTime',
            updatedAt: true
          }
        ],
        indexes: [
          ['email'],
          { fields: ['status', 'createdAt'], name: 'status_date_idx' }
        ],
        tableName: 'complete_models'
      });

      const schema = builder.generateSchema();

      // Verify all features are present
      expect(schema).toContain('previewFeatures = ["fullTextSearch"]');
      expect(schema).toContain('enum Status');
      expect(schema).toContain('model CompleteModel');
      expect(schema).toContain('/// A model with all features');
      expect(schema).toContain('@id');
      expect(schema).toContain('@unique');
      expect(schema).toContain('@default(cuid())');
      expect(schema).toContain('@default(now())');
      expect(schema).toContain('@updatedAt');
      expect(schema).toContain('Json?');
      expect(schema).toContain('String[]');
      expect(schema).toContain('@@index([email])');
      expect(schema).toContain('@@index([status, createdAt]');
      expect(schema).toContain('@@map("complete_models")');
      expect(builder.validateSchema()).toBe(true);
    });
  });
});
