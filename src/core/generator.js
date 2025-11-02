/**
 * Project Generator
 * Handles project creation, scaffolding, and file generation
 */

const fs = require('fs').promises;
const path = require('path');
const TripleAI = require('./triple-ai');
const AdvancedTemplates = require('./advanced-templates');
const Logger = require('../utils/logger');

class ProjectGenerator {
  constructor(config = {}) {
    this.config = config;
    this.tripleAI = new TripleAI(config);
    this.advancedTemplates = new AdvancedTemplates();
    this.logger = new Logger();
  }

  /**
   * Create a new project
   */
  async create(name, options = {}) {
    const projectPath = path.join(process.cwd(), name);
    
    this.logger.info(`🔥 Creating project: ${name}`);
    this.logger.info(`📁 Location: ${projectPath}`);
    
    try {
      // Check if using advanced template
      let templateConfig = null;
      if (options.template && this.advancedTemplates.getTemplate(options.template)) {
        templateConfig = this.advancedTemplates.getTemplate(options.template);
        this.logger.info(`📋 Using advanced template: ${templateConfig.name}`);
      }
      
      // Step 1: Create project directory
      await fs.mkdir(projectPath, { recursive: true });
      
      // Step 2: Use Triple AI to generate project structure
      const projectDescription = templateConfig 
        ? templateConfig.description 
        : `${options.type || 'web'} application named ${name}`;
      
      const aiOutput = await this.tripleAI.orchestrate(projectDescription, {
        ...options,
        template: templateConfig
      });
      
      // Step 3: Generate project files based on template or standard
      if (templateConfig) {
        await this.generateAdvancedProject(projectPath, templateConfig, aiOutput, options);
      } else {
        await this.generateProjectFiles(projectPath, aiOutput, options);
      }
      
      // Step 4: Initialize git repository
      await this.initGit(projectPath);
      
      // Step 5: Create package.json
      await this.createPackageJson(projectPath, name, options, templateConfig);
      
      // Step 6: Create README
      await this.createReadme(projectPath, name, options, templateConfig);
      
      // Step 7: Create Docker configuration if needed
      if (templateConfig && templateConfig.architecture.infrastructure.containerization) {
        await this.createDockerConfig(projectPath, templateConfig);
      }
      
      this.logger.success(`✅ Project ${name} created successfully!`);
      if (templateConfig) {
        this.logger.info(`\n🚀 Created ${templateConfig.name}!`);
        this.logger.info(`📊 Features: ${templateConfig.features.slice(0, 3).join(', ')}...`);
        this.logger.info(`⏱️  Estimated development time: ${templateConfig.estimatedDevTime}`);
      }
      this.logger.info(`\nNext steps:`);
      this.logger.info(`  cd ${name}`);
      this.logger.info(`  npm install`);
      this.logger.info(`  npm run dev`);
      
      return {
        success: true,
        path: projectPath,
        name,
        architecture: aiOutput.architecture
      };
    } catch (error) {
      this.logger.error('Project creation failed:', error);
      throw error;
    }
  }

  /**
   * Refactor existing project
   */
  async refactor(projectPath, options = {}) {
    this.logger.info(`🔧 Refactoring project at: ${projectPath}`);
    
    // Implementation for refactor mode
    return {
      success: true,
      changes: [],
      report: 'Refactoring report'
    };
  }

  /**
   * Analyze existing project
   */
  async analyze(projectPath, options = {}) {
    this.logger.info(`🔍 Analyzing project at: ${projectPath}`);
    
    // Implementation for analyze mode
    return {
      success: true,
      metrics: {},
      recommendations: []
    };
  }

