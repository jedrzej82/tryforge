/**
 * Complexity Reporter
 * Generates reports for code complexity analysis
 */

const chalk = require('chalk');
const Table = require('cli-table3');

class ComplexityReporter {
  /**
   * Generate complexity report
   * @param {object} analysis - Complexity analysis
   * @param {object} options - Report options
   * @returns {string} Report
   */
  static generateReport(analysis, options = {}) {
    const defaultOptions = {
      format: 'text',
      showDetails: true,
      threshold: 10,
      ...options,
    };

    switch (defaultOptions.format) {
      case 'json':
        return this.generateJSONReport(analysis);
      case 'html':
        return this.generateHTMLReport(analysis, defaultOptions);
      case 'markdown':
        return this.generateMarkdownReport(analysis, defaultOptions);
      default:
        return this.generateTextReport(analysis, defaultOptions);
    }
  }

  /**
   * Generate text report
   * @param {object} analysis - Complexity analysis
   * @param {object} options - Options
   * @returns {string} Text report
   */
  static generateTextReport(analysis, options) {
    const lines = [];

    lines.push(chalk.bold.cyan('\n📊 Code Complexity Report'));
    lines.push(chalk.cyan('━'.repeat(60)));

    if (analysis.complexity && analysis.complexity.length > 0) {
      lines.push(chalk.bold('\n🔴 High Complexity Functions:'));

      const table = new Table({
        head: [
          chalk.white('Function'),
          chalk.white('Cyclomatic'),
          chalk.white('Cognitive'),
          chalk.white('Location'),
          chalk.white('Severity'),
        ],
        colWidths: [25, 12, 12, 20, 12],
      });

      analysis.complexity.forEach((item) => {
        const severity = this.getSeverityColor(item.severity);
        table.push([
          item.name,
          item.cyclomaticComplexity,
          item.cognitiveComplexity,
          item.location ? `L${item.location.start.line}` : 'N/A',
          severity(item.severity.toUpperCase()),
        ]);
      });

      lines.push(table.toString());
    }

    if (analysis.longFunctions && analysis.longFunctions.length > 0) {
      lines.push(chalk.bold('\n📏 Long Functions:'));

      const table = new Table({
        head: [
          chalk.white('Function'),
          chalk.white('Lines'),
          chalk.white('Location'),
          chalk.white('Severity'),
        ],
        colWidths: [30, 10, 20, 12],
      });

      analysis.longFunctions.forEach((item) => {
        const severity = this.getSeverityColor(item.severity);
        table.push([
          item.name,
          item.lines,
          item.location ? `L${item.location.start.line}` : 'N/A',
          severity(item.severity.toUpperCase()),
        ]);
      });

      lines.push(table.toString());
    }

    if (analysis.deepNesting && analysis.deepNesting.length > 0) {
      lines.push(chalk.bold('\n🔄 Deep Nesting:'));

      const table = new Table({
        head: [
          chalk.white('Type'),
          chalk.white('Depth'),
          chalk.white('Location'),
          chalk.white('Severity'),
        ],
        colWidths: [25, 10, 20, 12],
      });

      analysis.deepNesting.forEach((item) => {
        const severity = this.getSeverityColor(item.severity);
        table.push([
          item.type,
          item.depth,
          item.location ? `L${item.location.start.line}` : 'N/A',
          severity(item.severity.toUpperCase()),
        ]);
      });

      lines.push(table.toString());
    }

    if (analysis.metrics) {
      lines.push(chalk.bold('\n📈 Code Metrics:'));

      const metricsTable = new Table({
        head: [chalk.white('Metric'), chalk.white('Value')],
        colWidths: [30, 15],
      });

      metricsTable.push(
        ['Total Lines', analysis.metrics.totalLines],
        ['Code Lines', analysis.metrics.codeLines],
        ['Comment Lines', analysis.metrics.commentLines],
        ['Functions', analysis.metrics.functions],
        ['Classes', analysis.metrics.classes],
        ['Avg Function Length', analysis.metrics.avgFunctionLength],
        ['Max Function Length', analysis.metrics.maxFunctionLength]
      );

      lines.push(metricsTable.toString());
    }

    lines.push(chalk.bold('\n💡 Recommendations:'));
    lines.push(this.generateRecommendations(analysis));

    lines.push(chalk.cyan('\n' + '━'.repeat(60)));

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   * @param {object} analysis - Complexity analysis
   * @returns {string} JSON report
   */
  static generateJSONReport(analysis) {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate HTML report
   * @param {object} analysis - Complexity analysis
   * @param {object} options - Options
   * @returns {string} HTML report
   */
  static generateHTMLReport(analysis, options) {
    const html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html>');
    html.push('<head>');
    html.push('<title>Code Complexity Report</title>');
    html.push('<style>');
    html.push(this.getHTMLStyles());
    html.push('</style>');
    html.push('</head>');
    html.push('<body>');
    html.push('<div class="container">');
    html.push('<h1>Code Complexity Report</h1>');

    if (analysis.complexity && analysis.complexity.length > 0) {
      html.push('<h2>High Complexity Functions</h2>');
      html.push('<table>');
      html.push(
        '<tr><th>Function</th><th>Cyclomatic</th><th>Cognitive</th><th>Location</th><th>Severity</th></tr>'
      );

      analysis.complexity.forEach((item) => {
        html.push('<tr>');
        html.push(`<td>${item.name}</td>`);
        html.push(`<td>${item.cyclomaticComplexity}</td>`);
        html.push(`<td>${item.cognitiveComplexity}</td>`);
        html.push(
          `<td>${item.location ? `Line ${item.location.start.line}` : 'N/A'}</td>`
        );
        html.push(
          `<td class="severity-${item.severity}">${item.severity}</td>`
        );
        html.push('</tr>');
      });

      html.push('</table>');
    }

    if (analysis.metrics) {
      html.push('<h2>Code Metrics</h2>');
      html.push('<table>');
      html.push('<tr><th>Metric</th><th>Value</th></tr>');
      html.push(`<tr><td>Total Lines</td><td>${analysis.metrics.totalLines}</td></tr>`);
      html.push(`<tr><td>Code Lines</td><td>${analysis.metrics.codeLines}</td></tr>`);
      html.push(
        `<tr><td>Comment Lines</td><td>${analysis.metrics.commentLines}</td></tr>`
      );
      html.push(`<tr><td>Functions</td><td>${analysis.metrics.functions}</td></tr>`);
      html.push(`<tr><td>Classes</td><td>${analysis.metrics.classes}</td></tr>`);
      html.push('</table>');
    }

    html.push('</div>');
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /**
   * Generate Markdown report
   * @param {object} analysis - Complexity analysis
   * @param {object} options - Options
   * @returns {string} Markdown report
   */
  static generateMarkdownReport(analysis, options) {
    const lines = [];

    lines.push('# Code Complexity Report\n');

    if (analysis.complexity && analysis.complexity.length > 0) {
      lines.push('## High Complexity Functions\n');
      lines.push('| Function | Cyclomatic | Cognitive | Location | Severity |');
      lines.push('|----------|------------|-----------|----------|----------|');

      analysis.complexity.forEach((item) => {
        lines.push(
          `| ${item.name} | ${item.cyclomaticComplexity} | ${
            item.cognitiveComplexity
          } | ${item.location ? `L${item.location.start.line}` : 'N/A'} | ${
            item.severity
          } |`
        );
      });

      lines.push('');
    }

    if (analysis.metrics) {
      lines.push('## Code Metrics\n');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Lines | ${analysis.metrics.totalLines} |`);
      lines.push(`| Code Lines | ${analysis.metrics.codeLines} |`);
      lines.push(`| Comment Lines | ${analysis.metrics.commentLines} |`);
      lines.push(`| Functions | ${analysis.metrics.functions} |`);
      lines.push(`| Classes | ${analysis.metrics.classes} |`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get severity color
   * @param {string} severity - Severity level
   * @returns {function} Chalk color function
   */
  static getSeverityColor(severity) {
    const colors = {
      critical: chalk.red.bold,
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.blue,
    };

    return colors[severity] || chalk.white;
  }

  /**
   * Generate recommendations
   * @param {object} analysis - Complexity analysis
   * @returns {string} Recommendations
   */
  static generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.complexity && analysis.complexity.length > 0) {
      recommendations.push(
        chalk.yellow(
          '• Consider refactoring complex functions to improve maintainability'
        )
      );
      recommendations.push(
        chalk.yellow('• Break down large functions into smaller, focused units')
      );
    }

    if (analysis.longFunctions && analysis.longFunctions.length > 0) {
      recommendations.push(
        chalk.yellow('• Split long functions into multiple smaller functions')
      );
    }

    if (analysis.deepNesting && analysis.deepNesting.length > 0) {
      recommendations.push(
        chalk.yellow('• Reduce nesting depth by using early returns or guard clauses')
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(chalk.green('✓ Code complexity looks good!'));
    }

    return recommendations.join('\n');
  }

  /**
   * Get HTML styles
   * @returns {string} CSS styles
   */
  static getHTMLStyles() {
    return `
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
      h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
      h2 { color: #555; margin-top: 30px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #007bff; color: white; }
      tr:hover { background-color: #f5f5f5; }
      .severity-critical { color: #dc3545; font-weight: bold; }
      .severity-high { color: #fd7e14; font-weight: bold; }
      .severity-medium { color: #ffc107; }
      .severity-low { color: #17a2b8; }
    `;
  }

  /**
   * Generate summary
   * @param {object} analysis - Complexity analysis
   * @returns {object} Summary
   */
  static generateSummary(analysis) {
    return {
      totalIssues:
        (analysis.complexity?.length || 0) +
        (analysis.longFunctions?.length || 0) +
        (analysis.deepNesting?.length || 0),
      criticalIssues: this.countBySeverity(analysis, 'critical'),
      highIssues: this.countBySeverity(analysis, 'high'),
      mediumIssues: this.countBySeverity(analysis, 'medium'),
      lowIssues: this.countBySeverity(analysis, 'low'),
    };
  }

  /**
   * Count issues by severity
   * @param {object} analysis - Complexity analysis
   * @param {string} severity - Severity level
   * @returns {number} Count
   */
  static countBySeverity(analysis, severity) {
    let count = 0;

    if (analysis.complexity) {
      count += analysis.complexity.filter((i) => i.severity === severity).length;
    }

    if (analysis.longFunctions) {
      count += analysis.longFunctions.filter((i) => i.severity === severity).length;
    }

    if (analysis.deepNesting) {
      count += analysis.deepNesting.filter((i) => i.severity === severity).length;
    }

    return count;
  }
}

// Create cli-table3 stub if not available
if (!Table) {
  class Table {
    constructor(config) {
      this.config = config;
      this.rows = [];
    }

    push(...rows) {
      this.rows.push(...rows);
    }

    toString() {
      return this.rows.map((row) => row.join(' | ')).join('\n');
    }
  }
}

module.exports = ComplexityReporter;
