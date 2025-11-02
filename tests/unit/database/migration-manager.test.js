/**
 * Unit Tests for Migration Manager
 * Tests database migration system with multiple ORM support
 */

const path = require('path');
const fs = require('fs-extra');

// Mock dependencies before requiring MigrationManager
jest.mock('fs-extra');
jest.mock('handlebars', () => ({
  compile: jest.fn((template) => {
    return (data) => `Compiled template for ${data.name}`;
  })
}));
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    text: '',
  }));
});

// Mock database adapter
const mockAdapter = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
};

// Mock registry
const mockRegistry = {
  initialize: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue({ id: 'test-id' }),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  markAsApplied: jest.fn().mockResolvedValue(undefined),
  markAsFailed: jest.fn().mockResolvedValue(undefined),
  markAsRolledBack: jest.fn().mockResolvedValue(undefined),
  getApplied: jest.fn().mockResolvedValue([]),
  getByBatch: jest.fn().mockResolvedValue([]),
  getLastBatch: jest.fn().mockResolvedValue(1),
  getFailed: jest.fn().mockResolvedValue([]),
  getStatistics: jest.fn().mockResolvedValue({ total: 0 }),
  listBackups: jest.fn().mockResolvedValue([]),
  acquireLock: jest.fn().mockResolvedValue(undefined),
  releaseLock: jest.fn().mockResolvedValue(undefined),
  startBatch: jest.fn().mockResolvedValue(undefined),
  verifyChecksum: jest.fn().mockResolvedValue(true),
};

// Mock versioning
const mockVersioning = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getCurrentVersion: jest.fn().mockResolvedValue('1.0.0'),
  bumpVersion: jest.fn().mockResolvedValue('1.0.1'),
};

// Mock dependencies
const mockDependencies = {
  addDependency: jest.fn(),
  validate: jest.fn(),
  detectCircular: jest.fn(),
  resolveOrder: jest.fn((migrations) => migrations),
};

// Mock schema diff
const mockSchemaDiff = {
  diff: jest.fn().mockResolvedValue([]),
};

jest.mock('@database/migration-registry', () => {
  return jest.fn().mockImplementation(() => mockRegistry);
});

jest.mock('@database/migration-dependencies', () => {
  return jest.fn().mockImplementation(() => mockDependencies);
});

jest.mock('@database/migration-version', () => {
  return jest.fn().mockImplementation(() => mockVersioning);
});

jest.mock('@database/schema-diff', () => {
  return jest.fn().mockImplementation(() => mockSchemaDiff);
});

jest.mock('@database/adapters/adapter-factory', () => ({
  createAdapter: jest.fn(() => mockAdapter),
}));

jest.mock('@database/config/database-config', () => ({
  DatabaseConfig: jest.fn().mockImplementation((config) => ({
    getDatabaseConfig: () => ({ type: 'postgres', name: 'test_db' }),
    getORMConfig: () => ({ type: 'raw' }),
    getMigrationConfig: () => ({
      directory: '/test/migrations',
      autoRollback: false
    }),
    getConfig: () => config,
  })),
}));

const MigrationManager = require('@database/migration-manager');

