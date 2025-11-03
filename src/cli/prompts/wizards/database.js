/**
 * TryForge CLI - Database Configuration Wizard
 * Interactive wizard for database setup
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const {
  validateRequired,
  validatePort,
  validateUrl
} = require('../validators');
const {
  parsePort,
  normalizeUrl
} = require('../transformers');
const {
  DATABASE_CHOICES,
  AUTH_CHOICES
} = require('../choices');
const {
  createBanner,
  createSummary,
  createConfirmationPrompt,
  createInfoMessage
} = require('../templates');

/**
 * Database Configuration Wizard
 */
class DatabaseWizard {
  constructor() {
    this.config = {};
  }

  /**
   * Run the complete wizard
   */
  async run() {
    console.log(createBanner(
      '🗄️  Database Configuration',
      'Configure your database and authentication'
    ));

    try {
      // Step 1: Database Selection
      await this.promptDatabaseType();

      // Step 2: Database Connection (conditional)
      if (this.config.database !== 'none') {
        await this.promptDatabaseConnection();
      }

      // Step 3: Authentication
      await this.promptAuthentication();

      // Step 4: Database Features
      if (this.config.database !== 'none') {
        await this.promptDatabaseFeatures();
      }

      // Step 5: Confirmation
      const confirmed = await this.promptConfirmation();

      if (!confirmed) {
        console.log(chalk.yellow('\n✗ Database configuration cancelled\n'));
        return null;
      }

      return this.config;
    } catch (error) {
      console.log(chalk.red(`\n✗ Error: ${error.message}\n`));
      throw error;
    }
  }

  /**
   * Prompt for database type
   */
  async promptDatabaseType() {
    console.log(chalk.cyan.bold('\n📊 Database Selection\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Which database would you like to use?',
        choices: DATABASE_CHOICES,
        pageSize: 10
      }
    ]);

    const selectedDb = DATABASE_CHOICES.find(db => db.value === answers.database);
    this.config = {
      ...this.config,
      ...answers,
      databaseInfo: selectedDb
    };

