/**
 * Data Generator
 *
 * Reusable data generators for creating realistic test data.
 * Uses @faker-js/faker for generating fake data.
 */

const { faker } = require('@faker-js/faker');

class DataGenerator {
  /**
   * Generate users
   * @param {number} count - Number of users to generate
   * @param {Object} options - Additional options
   * @returns {Array}
   */
  static generateUsers(count = 10, options = {}) {
    const {
      roles = ['user'],
      includeAdmin = false,
      verified = true
    } = options;

    const users = [];

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      users.push({
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
        password: '$2a$10$YourHashedPasswordHere', // Should be hashed
        role: faker.helpers.arrayElement(roles),
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
        bio: faker.lorem.paragraph(),
        birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        verified: verified ? faker.datatype.boolean() : false,
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          zipCode: faker.location.zipCode(),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude()
        },
        preferences: {
          newsletter: faker.datatype.boolean(),
          notifications: faker.datatype.boolean(),
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto'])
        },
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    // Add admin user if requested
    if (includeAdmin) {
      users.unshift({
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        username: 'admin',
        password: '$2a$10$YourHashedPasswordHere',
        role: 'admin',
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
        bio: 'System administrator',
        birthDate: faker.date.birthdate({ min: 25, max: 50, mode: 'age' }),
        verified: true,
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          zipCode: faker.location.zipCode(),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude()
        },
        preferences: {
          newsletter: true,
          notifications: true,
          theme: 'dark'
        },
        createdAt: faker.date.past({ years: 3 }),
        updatedAt: new Date()
      });
    }

    return users;
  }

  /**
   * Generate categories
   * @param {number} count - Number of categories to generate
   * @returns {Array}
   */
  static generateCategories(count = 10) {
    const categories = [];
    const categoryNames = [
      'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports',
      'Toys', 'Beauty', 'Automotive', 'Food & Beverage', 'Health',
      'Music', 'Movies', 'Games', 'Art', 'Jewelry'
    ];

    for (let i = 0; i < Math.min(count, categoryNames.length); i++) {
      const name = categoryNames[i];
      categories.push({
        name,
        slug: faker.helpers.slugify(name).toLowerCase(),
        description: faker.lorem.paragraph(),
        image: faker.image.url(),
        active: faker.datatype.boolean(),
        order: i,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    return categories;
  }

  /**
   * Generate products
   * @param {number} count - Number of products to generate
   * @param {Array} categoryIds - Available category IDs
   * @returns {Array}
   */
  static generateProducts(count = 50, categoryIds = []) {
    const products = [];

    for (let i = 0; i < count; i++) {
      const name = faker.commerce.productName();
      const price = parseFloat(faker.commerce.price({ min: 5, max: 500 }));
      const discount = faker.datatype.boolean() ? faker.number.int({ min: 5, max: 50 }) : 0;

      products.push({
        name,
        slug: faker.helpers.slugify(name).toLowerCase(),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        description: faker.commerce.productDescription(),
        longDescription: faker.lorem.paragraphs(3),
        price,
        compareAtPrice: discount > 0 ? price + (price * discount / 100) : null,
        cost: price * 0.6, // 40% margin
        stock: faker.number.int({ min: 0, max: 1000 }),
        lowStockThreshold: faker.number.int({ min: 5, max: 20 }),
        categoryId: categoryIds.length > 0 ? faker.helpers.arrayElement(categoryIds) : null,
        brand: faker.company.name(),
        images: [
          faker.image.url(),
          faker.image.url(),
          faker.image.url()
        ],
        tags: faker.helpers.arrayElements(
          ['new', 'sale', 'featured', 'trending', 'bestseller', 'limited'],
          { min: 0, max: 3 }
        ),
        attributes: {
          color: faker.color.human(),
          size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL', 'XXL']),
          material: faker.commerce.productMaterial(),
          weight: `${faker.number.float({ min: 0.1, max: 10, precision: 0.1 })}kg`
        },
        seo: {
          title: name,
          description: faker.lorem.sentence(),
          keywords: faker.helpers.arrayElements(
            ['quality', 'affordable', 'durable', 'modern', 'eco-friendly'],
            { min: 2, max: 4 }
          )
        },
        rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 0, max: 500 }),
        published: faker.datatype.boolean({ probability: 0.8 }),
        featured: faker.datatype.boolean({ probability: 0.2 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    return products;
  }

  /**
   * Generate orders
   * @param {number} count - Number of orders to generate
   * @param {Array} userIds - Available user IDs
   * @param {Array} products - Available products
   * @returns {Array}
   */
  static generateOrders(count = 100, userIds = [], products = []) {
    const orders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['credit_card', 'paypal', 'stripe', 'bank_transfer'];

    for (let i = 0; i < count; i++) {
      const orderProducts = faker.helpers.arrayElements(products, { min: 1, max: 5 });
      const status = faker.helpers.arrayElement(statuses);

      const subtotal = orderProducts.reduce((sum, p) => {
        const quantity = faker.number.int({ min: 1, max: 3 });
        return sum + (parseFloat(p.price) * quantity);
      }, 0);

      const tax = subtotal * 0.1; // 10% tax
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const total = subtotal + tax + shipping;

      orders.push({
        orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
        userId: userIds.length > 0 ? faker.helpers.arrayElement(userIds) : null,
        status,
        paymentMethod: faker.helpers.arrayElement(paymentMethods),
        paymentStatus: status === 'cancelled' ? 'refunded' : 'paid',
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        discount: 0,
        total: parseFloat(total.toFixed(2)),
        items: orderProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          quantity: faker.number.int({ min: 1, max: 3 }),
          price: parseFloat(p.price),
          total: parseFloat(p.price) * faker.number.int({ min: 1, max: 3 })
        })),
        shippingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
          phone: faker.phone.number()
        },
        billingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
          phone: faker.phone.number()
        },
        notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        trackingNumber: status === 'shipped' || status === 'delivered'
          ? `TRK-${faker.string.alphanumeric(12).toUpperCase()}`
          : null,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 7 }),
        shippedAt: ['shipped', 'delivered'].includes(status) ? faker.date.recent({ days: 5 }) : null,
        deliveredAt: status === 'delivered' ? faker.date.recent({ days: 3 }) : null
      });
    }

