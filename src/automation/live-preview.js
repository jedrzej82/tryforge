/**
 * Live Preview System
 * Real-time preview with hot reload like Replit
 */

const express = require('express');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { spawn } = require('child_process');

class LivePreview {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.previewServer = null;
    this.devServer = null;
    this.watcher = null;
    this.io = null;
    this.port = 4000; // Preview server port
  }

  /**
   * Start live preview system
   */
  async start() {
    console.log(chalk.cyan('\n🔴 Starting Live Preview System...\n'));

    // Start preview server
    await this.startPreviewServer();

    // Start file watcher
    this.startFileWatcher();

    // Start dev servers
    await this.startDevServers();

    console.log(chalk.green.bold('\n✅ Live Preview Running!\n'));
    console.log(chalk.white('📺 Preview: ') + chalk.cyan(`http://localhost:${this.port}`));
    console.log(chalk.white('🎨 Frontend: ') + chalk.cyan('http://localhost:5173'));
    console.log(chalk.white('🔧 Backend: ') + chalk.cyan('http://localhost:3000'));
    console.log(chalk.gray('\n💡 Changes will auto-reload\n'));
  }

  /**
   * Start preview server with WebSocket
   */
  async startPreviewServer() {
    const app = express();
    const http = require('http').createServer(app);
    this.io = new Server(http, {
      cors: { origin: '*' },
    });

    // Serve preview interface
    app.get('/', (req, res) => {
      res.send(this.getPreviewHTML());
    });

    // API to get file content
    app.get('/api/file/:path(*)', async (req, res) => {
      try {
        const filePath = path.join(this.projectPath, req.params.path);
        const content = await fs.readFile(filePath, 'utf8');
        res.json({ success: true, content });
      } catch (error) {
        res.status(404).json({ success: false, error: error.message });
      }
    });

    // API to save file
    app.post('/api/file/:path(*)', express.json(), async (req, res) => {
      try {
        const filePath = path.join(this.projectPath, req.params.path);
        await fs.writeFile(filePath, req.body.content);
        res.json({ success: true });

        // Notify all clients
        this.io.emit('file-changed', { path: req.params.path });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // WebSocket connections
    this.io.on('connection', (socket) => {
      console.log(chalk.gray('🔗 Client connected to preview'));

      socket.on('disconnect', () => {
        console.log(chalk.gray('❌ Client disconnected'));
      });
    });

    // Start server
    await new Promise((resolve) => {
      http.listen(this.port, () => {
        resolve();
      });
    });

    this.previewServer = http;
  }

  /**
   * Watch files for changes
   */
  startFileWatcher() {
    const watchPaths = [
      path.join(this.projectPath, 'frontend/src/**/*'),
      path.join(this.projectPath, 'backend/src/**/*'),
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('change', (filePath) => {
        const relativePath = path.relative(this.projectPath, filePath);
        console.log(chalk.yellow(`📝 Changed: ${relativePath}`));

        // Notify clients
        this.io.emit('file-changed', {
          path: relativePath,
          type: 'change',
          timestamp: Date.now(),
        });
      })
      .on('add', (filePath) => {
        const relativePath = path.relative(this.projectPath, filePath);
        console.log(chalk.green(`➕ Added: ${relativePath}`));

        this.io.emit('file-changed', {
          path: relativePath,
          type: 'add',
          timestamp: Date.now(),
        });
      })
      .on('unlink', (filePath) => {
        const relativePath = path.relative(this.projectPath, filePath);
        console.log(chalk.red(`➖ Deleted: ${relativePath}`));

        this.io.emit('file-changed', {
          path: relativePath,
          type: 'delete',
          timestamp: Date.now(),
        });
      });
  }

  /**
   * Start development servers
   */
  async startDevServers() {
    const frontendDir = path.join(this.projectPath, 'frontend');
    const backendDir = path.join(this.projectPath, 'backend');

    // Start frontend if exists
    if (await fs.pathExists(frontendDir)) {
      this.frontendServer = spawn('npm', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: 'pipe',
      });

      this.frontendServer.stdout.on('data', (data) => {
        this.io.emit('frontend-log', { message: data.toString() });
      });

      this.frontendServer.stderr.on('data', (data) => {
        this.io.emit('frontend-error', { message: data.toString() });
      });
    }

    // Start backend if exists
    if (await fs.pathExists(backendDir)) {
      this.backendServer = spawn('npm', ['run', 'dev'], {
        cwd: backendDir,
        stdio: 'pipe',
      });

      this.backendServer.stdout.on('data', (data) => {
        this.io.emit('backend-log', { message: data.toString() });
      });

      this.backendServer.stderr.on('data', (data) => {
        this.io.emit('backend-error', { message: data.toString() });
      });
    }
  }

  /**
   * Get preview HTML interface
   */
  getPreviewHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TryForge Live Preview</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: #2d2d2d;
      padding: 15px 20px;
      border-bottom: 1px solid #3e3e3e;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .tabs {
      display: flex;
      gap: 10px;
    }
    .tab {
      padding: 8px 16px;
      background: #3e3e3e;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .tab:hover { background: #4e4e4e; }
    .tab.active { background: #667eea; }
    .content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #fff;
    }
    .logs {
      width: 100%;
      height: 100%;
      background: #1e1e1e;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 20px;
      overflow-y: auto;
    }
    .log-entry {
      margin-bottom: 5px;
      opacity: 0.8;
    }
    .log-error { color: #ff4444; }
    .status {
      padding: 4px 8px;
      background: #00aa00;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔥 TryForge Live Preview</div>
    <div class="tabs">
      <button class="tab active" onclick="showTab('frontend')">Frontend</button>
      <button class="tab" onclick="showTab('backend')">Backend Logs</button>
      <button class="tab" onclick="showTab('console')">Console</button>
    </div>
    <div class="status" id="status">● LIVE</div>
  </div>
  <div class="content">
    <iframe id="frontend-frame" src="http://localhost:5173" style="display: block;"></iframe>
    <div id="backend-logs" class="logs" style="display: none;"></div>
    <div id="console-logs" class="logs" style="display: none;"></div>
  </div>

  <script>
    const socket = io();
    let currentTab = 'frontend';

    function showTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');

      document.getElementById('frontend-frame').style.display = tab === 'frontend' ? 'block' : 'none';
      document.getElementById('backend-logs').style.display = tab === 'backend' ? 'block' : 'none';
      document.getElementById('console-logs').style.display = tab === 'console' ? 'block' : 'none';
    }

    socket.on('file-changed', (data) => {
      addLog('console', \`📝 File changed: \${data.path}\`);
      if (currentTab === 'frontend') {
        document.getElementById('frontend-frame').contentWindow.location.reload();
      }
    });

    socket.on('frontend-log', (data) => {
      addLog('console', data.message);
    });

    socket.on('frontend-error', (data) => {
      addLog('console', data.message, true);
    });

    socket.on('backend-log', (data) => {
      addLog('backend', data.message);
    });

    socket.on('backend-error', (data) => {
      addLog('backend', data.message, true);
    });

    function addLog(tab, message, isError = false) {
      const logs = document.getElementById(tab + '-logs');
      const entry = document.createElement('div');
      entry.className = 'log-entry' + (isError ? ' log-error' : '');
      entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      logs.appendChild(entry);
      logs.scrollTop = logs.scrollHeight;
    }

    socket.on('connect', () => {
      document.getElementById('status').textContent = '● LIVE';
      document.getElementById('status').style.background = '#00aa00';
    });

    socket.on('disconnect', () => {
      document.getElementById('status').textContent = '● OFFLINE';
      document.getElementById('status').style.background = '#aa0000';
    });
  </script>
</body>
</html>`;
  }

  /**
   * Stop live preview
   */
  async stop() {
    console.log(chalk.yellow('\n⏹️  Stopping Live Preview...\n'));

    if (this.watcher) {
      await this.watcher.close();
    }

    if (this.frontendServer) {
      this.frontendServer.kill();
    }

    if (this.backendServer) {
      this.backendServer.kill();
    }

    if (this.previewServer) {
      this.previewServer.close();
    }

    console.log(chalk.green('✅ Live Preview stopped\n'));
  }
}

module.exports = LivePreview;
