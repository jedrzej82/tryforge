const logger = require('../../utils/logger');
const TestDataFactory = require('./data-factory');
const FixtureManager = require('./fixture-manager');
const DatabaseTestManager = require('./test-manager');

/**
 * Test helper functions for database testing
 *
 * Provides convenient functions for common test operations
 */

// Singleton instances
let testManager = null;
let fixtureManager = null;
let factory = null;

/**
 * Initialize test helpers
 */
function initializeTestHelpers(config = {}) {
  if (!testManager) {
    testManager = new DatabaseTestManager(config.database);
  }

  if (!fixtureManager) {
    fixtureManager = new FixtureManager(config.fixtures);
  }

  if (!factory) {
    factory = new TestDataFactory(config.factory);
  }

  logger.debug('Test helpers initialized');
}

/**
 * Get test manager instance
 */
function getTestManager() {
  if (!testManager) {
    initializeTestHelpers();
  }
  return testManager;
}

/**
 * Get fixture manager instance
 */
function getFixtureManager() {
  if (!fixtureManager) {
    initializeTestHelpers();
  }
  return fixtureManager;
}

/**
 * Get data factory instance
 */
function getDataFactory() {
  if (!factory) {
    initializeTestHelpers();
  }
  return factory;
}

/**
 * Create test user
 */
async function createTestUser(connection, overrides = {}) {
  const userData = factory.generateUser(overrides);

  const query = `
    INSERT INTO users (email, username, first_name, last_name, name, password, role, is_active, email_verified, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    userData.email,
    userData.username,
    userData.firstName,
    userData.lastName,
    userData.name,
    userData.password,
    userData.role,
    userData.isActive,
    userData.emailVerified,
    userData.createdAt,
    userData.updatedAt
  ];

  try {
    const result = await connection.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to create test user', { error: error.message });
    throw error;
  }
}

/**
 * Create multiple test users
 */
async function createTestUsers(connection, count, overrides = {}) {
  const users = [];

  for (let i = 0; i < count; i++) {
    const user = await createTestUser(connection, overrides);
    users.push(user);
  }

  return users;
}

/**
 * Create test product
 */
async function createTestProduct(connection, overrides = {}) {
  const productData = factory.generateProduct(overrides);

  const query = `
    INSERT INTO products (name, slug, description, price, compare_price, cost, sku, barcode, stock, low_stock_threshold, is_active, is_featured, weight, weight_unit, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const values = [
    productData.name,
    productData.slug,
    productData.description,
    productData.price,
    productData.comparePrice,
    productData.cost,
    productData.sku,
    productData.barcode,
    productData.stock,
    productData.lowStockThreshold,
    productData.isActive,
    productData.isFeatured,
    productData.weight,
    productData.weightUnit,
    productData.createdAt,
    productData.updatedAt
  ];

  try {
    const result = await connection.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to create test product', { error: error.message });
    throw error;
  }
}

/**
 * Create multiple test products
 */
async function createTestProducts(connection, count, overrides = {}) {
  const products = [];

  for (let i = 0; i < count; i++) {
    const product = await createTestProduct(connection, overrides);
    products.push(product);
  }

  return products;
}

/**
 * Create test order
 */
async function createTestOrder(connection, userId, overrides = {}) {
  const orderData = factory.generateOrder(overrides);

  const query = `
    INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping, discount, total, payment_status, payment_method, shipping_method, notes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const values = [
    userId,
    orderData.orderNumber,
    orderData.status,
    orderData.subtotal,
    orderData.tax,
    orderData.shipping,
    orderData.discount,
    orderData.total,
    orderData.paymentStatus,
    orderData.paymentMethod,
    orderData.shippingMethod,
    orderData.notes,
    orderData.createdAt,
    orderData.updatedAt
  ];

  try {
    const result = await connection.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to create test order', { error: error.message });
    throw error;
  }
}

/**
 * Create test address
 */
async function createTestAddress(connection, userId, overrides = {}) {
  const addressData = factory.generateAddress(overrides);

  const query = `
    INSERT INTO addresses (user_id, first_name, last_name, company, street1, street2, city, state, postal_code, country, phone, is_default, type, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    userId,
    addressData.firstName,
    addressData.lastName,
    addressData.company,
    addressData.street1,
    addressData.street2,
    addressData.city,
    addressData.state,
    addressData.postalCode,
    addressData.country,
    addressData.phone,
    addressData.isDefault,
    addressData.type,
    addressData.createdAt,
    addressData.updatedAt
  ];

  try {
    const result = await connection.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Failed to create test address', { error: error.message });
    throw error;
  }
}

/**
 * Clean database - truncate all tables
 */
async function cleanDatabase(connection) {
  try {
    const result = await connection.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    const tables = result.rows.map(row => row.tablename);

    if (tables.length > 0) {
      await connection.query(`
        TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')}
        RESTART IDENTITY CASCADE
      `);
    }

    logger.debug(`Cleaned ${tables.length} tables`);
  } catch (error) {
    logger.error('Failed to clean database', { error: error.message });
    throw error;
  }
}

/**
 * Seed database with fixtures
 */
async function seedDatabase(connection, fixtures) {
  const manager = getFixtureManager();
  manager.setConnection(connection);

  if (Array.isArray(fixtures)) {
    const results = [];
    for (const fixture of fixtures) {
      const result = await manager.loadFixtures(fixture);
      results.push(result);
    }
    return results;
  } else if (typeof fixtures === 'string') {
    return await manager.loadFixtures(fixtures);
  } else {
    throw new Error('Invalid fixtures parameter');
  }
}

/**
 * Wait for database to be ready
 */
async function waitForDatabase(maxRetries = 10, retryDelay = 1000) {
  const manager = getTestManager();
  return await manager.waitForDatabase(maxRetries, retryDelay);
}

/**
 * Execute query with retry
 */
async function executeWithRetry(connection, query, params = [], maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await connection.query(query, params);
    } catch (error) {
      lastError = error;
      logger.warn(`Query failed, attempt ${i + 1}/${maxRetries}`, {
        error: error.message
      });

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Get table row count
 */
async function getTableRowCount(connection, tableName) {
  const result = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count);
}

/**
 * Get all table names
 */
async function getAllTableNames(connection) {
  const result = await connection.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  return result.rows.map(row => row.tablename);
}

/**
 * Check if table exists
 */
async function tableExists(connection, tableName) {
  const result = await connection.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    )
  `, [tableName]);

  return result.rows[0].exists;
}

/**
 * Check if column exists
 */
async function columnExists(connection, tableName, columnName) {
  const result = await connection.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    )
  `, [tableName, columnName]);

  return result.rows[0].exists;
}

