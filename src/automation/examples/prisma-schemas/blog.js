/**
 * Blog Prisma Schema Example
 * Complete schema for a blog/content management system
 */

const PrismaSchemaBuilder = require('../../prisma-schema-builder');

function getBlogSchema() {
  const builder = new PrismaSchemaBuilder({
    provider: 'postgresql'
  });

  // Enums
  builder.addEnum('UserRole', ['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER']);
  builder.addEnum('PostStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

  // User Model
  builder.addModel({
    name: 'User',
    documentation: 'Blog authors and users',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'email', type: 'String', unique: true, required: true },
      { name: 'password', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'username', type: 'String', unique: true, required: true },
      { name: 'bio', type: 'String', optional: true },
      { name: 'avatar', type: 'String', optional: true },
      { name: 'role', type: 'UserRole', default: 'SUBSCRIBER' },
      { name: 'website', type: 'String', optional: true },
      { name: 'twitter', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'posts', model: 'Post', type: 'hasMany' },
      { name: 'comments', model: 'Comment', type: 'hasMany' }
    ],
    indexes: ['email', 'username', 'role']
  });

  // Post Model
  builder.addModel({
    name: 'Post',
    documentation: 'Blog posts',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'title', type: 'String', required: true },
      { name: 'slug', type: 'String', unique: true, required: true },
      { name: 'excerpt', type: 'String', optional: true },
      { name: 'content', type: 'String', required: true },
      { name: 'coverImage', type: 'String', optional: true },
      { name: 'authorId', type: 'String', required: true },
      { name: 'status', type: 'PostStatus', default: 'DRAFT' },
      { name: 'featured', type: 'Boolean', default: false },
      { name: 'viewCount', type: 'Int', default: 0 },
      { name: 'publishedAt', type: 'DateTime', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'author', model: 'User', type: 'belongsTo', fields: ['authorId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'comments', model: 'Comment', type: 'hasMany' },
      { name: 'tags', model: 'Tag', type: 'manyToMany' },
      { name: 'categories', model: 'Category', type: 'manyToMany' }
    ],
    indexes: [
      ['authorId'],
      ['slug'],
      ['status'],
      ['publishedAt'],
      ['featured']
    ]
  });

  // Comment Model
  builder.addModel({
    name: 'Comment',
    documentation: 'Post comments',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'postId', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'content', type: 'String', required: true },
      { name: 'parentId', type: 'String', optional: true },
      { name: 'approved', type: 'Boolean', default: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'post', model: 'Post', type: 'belongsTo', fields: ['postId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'parent', model: 'Comment', type: 'belongsTo', fields: ['parentId'], references: ['id'] },
      { name: 'replies', model: 'Comment', type: 'hasMany' }
    ],
    indexes: [
      ['postId'],
      ['userId'],
      ['parentId'],
      ['approved']
    ]
  });

  // Category Model
  builder.addModel({
    name: 'Category',
    documentation: 'Post categories',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', unique: true, required: true },
      { name: 'slug', type: 'String', unique: true, required: true },
      { name: 'description', type: 'String', optional: true },
      { name: 'color', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'posts', model: 'Post', type: 'manyToMany' }
    ],
    indexes: ['slug']
  });

  // Tag Model
  builder.addModel({
    name: 'Tag',
    documentation: 'Post tags',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', unique: true, required: true },
      { name: 'slug', type: 'String', unique: true, required: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'posts', model: 'Post', type: 'manyToMany' }
    ],
    indexes: ['slug']
  });

  return builder.generateSchema();
}

module.exports = { getBlogSchema };
