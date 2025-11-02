/**
 * Products Seeder
 *
 * Seeds the products table with realistic product data.
 * Depends on CategoriesSeeder.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class ProductsSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'ProductsSeeder';
    this.dependencies = ['CategoriesSeeder'];
    this.environments = ['development', 'staging'];
    this.priority = 3;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding products...');

    try {
      // Get category IDs
      let categoryIds = [];

      if (db.query) {
        const result = await db.query('SELECT id FROM categories');
        categoryIds = result.rows.map(r => r.id);
      } else if (db.categories && db.categories.findAll) {
        const categories = await db.categories.findAll();
        categoryIds = categories.map(c => c.id);
      } else if (db.collection) {
        const categories = await db.collection('categories').find({}).toArray();
        categoryIds = categories.map(c => c._id);
      }

      this.log(`Found ${categoryIds.length} categories`);

      // Generate products
      const productsData = DataGenerator.generateProducts(100, categoryIds);

      // Insert in batches
      const batchSize = 20;
      const batches = this.chunk(productsData, batchSize);
      let inserted = 0;

      for (const batch of batches) {
        if (db.query) {
          for (const product of batch) {
            await db.query(
              `INSERT INTO products (
                name, slug, sku, description, long_description, price,
                compare_at_price, cost, stock, low_stock_threshold,
                category_id, brand, images, tags, attributes, seo,
                rating, review_count, published, featured,
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
              [
                product.name,
                product.slug,
                product.sku,
                product.description,
                product.longDescription,
                product.price,
                product.compareAtPrice,
                product.cost,
                product.stock,
                product.lowStockThreshold,
                product.categoryId,
                product.brand,
                JSON.stringify(product.images),
                JSON.stringify(product.tags),
                JSON.stringify(product.attributes),
                JSON.stringify(product.seo),
                product.rating,
                product.reviewCount,
                product.published,
                product.featured,
                product.createdAt,
                product.updatedAt
              ]
            );
          }
        } else if (db.products && db.products.createMany) {
          await db.products.createMany(batch);
        } else if (db.collection) {
          await db.collection('products').insertMany(batch);
        }

        inserted += batch.length;
        this.logProgress(inserted, productsData.length, 'products');
      }

      this.log(`Created ${inserted} products`, 'success');

    } catch (error) {
      this.log(`Error seeding products: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back products...');

    try {
      if (db.query) {
        await db.query('DELETE FROM products');
      } else if (db.products && db.products.deleteMany) {
        await db.products.deleteMany({});
      } else if (db.collection) {
        await db.collection('products').deleteMany({});
      }

      this.log('Products rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back products: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = ProductsSeeder;
