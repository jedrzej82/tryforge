/**
 * Example Test: User Model
 *
 * Demonstrates how to use TryForge database testing utilities
 */

const { DatabaseTestManager, FixtureManager, TestDataFactory } = require('../');

describe('User Model', () => {
  let testManager;
  let fixtureManager;
  let dataFactory;
  let testDatabase;

  // Setup before all tests in this suite
  beforeAll(async () => {
    testManager = new DatabaseTestManager();
    await testManager.initialize();

    testDatabase = await testManager.createTestDatabase('user-tests');

    fixtureManager = new FixtureManager({
      connection: testDatabase.connection
    });

    dataFactory = new TestDataFactory();

    // Run migrations (if you have a migrate function)
    // await runMigrations(testDatabase.connection);
  });

  // Cleanup after all tests
  afterAll(async () => {
    await testManager.destroyTestDatabase(testDatabase.name);
    await testManager.cleanup();
  });

  // Reset database before each test
  beforeEach(async () => {
    await testManager.resetDatabase(testDatabase.name);
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = dataFactory.generateUser({
        email: 'test@example.com',
        role: 'user'
      });

      const result = await testDatabase.connection.query(
        `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userData.email,
          userData.username,
          userData.firstName,
          userData.lastName,
          userData.name,
          userData.password,
          userData.role,
          userData.isActive,
          userData.emailVerified,
          userData.createdAt,
          userData.updatedAt
        ]
      );

      const user = result.rows[0];

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.is_active).toBe(true);
    });

    it('should create multiple users', async () => {
      const users = [];

      for (let i = 0; i < 5; i++) {
        const userData = dataFactory.generateUser();
        const result = await testDatabase.connection.query(
          `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            userData.email,
            userData.username,
            userData.firstName,
            userData.lastName,
            userData.name,
            userData.password,
            userData.role,
            userData.isActive,
            userData.emailVerified,
            userData.createdAt,
            userData.updatedAt
          ]
        );
        users.push(result.rows[0]);
      }

      expect(users).toHaveLength(5);

      // Verify in database
      const countResult = await testDatabase.connection.query(
        'SELECT COUNT(*) as count FROM users'
      );
      expect(parseInt(countResult.rows[0].count)).toBe(5);
    });

    it('should create admin user', async () => {
      const adminData = dataFactory.generateAdminUser();

      const result = await testDatabase.connection.query(
        `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          adminData.email,
          adminData.username,
          adminData.firstName,
          adminData.lastName,
          adminData.name,
          adminData.password,
          adminData.role,
          adminData.isActive,
          adminData.emailVerified,
          adminData.createdAt,
          adminData.updatedAt
        ]
      );

      const admin = result.rows[0];

      expect(admin.role).toBe('admin');
      expect(admin.email_verified).toBe(true);
    });
  });

  describe('User Fixtures', () => {
    it('should load user fixtures', async () => {
      const fixtures = await fixtureManager.loadFixtures('users.json');

      expect(fixtures.users).toBeDefined();
      expect(fixtures.users.length).toBeGreaterThan(0);

      // Verify in database
      const result = await testDatabase.connection.query('SELECT * FROM users');
      expect(result.rows.length).toBe(fixtures.users.length);
    });

    it('should find admin user from fixtures', async () => {
      await fixtureManager.loadFixtures('users.json');

      const result = await testDatabase.connection.query(
        'SELECT * FROM users WHERE email = $1',
        ['admin@example.com']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].role).toBe('admin');
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Load fixtures for query tests
      await fixtureManager.loadFixtures('users.json');
    });

    it('should find user by email', async () => {
      const result = await testDatabase.connection.query(
        'SELECT * FROM users WHERE email = $1',
        ['user@example.com']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].username).toBe('testuser');
    });

    it('should find all active users', async () => {
      const result = await testDatabase.connection.query(
        'SELECT * FROM users WHERE is_active = true'
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should find verified users', async () => {
      const result = await testDatabase.connection.query(
        'SELECT * FROM users WHERE email_verified = true'
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should count users by role', async () => {
      const result = await testDatabase.connection.query(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role'
      );

      expect(result.rows.length).toBeGreaterThan(0);

      const adminCount = result.rows.find(r => r.role === 'admin');
      expect(adminCount).toBeDefined();
    });
  });

  describe('User Updates', () => {
    it('should update user email', async () => {
      const userData = dataFactory.generateUser();

      // Create user
      const createResult = await testDatabase.connection.query(
        `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userData.email,
          userData.username,
          userData.firstName,
          userData.lastName,
          userData.name,
          userData.password,
          userData.role,
          userData.isActive,
          userData.emailVerified,
          userData.createdAt,
          userData.updatedAt
        ]
      );

      const userId = createResult.rows[0].id;

      // Update email
      const newEmail = 'newemail@example.com';
      await testDatabase.connection.query(
        'UPDATE users SET email = $1, updated_at = $2 WHERE id = $3',
        [newEmail, new Date(), userId]
      );

      // Verify update
      const selectResult = await testDatabase.connection.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(selectResult.rows[0].email).toBe(newEmail);
    });

    it('should verify user email', async () => {
      const userData = dataFactory.generateUser({
        emailVerified: false
      });

      // Create user
      const createResult = await testDatabase.connection.query(
        `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userData.email,
          userData.username,
          userData.firstName,
          userData.lastName,
          userData.name,
          userData.password,
          userData.role,
          userData.isActive,
          userData.emailVerified,
          userData.createdAt,
          userData.updatedAt
        ]
      );

      const userId = createResult.rows[0].id;

      // Verify email
      await testDatabase.connection.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [userId]
      );

      // Check verification
      const selectResult = await testDatabase.connection.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(selectResult.rows[0].email_verified).toBe(true);
    });
  });

  describe('User Deletion', () => {
    it('should delete user', async () => {
      const userData = dataFactory.generateUser();

      // Create user
      const createResult = await testDatabase.connection.query(
        `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userData.email,
          userData.username,
          userData.firstName,
          userData.lastName,
          userData.name,
          userData.password,
          userData.role,
          userData.isActive,
          userData.emailVerified,
          userData.createdAt,
          userData.updatedAt
        ]
      );

      const userId = createResult.rows[0].id;

      // Delete user
      await testDatabase.connection.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );

      // Verify deletion
      const selectResult = await testDatabase.connection.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(selectResult.rows.length).toBe(0);
    });
  });

  describe('Transaction Tests', () => {
    it('should rollback on error', async () => {
      await testManager.runInTransaction(testDatabase.connection, async (client) => {
        const userData = dataFactory.generateUser();

        // Insert user in transaction
        await client.query(
          `INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            userData.email,
            userData.username,
            userData.firstName,
            userData.lastName,
            userData.name,
            userData.password,
            userData.role,
            userData.isActive,
            userData.emailVerified,
            userData.createdAt,
            userData.updatedAt
          ]
        );

        // Transaction will be rolled back
      });

      // Verify rollback
      const result = await testDatabase.connection.query('SELECT COUNT(*) as count FROM users');
      expect(parseInt(result.rows[0].count)).toBe(0);
    });
  });
});
