/**
 * Users API Integration Tests
 *
 * Tests for user management endpoints including listing, updating,
 * deleting users, and role-based access control.
 */

const request = require('supertest');
const app = require('../../../src/app'); // Express app - adjust path as needed

describe('Users API Integration Tests', () => {
  let adminToken;
  let adminUser;
  let userToken;
  let regularUser;

  beforeEach(async () => {
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        name: 'Admin User',
        username: 'admin',
        role: 'admin'
      });

    adminToken = adminResponse.body.token;
    adminUser = adminResponse.body.user;

    // Create regular user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'UserPassword123!',
        name: 'Regular User',
        username: 'regularuser',
        role: 'user'
      });

    userToken = userResponse.body.token;
    regularUser = userResponse.body.user;
  });

  describe('GET /api/v1/users', () => {
    it('should return list of users for admin', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    it('should deny access for regular user', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/forbidden|not.*authorized/i);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should support pagination', async () => {
      // Create multiple users
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `user${i}@example.com`,
            password: 'Password123!',
            name: `User ${i}`,
            username: `user${i}`
          });
      }

      const response = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    it('should support searching by name or email', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const found = response.body.data.some(user =>
        user.email.includes('admin') || user.name.toLowerCase().includes('admin')
      );
      expect(found).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/users?sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(1);

      // Verify sorting
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].name >= response.body.data[i - 1].name).toBe(true);
      }
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(regularUser.id);
      expect(response.body.email).toBe(regularUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should allow user to view own profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(regularUser.id);
    });

    it('should deny access when user views other profiles', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not.*found/i);
    });

    it('should validate ID format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update own profile', async () => {
      const updates = {
        name: 'Updated Name',
        bio: 'This is my updated bio'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.bio).toBe(updates.bio);

      // Verify in database
      const result = await global.testDb.query(
        'SELECT name, bio FROM users WHERE id = $1',
        [regularUser.id]
      );
      expect(result.rows[0].name).toBe(updates.name);
      expect(result.rows[0].bio).toBe(updates.bio);
    });

    it('should not allow updating other user profiles', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked Name' })
        .expect(403);

      expect(response.body).toHaveProperty('error');

      // Verify admin name unchanged
      const result = await global.testDb.query(
        'SELECT name FROM users WHERE id = $1',
        [adminUser.id]
      );
      expect(result.rows[0].name).toBe(adminUser.name);
    });

    it('should allow admin to update any user', async () => {
      const updates = {
        name: 'Admin Updated Name',
        role: 'moderator'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.role).toBe(updates.role);
    });

    it('should not allow regular user to change role', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body).toHaveProperty('error');

      // Verify role unchanged
      const result = await global.testDb.query(
        'SELECT role FROM users WHERE id = $1',
        [regularUser.id]
      );
      expect(result.rows[0].role).toBe('user');
    });

    it('should not allow updating email to duplicate', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: adminUser.email })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email.*already.*exists/i);
    });

    it('should validate email format on update', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should update password with proper validation', async () => {
      const updates = {
        currentPassword: 'UserPassword123!',
        newPassword: 'NewUserPassword123!'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(200);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: regularUser.email,
          password: updates.newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should reject password update with wrong current password', async () => {
      const updates = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewUserPassword123!'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/current.*password.*incorrect/i);
    });

    it('should track update timestamp', async () => {
      await global.testHelpers.wait(100); // Ensure time difference

      const response = await request(app)
        .patch(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.updated_at).toBeTruthy();
      expect(new Date(response.body.updated_at) > new Date(regularUser.created_at)).toBe(true);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should allow admin to delete user', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/deleted.*success/i);

      // Verify user deleted from database
      const result = await global.testDb.query(
        'SELECT * FROM users WHERE id = $1',
        [regularUser.id]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should not allow regular user to delete other users', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');

      // Verify admin still exists
      const result = await global.testDb.query(
        'SELECT * FROM users WHERE id = $1',
        [adminUser.id]
      );
      expect(result.rows.length).toBe(1);
    });

    it('should allow user to delete own account', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify user deleted
      const result = await global.testDb.query(
        'SELECT * FROM users WHERE id = $1',
        [regularUser.id]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should soft delete user if configured', async () => {
      // Assuming soft delete is enabled
      await request(app)
        .delete(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check for deleted_at timestamp
      const result = await global.testDb.query(
        'SELECT deleted_at FROM users WHERE id = $1',
        [regularUser.id]
      );

      if (result.rows.length > 0) {
        // Soft delete is enabled
        expect(result.rows[0].deleted_at).toBeTruthy();
      }
    });
  });

  describe('POST /api/v1/users/:id/activate', () => {
    let inactiveUser;

    beforeEach(async () => {
      // Create inactive user
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'inactive@example.com',
          password: 'Password123!',
          name: 'Inactive User',
          username: 'inactive',
          is_active: false
        });

      inactiveUser = response.body.user;
    });

    it('should allow admin to activate user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${inactiveUser.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.is_active).toBe(true);

      // Verify in database
      const result = await global.testDb.query(
        'SELECT is_active FROM users WHERE id = $1',
        [inactiveUser.id]
      );
      expect(result.rows[0].is_active).toBe(true);
    });

    it('should not allow regular user to activate accounts', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${inactiveUser.id}/activate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/users/:id/deactivate', () => {
    it('should allow admin to deactivate user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${regularUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.is_active).toBe(false);

      // Verify in database
      const result = await global.testDb.query(
        'SELECT is_active FROM users WHERE id = $1',
        [regularUser.id]
      );
      expect(result.rows[0].is_active).toBe(false);
    });

    it('should prevent deactivated user from logging in', async () => {
      // Deactivate user
      await request(app)
        .post(`/api/v1/users/${regularUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Try to login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: regularUser.email,
          password: 'UserPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/account.*deactivated|inactive/i);
    });
  });

  describe('GET /api/v1/users/:id/activity', () => {
    it('should return user activity log for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow user to view own activity', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/activity`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should not allow user to view other users activity', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${adminUser.id}/activity`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });
});