  /**
   * Generate advanced project from template (Ahrefs, Allegro, OLX-like)
   */
  async generateAdvancedProject(projectPath, templateConfig, aiOutput, options) {
    this.logger.info(`🏗️  Generating ${templateConfig.name}...`);
    
    // Create comprehensive directory structure
    const directories = [
      'frontend/src/components',
      'frontend/src/pages',
      'frontend/src/hooks',
      'frontend/src/utils',
      'frontend/src/services',
      'frontend/src/styles',
      'frontend/public/assets',
      'backend/src/services',
      'backend/src/controllers',
      'backend/src/routes',
      'backend/src/models',
      'backend/src/middleware',
      'backend/src/utils',
      'backend/src/config',
      'database/migrations',
      'database/seeds',
      'infrastructure/docker',
      'infrastructure/kubernetes',
      'docs'
    ];
    
    for (const dir of directories) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }
    
    // Generate frontend components from template
    if (templateConfig.architecture.frontend.components) {
      await this.generateAdvancedFrontend(projectPath, templateConfig);
    }
    
    // Generate backend microservices
    if (templateConfig.architecture.backend.services) {
      await this.generateAdvancedBackend(projectPath, templateConfig);
    }
    
    // Generate database schema
    if (templateConfig.database_schema) {
      await this.generateAdvancedDatabase(projectPath, templateConfig.database_schema);
    }
    
    // Generate API documentation
    await this.generateAPIDocumentation(projectPath, templateConfig);
    
    // Generate infrastructure files
    await this.generateInfrastructure(projectPath, templateConfig);
    
    // Generate comprehensive documentation
    await this.generateAdvancedDocs(projectPath, templateConfig);
    
