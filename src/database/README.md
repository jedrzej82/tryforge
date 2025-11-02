# TryForge Database Migration System

A comprehensive, production-ready database migration management system for TryForge.

## Features

### Multi-Database Support
- PostgreSQL
- MySQL
- MongoDB
- SQLite

### Multi-ORM Support
- Prisma
- Sequelize
- TypeORM
- Drizzle
- Raw SQL

### Core Capabilities
- ✅ Atomic transactions
- ✅ Automatic rollback on failure
- ✅ Migration dependencies with topological sorting
- ✅ Semantic versioning for database schemas
- ✅ Schema diff and auto-generation
- ✅ Dry-run mode
- ✅ Migration validation
- ✅ Checksum verification
- ✅ Lock mechanism for concurrent safety
- ✅ Multi-environment support
- ✅ Comprehensive error handling
- ✅ Progress reporting and logging

## Quick Start

### Installation

```bash
npm install tryforge
```

### Basic Usage

```javascript
const { MigrationManager } = require('tryforge/database');

// Initialize
const manager = new MigrationManager({
  databaseType: 'postgresql',
  host: 'localhost',
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

await manager.initialize();

// Create migration
await manager.createMigration('create_users_table');

// Run migrations
await manager.migrate();

// Check status
const status = await manager.status();
console.log(status);

// Rollback
await manager.rollback({ steps: 1 });
```

### CLI Usage

```bash
# Create migration
tryforge db:migrate:create create_users_table

# Run migrations
tryforge db:migrate

# Check status
tryforge db:migrate:status

# Rollback
tryforge db:migrate:rollback

# Validate
tryforge db:migrate:validate

# Version management
tryforge db:version
tryforge db:version:bump patch
```

## Architecture

### Components

1. **MigrationManager** - Core orchestrator
2. **MigrationRegistry** - Tracks applied migrations in database
3. **MigrationDependencies** - Resolves migration order
4. **MigrationVersioning** - Semantic versioning system
5. **SchemaDiff** - Compares and generates migrations
6. **Database Adapters** - Database-specific implementations

### Directory Structure

```
src/database/
├── migration-manager.js          # Core migration orchestrator
├── migration-registry.js         # Tracks migrations in DB
├── migration-dependencies.js     # Dependency resolver
├── migration-version.js          # Versioning system
├── schema-diff.js                # Schema comparison
├── migration-errors.js           # Custom error classes
├── cli-commands.js               # CLI integration
├── index.js                      # Main exports
├── adapters/                     # Database adapters
│   ├── base-adapter.js
│   ├── postgres-adapter.js
│   ├── mysql-adapter.js
│   ├── mongodb-adapter.js
│   ├── sqlite-adapter.js
│   └── adapter-factory.js
├── config/                       # Configuration
│   └── database-config.js
├── templates/                    # Migration templates
│   ├── prisma-migration.hbs
│   ├── sequelize-migration.hbs
│   ├── typeorm-migration.hbs
│   ├── drizzle-migration.hbs
│   └── sql-migration.hbs
└── docs/                         # Documentation
    └── MIGRATION_GUIDE.md
```

## Configuration

### Environment Variables

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=postgres
DB_PASSWORD=secret

ORM_TYPE=prisma
MIGRATIONS_DIR=./migrations
MIGRATIONS_AUTO_ROLLBACK=true
MIGRATIONS_BACKUP=false
```

### Programmatic Configuration

```javascript
const config = {
  databaseType: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
  ormType: 'prisma',
  migrationsDir: './migrations',
  autoRollback: true,
  backupBeforeMigration: false
};

const manager = new MigrationManager(config);
```

## Examples

### Creating a Migration

```javascript
await manager.createMigration('add_user_roles', {
  description: 'Add roles table and user_role relationship',
  dependencies: ['20231102120000_create_users_table'],
  up: `
    CREATE TABLE roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );

    CREATE TABLE user_roles (
      user_id INTEGER REFERENCES users(id),
      role_id INTEGER REFERENCES roles(id),
      PRIMARY KEY (user_id, role_id)
    );
  `,
  down: `
    DROP TABLE user_roles;
    DROP TABLE roles;
  `
});
```

### Running Migrations with Options

```javascript
// Dry run (preview)
await manager.migrate({ dryRun: true });

