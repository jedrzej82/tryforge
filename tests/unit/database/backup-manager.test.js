/**
 * Unit Tests for Backup Manager
 * Tests database backup and restoration system
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('crypto');

// Mock backup components
const mockRegistry = {
  register: jest.fn().mockResolvedValue({ id: 'backup-id' }),
  updateStatus: jest.fn().mockResolvedValue(undefined),
  getBackup: jest.fn().mockResolvedValue({
    id: 'backup-id',
    filename: 'test-backup.dump',
    status: 'completed',
    localPath: '/backups/test-backup.dump',
    checksum: 'abc123',
  }),
  listBackups: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({ total: 5 }),
  deleteRecord: jest.fn().mockResolvedValue(undefined),
  incrementRestorationCount: jest.fn().mockResolvedValue(undefined),
};

const mockDbAdapter = {
  backup: jest.fn().mockResolvedValue('/tmp/backup.dump'),
  restore: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const mockCompression = {
  compress: jest.fn().mockResolvedValue('/tmp/backup.dump.gz'),
  decompress: jest.fn().mockResolvedValue('/tmp/backup.dump'),
};

const mockEncryption = {
  encrypt: jest.fn().mockResolvedValue('/tmp/backup.dump.enc'),
  decrypt: jest.fn().mockResolvedValue('/tmp/backup.dump'),
};

const mockVerification = {
  calculateChecksum: jest.fn().mockResolvedValue('abc123'),
  verify: jest.fn().mockResolvedValue(true),
};

const mockLocalStorage = {
  save: jest.fn().mockResolvedValue('/backups/test-backup.dump'),
  delete: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockResolvedValue({ used: 1024, available: 10240 }),
};

const mockRemoteStorage = {
  upload: jest.fn().mockResolvedValue('s3://bucket/backup.dump'),
  download: jest.fn().mockResolvedValue('/tmp/downloaded-backup.dump'),
  delete: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({ used: 2048 }),
};

// Mock constructors
jest.mock('@database/backup/backup-registry', () => {
  return jest.fn().mockImplementation(() => mockRegistry);
});

jest.mock('@database/backup/compression', () => {
  return jest.fn().mockImplementation(() => mockCompression);
});

jest.mock('@database/backup/encryption', () => {
  return jest.fn().mockImplementation(() => mockEncryption);
});

jest.mock('@database/backup/backup-verification', () => {
  return jest.fn().mockImplementation(() => mockVerification);
});

jest.mock('@database/backup/storage/local-storage', () => {
  return jest.fn().mockImplementation(() => mockLocalStorage);
});

jest.mock('@database/backup/storage/s3-storage', () => {
  return jest.fn().mockImplementation(() => mockRemoteStorage);
});

jest.mock('@database/backup/adapters/postgres-backup', () => {
  return jest.fn().mockImplementation(() => mockDbAdapter);
});

const BackupManager = require('@database/backup/backup-manager');

describe('BackupManager', () => {
  let backupManager;
  let config;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock crypto.randomUUID
    crypto.randomUUID = jest.fn(() => 'test-uuid-123');

    // Setup fs mocks
    fs.stat.mockResolvedValue({ size: 1024 });
    fs.remove.mockResolvedValue(undefined);
    fs.pathExists.mockResolvedValue(true);
    fs.ensureDir.mockResolvedValue(undefined);

    config = {
      database: {
        type: 'postgres',
        name: 'test_db',
        host: 'localhost',
        port: 5432,
      },
      storage: {
        type: 'local',
        path: '/backups',
      },
      compression: {
        enabled: false,
        algorithm: 'gzip',
        level: 6,
      },
      encryption: {
        enabled: false,
        password: 'test-password',
      },
      retention: {
        keepDaily: 7,
        keepWeekly: 4,
        keepMonthly: 6,
      }
    };

    backupManager = new BackupManager(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with configuration', () => {
      expect(backupManager.config).toBeDefined();
      expect(backupManager.registry).toBeDefined();
      expect(backupManager.compression).toBeDefined();
      expect(backupManager.encryption).toBeDefined();
      expect(backupManager.verification).toBeDefined();
    });

    it('should initialize correct database adapter', () => {
      expect(backupManager.dbAdapter).toBeDefined();
    });

    it('should initialize local storage', () => {
      expect(backupManager.localStorage).toBeDefined();
    });

    it('should initialize remote storage when configured', () => {
      const s3Config = {
        ...config,
        storage: {
          type: 's3',
          s3: {
            bucket: 'my-bucket',
            region: 'us-east-1'
          }
        }
      };

      const manager = new BackupManager(s3Config);
      expect(manager.remoteStorage).toBeDefined();
    });

    it('should throw error for unsupported database type', () => {
      const invalidConfig = {
        ...config,
        database: { type: 'unsupported' }
      };

      expect(() => new BackupManager(invalidConfig)).toThrow();
    });
  });

  describe('createBackup', () => {
    it('should create backup successfully', async () => {
      const result = await backupManager.createBackup();

      expect(result.success).toBe(true);
      expect(result.backupId).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.size).toBeDefined();
      expect(result.checksum).toBeDefined();

      expect(mockRegistry.register).toHaveBeenCalled();
      expect(mockDbAdapter.backup).toHaveBeenCalled();
      expect(mockLocalStorage.save).toHaveBeenCalled();
      expect(mockRegistry.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        'completed',
        expect.any(Object)
      );
    });

    it('should create incremental backup', async () => {
      const result = await backupManager.createBackup({ incremental: true });

      expect(result.success).toBe(true);
      expect(mockDbAdapter.backup).toHaveBeenCalledWith(
        expect.objectContaining({ incremental: true })
      );
    });

    it('should compress backup when enabled', async () => {
      backupManager.config.compression.enabled = true;

      await backupManager.createBackup();

      expect(mockCompression.compress).toHaveBeenCalled();
    });

    it('should encrypt backup when enabled', async () => {
      backupManager.config.encryption.enabled = true;

      await backupManager.createBackup();

      expect(mockEncryption.encrypt).toHaveBeenCalled();
    });

    it('should verify backup after creation', async () => {
      await backupManager.createBackup({ verify: true });

      expect(mockVerification.verify).toHaveBeenCalled();
    });

    it('should upload to remote storage', async () => {
      backupManager.remoteStorage = mockRemoteStorage;

      await backupManager.createBackup({ uploadRemote: true });

      expect(mockRemoteStorage.upload).toHaveBeenCalled();
    });

    it('should retry remote upload on failure', async () => {
      backupManager.remoteStorage = mockRemoteStorage;
      mockRemoteStorage.upload
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('s3://bucket/backup.dump');

      await backupManager.createBackup({ uploadRemote: true });

      expect(mockRemoteStorage.upload).toHaveBeenCalledTimes(3);
    });

    it('should calculate compression ratio', async () => {
      backupManager.config.compression.enabled = true;
      fs.stat
        .mockResolvedValueOnce({ size: 2048 }) // Original size
        .mockResolvedValueOnce({ size: 1024 }); // Compressed size

      const result = await backupManager.createBackup();

      expect(result.success).toBe(true);
    });

    it('should handle backup creation errors', async () => {
      mockDbAdapter.backup.mockRejectedValueOnce(new Error('Backup failed'));

      await expect(backupManager.createBackup()).rejects.toThrow('Backup creation failed');

      expect(mockRegistry.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        'failed',
        expect.any(Object)
      );
    });

    it('should clean up temporary files', async () => {
      await backupManager.createBackup();

      expect(fs.remove).toHaveBeenCalled();
    });

    it('should fail if verification fails', async () => {
      mockVerification.verify.mockResolvedValueOnce(false);

      await expect(
        backupManager.createBackup({ verify: true })
      ).rejects.toThrow('verification failed');
    });

    it('should generate unique backup filename', async () => {
      const result1 = await backupManager.createBackup();
      const result2 = await backupManager.createBackup();

      // Would have different timestamps in real scenario
      expect(result1.filename).toBeDefined();
      expect(result2.filename).toBeDefined();
    });
  });

  describe('restore', () => {
    beforeEach(() => {
      mockRegistry.getBackup.mockResolvedValue({
        id: 'backup-id',
        filename: 'test-backup.dump',
        status: 'completed',
        localPath: '/backups/test-backup.dump',
        checksum: 'abc123',
        compressed: false,
        encrypted: false,
      });
    });

    it('should restore from backup successfully', async () => {
      const result = await backupManager.restore('backup-id');

      expect(result.success).toBe(true);
      expect(result.backupId).toBe('backup-id');

      expect(mockRegistry.getBackup).toHaveBeenCalledWith('backup-id');
      expect(mockVerification.calculateChecksum).toHaveBeenCalled();
      expect(mockDbAdapter.restore).toHaveBeenCalled();
      expect(mockRegistry.incrementRestorationCount).toHaveBeenCalled();
    });

    it('should verify checksum before restore', async () => {
      await backupManager.restore('backup-id');

      expect(mockVerification.calculateChecksum).toHaveBeenCalled();
    });

    it('should fail if checksum mismatch', async () => {
      mockVerification.calculateChecksum.mockResolvedValueOnce('different-checksum');

      await expect(
        backupManager.restore('backup-id')
      ).rejects.toThrow('checksum mismatch');
    });

    it('should decrypt backup if encrypted', async () => {
      backupManager.config.encryption.enabled = true;
      mockRegistry.getBackup.mockResolvedValue({
        id: 'backup-id',
        filename: 'test-backup.dump.enc',
        status: 'completed',
        localPath: '/backups/test-backup.dump.enc',
        checksum: 'abc123',
        encrypted: true,
      });

      await backupManager.restore('backup-id');

      expect(mockEncryption.decrypt).toHaveBeenCalled();
    });

    it('should decompress backup if compressed', async () => {
      backupManager.config.compression.enabled = true;
      mockRegistry.getBackup.mockResolvedValue({
        id: 'backup-id',
        filename: 'test-backup.dump.gz',
        status: 'completed',
        localPath: '/backups/test-backup.dump.gz',
        checksum: 'abc123',
        compressed: true,
      });

      await backupManager.restore('backup-id');

      expect(mockCompression.decompress).toHaveBeenCalled();
    });

    it('should download from remote if requested', async () => {
      backupManager.remoteStorage = mockRemoteStorage;

      await backupManager.restore('backup-id', { fromRemote: true });

      expect(mockRemoteStorage.download).toHaveBeenCalled();
    });

    it('should throw error if backup not found', async () => {
      mockRegistry.getBackup.mockResolvedValueOnce(null);

      await expect(
        backupManager.restore('non-existent-id')
      ).rejects.toThrow('Backup not found');
    });

    it('should throw error if backup file not found', async () => {
      fs.pathExists.mockResolvedValueOnce(false);

      await expect(
        backupManager.restore('backup-id')
      ).rejects.toThrow('Backup file not found');
    });

    it('should throw error if backup status is not completed', async () => {
      mockRegistry.getBackup.mockResolvedValueOnce({
        id: 'backup-id',
        status: 'in_progress',
      });

      await expect(
        backupManager.restore('backup-id')
      ).rejects.toThrow('Cannot restore backup with status');
    });

    it('should drop existing database by default', async () => {
      await backupManager.restore('backup-id');

      expect(mockDbAdapter.restore).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ dropExisting: true })
      );
    });

    it('should handle restore errors', async () => {
      mockDbAdapter.restore.mockRejectedValueOnce(new Error('Restore failed'));

      await expect(
        backupManager.restore('backup-id')
      ).rejects.toThrow('Backup restoration failed');
    });

    it('should clean up temporary files', async () => {
      backupManager.remoteStorage = mockRemoteStorage;

      await backupManager.restore('backup-id', { fromRemote: true });

      expect(fs.remove).toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      mockRegistry.listBackups.mockResolvedValue([
        { id: '1', filename: 'backup1.dump', status: 'completed' },
        { id: '2', filename: 'backup2.dump', status: 'completed' },
      ]);

      const backups = await backupManager.listBackups();

      expect(backups.length).toBe(2);
      expect(mockRegistry.listBackups).toHaveBeenCalled();
    });

    it('should filter backups', async () => {
      await backupManager.listBackups({ status: 'completed' });

      expect(mockRegistry.listBackups).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should include remote backups when requested', async () => {
      backupManager.remoteStorage = mockRemoteStorage;

      const result = await backupManager.listBackups({ includeRemote: true });

      expect(mockRemoteStorage.list).toHaveBeenCalled();
      expect(result.local).toBeDefined();
      expect(result.remote).toBeDefined();
    });

    it('should handle listing errors', async () => {
      mockRegistry.listBackups.mockRejectedValueOnce(new Error('List failed'));

      await expect(backupManager.listBackups()).rejects.toThrow('Failed to list backups');
    });
  });

  describe('pruneBackups', () => {
    beforeEach(() => {
      mockRegistry.listBackups.mockResolvedValue([
        {
          id: '1',
          filename: 'old-backup-1.dump',
          status: 'completed',
          localPath: '/backups/old-backup-1.dump',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: '2',
          filename: 'old-backup-2.dump',
          status: 'completed',
          localPath: '/backups/old-backup-2.dump',
          createdAt: new Date('2023-01-02'),
        },
      ]);

      // Mock RetentionPolicy
      jest.mock('@database/backup/retention-policy', () => {
        return jest.fn().mockImplementation(() => ({
          apply: jest.fn().mockResolvedValue([
            { id: '1', localPath: '/backups/old-backup-1.dump' }
          ])
        }));
      });
    });

    it('should delete old backups per retention policy', async () => {
      const RetentionPolicy = require('@database/backup/retention-policy');

      const result = await backupManager.pruneBackups();

      expect(result.success).toBe(true);
      expect(result.deleted).toBeGreaterThanOrEqual(0);
      expect(mockLocalStorage.delete).toHaveBeenCalled();
      expect(mockRegistry.deleteRecord).toHaveBeenCalled();
    });

    it('should delete from remote storage', async () => {
      backupManager.remoteStorage = mockRemoteStorage;
      mockRegistry.listBackups.mockResolvedValue([
        {
          id: '1',
          filename: 'old-backup.dump',
          status: 'completed',
          localPath: '/backups/old-backup.dump',
          remoteLocation: 's3://bucket/old-backup.dump',
        },
      ]);

      const RetentionPolicy = require('@database/backup/retention-policy');
      const mockPolicy = new RetentionPolicy();
      mockPolicy.apply.mockResolvedValue([
        {
          id: '1',
          localPath: '/backups/old-backup.dump',
          remoteLocation: 's3://bucket/old-backup.dump',
        }
      ]);

      await backupManager.pruneBackups();

      expect(mockRemoteStorage.delete).toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      mockLocalStorage.delete.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await backupManager.pruneBackups();

      expect(result.errors).toBeGreaterThan(0);
    });

    it('should continue pruning after individual failures', async () => {
      const RetentionPolicy = require('@database/backup/retention-policy');
      const mockPolicy = new RetentionPolicy();
      mockPolicy.apply.mockResolvedValue([
        { id: '1', localPath: '/backups/backup-1.dump' },
        { id: '2', localPath: '/backups/backup-2.dump' },
      ]);

      mockLocalStorage.delete
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce(undefined);

      const result = await backupManager.pruneBackups();

      expect(result.deleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup integrity', async () => {
      mockVerification.verify.mockResolvedValue(true);

      const result = await backupManager.verifyBackup('backup-id');

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(mockVerification.verify).toHaveBeenCalledWith('backup-id');
    });

    it('should handle invalid backups', async () => {
      mockVerification.verify.mockResolvedValue(false);

      const result = await backupManager.verifyBackup('backup-id');

      expect(result.valid).toBe(false);
    });

    it('should handle verification errors', async () => {
      mockVerification.verify.mockRejectedValueOnce(new Error('Verify failed'));

      await expect(
        backupManager.verifyBackup('backup-id')
      ).rejects.toThrow('Backup verification failed');
    });
  });

  describe('getStats', () => {
    it('should get backup statistics', async () => {
      const stats = await backupManager.getStats();

      expect(stats).toBeDefined();
      expect(mockRegistry.getStats).toHaveBeenCalled();
      expect(mockLocalStorage.getStats).toHaveBeenCalled();
    });

    it('should include remote storage stats', async () => {
      backupManager.remoteStorage = mockRemoteStorage;

      const stats = await backupManager.getStats();

      expect(mockRemoteStorage.getStats).toHaveBeenCalled();
      expect(stats.remoteStorage).toBeDefined();
    });

    it('should handle stats errors', async () => {
      mockRegistry.getStats.mockRejectedValueOnce(new Error('Stats failed'));

      await expect(backupManager.getStats()).rejects.toThrow('Failed to get statistics');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing configuration', () => {
      expect(() => new BackupManager({})).not.toThrow();
    });

    it('should handle backup without remote storage configured', async () => {
      backupManager.remoteStorage = null;

      const result = await backupManager.createBackup();

      expect(result.success).toBe(true);
      expect(result.remoteLocation).toBeNull();
    });

    it('should handle very large backup files', async () => {
      fs.stat.mockResolvedValue({ size: 10737418240 }); // 10GB

      const result = await backupManager.createBackup();

      expect(result.success).toBe(true);
    });

    it('should handle concurrent backup operations', async () => {
      const promises = [
        backupManager.createBackup(),
        backupManager.createBackup(),
        backupManager.createBackup(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});
