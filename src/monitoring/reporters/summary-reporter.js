/**
 * TryForge Summary Reporter
 * Generate performance summaries and reports
 */

const chalk = require('chalk');
const logger = require('../../utils/logger');

class SummaryReporter {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      includeCharts: false,
      ...options
    };
  }

  /**
   * Generate summary report
   */
  generateReport(monitor, period = 'daily') {
    const summary = monitor.getSummary();
    const timeRange = this.getTimeRange(period);

    const report = {
      timestamp: Date.now(),
      period,
      timeRange,
      summary,
      sections: {
        executive: this.generateExecutiveSummary(summary),
        system: this.generateSystemSection(summary),
        api: this.generateAPISection(summary),
        database: this.generateDatabaseSection(summary),
        alerts: this.generateAlertsSection(summary),
        recommendations: this.generateRecommendations(summary)
      }
    };

    return report;
  }

  /**
   * Get time range for period
   */
  getTimeRange(period) {
    const ranges = {
      hourly: 3600000,
      daily: 86400000,
      weekly: 604800000,
      monthly: 2592000000
    };

    return ranges[period] || ranges.daily;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(summary) {
    const score = this.calculateOverallScore(summary);

    return {
      overallScore: score,
      scoreGrade: this.getScoreGrade(score),
      status: summary.status,
      trend: this.determineTrend(summary),
      keyMetrics: {
        avgResponseTime: summary.api.avgResponseTime,
        errorRate: summary.api.errorRate,
        uptime: Math.round(summary.system.uptime / 3600), // hours
        totalRequests: summary.api.totalRequests
      }
    };
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore(summary) {
    let score = 100;

    // API performance (40 points)
    if (summary.api.avgResponseTime > 1000) score -= 20;
    else if (summary.api.avgResponseTime > 500) score -= 10;

    if (summary.api.errorRate > 1) score -= 20;
    else if (summary.api.errorRate > 0.5) score -= 10;

    // System health (30 points)
    if (summary.system.cpu.average > 80) score -= 15;
    else if (summary.system.cpu.average > 60) score -= 8;

    if (summary.system.memory.average > 80) score -= 15;
    else if (summary.system.memory.average > 60) score -= 7;

    // Database (20 points)
    if (summary.database.slowQueries > 100) score -= 20;
    else if (summary.database.slowQueries > 50) score -= 10;

    // Alerts (10 points)
    if (summary.alerts.unacknowledged > 5) score -= 10;
    else if (summary.alerts.unacknowledged > 2) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get score grade
   */
  getScoreGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Determine trend
   */
  determineTrend(summary) {
    // Would compare with previous period
    return 'stable';
  }

  /**
   * Generate system section
   */
  generateSystemSection(summary) {
    return {
      cpu: {
        average: summary.system.cpu.average,
        threshold: summary.system.cpu.threshold,
        status: summary.system.cpu.status
      },
      memory: {
        average: summary.system.memory.average,
        threshold: summary.system.memory.threshold,
        status: summary.system.memory.status
      },
      uptime: Math.round(summary.system.uptime / 3600) // hours
    };
  }

  /**
   * Generate API section
   */
  generateAPISection(summary) {
    return {
      totalRequests: summary.api.totalRequests,
      successRate: ((summary.api.successfulRequests / summary.api.totalRequests) * 100).toFixed(2),
      errorRate: summary.api.errorRate,
      responseTime: {
        average: summary.api.avgResponseTime,
        p95: summary.api.p95ResponseTime,
        p99: summary.api.p99ResponseTime
      },
      status: summary.api.status
    };
  }

  /**
   * Generate database section
   */
  generateDatabaseSection(summary) {
    return {
      totalQueries: summary.database.totalQueries,
      avgQueryTime: summary.database.avgQueryTime,
      slowQueries: summary.database.slowQueries,
      slowQueryRate: ((summary.database.slowQueries / summary.database.totalQueries) * 100).toFixed(2),
      status: summary.database.status
    };
  }

  /**
   * Generate alerts section
   */
  generateAlertsSection(summary) {
    return {
      total: summary.alerts.total,
      unacknowledged: summary.alerts.unacknowledged,
      bySeverity: summary.alerts.bySeverity
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(summary) {
    const recommendations = [];

    if (summary.api.avgResponseTime > 500) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize API response time',
        description: `Average response time (${summary.api.avgResponseTime}ms) exceeds recommended threshold`
      });
    }

    if (summary.api.errorRate > 1) {
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        title: 'Reduce error rate',
        description: `Error rate (${summary.api.errorRate}%) is above acceptable levels`
      });
    }

    if (summary.database.slowQueries > 50) {
      recommendations.push({
        priority: 'medium',
        category: 'database',
        title: 'Optimize database queries',
        description: `${summary.database.slowQueries} slow queries detected`
      });
    }

    return recommendations;
  }

  /**
   * Format report as text
   */
  formatAsText(report) {
    const lines = [];

    lines.push(chalk.bold.cyan(`\nPerformance Report - ${this.getPeriodName(report.period)}`));
    lines.push(chalk.gray('═'.repeat(60)));
    lines.push('');

    // Executive Summary
    lines.push(chalk.bold('Executive Summary:'));
    lines.push(`  Overall Score: ${this.getColoredScore(report.sections.executive.overallScore)}`);
    lines.push(`  Status: ${this.getColoredStatus(report.sections.executive.status)}`);
    lines.push(`  Uptime: ${report.sections.executive.keyMetrics.uptime} hours`);
    lines.push('');

    // API Performance
    lines.push(chalk.bold('API Performance:'));
    lines.push(`  Total Requests: ${report.sections.api.totalRequests.toLocaleString()}`);
    lines.push(`  Success Rate: ${report.sections.api.successRate}%`);
    lines.push(`  Error Rate: ${this.getColoredValue(report.sections.api.errorRate, 1, '%')}`);
    lines.push(`  Avg Response Time: ${this.getColoredValue(report.sections.api.responseTime.average, 500, 'ms')}`);
    lines.push(`  95th Percentile: ${report.sections.api.responseTime.p95}ms`);
    lines.push('');

    // Database
    lines.push(chalk.bold('Database Performance:'));
    lines.push(`  Total Queries: ${report.sections.database.totalQueries.toLocaleString()}`);
    lines.push(`  Avg Query Time: ${report.sections.database.avgQueryTime}ms`);
    lines.push(`  Slow Queries: ${this.getColoredValue(report.sections.database.slowQueries, 50)}`);
    lines.push('');

    // System
    lines.push(chalk.bold('System Health:'));
    lines.push(`  CPU Usage: ${this.getColoredValue(report.sections.system.cpu.average, 70, '%')}`);
    lines.push(`  Memory Usage: ${this.getColoredValue(report.sections.system.memory.average, 80, '%')}`);
    lines.push('');

    // Alerts
    if (report.sections.alerts.total > 0) {
      lines.push(chalk.bold('Alerts:'));
      lines.push(`  Total: ${report.sections.alerts.total}`);
      lines.push(`  Unacknowledged: ${chalk.red(report.sections.alerts.unacknowledged)}`);
      lines.push(`  Critical: ${report.sections.alerts.bySeverity.critical || 0}`);
      lines.push(`  Warning: ${report.sections.alerts.bySeverity.warning || 0}`);
      lines.push('');
    }

    // Recommendations
    if (report.sections.recommendations.length > 0) {
      lines.push(chalk.bold('Recommendations:'));
      report.sections.recommendations.forEach((rec, i) => {
        const priority = rec.priority === 'critical' ? chalk.red('●') :
                        rec.priority === 'high' ? chalk.yellow('●') : chalk.blue('●');
        lines.push(`  ${priority} ${rec.title}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get colored score
   */
  getColoredScore(score) {
    const grade = this.getScoreGrade(score);
    const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
    return color(`${score}/100 (${grade})`);
  }

  /**
   * Get colored status
   */
  getColoredStatus(status) {
    const colors = {
      healthy: chalk.green,
      degraded: chalk.yellow,
      critical: chalk.red
    };
    const color = colors[status] || chalk.gray;
    return color(status.toUpperCase());
  }

  /**
   * Get colored value
   */
  getColoredValue(value, threshold, suffix = '') {
    const color = value > threshold ? chalk.red : chalk.green;
    const indicator = value > threshold ? ' ⚠️' : ' ✓';
    return color(`${value}${suffix}`) + indicator;
  }

  /**
   * Get period name
   */
  getPeriodName(period) {
    const names = {
      hourly: 'Last Hour',
      daily: 'Last 24 Hours',
      weekly: 'Last 7 Days',
      monthly: 'Last 30 Days'
    };
    return names[period] || 'Custom Period';
  }

  /**
   * Export report
   */
  export(report, format = 'text') {
    if (format === 'text') {
      return this.formatAsText(report);
    }

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    if (format === 'markdown') {
      return this.formatAsMarkdown(report);
    }

    return report;
  }

  /**
   * Format as markdown
   */
  formatAsMarkdown(report) {
    const lines = [];

    lines.push(`# Performance Report - ${this.getPeriodName(report.period)}\n`);
    lines.push(`Generated: ${new Date(report.timestamp).toISOString()}\n`);

    lines.push(`## Executive Summary\n`);
    lines.push(`- **Overall Score:** ${report.sections.executive.overallScore}/100 (${report.sections.executive.scoreGrade})`);
    lines.push(`- **Status:** ${report.sections.executive.status}`);
    lines.push(`- **Uptime:** ${report.sections.executive.keyMetrics.uptime} hours\n`);

    lines.push(`## API Performance\n`);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Requests | ${report.sections.api.totalRequests.toLocaleString()} |`);
    lines.push(`| Success Rate | ${report.sections.api.successRate}% |`);
    lines.push(`| Error Rate | ${report.sections.api.errorRate}% |`);
    lines.push(`| Avg Response Time | ${report.sections.api.responseTime.average}ms |`);
    lines.push(`| 95th Percentile | ${report.sections.api.responseTime.p95}ms |\n`);

    lines.push(`## Database Performance\n`);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Queries | ${report.sections.database.totalQueries.toLocaleString()} |`);
    lines.push(`| Avg Query Time | ${report.sections.database.avgQueryTime}ms |`);
    lines.push(`| Slow Queries | ${report.sections.database.slowQueries} |\n`);

    if (report.sections.recommendations.length > 0) {
      lines.push(`## Recommendations\n`);
      report.sections.recommendations.forEach(rec => {
        lines.push(`### ${rec.title}`);
        lines.push(`**Priority:** ${rec.priority}`);
        lines.push(`**Category:** ${rec.category}`);
        lines.push(`${rec.description}\n`);
      });
    }

    return lines.join('\n');
  }
}

module.exports = {
  SummaryReporter
};
