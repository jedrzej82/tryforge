/**
 * TryForge Main Index
 * Complete integrated application - all modules
 */

const TripleAI = require('./core/triple-ai');
const ProjectGenerator = require('./core/generator');
const AICodeGenerator = require('./core/ai-code-generator');
const IntelligentIDE = require('./core/intelligent-ide');
const VisualEditor = require('./core/visual-editor');
const WorkflowEngine = require('./core/workflow-engine');
const WorkflowBuilder = require('./core/workflow-builder');
const WebCrawler = require('./core/crawler');
const JobProcessor = require('./core/jobs');
const RateLimiter = require('./core/rate-limiter');
const AnalyticsEngine = require('./core/analytics');
const BigDataProcessor = require('./core/big-data');
const DataVisualization = require('./core/visualization');
const AdvancedTemplates = require('./core/advanced-templates');
const Logger = require('./utils/logger');

class TryForge {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger();
    
    // Initialize all core modules
    this.tripleAI = new TripleAI(config);
    this.generator = new ProjectGenerator(config);
    this.aiCodeGen = new AICodeGenerator(config);
    this.ide = new IntelligentIDE();
    this.visualEditor = new VisualEditor(config);
    this.workflowEngine = new WorkflowEngine(config);
    this.workflowBuilder = new WorkflowBuilder(config);
    this.crawler = new WebCrawler(config);
    this.jobs = new JobProcessor();
    this.rateLimiter = new RateLimiter(config);
    this.analytics = new AnalyticsEngine();
    this.bigData = new BigDataProcessor(config);
    this.visualization = new DataVisualization();
    this.templates = new AdvancedTemplates();
    
