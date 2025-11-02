/**
 * Categories Seeder
 *
 * Seeds the categories table for product categorization.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class CategoriesSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'CategoriesSeeder';
    this.dependencies = [];
    this.environments = ['development', 'staging'];
    this.priority = 2;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding categories...');

    try {
      const categoriesData = DataGenerator.generateCategories(15);

      let inserted = 0;

      for (const category of categoriesData) {
        if (db.query) {
          await db.query(
            `INSERT INTO categories (
              name, slug, description, image, active, "order", created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              category.name,
              category.slug,
              category.description,
              category.image,
              category.active,
              category.order,
              category.createdAt,
              category.updatedAt
            ]
          );
        } else if (db.categories && db.categories.create) {
          await db.categories.create(category);
        } else if (db.collection) {
          await db.collection('categories').insertOne(category);
        }

        inserted++;
        this.logProgress(inserted, categoriesData.length, 'categories');
      }

      this.log(`Created ${inserted} categories`, 'success');

    } catch (error) {
      this.log(`Error seeding categories: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back categories...');

    try {
      if (db.query) {
        await db.query('DELETE FROM categories');
      } else if (db.categories && db.categories.deleteMany) {
        await db.categories.deleteMany({});
      } else if (db.collection) {
        await db.collection('categories').deleteMany({});
      }

      this.log('Categories rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back categories: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = CategoriesSeeder;
