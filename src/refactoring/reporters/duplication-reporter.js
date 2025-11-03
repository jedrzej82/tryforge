/**
 * Duplication Reporter
 * Generates reports for code duplication analysis
 */

const chalk = require('chalk');

class DuplicationReporter {
  /**
   * Generate duplication report
   * @param {object} analysis - Duplication analysis
   * @param {object} options - Report options
   * @returns {string} Report
   */
  static generateReport(analysis, options = {}) {
    const defaultOptions = {
      format: 'text',
      minSimilarity: 80,
      ...options,
    };

    switch (defaultOptions.format) {
      case 'json':
        return this.generateJSONReport(analysis);
      case 'markdown':
        return this.generateMarkdownReport(analysis, defaultOptions);
      default:
        return this.generateTextReport(analysis, defaultOptions);
    }
  }

  /**
   * Generate text report
   * @param {object} analysis - Duplication analysis
   * @param {object} options - Options
   * @returns {string} Text report
   */
  static generateTextReport(analysis, options) {
    const lines = [];

    lines.push(chalk.bold.cyan('\n🔍 Code Duplication Report'));
    lines.push(chalk.cyan('━'.repeat(60)));

    if (analysis.duplication && analysis.duplication.length > 0) {
      const filtered = analysis.duplication.filter(
        (d) => d.similarity >= options.minSimilarity
      );

      lines.push(
        chalk.bold(
          `\n📋 Found ${filtered.length} duplicate code blocks (${options.minSimilarity}%+ similar):\n`
        )
      );

      filtered.forEach((dup, index) => {
        lines.push(chalk.yellow(`\n[${index + 1}] Similarity: ${dup.similarity}%`));
        lines.push(
          chalk.gray(
            `    Block 1: ${this.formatLocation(dup.block1)} (${dup.lines} lines)`
          )
        );
        lines.push(
          chalk.gray(
            `    Block 2: ${this.formatLocation(dup.block2)} (${dup.lines} lines)`
          )
        );

        if (options.showCode && dup.block1.code) {
          lines.push(chalk.dim('\n    Preview:'));
          const preview = this.getCodePreview(dup.block1.code);
          preview.forEach((line) => {
            lines.push(chalk.dim(`    ${line}`));
          });
        }
      });
    } else {
      lines.push(chalk.green('\n✓ No significant code duplication found!'));
    }

    lines.push(chalk.bold('\n📊 Duplication Statistics:'));
    lines.push(this.generateStatistics(analysis));

    lines.push(chalk.bold('\n💡 Recommendations:'));
    lines.push(this.generateRecommendations(analysis));

    lines.push(chalk.cyan('\n' + '━'.repeat(60)));

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   * @param {object} analysis - Duplication analysis
   * @returns {string} JSON report
   */
  static generateJSONReport(analysis) {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate Markdown report
   * @param {object} analysis - Duplication analysis
   * @param {object} options - Options
   * @returns {string} Markdown report
   */
  static generateMarkdownReport(analysis, options) {
    const lines = [];

    lines.push('# Code Duplication Report\n');

    if (analysis.duplication && analysis.duplication.length > 0) {
      const filtered = analysis.duplication.filter(
        (d) => d.similarity >= options.minSimilarity
      );

      lines.push(`## Duplicate Code Blocks (${filtered.length} found)\n`);

      filtered.forEach((dup, index) => {
        lines.push(`### Duplicate #${index + 1}`);
        lines.push(`**Similarity:** ${dup.similarity}%`);
        lines.push(`**Lines:** ${dup.lines}`);
        lines.push(`- Block 1: ${this.formatLocation(dup.block1)}`);
        lines.push(`- Block 2: ${this.formatLocation(dup.block2)}`);
        lines.push('');
      });
    } else {
      lines.push('No significant code duplication found.\n');
    }

    return lines.join('\n');
  }

  /**
   * Format location
   * @param {object} block - Code block
   * @returns {string} Formatted location
   */
  static formatLocation(block) {
    if (block.location) {
      return `Lines ${block.location.start.line}-${block.location.end.line}`;
    }
    return 'Unknown location';
  }

  /**
   * Get code preview
   * @param {string} code - Code to preview
   * @param {number} maxLines - Max lines to show
   * @returns {array} Preview lines
   */
  static getCodePreview(code, maxLines = 5) {
    const lines = code.split('\n').slice(0, maxLines);
    if (code.split('\n').length > maxLines) {
      lines.push('...');
    }
    return lines;
  }

  /**
   * Generate statistics
   * @param {object} analysis - Duplication analysis
   * @returns {string} Statistics
   */
  static generateStatistics(analysis) {
    const stats = [];

    if (analysis.duplication) {
      const totalDuplicates = analysis.duplication.length;
      const highSimilarity = analysis.duplication.filter(
        (d) => d.similarity >= 90
      ).length;
      const mediumSimilarity = analysis.duplication.filter(
        (d) => d.similarity >= 80 && d.similarity < 90
      ).length;

      stats.push(chalk.white(`Total duplicates found: ${totalDuplicates}`));
      stats.push(
        chalk.red(`  High similarity (90%+): ${highSimilarity}`)
      );
      stats.push(
        chalk.yellow(`  Medium similarity (80-89%): ${mediumSimilarity}`)
      );

      if (totalDuplicates > 0) {
        const avgSimilarity =
          analysis.duplication.reduce((sum, d) => sum + d.similarity, 0) /
          totalDuplicates;
        stats.push(
          chalk.white(
            `  Average similarity: ${avgSimilarity.toFixed(1)}%`
          )
        );
      }
    }

    return stats.join('\n');
  }

  /**
   * Generate recommendations
   * @param {object} analysis - Duplication analysis
   * @returns {string} Recommendations
   */
  static generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.duplication && analysis.duplication.length > 0) {
      const highDuplication = analysis.duplication.filter(
        (d) => d.similarity >= 90
      );

      if (highDuplication.length > 0) {
        recommendations.push(
          chalk.yellow(
            '• Extract highly similar code blocks into reusable functions'
          )
        );
      }

      recommendations.push(
        chalk.yellow('• Consider creating utility functions for common patterns')
      );
      recommendations.push(
        chalk.yellow('• Use inheritance or composition to share code between classes')
      );
      recommendations.push(
        chalk.yellow('• Review duplicates and consolidate where appropriate')
      );
    } else {
      recommendations.push(
        chalk.green('✓ Code duplication is minimal!')
      );
    }

    return recommendations.join('\n');
  }

  /**
   * Generate summary
   * @param {object} analysis - Duplication analysis
   * @returns {object} Summary
   */
  static generateSummary(analysis) {
    const duplicates = analysis.duplication || [];

    return {
      total: duplicates.length,
      highSimilarity: duplicates.filter((d) => d.similarity >= 90).length,
      mediumSimilarity: duplicates.filter(
        (d) => d.similarity >= 80 && d.similarity < 90
      ).length,
      lowSimilarity: duplicates.filter((d) => d.similarity < 80).length,
      averageSimilarity:
        duplicates.length > 0
          ? duplicates.reduce((sum, d) => sum + d.similarity, 0) /
            duplicates.length
          : 0,
    };
  }
}

module.exports = DuplicationReporter;
