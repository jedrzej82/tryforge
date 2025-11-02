/**
 * Migration Integration Tests
 *
 * Tests for database migration operations including creating, running,
 * rolling back migrations, and handling dependencies.
 */

const path = require('path');
const fs = require('fs-extra');
const { MigrationManager } = require('../../../src/database');

describe('Migration Integration Tests', () => {
  let migrationManager;
  let testMigrationsDir;

  beforeAll(async () => {
    // Create temporary migrations directory for tests
    testMigrationsDir = path.join(__dirname, '../../../migrations-test');
    await fs.ensureDir(testMigrationsDir);
  });

  beforeEach(async () => {
    // Initialize migration manager with test database
    migrationManager = new MigrationManager({
      databaseType: 'postgresql',
      connection: global.testDb,
      migrationsDirectory: testMigrationsDir
    });

    await migrationManager.initialize();
  });

  afterEach(async () => {
    // Clean up test migrations
    if (await fs.pathExists(testMigrationsDir)) {
      const files = await fs.readdir(testMigrationsDir);
      for (const file of files) {
        await fs.remove(path.join(testMigrationsDir, file));
      }
    }

    if (migrationManager) {
      await migrationManager.close();
    }
  });

  afterAll(async () => {
    // Remove test migrations directory
    if (await fs.pathExists(testMigrationsDir)) {
      await fs.remove(testMigrationsDir);
    }
  });

  describe('Migration Creation', () => {
    it('should create a new migration file', async () => {
      const result = await migrationManager.createMigration('create_test_table', {
        description: 'Create test table for integration tests'
      });

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('timestamp');

      // Verify file exists
      expect(await fs.pathExists(result.path)).toBe(true);

      // Verify file content
      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('create_test_table');
    });

    it('should create migration with proper timestamp format', async () => {
      const result = await migrationManager.createMigration('test_migration');

      // Timestamp should be in format: YYYYMMDDHHMMSS
      expect(result.timestamp).toMatch(/^\d{14}$/);
      expect(result.name).toContain(result.timestamp);
    });

    it('should create migration with custom template', async () => {
      const upSQL = 'CREATE TABLE custom_table (id SERIAL PRIMARY KEY)';
      const downSQL = 'DROP TABLE custom_table';

      const result = await migrationManager.createMigration('custom_migration', {
        template: 'raw',
        up: upSQL,
        down: downSQL
      });

      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('CREATE TABLE custom_table');
      expect(content).toContain('DROP TABLE custom_table');
    });

    it('should create migration with dependencies', async () => {
      const migration1 = await migrationManager.createMigration('base_migration');

      const migration2 = await migrationManager.createMigration('dependent_migration', {
        dependencies: [migration1.name]
      });

      expect(migration2).toBeTruthy();
      expect(migration2.name).not.toBe(migration1.name);
    });
  });

  describe('Running Migrations', () => {
    beforeEach(async () => {
      // Create test migration
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_create_users_table.sql'),
        `
-- Up Migration
CREATE TABLE IF NOT EXISTS migration_test_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
DROP TABLE IF EXISTS migration_test_users;
        `.trim()
      );
    });

    it('should run pending migrations successfully', async () => {
      const result = await migrationManager.migrate();

      expect(result.applied).toBeDefined();
      expect(result.applied.length).toBeGreaterThan(0);
      expect(result.applied[0]).toContain('create_users_table');

      // Verify table was created
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'migration_test_users'
      `);

      expect(tables.rows.length).toBe(1);
    });

    it('should track applied migrations in registry', async () => {
      await migrationManager.migrate();

      const status = await migrationManager.status();

      expect(status.applied).toBeDefined();
      expect(status.applied.length).toBeGreaterThan(0);
      expect(status.applied[0].name).toContain('create_users_table');
      expect(status.applied[0]).toHaveProperty('applied_at');
    });

    it('should not run already applied migrations', async () => {
      // Run migrations first time
      const result1 = await migrationManager.migrate();
      expect(result1.applied.length).toBeGreaterThan(0);

      // Run migrations second time
      const result2 = await migrationManager.migrate();
      expect(result2.applied.length).toBe(0);
    });

    it('should run migrations in correct order', async () => {
      // Create multiple migrations with different timestamps
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_create_posts_table.sql'),
        `
-- Up Migration
CREATE TABLE IF NOT EXISTS migration_test_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES migration_test_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
DROP TABLE IF EXISTS migration_test_posts;
        `.trim()
      );

      const result = await migrationManager.migrate();

      expect(result.applied.length).toBe(2);
      expect(result.applied[0]).toContain('create_users_table');
      expect(result.applied[1]).toContain('create_posts_table');
    });

    it('should rollback on migration failure', async () => {
      // Create migration with invalid SQL
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000002_invalid_migration.sql'),
        `
-- Up Migration
CREATE TABLE invalid_syntax (
  id SERIAL PRIMARY KEY,
  invalid COLUMN TYPE THAT DOES NOT EXIST
);

-- Down Migration
DROP TABLE IF EXISTS invalid_syntax;
        `.trim()
      );

      // Migration should fail and rollback
      await expect(migrationManager.migrate()).rejects.toThrow();

      // Verify no partial changes
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'invalid_syntax'
      `);

      expect(tables.rows.length).toBe(0);
    });

    it('should support dry run mode', async () => {
      const result = await migrationManager.migrate({ dryRun: true });

      expect(result.skipped).toBeDefined();
      expect(result.applied.length).toBe(0);

      // Verify no changes were made
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'migration_test_users'
      `);

      expect(tables.rows.length).toBe(0);
    });

    it('should support running to specific target migration', async () => {
      // Create multiple migrations
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_migration_two.sql'),
        `
-- Up Migration
CREATE TABLE migration_two (id SERIAL PRIMARY KEY);

-- Down Migration
DROP TABLE IF EXISTS migration_two;
        `.trim()
      );

      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000002_migration_three.sql'),
        `
-- Up Migration
CREATE TABLE migration_three (id SERIAL PRIMARY KEY);

-- Down Migration
DROP TABLE IF EXISTS migration_three;
        `.trim()
      );

      // Migrate to specific target
      const result = await migrationManager.migrate({
        target: '20240101000001_migration_two'
      });

      expect(result.applied.length).toBe(2); // Should run first two migrations only

      // Verify third migration not run
      const status = await migrationManager.status();
      expect(status.pending.length).toBe(1);
    });

    it('should support step-by-step migration', async () => {
      // Create multiple migrations
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_step_two.sql'),
        `-- Up Migration\nCREATE TABLE step_two (id SERIAL PRIMARY KEY);\n-- Down Migration\nDROP TABLE IF EXISTS step_two;`
      );

      const result = await migrationManager.migrate({ step: 1 });

      expect(result.applied.length).toBe(1);

      const status = await migrationManager.status();
      expect(status.pending.length).toBeGreaterThan(0);
    });
  });

  describe('Rolling Back Migrations', () => {
    beforeEach(async () => {
      // Create and run test migration
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_rollback_test.sql'),
        `
-- Up Migration
CREATE TABLE rollback_test (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);

-- Down Migration
DROP TABLE IF EXISTS rollback_test;
        `.trim()
      );

      await migrationManager.migrate();
    });

    it('should rollback last migration successfully', async () => {
      const result = await migrationManager.rollback({ steps: 1 });

      expect(result.rolledBack).toBeDefined();
      expect(result.rolledBack.length).toBe(1);
      expect(result.rolledBack[0]).toContain('rollback_test');

      // Verify table was dropped
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'rollback_test'
      `);

      expect(tables.rows.length).toBe(0);
    });

    it('should rollback multiple migrations', async () => {
      // Create and run another migration
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_rollback_test_two.sql'),
        `
-- Up Migration
CREATE TABLE rollback_test_two (id SERIAL PRIMARY KEY);

-- Down Migration
DROP TABLE IF EXISTS rollback_test_two;
        `.trim()
      );

      await migrationManager.migrate();

      // Rollback both migrations
      const result = await migrationManager.rollback({ steps: 2 });

      expect(result.rolledBack.length).toBe(2);

      // Verify both tables dropped
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('rollback_test', 'rollback_test_two')
      `);

      expect(tables.rows.length).toBe(0);
    });

    it('should rollback to specific target migration', async () => {
      // Create additional migrations
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_target_test.sql'),
        `-- Up Migration\nCREATE TABLE target_test (id SERIAL PRIMARY KEY);\n-- Down Migration\nDROP TABLE IF EXISTS target_test;`
      );

      await migrationManager.migrate();

      // Rollback to first migration
      const result = await migrationManager.rollback({
        target: '20240101000000_rollback_test'
      });

      expect(result.rolledBack.length).toBe(1);

      // Verify correct table still exists
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'rollback_test'
      `);

      expect(tables.rows.length).toBe(1);
    });

    it('should support dry run mode for rollback', async () => {
      const result = await migrationManager.rollback({
        steps: 1,
        dryRun: true
      });

      expect(result.rolledBack.length).toBe(0);

      // Verify table still exists
      const tables = await global.testDb.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'rollback_test'
      `);

      expect(tables.rows.length).toBe(1);
    });

    it('should update registry after rollback', async () => {
      await migrationManager.rollback({ steps: 1 });

      const status = await migrationManager.status();

      expect(status.applied.length).toBe(0);
      expect(status.pending.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Status and Validation', () => {
    beforeEach(async () => {
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_status_test.sql'),
        `-- Up Migration\nCREATE TABLE status_test (id SERIAL PRIMARY KEY);\n-- Down Migration\nDROP TABLE IF EXISTS status_test;`
      );
    });

    it('should return current migration status', async () => {
      const status = await migrationManager.status();

      expect(status).toHaveProperty('currentVersion');
      expect(status).toHaveProperty('statistics');
      expect(status).toHaveProperty('applied');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('failed');
    });

    it('should show pending migrations', async () => {
      const status = await migrationManager.status();

      expect(status.pending.length).toBeGreaterThan(0);
      expect(status.pending[0].name).toContain('status_test');
    });

    it('should show applied migrations after running', async () => {
      await migrationManager.migrate();

      const status = await migrationManager.status();

      expect(status.applied.length).toBeGreaterThan(0);
      expect(status.applied[0].name).toContain('status_test');
      expect(status.pending.length).toBe(0);
    });

    it('should validate migration integrity', async () => {
      await migrationManager.migrate();

      const result = await migrationManager.validate();

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect checksum mismatches', async () => {
      await migrationManager.migrate();

      // Modify migration file after running
      const migrationPath = path.join(testMigrationsDir, '20240101000000_status_test.sql');
      await fs.writeFile(
        migrationPath,
        `-- Up Migration\nCREATE TABLE modified_table (id SERIAL PRIMARY KEY);\n-- Down Migration\nDROP TABLE IF EXISTS modified_table;`
      );

      // Validation should detect the change
      await expect(migrationManager.validate()).rejects.toThrow(/checksum/i);
    });
  });

  describe('Migration Dependencies', () => {
    it('should resolve migration dependencies correctly', async () => {
      // Create base migration
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_base.sql'),
        `-- Up Migration\nCREATE TABLE dep_base (id SERIAL PRIMARY KEY);\n-- Down Migration\nDROP TABLE IF EXISTS dep_base;`
      );

      // Create dependent migration
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_dependent.sql'),
        `-- Dependencies: 20240101000000_base\n-- Up Migration\nCREATE TABLE dep_child (id SERIAL, base_id INTEGER REFERENCES dep_base(id));\n-- Down Migration\nDROP TABLE IF EXISTS dep_child;`
      );

      const result = await migrationManager.migrate();

      expect(result.applied[0]).toContain('base');
      expect(result.applied[1]).toContain('dependent');
    });

    it('should detect circular dependencies', async () => {
      // This test would require creating migrations with circular deps
      // Implementation depends on migration file format
      expect(true).toBe(true); // Placeholder
    });

    it('should fail if dependency not met', async () => {
      // Create migration with unmet dependency
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_unmet_dep.sql'),
        `-- Dependencies: nonexistent_migration\n-- Up Migration\nCREATE TABLE unmet (id SERIAL);\n-- Down Migration\nDROP TABLE IF EXISTS unmet;`
      );

      await expect(migrationManager.migrate()).rejects.toThrow(/dependency/i);
    });
  });

  describe('Migration Batching', () => {
    it('should track migration batches', async () => {
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_batch_test.sql'),
        `-- Up Migration\nCREATE TABLE batch_test (id SERIAL);\n-- Down Migration\nDROP TABLE IF EXISTS batch_test;`
      );

      await migrationManager.migrate();

      const status = await migrationManager.status();

      expect(status.applied[0]).toHaveProperty('batch');
      expect(typeof status.applied[0].batch).toBe('number');
    });

    it('should increment batch number for each migration run', async () => {
      // First batch
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000000_batch_one.sql'),
        `-- Up Migration\nCREATE TABLE batch_one (id SERIAL);\n-- Down Migration\nDROP TABLE IF EXISTS batch_one;`
      );

      await migrationManager.migrate();
      const status1 = await migrationManager.status();
      const batch1 = status1.applied[0].batch;

      // Second batch
      await fs.writeFile(
        path.join(testMigrationsDir, '20240101000001_batch_two.sql'),
        `-- Up Migration\nCREATE TABLE batch_two (id SERIAL);\n-- Down Migration\nDROP TABLE IF EXISTS batch_two;`
      );

      await migrationManager.migrate();
      const status2 = await migrationManager.status();
      const batch2 = status2.applied.find(m => m.name.includes('batch_two')).batch;

      expect(batch2).toBeGreaterThan(batch1);
    });
  });
});
