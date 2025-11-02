/**
 * Visual Workflow Builder
 * Drag-and-drop workflow designer with superior UX
 */

const express = require('express');
const WorkflowEngine = require('./workflow-engine');
const Logger = require('../utils/logger');

class WorkflowBuilder {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger();
    this.port = config.port || 5556;
    this.engine = new WorkflowEngine(config);
  }

  /**
   * Start Workflow Builder server
   */
  async start() {
    const app = express();
    
    app.use(express.json());
    app.use(express.static('public'));
    
    // Serve Workflow Builder UI
    app.get('/workflow-builder', (req, res) => {
      res.send(this.getBuilderHTML());
    });
    
    // API endpoints
    app.get('/api/workflows', (req, res) => {
      const workflows = Array.from(this.engine.workflows.values());
      res.json(workflows);
    });
    
    app.post('/api/workflows', async (req, res) => {
      try {
        const workflow = await this.engine.createWorkflow(req.body);
        res.json(workflow);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    app.get('/api/workflows/:id', (req, res) => {
      const workflow = this.engine.workflows.get(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.json(workflow);
    });
    
    app.put('/api/workflows/:id', async (req, res) => {
      try {
        await this.engine.updateWorkflow(req.params.id, req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    app.delete('/api/workflows/:id', async (req, res) => {
      await this.engine.deleteWorkflow(req.params.id);
      res.json({ success: true });
    });
    
    app.post('/api/workflows/:id/execute', async (req, res) => {
      try {
        const result = await this.engine.executeWorkflow(req.params.id, req.body.data);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/workflows/:id/activate', async (req, res) => {
      try {
        await this.engine.activateWorkflow(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/workflows/:id/deactivate', async (req, res) => {
      try {
        await this.engine.deactivateWorkflow(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.get('/api/workflows/:id/executions', (req, res) => {
      const executions = this.engine.getExecutionHistory(req.params.id, {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      });
      res.json(executions);
    });
    
    app.get('/api/workflows/:id/stats', (req, res) => {
      const stats = this.engine.getWorkflowStats(req.params.id);
      res.json(stats);
    });
    
    app.get('/api/nodes', (req, res) => {
      const nodes = Array.from(this.engine.nodes.entries()).map(([type, def]) => ({
        type,
        name: def.name,
        description: def.description,
        settings: def.settings,
        inputs: def.inputs || ['input'],
        outputs: def.outputs || ['output']
      }));
      res.json(nodes);
    });
    
    const server = app.listen(this.port, () => {
      this.logger.info(`🔄 Workflow Builder running on http://localhost:${this.port}/workflow-builder`);
    });
    
    return server;
  }

  /**
   * Get Workflow Builder HTML
   */
  getBuilderHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TryForge Workflow Builder</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #0f172a;
      color: white;
    }
    
    .sidebar {
      width: 280px;
      background: #1e293b;
      padding: 20px;
      overflow-y: auto;
      border-right: 1px solid #334155;
    }
    
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .toolbar {
      background: #0f172a;
      padding: 15px 20px;
      display: flex;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    
    .canvas-container {
      flex: 1;
      background: #0f172a;
      position: relative;
      overflow: hidden;
    }
    
    .canvas {
      width: 100%;
      height: 100%;
      background: 
        linear-gradient(#1e293b 1px, transparent 1px),
        linear-gradient(90deg, #1e293b 1px, transparent 1px);
      background-size: 20px 20px;
      position: relative;
    }
    
    .properties-panel {
      width: 320px;
      background: #1e293b;
      padding: 20px;
      overflow-y: auto;
      border-left: 1px solid #334155;
    }
    
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo span { color: #f59e0b; }
    
    h2 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .node-category {
      margin-bottom: 20px;
    }
    
    .node-item {
      padding: 12px;
      background: #334155;
      margin-bottom: 8px;
      border-radius: 6px;
      cursor: move;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    
    .node-item:hover {
      background: #475569;
      border-color: #3b82f6;
      transform: translateX(2px);
    }
    
    .node-item-name {
      font-weight: 500;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .node-item-desc {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .btn:hover { background: #2563eb; }
    
    .btn-success { background: #10b981; }
    .btn-success:hover { background: #059669; }
    
    .btn-danger { background: #ef4444; }
    .btn-danger:hover { background: #dc2626; }
    
    .btn-secondary {
      background: #64748b;
    }
    .btn-secondary:hover { background: #475569; }
    
    .workflow-node {
      position: absolute;
      background: #1e293b;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 15px;
      min-width: 180px;
      cursor: move;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
    }
    
    .workflow-node.selected {
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }
    
    .node-header {
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .node-type {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .node-port {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3b82f6;
      border: 2px solid #1e293b;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .node-port:hover {
      background: #f59e0b;
      transform: scale(1.3);
    }
    
    .node-inputs {
      position: absolute;
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .node-outputs {
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .connection-line {
      position: absolute;
      pointer-events: none;
      stroke: #3b82f6;
      stroke-width: 2;
      fill: none;
    }
    
    .input-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      color: #cbd5e1;
      font-weight: 500;
    }
    
    .input, select, textarea {
      width: 100%;
      padding: 10px;
      background: #0f172a;
      border: 1px solid #334155;
      color: white;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    textarea {
      min-height: 80px;
      resize: vertical;
      font-family: 'Courier New', monospace;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    
    .stat-card {
      background: #0f172a;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #3b82f6;
    }
    
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    .execution-log {
      background: #0f172a;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #334155;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    .log-entry {
      padding: 6px 0;
      border-bottom: 1px solid #1e293b;
    }
    
    .log-timestamp {
      color: #64748b;
      margin-right: 10px;
    }
    
    .log-level-info { color: #3b82f6; }
    .log-level-success { color: #10b981; }
    .log-level-error { color: #ef4444; }
    
    .workflow-name {
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-active {
      background: #10b98120;
      color: #10b981;
    }
    
    .status-inactive {
      background: #64748b20;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="logo">🔄 Try<span>Forge</span></div>
    
    <div class="node-category">
      <h2>🎯 Triggers</h2>
      <div class="node-item" draggable="true" data-type="webhook">
        <div class="node-item-name">🌐 Webhook</div>
        <div class="node-item-desc">HTTP endpoint trigger</div>
      </div>
      <div class="node-item" draggable="true" data-type="schedule">
        <div class="node-item-name">⏰ Schedule</div>
        <div class="node-item-desc">Cron-based trigger</div>
      </div>
      <div class="node-item" draggable="true" data-type="email-trigger">
        <div class="node-item-name">📧 Email</div>
        <div class="node-item-desc">Incoming email trigger</div>
      </div>
    </div>
    
    <div class="node-category">
      <h2>⚡ Actions</h2>
      <div class="node-item" draggable="true" data-type="http-request">
        <div class="node-item-name">🌐 HTTP Request</div>
        <div class="node-item-desc">Make API calls</div>
      </div>
      <div class="node-item" draggable="true" data-type="database-query">
        <div class="node-item-name">🗄️ Database</div>
        <div class="node-item-desc">Query database</div>
      </div>
      <div class="node-item" draggable="true" data-type="send-email">
        <div class="node-item-name">✉️ Send Email</div>
        <div class="node-item-desc">Send email via SMTP</div>
      </div>
      <div class="node-item" draggable="true" data-type="ai-process">
        <div class="node-item-name">🤖 AI Process</div>
        <div class="node-item-desc">AI-powered processing</div>
      </div>
    </div>
    
    <div class="node-category">
      <h2>🔀 Logic</h2>
      <div class="node-item" draggable="true" data-type="if-condition">
        <div class="node-item-name">❓ IF Condition</div>
        <div class="node-item-desc">Conditional branch</div>
      </div>
      <div class="node-item" draggable="true" data-type="loop">
        <div class="node-item-name">🔁 Loop</div>
        <div class="node-item-desc">Iterate over data</div>
      </div>
      <div class="node-item" draggable="true" data-type="transform-data">
        <div class="node-item-name">🔄 Transform</div>
        <div class="node-item-desc">Transform data</div>
      </div>
    </div>
    
    <div class="node-category">
      <h2>🔌 Integrations</h2>
      <div class="node-item" draggable="true" data-type="slack">
        <div class="node-item-name">💬 Slack</div>
        <div class="node-item-desc">Send to Slack</div>
      </div>
      <div class="node-item" draggable="true" data-type="stripe">
        <div class="node-item-name">💳 Stripe</div>
        <div class="node-item-desc">Payment processing</div>
      </div>
      <div class="node-item" draggable="true" data-type="google-sheets">
        <div class="node-item-name">📊 Google Sheets</div>
        <div class="node-item-desc">Spreadsheet ops</div>
      </div>
    </div>
  </div>
  
  <div class="main">
    <div class="toolbar">
      <span class="workflow-name" id="workflow-name">New Workflow</span>
      <span class="status-badge status-inactive" id="status">Inactive</span>
      <button class="btn" onclick="saveWorkflow()">💾 Save</button>
      <button class="btn btn-success" onclick="activateWorkflow()">▶️ Activate</button>
      <button class="btn btn-secondary" onclick="testWorkflow()">🧪 Test</button>
      <button class="btn btn-secondary" onclick="exportWorkflow()">📤 Export</button>
    </div>
    
    <div class="canvas-container">
      <svg id="connections" style="position: absolute; width: 100%; height: 100%; pointer-events: none;"></svg>
      <div class="canvas" id="canvas"></div>
    </div>
  </div>
  
  <div class="properties-panel" id="properties">
    <h2>Workflow Properties</h2>
    
    <div class="input-group">
      <label>Workflow Name</label>
      <input class="input" value="New Workflow" id="workflow-name-input">
    </div>
    
    <div class="input-group">
      <label>Description</label>
      <textarea class="input" id="workflow-description" placeholder="Describe your workflow..."></textarea>
    </div>
    
    <h2 style="margin-top: 30px;">Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="stat-executions">0</div>
        <div class="stat-label">Executions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-success">0</div>
        <div class="stat-label">Success</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-failed">0</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-avgtime">0ms</div>
        <div class="stat-label">Avg Time</div>
      </div>
    </div>
    
    <h2 style="margin-top: 30px;">Execution Log</h2>
    <div class="execution-log" id="execution-log">
      <div class="log-entry">
        <span class="log-timestamp">00:00:00</span>
        <span class="log-level-info">Ready to execute workflow</span>
      </div>
    </div>
  </div>

  <script>
    let currentWorkflow = {
      id: null,
      name: 'New Workflow',
      nodes: [],
      connections: []
    };
    
    let selectedNode = null;
    let draggedNode = null;
    let connecting = false;
    let connectStart = null;
    
    // Initialize drag and drop
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
    });
    
    const canvas = document.getElementById('canvas');
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    
    function handleDragStart(e) {
      draggedNode = {
        type: e.target.dataset.type,
        name: e.target.querySelector('.node-item-name').textContent
      };
    }
    
    function handleDragOver(e) {
      e.preventDefault();
    }
    
    function handleDrop(e) {
      e.preventDefault();
      
      if (draggedNode) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        addNode({
          ...draggedNode,
          x,
          y,
          id: 'node_' + Date.now()
        });
        
        draggedNode = null;
      }
    }
    
    function addNode(node) {
      currentWorkflow.nodes.push(node);
      renderNode(node);
    }
    
    function renderNode(node) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'workflow-node';
      nodeEl.style.left = node.x + 'px';
      nodeEl.style.top = node.y + 'px';
      nodeEl.dataset.id = node.id;
      
      nodeEl.innerHTML = \`
        <div class="node-header">
          <span>\${node.name}</span>
          <span style="cursor: pointer;" onclick="deleteNode('\${node.id}')">❌</span>
        </div>
        <div class="node-type">\${node.type}</div>
        <div class="node-inputs">
          <div class="node-port" data-type="input" data-node="\${node.id}"></div>
        </div>
        <div class="node-outputs">
          <div class="node-port" data-type="output" data-node="\${node.id}"></div>
        </div>
      \`;
      
      canvas.appendChild(nodeEl);
      
      // Make draggable
      makeNodeDraggable(nodeEl);
    }
    
    function makeNodeDraggable(el) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      el.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
      }
      
      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    
    function deleteNode(nodeId) {
      const index = currentWorkflow.nodes.findIndex(n => n.id === nodeId);
      if (index > -1) {
        currentWorkflow.nodes.splice(index, 1);
        const el = document.querySelector(\`[data-id="\${nodeId}"]\`);
        if (el) el.remove();
      }
    }
    
    async function saveWorkflow() {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWorkflow)
      });
      
      const data = await response.json();
      currentWorkflow.id = data.id;
      alert('Workflow saved!');
    }
    
    async function activateWorkflow() {
      if (!currentWorkflow.id) {
        alert('Please save workflow first');
        return;
      }
      
      await fetch(\`/api/workflows/\${currentWorkflow.id}/activate\`, {
        method: 'POST'
      });
      
      document.getElementById('status').textContent = 'Active';
      document.getElementById('status').className = 'status-badge status-active';
      alert('Workflow activated!');
    }
    
    async function testWorkflow() {
      if (!currentWorkflow.id) {
        alert('Please save workflow first');
        return;
      }
      
      const response = await fetch(\`/api/workflows/\${currentWorkflow.id}/execute\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { test: true } })
      });
      
      const result = await response.json();
      console.log('Test result:', result);
      alert('Workflow executed! Check console for results.');
    }
    
    function exportWorkflow() {
      const json = JSON.stringify(currentWorkflow, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workflow.json';
      a.click();
    }
    
    // Update workflow name
    document.getElementById('workflow-name-input').addEventListener('input', (e) => {
      currentWorkflow.name = e.target.value;
      document.getElementById('workflow-name').textContent = e.target.value;
    });
  </script>
</body>
</html>`;
  }
}

module.exports = WorkflowBuilder;
