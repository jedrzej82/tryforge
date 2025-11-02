/**
 * Project Generator
 * Handles project creation, scaffolding, and file generation
 */

const fs = require('fs').promises;
const path = require('path');
const TripleAI = require('./triple-ai');
const Logger = require('../utils/logger');

class ProjectGenerator {
  constructor(config = {}) {
    this.config = config;
    this.tripleAI = new TripleAI(config);
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
      // Step 1: Create project directory
      await fs.mkdir(projectPath, { recursive: true });
      
      // Step 2: Use Triple AI to generate project structure
      const projectDescription = `${options.type || 'web'} application named ${name}`;
      const aiOutput = await this.tripleAI.orchestrate(projectDescription, options);
      
      // Step 3: Generate project files
      await this.generateProjectFiles(projectPath, aiOutput, options);
      
      // Step 4: Initialize git repository
      await this.initGit(projectPath);
      
      // Step 5: Create package.json
      await this.createPackageJson(projectPath, name, options);
      
      // Step 6: Create README
      await this.createReadme(projectPath, name, options);
      
      this.logger.success(`✅ Project ${name} created successfully!`);
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
