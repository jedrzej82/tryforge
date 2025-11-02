# TryForge Database Seeding System

A comprehensive, production-ready database seeding system for TryForge applications.

## Features

✅ **Dependency Management** - Automatic resolution of seeder dependencies
✅ **Environment-Aware** - Different seeders for different environments
✅ **Idempotent** - Safe to run multiple times
✅ **Progress Tracking** - Built-in logging and progress reporting
✅ **Rollback Support** - Undo seeded data
✅ **Data Generators** - Realistic test data generation with Faker.js
✅ **Registry System** - Track seeder execution history
✅ **CLI Integration** - Easy-to-use command-line interface
✅ **Multi-Database Support** - PostgreSQL, MySQL, MongoDB, and more

## Quick Start

### 1. Install Dependencies

```bash
npm install @faker-js/faker
```

### 2. Run All Seeders

```bash
tryforge db:seed
```

### 3. Create a New Seeder

```bash
tryforge db:seed:create ProductSeeder
```

## Available Commands

```bash
tryforge db:seed                      # Run all seeders
tryforge db:seed:run UsersSeeder      # Run specific seeder
tryforge db:seed:rollback             # Rollback all seeders
tryforge db:seed:rollback UsersSeeder # Rollback specific seeder
tryforge db:seed:list                 # List all seeders
tryforge db:seed:refresh              # Rollback and reseed
tryforge db:seed:create ProductSeeder # Create new seeder
tryforge db:seed:stats                # View statistics
```

## Example Seeder

```javascript
const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class UsersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'UsersSeeder';
    this.dependencies = [];
    this.environments = ['development', 'staging'];
  }

  async run(db) {
    this.log('Seeding users...');

    const users = DataGenerator.generateUsers(50, {
      includeAdmin: true
    });

    for (const user of users) {
      await db.query(
        'INSERT INTO users (email, name, password) VALUES ($1, $2, $3)',
        [user.email, user.name, user.password]
      );
    }

    this.log('Users seeded successfully!', 'success');
  }

  async rollback(db) {
    this.log('Rolling back users...');
    await db.query('DELETE FROM users');
  }
}

module.exports = UsersSeeder;
```

## Directory Structure

```
src/database/seeding/
├── base-seeder.js          # Base class for all seeders
├── seed-manager.js         # Main orchestrator
├── seeder-registry.js      # Execution tracking
├── seed-config.js          # Configuration
├── cli-integration.js      # CLI commands
├── index.js                # Main exports
├── generators/
│   └── data-generator.js   # Data generation utilities
├── seeders/                # Your seeders go here
│   ├── users-seeder.js
│   ├── products-seeder.js
│   └── ...
├── templates/
│   └── seeder-template.hbs # Template for new seeders
└── docs/
    ├── README.md           # This file
    └── SEEDING_GUIDE.md    # Comprehensive guide
```

## Documentation

📖 **[Complete Seeding Guide](./docs/SEEDING_GUIDE.md)** - Comprehensive documentation

## Key Concepts

### Dependencies

Seeders can depend on other seeders to ensure correct execution order:

```javascript
class OrdersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.dependencies = ['UsersSeeder', 'ProductsSeeder'];
  }
}
```

### Environments

Control which seeders run in which environments:

```javascript
this.environments = ['development', 'staging']; // Not in production!
```

### Data Generators

Use built-in generators for realistic data:

```javascript
const users = DataGenerator.generateUsers(50);
const products = DataGenerator.generateProducts(100, categoryIds);
const orders = DataGenerator.generateOrders(200, userIds, products);
```

### Idempotency

Seeders can be run multiple times safely:

```javascript
async run(db) {
  const existing = await db.query('SELECT COUNT(*) FROM users');
  if (existing.rows[0].count > 0) {
    this.log('Users already exist, skipping...', 'warn');
    return;
  }
  // Seed users...
}
```

## Configuration

Edit `seed-config.js` to customize:

```javascript
environments: {
  development: {
    runSeeders: true,
    counts: {
      users: 50,
      products: 100,
      orders: 200
    }
  }
}
```

## Best Practices

1. **Always declare dependencies** to ensure correct order
2. **Make seeders idempotent** - safe to run multiple times
3. **Use batch inserts** for large datasets
4. **Handle errors gracefully** with try-catch
5. **Set appropriate priorities** (lower runs first)
6. **Never seed production** without explicit confirmation
7. **Use data generators** for consistency
8. **Implement rollback** for cleanup

## Examples

The system includes example seeders:

- **UsersSeeder** - User accounts with roles
- **CategoriesSeeder** - Product categories
- **ProductsSeeder** - E-commerce products
- **OrdersSeeder** - Customer orders
- **PostsSeeder** - Blog posts
- **ReviewsSeeder** - Product reviews

## Integration

The seeding system integrates with:

- ✅ TryForge CLI (`tryforge db:seed`)
- ✅ TryForge Logger (Phase 1)
- ✅ PostgreSQL, MySQL, MongoDB
- ✅ ORMs (Sequelize, TypeORM, Prisma)

## Contributing

To add a new seeder:

1. Use the generator: `tryforge db:seed:create MySeeder`
2. Implement `run()` and `rollback()` methods
3. Declare dependencies if needed
4. Test locally before committing

## Support

- 📚 [Complete Documentation](./docs/SEEDING_GUIDE.md)
- 🐛 [Report Issues](https://github.com/jedrzej82/tryforge/issues)
- 💬 [GitHub Discussions](https://github.com/jedrzej82/tryforge/discussions)

## License

MIT - see LICENSE file for details

---

**Made with ❤️ by the TryForge Team**
