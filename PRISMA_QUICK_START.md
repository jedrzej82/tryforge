# Prisma Integration - Quick Start Guide

## 5-Minute Quick Start

### 1. Simple Model Generation

```javascript
const { PrismaSchemaBuilder } = require('./src/automation/prisma-schema-builder');

// Create builder
const builder = new PrismaSchemaBuilder({
  provider: 'postgresql'  // or 'mysql', 'sqlite', etc.
});

// Add a simple model
builder.addModel({
  name: 'User',
  fields: [
    {
      name: 'id',
      type: 'String',
      primary: true,
      default: { function: 'cuid' }
    },
    {
      name: 'email',
      type: 'String',
      unique: true,
      required: true
    },
    {
      name: 'name',
      type: 'String',
      required: true
    },
    {
      name: 'createdAt',
      type: 'DateTime',
      default: { function: 'now' }
    }
  ]
});

// Generate schema
const schema = builder.generateSchema();
console.log(schema);

// Write to file
const fs = require('fs-extra');
await fs.writeFile('./prisma/schema.prisma', schema);
```

### 2. Using Pre-built Examples

```javascript
const { examples } = require('./src/automation/prisma-index');
const fs = require('fs-extra');

// Get a complete e-commerce schema
const ecommerceSchema = examples.ecommerce();

// Or get a blog schema
const blogSchema = examples.blog();

// Or get a SaaS schema
const saasSchema = examples.saas();

// Write to your project
await fs.writeFile('./prisma/schema.prisma', ecommerceSchema);
```

### 3. Complete Auto-Migration Workflow

```javascript
const { PrismaMigrationHelper } = require('./src/automation/prisma-migration-helper');

// Initialize helper
const helper = new PrismaMigrationHelper('./your-project-path');

// Quick setup (for new projects)
await helper.quickSetup('postgresql');

// OR for existing projects with schema changes:
// Auto-migrate: validates, formats, migrates, and generates client
await helper.autoMigrate('add_new_features');
```

### 4. Models with Relations

```javascript
const builder = new PrismaSchemaBuilder();

// Add User model
builder.addModel({
  name: 'User',
  fields: [
    { name: 'id', type: 'String', primary: true },
    { name: 'email', type: 'String', unique: true, required: true }
  ],
  relations: [
    { name: 'posts', model: 'Post', type: 'hasMany' }
  ]
});

// Add Post model with relation back to User
builder.addModel({
  name: 'Post',
  fields: [
    { name: 'id', type: 'String', primary: true },
    { name: 'title', type: 'String', required: true },
    { name: 'userId', type: 'String', required: true }
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
  indexes: [['userId']]  // Index foreign key
});

const schema = builder.generateSchema();
```

### 5. With Enums

```javascript
const builder = new PrismaSchemaBuilder();

// Add enum
builder.addEnum('UserRole', ['USER', 'ADMIN', 'MODERATOR']);

// Use enum in model
builder.addModel({
  name: 'User',
  fields: [
    { name: 'id', type: 'String', primary: true },
    { name: 'email', type: 'String', unique: true },
    { name: 'role', type: 'UserRole', default: 'USER' }
  ]
});

const schema = builder.generateSchema();
```

### 6. All Features Example