/**
 * Create test data bundle
 */
async function createTestDataBundle(connection, config = {}) {
  const {
    users = 5,
    products = 10,
    orders = 3,
    addresses = 2
  } = config;

  const bundle = {
    users: [],
    products: [],
    orders: [],
    addresses: []
  };

  // Create users
  if (users > 0) {
    bundle.users = await createTestUsers(connection, users);
  }

  // Create products
  if (products > 0) {
    bundle.products = await createTestProducts(connection, products);
  }

  // Create orders and addresses for first user
  if (bundle.users.length > 0) {
    const userId = bundle.users[0].id;

    if (orders > 0) {
      for (let i = 0; i < orders; i++) {
        const order = await createTestOrder(connection, userId);
        bundle.orders.push(order);
      }
    }

    if (addresses > 0) {
      for (let i = 0; i < addresses; i++) {
        const address = await createTestAddress(connection, userId);
        bundle.addresses.push(address);
      }
    }
  }

  logger.info('Created test data bundle', {
    users: bundle.users.length,
    products: bundle.products.length,
    orders: bundle.orders.length,
    addresses: bundle.addresses.length
  });

  return bundle;
}

/**
 * Reset sequences
 */
async function resetSequences(connection) {
  const result = await connection.query(`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `);

  for (const row of result.rows) {
    await connection.query(`ALTER SEQUENCE ${row.sequence_name} RESTART WITH 1`);
  }

  logger.debug(`Reset ${result.rows.length} sequences`);
}

module.exports = {
  // Initialization
  initializeTestHelpers,
  getTestManager,
  getFixtureManager,
  getDataFactory,

  // Create helpers
  createTestUser,
  createTestUsers,
  createTestProduct,
  createTestProducts,
  createTestOrder,
  createTestAddress,
  createTestDataBundle,

  // Database operations
  cleanDatabase,
  seedDatabase,
  waitForDatabase,
  executeWithRetry,
  resetSequences,

  // Inspection helpers
  getTableRowCount,
  getAllTableNames,
  tableExists,
  columnExists
};
