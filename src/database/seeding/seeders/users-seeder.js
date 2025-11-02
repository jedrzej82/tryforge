/**
 * Users Seeder
 *
 * Seeds the users table with realistic user data including
 * admin and regular users.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');
const bcrypt = require('bcryptjs');

class UsersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'UsersSeeder';
    this.dependencies = [];
    this.environments = ['development', 'staging'];
    this.priority = 1;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding users...');

    try {
      // Generate users with admin
      const usersData = DataGenerator.generateUsers(50, {
        roles: ['user', 'moderator'],
        includeAdmin: true,
        verified: true
      });

      // Hash passwords
      this.log('Hashing passwords...');
      for (const user of usersData) {
        user.password = await this.hashPassword('password123');
      }

      // Insert in batches
      const batchSize = 10;
      const batches = this.chunk(usersData, batchSize);
      let inserted = 0;

      for (const batch of batches) {
        // Example for PostgreSQL with pg client
        if (db.query) {
          for (const user of batch) {
            await db.query(
              `INSERT INTO users (
                email, first_name, last_name, name, username, password,
                role, phone, avatar, bio, birth_date, verified,
                address, preferences, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
              [
                user.email,
                user.firstName,
                user.lastName,
                user.name,
                user.username,
                user.password,
                user.role,
                user.phone,
                user.avatar,
                user.bio,
                user.birthDate,
                user.verified,
                JSON.stringify(user.address),
                JSON.stringify(user.preferences),
                user.createdAt,
                user.updatedAt
              ]
            );
          }
        }
        // Example for ORM (Sequelize, TypeORM, Prisma, etc.)
        else if (db.users && db.users.createMany) {
          await db.users.createMany(batch);
        }
        // Example for MongoDB
        else if (db.collection) {
          await db.collection('users').insertMany(batch);
        }

        inserted += batch.length;
        this.logProgress(inserted, usersData.length, 'users');
      }

      this.log(`Created ${inserted} users`, 'success');

    } catch (error) {
      this.log(`Error seeding users: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back users...');

    try {
      if (db.query) {
        await db.query('DELETE FROM users');
      } else if (db.users && db.users.deleteMany) {
        await db.users.deleteMany({});
      } else if (db.collection) {
        await db.collection('users').deleteMany({});
      }

      this.log('Users rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back users: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   * @private
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}

module.exports = UsersSeeder;