```javascript
const builder = new PrismaSchemaBuilder({
  provider: 'postgresql',
  previewFeatures: ['fullTextSearch']
});

builder.addEnum('Status', ['ACTIVE', 'INACTIVE']);

builder.addModel({
  name: 'Product',
  documentation: 'Product catalog',
  fields: [
    // Primary key with CUID
    {
      name: 'id',
      type: 'String',
      primary: true,
      default: { function: 'cuid' }
    },

    // Required fields
    { name: 'name', type: 'String', required: true },
    { name: 'price', type: 'Decimal', required: true },

    // Optional field
    { name: 'description', type: 'String', optional: true },

    // Enum field
    { name: 'status', type: 'Status', default: 'ACTIVE' },

    // JSON field
    { name: 'metadata', type: 'Json', optional: true },

    // Array field
    { name: 'tags', type: 'String', isList: true },

    // Foreign key
    { name: 'categoryId', type: 'String', required: true },

    // Timestamps
    { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
    { name: 'updatedAt', type: 'DateTime', updatedAt: true }
  ],
  relations: [
    {
      name: 'category',
      model: 'Category',
      type: 'belongsTo',
      fields: ['categoryId'],
      references: ['id'],
      onDelete: 'Cascade'
    }
  ],
  indexes: [
    ['name'],                    // Single field index
    ['categoryId'],              // Foreign key index
    {
      fields: ['status', 'createdAt'],
      name: 'status_date_idx'    // Composite index with name
    }
  ],
  uniqueConstraints: [
    ['name', 'categoryId']       // Composite unique
  ]
});

const schema = builder.generateSchema();
```

## Common Workflows

### Workflow 1: New Project Setup

```javascript
const { utils } = require('./src/automation/prisma-index');

// 1. Quick setup
await utils.quickSetup('./project', 'postgresql');

// 2. Add your schema (use example or build your own)
const { examples } = require('./src/automation/prisma-index');
const schema = examples.saas();  // or build custom

// 3. Write schema
await fs.writeFile('./project/prisma/schema.prisma', schema);

// 4. Apply to database
const helper = new PrismaMigrationHelper('./project');
await helper.autoMigrate('initial_schema');
```

### Workflow 2: Add New Model to Existing Project

```javascript
const { ModelGenerator } = require('./src/automation/model-generator');

const generator = new ModelGenerator();

const newModel = {
  name: 'Product',
  fields: [
    { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
    { name: 'name', type: 'String', required: true },
    { name: 'price', type: 'Decimal', required: true }
  ]
};

await generator.generateModels([newModel], './project', {
  orm: 'prisma',
  formatSchema: true,      // Auto-format
  validateSchema: true,    // Auto-validate
  autoMigrate: true,       // Auto-migrate
  generateClient: true     // Regenerate client
});
```

### Workflow 3: Migrate Existing Schema

```javascript
const { PrismaMigrationHelper } = require('./src/automation/prisma-migration-helper');

const helper = new PrismaMigrationHelper('./project');

// Option 1: Full migration (recommended for production)
await helper.autoMigrate('add_products');

// Option 2: Quick push (for development/prototyping)
await helper.pushSchema();

// Option 3: Manual steps
await helper.formatSchema();
await helper.validateSchema();
await helper.applyMigrationsDev('add_products');
await helper.generateClient();
```

### Workflow 4: Pull Existing Database Schema

```javascript
const helper = new PrismaMigrationHelper('./project');

// Pull schema from existing database
await helper.pullSchema();

// This updates your schema.prisma with existing tables
```

## TypeScript Usage

```typescript
import {
  PrismaSchemaBuilder,
  PrismaModelDefinition,
  PrismaFieldDefinition
} from './src/automation/types/prisma.types';

// Type-safe model definition
const userModel: PrismaModelDefinition = {
  name: 'User',
  fields: [
    {
      name: 'id',
      type: 'String',
      primary: true,
      default: { function: 'cuid' }
    } as PrismaFieldDefinition
  ]
};

// Type-safe builder
const builder = new PrismaSchemaBuilder({
  provider: 'postgresql'
});

builder.addModel(userModel);
```

## Testing Your Schema

```javascript
const { PrismaSchemaBuilder } = require('./src/automation/prisma-schema-builder');

const builder = new PrismaSchemaBuilder();

// Add your models
builder.addModel({ /* ... */ });

// Validate before using
if (!builder.validateSchema()) {
  const errors = builder.getValidationErrors();
  console.error('Schema validation failed:');
  errors.forEach(error => console.error('  -', error));
  process.exit(1);
}

console.log('Schema is valid!');
```

