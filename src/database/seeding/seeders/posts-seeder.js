/**
 * Posts Seeder
 *
 * Seeds the blog posts table.
 * Depends on UsersSeeder for authors.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class PostsSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'PostsSeeder';
    this.dependencies = ['UsersSeeder'];
    this.environments = ['development', 'staging'];
    this.priority = 5;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding posts...');

    try {
      // Get author IDs
      let authorIds = [];
      if (db.query) {
        const result = await db.query('SELECT id FROM users LIMIT 10');
        authorIds = result.rows.map(r => r.id);
      } else if (db.users && db.users.findAll) {
        const users = await db.users.findAll({ limit: 10 });
        authorIds = users.map(u => u.id);
      } else if (db.collection) {
        const users = await db.collection('users').find({}).limit(10).toArray();
        authorIds = users.map(u => u._id);
      }

      this.log(`Found ${authorIds.length} authors`);

      // Generate posts
      const postsData = DataGenerator.generatePosts(50, authorIds);

      let inserted = 0;

      for (const post of postsData) {
        if (db.query) {
          await db.query(
            `INSERT INTO posts (
              title, slug, excerpt, content, author_id, cover_image,
              images, status, categories, tags, seo, view_count,
              like_count, comment_count, featured, allow_comments,
              published_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [
              post.title,
              post.slug,
              post.excerpt,
              post.content,
              post.authorId,
              post.coverImage,
              JSON.stringify(post.images),
              post.status,
              JSON.stringify(post.categories),
              JSON.stringify(post.tags),
              JSON.stringify(post.seo),
              post.viewCount,
              post.likeCount,
              post.commentCount,
              post.featured,
              post.allowComments,
              post.publishedAt,
              post.createdAt,
              post.updatedAt
            ]
          );
        } else if (db.posts && db.posts.create) {
          await db.posts.create(post);
        } else if (db.collection) {
          await db.collection('posts').insertOne(post);
        }

        inserted++;
        this.logProgress(inserted, postsData.length, 'posts');
      }

      this.log(`Created ${inserted} posts`, 'success');

    } catch (error) {
      this.log(`Error seeding posts: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back posts...');

    try {
      if (db.query) {
        await db.query('DELETE FROM posts');
      } else if (db.posts && db.posts.deleteMany) {
        await db.posts.deleteMany({});
      } else if (db.collection) {
        await db.collection('posts').deleteMany({});
      }

      this.log('Posts rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back posts: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = PostsSeeder;
