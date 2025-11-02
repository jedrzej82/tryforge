/**
 * TryForge Main Index
 * Core exports and initialization
 */

const TripleAI = require('./core/triple-ai');
const ProjectGenerator = require('./core/generator');
const Logger = require('./utils/logger');

class TryForge {
  constructor(config = {}) {
    this.config = config;
    this.tripleAI = new TripleAI(config);
    this.generator = new ProjectGenerator(config);
    this.logger = new Logger();
  }

  async createProject(name, options = {}) {
    this.logger.info(`Creating project: ${name}`);
    return await this.generator.create(name, options);
  }

  async refactorProject(path, options = {}) {
    this.logger.info(`Refactoring project at: ${path}`);
    return await this.generator.refactor(path, options);
  }

  async analyzeProject(path, options = {}) {
    this.logger.info(`Analyzing project at: ${path}`);
    return await this.generator.analyze(path, options);
  }
}

module.exports = TryForge;
module.exports.TripleAI = TripleAI;
module.exports.ProjectGenerator = ProjectGenerator;
