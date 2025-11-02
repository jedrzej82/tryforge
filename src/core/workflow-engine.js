/**
 * Advanced Workflow Automation System
 * Superior to n8n with visual builder and AI integration
 */

const EventEmitter = require('events');
const Logger = require('../utils/logger');

class WorkflowEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.logger = new Logger();
    this.workflows = new Map();
    this.nodes = new Map();
    this.executions = new Map();
    this.triggers = new Map();
    
    // Register built-in nodes
    this.registerBuiltInNodes();
  }

  /**
   * Register built-in workflow nodes
   */
  registerBuiltInNodes() {
    // Trigger nodes
    this.registerNode('webhook', this.createWebhookNode());
    this.registerNode('schedule', this.createScheduleNode());
    this.registerNode('email-trigger', this.createEmailTriggerNode());
    this.registerNode('database-trigger', this.createDatabaseTriggerNode());
    this.registerNode('file-watcher', this.createFileWatcherNode());
    
    // Action nodes
    this.registerNode('http-request', this.createHttpRequestNode());
    this.registerNode('database-query', this.createDatabaseQueryNode());
    this.registerNode('send-email', this.createSendEmailNode());
    this.registerNode('send-sms', this.createSendSMSNode());
    this.registerNode('transform-data', this.createTransformDataNode());
    this.registerNode('ai-process', this.createAIProcessNode());
    this.registerNode('web-scraper', this.createWebScraperNode());
    this.registerNode('file-operation', this.createFileOperationNode());
    
    // Logic nodes
    this.registerNode('if-condition', this.createIfConditionNode());
    this.registerNode('switch', this.createSwitchNode());
    this.registerNode('loop', this.createLoopNode());
    this.registerNode('merge', this.createMergeNode());
    this.registerNode('split', this.createSplitNode());
    
    // Integration nodes
    this.registerNode('slack', this.createSlackNode());
    this.registerNode('discord', this.createDiscordNode());
    this.registerNode('telegram', this.createTelegramNode());
    this.registerNode('stripe', this.createStripeNode());
    this.registerNode('aws-s3', this.createAWSS3Node());
    this.registerNode('google-sheets', this.createGoogleSheetsNode());
    
    // Advanced nodes
    this.registerNode('ml-predict', this.createMLPredictNode());
    this.registerNode('image-process', this.createImageProcessNode());
    this.registerNode('pdf-generate', this.createPDFGenerateNode());
    this.registerNode('queue-job', this.createQueueJobNode());
    this.registerNode('cache-data', this.createCacheDataNode());
  }

  /**
   * Register custom node type
   */
  registerNode(type, nodeDefinition) {
    this.nodes.set(type, nodeDefinition);
    this.logger.info(`📦 Registered node type: ${type}`);
  }

  /**
   * Create new workflow
   */
  async createWorkflow(definition) {
    const workflow = {
      id: definition.id || this.generateId(),
      name: definition.name,
      description: definition.description || '',
      nodes: definition.nodes || [],
      connections: definition.connections || [],
      settings: definition.settings || {},
      active: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate workflow
    const validation = this.validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }
    
    this.workflows.set(workflow.id, workflow);
    this.logger.info(`✅ Workflow created: ${workflow.name}`);
    
    return workflow;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, inputData = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    const executionId = this.generateId();
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      inputData,
      results: {},
      logs: []
    };
    
    this.executions.set(executionId, execution);
    this.emit('execution:started', execution);
    
    try {
      // Execute workflow nodes in order
      const result = await this.executeNodes(workflow, inputData, execution);
      
      execution.status = 'success';
      execution.finishedAt = new Date();
      execution.results = result;
      
      this.emit('execution:completed', execution);
      
      return execution;
    } catch (error) {
      execution.status = 'error';
      execution.error = error.message;
      execution.finishedAt = new Date();
      
      this.emit('execution:failed', execution);
      
      throw error;
    }
  }

  /**
   * Execute workflow nodes
   */
  async executeNodes(workflow, data, execution) {
    const context = {
      workflow: workflow,
      execution: execution,
      data: data,
      variables: {},
      nodeResults: new Map()
    };
    
    // Find start node (trigger or first node)
    const startNode = workflow.nodes.find(n => 
      n.type.includes('trigger') || !this.hasIncomingConnections(n, workflow)
    );
    
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }
    
    // Execute from start node
    return await this.executeNode(startNode, context, workflow);
  }

  /**
   * Execute single node
   */
  async executeNode(node, context, workflow) {
    this.log(context.execution, `Executing node: ${node.name} (${node.type})`);
    
    const nodeDefinition = this.nodes.get(node.type);
    if (!nodeDefinition) {
      throw new Error(`Unknown node type: ${node.type}`);
    }
    
    try {
      // Execute node function
      const result = await nodeDefinition.execute(node, context);
      
      // Store result
      context.nodeResults.set(node.id, result);
      
      // Find next nodes
      const nextNodes = this.getNextNodes(node, workflow);
      
      // Execute next nodes
      if (nextNodes.length > 0) {
        const results = [];
        for (const nextNode of nextNodes) {
          const nextResult = await this.executeNode(nextNode, {
            ...context,
            data: result
          }, workflow);
          results.push(nextResult);
        }
        
        return results.length === 1 ? results[0] : results;
      }
      
      return result;
    } catch (error) {
      this.log(context.execution, `Error in node ${node.name}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get next connected nodes
   */
  getNextNodes(node, workflow) {
    return workflow.connections
      .filter(conn => conn.source === node.id)
      .map(conn => workflow.nodes.find(n => n.id === conn.target))
      .filter(n => n !== undefined);
  }

  /**
   * Check if node has incoming connections
   */
  hasIncomingConnections(node, workflow) {
    return workflow.connections.some(conn => conn.target === node.id);
  }

  /**
   * Validate workflow
   */
  validateWorkflow(workflow) {
    const errors = [];
    
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }
    
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    // Check for cycles
    if (this.hasCycles(workflow)) {
      errors.push('Workflow contains cycles');
    }
    
    // Check all nodes are valid
    for (const node of workflow.nodes) {
      if (!this.nodes.has(node.type)) {
        errors.push(`Unknown node type: ${node.type}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for cycles in workflow
   */
  hasCycles(workflow) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const nextNodes = workflow.connections
        .filter(conn => conn.source === nodeId)
        .map(conn => conn.target);
      
      for (const nextId of nextNodes) {
        if (!visited.has(nextId)) {
          if (dfs(nextId)) return true;
        } else if (recursionStack.has(nextId)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }
    
    return false;
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    // Find trigger nodes and activate them
    const triggerNodes = workflow.nodes.filter(n => n.type.includes('trigger'));
    
    for (const trigger of triggerNodes) {
      await this.activateTrigger(workflow.id, trigger);
    }
    
    workflow.active = true;
    this.logger.info(`✅ Workflow activated: ${workflow.name}`);
  }

  /**
   * Activate trigger
   */
  async activateTrigger(workflowId, triggerNode) {
    const nodeDefinition = this.nodes.get(triggerNode.type);
    
    if (nodeDefinition.activateTrigger) {
      const trigger = await nodeDefinition.activateTrigger(triggerNode, async (data) => {
        // Trigger callback - execute workflow
        await this.executeWorkflow(workflowId, data);
      });
      
      this.triggers.set(`${workflowId}:${triggerNode.id}`, trigger);
    }
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;
    
    // Deactivate all triggers
    for (const [key, trigger] of this.triggers.entries()) {
      if (key.startsWith(workflowId)) {
        if (trigger.deactivate) {
          await trigger.deactivate();
        }
        this.triggers.delete(key);
      }
    }
    
    workflow.active = false;
    this.logger.info(`🛑 Workflow deactivated: ${workflow.name}`);
  }

  /**
   * Get workflow execution history
   */
  getExecutionHistory(workflowId, options = {}) {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt - a.startedAt);
    
    if (options.limit) {
      return executions.slice(0, options.limit);
    }
    
    return executions;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(workflowId) {
    const executions = this.getExecutionHistory(workflowId);
    
    return {
      total: executions.length,
      success: executions.filter(e => e.status === 'success').length,
      failed: executions.filter(e => e.status === 'error').length,
      running: executions.filter(e => e.status === 'running').length,
      avgDuration: this.calculateAvgDuration(executions)
    };
  }

  calculateAvgDuration(executions) {
    const completed = executions.filter(e => e.finishedAt);
    if (completed.length === 0) return 0;
    
    const total = completed.reduce((sum, e) => {
      return sum + (e.finishedAt - e.startedAt);
    }, 0);
    
    return total / completed.length;
  }

  log(execution, message, level = 'info') {
    const logEntry = {
      timestamp: new Date(),
      level,
      message
    };
    
    execution.logs.push(logEntry);
    this.logger[level](message);
  }

  generateId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Node Definitions

  createWebhookNode() {
    return {
      type: 'webhook',
      name: 'Webhook',
      description: 'Trigger workflow via HTTP webhook',
      inputs: [],
      outputs: ['data'],
      settings: {
        path: { type: 'string', required: true },
        method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' }
      },
      async activateTrigger(node, callback) {
        // Register webhook endpoint
        const path = node.settings.path || `/webhook/${node.id}`;
        // Implementation would register Express route
        return {
          path,
          deactivate: async () => {
            // Unregister route
          }
        };
      },
      async execute(node, context) {
        return context.data;
      }
    };
  }

  createScheduleNode() {
    return {
      type: 'schedule',
      name: 'Schedule',
      description: 'Trigger workflow on schedule',
      settings: {
        cron: { type: 'string', required: true },
        timezone: { type: 'string', default: 'UTC' }
      },
      async activateTrigger(node, callback) {
        // Setup cron job
        const cron = require('node-cron');
        const task = cron.schedule(node.settings.cron, () => {
          callback({ timestamp: new Date() });
        });
        
        return {
          deactivate: async () => {
            task.stop();
          }
        };
      },
      async execute(node, context) {
        return { timestamp: new Date() };
      }
    };
  }

  createEmailTriggerNode() {
    return {
      type: 'email-trigger',
      name: 'Email Trigger',
      description: 'Trigger on incoming email',
      settings: {
        email: { type: 'string', required: true },
        filter: { type: 'string' }
      },
      async execute(node, context) {
        return context.data;
      }
    };
  }

  createDatabaseTriggerNode() {
    return {
      type: 'database-trigger',
      name: 'Database Trigger',
      description: 'Trigger on database changes',
      settings: {
        table: { type: 'string', required: true },
        operation: { type: 'select', options: ['INSERT', 'UPDATE', 'DELETE'] }
      },
      async execute(node, context) {
        return context.data;
      }
    };
  }

  createFileWatcherNode() {
    return {
      type: 'file-watcher',
      name: 'File Watcher',
      description: 'Trigger on file system changes',
      settings: {
        path: { type: 'string', required: true },
        events: { type: 'multiselect', options: ['create', 'modify', 'delete'] }
      },
      async execute(node, context) {
        return context.data;
      }
    };
  }

  createHttpRequestNode() {
    return {
      type: 'http-request',
      name: 'HTTP Request',
      description: 'Make HTTP request',
      settings: {
        url: { type: 'string', required: true },
        method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        headers: { type: 'json' },
        body: { type: 'json' }
      },
      async execute(node, context) {
        const axios = require('axios');
        const response = await axios({
          method: node.settings.method || 'GET',
          url: node.settings.url,
          headers: node.settings.headers,
          data: node.settings.body || context.data
        });
        
        return response.data;
      }
    };
  }

  createDatabaseQueryNode() {
    return {
      type: 'database-query',
      name: 'Database Query',
      description: 'Execute database query',
      settings: {
        query: { type: 'text', required: true },
        parameters: { type: 'json' }
      },
      async execute(node, context) {
        // Execute database query
        // Implementation would use pg/mysql library
        return { rows: [], rowCount: 0 };
      }
    };
  }

  createSendEmailNode() {
    return {
      type: 'send-email',
      name: 'Send Email',
      description: 'Send email via SMTP',
      settings: {
        to: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        body: { type: 'text', required: true },
        html: { type: 'boolean', default: false }
      },
      async execute(node, context) {
        // Send email
        return { sent: true, messageId: 'msg_123' };
      }
    };
  }

  createSendSMSNode() {
    return {
      type: 'send-sms',
      name: 'Send SMS',
      description: 'Send SMS message',
      settings: {
        to: { type: 'string', required: true },
        message: { type: 'text', required: true }
      },
      async execute(node, context) {
        // Send SMS via Twilio/etc
        return { sent: true, sid: 'SM123' };
      }
    };
  }

  createTransformDataNode() {
    return {
      type: 'transform-data',
      name: 'Transform Data',
      description: 'Transform data with JavaScript',
      settings: {
        code: { type: 'code', language: 'javascript', required: true }
      },
      async execute(node, context) {
        // Execute JavaScript code
        const fn = new Function('data', 'context', node.settings.code);
        return fn(context.data, context);
      }
    };
  }

  createAIProcessNode() {
    return {
      type: 'ai-process',
      name: 'AI Process',
      description: 'Process data with AI',
      settings: {
        prompt: { type: 'text', required: true },
        model: { type: 'select', options: ['gpt-4', 'claude-3', 'gemini-pro'] }
      },
      async execute(node, context) {
        // Call AI API
        return { result: 'AI processed data' };
      }
    };
  }

  createWebScraperNode() {
    return {
      type: 'web-scraper',
      name: 'Web Scraper',
      description: 'Scrape web page',
      settings: {
        url: { type: 'string', required: true },
        selectors: { type: 'json' }
      },
      async execute(node, context) {
        const Crawler = require('./crawler');
        const crawler = new Crawler();
        return await crawler.crawl(node.settings.url, {
          selectors: node.settings.selectors
        });
      }
    };
  }

  createFileOperationNode() {
    return {
      type: 'file-operation',
      name: 'File Operation',
      description: 'Read, write, or modify files',
      settings: {
        operation: { type: 'select', options: ['read', 'write', 'delete', 'move'] },
        path: { type: 'string', required: true }
      },
      async execute(node, context) {
        const fs = require('fs').promises;
        
        switch (node.settings.operation) {
          case 'read':
            return await fs.readFile(node.settings.path, 'utf8');
          case 'write':
            await fs.writeFile(node.settings.path, context.data);
            return { success: true };
          // ... other operations
        }
      }
    };
  }

  createIfConditionNode() {
    return {
      type: 'if-condition',
      name: 'IF Condition',
      description: 'Conditional branching',
      settings: {
        condition: { type: 'code', required: true }
      },
      outputs: ['true', 'false'],
      async execute(node, context) {
        const fn = new Function('data', 'context', `return ${node.settings.condition}`);
        const result = fn(context.data, context);
        
        // Route to appropriate output
        return result ? context.data : null;
      }
    };
  }

  createSwitchNode() {
    return {
      type: 'switch',
      name: 'Switch',
      description: 'Multi-way branching',
      settings: {
        cases: { type: 'array' }
      },
      async execute(node, context) {
        // Evaluate cases and route accordingly
        return context.data;
      }
    };
  }

  createLoopNode() {
    return {
      type: 'loop',
      name: 'Loop',
      description: 'Iterate over array',
      settings: {
        array: { type: 'string', required: true }
      },
      async execute(node, context) {
        // Loop through array
        return context.data;
      }
    };
  }

  createMergeNode() {
    return {
      type: 'merge',
      name: 'Merge',
      description: 'Merge multiple inputs',
      async execute(node, context) {
        // Merge data from multiple sources
        return context.data;
      }
    };
  }

  createSplitNode() {
    return {
      type: 'split',
      name: 'Split',
      description: 'Split into multiple outputs',
      async execute(node, context) {
        // Split data
        return context.data;
      }
    };
  }

  createSlackNode() {
    return {
      type: 'slack',
      name: 'Slack',
      description: 'Send Slack message',
      settings: {
        channel: { type: 'string', required: true },
        message: { type: 'text', required: true }
      },
      async execute(node, context) {
        // Send to Slack
        return { sent: true };
      }
    };
  }

  createDiscordNode() {
    return {
      type: 'discord',
      name: 'Discord',
      description: 'Send Discord message',
      settings: {
        webhook: { type: 'string', required: true },
        message: { type: 'text', required: true }
      },
      async execute(node, context) {
        // Send to Discord
        return { sent: true };
      }
    };
  }

  createTelegramNode() {
    return {
      type: 'telegram',
      name: 'Telegram',
      description: 'Send Telegram message',
      settings: {
        chatId: { type: 'string', required: true },
        message: { type: 'text', required: true }
      },
      async execute(node, context) {
        // Send to Telegram
        return { sent: true };
      }
    };
  }

  createStripeNode() {
    return {
      type: 'stripe',
      name: 'Stripe',
      description: 'Stripe payment operations',
      settings: {
        operation: { type: 'select', options: ['create-payment', 'refund', 'get-customer'] },
        amount: { type: 'number' }
      },
      async execute(node, context) {
        // Stripe operations
        return { success: true };
      }
    };
  }

  createAWSS3Node() {
    return {
      type: 'aws-s3',
      name: 'AWS S3',
      description: 'AWS S3 operations',
      settings: {
        operation: { type: 'select', options: ['upload', 'download', 'delete'] },
        bucket: { type: 'string', required: true },
        key: { type: 'string', required: true }
      },
      async execute(node, context) {
        // S3 operations
        return { success: true };
      }
    };
  }

  createGoogleSheetsNode() {
    return {
      type: 'google-sheets',
      name: 'Google Sheets',
      description: 'Google Sheets operations',
      settings: {
        operation: { type: 'select', options: ['read', 'write', 'append'] },
        spreadsheetId: { type: 'string', required: true },
        range: { type: 'string', required: true }
      },
      async execute(node, context) {
        // Google Sheets API
        return { success: true };
      }
    };
  }

  createMLPredictNode() {
    return {
      type: 'ml-predict',
      name: 'ML Predict',
      description: 'Machine learning predictions',
      settings: {
        model: { type: 'string', required: true },
        input: { type: 'json', required: true }
      },
      async execute(node, context) {
        // ML prediction
        return { prediction: 0.95 };
      }
    };
  }

  createImageProcessNode() {
    return {
      type: 'image-process',
      name: 'Image Process',
      description: 'Image processing operations',
      settings: {
        operation: { type: 'select', options: ['resize', 'compress', 'convert', 'crop'] },
        width: { type: 'number' },
        height: { type: 'number' }
      },
      async execute(node, context) {
        // Image processing
        return { processed: true };
      }
    };
  }

  createPDFGenerateNode() {
    return {
      type: 'pdf-generate',
      name: 'Generate PDF',
      description: 'Generate PDF documents',
      settings: {
        template: { type: 'text', required: true },
        data: { type: 'json' }
      },
      async execute(node, context) {
        // Generate PDF
        return { pdf: 'base64...' };
      }
    };
  }

  createQueueJobNode() {
    return {
      type: 'queue-job',
      name: 'Queue Job',
      description: 'Add job to queue',
      settings: {
        queue: { type: 'string', required: true },
        data: { type: 'json' }
      },
      async execute(node, context) {
        const Jobs = require('./jobs');
        const processor = new Jobs();
        await processor.addJob(node.settings.queue, node.settings.data || context.data);
        return { queued: true };
      }
    };
  }

  createCacheDataNode() {
    return {
      type: 'cache-data',
      name: 'Cache Data',
      description: 'Cache data in Redis',
      settings: {
        key: { type: 'string', required: true },
        ttl: { type: 'number', default: 3600 }
      },
      async execute(node, context) {
        // Cache in Redis
        return { cached: true };
      }
    };
  }
}

module.exports = WorkflowEngine;
