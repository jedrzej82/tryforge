/**
 * User Registration Workflow Integration Tests
 *
 * Tests complete user registration workflows including registration,
 * email verification, login, profile management, and logout.
 */

const request = require('supertest');
const app = require('../../../src/app'); // Express app - adjust path as needed

describe('User Registration Workflow Integration Tests', () => {
  describe('Complete Registration and Login Flow', () => {
    it('should complete full registration, verification, and login workflow', async () => {
      const userData = {
        email: 'workflow@example.com',
        password: 'WorkflowPassword123!',
        name: 'Workflow User',
        username: 'workflowuser'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('user');
      const { token, user } = registerResponse.body;

      // Step 2: Verify user can access protected route with token
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.id).toBe(user.id);
      expect(meResponse.body.email).toBe(userData.email);

      // Step 3: Update user profile
      const updateResponse = await request(app)
        .patch(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Workflow User',
          bio: 'This is my bio'
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Workflow User');
      expect(updateResponse.body.bio).toBe('This is my bio');

      // Step 4: Verify update persisted
      const verifyResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(verifyResponse.body.name).toBe('Updated Workflow User');
      expect(verifyResponse.body.bio).toBe('This is my bio');

      // Step 5: Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('message');

      // Step 6: Verify token invalidated after logout
      const invalidatedResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(invalidatedResponse.body).toHaveProperty('error');

      // Step 7: Login again with credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.token).not.toBe(token); // New token should be different

      // Step 8: Verify can access protected route with new token
      const finalResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(finalResponse.body.email).toBe(userData.email);
    });

    it('should handle email verification workflow', async () => {
      const userData = {
        email: 'verification@example.com',
        password: 'VerifyPassword123!',
        name: 'Verify User',
        username: 'verifyuser'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { user } = registerResponse.body;

      // Step 2: Verify email_verified is false initially
      expect(user.email_verified).toBe(false);

      // Step 3: Get verification token from database
      const tokenResult = await global.testDb.query(
        'SELECT verification_token FROM users WHERE id = $1',
        [user.id]
      );

      const verificationToken = tokenResult.rows[0].verification_token;
      expect(verificationToken).toBeTruthy();

      // Step 4: Verify email
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('message');
      expect(verifyResponse.body.message).toMatch(/verified.*success/i);

      // Step 5: Verify email_verified is now true
      const updatedResult = await global.testDb.query(
        'SELECT email_verified, verification_token FROM users WHERE id = $1',
        [user.id]
      );

      expect(updatedResult.rows[0].email_verified).toBe(true);
      expect(updatedResult.rows[0].verification_token).toBeNull();
    });

    it('should handle password reset workflow', async () => {
      const userData = {
        email: 'resetworkflow@example.com',
        password: 'OldPassword123!',
        name: 'Reset Workflow User',
        username: 'resetworkflow'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { user } = registerResponse.body;

      // Step 2: Request password reset
      const forgotResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      expect(forgotResponse.body).toHaveProperty('message');

      // Step 3: Get reset token from database
      const tokenResult = await global.testDb.query(
        'SELECT reset_token, reset_token_expires FROM users WHERE id = $1',
        [user.id]
      );

      const resetToken = tokenResult.rows[0].reset_token;
      expect(resetToken).toBeTruthy();
      expect(tokenResult.rows[0].reset_token_expires).toBeTruthy();

      // Step 4: Reset password
      const newPassword = 'NewPassword123!';
      const resetResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(resetResponse.body).toHaveProperty('message');

      // Step 5: Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      expect(oldLoginResponse.body).toHaveProperty('error');

      // Step 6: Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: newPassword
        })
        .expect(200);

      expect(newLoginResponse.body).toHaveProperty('token');

      // Step 7: Verify reset token cleared
      const clearedResult = await global.testDb.query(
        'SELECT reset_token FROM users WHERE id = $1',
        [user.id]
      );

      expect(clearedResult.rows[0].reset_token).toBeNull();
    });
  });

  describe('User Profile Management Workflow', () => {
    let token;
    let user;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'ProfilePassword123!',
          name: 'Profile User',
          username: 'profileuser'
        });

      token = registerResponse.body.token;
      user = registerResponse.body.user;
    });

    it('should complete profile setup workflow', async () => {
      // Step 1: Update basic profile information
      const basicUpdateResponse = await request(app)
        .patch(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Profile User',
          bio: 'Software Developer',
          location: 'San Francisco, CA'
        })
        .expect(200);

      expect(basicUpdateResponse.body.name).toBe('Updated Profile User');

      // Step 2: Update avatar/profile picture
      const avatarResponse = await request(app)
        .patch(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          avatar_url: 'https://example.com/avatar.jpg'
        })
        .expect(200);

      expect(avatarResponse.body.avatar_url).toBe('https://example.com/avatar.jpg');

      // Step 3: Update preferences
      const preferencesResponse = await request(app)
        .patch(`/api/v1/users/${user.id}/preferences`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          theme: 'dark',
          notifications_enabled: true,
          newsletter_subscribed: false
        })
        .expect(200);

      expect(preferencesResponse.body).toBeTruthy();

      // Step 4: Verify all changes persisted
      const finalProfile = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(finalProfile.body.name).toBe('Updated Profile User');
      expect(finalProfile.body.bio).toBe('Software Developer');
      expect(finalProfile.body.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should complete password change workflow', async () => {
      const currentPassword = 'ProfilePassword123!';
      const newPassword = 'NewProfilePassword123!';

      // Step 1: Change password
      const changeResponse = await request(app)
        .patch(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword,
          newPassword
        })
        .expect(200);

      expect(changeResponse.body).toHaveProperty('message');

      // Step 2: Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Step 3: Try login with old password (should fail)
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: currentPassword
        })
        .expect(401);

      // Step 4: Login with new password (should succeed)
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should complete email change workflow', async () => {
      const newEmail = 'newemail@example.com';

      // Step 1: Request email change
      const changeResponse = await request(app)
        .patch(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: newEmail
        })
        .expect(200);

      // Step 2: Verify new email needs verification
      expect(changeResponse.body.email_verified).toBe(false);

      // Step 3: Get new verification token
      const tokenResult = await global.testDb.query(
        'SELECT verification_token FROM users WHERE id = $1',
        [user.id]
      );

      const verificationToken = tokenResult.rows[0].verification_token;

      // Step 4: Verify new email
      await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      // Step 5: Verify email updated and verified
      const updatedUser = await global.testDb.query(
        'SELECT email, email_verified FROM users WHERE id = $1',
        [user.id]
      );

      expect(updatedUser.rows[0].email).toBe(newEmail);
      expect(updatedUser.rows[0].email_verified).toBe(true);
    });
  });

  describe('Account Deactivation and Deletion Workflow', () => {
    let token;
    let user;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'deletion@example.com',
          password: 'DeletionPassword123!',
          name: 'Deletion User',
          username: 'deletionuser'
        });

      token = registerResponse.body.token;
      user = registerResponse.body.user;
    });

    it('should complete account deactivation workflow', async () => {
      // Step 1: Deactivate account
      const deactivateResponse = await request(app)
        .post(`/api/v1/users/${user.id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(deactivateResponse.body.is_active).toBe(false);

      // Step 2: Verify cannot login with deactivated account
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'DeletionPassword123!'
        })
        .expect(401);

      // Step 3: Reactivate account (admin action)
      const adminResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'AdminPassword123!',
          name: 'Admin User',
          username: 'admin',
          role: 'admin'
        });

      const adminToken = adminResponse.body.token;

      await request(app)
        .post(`/api/v1/users/${user.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Step 4: Verify can login again
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'DeletionPassword123!'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should complete account deletion workflow', async () => {
      // Step 1: Delete account
      const deleteResponse = await request(app)
        .delete(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message');

      // Step 2: Verify token is invalid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Step 3: Verify cannot login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'DeletionPassword123!'
        })
        .expect(401);

      // Step 4: Verify user removed from database (or soft deleted)
      const userResult = await global.testDb.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );

      if (userResult.rows.length > 0) {
        // Soft delete - should have deleted_at timestamp
        expect(userResult.rows[0].deleted_at).toBeTruthy();
      } else {
        // Hard delete - no rows should exist
        expect(userResult.rows.length).toBe(0);
      }
    });
  });

  describe('Token Refresh Workflow', () => {
    let accessToken;
    let refreshToken;
    let user;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'RefreshPassword123!',
          name: 'Refresh User',
          username: 'refreshuser'
        });

      accessToken = registerResponse.body.token;
      refreshToken = registerResponse.body.refreshToken;
      user = registerResponse.body.user;
    });

    it('should complete token refresh workflow', async () => {
      // Step 1: Use access token to access protected resource
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.id).toBe(user.id);

      // Step 2: Refresh access token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('token');
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      const newAccessToken = refreshResponse.body.token;
      const newRefreshToken = refreshResponse.body.refreshToken;

      // Step 3: Verify new tokens are different
      expect(newAccessToken).not.toBe(accessToken);
      expect(newRefreshToken).not.toBe(refreshToken);

      // Step 4: Use new access token
      const newMeResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newMeResponse.body.id).toBe(user.id);

      // Step 5: Verify old refresh token is invalid
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Multi-Device Session Management Workflow', () => {
    let user;
    let device1Token;
    let device2Token;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'multidevice@example.com',
          password: 'MultiDevicePassword123!',
          name: 'Multi Device User',
          username: 'multideviceuser'
        });

      user = registerResponse.body.user;
      device1Token = registerResponse.body.token;

      // Login from second device
      const device2Response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'MultiDevicePassword123!'
        });

      device2Token = device2Response.body.token;
    });

    it('should manage multiple active sessions', async () => {
      // Step 1: Verify both tokens work
      const device1Response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device1Token}`)
        .expect(200);

      const device2Response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device2Token}`)
        .expect(200);

      expect(device1Response.body.id).toBe(user.id);
      expect(device2Response.body.id).toBe(user.id);

      // Step 2: Logout from one device
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${device1Token}`)
        .expect(200);

      // Step 3: Verify device 1 token is invalid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device1Token}`)
        .expect(401);

      // Step 4: Verify device 2 token still works
      const stillActiveResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device2Token}`)
        .expect(200);

      expect(stillActiveResponse.body.id).toBe(user.id);
    });

    it('should logout from all devices', async () => {
      // Step 1: Logout from all devices
      await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${device1Token}`)
        .expect(200);

      // Step 2: Verify both tokens are invalid
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device1Token}`)
        .expect(401);

      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${device2Token}`)
        .expect(401);

      // Step 3: Login again should work
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'MultiDevicePassword123!'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle registration with existing email gracefully', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'User One',
        username: 'userone'
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const duplicateResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...userData, username: 'usertwo' })
        .expect(400);

      expect(duplicateResponse.body).toHaveProperty('error');

      // User should be able to login with original account
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should handle expired reset token gracefully', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'expired@example.com',
          password: 'Password123!',
          name: 'Expired User',
          username: 'expireduser'
        });

      // Request password reset
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'expired@example.com' })
        .expect(200);

      // Manually expire the token in database
      await global.testDb.query(
        "UPDATE users SET reset_token_expires = NOW() - INTERVAL '1 hour' WHERE email = $1",
        ['expired@example.com']
      );

      // Get expired token
      const result = await global.testDb.query(
        'SELECT reset_token FROM users WHERE email = $1',
        ['expired@example.com']
      );

      // Try to reset with expired token
      const resetResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: result.rows[0].reset_token,
          password: 'NewPassword123!'
        })
        .expect(400);

      expect(resetResponse.body).toHaveProperty('error');
      expect(resetResponse.body.error).toMatch(/expired|invalid/i);

      // User should be able to request new token
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'expired@example.com' })
        .expect(200);
    });
  });
});
