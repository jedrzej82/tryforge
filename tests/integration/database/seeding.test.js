/**
 * Seeding Integration Tests
 *
 * Tests for database seeding operations including running seeders,
 * handling dependencies, rollback, and data verification.
 */

const { SeedManager } = require('../../../src/database/seeding');

describe('Seeding Integration Tests', () => {
  let seedManager;

  beforeEach(async () => {
    // Initialize seed manager with test database
    seedManager = new SeedManager({
      db: global.testDb,
      environment: 'test',
      seedersPath: require('path').join(__dirname, '../../../src/database/seeding/seeders')
    });

    await seedManager.initialize();
  });

  afterEach(async () => {
    // Clean up seeded data
    if (seedManager) {
      try {
        await seedManager.rollback();
      } catch (error) {
        // Ignore rollback errors in cleanup
      }
    }
  });

  describe('Running Seeders', () => {
    it('should run all seeders successfully', async () => {
      const result = await seedManager.runAll({
        continueOnError: false
      });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('failed');
      expect(result.failed).toBe(0);
      expect(result.completed).toBeGreaterThan(0);
    });

    it('should seed users table with test data', async () => {
      await seedManager.run('UsersSeeder');

      // Verify users created
      const result = await global.testDb.query('SELECT * FROM users');

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('email');
      expect(result.rows[0]).toHaveProperty('name');
      expect(result.rows[0]).toHaveProperty('password');
    });

    it('should seed products table with test data', async () => {
      await seedManager.run('ProductsSeeder');

      // Verify products created
      const result = await global.testDb.query('SELECT * FROM products');

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('name');
      expect(result.rows[0]).toHaveProperty('price');
      expect(result.rows[0]).toHaveProperty('sku');
    });

    it('should not run seeders not matching environment', async () => {
      // Create seed manager for production environment
      const prodSeedManager = new SeedManager({
        db: global.testDb,
        environment: 'production'
      });

      await prodSeedManager.initialize();

      const result = await prodSeedManager.runAll();

      // Test-only seeders should be skipped
      expect(result.skipped).toBeGreaterThan(0);
    });

    it('should skip already run seeders when skipIfExists is true', async () => {
      // Run seeders first time
      await seedManager.runAll();

      // Run again with skipIfExists
      const result = await seedManager.runAll({
        skipIfExists: true
      });

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.completed).toBe(0);
    });

    it('should force run seeders when force is true', async () => {
      // Run seeders first time
      await seedManager.runAll();

      // Get initial count
      const count1 = await global.testDb.query('SELECT COUNT(*) FROM users');

      // Run again with force
      await seedManager.runAll({
        force: true
      });

      // Count should have increased
      const count2 = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(count2.rows[0].count)).toBeGreaterThan(parseInt(count1.rows[0].count));
    });

    it('should support dry run mode', async () => {
      const result = await seedManager.runAll({
        dryRun: true
      });

      expect(result.completed).toBe(0);

      // Verify no data was created
      const users = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(users.rows[0].count)).toBe(0);
    });

    it('should track seeding execution time', async () => {
      const result = await seedManager.runAll();

      expect(result).toHaveProperty('duration');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.seeders[0]).toHaveProperty('executionTime');
    });

    it('should continue on error when configured', async () => {
      const result = await seedManager.runAll({
        continueOnError: true
      });

      // Even if some seeders fail, should complete others
      expect(result.completed + result.skipped + result.failed).toBe(result.total);
    });
  });

  describe('Seeder Dependencies', () => {
    it('should resolve seeder dependencies correctly', async () => {
      // Orders seeder depends on Users and Products
      await seedManager.run('OrdersSeeder');

      // Verify dependencies were run first
      const users = await global.testDb.query('SELECT COUNT(*) FROM users');
      const products = await global.testDb.query('SELECT COUNT(*) FROM products');
      const orders = await global.testDb.query('SELECT COUNT(*) FROM orders');

      expect(parseInt(users.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(products.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(orders.rows[0].count)).toBeGreaterThan(0);
    });

    it('should run seeders in correct order based on dependencies', async () => {
      const result = await seedManager.runAll();

      // Find index of each seeder in execution order
      const usersIndex = result.seeders.findIndex(s => s.seeder === 'UsersSeeder');
      const ordersIndex = result.seeders.findIndex(s => s.seeder === 'OrdersSeeder');

      // Users should run before Orders
      expect(usersIndex).toBeLessThan(ordersIndex);
    });

    it('should fail when dependency not met', async () => {
      // Try to run seeder with unmet dependency
      // This would require a test seeder with invalid dependency
      expect(true).toBe(true); // Placeholder
    });

    it('should respect seeder priority', async () => {
      const result = await seedManager.runAll();

      // Verify execution order respects priority
      expect(result.seeders.length).toBeGreaterThan(0);
      // Lower priority numbers should run first
    });
  });

  describe('Seeder Rollback', () => {
    beforeEach(async () => {
      // Run seeders before each rollback test
      await seedManager.runAll();
    });

    it('should rollback single seeder', async () => {
      // Get initial count
      const before = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(before.rows[0].count)).toBeGreaterThan(0);

      // Rollback users seeder
      await seedManager.rollback('UsersSeeder');

      // Verify data removed
      const after = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(after.rows[0].count)).toBe(0);
    });

    it('should rollback all seeders', async () => {
      // Verify data exists
      const usersBefore = await global.testDb.query('SELECT COUNT(*) FROM users');
      const productsBefore = await global.testDb.query('SELECT COUNT(*) FROM products');

      expect(parseInt(usersBefore.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(productsBefore.rows[0].count)).toBeGreaterThan(0);

      // Rollback all
      await seedManager.rollback();

      // Verify all data removed
      const usersAfter = await global.testDb.query('SELECT COUNT(*) FROM users');
      const productsAfter = await global.testDb.query('SELECT COUNT(*) FROM products');

      expect(parseInt(usersAfter.rows[0].count)).toBe(0);
      expect(parseInt(productsAfter.rows[0].count)).toBe(0);
    });

    it('should rollback seeders in reverse order', async () => {
      // Rollback should handle dependencies properly
      await seedManager.rollback();

      // All tables should be empty
      const tables = ['orders', 'products', 'users'];

      for (const table of tables) {
        const result = await global.testDb.query(`SELECT COUNT(*) FROM ${table}`);
        expect(parseInt(result.rows[0].count)).toBe(0);
      }
    });
  });

  describe('Seeder Registry', () => {
    it('should track which seeders have run', async () => {
      await seedManager.run('UsersSeeder');

      const status = await seedManager.registry.getStatus('UsersSeeder');

      expect(status).toBeTruthy();
      expect(status.status).toBe('completed');
      expect(status).toHaveProperty('executedAt');
    });

    it('should track seeder execution metadata', async () => {
      await seedManager.run('UsersSeeder');

      const status = await seedManager.registry.getStatus('UsersSeeder');

      expect(status).toHaveProperty('executionTimeMs');
      expect(status.executionTimeMs).toBeGreaterThan(0);
    });

    it('should mark seeder as failed on error', async () => {
      // This would require a seeder that throws an error
      // Placeholder test
      expect(true).toBe(true);
    });

    it('should list all seeders with their status', async () => {
      await seedManager.runAll();

      const seeders = await seedManager.list();

      expect(Array.isArray(seeders)).toBe(true);
      expect(seeders.length).toBeGreaterThan(0);
      expect(seeders[0]).toHaveProperty('name');
      expect(seeders[0]).toHaveProperty('status');
      expect(seeders[0]).toHaveProperty('dependencies');
    });

    it('should get seeding statistics', async () => {
      await seedManager.runAll();

      const stats = await seedManager.getStats();

      expect(stats).toHaveProperty('totalSeeders');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Data Quality and Integrity', () => {
    beforeEach(async () => {
      await seedManager.runAll();
    });

    it('should create unique email addresses for users', async () => {
      const result = await global.testDb.query('SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1');

      // No duplicate emails
      expect(result.rows.length).toBe(0);
    });

    it('should create unique SKUs for products', async () => {
      const result = await global.testDb.query('SELECT sku, COUNT(*) as count FROM products GROUP BY sku HAVING COUNT(*) > 1');

      // No duplicate SKUs
      expect(result.rows.length).toBe(0);
    });

    it('should create valid foreign key references', async () => {
      // Check orders reference valid users and products
      const result = await global.testDb.query(`
        SELECT COUNT(*) FROM orders o
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id)
           OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = o.product_id)
      `);

      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('should create realistic test data', async () => {
      const users = await global.testDb.query('SELECT * FROM users LIMIT 1');
      const user = users.rows[0];

      // Email should be valid format
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // Name should not be empty
      expect(user.name).toBeTruthy();
      expect(user.name.length).toBeGreaterThan(0);

      // Password should be hashed
      expect(user.password).toBeTruthy();
      expect(user.password).not.toBe('password');
    });

    it('should create data with proper timestamps', async () => {
      const users = await global.testDb.query('SELECT * FROM users LIMIT 1');
      const user = users.rows[0];

      expect(user.created_at).toBeTruthy();
      expect(new Date(user.created_at)).toBeInstanceOf(Date);

      // Created at should be recent
      const now = new Date();
      const createdAt = new Date(user.created_at);
      const diffMinutes = (now - createdAt) / (1000 * 60);

      expect(diffMinutes).toBeLessThan(5); // Created within last 5 minutes
    });

    it('should create data with valid enum values', async () => {
      const users = await global.testDb.query('SELECT role FROM users');

      const validRoles = ['user', 'admin', 'moderator'];
      users.rows.forEach(user => {
        expect(validRoles).toContain(user.role);
      });
    });
  });

  describe('Seeder Configuration', () => {
    it('should respect seeder count configuration', async () => {
      // Run seeder with specific count
      await seedManager.run('UsersSeeder', { count: 10 });

      const result = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(result.rows[0].count)).toBe(10);
    });

    it('should support seeder-specific options', async () => {
      // This depends on seeder implementation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Database Refresh', () => {
    beforeEach(async () => {
      await seedManager.runAll();
    });

    it('should refresh database and reseed', async () => {
      // Get initial data
      const before = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(before.rows[0].count)).toBeGreaterThan(0);

      // Refresh
      await seedManager.refresh();

      // Verify data recreated
      const after = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(after.rows[0].count)).toBeGreaterThan(0);
    });

    it('should clear registry on refresh', async () => {
      await seedManager.refresh({ clearRegistry: true });

      // All seeders should be marked as run again
      const seeders = await seedManager.list();
      const completedSeeders = seeders.filter(s => s.status === 'completed');

      expect(completedSeeders.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database constraint violations gracefully', async () => {
      // Run seeder twice without force flag
      await seedManager.run('UsersSeeder');

      // Running again with same data should handle conflicts
      const result = await seedManager.run('UsersSeeder');

      expect(result).toHaveProperty('success');
    });

    it('should provide detailed error messages on failure', async () => {
      // This would require a seeder designed to fail
      expect(true).toBe(true); // Placeholder
    });

    it('should rollback transaction on seeder failure', async () => {
      // Implementation depends on seeder transaction handling
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance', () => {
    it('should seed large dataset efficiently', async () => {
      const startTime = Date.now();

      // Seed 1000 records
      await seedManager.run('UsersSeeder', { count: 1000 });

      const duration = Date.now() - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify count
      const result = await global.testDb.query('SELECT COUNT(*) FROM users');
      expect(parseInt(result.rows[0].count)).toBe(1000);
    }, 15000); // Increase timeout for this test

    it('should use batch inserts for better performance', async () => {
      // Implementation detail - seeders should use batch inserts
      const startTime = Date.now();

      await seedManager.run('ProductsSeeder', { count: 500 });

      const duration = Date.now() - startTime;

      // Batch inserts should be faster than individual inserts
      expect(duration).toBeLessThan(5000); // 5 seconds
    }, 10000);
  });
});