    this.logger.success(`✅ Advanced project structure created!`);
  }

  async generateAdvancedFrontend(projectPath, templateConfig) {
    const frontendPath = path.join(projectPath, 'frontend');
    const { components } = templateConfig.architecture.frontend;
    
    // Generate each component
    for (const componentName of components) {
      const componentCode = this.generateComponentCode(componentName, templateConfig);
      const componentPath = path.join(frontendPath, `src/components/${componentName}.jsx`);
      await fs.writeFile(componentPath, componentCode);
    }
    
    // Generate main App.jsx with routing
    const appCode = this.generateAdvancedApp(components, templateConfig);
    await fs.writeFile(path.join(frontendPath, 'src/App.jsx'), appCode);
    
    // Generate package.json for frontend
    const frontendPackage = {
      name: 'frontend',
      version: '1.0.0',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        lint: 'eslint src'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.20.0',
        '@tanstack/react-query': '^5.12.0',
        'axios': '^1.6.2',
        'recharts': '^2.10.0',
        '@mui/material': '^5.15.0',
        '@mui/icons-material': '^5.15.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.2.0',
        'vite': '^5.0.0',
        'eslint': '^8.55.0'
      }
    };
    await fs.writeFile(
      path.join(frontendPath, 'package.json'),
      JSON.stringify(frontendPackage, null, 2)
    );
  }

  async generateAdvancedBackend(projectPath, templateConfig) {
    const backendPath = path.join(projectPath, 'backend');
    const { services } = templateConfig.architecture.backend;
    
    // Generate each microservice
    for (const serviceName of services) {
      const serviceCode = this.generateServiceCode(serviceName, templateConfig);
      const servicePath = path.join(backendPath, `src/services/${serviceName.toLowerCase().replace(/ /g, '-')}.js`);
      await fs.writeFile(servicePath, serviceCode);
    }
    
    // Generate main server.js
    const serverCode = this.generateAdvancedServer(services, templateConfig);
    await fs.writeFile(path.join(backendPath, 'src/server.js'), serverCode);
    
    // Generate API routes
    await this.generateAPIRoutes(backendPath, templateConfig);
    
    // Generate backend package.json
    const backendPackage = {
      name: 'backend',
      version: '1.0.0',
      scripts: {
        start: 'node src/server.js',
        dev: 'nodemon src/server.js',
        test: 'jest'
      },
      dependencies: {
        'express': '^4.18.2',
        'cors': '^2.8.5',
        'pg': '^8.11.3',
        'redis': '^4.6.11',
        'bull': '^4.12.0',
        'winston': '^3.11.0',
        'dotenv': '^16.3.1',
        'joi': '^17.11.0',
        'bcrypt': '^5.1.1',
        'jsonwebtoken': '^9.0.2',
        'elasticsearch': '^16.7.3'
      },
      devDependencies: {
        'nodemon': '^3.0.2',
        'jest': '^29.7.0'
      }
    };
    await fs.writeFile(
      path.join(backendPath, 'package.json'),
      JSON.stringify(backendPackage, null, 2)
    );
  }

  async generateAdvancedDatabase(projectPath, schema) {
    const dbPath = path.join(projectPath, 'database');
    
    // Generate schema.sql with advanced features
    let schemaSQL = `-- ${schema.tables[0]?.name ? 'Advanced' : ''} Database Schema
-- Auto-generated by TryForge
-- Supports sharding, partitioning, and high-performance indexing

`;
    
    for (const table of schema.tables) {
      schemaSQL += `-- Table: ${table.name}\n`;
      schemaSQL += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
      schemaSQL += table.columns.map(col => `  ${col.name} ${col.type}`).join(',\n');
      schemaSQL += '\n)';
      
      if (table.partitioning) {
        schemaSQL += ` ${table.partitioning}`;
      }
      
      schemaSQL += ';\n\n';
      
      // Create indexes
      if (table.indexes) {
        for (const indexCol of table.indexes) {
          const indexName = `idx_${table.name}_${indexCol.replace(/[() ]/g, '_')}`;
          schemaSQL += `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table.name}(${indexCol});\n`;
        }
        schemaSQL += '\n';
      }
    }
    
    await fs.writeFile(path.join(dbPath, 'schema.sql'), schemaSQL);
    
    // Generate migration files
    await this.generateMigrations(dbPath, schema);
  }

  async generateAPIDocumentation(projectPath, templateConfig) {
    const docsPath = path.join(projectPath, 'docs');
    
    let apiDoc = `# API Documentation

## Overview

${templateConfig.description}

## Base URL

\`\`\`
Production: https://api.example.com
Development: http://localhost:3000
\`\`\`

## Authentication

All API requests require authentication via Bearer token:

\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Endpoints

`;
    
    if (templateConfig.api_endpoints) {
      for (const endpoint of templateConfig.api_endpoints) {
        apiDoc += `### ${endpoint.method} ${endpoint.path}

${endpoint.description}

\`\`\`bash
curl -X ${endpoint.method} https://api.example.com${endpoint.path} \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

---

`;
      }
    }
    
    await fs.writeFile(path.join(docsPath, 'API.md'), apiDoc);
  }

  async generateInfrastructure(projectPath, templateConfig) {
    const infraPath = path.join(projectPath, 'infrastructure');
    
    // Generate Dockerfile
    const dockerfile = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
    
    await fs.writeFile(path.join(infraPath, 'docker/Dockerfile'), dockerfile);
    
    // Generate docker-compose.yml
    const dockerCompose = `version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=development
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`;
    
    await fs.writeFile(path.join(infraPath, 'docker/docker-compose.yml'), dockerCompose);
  }

  async generateAdvancedDocs(projectPath, templateConfig) {
    const docsPath = path.join(projectPath, 'docs');
    
    const archDoc = `# Architecture Documentation

## System Overview

${templateConfig.description}

## Tech Stack

**Frontend:**
${templateConfig.techStack.frontend.map(t => `- ${t}`).join('\n')}

**Backend:**
${templateConfig.techStack.backend.map(t => `- ${t}`).join('\n')}

**Database:**
${templateConfig.techStack.database.map(t => `- ${t}`).join('\n')}

**Infrastructure:**
${templateConfig.techStack.infrastructure.map(t => `- ${t}`).join('\n')}

## Features

${templateConfig.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Development Timeline

${templateConfig.estimatedDevTime}

## Microservices

${templateConfig.architecture.backend.services.map(s => `- ${s}`).join('\n')}

## Scaling Strategy

- Horizontal scaling with Kubernetes
- Database sharding by user/region
- CDN for static assets
- Redis for caching
- Queue-based async processing
`;
    
    await fs.writeFile(path.join(docsPath, 'ARCHITECTURE.md'), archDoc);
  }

  generateComponentCode(componentName, templateConfig) {
    const sanitized = componentName.replace(/[^a-zA-Z0-9]/g, '');
    return `import React from 'react';
import { Box, Typography } from '@mui/material';

export default function ${sanitized}() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ${componentName}
      </Typography>
      <Typography variant="body1">
        ${componentName} component for ${templateConfig.name}
      </Typography>
    </Box>
  );
}`;
  }

  generateAdvancedApp(components, templateConfig) {
    return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Import components
${components.slice(0, 5).map(c => {
  const sanitized = c.replace(/[^a-zA-Z0-9]/g, '');
  return `import ${sanitized} from './components/${sanitized}';`;
}).join('\n')}

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<${components[0].replace(/[^a-zA-Z0-9]/g, '')} />} />
            {/* Add more routes here */}
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;`;
  }

  generateServiceCode(serviceName, templateConfig) {
    const sanitized = serviceName.toLowerCase().replace(/ /g, '_');
    return `/**
 * ${serviceName}
 * Part of ${templateConfig.name}
 */