// Run specific number
await manager.migrate({ step: 3 });

// Run to target
await manager.migrate({ target: '20231102120000_create_users_table' });
```

### Rollback with Options

```javascript
// Rollback last migration
await manager.rollback({ steps: 1 });

// Rollback specific batch
await manager.rollback({ batch: 5 });

// Rollback to target
await manager.rollback({ target: '20231101000000_initial' });
```

### Schema Versioning

```javascript
// Get current version
const version = await manager.versioning.getCurrentVersion();

// Bump version
await manager.versioning.bumpVersion('minor', 'Added user management');

// Compare environments
const comparison = await manager.versioning.compareEnvironments(
  'development',
  'production'
);

// Generate changelog
const changelog = await manager.versioning.generateChangelog({
  fromVersion: '1.0.0',
  toVersion: '1.5.0',
  format: 'markdown'
});
```

### Schema Diff

```javascript
const currentSchema = await manager.adapter.getSchema();
const targetSchema = await loadTargetSchema();

const diff = await manager.schemaDiff.compare(currentSchema, targetSchema);

// Generate migration from diff
const migration = await manager.schemaDiff.generateMigration(diff, {
  name: 'auto_generated_changes'
});

console.log(migration.up);   // SQL to apply
console.log(migration.down);  // SQL to rollback
```

## Testing

```javascript
const { MigrationManager } = require('tryforge/database');

describe('Migrations', () => {
  let manager;

  beforeAll(async () => {
    manager = new MigrationManager({
      databaseType: 'sqlite',
      database: ':memory:'
    });
    await manager.initialize();
  });

  afterAll(async () => {
    await manager.close();
  });

  test('should apply migrations', async () => {
    const result = await manager.migrate();
    expect(result.applied.length).toBeGreaterThan(0);
  });

  test('should rollback migrations', async () => {
    const result = await manager.rollback({ steps: 1 });
    expect(result.rolledBack.length).toBe(1);
  });
});
```

## Production Best Practices

1. **Always test migrations in development first**
2. **Use dry-run mode before production migrations**
3. **Enable automatic backups for production**
4. **Monitor migration execution time**
5. **Use semantic versioning**
6. **Write reversible migrations**
7. **Keep migrations small and focused**
8. **Document complex migrations**
9. **Test rollback procedures**
10. **Use dependency declarations**

## Error Handling

The system includes comprehensive error handling with specific error types:

- `MigrationError` - Base migration error
- `MigrationExecutionError` - Execution failures
- `MigrationValidationError` - Validation issues
- `MigrationDependencyError` - Dependency problems
- `MigrationLockError` - Lock acquisition failures
- `MigrationRollbackError` - Rollback failures
- `CircularDependencyError` - Circular dependencies
- `DatabaseConnectionError` - Connection issues

All errors include:
- Descriptive messages
- Context information
- Recovery suggestions
- Timestamp

## Performance

- Connection pooling for efficiency
- Batch operations for large datasets
- Query execution time tracking
- Slow query detection and logging
- Transaction-based execution
- Optimized dependency resolution

## Security

- Password masking in logs
- SQL injection prevention
- Lock mechanism for concurrent safety
- Checksum verification
- Environment-based configuration
- Secure connection options (SSL/TLS)

## Documentation

- [Full Migration Guide](./docs/MIGRATION_GUIDE.md) - Complete documentation
- [API Reference](./docs/API.md) - Detailed API documentation (coming soon)
- [Best Practices](./docs/BEST_PRACTICES.md) - Production guidelines (coming soon)

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: https://github.com/tryforge/tryforge/issues
- Documentation: https://docs.tryforge.dev
- Discord: https://discord.gg/tryforge
