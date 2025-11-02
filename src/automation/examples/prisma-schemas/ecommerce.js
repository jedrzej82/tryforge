/**
 * E-commerce Prisma Schema Example
 * Complete schema for an e-commerce application
 */

const PrismaSchemaBuilder = require('../../prisma-schema-builder');

function getEcommerceSchema() {
  const builder = new PrismaSchemaBuilder({
    provider: 'postgresql'
  });

  // Enums
  builder.addEnum('UserRole', ['CUSTOMER', 'ADMIN', 'VENDOR']);
  builder.addEnum('OrderStatus', ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
  builder.addEnum('PaymentStatus', ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);

  // User Model
  builder.addModel({
    name: 'User',
    documentation: 'User accounts and authentication',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'email', type: 'String', unique: true, required: true },
      { name: 'password', type: 'String', required: true },
      { name: 'firstName', type: 'String', required: true },
      { name: 'lastName', type: 'String', required: true },
      { name: 'role', type: 'UserRole', default: 'CUSTOMER' },
      { name: 'emailVerified', type: 'Boolean', default: false },
      { name: 'phone', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'orders', model: 'Order', type: 'hasMany' },
      { name: 'addresses', model: 'Address', type: 'hasMany' },
      { name: 'cart', model: 'Cart', type: 'hasOne' },
      { name: 'reviews', model: 'Review', type: 'hasMany' }
    ],
    indexes: ['email', 'role']
  });

  // Category Model
  builder.addModel({
    name: 'Category',
    documentation: 'Product categories',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', required: true, unique: true },
      { name: 'slug', type: 'String', required: true, unique: true },
      { name: 'description', type: 'String', optional: true },
      { name: 'image', type: 'String', optional: true },
      { name: 'parentId', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'parent', model: 'Category', type: 'belongsTo', fields: ['parentId'], references: ['id'] },
      { name: 'children', model: 'Category', type: 'hasMany' },
      { name: 'products', model: 'Product', type: 'hasMany' }
    ],
    indexes: ['slug', 'parentId']
  });

  // Product Model
  builder.addModel({
    name: 'Product',
    documentation: 'Product catalog',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'name', type: 'String', required: true },
      { name: 'slug', type: 'String', required: true, unique: true },
      { name: 'description', type: 'String', optional: true },
      { name: 'price', type: 'Decimal', required: true },
      { name: 'comparePrice', type: 'Decimal', optional: true },
      { name: 'sku', type: 'String', required: true, unique: true },
      { name: 'stock', type: 'Int', default: 0 },
      { name: 'images', type: 'Json', optional: true },
      { name: 'categoryId', type: 'String', required: true },
      { name: 'featured', type: 'Boolean', default: false },
      { name: 'published', type: 'Boolean', default: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'category', model: 'Category', type: 'belongsTo', fields: ['categoryId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'orderItems', model: 'OrderItem', type: 'hasMany' },
      { name: 'cartItems', model: 'CartItem', type: 'hasMany' },
      { name: 'reviews', model: 'Review', type: 'hasMany' }
    ],
    indexes: [
      ['categoryId'],
      ['slug'],
      ['sku'],
      ['featured', 'published']
    ]
  });

  // Order Model
  builder.addModel({
    name: 'Order',
    documentation: 'Customer orders',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'orderNumber', type: 'String', required: true, unique: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'status', type: 'OrderStatus', default: 'PENDING' },
      { name: 'subtotal', type: 'Decimal', required: true },
      { name: 'tax', type: 'Decimal', default: 0 },
      { name: 'shipping', type: 'Decimal', default: 0 },
      { name: 'total', type: 'Decimal', required: true },
      { name: 'shippingAddressId', type: 'String', required: true },
      { name: 'billingAddressId', type: 'String', required: true },
      { name: 'notes', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'shippingAddress', model: 'Address', type: 'belongsTo', fields: ['shippingAddressId'], references: ['id'], relationName: 'ShippingOrders' },
      { name: 'billingAddress', model: 'Address', type: 'belongsTo', fields: ['billingAddressId'], references: ['id'], relationName: 'BillingOrders' },
      { name: 'items', model: 'OrderItem', type: 'hasMany' },
      { name: 'payment', model: 'Payment', type: 'hasOne' }
    ],
    indexes: [
      ['userId'],
      ['orderNumber'],
      ['status'],
      ['createdAt']
    ]
  });

  // OrderItem Model
  builder.addModel({
    name: 'OrderItem',
    documentation: 'Items in an order',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'orderId', type: 'String', required: true },
      { name: 'productId', type: 'String', required: true },
      { name: 'quantity', type: 'Int', required: true },
      { name: 'price', type: 'Decimal', required: true },
      { name: 'total', type: 'Decimal', required: true }
    ],
    relations: [
      { name: 'order', model: 'Order', type: 'belongsTo', fields: ['orderId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'product', model: 'Product', type: 'belongsTo', fields: ['productId'], references: ['id'] }
    ],
    indexes: [
      ['orderId'],
      ['productId']
    ]
  });

  // Address Model
  builder.addModel({
    name: 'Address',
    documentation: 'User addresses',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true },
      { name: 'fullName', type: 'String', required: true },
      { name: 'street', type: 'String', required: true },
      { name: 'city', type: 'String', required: true },
      { name: 'state', type: 'String', required: true },
      { name: 'postalCode', type: 'String', required: true },
      { name: 'country', type: 'String', required: true },
      { name: 'phone', type: 'String', optional: true },
      { name: 'isDefault', type: 'Boolean', default: false },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'shippingOrders', model: 'Order', type: 'hasMany', relationName: 'ShippingOrders' },
      { name: 'billingOrders', model: 'Order', type: 'hasMany', relationName: 'BillingOrders' }
    ],
    indexes: [
      ['userId'],
      ['userId', 'isDefault']
    ]
  });

  // Cart Model
  builder.addModel({
    name: 'Cart',
    documentation: 'Shopping cart',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'userId', type: 'String', required: true, unique: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'items', model: 'CartItem', type: 'hasMany' }
    ],
    indexes: ['userId']
  });

  // CartItem Model
  builder.addModel({
    name: 'CartItem',
    documentation: 'Items in shopping cart',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'cartId', type: 'String', required: true },
      { name: 'productId', type: 'String', required: true },
      { name: 'quantity', type: 'Int', default: 1 }
    ],
    relations: [
      { name: 'cart', model: 'Cart', type: 'belongsTo', fields: ['cartId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'product', model: 'Product', type: 'belongsTo', fields: ['productId'], references: ['id'] }
    ],
    uniqueConstraints: [
      ['cartId', 'productId']
    ],
    indexes: [
      ['cartId'],
      ['productId']
    ]
  });

  // Payment Model
  builder.addModel({
    name: 'Payment',
    documentation: 'Order payments',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'orderId', type: 'String', required: true, unique: true },
      { name: 'status', type: 'PaymentStatus', default: 'PENDING' },
      { name: 'amount', type: 'Decimal', required: true },
      { name: 'method', type: 'String', required: true },
      { name: 'transactionId', type: 'String', optional: true },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'order', model: 'Order', type: 'belongsTo', fields: ['orderId'], references: ['id'], onDelete: 'Cascade' }
    ],
    indexes: [
      ['orderId'],
      ['status'],
      ['transactionId']
    ]
  });

  // Review Model
  builder.addModel({
    name: 'Review',
    documentation: 'Product reviews',
    fields: [
      { name: 'id', type: 'String', primary: true, default: { function: 'cuid' } },
      { name: 'productId', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'rating', type: 'Int', required: true },
      { name: 'title', type: 'String', optional: true },
      { name: 'comment', type: 'String', optional: true },
      { name: 'verified', type: 'Boolean', default: false },
      { name: 'createdAt', type: 'DateTime', default: { function: 'now' } },
      { name: 'updatedAt', type: 'DateTime', updatedAt: true }
    ],
    relations: [
      { name: 'product', model: 'Product', type: 'belongsTo', fields: ['productId'], references: ['id'], onDelete: 'Cascade' },
      { name: 'user', model: 'User', type: 'belongsTo', fields: ['userId'], references: ['id'], onDelete: 'Cascade' }
    ],
    uniqueConstraints: [
      ['productId', 'userId']
    ],
    indexes: [
      ['productId'],
      ['userId'],
      ['rating']
    ]
  });

  return builder.generateSchema();
}

module.exports = { getEcommerceSchema };