const Logger = require('../utils/logger');

class ${serviceName.replace(/ /g, '')} {
  constructor() {
    this.logger = new Logger();
  }

  async process(data) {
    this.logger.info(\`Processing in ${serviceName}\`);
    // Implementation here
    return { success: true, data };
  }
}

module.exports = ${serviceName.replace(/ /g, '')};`;
  }

  generateAdvancedServer(services, templateConfig) {
    return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: '${templateConfig.name}',
    timestamp: new Date().toISOString() 
  });
});

// API Routes
${services.slice(0, 3).map(s => {
  const route = s.toLowerCase().replace(/ service/g, '').replace(/ /g, '-');
  return `app.use('/api/${route}', require('./routes/${route}'));`;
}).join('\n')}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 ${templateConfig.name} server running on port \${PORT}\`);
});

module.exports = app;`;
  }

  async generateAPIRoutes(backendPath, templateConfig) {
    // Generate sample routes
    const routesPath = path.join(backendPath, 'src/routes');
    
    if (templateConfig.api_endpoints && templateConfig.api_endpoints.length > 0) {
      const firstEndpoint = templateConfig.api_endpoints[0];
      const routeName = firstEndpoint.path.split('/')[2] || 'api';
      
      const routeCode = `const express = require('express');
const router = express.Router();

// ${firstEndpoint.description}
router.${firstEndpoint.method.toLowerCase()}('${firstEndpoint.path.replace('/api', '')}', async (req, res) => {
  try {
    // Implementation here
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;`;
      
      await fs.writeFile(path.join(routesPath, `${routeName}.js`), routeCode);
    }
  }

  async generateMigrations(dbPath, schema) {
    const migrationsPath = path.join(dbPath, 'migrations');
    const timestamp = Date.now();
    
    let migrationCode = `-- Migration ${timestamp}
-- Create initial tables

`;
    
    for (const table of schema.tables.slice(0, 2)) {
      migrationCode += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
      migrationCode += table.columns.map(col => `  ${col.name} ${col.type}`).join(',\n');
      migrationCode += '\n);\n\n';
    }
    
    await fs.writeFile(path.join(migrationsPath, `${timestamp}_initial.sql`), migrationCode);
  }

  async createDockerConfig(projectPath, templateConfig) {
    // Already handled in generateInfrastructure
  }

  /**
   * Generate project files from AI output
   */
  async generateProjectFiles(projectPath, aiOutput, options) {
    const { architecture, components, graphics } = aiOutput;
    
    // Create frontend structure
    if (options.frontend !== false) {
      await this.generateFrontend(projectPath, architecture.frontend, components);
    }
    
    // Create backend structure
    if (options.backend !== false) {
      await this.generateBackend(projectPath, architecture.backend);
    }
    
    // Create database files
    await this.generateDatabase(projectPath, architecture.database);
    
    // Download and save graphics
    if (graphics.length > 0) {
      await this.saveGraphics(projectPath, graphics);
    }
  }

  async generateFrontend(projectPath, frontendConfig, components) {
    const frontendPath = path.join(projectPath, 'frontend');
    
    // Create directory structure
    const dirs = [
      'src',
      'src/components',
      'src/pages',
      'src/hooks',
      'src/utils',
      'src/styles',
      'public'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(frontendPath, dir), { recursive: true });
    }
    
    // Generate component files
    for (const component of components) {
      const componentPath = path.join(frontendPath, component.path);
      await fs.writeFile(componentPath, component.code);
    }
    
    // Create main App.jsx
    const appCode = `import React from 'react';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <h1>Welcome to TryForge App</h1>
    </div>
  );
}

export default App;`;
    
    await fs.writeFile(path.join(frontendPath, 'src/App.jsx'), appCode);
    
    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TryForge App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    
    await fs.writeFile(path.join(frontendPath, 'index.html'), indexHtml);
    
    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})`;
    
    await fs.writeFile(path.join(frontendPath, 'vite.config.js'), viteConfig);
  }

  async generateBackend(projectPath, backendConfig) {
    const backendPath = path.join(projectPath, 'backend');
    
    // Create directory structure
    const dirs = [
      'src',
      'src/routes',
      'src/controllers',
      'src/models',
      'src/middleware',
      'src/services',
      'src/config'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(backendPath, dir), { recursive: true });
    }
    
    // Create server.js
    const serverCode = `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});

