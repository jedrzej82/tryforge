/**
 * Reviews Seeder
 *
 * Seeds the product reviews table.
 * Depends on ProductsSeeder and UsersSeeder.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class ReviewsSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'ReviewsSeeder';
    this.dependencies = ['ProductsSeeder', 'UsersSeeder'];
    this.environments = ['development', 'staging'];
    this.priority = 6;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding reviews...');

    try {
      // Get product IDs
      let productIds = [];
      if (db.query) {
        const result = await db.query('SELECT id FROM products');
        productIds = result.rows.map(r => r.id);
      } else if (db.products && db.products.findAll) {
        const products = await db.products.findAll();
        productIds = products.map(p => p.id);
      } else if (db.collection) {
        const products = await db.collection('products').find({}).toArray();
        productIds = products.map(p => p._id);
      }

      // Get user IDs
      let userIds = [];
      if (db.query) {
        const result = await db.query('SELECT id FROM users');
        userIds = result.rows.map(r => r.id);
      } else if (db.users && db.users.findAll) {
        const users = await db.users.findAll();
        userIds = users.map(u => u.id);
      } else if (db.collection) {
        const users = await db.collection('users').find({}).toArray();
        userIds = users.map(u => u._id);
      }

      this.log(`Found ${productIds.length} products and ${userIds.length} users`);

      // Generate reviews
      const reviewsData = DataGenerator.generateReviews(300, productIds, userIds);

      const batchSize = 50;
      const batches = this.chunk(reviewsData, batchSize);
      let inserted = 0;

      for (const batch of batches) {
        if (db.query) {
          for (const review of batch) {
            await db.query(
              `INSERT INTO reviews (
                product_id, user_id, rating, title, content, verified,
                helpful, not_helpful, images, approved, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                review.productId,
                review.userId,
                review.rating,
                review.title,
                review.content,
                review.verified,
                review.helpful,
                review.notHelpful,
                JSON.stringify(review.images),
                review.approved,
                review.createdAt,
                review.updatedAt
              ]
            );
          }
        } else if (db.reviews && db.reviews.createMany) {
          await db.reviews.createMany(batch);
        } else if (db.collection) {
          await db.collection('reviews').insertMany(batch);
        }

        inserted += batch.length;
        this.logProgress(inserted, reviewsData.length, 'reviews');
      }

      this.log(`Created ${inserted} reviews`, 'success');

    } catch (error) {
      this.log(`Error seeding reviews: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back reviews...');

    try {
      if (db.query) {
        await db.query('DELETE FROM reviews');
      } else if (db.reviews && db.reviews.deleteMany) {
        await db.reviews.deleteMany({});
      } else if (db.collection) {
        await db.collection('reviews').deleteMany({});
      }

      this.log('Reviews rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back reviews: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = ReviewsSeeder;