## Common Patterns

### Pattern 1: E-commerce Product with Variants

```javascript
builder.addModel({
  name: 'Product',
  fields: [
    { name: 'id', type: 'String', primary: true },
    { name: 'name', type: 'String', required: true }
  ],
  relations: [
    { name: 'variants', model: 'ProductVariant', type: 'hasMany' }
  ]
});

builder.addModel({
  name: 'ProductVariant',
  fields: [
    { name: 'id', type: 'String', primary: true },
    { name: 'productId', type: 'String', required: true },
    { name: 'sku', type: 'String', unique: true, required: true },
    { name: 'price', type: 'Decimal', required: true }
  ],
  relations: [
    {
      name: 'product',
      model: 'Product',
      type: 'belongsTo',
      fields: ['productId'],
      references: ['id'],
      onDelete: 'Cascade'
    }
  ]
});
```

### Pattern 2: User Authentication

```javascript
builder.addModel({
  name: 'User',
  fields: [
    { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
    { name: 'email', type: 'String', unique: true, required: true },
    { name: 'password', type: 'String', required: true },
    { name: 'emailVerified', type: 'Boolean', default: false },
    { name: 'lastLoginAt', type: 'DateTime', optional: true },
    { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
    { name: 'updatedAt', type: 'DateTime', updatedAt: true }
  ],
  indexes: [['email'], ['emailVerified']]
});
```

### Pattern 3: Many-to-Many with Junction Table

```javascript
// Implicit many-to-many (Prisma handles junction table)
builder.addModel({
  name: 'Post',
  fields: [
    { name: 'id', type: 'String', primary: true }
  ],
  relations: [
    { name: 'tags', model: 'Tag', type: 'manyToMany' }
  ]
});

builder.addModel({
  name: 'Tag',
  fields: [
    { name: 'id', type: 'String', primary: true }
  ],
  relations: [
    { name: 'posts', model: 'Post', type: 'manyToMany' }
  ]
});

// OR explicit junction table for additional fields
builder.addModel({
  name: 'PostTag',
  fields: [
    { name: 'postId', type: 'String', required: true },
    { name: 'tagId', type: 'String', required: true },
    { name: 'addedAt', type: 'DateTime', default: { function: 'now' } }
  ],
  compositeId: ['postId', 'tagId'],
  relations: [
    { name: 'post', model: 'Post', type: 'belongsTo', fields: ['postId'], references: ['id'] },
    { name: 'tag', model: 'Tag', type: 'belongsTo', fields: ['tagId'], references: ['id'] }
  ]
});
```

## Troubleshooting

### Issue: Schema Validation Fails

```javascript
const builder = new PrismaSchemaBuilder();
// ... add models

if (!builder.validateSchema()) {
  const errors = builder.getValidationErrors();
  console.error('Validation errors:', errors);
  // Fix issues and try again
}
```

### Issue: Migration Fails

```javascript
const helper = new PrismaMigrationHelper('./project');

// Check what's wrong
const status = await helper.getMigrationStatus();
console.log(status);

// Try validating schema first
const validation = await helper.validateSchema();
if (!validation.success) {
  console.error('Schema issues:', validation.error);
}
```

## Next Steps

1. **Read full documentation**: `src/automation/docs/PRISMA_INTEGRATION.md`
2. **Check examples**: `src/automation/examples/prisma-schemas/`
3. **Run tests**: `npm test -- src/automation/__tests__/prisma-*.test.js`
4. **Start building**: Use the patterns above for your project

## Resources

- Full Documentation: `/src/automation/docs/PRISMA_INTEGRATION.md`
- Example Schemas: `/src/automation/examples/prisma-schemas/`
- Type Definitions: `/src/automation/types/prisma.types.ts`
- Test Examples: `/src/automation/__tests__/`

---

**Ready to go!** Pick a pattern above and start building your schema.
