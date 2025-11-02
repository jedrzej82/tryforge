const logger = require('../../utils/logger');

/**
 * TestDataFactory - Generate realistic test data
 *
 * Features:
 * - Generate various types of test data
 * - Integration with faker (optional)
 * - Consistent but random data
 * - Custom generators
 * - Support for relationships
 */
class TestDataFactory {
  constructor(config = {}) {
    this.config = {
      seed: config.seed,
      locale: config.locale || 'en',
      ...config
    };

    this.sequenceCounters = new Map();
    this.faker = null;

    // Try to load faker if available
    try {
      this.faker = require('@faker-js/faker').faker;
      if (this.config.seed) {
        this.faker.seed(this.config.seed);
      }
      logger.debug('Faker.js loaded successfully');
    } catch (error) {
      logger.warn('Faker.js not available, using fallback generators');
    }
  }

  /**
   * Generate user data
   */
  generateUser(overrides = {}) {
    const firstName = this.generateFirstName();
    const lastName = this.generateLastName();
    const username = this.generateUsername(firstName, lastName);

    return {
      email: this.generateEmail(firstName, lastName),
      username,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      password: this.generatePassword(),
      role: 'user',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate admin user
   */
  generateAdminUser(overrides = {}) {
    return this.generateUser({
      role: 'admin',
      emailVerified: true,
      ...overrides
    });
  }

  /**
   * Generate product data
   */
  generateProduct(overrides = {}) {
    return {
      name: this.generateProductName(),
      slug: this.generateSlug(),
      description: this.generateProductDescription(),
      price: this.generatePrice(10, 1000),
      comparePrice: null,
      cost: this.generatePrice(5, 500),
      sku: this.generateSKU(),
      barcode: this.generateBarcode(),
      stock: this.generateInteger(0, 1000),
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      weight: this.generateFloat(0.1, 50, 2),
      weightUnit: 'kg',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate order data
   */
  generateOrder(overrides = {}) {
    const subtotal = this.generatePrice(20, 500);
    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    const shipping = this.generatePrice(5, 20);
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    return {
      orderNumber: this.generateOrderNumber(),
      status: 'pending',
      subtotal,
      tax,
      shipping,
      discount: 0,
      total,
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      shippingMethod: 'standard',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate address data
   */
  generateAddress(overrides = {}) {
    return {
      firstName: this.generateFirstName(),
      lastName: this.generateLastName(),
      company: null,
      street1: this.generateStreetAddress(),
      street2: null,
      city: this.generateCity(),
      state: this.generateState(),
      postalCode: this.generatePostalCode(),
      country: 'US',
      phone: this.generatePhoneNumber(),
      isDefault: false,
      type: 'shipping',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate category data
   */
  generateCategory(overrides = {}) {
    const name = this.generateCategoryName();

    return {
      name,
      slug: this.generateSlug(name),
      description: this.generateText(50, 200),
      parentId: null,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate post/article data
   */
  generatePost(overrides = {}) {
    const title = this.generateTitle();

    return {
      title,
      slug: this.generateSlug(title),
      content: this.generateText(500, 2000),
      excerpt: this.generateText(100, 200),
      status: 'draft',
      publishedAt: null,
      viewCount: 0,
      commentCount: 0,
      featuredImage: null,
      metaTitle: null,
      metaDescription: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate comment data
   */
  generateComment(overrides = {}) {
    return {
      content: this.generateText(20, 200),
      authorName: this.generateName(),
      authorEmail: this.generateEmail(),
      authorIp: this.generateIPAddress(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate review data
   */
  generateReview(overrides = {}) {
    return {
      rating: this.generateInteger(1, 5),
      title: this.generateTitle(),
      content: this.generateText(50, 300),
      verified: false,
      helpful: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // =============================================================================
  // Primitive Generators
  // =============================================================================

  generateEmail(firstName, lastName) {
    if (this.faker) {
      return this.faker.internet.email({ firstName, lastName });
    }

    const domains = ['example.com', 'test.com', 'demo.com'];
    const username = firstName && lastName
      ? `${firstName}.${lastName}`.toLowerCase()
      : `user${this.getSequence('email')}`;
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return `${username}@${domain}`;
  }

  generateUsername(firstName, lastName) {
    if (this.faker) {
      return this.faker.internet.username({ firstName, lastName });
    }

    if (firstName && lastName) {
      return `${firstName}${lastName}${this.generateInteger(1, 999)}`.toLowerCase();
    }

    return `user${this.getSequence('username')}`;
  }

  generatePassword(length = 12) {
    if (this.faker) {
      return this.faker.internet.password({ length });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  generateFirstName() {
    if (this.faker) {
      return this.faker.person.firstName();
    }

    const names = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma'];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateLastName() {
    if (this.faker) {
      return this.faker.person.lastName();
    }

    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateName() {
    return `${this.generateFirstName()} ${this.generateLastName()}`;
  }

  generateProductName() {
    if (this.faker) {
      return this.faker.commerce.productName();
    }

    const adjectives = ['Premium', 'Deluxe', 'Professional', 'Ultimate', 'Essential'];
    const nouns = ['Widget', 'Tool', 'Device', 'System', 'Product'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adj} ${noun}`;
  }

  generateProductDescription() {
    if (this.faker) {
      return this.faker.commerce.productDescription();
    }

    return this.generateText(100, 300);
  }

  generatePrice(min = 0, max = 1000) {
    if (this.faker) {
      return parseFloat(this.faker.commerce.price({ min, max }));
    }

    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  generateInteger(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateFloat(min = 0, max = 100, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  generateSlug(text) {
    if (!text && this.faker) {
      return this.faker.helpers.slugify(this.faker.lorem.words(3));
    }

    if (text) {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    return `slug-${this.getSequence('slug')}`;
  }

  generateSKU() {
    const prefix = 'SKU';
    const number = String(this.getSequence('sku')).padStart(8, '0');
    return `${prefix}${number}`;
  }

  generateBarcode() {
    return String(this.generateInteger(100000000000, 999999999999));
  }

  generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  generateStreetAddress() {
    if (this.faker) {
      return this.faker.location.streetAddress();
    }

    const number = this.generateInteger(1, 9999);
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Park Rd', 'Broadway'];
    const street = streets[Math.floor(Math.random() * streets.length)];

    return `${number} ${street}`;
  }

  generateCity() {
    if (this.faker) {
      return this.faker.location.city();
    }

    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  generateState() {
    if (this.faker) {
      return this.faker.location.state({ abbreviated: true });
    }

    const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'AZ'];
    return states[Math.floor(Math.random() * states.length)];
  }

  generatePostalCode() {
    if (this.faker) {
      return this.faker.location.zipCode();
    }

    return String(this.generateInteger(10000, 99999));
  }

  generatePhoneNumber() {
    if (this.faker) {
      return this.faker.phone.number();
    }

    const area = this.generateInteger(200, 999);
    const prefix = this.generateInteger(200, 999);
    const line = this.generateInteger(1000, 9999);

    return `(${area}) ${prefix}-${line}`;
  }

  generateIPAddress() {
    if (this.faker) {
      return this.faker.internet.ip();
    }

    return [
      this.generateInteger(1, 255),
      this.generateInteger(0, 255),
      this.generateInteger(0, 255),
      this.generateInteger(1, 255)
    ].join('.');
  }

  generateTitle() {
    if (this.faker) {
      return this.faker.lorem.sentence({ min: 3, max: 8 }).slice(0, -1);
    }

    const words = ['Understanding', 'Guide to', 'Introduction to', 'Complete', 'Ultimate'];
    const topics = ['Development', 'Testing', 'Design', 'Management', 'Strategy'];
    const word = words[Math.floor(Math.random() * words.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    return `${word} ${topic}`;
  }

  generateCategoryName() {
    if (this.faker) {
      return this.faker.commerce.department();
    }

    const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  generateText(minLength = 50, maxLength = 200) {
    if (this.faker) {
      return this.faker.lorem.paragraphs({ min: 1, max: 3 });
    }

    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
    const length = this.generateInteger(minLength, maxLength);
    return lorem.substring(0, length);
  }

  generateDate(startDate, endDate) {
    if (this.faker) {
      return this.faker.date.between({ from: startDate, to: endDate });
    }

    const start = startDate ? new Date(startDate).getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    return new Date(start + Math.random() * (end - start));
  }

  generateBoolean() {
    return Math.random() < 0.5;
  }

  generateUUID() {
    if (this.faker) {
      return this.faker.string.uuid();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  getSequence(name) {
    const current = this.sequenceCounters.get(name) || 0;
    const next = current + 1;
    this.sequenceCounters.set(name, next);
    return next;
  }

  resetSequence(name) {
    this.sequenceCounters.set(name, 0);
  }

  resetAllSequences() {
    this.sequenceCounters.clear();
  }

  setSeed(seed) {
    this.config.seed = seed;
    if (this.faker) {
      this.faker.seed(seed);
    }
  }
}

module.exports = TestDataFactory;