    if (selectedDb.value !== 'none') {
      console.log(chalk.gray(`\n${selectedDb.description}\n`));
    }
  }

  /**
   * Prompt for database connection details
   */
  async promptDatabaseConnection() {
    const dbInfo = this.config.databaseInfo;

    console.log(chalk.cyan.bold('\n🔌 Database Connection\n'));

    // Different prompts based on database type
    if (dbInfo.value === 'sqlite') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'databasePath',
          message: 'SQLite database file path:',
          default: './database.sqlite',
          validate: validateRequired
        }
      ]);

      this.config = {
        ...this.config,
        ...answers,
        connectionString: answers.databasePath
      };
    } else {
      // For other databases (PostgreSQL, MySQL, MongoDB, Redis)
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'host',
          message: 'Database host:',
          default: 'localhost',
          validate: validateRequired
        },
        {
          type: 'input',
          name: 'port',
          message: 'Database port:',
          default: dbInfo.defaultPort?.toString() || '5432',
          validate: validatePort,
          filter: (input) => parsePort(input, dbInfo.defaultPort)
        },
        {
          type: 'input',
          name: 'databaseName',
          message: 'Database name:',
          default: 'myapp_db',
          validate: validateRequired,
          when: dbInfo.value !== 'redis'
        },
        {
          type: 'input',
          name: 'username',
          message: 'Database username:',
          default: dbInfo.value === 'mongodb' ? '' : 'postgres',
          when: dbInfo.value !== 'redis'
        },
        {
          type: 'password',
          name: 'password',
          message: 'Database password:',
          mask: '*',
          when: dbInfo.value !== 'redis'
        },
        {
          type: 'confirm',
          name: 'useSSL',
          message: 'Use SSL connection?',
          default: false,
          when: ['postgresql', 'mysql'].includes(dbInfo.value)
        }
      ]);

      this.config = { ...this.config, ...answers };

      // Generate connection string
      this.config.connectionString = this.generateConnectionString();
    }

    // Show connection string (masked password)
    console.log(createInfoMessage(
      'Connection string generated',
      this.getMaskedConnectionString()
    ));
  }

  /**
   * Prompt for authentication configuration
   */
  async promptAuthentication() {
    console.log(chalk.cyan.bold('\n🔐 Authentication\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'auth',
        message: 'Which authentication method?',
        choices: AUTH_CHOICES,
        pageSize: 10
      },
      {
        type: 'input',
        name: 'jwtSecret',
        message: 'JWT secret key:',
        default: () => this.generateRandomSecret(),
        validate: validateRequired,
        when: (answers) => answers.auth === 'jwt' || answers.auth === 'passport'
      },
      {
        type: 'number',
        name: 'jwtExpiry',
        message: 'JWT token expiry (in hours):',
        default: 24,
        when: (answers) => answers.auth === 'jwt' || answers.auth === 'passport'
      },
      {
        type: 'confirm',
        name: 'refreshToken',
        message: 'Enable refresh tokens?',
        default: true,
        when: (answers) => answers.auth === 'jwt' || answers.auth === 'passport'
      },
      {
        type: 'checkbox',
        name: 'oauthProviders',
        message: 'Select OAuth providers:',
        choices: [
          { name: 'Google', value: 'google', checked: true },
          { name: 'GitHub', value: 'github', checked: true },
          { name: 'Facebook', value: 'facebook', checked: false },
          { name: 'Twitter', value: 'twitter', checked: false }
        ],
        when: (answers) => answers.auth === 'oauth' || answers.auth === 'passport'
      },
      {
        type: 'input',
        name: 'sessionSecret',
        message: 'Session secret key:',
        default: () => this.generateRandomSecret(),
        validate: validateRequired,
        when: (answers) => answers.auth === 'session'
      },
      {
        type: 'number',
        name: 'sessionMaxAge',
        message: 'Session max age (in days):',
        default: 7,
        when: (answers) => answers.auth === 'session'
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for database features
   */
  async promptDatabaseFeatures() {
    console.log(chalk.cyan.bold('\n⚡ Database Features\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'orm',
        message: 'ORM/ODM:',
        choices: this.getOrmChoices(),
        default: this.getDefaultOrm()
      },
      {
        type: 'confirm',
        name: 'migrations',
        message: 'Generate database migrations?',
        default: true,
        when: this.config.database !== 'redis'
      },
      {
        type: 'confirm',
        name: 'seeders',
        message: 'Include database seeders?',
        default: true,
        when: this.config.database !== 'redis'
      },
      {
        type: 'confirm',
        name: 'softDeletes',
        message: 'Enable soft deletes?',
        default: true,
        when: this.config.database !== 'redis'
      },
      {
        type: 'confirm',
        name: 'timestamps',
        message: 'Add timestamps (createdAt, updatedAt)?',
        default: true,
        when: this.config.database !== 'redis'
      },
      {
        type: 'confirm',
        name: 'connectionPooling',
        message: 'Enable connection pooling?',
        default: true
      },
      {
        type: 'number',
        name: 'maxConnections',
        message: 'Maximum connections in pool:',
        default: 10,
        when: (answers) => answers.connectionPooling
      }
    ]);

    this.config = { ...this.config, ...answers };
  }

  /**
   * Prompt for confirmation
   */
  async promptConfirmation() {
    const summaryData = {
      'Database': this.config.databaseInfo?.short || 'None',
      'Authentication': AUTH_CHOICES.find(a => a.value === this.config.auth)?.short || 'None'
    };

    if (this.config.database !== 'none') {
      summaryData['Connection'] = this.getMaskedConnectionString();
      summaryData['ORM'] = this.config.orm || 'None';
      summaryData['Migrations'] = this.config.migrations ? 'Yes' : 'No';
      summaryData['Seeders'] = this.config.seeders ? 'Yes' : 'No';
    }

    console.log(createSummary('Database Configuration Summary', summaryData));

    const { confirmed } = await inquirer.prompt([
      createConfirmationPrompt(
        this.config,
        'Continue with this database configuration?'
      )
    ]);

    return confirmed;
  }

  /**
   * Get ORM choices based on database type
   */
  getOrmChoices() {
    const db = this.config.database;

    if (db === 'mongodb') {
      return [
        { name: 'Mongoose - Elegant MongoDB ODM', value: 'mongoose', short: 'Mongoose' },
        { name: 'Prisma - Modern ORM with MongoDB support', value: 'prisma', short: 'Prisma' }
      ];
    }

    if (db === 'redis') {
      return [
        { name: 'ioredis - Robust Redis client', value: 'ioredis', short: 'ioredis' },
        { name: 'redis - Official Redis client', value: 'redis', short: 'redis' }
      ];
    }

    // SQL databases
    return [
      { name: 'Prisma - Next-generation ORM', value: 'prisma', short: 'Prisma' },
      { name: 'Sequelize - Promise-based ORM', value: 'sequelize', short: 'Sequelize' },
      { name: 'TypeORM - TypeScript ORM', value: 'typeorm', short: 'TypeORM' },
      { name: 'Knex.js - SQL query builder', value: 'knex', short: 'Knex' }
    ];
  }

  /**
   * Get default ORM based on database
   */
  getDefaultOrm() {
    const db = this.config.database;

    const defaults = {
      'mongodb': 'mongoose',
      'redis': 'ioredis',
      'postgresql': 'prisma',
      'mysql': 'prisma',
      'sqlite': 'prisma'
    };

    return defaults[db] || 'prisma';
  }

  /**
   * Generate connection string
   */
  generateConnectionString() {
    const { database, host, port, databaseName, username, password, useSSL } = this.config;

    if (database === 'postgresql') {
      const sslParam = useSSL ? '?sslmode=require' : '';
      return `postgresql://${username}:${password}@${host}:${port}/${databaseName}${sslParam}`;
    }

    if (database === 'mysql') {
      const sslParam = useSSL ? '?ssl=true' : '';
      return `mysql://${username}:${password}@${host}:${port}/${databaseName}${sslParam}`;
    }

    if (database === 'mongodb') {
      return `mongodb://${username ? `${username}:${password}@` : ''}${host}:${port}/${databaseName}`;
    }

    if (database === 'redis') {
      return `redis://${host}:${port}`;
    }

    return '';
  }

  /**
   * Get masked connection string (hide password)
   */
  getMaskedConnectionString() {
    if (!this.config.connectionString) return '';

    return this.config.connectionString.replace(
      /:([^:@]+)@/,
      ':****@'
    );
  }

  /**
   * Generate a random secret
   */
  generateRandomSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Get the configuration
   */
  getConfig() {
    return this.config;
  }
}

/**
 * Quick database setup (with defaults)
 */
async function quickDatabaseSetup() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: DATABASE_CHOICES.slice(0, 4),
      default: 'postgresql'
    },
    {
      type: 'list',
      name: 'auth',
      message: 'Authentication:',
      choices: AUTH_CHOICES.slice(0, 3),
      default: 'jwt'
    }
  ]);

  // Return config with defaults
  return {
    ...answers,
    host: 'localhost',
    port: DATABASE_CHOICES.find(d => d.value === answers.database)?.defaultPort || 5432,
    databaseName: 'myapp_db',
    username: 'postgres',
    password: '',
    orm: 'prisma',
    migrations: true,
    seeders: true,
    timestamps: true
  };
}

module.exports = {
  DatabaseWizard,
  quickDatabaseSetup
};
