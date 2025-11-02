const express = require('express');
const cors = require('cors');
const path = require('path');
const ConfigManager = require('./config-manager');

class AdminServer {
  constructor(port = 3333) {
    this.port = port;
    this.app = express();
    this.configManager = new ConfigManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get current configuration
    this.app.get('/api/config', async (req, res) => {
      try {
        const config = await this.configManager.readConfig();
        res.json({ success: true, config });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to read configuration',
          error: error.message,
        });
      }
    });

    // Update configuration
    this.app.post('/api/config', async (req, res) => {
      try {
        const result = await this.configManager.updateConfig(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to update configuration',
          error: error.message,
        });
      }
    });

    // Test API key
    this.app.post('/api/test-key', async (req, res) => {
      try {
        const { service, key } = req.body;

        if (!service || !key) {
          return res.status(400).json({
            success: false,
            message: 'Service and key are required',
          });
        }

        const result = await this.configManager.testApiKey(service, key);
        res.json({ success: result.valid, ...result });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to test API key',
          error: error.message,
        });
      }
    });

    // Serve admin panel
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`\n🎛️  TryForge Admin Panel started!`);
          console.log(`📊 Dashboard: http://localhost:${this.port}`);
          console.log(`🔧 API Endpoint: http://localhost:${this.port}/api`);
          console.log(`\n⚙️  Configure your API keys and settings from the web interface`);
          console.log(`Press Ctrl+C to stop\n`);
          resolve();
        });

        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${this.port} is already in use`);
            console.error(`Try running: tryforge admin --port <different-port>`);
          } else {
            console.error('❌ Server error:', error.message);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Admin panel stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = AdminServer;
