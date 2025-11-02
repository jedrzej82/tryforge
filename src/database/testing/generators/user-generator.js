const TestDataFactory = require('../data-factory');
const logger = require('../../../utils/logger');

/**
 * UserGenerator - Generate user test data
 *
 * Specialized generator for user-related test data
 */
class UserGenerator {
  constructor(config = {}) {
    this.factory = new TestDataFactory(config);
    this.config = config;
  }

  /**
   * Generate single user
   */
  generate(options = {}) {
    return this.factory.generateUser(options);
  }

  /**
   * Generate multiple users
   */
  generateMany(count, options = {}) {
    const users = [];

    for (let i = 0; i < count; i++) {
      users.push(this.generate(options));
    }

    return users;
  }

  /**
   * Generate admin user
   */
  generateAdmin(options = {}) {
    return this.factory.generateUser({
      role: 'admin',
      emailVerified: true,
      isActive: true,
      ...options
    });
  }

  /**
   * Generate moderator user
   */
  generateModerator(options = {}) {
    return this.factory.generateUser({
      role: 'moderator',
      emailVerified: true,
      isActive: true,
      ...options
    });
  }

  /**
   * Generate verified user
   */
  generateVerified(options = {}) {
    return this.factory.generateUser({
      emailVerified: true,
      isActive: true,
      ...options
    });
  }

  /**
   * Generate unverified user
   */
  generateUnverified(options = {}) {
    return this.factory.generateUser({
      emailVerified: false,
      isActive: true,
      ...options
    });
  }

  /**
   * Generate inactive user
   */
  generateInactive(options = {}) {
    return this.factory.generateUser({
      isActive: false,
      ...options
    });
  }

  /**
   * Generate user with profile
   */
  generateWithProfile(options = {}) {
    const user = this.generate(options);

    user.profile = {
      bio: this.factory.generateText(50, 200),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      website: `https://${user.username}.example.com`,
      location: this.factory.generateCity(),
      dateOfBirth: this.factory.generateDate(
        new Date('1970-01-01'),
        new Date('2005-12-31')
      ),
      phoneNumber: this.factory.generatePhoneNumber(),
      preferredLanguage: 'en',
      timezone: 'UTC'
    };

    return user;
  }

  /**
   * Generate user with posts
   */
  generateWithPosts(postCount = 5, options = {}) {
    const user = this.generate(options);

    user.posts = [];
    for (let i = 0; i < postCount; i++) {
      user.posts.push(this.factory.generatePost({
        authorId: user.id,
        status: 'published',
        publishedAt: this.factory.generateDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        )
      }));
    }

    return user;
  }

  /**
   * Generate user with addresses
   */
  generateWithAddresses(addressCount = 2, options = {}) {
    const user = this.generate(options);

    user.addresses = [];
    for (let i = 0; i < addressCount; i++) {
      const address = this.factory.generateAddress({
        firstName: user.firstName,
        lastName: user.lastName,
        isDefault: i === 0
      });
      user.addresses.push(address);
    }

    return user;
  }

  /**
   * Generate user with orders
   */
  generateWithOrders(orderCount = 3, options = {}) {
    const user = this.generate(options);

    user.orders = [];
    for (let i = 0; i < orderCount; i++) {
      const order = this.factory.generateOrder({
        userId: user.id,
        status: ['pending', 'processing', 'completed'][i % 3]
      });
      user.orders.push(order);
    }

    return user;
  }

  /**
   * Generate complete user with all relations
   */
  generateComplete(options = {}) {
    const {
      posts = 5,
      addresses = 2,
      orders = 3,
      ...userOptions
    } = options;

    let user = this.generateWithProfile(userOptions);

    // Add posts
    user.posts = [];
    for (let i = 0; i < posts; i++) {
      user.posts.push(this.factory.generatePost({
        authorId: user.id,
        status: i % 2 === 0 ? 'published' : 'draft'
      }));
    }

    // Add addresses
    user.addresses = [];
    for (let i = 0; i < addresses; i++) {
      user.addresses.push(this.factory.generateAddress({
        firstName: user.firstName,
        lastName: user.lastName,
        isDefault: i === 0
      }));
    }

    // Add orders
    user.orders = [];
    for (let i = 0; i < orders; i++) {
      user.orders.push(this.factory.generateOrder({
        userId: user.id
      }));
    }

    return user;
  }

  /**
   * Generate team of users
   */
  generateTeam(size = 5, options = {}) {
    const team = {
      admin: this.generateAdmin(options),
      moderators: [],
      users: []
    };

    // Generate moderators (20% of team)
    const moderatorCount = Math.max(1, Math.floor(size * 0.2));
    for (let i = 0; i < moderatorCount; i++) {
      team.moderators.push(this.generateModerator(options));
    }

    // Generate regular users
    const userCount = size - moderatorCount - 1;
    for (let i = 0; i < userCount; i++) {
      team.users.push(this.generate(options));
    }

    return team;
  }

  /**
   * Generate user cohort (users created in same time period)
   */
  generateCohort(count, startDate, endDate, options = {}) {
    const users = [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const interval = (end - start) / count;

    for (let i = 0; i < count; i++) {
      const createdAt = new Date(start + (interval * i));
      users.push(this.generate({
        createdAt,
        updatedAt: createdAt,
        ...options
      }));
    }

    return users;
  }

  /**
   * Generate users with different roles distribution
   */
  generateWithRoles(counts, options = {}) {
    const {
      admin = 1,
      moderator = 2,
      user = 10
    } = counts;

    const users = [];

    for (let i = 0; i < admin; i++) {
      users.push(this.generateAdmin(options));
    }

    for (let i = 0; i < moderator; i++) {
      users.push(this.generateModerator(options));
    }

    for (let i = 0; i < user; i++) {
      users.push(this.generate(options));
    }

    return users;
  }

  /**
   * Generate user lifecycle (new -> active -> inactive)
   */
  generateLifecycle() {
    const baseUser = this.generate();

    return {
      new: {
        ...baseUser,
        emailVerified: false,
        isActive: false,
        createdAt: new Date()
      },
      verified: {
        ...baseUser,
        emailVerified: true,
        isActive: true,
        emailVerifiedAt: new Date()
      },
      active: {
        ...baseUser,
        emailVerified: true,
        isActive: true,
        lastLoginAt: new Date()
      },
      inactive: {
        ...baseUser,
        emailVerified: true,
        isActive: false,
        deactivatedAt: new Date()
      }
    };
  }
}

module.exports = UserGenerator;