module.exports = app;`;
    
    await fs.writeFile(path.join(backendPath, 'src/server.js'), serverCode);
  }

  async generateDatabase(projectPath, databaseConfig) {
    const dbPath = path.join(projectPath, 'database');
    await fs.mkdir(dbPath, { recursive: true });
    
    // Create schema.sql
    let schemaSQL = '-- TryForge Database Schema\n\n';
    
    for (const table of databaseConfig.tables) {
      schemaSQL += `CREATE TABLE ${table.name} (\n`;
      schemaSQL += table.columns.map(col => `  ${col.name} ${col.type}`).join(',\n');
      schemaSQL += '\n);\n\n';
    }
    
    await fs.writeFile(path.join(dbPath, 'schema.sql'), schemaSQL);
  }

  async saveGraphics(projectPath, graphics) {
    const assetsPath = path.join(projectPath, 'frontend/public/assets');
    await fs.mkdir(assetsPath, { recursive: true });
    
    // Save graphic URLs to a manifest file
    const manifest = graphics.map(g => ({
      name: g.name,
      url: g.url,
      type: g.type
    }));
    
    await fs.writeFile(
      path.join(assetsPath, 'graphics-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  async initGit(projectPath) {
    // Create .gitignore
    const gitignore = `node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store`;
    
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
  }

  async createPackageJson(projectPath, name, options) {
    const packageJson = {
      name: name,
      version: '1.0.0',
      description: `TryForge application: ${name}`,
      scripts: {
        dev: 'npm run dev:backend & npm run dev:frontend',
        'dev:frontend': 'cd frontend && npm run dev',
        'dev:backend': 'cd backend && nodemon src/server.js',
        build: 'cd frontend && npm run build',
        test: 'jest'
      },
      keywords: ['tryforge', 'triple-ai'],
      author: '',
      license: 'MIT'
    };
    
    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async createReadme(projectPath, name, options) {
    const readme = `# ${name}

Created with TryForge - Triple AI Application Framework

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
\`\`\`

## 📁 Structure

- \`frontend/\` - React frontend (Vite)
- \`backend/\` - Express backend
- \`database/\` - Database schema

## 🔧 Configuration

Copy \`.env.example\` to \`.env\` and configure your environment variables.

## 📚 Documentation

See [TryForge documentation](https://github.com/jedrzej82/tryforge) for more information.

---

Built with 🔥 TryForge - Triple AI (Claude + GitHub Spark + Pollinations)
`;
    
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }
}

module.exports = ProjectGenerator;
