/**
 * SaaS Prisma Schema Example
 * Complete schema for a SaaS application with organizations and subscriptions
 */

const PrismaSchemaBuilder = require('../../prisma-schema-builder');

function getSaaSSchema() {
  const builder = new PrismaSchemaBuilder({
    provider: 'postgresql'
  });

  // Enums
  builder.addEnum('UserRole', ['OWNER', 'ADMIN', 'MEMBER']);
  builder.addEnum('SubscriptionStatus', ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE']);
  builder.addEnum('PlanInterval', ['MONTHLY', 'YEARLY']);

  // User Model
  builder.addModel({
    name: 'User',
    documentation: 'Application users',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'email', type: 'String', unique: true, required: true },
      { name: 'password', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'avatar', type: 'String', optional: true },
      { name: 'emailVerified', type: 'Boolean', default: false },
      { name: 'lastLoginAt', type: 'DateTime', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'memberships', model: 'Membership', type: 'hasMany' },
      { name: 'invitations', model: 'Invitation', type: 'hasMany' }
    ],
    indexes: ['email']
  });

  // Organization Model
  builder.addModel({
    name: 'Organization',
    documentation: 'Organizations/Workspaces',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', required: true },
      { name: 'slug', type: 'String', unique: true, required: true },
      { name: 'logo', type: 'String', optional: true },
      { name: 'description', type: 'String', optional: true },
      { name: 'website', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'memberships', model: 'Membership', type: 'hasMany' },
      { name: 'subscription', model: 'Subscription', type: 'hasOne' },
      { name: 'invitations', model: 'Invitation', type: 'hasMany' },
      { name: 'apiKeys', model: 'ApiKey', type: 'hasMany' }
    ],
    indexes: ['slug']
  });

  // Membership Model
  builder.addModel({
    name: 'Membership',
    documentation: 'User membership in organizations',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true },
      { name: 'organizationId', type: 'String', required: true },
      { name: 'role', type: 'UserRole', default: 'MEMBER' },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'organization', model: 'Organization', type: 'belongsTo', fields: ['organizationId'], references: ['id'], onDelete: 'Cascade' }
    ],
    uniqueConstraints: [
      ['userId', 'organizationId']
    ],
    indexes: [
      ['userId'],
      ['organizationId'],
      ['role']
    ]
  });

  // Plan Model
  builder.addModel({
    name: 'Plan',
    documentation: 'Subscription plans',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', unique: true, required: true },
      { name: 'description', type: 'String', optional: true },
      { name: 'price', type: 'Decimal', required: true },
      { name: 'interval', type: 'PlanInterval', required: true },
      { name: 'features', type: 'Json', optional: true },
      { name: 'maxUsers', type: 'Int', optional: true },
      { name: 'maxProjects', type: 'Int', optional: true },
      { name: 'active', type: 'Boolean', default: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'subscriptions', model: 'Subscription', type: 'hasMany' }
    ],
    indexes: ['active']
  });

  // Subscription Model
  builder.addModel({
    name: 'Subscription',
    documentation: 'Organization subscriptions',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'organizationId', type: 'String', unique: true, required: true },
      { name: 'planId', type: 'String', required: true },
      { name: 'status', type: 'SubscriptionStatus', default: 'ACTIVE' },
      { name: 'currentPeriodStart', type: 'DateTime', required: true },
      { name: 'currentPeriodEnd', type: 'DateTime', required: true },
      { name: 'cancelAtPeriodEnd', type: 'Boolean', default: false },
      { name: 'canceledAt', type: 'DateTime', optional: true },
      { name: 'trialEndsAt', type: 'DateTime', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'organization', model: 'Organization', type: 'belongsTo', fields: ['organizationId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'plan', model: 'Plan', type: 'belongsTo', fields: ['planId'], references: ['id'] }
    ],
    indexes: [
      ['organizationId'],
      ['planId'],
      ['status'],
      ['currentPeriodEnd']
    ]
  });

  // Invitation Model
  builder.addModel({
    name: 'Invitation',
    documentation: 'Organization invitations',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'organizationId', type: 'String', required: true },
      { name: 'email', type: 'String', required: true },
      { name: 'role', type: 'UserRole', default: 'MEMBER' },
      { name: 'token', type: 'String', unique: true, required: true },
      { name: 'invitedById', type: 'String', required: true },
      { name: 'acceptedAt', type: 'DateTime', optional: true },
      { name: 'expiresAt', type: 'DateTime', required: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'organization', model: 'Organization', type: 'belongsTo', fields: ['organizationId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'invitedBy', model: 'User', type: 'belongsTo', fields: ['invitedById'], references: ['id'], onDelete: 'Cascade' }
    ],
    indexes: [
      ['organizationId'],
      ['email'],
      ['token'],
      ['expiresAt']
    ]
  });

  // ApiKey Model
  builder.addModel({
    name: 'ApiKey',
    documentation: 'API keys for programmatic access',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'organizationId', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'key', type: 'String', unique: true, required: true },
      { name: 'lastUsedAt', type: 'DateTime', optional: true },
      { name: 'expiresAt', type: 'DateTime', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } }
    ],
    relations: [
      { name: 'organization', model: 'Organization', type: 'belongsTo', fields: ['organizationId'], references: ['id'], onDelete: 'Cascade' }
    ],
    indexes: [
      ['organizationId'],
      ['key'],
      ['expiresAt']
    ]
  });

  return builder.generateSchema();
}

module.exports = { getSaaSSchema };
