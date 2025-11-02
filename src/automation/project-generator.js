/**
 * Project Generator
 * Generates actual project structure from templates and AI outputs
 */

const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const chalk = require('chalk');

class ProjectGenerator {
  constructor(projectName, architecture) {
    this.projectName = projectName;
    this.architecture = architecture;
    this.projectPath = path.join(process.cwd(), projectName);
  }

  /**
   * Generate complete project
   */
  async generate(results, options = {}) {
    const { graphics, frontend, backend } = results;

    // Create project structure
    await this.createStructure();

    // Generate frontend from template
    await this.generateFrontend(frontend, graphics);

    // Generate backend from template
    await this.generateBackend(backend);

    // Copy graphics assets (if provided)
    if (graphics && graphics.length > 0) {
      await this.copyGraphics(graphics);
    }

    // Generate professional graphics with AI (NEW!)
    if (options.autoGraphics !== false) {
      await this.generateGraphicsWithAI({
        style: options.graphicsStyle,
        colorScheme: options.colorScheme,
        autoEnrich: options.enrichGraphics !== false,
        generateVariations: options.graphicsVariations !== false
      });
    }

    // Generate configuration files
    await this.generateConfig();

    // Generate documentation
    await this.generateDocs();

    return this.projectPath;
  }

  /**
   * Create project directory structure
   */
  async createStructure() {
    const dirs = [
      'frontend/src/components',
      'frontend/src/pages',
      'frontend/src/assets',
      'frontend/src/utils',
      'frontend/src/styles',
      'backend/src/routes',
      'backend/src/models',
      'backend/src/middleware',
      'backend/src/services',
      'backend/src/utils',
      'backend/sql/migrations',
      'backend/sql/seeds',
      'backend/tests',
      'docs',
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectPath, dir));
    }
  }

  /**
   * Generate frontend from React template
   */
  async generateFrontend(frontendComponents, graphics) {
    const framework = this.architecture.frontend.framework.toLowerCase();
    const templateDir = path.join(__dirname, '..', 'templates', framework);

    // Check if template exists
    if (!await fs.pathExists(templateDir)) {
      throw new Error(`Template not found for framework: ${framework}`);
    }

    // Copy template files
    await this.copyTemplate(templateDir, path.join(this.projectPath, 'frontend'));

    // Generate package.json from template
    await this.generatePackageJson('frontend', {
      projectName: this.projectName,
      description: this.architecture.type,
      features: this.extractFeatures(),
    });

    // Generate components
    for (const component of frontendComponents) {
      await this.generateComponent(component, graphics);
    }

    // Generate main App component
    await this.generateAppComponent(frontendComponents);
  }

  /**
   * Generate backend from Express template
   */
  async generateBackend(backendData) {
    const templateDir = path.join(__dirname, '..', 'templates', 'express');

    // Copy template files
    await this.copyTemplate(templateDir, path.join(this.projectPath, 'backend'));

    // Generate package.json
    await this.generatePackageJson('backend', {
      projectName: this.projectName,
      description: this.architecture.type,
      features: this.extractFeatures(),
    });

    // Generate database schema
    await this.generateDatabaseSchema(backendData);

    // Generate API routes
    await this.generateAPIRoutes(backendData);

    // Generate models
    await this.generateModels(backendData);
  }

  /**
   * Copy template directory
   */
  async copyTemplate(templateDir, destDir) {
    const files = await fs.readdir(templateDir, { withFileTypes: true });

    for (const file of files) {
      const srcPath = path.join(templateDir, file.name);
      const destPath = path.join(destDir, file.name);

      if (file.isDirectory()) {
        await fs.ensureDir(destPath);
        await this.copyTemplate(srcPath, destPath);
      } else {
        // Check if it's a Handlebars template
        if (file.name.endsWith('.hbs')) {
          const content = await fs.readFile(srcPath, 'utf8');
          const template = Handlebars.compile(content);
          const rendered = template({
            projectName: this.projectName,
            description: this.architecture.type,
          });

          // Remove .hbs extension
          const finalPath = destPath.replace('.hbs', '');
          await fs.writeFile(finalPath, rendered);
        } else {
          await fs.copy(srcPath, destPath);
        }
      }
    }
  }

  /**
   * Generate package.json from template
   */
  async generatePackageJson(type, data) {
    const templatePath = path.join(__dirname, '..', 'templates',
      type === 'frontend' ? this.architecture.frontend.framework.toLowerCase() : 'express',
      'package.json.hbs'
    );

    if (await fs.pathExists(templatePath)) {
      const content = await fs.readFile(templatePath, 'utf8');
      const template = Handlebars.compile(content);
      const rendered = template(data);

      const destPath = path.join(this.projectPath, type, 'package.json');
      await fs.writeFile(destPath, rendered);
    }
  }

  /**
   * Generate React component
   */
  async generateComponent(componentData, graphics) {
    const componentName = componentData.name;
    const componentPath = path.join(this.projectPath, 'frontend', 'src', 'components', `${componentName}.jsx`);

    // Find relevant graphics for this component
    const relevantGraphics = graphics.filter(g =>
      componentData.customAssets?.includes(g.name)
    );

    const code = this.createComponentCode(componentName, componentData, relevantGraphics);

    await fs.writeFile(componentPath, code);
  }

  /**
   * Create React component code
   */
  createComponentCode(name, data, graphics) {
    const imports = graphics.length > 0
      ? graphics.map(g => `import ${this.toCamelCase(g.name)} from '../assets/${g.name}.png';`).join('\n')
      : '';

    return `${imports ? imports + '\n\n' : ''}function ${name}() {
  return (
    <div className="${this.toKebabCase(name)}">
      <h2>${name}</h2>
      {/* Component content */}
    </div>
  );
}

export default ${name};
`;
  }

  /**
   * Generate App.jsx main component
   */
  async generateAppComponent(components) {
    const imports = components
      .map(c => `import ${c.name} from './components/${c.name}';`)
      .join('\n');

    const code = `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
${imports}
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add more routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
`;

    await fs.writeFile(
      path.join(this.projectPath, 'frontend', 'src', 'App.jsx'),
      code
    );
  }

  /**
   * Generate database schema SQL
   */
  async generateDatabaseSchema(backendData) {
    const tables = backendData.tables || this.architecture.database.tables;

    const sql = `-- Database Schema
-- Auto-generated by TryForge
-- Created: ${new Date().toISOString()}

${tables.map(table => `
CREATE TABLE IF NOT EXISTS ${table} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${table}_updated_at BEFORE UPDATE ON ${table}
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`).join('\n')}

-- Indexes
${tables.map(table => `CREATE INDEX idx_${table}_created_at ON ${table}(created_at);`).join('\n')}
`;

    await fs.writeFile(
      path.join(this.projectPath, 'backend', 'sql', 'schema.sql'),
      sql
    );
  }

  /**
   * Generate API routes
   */
  async generateAPIRoutes(backendData) {
    const endpoints = backendData.endpoints || this.architecture.api.endpoints;

    // Group endpoints by resource
    const resources = {};
    endpoints.forEach(endpoint => {
      const resource = endpoint.path.split('/')[2]; // e.g., /api/posts -> posts
      if (!resources[resource]) {
        resources[resource] = [];
      }
      resources[resource].push(endpoint);
    });

    // Generate route file for each resource
    for (const [resource, resourceEndpoints] of Object.entries(resources)) {
      const code = this.createRouteCode(resource, resourceEndpoints);
      await fs.writeFile(
        path.join(this.projectPath, 'backend', 'src', 'routes', `${resource}.js`),
        code
      );
    }
  }

  /**
   * Create Express route code
   */
  createRouteCode(resource, endpoints) {
    return `const express = require('express');
const router = express.Router();

${endpoints.map(endpoint => {
  const method = endpoint.method.toLowerCase();
  const handler = endpoint.path.includes(':') ? 'getById' : method === 'get' ? 'getAll' : method;

  return `// ${endpoint.method} ${endpoint.path}
router.${method}('${endpoint.path.replace('/api/' + resource, '')}', async (req, res) => {
  try {
    // TODO: Implement ${handler} logic
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`;
}).join('\n\n')}

module.exports = router;
`;
  }

  /**
   * Generate Sequelize/TypeORM models
   */
  async generateModels(backendData) {
    const tables = backendData.tables || this.architecture.database.tables;

    for (const table of tables) {
      const code = `// Model: ${table}
// Auto-generated by TryForge

const db = require('../config/database');

class ${this.toPascalCase(table)} {
  static async findAll() {
    const result = await db.query('SELECT * FROM ${table}');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM ${table} WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => \`$\${i + 1}\`).join(', ');

    const result = await db.query(
      \`INSERT INTO ${table} (\${keys.join(', ')}) VALUES (\${placeholders}) RETURNING *\`,
      values
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => \`\${key} = $\${i + 2}\`).join(', ');

    const result = await db.query(
      \`UPDATE ${table} SET \${setClause} WHERE id = $1 RETURNING *\`,
      [id, ...values]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM ${table} WHERE id = $1', [id]);
  }
}

module.exports = ${this.toPascalCase(table)};
`;

      await fs.writeFile(
        path.join(this.projectPath, 'backend', 'src', 'models', `${table}.js`),
        code
      );
    }
  }

  /**
   * Copy graphics to project assets
   */
  async copyGraphics(graphics) {
    const assetsDir = path.join(this.projectPath, 'frontend', 'src', 'assets');

    for (const graphic of graphics) {
      if (graphic.path && await fs.pathExists(graphic.path)) {
        const dest = path.join(assetsDir, path.basename(graphic.path));
        await fs.copy(graphic.path, dest);
      }
    }
  }

  /**
   * Generate professional graphics using AI
   * Integrated with AutonomousGraphicsSystem
   */
  async generateGraphicsWithAI(options = {}) {
    console.log(chalk.cyan('\n🎨 Generating professional graphics with AI...\n'));

    try {
      const AutonomousGraphicsSystem = require('./autonomous-graphics-system');

      const graphicsSystem = new AutonomousGraphicsSystem({
        outputDir: 'public/images',
        quality: 90,
        optimize: true,
        autoEnrich: options.autoEnrich !== false,
        generateVariations: options.generateVariations !== false
      });

      // Prepare requirements from project architecture
      const requirements = {
        name: this.projectName,
        type: this.architecture.type || 'web application',
        description: this.architecture.description || `${this.projectName} application`,
        features: this.architecture.features || [],
        style: options.style || this.architecture.style || 'modern professional',
        colorScheme: options.colorScheme || this.architecture.colors || 'blue and white',
        targetAudience: this.architecture.targetAudience || 'general users'
      };

      // Generate all missing graphics
      const result = await graphicsSystem.generateMissingGraphics(
        requirements,
        this.projectPath
      );

      if (result.success && result.successful > 0) {
        console.log(chalk.green(`✅ Generated ${result.successful} professional graphics`));
        console.log(chalk.gray(`   Output: public/images/`));

        // Copy generated graphics to frontend assets
        const publicImagesDir = path.join(this.projectPath, 'public', 'images');
        const frontendAssetsDir = path.join(this.projectPath, 'frontend', 'public', 'images');

        if (await fs.pathExists(publicImagesDir)) {
          await fs.ensureDir(frontendAssetsDir);
          await fs.copy(publicImagesDir, frontendAssetsDir);
          console.log(chalk.gray('   ✓ Copied to frontend assets'));
        }

        return result;
      } else {
        console.log(chalk.yellow('⚠️  No graphics generated (may already exist)'));
        return result;
      }

    } catch (error) {
      console.error(chalk.red('❌ Graphics generation failed:'), error.message);
      console.log(chalk.yellow('⚠️  Continuing without generated graphics...'));
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate .env configuration
   */
  async generateConfig() {
    const envContent = `# Database
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/${this.projectName}_db
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass123
POSTGRES_DB=${this.projectName}_db

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=${this.generateSecret()}
JWT_EXPIRES_IN=7d

# Redis (if used)
REDIS_URL=redis://localhost:6379

# App
APP_NAME=${this.projectName}
APP_VERSION=1.0.0
`;

    await fs.writeFile(path.join(this.projectPath, '.env'), envContent);
    await fs.writeFile(path.join(this.projectPath, '.env.example'), envContent);
  }

  /**
   * Generate project documentation
   */
  async generateDocs() {
    const readmeContent = `# ${this.projectName}

${this.architecture.type}

## Generated by TryForge Triple AI Framework

This project was automatically generated using:
- **Claude** - Architecture planning and backend generation
- **GitHub Spark** - UI component generation
- **Pollinations AI** - Custom graphics generation

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional)

### Installation

1. Install dependencies:
\`\`\`bash
cd ${this.projectName}
npm run install:all
\`\`\`

2. Setup database:
\`\`\`bash
npm run db:setup
\`\`\`

3. Start development servers:
\`\`\`bash
npm start
\`\`\`

### Development

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Project Structure

\`\`\`
${this.projectName}/
├── frontend/          # React frontend
├── backend/           # Express.js backend
├── docs/              # Documentation
└── .env               # Environment variables
\`\`\`

## Available Scripts

- \`npm start\` - Start all servers
- \`npm test\` - Run tests
- \`npm run build\` - Build for production
- \`npm run db:reset\` - Reset database

## Documentation

See [docs/](./docs/) for detailed documentation.

## License

MIT

---

*Generated by TryForge - Triple AI Application Framework*
`;

    await fs.writeFile(path.join(this.projectPath, 'README.md'), readmeContent);
  }

  // Helper methods
  extractFeatures() {
    return {
      auth: this.architecture.features?.includes('authentication'),
      realtime: this.architecture.features?.includes('real-time'),
      cache: this.architecture.features?.includes('caching'),
    };
  }

  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  toPascalCase(str) {
    return str.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }
}

module.exports = ProjectGenerator;
