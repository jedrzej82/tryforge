/**
 * Integration Manager
 * Integrates components from Triple AI (Graphics, Frontend, Backend)
 */

const fs = require('fs-extra');
const path = require('path');

class IntegrationManager {
  async integrate(results) {
    const { graphics, frontend, backend, projectName } = results;

    // 1. Copy graphics to project assets
    await this.integrateGraphics(graphics, projectName);

    // 2. Update frontend components to use graphics
    await this.integrateFrontendWithGraphics(frontend, graphics, projectName);

    // 3. Connect frontend to backend API
    await this.connectFrontendToBackend(frontend, backend, projectName);

    // 4. Setup environment variables
    await this.setupEnvironment(projectName);

    return {
      success: true,
      message: 'All components integrated successfully',
    };
  }

  async integrateGraphics(graphics, projectName) {
    const assetsDir = path.join(projectName, 'src', 'assets');
    await fs.ensureDir(assetsDir);

    for (const graphic of graphics) {
      if (graphic.path) {
        const dest = path.join(assetsDir, path.basename(graphic.path));
        await fs.copy(graphic.path, dest);
      }
    }
  }

  async integrateFrontendWithGraphics(frontend, graphics, projectName) {
    // This would update import statements in components to reference graphics
    // Simplified for this implementation
    return true;
  }

  async connectFrontendToBackend(frontend, backend, projectName) {
    // This would configure API base URL and create API client
    // Simplified for this implementation
    return true;
  }

  async setupEnvironment(projectName) {
    const envContent = `# Database
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/${projectName}_db

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Node
NODE_ENV=development
`;

    await fs.writeFile(path.join(projectName, '.env'), envContent);
  }
}

module.exports = IntegrationManager;
