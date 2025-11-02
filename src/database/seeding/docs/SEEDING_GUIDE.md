# TryForge Database Seeding Guide

Comprehensive guide for the TryForge database seeding system.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating Seeders](#creating-seeders)
4. [Running Seeders](#running-seeders)
5. [Data Generators](#data-generators)
6. [Dependencies](#dependencies)
7. [Configuration](#configuration)
8. [CLI Commands](#cli-commands)
9. [Best Practices](#best-practices)
10. [Advanced Topics](#advanced-topics)

## Overview

The TryForge seeding system provides a robust, feature-rich way to populate your database with realistic test data. Key features include:

- **Dependency Management**: Seeders can depend on other seeders
- **Environment-Aware**: Run different seeders in different environments
- **Idempotent**: Seeders can be run multiple times safely
- **Progress Tracking**: Built-in logging and progress reporting
- **Rollback Support**: Undo seeded data
- **Data Generators**: Reusable utilities for creating realistic data
- **Registry System**: Track which seeders have been run

## Getting Started

### Installation

First, install the required dependency:

```bash
npm install @faker-js/faker
```

### Directory Structure

```
src/database/seeding/
├── base-seeder.js          # Base class for all seeders
├── seed-manager.js         # Main orchestrator
├── seeder-registry.js      # Tracks execution
├── seed-config.js          # Configuration
├── cli-integration.js      # CLI commands
├── generators/
│   └── data-generator.js   # Data generation utilities
├── seeders/
│   ├── users-seeder.js
│   ├── products-seeder.js
│   └── ...
├── templates/
│   └── seeder-template.hbs # Template for new seeders
└── docs/
    └── SEEDING_GUIDE.md    # This file
```

## Creating Seeders

### Using CLI Generator

The easiest way to create a new seeder:

```bash
tryforge db:seed:create ProductSeeder
```

Options:
- `--table <name>`: Specify table name
- `--description <desc>`: Add description
- `--force`: Overwrite existing seeder

### Manual Creation

Create a new file in `src/database/seeding/seeders/`:

```javascript
const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class MySeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'MySeeder';
    this.dependencies = []; // Add dependencies
    this.environments = ['development', 'staging'];
    this.priority = 10; // Lower runs first
  }

  async run(db) {
    this.log('Seeding my data...');

    // Your seeding logic here
    const data = DataGenerator.generateCustom({
      name: { type: 'string' },
      email: { type: 'email' }
    }, 10);

    // Insert data
    for (const item of data) {
      await db.query(
        'INSERT INTO my_table (name, email) VALUES ($1, $2)',
        [item.name, item.email]
      );
    }

    this.log('Seeding complete!', 'success');
  }

  async rollback(db) {
    this.log('Rolling back...');
    await db.query('DELETE FROM my_table');
    this.log('Rollback complete!', 'success');
  }
}

module.exports = MySeeder;
```

### Seeder Properties

- **name**: Unique identifier for the seeder
- **dependencies**: Array of seeder names that must run first
- **environments**: Array of environments where this seeder runs
- **priority**: Execution order (lower numbers run first)
- **idempotent**: Can be run multiple times (default: true)

## Running Seeders

### Run All Seeders

```bash
tryforge db:seed
```

Options:
- `--force`: Run even if already seeded
- `--dry-run`: Preview without making changes
- `--env <environment>`: Specify environment

### Run Specific Seeder

```bash
tryforge db:seed:run UsersSeeder
```

### Rollback Seeders

```bash
# Rollback all
tryforge db:seed:rollback

# Rollback specific seeder
tryforge db:seed:rollback UsersSeeder
```

### Refresh Database

Rollback all seeders and re-run them:

```bash
tryforge db:seed:refresh
```

Options:
- `--force`: Force refresh in production (dangerous!)
- `--no-truncate`: Don't truncate tables
- `--no-clear-registry`: Keep registry data

### List Seeders

```bash
tryforge db:seed:list
```

Shows all available seeders with their status.

### View Statistics

```bash
tryforge db:seed:stats
```

Shows execution statistics.

## Data Generators

The `DataGenerator` class provides utilities for creating realistic test data.

### Generate Users

```javascript
const users = DataGenerator.generateUsers(50, {
  roles: ['user', 'moderator'],
  includeAdmin: true,
  verified: true
});
```

### Generate Products

```javascript
const products = DataGenerator.generateProducts(100, categoryIds);
```

### Generate Orders

```javascript
const orders = DataGenerator.generateOrders(200, userIds, products);
```

### Generate Blog Posts

```javascript
const posts = DataGenerator.generatePosts(50, authorIds);
```

### Generate Reviews

```javascript
const reviews = DataGenerator.generateReviews(300, productIds, userIds);
```

### Generate Custom Data

```javascript
const data = DataGenerator.generateCustom({
  name: { type: 'string' },
  email: { type: 'email' },
  age: { type: 'number', options: { min: 18, max: 80 } },
  verified: { type: 'boolean' },
  joinDate: { type: 'date' }
}, 100);
```

Available field types:
- `string`, `email`, `url`, `phone`
- `number`, `float`, `boolean`
- `date`, `uuid`
- `address`, `city`, `country`, `company`
- `paragraph`
- `array` (with options.values)

## Dependencies

### Defining Dependencies

Seeders can depend on other seeders:

```javascript
class OrdersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'OrdersSeeder';
    this.dependencies = ['UsersSeeder', 'ProductsSeeder'];
  }
}
```

The seed manager will:
1. Resolve dependencies
2. Detect circular dependencies
3. Run seeders in correct order

### Dependency Resolution

```
UsersSeeder (priority: 1)
  └─> PostsSeeder (priority: 5)
        └─> CommentsSeeder (priority: 7)

CategoriesSeeder (priority: 2)
  └─> ProductsSeeder (priority: 3)
        └─> OrdersSeeder (priority: 4)
        └─> ReviewsSeeder (priority: 6)
```

Execution order: UsersSeeder → CategoriesSeeder → ProductsSeeder → OrdersSeeder → PostsSeeder → ReviewsSeeder → CommentsSeeder

## Configuration

Edit `src/database/seeding/seed-config.js`:

### Environment Settings

```javascript
environments: {
  development: {
    runSeeders: true,
    counts: {
      users: 50,
      products: 100
    },
    options: {
      skipIfExists: true
    }
  }
}
```

### Seeder Options

```javascript
options: {
  batchSize: 100,         // Insert batch size
  batchDelay: 0,          // Delay between batches (ms)
  maxRetries: 3,          // Retry attempts
  retryDelay: 1000,       // Retry delay (ms)
  showProgress: true,     // Show progress logs
  verbose: false,         // Verbose logging
  dryRun: false,          // Dry run mode
  truncateBefore: false,  // Truncate before seeding
  checkRegistry: true,    // Check execution registry
  skipIfExists: false,    // Skip if already run
  continueOnError: false, // Continue on error
  force: false            // Force run
}
```

### Custom Settings

```javascript
custom: {
  defaultPassword: 'password123',
  useRealImages: false,
  imageProvider: 'faker',
  locale: 'en',
  dataQuality: 'high'
}
```

## CLI Commands

### Available Commands

```bash
# Run all seeders
tryforge db:seed

# Run specific seeder
tryforge db:seed:run UsersSeeder

# Rollback all seeders
tryforge db:seed:rollback

# Rollback specific seeder
tryforge db:seed:rollback UsersSeeder

# List all seeders
tryforge db:seed:list

# Refresh database
tryforge db:seed:refresh

# Create new seeder
tryforge db:seed:create ProductSeeder

# View statistics
tryforge db:seed:stats
```

### Command Options

```bash
# Dry run (preview changes)
tryforge db:seed --dry-run

# Force run (ignore registry)
tryforge db:seed --force

# Specify environment
tryforge db:seed --env staging

# Continue on error
tryforge db:seed --continue-on-error
```

## Best Practices

### 1. Use Dependencies

Always declare dependencies to ensure correct execution order:

```javascript
class OrdersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.dependencies = ['UsersSeeder', 'ProductsSeeder'];
  }
}
```

### 2. Make Seeders Idempotent

Seeders should be safe to run multiple times:

```javascript
async run(db) {
  // Check if data exists
  const existing = await db.query('SELECT COUNT(*) FROM users');
  if (existing.rows[0].count > 0) {
    this.log('Data already exists, skipping...', 'warn');
    return;
  }

  // Seed data
  // ...
}
```

### 3. Use Batch Inserts

For large datasets, insert in batches:

```javascript
const batches = this.chunk(data, 100);

for (const batch of batches) {
  await db.users.createMany(batch);
  this.logProgress(inserted, total, 'users');
}
```

### 4. Handle Errors Gracefully

Use try-catch and proper logging:

```javascript
async run(db) {
  try {
    // Seeding logic
  } catch (error) {
    this.log(`Error: ${error.message}`, 'error');
    throw error;
  }
}
```

### 5. Set Appropriate Priorities

Lower priority numbers run first:

```javascript
// Run first
UsersSeeder.priority = 1

// Run after users
PostsSeeder.priority = 5
```

### 6. Environment-Specific Seeding

Only run seeders in appropriate environments:

```javascript
this.environments = ['development', 'staging']; // Never production!
```

### 7. Use Data Generators

Leverage built-in generators for consistency:

```javascript
const users = DataGenerator.generateUsers(50, {
  includeAdmin: true
});
```

### 8. Implement Rollback

Always implement rollback for cleanup:

```javascript
async rollback(db) {
  await db.query('DELETE FROM my_table WHERE created_by_seeder = true');
}
```

## Advanced Topics

### Custom Data Generator

Create a custom generator for your domain:

```javascript
class MyDataGenerator extends DataGenerator {
  static generateProducts(count) {
    const products = [];
    for (let i = 0; i < count; i++) {
      products.push({
        // Custom product generation logic
      });
    }
    return products;
  }
}
```

### Database-Specific Implementation

Handle different database types:

```javascript
async run(db) {
  if (db.query) {
    // PostgreSQL/MySQL
    await db.query('INSERT INTO ...');
  } else if (db.users && db.users.create) {
    // ORM (Sequelize, TypeORM, etc.)
    await db.users.create({});
  } else if (db.collection) {
    // MongoDB
    await db.collection('users').insertOne({});
  }
}
```

### Retry Logic

Use built-in retry mechanism:

```javascript
await this.retry(async () => {
  await db.query('INSERT INTO ...');
}, 3, 1000); // 3 retries, 1 second delay
```

### Progress Tracking

Track progress for long-running seeders:

```javascript
for (let i = 0; i < data.length; i++) {
  await db.insert(data[i]);
  this.logProgress(i + 1, data.length, 'records');
}
```

### Hooks

Use hooks in configuration:

```javascript
hooks: {
  beforeAll: async (db) => {
    // Start transaction
  },
  afterAll: async (db, stats) => {
    // Commit transaction, log stats
  },
  onError: async (seeder, error, db) => {
    // Rollback, send notification
  }
}
```

### Testing Seeders

Write tests for your seeders:

```javascript
const UsersSeeder = require('./users-seeder');

test('UsersSeeder creates users', async () => {
  const mockDb = { /* mock database */ };
  const seeder = new UsersSeeder();

  await seeder.run(mockDb);

  expect(mockDb.users.length).toBe(50);
});
```

### Relationships

Seed many-to-many relationships:

```javascript
class RelationshipsSeeder extends BaseSeeder {
  async run(db) {
    const users = await db.query('SELECT id FROM users');
    const posts = await db.query('SELECT id FROM posts');

    for (const user of users.rows) {
      const likedPosts = this.randomElements(posts.rows, 1, 10);

      for (const post of likedPosts) {
        await db.query(
          'INSERT INTO user_likes (user_id, post_id) VALUES ($1, $2)',
          [user.id, post.id]
        );
      }
    }
  }
}
```

## Troubleshooting

### Circular Dependency Error

```
Error: Circular dependency detected: PostsSeeder
```

**Solution**: Review dependencies and remove circular references.

### Seeder Already Run

```
⊘ Skipping UsersSeeder (already run)
```

**Solution**: Use `--force` flag to re-run:
```bash
tryforge db:seed --force
```

### Connection Error

```
Error: Failed to connect to database
```

**Solution**: Check `DATABASE_URL` in `.env` file.

### Permission Error

```
Error: permission denied for table users
```

**Solution**: Ensure database user has INSERT permissions.

## Examples

See the included example seeders in `src/database/seeding/seeders/`:
- `users-seeder.js` - User management
- `products-seeder.js` - E-commerce products
- `orders-seeder.js` - Order processing
- `posts-seeder.js` - Blog posts
- `reviews-seeder.js` - Product reviews

## Support

For issues or questions:
- Check the [TryForge documentation](https://github.com/jedrzej82/tryforge)
- Open an issue on GitHub
- Review the example seeders

## License

MIT License - see LICENSE file for details.
