/**
 * Alert Manager
 * Manages database monitoring alerts with configurable rules and notifications
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      alertPath: options.alertPath || path.join(process.cwd(), 'logs', 'alerts'),
      checkInterval: options.checkInterval || 60000, // 1 minute
      cooldownPeriod: options.cooldownPeriod || 300000, // 5 minutes
      enableNotifications: options.enableNotifications !== false,
      notificationChannels: options.notificationChannels || ['log'],
    };

    this.rules = [];
    this.alertHistory = [];
    this.activeAlerts = new Map();
    this.cooldowns = new Map();
    this.checkInterval = null;
    this.isRunning = false;

    this.initializeAlertDirectory();
  }

  /**
   * Initialize alert directory
   */
  async initializeAlertDirectory() {
    try {
      await fs.ensureDir(this.options.alertPath);
    } catch (error) {
      console.error('Failed to create alert directory:', error.message);
    }
  }

  /**
   * Add an alert rule
   * @param {Object} rule - Alert rule configuration
   */
  addRule(rule) {
    const ruleWithDefaults = {
      id: rule.id || this.generateRuleId(),
      name: rule.name,
      condition: rule.condition, // Function that returns boolean
      message: rule.message,
      severity: rule.severity || 'warning', // info, warning, critical
      threshold: rule.threshold,
      action: rule.action || ['log'],
      enabled: rule.enabled !== false,
      metadata: rule.metadata || {},
    };

    // Validate rule
    if (!ruleWithDefaults.name) {
      throw new Error('Rule name is required');
    }
    if (!ruleWithDefaults.condition) {
      throw new Error('Rule condition is required');
    }

    this.rules.push(ruleWithDefaults);
    return ruleWithDefaults.id;
  }

  /**
   * Remove an alert rule
   * @param {string} ruleId - Rule ID
   */
  removeRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update an alert rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Rule updates
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * Enable a rule
   * @param {string} ruleId - Rule ID
   */
  enableRule(ruleId) {
    return this.updateRule(ruleId, { enabled: true });
  }

  /**
   * Disable a rule
   * @param {string} ruleId - Rule ID
   */
  disableRule(ruleId) {
    return this.updateRule(ruleId, { enabled: false });
  }

  /**
   * Start checking rules
   * @param {Object} context - Context object for rule evaluation
   */
  startChecking(context) {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.context = context;

    // Check immediately
    this.checkRules(context).catch(err =>
      console.error('Initial rule check failed:', err)
    );

    // Set up periodic checks
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkRules(context);
      } catch (error) {
        console.error('Rule check failed:', error.message);
      }
    }, this.options.checkInterval);

    this.emit('checking-started');
  }

  /**
   * Stop checking rules
   */
  stopChecking() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.emit('checking-stopped');
  }

  /**
   * Check all rules
   * @param {Object} context - Context for rule evaluation
   */
  async checkRules(context) {
    const results = [];

    for (const rule of this.rules) {
      if (!rule.enabled) {
        continue;
      }

      // Check cooldown
      if (this.isInCooldown(rule.id)) {
        continue;
      }

      try {
        const triggered = await this.evaluateRule(rule, context);

        if (triggered) {
          results.push({
            rule,
            triggered: true,
          });

          await this.triggerAlert(rule, context);
        } else {
          // Clear active alert if it was triggered before
          this.clearActiveAlert(rule.id);
        }
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.name}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule
   * @param {Object} rule - Alert rule
   * @param {Object} context - Context for evaluation
   * @returns {boolean} Whether rule is triggered
   */
  async evaluateRule(rule, context) {
    try {
      // Rule condition can be a function or a string expression
      if (typeof rule.condition === 'function') {
        return await rule.condition(context);
      } else if (typeof rule.condition === 'string') {
        // Simple expression evaluation
        return this.evaluateExpression(rule.condition, context);
      }

      return false;
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error.message);
      return false;
    }
  }

  /**
   * Evaluate a simple expression
   * @param {string} expression - Expression to evaluate
   * @param {Object} context - Context object
   * @returns {boolean} Evaluation result
   */
  evaluateExpression(expression, context) {
    // Simple expression parser for basic conditions
    // Examples: "connections > 80", "cpu_usage > 90"

    const operators = {
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
      '==': (a, b) => a == b,
      '===': (a, b) => a === b,
      '!=': (a, b) => a != b,
      '!==': (a, b) => a !== b,
    };

    // Parse expression
    let operator = null;
    let operatorMatch = null;

    for (const [op, fn] of Object.entries(operators)) {
      if (expression.includes(op)) {
        operator = op;
        operatorMatch = fn;
        break;
      }
    }

    if (!operator) {
      throw new Error(`Invalid expression: ${expression}`);
    }

    const [leftStr, rightStr] = expression.split(operator).map(s => s.trim());

    // Get left value from context
    const leftValue = this.getNestedValue(context, leftStr);

    // Parse right value
    const rightValue = isNaN(rightStr) ? rightStr.replace(/['"]/g, '') : parseFloat(rightStr);

    return operatorMatch(leftValue, rightValue);
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to query
   * @param {string} path - Dot-notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Trigger an alert
   * @param {Object} rule - Alert rule
   * @param {Object} context - Context data
   */
  async triggerAlert(rule, context) {
    const alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: typeof rule.message === 'function' ? rule.message(context) : rule.message,
      context: this.sanitizeContext(context),
      timestamp: new Date(),
    };

    // Add to active alerts
    this.activeAlerts.set(rule.id, alert);

    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }

    // Set cooldown
    this.setCooldown(rule.id);

    // Persist alert
    await this.persistAlert(alert);

    // Execute actions
    await this.executeActions(rule, alert);

    // Emit event
    this.emit('alert', alert);
  }

  /**
   * Execute alert actions
   * @param {Object} rule - Alert rule
   * @param {Object} alert - Alert data
   */
  async executeActions(rule, alert) {
    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];

    for (const action of actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        console.error(`Failed to execute action ${action}:`, error.message);
      }
    }
  }

  /**
   * Execute a single action
   * @param {string|Function} action - Action to execute
   * @param {Object} alert - Alert data
   */
  async executeAction(action, alert) {
    if (typeof action === 'function') {
      await action(alert);
      return;
    }

    switch (action) {
      case 'log':
        await this.logAlert(alert);
        break;

      case 'email':
        await this.sendEmailAlert(alert);
        break;

      case 'slack':
        await this.sendSlackAlert(alert);
        break;

      case 'webhook':
        await this.sendWebhookAlert(alert);
        break;

      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Log alert to file
   * @param {Object} alert - Alert data
   */
  async logAlert(alert) {
    try {
      const filename = path.join(
        this.options.alertPath,
        `alerts-${new Date().toISOString().split('T')[0]}.log`
      );

      await fs.appendFile(
        filename,
        JSON.stringify(alert) + '\n',
        'utf8'
      );
    } catch (error) {
      console.error('Failed to log alert:', error.message);
    }
  }

  /**
   * Send email alert (placeholder - requires email service)
   * @param {Object} alert - Alert data
   */
  async sendEmailAlert(alert) {
    // This would integrate with an email service
    console.log('[EMAIL ALERT]', alert.severity.toUpperCase(), '-', alert.message);
    // TODO: Implement actual email sending
  }

  /**
   * Send Slack alert (placeholder - requires Slack webhook)
   * @param {Object} alert - Alert data
   */
  async sendSlackAlert(alert) {
    // This would integrate with Slack webhook
    console.log('[SLACK ALERT]', alert.severity.toUpperCase(), '-', alert.message);
    // TODO: Implement actual Slack webhook
  }

  /**
   * Send webhook alert
   * @param {Object} alert - Alert data
   */
  async sendWebhookAlert(alert) {
    // This would send to a webhook URL
    console.log('[WEBHOOK ALERT]', alert.severity.toUpperCase(), '-', alert.message);
    // TODO: Implement actual webhook POST
  }

  /**
   * Clear an active alert
   * @param {string} ruleId - Rule ID
   */
  clearActiveAlert(ruleId) {
    if (this.activeAlerts.has(ruleId)) {
      const alert = this.activeAlerts.get(ruleId);
      this.activeAlerts.delete(ruleId);

      // Record resolution
      this.alertHistory.push({
        ...alert,
        resolved: true,
        resolvedAt: new Date(),
      });

      this.emit('alert-resolved', alert);
    }
  }

  /**
   * Set cooldown for a rule
   * @param {string} ruleId - Rule ID
   */
  setCooldown(ruleId) {
    const cooldownUntil = Date.now() + this.options.cooldownPeriod;
    this.cooldowns.set(ruleId, cooldownUntil);

    // Clear cooldown after period
    setTimeout(() => {
      this.cooldowns.delete(ruleId);
    }, this.options.cooldownPeriod);
  }

  /**
   * Check if rule is in cooldown
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether rule is in cooldown
   */
  isInCooldown(ruleId) {
    const cooldownUntil = this.cooldowns.get(ruleId);
    return cooldownUntil && Date.now() < cooldownUntil;
  }

  /**
   * Get alert history
   * @param {Object} filters - Filter options
   * @returns {Array} Alert history
   */
  getAlertHistory(filters = {}) {
    let history = [...this.alertHistory];

    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }

    if (filters.ruleId) {
      history = history.filter(a => a.ruleId === filters.ruleId);
    }

    if (filters.resolved !== undefined) {
      history = history.filter(a => !!a.resolved === filters.resolved);
    }

    const limit = filters.limit || 100;
    return history.slice(-limit);
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get all rules
   * @returns {Array} Alert rules
   */
  getRules() {
    return [...this.rules];
  }

  /**
   * Persist alert to disk
   * @param {Object} alert - Alert data
   */
  async persistAlert(alert) {
    try {
      await this.logAlert(alert);
    } catch (error) {
      console.error('Failed to persist alert:', error.message);
    }
  }

  /**
   * Sanitize context for storage
   * @param {Object} context - Context object
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    // Remove sensitive data and limit size
    const sanitized = {};

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = JSON.parse(JSON.stringify(value));
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate rule ID
   * @returns {string} Rule ID
   */
  generateRuleId() {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   * @returns {string} Alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   * @returns {Object} Alert statistics
   */
  getStatistics() {
    const total = this.alertHistory.length;
    const active = this.activeAlerts.size;
    const resolved = this.alertHistory.filter(a => a.resolved).length;

    const bySeverity = {
      info: 0,
      warning: 0,
      critical: 0,
    };

    this.alertHistory.forEach(alert => {
      if (bySeverity.hasOwnProperty(alert.severity)) {
        bySeverity[alert.severity]++;
      }
    });

    return {
      total,
      active,
      resolved,
      bySeverity,
      rules: {
        total: this.rules.length,
        enabled: this.rules.filter(r => r.enabled).length,
        disabled: this.rules.filter(r => !r.enabled).length,
      },
    };
  }

  /**
   * Clear alert history
   */
  clearHistory() {
    this.alertHistory = [];
    this.activeAlerts.clear();
  }

  /**
   * Export alert data
   * @returns {Object} Alert data
   */
  export() {
    return {
      rules: this.getRules(),
      activeAlerts: this.getActiveAlerts(),
      history: this.getAlertHistory(),
      statistics: this.getStatistics(),
      exportedAt: new Date(),
    };
  }
}

module.exports = AlertManager;
