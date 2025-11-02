# TryForge Database Migration Guide

Complete guide to using the TryForge database migration system.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Creating Migrations](#creating-migrations)
5. [Running Migrations](#running-migrations)
6. [Rollback Operations](#rollback-operations)
7. [Migration Dependencies](#migration-dependencies)
8. [Schema Versioning](#schema-versioning)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Topics](#advanced-topics)

---

## Introduction

TryForge's migration system provides a robust, production-ready solution for managing database schema changes across multiple databases and ORMs.

### Supported Databases
- PostgreSQL
- MySQL
- MongoDB
- SQLite

### Supported ORMs
- Prisma
- Sequelize
- TypeORM
- Drizzle
- Raw SQL

### Key Features
- Atomic transactions
- Automatic rollback on failure
- Migration dependencies
- Schema versioning
- Dry-run mode
- Migration validation
- Multi-environment support

---

## Getting Started

### Installation

The migration system is built into TryForge. No additional installation required.

### Quick Start

1. **Configure Database Connection**

Create a `.env` file in your project root:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=postgres
DB_PASSWORD=your_password

# ORM Configuration
ORM_TYPE=prisma

# Migration Settings
MIGRATIONS_DIR=./migrations
MIGRATIONS_AUTO_ROLLBACK=true
```

2. **Initialize Migration System**

```bash
tryforge db:migrate:status
```

This will create the migrations table and initialize the system.

3. **Create Your First Migration**

```bash
tryforge db:migrate:create create_users_table
```

4. **Edit the Migration File**

Edit the generated migration file in `migrations/` directory.

5. **Run Migrations**

```bash
tryforge db:migrate
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_TYPE` | Database type (postgresql, mysql, mongodb, sqlite) | postgresql |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | tryforge_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `DATABASE_URL` | Connection string (overrides individual settings) | - |
| `ORM_TYPE` | ORM type (prisma, sequelize, typeorm, drizzle, raw) | prisma |
| `MIGRATIONS_DIR` | Directory for migration files | ./migrations |
| `MIGRATIONS_TABLE` | Table name for tracking migrations | _migrations |
| `MIGRATIONS_AUTO_ROLLBACK` | Auto-rollback on failure | true |
| `MIGRATIONS_BACKUP` | Backup before migration | false |
| `NODE_ENV` | Environment (development, staging, production) | development |

### Programmatic Configuration

```javascript
const { MigrationManager } = require('tryforge/database');

const manager = new MigrationManager({
  databaseType: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
  ormType: 'prisma',
  migrationsDir: './migrations',
  autoRollback: true
});
```

---

## Creating Migrations

### Basic Migration

```bash
tryforge db:migrate:create create_users_table
```

This generates a migration file:

```sql
-- Migration: create_users_table
-- Created: 20231102120000

-- Up Migration
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration (for rollback)
DROP TABLE IF EXISTS users;
```

### Migration with Description

```bash
tryforge db:migrate:create add_user_roles --description "Add roles column to users table"
```

### Migration with Dependencies

```bash
tryforge db:migrate:create add_user_profiles --dependencies "20231102120000_create_users_table"
```

### ORM-Specific Migrations

**Sequelize:**
```bash
tryforge db:migrate:create create_posts --template sequelize
```

**TypeORM:**
```bash
tryforge db:migrate:create create_comments --template typeorm
```

**Drizzle:**
```bash
tryforge db:migrate:create create_tags --template drizzle
```

---

## Running Migrations

### Apply All Pending Migrations

```bash
tryforge db:migrate
```

### Dry Run (Preview Changes)

```bash
tryforge db:migrate --dry-run
```

### Run Specific Number of Migrations

```bash
tryforge db:migrate --step 3
```

### Run to Specific Migration

```bash
tryforge db:migrate --target 20231102120000_create_users_table
```

### Check Migration Status

```bash
tryforge db:migrate:status
```

Output:
```
📊 Migration Status

Current Schema Version: 1.2.3

Statistics:
  Total migrations: 15
  Applied: 12
  Pending: 3
  Failed: 0
  Batches: 5
```

---

## Rollback Operations

### Rollback Last Migration

```bash
tryforge db:migrate:rollback
```

### Rollback Multiple Migrations

```bash
tryforge db:migrate:rollback -n 3
```

### Rollback Specific Batch

```bash
tryforge db:migrate:rollback --batch 5
```

### Rollback to Specific Migration

```bash
tryforge db:migrate:rollback --target 20231101120000_initial_schema
```

### Reset Database (Rollback All)

```bash
tryforge db:migrate:reset
```

⚠️ **Warning:** This will rollback all migrations and delete all data!

### Refresh Database (Rollback and Re-run)

```bash
tryforge db:migrate:refresh
```

---

## Migration Dependencies

### Declaring Dependencies

In your migration file:

```sql
-- Migration: add_user_profiles
-- Dependencies: 20231102120000_create_users_table

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  bio TEXT
);
```

### Complex Dependencies

```bash
tryforge db:migrate:create add_post_tags \
  --dependencies "create_posts,create_tags"
```

### Automatic Dependency Resolution

The migration system automatically:
- Resolves dependency order
- Detects circular dependencies
- Validates all dependencies exist

### Validate Migrations

```bash
tryforge db:migrate:validate
```

This checks for:
- Missing dependencies
- Circular dependencies
- Checksum mismatches
- SQL syntax errors

---

## Schema Versioning

### Semantic Versioning

TryForge uses semantic versioning for database schemas:
- **Major:** Breaking changes
- **Minor:** New features (backward compatible)
- **Patch:** Bug fixes

### View Current Version

```bash
tryforge db:version
```

### Bump Version

```bash
# Patch version (1.2.3 -> 1.2.4)
tryforge db:version:bump patch

# Minor version (1.2.3 -> 1.3.0)
tryforge db:version:bump minor

# Major version (1.2.3 -> 2.0.0)
tryforge db:version:bump major
```

### Tag Version

```bash
tryforge db:version:tag 1.2.3 "stable-release" \
  --description "Production release with user management"
```

### Version History

```bash
tryforge db:version --history
```

### Compare Environments

```javascript
const comparison = await manager.versioning.compareEnvironments(
  'development',
  'production'
);

console.log(comparison);
// {
//   env1: { environment: 'development', version: '1.3.0' },
//   env2: { environment: 'production', version: '1.2.3' },
//   comparison: 1,  // development is ahead
//   compatible: true
// }
```

---

## Best Practices

### 1. Use Descriptive Names

✅ Good:
```bash
tryforge db:migrate:create add_user_email_verification
```

❌ Bad:
```bash
tryforge db:migrate:create update_users
```

### 2. Always Write Down Migrations

Every up migration must have a corresponding down migration:

```sql
-- Up Migration
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Down Migration
ALTER TABLE users DROP COLUMN phone;
```

### 3. Use Transactions

All migrations run in transactions by default. For complex migrations:

```sql
BEGIN;

-- Migration statements here
CREATE TABLE ...;
ALTER TABLE ...;
INSERT INTO ...;

COMMIT;
```

### 4. Test Migrations

Always test in development before production:

```bash
# Test on development
tryforge db:migrate --dry-run

# Apply and test
tryforge db:migrate

# Test rollback
tryforge db:migrate:rollback --dry-run
```

### 5. Backup Before Production Migrations

```bash
# Enable automatic backups
export MIGRATIONS_BACKUP=true

# Or manual backup
tryforge db:backup

# Then migrate
tryforge db:migrate
```

### 6. Small, Incremental Changes

Break large changes into smaller migrations:

```bash
tryforge db:migrate:create add_users_table
tryforge db:migrate:create add_posts_table
tryforge db:migrate:create add_user_post_relationship
```

### 7. Handle Data Migrations Carefully

```sql
-- Up Migration
-- 1. Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- 2. Migrate data
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);

-- 3. Make NOT NULL after data is migrated
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- 4. Remove old columns
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

### 8. Use Dry Run for Risky Operations

```bash
tryforge db:migrate:reset --dry-run
```

---

## Troubleshooting

### Migration Failed

**Problem:** Migration execution failed

**Solution:**
1. Check error message in logs
2. Review migration SQL syntax
3. Check database permissions
4. Verify database connection

```bash
# View detailed error
tryforge db:migrate:status

# Check failed migrations
tryforge db:migrate:validate
```

### Checksum Mismatch

**Problem:** "Migration checksum mismatch" error

**Cause:** Migration file was modified after being applied

**Solution:**
1. Never modify applied migrations
2. Create a new migration to fix issues
3. If absolutely necessary, manually update checksum in migrations table

### Lock Timeout

**Problem:** "Failed to acquire migration lock"

**Cause:** Another migration process is running

**Solution:**
1. Wait for other process to complete
2. If process is stuck, manually release lock:

```sql
-- PostgreSQL
SELECT pg_advisory_unlock_all();

-- MySQL
SELECT RELEASE_ALL_LOCKS();
```

### Circular Dependencies

**Problem:** "Circular dependency detected"

**Solution:**
Review and reorganize migration dependencies:

```bash
tryforge db:migrate:validate
```

### Migration Stuck

**Problem:** Migration appears to hang

**Solution:**
1. Check database query logs
2. Look for long-running queries
3. Check for locks

```bash
# Increase timeout
MIGRATIONS_TIMEOUT=600000 tryforge db:migrate
```

---

## Advanced Topics

### Custom Migration Templates

Create custom templates in `src/database/templates/`:

```handlebars
-- Custom Migration Template
-- Name: {{name}}
-- Author: {{author}}
-- {{timestamp}}

{{#if up}}
{{{up}}}
{{/if}}
```

Use it:
```bash
tryforge db:migrate:create my_migration --template custom
```

### Programmatic Migrations

```javascript
const { MigrationManager } = require('tryforge/database');

async function runMigrations() {
  const manager = new MigrationManager();
  await manager.initialize();

  // Create migration
  await manager.createMigration('add_new_feature', {
    description: 'Add new feature',
    up: 'CREATE TABLE features (...);',
    down: 'DROP TABLE features;'
  });

  // Run migrations
  const result = await manager.migrate({ dryRun: false });

  console.log(`Applied ${result.applied.length} migrations`);

  await manager.close();
}
```

### Multi-Database Setup

```javascript
// Database 1: User data
const usersDB = new MigrationManager({
  database: 'users_db',
  migrationsDir: './migrations/users'
});

// Database 2: Analytics
const analyticsDB = new MigrationManager({
  database: 'analytics_db',
  migrationsDir: './migrations/analytics'
});

// Run both
await usersDB.migrate();
await analyticsDB.migrate();
```

### Schema Diff and Auto-Migration

```javascript
const diff = await manager.schemaDiff.compare(oldSchema, newSchema);

const migration = await manager.schemaDiff.generateMigration(diff, {
  name: 'auto_generated_migration'
});

console.log(migration.up);  // SQL to apply changes
console.log(migration.down); // SQL to rollback
```

### Environment-Specific Migrations

```bash
# Development
NODE_ENV=development tryforge db:migrate

# Staging
NODE_ENV=staging tryforge db:migrate

# Production
NODE_ENV=production tryforge db:migrate
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
steps:
  - name: Run Migrations
    run: |
      tryforge db:migrate:validate
      tryforge db:migrate --dry-run
      tryforge db:migrate
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Common Pitfalls

### ❌ Don't Do This

1. **Modifying Applied Migrations**
   ```bash
   # Never edit a migration that has already been applied
   ```

2. **Running Migrations Without Testing**
   ```bash
   # Always test first
   tryforge db:migrate --dry-run
   ```

3. **Forgetting Down Migrations**
   ```sql
   -- Always provide rollback
   -- Down Migration
   -- ...
   ```

4. **Large Data Migrations Without Batching**
   ```sql
   -- Bad: Updates all rows at once
   UPDATE users SET status = 'active';

   -- Good: Batch updates
   -- Split into multiple smaller migrations
   ```

### ✅ Do This Instead

1. **Create New Migrations for Changes**
2. **Test Rollbacks**
3. **Use Dry Run Mode**
4. **Backup Production Data**
5. **Monitor Migration Execution**

---

## Quick Reference

### Common Commands

```bash
# Create migration
tryforge db:migrate:create <name>

# Run migrations
tryforge db:migrate

# Check status
tryforge db:migrate:status

# Rollback
tryforge db:migrate:rollback

# Reset database
tryforge db:migrate:reset

# Validate migrations
tryforge db:migrate:validate

# View version
tryforge db:version

# Bump version
tryforge db:version:bump <major|minor|patch>

# Generate diff
tryforge db:diff
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying |
| `--force` | Skip confirmation prompts |
| `-n, --steps <number>` | Number of migrations to run/rollback |
| `--target <name>` | Run/rollback to specific migration |
| `--batch <number>` | Rollback specific batch |
| `--description <text>` | Add description to migration |
| `--dependencies <list>` | Comma-separated list of dependencies |
| `--template <orm>` | Use specific ORM template |

---

## Support

For issues or questions:

- GitHub: https://github.com/tryforge/tryforge
- Documentation: https://docs.tryforge.dev
- Discord: https://discord.gg/tryforge

---

## License

MIT License - see LICENSE file for details