    this.logger.info('✅ TryForge initialized with all modules');
  }

  // Project Management
  async createProject(name, options = {}) {
    this.logger.info(`🔥 Creating project: ${name}`);
    
    if (options.template) {
      // Use advanced template
      const template = this.templates.getTemplate(options.template);
      if (!template) {
        throw new Error(`Template not found: ${options.template}`);
      }
      this.logger.info(`📋 Using template: ${template.name}`);
    }
    
    return await this.generator.create(name, options);
  }

  async refactorProject(path, options = {}) {
    this.logger.info(`🔧 Refactoring project at: ${path}`);
    return await this.generator.refactor(path, options);
  }

  async analyzeProject(path, options = {}) {
    this.logger.info(`🔍 Analyzing project at: ${path}`);
    return await this.generator.analyze(path, options);
  }

  // AI Code Generation
  async generateFromPrompt(prompt, options = {}) {
    this.logger.info(`🤖 Generating code from prompt`);
    return await this.aiCodeGen.generateFromPrompt(prompt, options);
  }

  async reviewCode(code, options = {}) {
    this.logger.info(`👁️ Reviewing code`);
    return await this.ide.reviewCode(code, options);
  }

  async debugCode(code, error, stackTrace) {
    this.logger.info(`🐛 Debugging code`);
    return await this.ide.debugCode(code, error, stackTrace);
  }

  // Visual Editor
  async startVisualEditor(projectPath, options = {}) {
    this.logger.info(`🎨 Starting Visual Editor`);
    const projectId = await this.visualEditor.loadProject(projectPath);
    await this.visualEditor.start();
    return { projectId, url: `http://localhost:${options.port || 5555}/editor` };
  }

  // Workflow Automation
  async createWorkflow(definition) {
    this.logger.info(`🔄 Creating workflow: ${definition.name}`);
    return await this.workflowEngine.createWorkflow(definition);
  }

  async executeWorkflow(workflowId, inputData = {}) {
    this.logger.info(`▶️ Executing workflow: ${workflowId}`);
    return await this.workflowEngine.executeWorkflow(workflowId, inputData);
  }

  async startWorkflowBuilder(options = {}) {
    this.logger.info(`🔄 Starting Workflow Builder`);
    await this.workflowBuilder.start();
    return { url: `http://localhost:${options.port || 5556}/workflow-builder` };
  }

  // Web Crawling
  async crawlWebsite(url, options = {}) {
    this.logger.info(`🕷️ Crawling: ${url}`);
    return await this.crawler.crawl(url, options);
  }

  async crawlMultiple(urls, options = {}) {
    this.logger.info(`🕷️ Crawling ${urls.length} URLs`);
    return await this.crawler.crawlMultiple(urls, options);
  }

  // Background Jobs
  async addJob(queueName, data, options = {}) {
    this.logger.info(`📬 Adding job to queue: ${queueName}`);
    return await this.jobs.addJob(queueName, data, options);
  }

  async processJobs(queueName, processor) {
    this.logger.info(`⚙️ Processing jobs in queue: ${queueName}`);
    return await this.jobs.processJobs(queueName, processor);
  }

  // Rate Limiting
  createRateLimiter(options = {}) {
    this.logger.info(`🚦 Creating rate limiter`);
    return this.rateLimiter.middleware(options);
  }

  // Analytics
  async trackEvent(event, data = {}) {
    this.logger.info(`📊 Tracking event: ${event}`);
    return await this.analytics.trackEvent(event, data);
  }

  async getDashboardData() {
    return await this.analytics.getDashboardData();
  }

  async getActiveUsers(timeWindow = 300) {
    return await this.analytics.getActiveUsers(timeWindow);
  }

  // Big Data Processing
  async batchInsert(table, records, options = {}) {
    this.logger.info(`💾 Batch inserting ${records.length} records`);
    return await this.bigData.batchInsert(table, records, options);
  }

  async processStream(query, processor, options = {}) {
    this.logger.info(`🌊 Processing stream`);
    return await this.bigData.processStream(query, processor, options);
  }

  async aggregate(table, aggregations, options = {}) {
    this.logger.info(`📊 Aggregating data from ${table}`);
    return await this.bigData.aggregate(table, aggregations, options);
  }

  // Data Visualization
  createChart(type, data, options = {}) {
    this.logger.info(`📈 Creating ${type} chart`);
    return this.visualization.createChartConfig(type, data, options);
  }

  generateReactChart(type, data, options = {}) {
    this.logger.info(`⚛️ Generating React chart component`);
    return this.visualization.generateReactChart(type, data, options);
  }

  createDashboard(widgets, options = {}) {
    this.logger.info(`📊 Creating dashboard`);
    return this.visualization.createDashboard(widgets, options);
  }

  // Templates
  getTemplate(templateName) {
    return this.templates.getTemplate(templateName);
  }

  listTemplates() {
    return this.templates.listTemplates();
  }

  // Utility Methods
  getSystemStatus() {
    return {
      modules: {
        tripleAI: 'active',
        generator: 'active',
        aiCodeGen: 'active',
        ide: 'active',
        visualEditor: 'active',
        workflowEngine: 'active',
        workflowBuilder: 'active',
        crawler: 'active',
        jobs: 'active',
        rateLimiter: 'active',
        analytics: 'active',
        bigData: 'active',
        visualization: 'active',
        templates: 'active'
      },
      version: '1.0.0',
      uptime: process.uptime()
    };
  }

  async healthCheck() {
    this.logger.info('🏥 Running health check');
    
    const checks = {
      tripleAI: true,
      database: false,
      redis: false,
      modules: true
    };

    // Check database connection
    try {
      await this.bigData.pool.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      this.logger.warn('Database connection failed');
    }

    // Check Redis connection
    try {
      await this.analytics.redis.ping();
      checks.redis = true;
    } catch (error) {
      this.logger.warn('Redis connection failed');
    }

    return {
      healthy: checks.modules,
      checks,
      timestamp: new Date()
    };
  }
}

// Export main class
module.exports = TryForge;

// Export individual modules for direct access
module.exports.TripleAI = TripleAI;
module.exports.ProjectGenerator = ProjectGenerator;
module.exports.AICodeGenerator = AICodeGenerator;
module.exports.IntelligentIDE = IntelligentIDE;
module.exports.VisualEditor = VisualEditor;
module.exports.WorkflowEngine = WorkflowEngine;
module.exports.WorkflowBuilder = WorkflowBuilder;
module.exports.WebCrawler = WebCrawler;
module.exports.JobProcessor = JobProcessor;
module.exports.RateLimiter = RateLimiter;
module.exports.AnalyticsEngine = AnalyticsEngine;
module.exports.BigDataProcessor = BigDataProcessor;
module.exports.DataVisualization = DataVisualization;
module.exports.AdvancedTemplates = AdvancedTemplates;
module.exports.Logger = Logger;