    return orders;
  }

  /**
   * Generate blog posts
   * @param {number} count - Number of posts to generate
   * @param {Array} authorIds - Available author IDs
   * @returns {Array}
   */
  static generatePosts(count = 20, authorIds = []) {
    const posts = [];
    const statuses = ['draft', 'published', 'archived'];

    for (let i = 0; i < count; i++) {
      const title = faker.lorem.sentence();
      const status = faker.helpers.arrayElement(statuses);

      posts.push({
        title,
        slug: faker.helpers.slugify(title).toLowerCase(),
        excerpt: faker.lorem.paragraph(),
        content: faker.lorem.paragraphs(10),
        authorId: authorIds.length > 0 ? faker.helpers.arrayElement(authorIds) : null,
        coverImage: faker.image.url(),
        images: [
          faker.image.url(),
          faker.image.url()
        ],
        status,
        categories: faker.helpers.arrayElements(
          ['Technology', 'Design', 'Business', 'Marketing', 'Development'],
          { min: 1, max: 3 }
        ),
        tags: faker.helpers.arrayElements(
          ['tutorial', 'guide', 'tips', 'news', 'review', 'opinion'],
          { min: 1, max: 4 }
        ),
        seo: {
          title,
          description: faker.lorem.sentence(),
          keywords: faker.lorem.words(5).split(' ')
        },
        viewCount: faker.number.int({ min: 0, max: 10000 }),
        likeCount: faker.number.int({ min: 0, max: 500 }),
        commentCount: faker.number.int({ min: 0, max: 100 }),
        featured: faker.datatype.boolean({ probability: 0.2 }),
        allowComments: faker.datatype.boolean({ probability: 0.9 }),
        publishedAt: status === 'published' ? faker.date.past({ years: 1 }) : null,
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    return posts;
  }

  /**
   * Generate comments
   * @param {number} count - Number of comments to generate
   * @param {Array} postIds - Available post IDs
   * @param {Array} userIds - Available user IDs
   * @returns {Array}
   */
  static generateComments(count = 100, postIds = [], userIds = []) {
    const comments = [];

    for (let i = 0; i < count; i++) {
      comments.push({
        postId: faker.helpers.arrayElement(postIds),
        userId: faker.helpers.arrayElement(userIds),
        content: faker.lorem.paragraph(),
        approved: faker.datatype.boolean({ probability: 0.9 }),
        likeCount: faker.number.int({ min: 0, max: 50 }),
        parentId: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElement(postIds) : null,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    return comments;
  }

  /**
   * Generate reviews
   * @param {number} count - Number of reviews to generate
   * @param {Array} productIds - Available product IDs
   * @param {Array} userIds - Available user IDs
   * @returns {Array}
   */
  static generateReviews(count = 200, productIds = [], userIds = []) {
    const reviews = [];

    for (let i = 0; i < count; i++) {
      const rating = faker.number.int({ min: 1, max: 5 });

      reviews.push({
        productId: faker.helpers.arrayElement(productIds),
        userId: faker.helpers.arrayElement(userIds),
        rating,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        verified: faker.datatype.boolean({ probability: 0.7 }),
        helpful: faker.number.int({ min: 0, max: 100 }),
        notHelpful: faker.number.int({ min: 0, max: 20 }),
        images: faker.datatype.boolean({ probability: 0.3 })
          ? [faker.image.url(), faker.image.url()]
          : [],
        approved: faker.datatype.boolean({ probability: 0.95 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }

    return reviews;
  }

  /**
   * Generate custom data based on schema
   * @param {Object} schema - Data schema
   * @param {number} count - Number of records to generate
   * @returns {Array}
   */
  static generateCustom(schema, count = 10) {
    const records = [];

    for (let i = 0; i < count; i++) {
      const record = {};

      for (const [field, config] of Object.entries(schema)) {
        record[field] = this.generateField(config);
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Generate field value based on type
   * @private
   */
  static generateField(config) {
    const { type, options = {} } = config;

    switch (type) {
      case 'string':
        return faker.lorem.word();
      case 'email':
        return faker.internet.email();
      case 'number':
        return faker.number.int(options);
      case 'float':
        return faker.number.float(options);
      case 'boolean':
        return faker.datatype.boolean();
      case 'date':
        return faker.date.past(options);
      case 'uuid':
        return faker.string.uuid();
      case 'url':
        return faker.internet.url();
      case 'phone':
        return faker.phone.number();
      case 'address':
        return faker.location.streetAddress();
      case 'city':
        return faker.location.city();
      case 'country':
        return faker.location.country();
      case 'company':
        return faker.company.name();
      case 'paragraph':
        return faker.lorem.paragraph();
      case 'array':
        return options.values ? faker.helpers.arrayElement(options.values) : [];
      default:
        return null;
    }
  }
}

module.exports = DataGenerator;
