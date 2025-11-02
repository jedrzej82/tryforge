/**
 * Social Media Prisma Schema Example
 * Complete schema for a social networking application
 */

const PrismaSchemaBuilder = require('../../prisma-schema-builder');

function getSocialSchema() {
  const builder = new PrismaSchemaBuilder({
    provider: 'postgresql'
  });

  // Enums
  builder.addEnum('NotificationType', ['LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'SHARE']);
  builder.addEnum('PostVisibility', ['PUBLIC', 'FRIENDS', 'PRIVATE']);

  // User Model
  builder.addModel({
    name: 'User',
    documentation: 'Social network users',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'email', type: 'String', unique: true, required: true },
      { name: 'password', type: 'String', required: true },
      { name: 'username', type: 'String', unique: true, required: true },
      { name: 'displayName', type: 'String', required: true },
      { name: 'bio', type: 'String', optional: true },
      { name: 'avatar', type: 'String', optional: true },
      { name: 'coverImage', type: 'String', optional: true },
      { name: 'location', type: 'String', optional: true },
      { name: 'website', type: 'String', optional: true },
      { name: 'verified', type: 'Boolean', default: false },
      { name: 'private', type: 'Boolean', default: false },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'posts', model: 'Post', type: 'hasMany' },
      { name: 'likes', model: 'Like', type: 'hasMany' },
      { name: 'comments', model: 'Comment', type: 'hasMany' },
      { name: 'following', model: 'Follow', type: 'hasMany', relationName: 'UserFollowing' },
      { name: 'followers', model: 'Follow', type: 'hasMany', relationName: 'UserFollowers' },
      { name: 'notifications', model: 'Notification', type: 'hasMany' },
      { name: 'messages', model: 'Message', type: 'hasMany', relationName: 'SentMessages' },
      { name: 'receivedMessages', model: 'Message', type: 'hasMany', relationName: 'ReceivedMessages' }
    ],
    indexes: ['email', 'username', 'verified']
  });

  // Post Model
  builder.addModel({
    name: 'Post',
    documentation: 'User posts',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true },
      { name: 'content', type: 'String', required: true },
      { name: 'images', type: 'Json', optional: true },
      { name: 'visibility', type: 'PostVisibility', default: 'PUBLIC' },
      { name: 'likesCount', type: 'Int', default: 0 },
      { name: 'commentsCount', type: 'Int', default: 0 },
      { name: 'sharesCount', type: 'Int', default: 0 },
      { name: 'parentId', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'likes', model: 'Like', type: 'hasMany' },
      { name: 'comments', model: 'Comment', type: 'hasMany' },
      { name: 'parent', model: 'Post', type: 'belongsTo', fields: ['parentId'], references: ['id'], relationName: 'SharedPost' },
      { name: 'shares', model: 'Post', type: 'hasMany', relationName: 'SharedPost' }
    ],
    indexes: [
      ['userId'],
      ['visibility'],
      ['parentId'],
      ['createdAt']
    ]
  });

  // Like Model
  builder.addModel({
    name: 'Like',
    documentation: 'Post likes',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true },
      { name: 'postId', type: 'String', required: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'post', model: 'Post', type: 'belongsTo', fields: ['postId'], references: ['id'], onDelete: 'Cascade' }
    ],
    uniqueConstraints: [
      ['userId', 'postId']
    ],
    indexes: [
      ['userId'],
      ['postId']
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
      { name: 'likesCount', type: 'Int', default: 0 },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'post', model: 'Post', type: 'belongsTo', fields: ['postId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'parent', model: 'Comment', type: 'belongsTo', fields: ['parentId'], references: ['id'], relationName: 'CommentReplies' },
      { name: 'replies', model: 'Comment', type: 'hasMany', relationName: 'CommentReplies' }
    ],
    indexes: [
      ['postId'],
      ['userId'],
      ['parentId'],
      ['createdAt']
    ]
  });

  // Follow Model
  builder.addModel({
    name: 'Follow',
    documentation: 'User follow relationships',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'followerId', type: 'String', required: true },
      { name: 'followingId', type: 'String', required: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'follower', model: 'User', type: 'belongsTo', fields: ['followerId'], references: ['id'], onDelete: 'Cascade', relationName: 'UserFollowing' },
      { name: 'following', model: 'User', type: 'belongsTo', fields: ['followingId'], references: ['id'], onDelete: 'Cascade', relationName: 'UserFollowers' }
    ],
    uniqueConstraints: [
      ['followerId', 'followingId']
    ],
    indexes: [
      ['followerId'],
      ['followingId']
    ]
  });

  // Notification Model
  builder.addModel({
    name: 'Notification',
    documentation: 'User notifications',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true },
      { name: 'type', type: 'NotificationType', required: true },
      { name: 'actorId', type: 'String', optional: true },
      { name: 'postId', type: 'String', optional: true },
      { name: 'commentId', type: 'String', optional: true },
      { name: 'read', type: 'Boolean', default: false },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' }
    ],
    indexes: [
      ['userId'],
      ['read'],
      ['createdAt']
    ]
  });

  // Message Model
  builder.addModel({
    name: 'Message',
    documentation: 'Direct messages',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'senderId', type: 'String', required: true },
      { name: 'receiverId', type: 'String', required: true },
      { name: 'content', type: 'String', required: true },
      { name: 'read', type: 'Boolean', default: false },
      { name: 'readAt', type: 'DateTime', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'sender', model: 'User', type: 'belongsTo', fields: ['senderId'], references: ['id'], onDelete: 'Cascade', relationName: 'SentMessages' },
      { name: 'receiver', model: 'User', type: 'belongsTo', fields: ['receiverId'], references: ['id'], onDelete: 'Cascade', relationName: 'ReceivedMessages' }
    ],
    indexes: [
      ['senderId'],
      ['receiverId'],
      ['read'],
      ['createdAt']
    ]
  });

  return builder.generateSchema();
}

module.exports = { getSocialSchema };
