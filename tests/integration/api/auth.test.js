/**
 * Authentication API Integration Tests
 *
 * Tests for user authentication endpoints including registration,
 * login, logout, and token management.
 */

const request = require('supertest');
const app = require('../../../src/app'); // Express app - adjust path as needed

describe('Authentication API Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty('password'); // Password should not be returned

      // Verify user exists in database
      const result = await global.testDb.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].email).toBe(userData.email);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'User 1',
        username: 'user1'
      };

      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...userData, name: 'User 2', username: 'user2' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email.*already.*exists/i);
    });

    it('should reject registration with duplicate username', async () => {
      const userData1 = {
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1',
        username: 'duplicate_username'
      };

      const userData2 = {
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
        username: 'duplicate_username'
      };

      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData1)
        .expect(201);

      // Try to create duplicate username
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData2)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/username.*already.*exists/i);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' }) // Missing password and name
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          username: 'testuser'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should enforce password strength requirements', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Weak password
          name: 'Test User',
          username: 'testuser'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain(/password/i);
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'hashtest@example.com',
        password: 'MySecurePassword123!',
        name: 'Hash Test User',
        username: 'hashtest'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Verify password is hashed
      const result = await global.testDb.query(
        'SELECT password FROM users WHERE email = $1',
        [userData.email]
      );

      expect(result.rows[0].password).not.toBe(userData.password);
      expect(result.rows[0].password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user before each login test
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123!',
          name: 'Login Test User',
          username: 'logintest'
        });
      testUser = response.body.user;
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('logintest@example.com');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    });

    it('should login with username instead of email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'LoginPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('logintest@example.com');
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123!'
        })
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should track last login time', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123!'
        })
        .expect(200);

      // Verify last_login was updated
      const result = await global.testDb.query(
        'SELECT last_login FROM users WHERE email = $1',
        ['logintest@example.com']
      );

      expect(result.rows[0].last_login).toBeTruthy();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'metest@example.com',
          password: 'MeTestPassword123!',
          name: 'Me Test User',
          username: 'metest'
        });

      token = registerResponse.body.token;
      testUser = registerResponse.body.user;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe('metest@example.com');
      expect(response.body.name).toBe('Me Test User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/token.*required|unauthorized/i);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with expired token', async () => {
      // This would require generating an expired token
      // Implementation depends on your JWT library
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid';

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept token in different authorization formats', async () => {
      // Test with 'Token' prefix
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Token ${token}`)
        .expect(200);

      expect(response.body.email).toBe('metest@example.com');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let token;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logouttest@example.com',
          password: 'LogoutPassword123!',
          name: 'Logout Test User',
          username: 'logouttest'
        });

      token = response.body.token;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/logout.*success/i);
    });

    it('should invalidate token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use token after logout
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refreshtest@example.com',
          password: 'RefreshPassword123!',
          name: 'Refresh Test User',
          username: 'refreshtest'
        });

      accessToken = loginResponse.body.token;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.token).not.toBe(accessToken); // New token should be different
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired refresh token', async () => {
      // Implementation depends on your token expiry logic
      const expiredRefreshToken = 'expired-token-here';

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredRefreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'forgot@example.com',
          password: 'ForgotPassword123!',
          name: 'Forgot Password User',
          username: 'forgotpassword'
        });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/reset.*email.*sent/i);
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success to prevent email enumeration
      expect(response.body).toHaveProperty('message');
    });

    it('should create password reset token in database', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      const result = await global.testDb.query(
        'SELECT reset_token, reset_token_expires FROM users WHERE email = $1',
        ['forgot@example.com']
      );

      expect(result.rows[0].reset_token).toBeTruthy();
      expect(result.rows[0].reset_token_expires).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'reset@example.com',
          password: 'OldPassword123!',
          name: 'Reset Password User',
          username: 'resetpassword'
        });

      // Request password reset
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      // Get reset token from database
      const result = await global.testDb.query(
        'SELECT reset_token FROM users WHERE email = $1',
        ['reset@example.com']
      );
      resetToken = result.rows[0].reset_token;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/password.*reset.*success/i);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset@example.com',
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should clear reset token after successful reset', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!'
        })
        .expect(200);

      const result = await global.testDb.query(
        'SELECT reset_token FROM users WHERE email = $1',
        ['reset@example.com']
      );

      expect(result.rows[0].reset_token).toBeNull();
    });
  });
});
