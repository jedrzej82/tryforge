# Prisma Integration in TryForge

Complete guide to using TryForge's autonomous Prisma model generation system.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)
5. [Model Generation](#model-generation)
6. [Prisma Schema Builder](#prisma-schema-builder)
7. [Migration Management](#migration-management)
8. [Best Practices](#best-practices)
9. [Examples](#examples)
10. [Troubleshooting](#troubleshooting)

## Overview

TryForge's Prisma integration provides a comprehensive, autonomous system for generating production-ready Prisma schemas. It supports all Prisma features including relations, indexes, constraints, enums, and more.

### Key Benefits

- **Fully Automated**: Generate complete Prisma schemas from model definitions
- **Production-Ready**: Follows Prisma best practices out of the box
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Feature-Complete**: Supports all Prisma field types, relations, and attributes
- **Migration-Aware**: Integrated migration management and database operations
- **Extensible**: Easy to customize and extend for specific needs

## Features

### Supported Prisma Features

#### Field Types
- **Scalar Types**: String, Int, BigInt, Float, Decimal, Boolean, DateTime, Json, Bytes
- **Special Types**: Enum types with automatic generation
- **Arrays**: Support for list/array fields

#### Field Attributes
- `@id` - Primary key fields
- `@default` - Default values (uuid, cuid, autoincrement, now, etc.)
- `@unique` - Unique constraints
- `@updatedAt` - Auto-updating timestamp
- `@map` - Column name mapping
- `@db` - Database-specific types

#### Block Attributes
- `@@id` - Composite primary keys
- `@@unique` - Composite unique constraints
- `@@index` - Single and composite indexes
- `@@map` - Table name mapping

#### Relations
- **One-to-One**: Single reference between models
- **One-to-Many**: Parent-child relationships
- **Many-to-Many**: Junction table relationships
- **Self-Relations**: Models referencing themselves
- **Referential Actions**: Cascade, Restrict, NoAction, SetNull, SetDefault

## Getting Started

### Basic Usage

```javascript
const ModelGenerator = require('./automation/model-generator');
const generator = new ModelGenerator();

// Define a simple model
const userModel = {
  name: 'User',
  fields: [
    { name: 'id', type: 'uuid', primary: true },
    { name: 'email', type: 'string', unique: true, required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'createdAt', type: 'timestamp', default: 'now' }
  ]
};

// Generate the model
await generator.generateModels([userModel], '/path/to/project', {
  orm: 'prisma',
  formatSchema: true,
  validateSchema: true
});
```

### Advanced Usage with Relations

```javascript
const models = [
  {
    name: 'User',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'email', type: 'String', unique: true, required: true },
      { name: 'name', type: 'String', required: true }
    ],
    relations: [
      { name: 'posts', model: 'Post', type: 'hasMany' }
    ]
  },
  {
    name: 'Post',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'title', type: 'String', required: true },
      { name: 'content', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'published', type: 'Boolean', default: false }
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
    indexes: [['userId'], ['published']]
  }
];

await generator.generateModels(models, '/path/to/project', {
  orm: 'prisma',
  autoMigrate: true,
  generateClient: true
});
```

## Architecture

### Core Components

#### 1. PrismaSchemaBuilder (`prisma-schema-builder.js`)

The schema builder is responsible for:
- Model definition normalization
- Field type mapping and validation
- Relation generation
- Enum extraction and management
- Schema validation
- Complete schema generation

**Key Methods:**
- `addModel(modelDef)` - Add a model to the schema
- `addEnum(name, values)` - Add an enum definition
- `generateSchema()` - Generate complete Prisma schema string
- `validateSchema()` - Validate schema integrity
- `getValidationErrors()` - Get validation error messages

#### 2. PrismaMigrationHelper (`prisma-migration-helper.js`)

The migration helper manages:
- Prisma CLI operations
- Migration creation and application
- Database operations (push, pull, reset)
- Client generation
- Schema validation and formatting

**Key Methods:**
- `initializePrisma(provider)` - Initialize Prisma in a project
- `formatSchema()` - Format Prisma schema file
- `validateSchema()` - Validate schema syntax
- `generateClient()` - Generate Prisma Client
- `createMigration(name)` - Create a new migration
- `applyMigrationsDev(name)` - Apply migrations in development
- `deployMigrations()` - Deploy migrations to production
- `pushSchema(options)` - Push schema without migrations
- `autoMigrate(name)` - Full auto-migration workflow

#### 3. ModelGenerator (`model-generator.js`)

Enhanced with Prisma-specific features:
- Integration with PrismaSchemaBuilder
- Automatic schema formatting
- Schema validation
- Migration management
- Client generation

#### 4. ModelDiscovery (`model-discovery.js`)

Enhanced with Prisma analysis:
- Parse existing Prisma schemas
- Extract models, enums, and relations
- Detect Prisma Client usage in code
- Type conversion between Prisma and generic types

## Prisma Schema Builder

### Creating a Schema Builder

```javascript
const PrismaSchemaBuilder = require('./automation/prisma-schema-builder');

const builder = new PrismaSchemaBuilder({
  provider: 'postgresql',  // or 'mysql', 'sqlite', 'sqlserver', 'mongodb'
  previewFeatures: ['fullTextSearch'],
  binaryTargets: ['native', 'linux-musl']
});
```

### Adding Models

```javascript
// Simple model
builder.addModel({
  name: 'User',
  fields: [
    { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
    { name: 'email', type: 'String', unique: true, required: true }
  ]
});

// Model with all features
builder.addModel({
  name: 'Product',
  documentation: 'Product catalog entries',
  fields: [
    {
      name: 'id',
      type: 'String',
      primary: true,
      default: { function: 'cuid' },
      documentation: 'Unique product identifier'
    },
    {
      name: 'name',
      type: 'String',
      required: true,
      documentation: 'Product name'
    },
    {
      name: 'price',
      type: 'Decimal',
      required: true,
      dbType: 'Decimal(10, 2)'
    },
    {
      name: 'tags',
      type: 'String',
      isList: true
    },
    {
      name: 'metadata',
      type: 'Json',
      optional: true
    },
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
  relations: [
    {
      name: 'category',
      model: 'Category',
      type: 'belongsTo',
      fields: ['categoryId'],
      references: ['id'],
      onDelete: 'Cascade'
    },
    {
      name: 'reviews',
      model: 'Review',
      type: 'hasMany'
    }
  ],
  indexes: [
    ['name'],
    { fields: ['categoryId', 'createdAt'], name: 'category_date_idx' }
  ],
  uniqueConstraints: [
    { fields: ['sku'], name: 'unique_sku' }
  ],
  tableName: 'products'
});
```

### Adding Enums

```javascript
builder.addEnum('UserRole', ['USER', 'ADMIN', 'MODERATOR']);
builder.addEnum('OrderStatus', ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']);
```

### Generating Schema

```javascript
const schema = builder.generateSchema();
console.log(schema);

// Write to file
const fs = require('fs-extra');
await fs.writeFile('./prisma/schema.prisma', schema);
```

### Validation

```javascript
const isValid = builder.validateSchema();

if (!isValid) {
  const errors = builder.getValidationErrors();
  console.error('Schema validation failed:', errors);
}
```

## Migration Management

### Initialize Prisma

```javascript
const PrismaMigrationHelper = require('./automation/prisma-migration-helper');
const helper = new PrismaMigrationHelper('/path/to/project');

await helper.initializePrisma('postgresql');
```

### Development Workflow

```javascript
// 1. Format schema
await helper.formatSchema();

// 2. Validate schema
const validation = await helper.validateSchema();
if (!validation.success) {
  console.error('Validation failed:', validation.error);
}

// 3. Push schema (for rapid prototyping)
await helper.pushSchema({ skipGenerate: false });

// OR create and apply migration
await helper.applyMigrationsDev('add_user_model');

// 4. Generate client
await helper.generateClient();
```

### Production Deployment

```javascript
// Deploy pending migrations
await helper.deployMigrations();

// Generate client
await helper.generateClient();
```

### Auto-Migration

```javascript
// Complete workflow: validate, format, migrate, and generate
const result = await helper.autoMigrate('add_new_features');

if (!result.success) {
  console.error(`Failed at step: ${result.step}`, result.error);
}
```

### Quick Setup

```javascript
// Perfect for new projects or development
await helper.quickSetup('postgresql');
```

### Database Operations

```javascript
// Pull schema from existing database
await helper.pullSchema();

// Reset database (destructive!)
await helper.resetDatabase({ force: true, skipSeed: false });

// Seed database
await helper.seedDatabase();

// Check migration status
const status = await helper.getMigrationStatus();
console.log(status);

// Open Prisma Studio
await helper.openStudio(5555);
```

## Best Practices

### Naming Conventions

- **Models**: PascalCase, singular (e.g., `User`, `OrderItem`)
- **Fields**: camelCase (e.g., `firstName`, `createdAt`)
- **Enums**: PascalCase for name and SCREAMING_SNAKE_CASE for values
- **Relations**: camelCase, descriptive (e.g., `user`, `posts`, `orderItems`)

### Field Best Practices

#### Always Include Timestamps

```javascript
fields: [
  // ... other fields
  { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
  { name: 'updatedAt', type: 'DateTime', updatedAt: true }
]
```

#### Use Appropriate ID Types

```javascript
// CUID (recommended for most cases)
{ name: 'id', type: 'String', primary: true, default: { function: 'cuid' } }

// UUID
{ name: 'id', type: 'String', primary: true, default: { function: 'uuid' } }

// Auto-increment (for simple cases)
{ name: 'id', type: 'Int', primary: true, default: { function: 'autoincrement' } }
```

#### Add Indexes for Performance

```javascript
// Index foreign keys
indexes: [['userId'], ['categoryId']]

// Composite indexes for common queries
indexes: [
  { fields: ['status', 'createdAt'], name: 'status_date_idx' }
]

// Unique constraints
uniqueConstraints: [
  ['email'],
  { fields: ['organizationId', 'slug'], name: 'org_slug_unique' }
]
```

### Relation Best Practices

#### Use Referential Actions

```javascript
relations: [
  {
    name: 'user',
    model: 'User',
    type: 'belongsTo',
    fields: ['userId'],
    references: ['id'],
    onDelete: 'Cascade',      // Delete posts when user is deleted
    onUpdate: 'Cascade'       // Update foreign keys on ID change
  }
]
```

#### Common Referential Actions

- **Cascade**: Propagate changes (delete/update) to related records
- **Restrict**: Prevent deletion if related records exist
- **SetNull**: Set foreign key to NULL on deletion
- **NoAction**: Do nothing (database default)
- **SetDefault**: Set to default value

#### Name Relations Clearly

```javascript
// Good: Clear, descriptive names
relations: [
  { name: 'author', model: 'User', type: 'belongsTo' },
  { name: 'posts', model: 'Post', type: 'hasMany' },
  { name: 'assignedTasks', model: 'Task', type: 'hasMany', relationName: 'AssignedTasks' }
]

// Bad: Ambiguous names
relations: [
  { name: 'user', model: 'User', type: 'belongsTo' },  // Which user?
  { name: 'items', model: 'Task', type: 'hasMany' }    // What kind of items?
]
```

### Schema Organization

#### Order Models by Dependencies

```javascript
// 1. Models with no dependencies first
builder.addModel({ name: 'User', ... });
builder.addModel({ name: 'Category', ... });

// 2. Models that depend on others
builder.addModel({ name: 'Post', ... });  // depends on User
builder.addModel({ name: 'Product', ... });  // depends on Category

// 3. Junction/relation models last
builder.addModel({ name: 'Comment', ... });  // depends on User and Post
```

## Examples

### Complete E-commerce Schema

See `/src/automation/examples/prisma-schemas/ecommerce.js` for a full example including:
- User management
- Product catalog with categories
- Shopping cart
- Orders and order items
- Payments
- Reviews
- Addresses

### Blog Schema

See `/src/automation/examples/prisma-schemas/blog.js` for:
- User roles (Admin, Editor, Author, Subscriber)
- Posts with status (Draft, Published, Archived)
- Comments with threading
- Categories and tags (many-to-many)
- View counts and metadata

### SaaS Schema

See `/src/automation/examples/prisma-schemas/saas.js` for:
- Multi-tenancy with organizations
- User memberships and roles
- Subscription management
- Invitation system
- API keys

### Social Media Schema

See `/src/automation/examples/prisma-schemas/social.js` for:
- User profiles
- Posts with visibility controls
- Likes and comments
- Follow system
- Notifications
- Direct messaging

### Using Example Schemas

```javascript
const { getEcommerceSchema } = require('./examples/prisma-schemas/ecommerce');
const fs = require('fs-extra');

// Generate schema
const schema = getEcommerceSchema();

// Write to project
await fs.writeFile('./prisma/schema.prisma', schema);

// Apply to database
const helper = new PrismaMigrationHelper('./');
await helper.autoMigrate('initial_schema');
```

## Troubleshooting

### Common Issues

#### Schema Validation Fails

```javascript
const builder = new PrismaSchemaBuilder();
// ... add models

if (!builder.validateSchema()) {
  const errors = builder.getValidationErrors();
  errors.forEach(error => console.error(error));
}
```

**Common validation errors:**
- Missing ID field: Every model must have an `@id` field or `@@id` composite key
- Invalid relation: Referenced model doesn't exist
- Reserved word: Model or field name conflicts with Prisma keywords
- Duplicate names: Two models or fields with the same name

#### Migration Fails

```bash
# Check migration status
npx prisma migrate status

# Resolve migration issues
npx prisma migrate resolve --applied <migration_name>

# Reset and start fresh (destructive!)
npx prisma migrate reset
```

#### Client Generation Fails

```javascript
// Ensure schema is valid first
await helper.validateSchema();

// Format schema
await helper.formatSchema();

// Try generating again
await helper.generateClient();
```

#### Database Connection Issues

```javascript
// Check if database is accessible
const result = await helper.checkDatabaseConnection();

if (!result.success) {
  console.error('Database connection failed');
  // Check DATABASE_URL environment variable
  const dbUrl = await helper.getDatabaseUrl();
  console.log('Current DATABASE_URL env var:', dbUrl);
}
```

### Debug Mode

Enable detailed logging:

```javascript
// Set environment variable
process.env.DEBUG = 'prisma:*';

// Run operations
await helper.generateClient();
```

### Performance Optimization

#### Add Indexes for Common Queries

```javascript
// Bad: No indexes
{
  name: 'Post',
  fields: [
    { name: 'userId', type: 'String' },
    { name: 'status', type: 'String' },
    { name: 'createdAt', type: 'DateTime' }
  ]
}

// Good: Indexes for common query patterns
{
  name: 'Post',
  fields: [/* ... */],
  indexes: [
    ['userId'],                           // Find posts by user
    ['status'],                           // Find posts by status
    ['createdAt'],                        // Sort by date
    { fields: ['userId', 'status'] },     // Find user posts by status
    { fields: ['status', 'createdAt'] }   // Recent posts by status
  ]
}
```

## TypeScript Support

Full TypeScript definitions are available in `/src/automation/types/prisma.types.ts`:

```typescript
import {
  PrismaModelDefinition,
  PrismaSchemaBuilder,
  PrismaMigrationHelper
} from './automation/types/prisma.types';

const model: PrismaModelDefinition = {
  name: 'User',
  fields: [
    { name: 'id', type: 'String', primary: true }
  ]
};
```

## API Reference

### PrismaSchemaBuilder

#### Constructor
```javascript
new PrismaSchemaBuilder(options?: {
  provider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb',
  databaseUrl?: string,
  clientProvider?: string,
  previewFeatures?: string[]
})
```

#### Methods

- `addModel(modelDef: PrismaModelDefinition): PrismaSchemaBuilder`
- `addEnum(name: string, values: string[]): PrismaSchemaBuilder`
- `generateSchema(): string`
- `validateSchema(): boolean`
- `getValidationErrors(): string[]`
- `clear(): PrismaSchemaBuilder`
- `getModels(): PrismaModelDefinition[]`
- `getEnums(): PrismaEnumDefinition[]`

### PrismaMigrationHelper

#### Constructor
```javascript
new PrismaMigrationHelper(projectPath: string)
```

#### Methods

- `initializePrisma(provider?: string): Promise<MigrationResult>`
- `formatSchema(): Promise<MigrationResult>`
- `validateSchema(): Promise<MigrationResult>`
- `generateClient(): Promise<MigrationResult>`
- `createMigration(name: string): Promise<MigrationResult>`
- `applyMigrationsDev(name?: string): Promise<MigrationResult>`
- `deployMigrations(): Promise<MigrationResult>`
- `pushSchema(options?: PushOptions): Promise<MigrationResult>`
- `pullSchema(): Promise<MigrationResult>`
- `resetDatabase(options?: ResetOptions): Promise<MigrationResult>`
- `autoMigrate(name: string): Promise<MigrationResult>`
- `quickSetup(provider?: string): Promise<MigrationResult>`

## Contributing

To contribute to the Prisma integration:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## License

MIT License - see LICENSE file for details.
