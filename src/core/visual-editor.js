/**
 * Visual Editor - Professional GUI for TryForge
 * Full editing capabilities for colors, text, and individual elements
 */

const express = require('express');
const WebSocket = require('ws');
const Logger = require('../utils/logger');

class VisualEditor {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger();
    this.port = config.port || 5555;
    this.projects = new Map();
    this.activeSessions = new Map();
  }

  /**
   * Start Visual Editor server
   */
  async start() {
    const app = express();
    
    // Middleware
    app.use(express.json());
    app.use(express.static('public'));
    
    // Serve Visual Editor UI
    app.get('/editor', (req, res) => {
      res.send(this.getEditorHTML());
    });
    
    // API endpoints
    app.get('/api/projects', (req, res) => {
      res.json(Array.from(this.projects.values()));
    });
    
    app.get('/api/projects/:id', (req, res) => {
      const project = this.projects.get(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    });
    
    app.post('/api/projects/:id/elements/:elementId', (req, res) => {
      this.updateElement(req.params.id, req.params.elementId, req.body);
      res.json({ success: true });
    });
    
    app.post('/api/projects/:id/colors', (req, res) => {
      this.updateColors(req.params.id, req.body);
      res.json({ success: true });
    });
    
    app.post('/api/projects/:id/preview', (req, res) => {
      const preview = this.generatePreview(req.params.id);
      res.json({ preview });
    });
    
    app.post('/api/projects/:id/export', (req, res) => {
      const code = this.exportCode(req.params.id);
      res.json({ code });
    });
    
    // Start HTTP server
    const server = app.listen(this.port, () => {
      this.logger.info(`🎨 Visual Editor running on http://localhost:${this.port}/editor`);
    });
    
    // WebSocket for real-time updates
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
      this.handleWebSocketConnection(ws);
    });
    
    return server;
  }

  /**
   * Load project into editor
   */
  async loadProject(projectPath) {
    const projectId = Date.now().toString();
    const project = {
      id: projectId,
      path: projectPath,
      elements: await this.extractElements(projectPath),
      colors: await this.extractColors(projectPath),
      texts: await this.extractTexts(projectPath),
      styles: await this.extractStyles(projectPath),
      components: await this.extractComponents(projectPath)
    };
    
    this.projects.set(projectId, project);
    this.logger.info(`📂 Project loaded: ${projectId}`);
    
    return projectId;
  }

  /**
   * Extract all editable elements from project
   */
  async extractElements(projectPath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const elements = [];
    const files = await this.getProjectFiles(projectPath);
    
    for (const file of files) {
      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        const content = await fs.readFile(path.join(projectPath, file), 'utf8');
        const fileElements = this.parseReactComponents(content, file);
        elements.push(...fileElements);
      }
    }
    
    return elements;
  }

  /**
   * Parse React components to extract editable elements
   */
  parseReactComponents(content, filename) {
    const elements = [];
    let elementId = 0;
    
    // Extract JSX elements
    const jsxRegex = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;
    let match;
    
    while ((match = jsxRegex.exec(content)) !== null) {
      const [fullMatch, tag, attributes, children] = match;
      
      elements.push({
        id: `${filename}-${elementId++}`,
        type: tag.toLowerCase(),
        tag: tag,
        attributes: this.parseAttributes(attributes),
        content: children.trim(),
        file: filename,
        position: match.index,
        editable: {
          text: true,
          color: true,
          background: true,
          border: true,
          spacing: true,
          size: true,
          position: true
        }
      });
    }
    
    return elements;
  }

  /**
   * Parse HTML/JSX attributes
   */
  parseAttributes(attrString) {
    const attrs = {};
    const attrRegex = /(\w+)=["']([^"']*)["']|(\w+)={([^}]*)}/g;
    let match;
    
    while ((match = attrRegex.exec(attrString)) !== null) {
      const name = match[1] || match[3];
      const value = match[2] || match[4];
      attrs[name] = value;
    }
    
    return attrs;
  }

  /**
   * Extract color scheme from project
   */
  async extractColors(projectPath) {
    const colors = {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
      custom: []
    };
    
    // Extract from CSS/Tailwind config
    const files = await this.getProjectFiles(projectPath);
    for (const file of files) {
      if (file.includes('tailwind.config') || file.endsWith('.css')) {
        const content = await require('fs').promises.readFile(
          require('path').join(projectPath, file), 
          'utf8'
        );
        const extracted = this.extractColorsFromCSS(content);
        Object.assign(colors, extracted);
      }
    }
    
    return colors;
  }

  extractColorsFromCSS(css) {
    const colors = {};
    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const matches = css.match(colorRegex) || [];
    
    matches.forEach((color, i) => {
      colors[`color-${i}`] = color;
    });
    
    return colors;
  }

  /**
   * Extract all text content
   */
  async extractTexts(projectPath) {
    const texts = [];
    const files = await this.getProjectFiles(projectPath);
    
    for (const file of files) {
      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        const content = await require('fs').promises.readFile(
          require('path').join(projectPath, file),
          'utf8'
        );
        
        // Extract text between JSX tags
        const textRegex = />([^<>{}]+)</g;
        let match;
        
        while ((match = textRegex.exec(content)) !== null) {
          const text = match[1].trim();
          if (text && text.length > 0) {
            texts.push({
              id: `text-${texts.length}`,
              content: text,
              file: file,
              position: match.index
            });
          }
        }
      }
    }
    
    return texts;
  }

  /**
   * Extract styles
   */
  async extractStyles(projectPath) {
    const styles = {
      typography: {},
      spacing: {},
      borders: {},
      shadows: {},
      custom: {}
    };
    
    // Extract from CSS/style files
    const files = await this.getProjectFiles(projectPath);
    for (const file of files) {
      if (file.endsWith('.css') || file.endsWith('.scss')) {
        const content = await require('fs').promises.readFile(
          require('path').join(projectPath, file),
          'utf8'
        );
        Object.assign(styles, this.parseStylesheet(content));
      }
    }
    
    return styles;
  }

  parseStylesheet(css) {
    const styles = {};
    // Parse CSS rules
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      styles[selector] = this.parseDeclarations(declarations);
    }
    
    return styles;
  }

  parseDeclarations(declarations) {
    const props = {};
    const declRegex = /([^:;]+):([^;]+);?/g;
    let match;
    
    while ((match = declRegex.exec(declarations)) !== null) {
      const prop = match[1].trim();
      const value = match[2].trim();
      props[prop] = value;
    }
    
    return props;
  }

  /**
   * Extract React components
   */
  async extractComponents(projectPath) {
    const components = [];
    const files = await this.getProjectFiles(projectPath);
    
    for (const file of files) {
      if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        const content = await require('fs').promises.readFile(
          require('path').join(projectPath, file),
          'utf8'
        );
        
        // Extract component definitions
        const componentRegex = /(?:export\s+)?(?:default\s+)?(?:function|const)\s+(\w+)/g;
        let match;
        
        while ((match = componentRegex.exec(content)) !== null) {
          components.push({
            name: match[1],
            file: file,
            type: 'component'
          });
        }
      }
    }
    
    return components;
  }

  /**
   * Update element properties
   */
  updateElement(projectId, elementId, updates) {
    const project = this.projects.get(projectId);
    if (!project) return;
    
    const element = project.elements.find(e => e.id === elementId);
    if (!element) return;
    
    // Update element properties
    Object.assign(element, updates);
    
    // Broadcast update to connected clients
    this.broadcastUpdate(projectId, 'element', { elementId, updates });
    
    this.logger.info(`✏️ Element updated: ${elementId}`);
  }

  /**
   * Update project colors
   */
  updateColors(projectId, colors) {
    const project = this.projects.get(projectId);
    if (!project) return;
    
    Object.assign(project.colors, colors);
    
    // Apply colors to all elements
    this.applyColorScheme(projectId, colors);
    
    this.broadcastUpdate(projectId, 'colors', colors);
    
    this.logger.info(`🎨 Colors updated for project: ${projectId}`);
  }

  /**
   * Apply color scheme to project
   */
  applyColorScheme(projectId, colors) {
    const project = this.projects.get(projectId);
    if (!project) return;
    
    // Update elements with new colors
    project.elements.forEach(element => {
      if (element.attributes.style) {
        // Update inline styles
        Object.keys(colors).forEach(key => {
          if (element.attributes.style.includes(key)) {
            element.attributes.style = element.attributes.style.replace(
              new RegExp(project.colors[key], 'g'),
              colors[key]
            );
          }
        });
      }
    });
  }

  /**
   * Generate live preview
   */
  generatePreview(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return '';
    
    let html = '<!DOCTYPE html><html><head><style>';
    
    // Add styles
    html += `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: system-ui, -apple-system, sans-serif;
        background: ${project.colors.background};
        color: ${project.colors.text};
      }
    `;
    
    Object.entries(project.styles).forEach(([selector, props]) => {
      html += `${selector} {`;
      Object.entries(props).forEach(([prop, value]) => {
        html += `${prop}: ${value};`;
      });
      html += `}`;
    });
    
    html += '</style></head><body>';
    
    // Add elements
    project.elements.forEach(element => {
      html += this.elementToHTML(element);
    });
    
    html += '</body></html>';
    
    return html;
  }

  elementToHTML(element) {
    let html = `<${element.tag}`;
    
    // Add attributes
    Object.entries(element.attributes).forEach(([key, value]) => {
      if (key !== 'style') {
        html += ` ${key}="${value}"`;
      }
    });
    
    // Add inline style
    if (element.attributes.style) {
      html += ` style="${element.attributes.style}"`;
    }
    
    html += `>${element.content}</${element.tag}>`;
    
    return html;
  }

  /**
   * Export edited code
   */
  exportCode(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    const code = {
      components: {},
      styles: {},
      colors: project.colors
    };
    
    // Group elements by file
    const fileMap = new Map();
    project.elements.forEach(element => {
      if (!fileMap.has(element.file)) {
        fileMap.set(element.file, []);
      }
      fileMap.get(element.file).push(element);
    });
    
    // Generate code for each file
    fileMap.forEach((elements, file) => {
      code.components[file] = this.generateComponentCode(elements);
    });
    
    return code;
  }

  generateComponentCode(elements) {
    let code = "import React from 'react';\n\n";
    
    elements.forEach(element => {
      code += `// ${element.id}\n`;
      code += this.elementToJSX(element);
      code += '\n\n';
    });
    
    return code;
  }

  elementToJSX(element) {
    let jsx = `<${element.tag}`;
    
    Object.entries(element.attributes).forEach(([key, value]) => {
      jsx += ` ${key}="${value}"`;
    });
    
    jsx += `>\n  ${element.content}\n</${element.tag}>`;
    
    return jsx;
  }

  /**
   * WebSocket handling for real-time updates
   */
  handleWebSocketConnection(ws) {
    const sessionId = Date.now().toString();
    this.activeSessions.set(sessionId, ws);
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleWebSocketMessage(sessionId, message);
    });
    
    ws.on('close', () => {
      this.activeSessions.delete(sessionId);
    });
    
    ws.send(JSON.stringify({ type: 'connected', sessionId }));
  }

  handleWebSocketMessage(sessionId, message) {
    const { type, projectId, data } = message;
    
    switch (type) {
      case 'subscribe':
        // Subscribe to project updates
        break;
      case 'update':
        // Handle real-time update
        this.handleRealtimeUpdate(projectId, data);
        break;
      case 'preview':
        // Generate and send preview
        const preview = this.generatePreview(projectId);
        this.sendToSession(sessionId, { type: 'preview', preview });
        break;
    }
  }

  broadcastUpdate(projectId, type, data) {
    const message = JSON.stringify({ type, projectId, data });
    
    this.activeSessions.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  sendToSession(sessionId, data) {
    const ws = this.activeSessions.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  handleRealtimeUpdate(projectId, data) {
    // Handle real-time collaborative editing
    this.broadcastUpdate(projectId, 'update', data);
  }

  async getProjectFiles(projectPath) {
    const fs = require('fs').promises;
    const path = require('path');
    const files = [];
    
    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(path.relative(projectPath, fullPath));
        }
      }
    }
    
    await walk(projectPath);
    return files;
  }

  /**
   * Get Visual Editor HTML
   */
  getEditorHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TryForge Visual Editor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .sidebar {
      width: 300px;
      background: #1e293b;
      color: white;
      padding: 20px;
      overflow-y: auto;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      background: #0f172a;
      color: white;
      padding: 15px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .canvas {
      flex: 1;
      background: #f1f5f9;
      position: relative;
      overflow: auto;
    }
    .properties {
      width: 350px;
      background: #1e293b;
      color: white;
      padding: 20px;
      overflow-y: auto;
    }
    .btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn:hover { background: #2563eb; }
    h2 { margin-bottom: 15px; font-size: 16px; }
    .section { margin-bottom: 25px; }
    .element-item {
      padding: 10px;
      background: #334155;
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
    }
    .element-item:hover { background: #475569; }
    .color-picker {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .input {
      width: 100%;
      padding: 8px;
      background: #334155;
      border: 1px solid #475569;
      color: white;
      border-radius: 4px;
      margin-top: 5px;
    }
    label {
      display: block;
      margin-top: 15px;
      font-size: 14px;
      color: #94a3b8;
    }
    .preview-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .logo span { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="logo">🔥 Try<span>Forge</span></div>
    <h2>Elements</h2>
    <div id="elements"></div>
  </div>
  
  <div class="main">
    <div class="toolbar">
      <button class="btn" onclick="saveProject()">💾 Save</button>
      <button class="btn" onclick="exportCode()">📤 Export</button>
      <button class="btn" onclick="preview()">👁️ Preview</button>
      <button class="btn" onclick="undo()">↶ Undo</button>
      <button class="btn" onclick="redo()">↷ Redo</button>
    </div>
    <div class="canvas">
      <iframe id="preview" class="preview-frame"></iframe>
    </div>
  </div>
  
  <div class="properties">
    <h2>Properties</h2>
    <div id="properties-panel">
      <p style="color: #94a3b8;">Select an element to edit</p>
    </div>
  </div>

  <script>
    let currentProject = null;
    let selectedElement = null;
    let ws = null;

    // Initialize WebSocket
    function initWebSocket() {
      ws = new WebSocket('ws://localhost:5555');
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };
    }

    function handleWebSocketMessage(message) {
      console.log('WebSocket:', message);
      if (message.type === 'preview') {
        document.getElementById('preview').srcdoc = message.preview;
      }
    }

    // Load project
    async function loadProject(projectId) {
      const res = await fetch(\`/api/projects/\${projectId}\`);
      currentProject = await res.json();
      renderElements();
      preview();
    }

    function renderElements() {
      const container = document.getElementById('elements');
      container.innerHTML = '';
      
      currentProject.elements.forEach(el => {
        const div = document.createElement('div');
        div.className = 'element-item';
        div.textContent = \`<\${el.tag}> - \${el.id}\`;
        div.onclick = () => selectElement(el);
        container.appendChild(div);
      });
    }

    function selectElement(element) {
      selectedElement = element;
      renderProperties();
    }

    function renderProperties() {
      const panel = document.getElementById('properties-panel');
      panel.innerHTML = \`
        <label>Element Type</label>
        <input class="input" value="\${selectedElement.tag}" readonly>
        
        <label>Text Content</label>
        <input class="input" value="\${selectedElement.content}" 
               onchange="updateElement('content', this.value)">
        
        <label>Background Color</label>
        <input type="color" class="color-picker" 
               value="#3b82f6" 
               onchange="updateElement('backgroundColor', this.value)">
        
        <label>Text Color</label>
        <input type="color" class="color-picker" 
               value="#1f2937" 
               onchange="updateElement('color', this.value)">
        
        <label>Font Size</label>
        <input class="input" placeholder="16px" 
               onchange="updateElement('fontSize', this.value)">
        
        <label>Padding</label>
        <input class="input" placeholder="10px" 
               onchange="updateElement('padding', this.value)">
        
        <label>Margin</label>
        <input class="input" placeholder="10px" 
               onchange="updateElement('margin', this.value)">
        
        <label>Border</label>
        <input class="input" placeholder="1px solid #ccc" 
               onchange="updateElement('border', this.value)">
      \`;
    }

    async function updateElement(property, value) {
      if (!selectedElement) return;
      
      await fetch(\`/api/projects/\${currentProject.id}/elements/\${selectedElement.id}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [property]: value })
      });
      
      preview();
    }

    async function preview() {
      if (!currentProject) return;
      
      const res = await fetch(\`/api/projects/\${currentProject.id}/preview\`, {
        method: 'POST'
      });
      const data = await res.json();
      document.getElementById('preview').srcdoc = data.preview;
    }

    async function exportCode() {
      if (!currentProject) return;
      
      const res = await fetch(\`/api/projects/\${currentProject.id}/export\`, {
        method: 'POST'
      });
      const data = await res.json();
      console.log('Exported code:', data.code);
      alert('Code exported! Check console for details.');
    }

    function saveProject() {
      alert('Project saved!');
    }

    function undo() {
      alert('Undo');
    }

    function redo() {
      alert('Redo');
    }

    // Initialize
    initWebSocket();
    
    // Load first project if available
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        if (projects.length > 0) {
          loadProject(projects[0].id);
        }
      });
  </script>
</body>
</html>`;
  }
}

module.exports = VisualEditor;