describe('MigrationManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup fs-extra mocks
    fs.ensureDir.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('migration content');
    fs.writeFile.mockResolvedValue(undefined);
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ size: 1024 });

    manager = new MigrationManager({
      database: { type: 'postgres', name: 'test_db' },
      orm: { type: 'raw' },
      migrations: { directory: '/test/migrations' }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize migration manager', async () => {
      await manager.initialize();

      expect(manager.isInitialized).toBe(true);
      expect(mockAdapter.connect).toHaveBeenCalled();
      expect(mockRegistry.initialize).toHaveBeenCalled();
      expect(mockVersioning.initialize).toHaveBeenCalled();
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await manager.initialize();
      await manager.initialize();

      expect(mockAdapter.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      mockAdapter.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(manager.initialize()).rejects.toThrow();
    });
  });

  describe('createMigration', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should create migration file with timestamp', async () => {
      const result = await manager.createMigration('create_users_table');

      expect(result.name).toContain('create_users_table');
      expect(result.path).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should use correct template for ORM type', async () => {
      await manager.createMigration('test_migration', {
        template: 'prisma'
      });

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should add dependencies when specified', async () => {
      await manager.createMigration('test_migration', {
        dependencies: ['20230101120000_initial_migration']
      });

      expect(mockDependencies.addDependency).toHaveBeenCalled();
    });

    it('should handle custom up/down migrations', async () => {
      await manager.createMigration('test_migration', {
        up: 'CREATE TABLE test (id INT);',
        down: 'DROP TABLE test;'
      });

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      fs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      await expect(
        manager.createMigration('test_migration')
      ).rejects.toThrow();
    });

    it('should generate correct file extension', async () => {
      const result = await manager.createMigration('test_migration');

      expect(result.path).toMatch(/\.sql$/);
    });
  });

  describe('migrate', () => {
    beforeEach(async () => {
      await manager.initialize();

      // Mock migration files
      fs.readdir.mockResolvedValue([
        '20230101120000_create_users.sql',
        '20230102120000_create_posts.sql'
      ]);

      mockRegistry.getApplied.mockResolvedValue([]);
    });

    it('should apply pending migrations in order', async () => {
      const result = await manager.migrate();

      expect(mockRegistry.acquireLock).toHaveBeenCalled();
      expect(mockRegistry.startBatch).toHaveBeenCalled();
      expect(mockAdapter.beginTransaction).toHaveBeenCalled();
      expect(mockAdapter.commitTransaction).toHaveBeenCalled();
      expect(mockRegistry.releaseLock).toHaveBeenCalled();
      expect(result.applied.length).toBe(2);
    });

    it('should skip already applied migrations', async () => {
      mockRegistry.getApplied.mockResolvedValue([
        { name: '20230101120000_create_users' }
      ]);

      const result = await manager.migrate();

      expect(result.applied.length).toBe(1);
      expect(result.applied[0]).toBe('20230102120000_create_posts');
    });

    it('should handle dry run mode', async () => {
      const result = await manager.migrate({ dryRun: true });

      expect(mockAdapter.beginTransaction).not.toHaveBeenCalled();
      expect(result.applied.length).toBe(0);
      expect(result.skipped.length).toBe(2);
    });

    it('should handle target migration', async () => {
      const result = await manager.migrate({
        target: '20230101120000_create_users'
      });

      expect(result.applied.length).toBe(1);
    });

    it('should handle step limit', async () => {
      const result = await manager.migrate({ step: 1 });

      expect(result.applied.length).toBe(1);
    });

    it('should rollback on migration failure', async () => {
      mockAdapter.commitTransaction.mockRejectedValueOnce(
        new Error('Migration failed')
      );

      await expect(manager.migrate()).rejects.toThrow();
      expect(mockAdapter.rollbackTransaction).toHaveBeenCalled();
    });

    it('should auto-rollback batch on failure if configured', async () => {
      manager.config.getMigrationConfig = () => ({
        directory: '/test/migrations',
        autoRollback: true
      });

      mockAdapter.commitTransaction.mockRejectedValueOnce(
        new Error('Migration failed')
      );

      await expect(manager.migrate()).rejects.toThrow();
    });

    it('should mark failed migrations', async () => {
      mockAdapter.commitTransaction.mockRejectedValueOnce(
        new Error('Migration failed')
      );

      try {
        await manager.migrate();
      } catch (error) {
        expect(mockRegistry.markAsFailed).toHaveBeenCalled();
      }
    });

    it('should handle empty migrations list', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await manager.migrate();

      expect(result.applied.length).toBe(0);
    });

    it('should bump version after successful migration', async () => {
      await manager.migrate();

      expect(mockVersioning.bumpVersion).toHaveBeenCalled();
    });
  });

  describe('rollback', () => {
    beforeEach(async () => {
      await manager.initialize();

      mockRegistry.getApplied.mockResolvedValue([
        { name: '20230102120000_create_posts' },
        { name: '20230101120000_create_users' }
      ]);

      fs.readdir.mockResolvedValue([
        '20230101120000_create_users.sql',
        '20230102120000_create_posts.sql'
      ]);
    });

    it('should rollback last migration by default', async () => {
      const result = await manager.rollback();

      expect(result.rolledBack.length).toBe(1);
      expect(mockRegistry.markAsRolledBack).toHaveBeenCalled();
    });

    it('should rollback N migrations', async () => {
      const result = await manager.rollback({ steps: 2 });

      expect(result.rolledBack.length).toBe(2);
    });

    it('should rollback specific batch', async () => {
      mockRegistry.getByBatch.mockResolvedValue([
        { name: '20230101120000_create_users' }
      ]);

      const result = await manager.rollback({ batch: 1 });

      expect(mockRegistry.getByBatch).toHaveBeenCalledWith(1);
    });

    it('should rollback to target migration', async () => {
      const result = await manager.rollback({
        target: '20230101120000_create_users'
      });

      expect(result.rolledBack.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle dry run mode', async () => {
      const result = await manager.rollback({ dryRun: true });

      expect(mockAdapter.beginTransaction).not.toHaveBeenCalled();
      expect(result.rolledBack.length).toBe(0);
    });

    it('should handle rollback errors', async () => {
      mockAdapter.commitTransaction.mockRejectedValueOnce(
        new Error('Rollback failed')
      );

      await expect(manager.rollback()).rejects.toThrow();
    });

    it('should skip migrations without files', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await manager.rollback();

      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should bump version after rollback', async () => {
      await manager.rollback();

      expect(mockVersioning.bumpVersion).toHaveBeenCalled();
    });
  });

  describe('status', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return migration status', async () => {
      mockRegistry.getApplied.mockResolvedValue([
        { name: '20230101120000_create_users', status: 'applied' }
      ]);

      fs.readdir.mockResolvedValue([
        '20230101120000_create_users.sql',
        '20230102120000_create_posts.sql'
      ]);

      const status = await manager.status();

      expect(status.currentVersion).toBeDefined();
      expect(status.statistics).toBeDefined();
      expect(status.applied).toBeDefined();
      expect(status.pending).toBeDefined();
      expect(status.failed).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockRegistry.getApplied.mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(manager.status()).rejects.toThrow();
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      await manager.initialize();

      fs.readdir.mockResolvedValue([
        '20230101120000_create_users.sql',
        '20230102120000_create_posts.sql'
      ]);
    });

    it('should validate migrations successfully', async () => {
      const result = await manager.validate();

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(mockDependencies.validate).toHaveBeenCalled();
      expect(mockDependencies.detectCircular).toHaveBeenCalled();
    });

    it('should detect circular dependencies', async () => {
      mockDependencies.detectCircular.mockImplementationOnce(() => {
        throw new Error('Circular dependency detected');
      });

      await expect(manager.validate()).rejects.toThrow();
    });

    it('should detect invalid dependencies', async () => {
      mockDependencies.validate.mockImplementationOnce(() => {
        throw new Error('Invalid dependency');
      });

      await expect(manager.validate()).rejects.toThrow();
    });

    it('should verify checksums', async () => {
      await manager.validate();

      expect(mockRegistry.verifyChecksum).toHaveBeenCalled();
    });

    it('should detect checksum mismatches', async () => {
      mockRegistry.verifyChecksum.mockRejectedValueOnce(
        new Error('Checksum mismatch')
      );

      await expect(manager.validate()).rejects.toThrow();
    });
  });

  describe('Migration Execution', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should execute SQL migration', async () => {
      const migrationFile = {
        name: '20230101120000_create_users',
        path: '/test/migrations/20230101120000_create_users.sql',
        file: '20230101120000_create_users.sql'
      };

      fs.readFile.mockResolvedValue(`
        -- UP
        CREATE TABLE users (id INT);

        -- DOWN
        DROP TABLE users;
      `);

      await manager.executeMigration(migrationFile, 'up');

      expect(mockAdapter.beginTransaction).toHaveBeenCalled();
      expect(mockAdapter.query).toHaveBeenCalled();
      expect(mockAdapter.commitTransaction).toHaveBeenCalled();
    });

    it('should execute code-based migration', async () => {
      const migrationFile = {
        name: '20230101120000_create_users',
        path: '/test/migrations/20230101120000_create_users.js',
        file: '20230101120000_create_users.js'
      };

      // Mock require
      jest.mock('/test/migrations/20230101120000_create_users.js', () => ({
        up: jest.fn().mockResolvedValue(undefined),
        down: jest.fn().mockResolvedValue(undefined)
      }));

      await manager.executeMigration(migrationFile, 'up');

      expect(mockAdapter.beginTransaction).toHaveBeenCalled();
      expect(mockAdapter.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback on execution error', async () => {
      const migrationFile = {
        name: '20230101120000_create_users',
        path: '/test/migrations/20230101120000_create_users.sql',
        file: '20230101120000_create_users.sql'
      };

      mockAdapter.query.mockRejectedValueOnce(new Error('SQL error'));

      await expect(
        manager.executeMigration(migrationFile, 'up')
      ).rejects.toThrow();

      expect(mockAdapter.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should generate timestamp', () => {
      const timestamp = manager.generateTimestamp();

      expect(timestamp).toMatch(/^\d{14}$/);
    });

    it('should convert to PascalCase', () => {
      expect(manager.toPascalCase('create_users_table')).toBe('CreateUsersTable');
      expect(manager.toPascalCase('add-column')).toBe('AddColumn');
    });

    it('should check if file is migration file', () => {
      expect(manager.isMigrationFile('20230101120000_test.sql')).toBe(true);
      expect(manager.isMigrationFile('20230101120000_test.js')).toBe(true);
      expect(manager.isMigrationFile('20230101120000_test.ts')).toBe(true);
      expect(manager.isMigrationFile('invalid.sql')).toBe(false);
      expect(manager.isMigrationFile('README.md')).toBe(false);
    });

    it('should get migration name from filename', () => {
      expect(manager.getMigrationName('20230101120000_test.sql')).toBe('20230101120000_test');
      expect(manager.getMigrationName('20230101120000_test.js')).toBe('20230101120000_test');
    });

    it('should get correct file extension for ORM', () => {
      expect(manager.getFileExtension('raw')).toBe('.sql');
      expect(manager.getFileExtension('sequelize')).toBe('.js');
      expect(manager.getFileExtension('typeorm')).toBe('.ts');
    });
  });

  describe('Cleanup', () => {
    it('should close connections', async () => {
      await manager.initialize();
      await manager.close();

      expect(mockAdapter.disconnect).toHaveBeenCalled();
      expect(manager.isInitialized).toBe(false);
    });

    it('should handle close without initialization', async () => {
      await expect(manager.close()).resolves.not.toThrow();
    });
  });
});
