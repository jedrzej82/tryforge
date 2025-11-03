/**
 * Dependency Reporter
 * Generates reports for dependency analysis
 */

const chalk = require('chalk');

class DependencyReporter {
  /**
   * Generate dependency report
   * @param {object} analysis - Dependency analysis
   * @param {object} options - Report options
   * @returns {string} Report
   */
  static generateReport(analysis, options = {}) {
    const defaultOptions = {
      format: 'text',
      showGraph: false,
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
   * @param {object} analysis - Dependency analysis
   * @param {object} options - Options
   * @returns {string} Text report
   */
  static generateTextReport(analysis, options) {
    const lines = [];

    lines.push(chalk.bold.cyan('\n📦 Dependency Analysis Report'));
    lines.push(chalk.cyan('━'.repeat(60)));

    // Circular dependencies
    if (analysis.circular && analysis.circular.length > 0) {
      lines.push(chalk.bold.red(`\n⚠️  Circular Dependencies (${analysis.circular.length}):\n`));

      analysis.circular.forEach((circ, index) => {
        lines.push(chalk.yellow(`[${index + 1}] Cycle length: ${circ.length}`));
        circ.cycle.forEach((file, i) => {
          const arrow = i < circ.cycle.length - 1 ? ' → ' : '';
          lines.push(chalk.gray(`    ${this.shortenPath(file)}${arrow}`));
        });
        lines.push('');
      });
    }

    // Unused dependencies
    if (analysis.unused && analysis.unused.length > 0) {
      lines.push(chalk.bold.yellow(`\n📋 Unused Dependencies (${analysis.unused.length}):\n`));

      analysis.unused.forEach((dep) => {
        lines.push(chalk.gray(`  • ${dep.name} (${dep.version})`));
      });
      lines.push('');
    }

    // External dependencies
    if (analysis.external) {
      lines.push(chalk.bold('\n📚 External Dependencies:\n'));

      if (analysis.external.packages?.length > 0) {
        lines.push(chalk.white(`  Packages (${analysis.external.packages.length}):`));
        analysis.external.packages.slice(0, 10).forEach((pkg) => {
          lines.push(chalk.gray(`    • ${pkg}`));
        });
        if (analysis.external.packages.length > 10) {
          lines.push(
            chalk.gray(`    ... and ${analysis.external.packages.length - 10} more`)
          );
        }
      }

      if (analysis.external.builtin?.length > 0) {
        lines.push(chalk.white(`\n  Built-in modules (${analysis.external.builtin.length}):`));
        analysis.external.builtin.forEach((mod) => {
          lines.push(chalk.gray(`    • ${mod}`));
        });
      }
    }

    // Dependency graph stats
    if (analysis.graph) {
      lines.push(chalk.bold('\n📊 Dependency Graph Statistics:\n'));
      const stats = this.calculateGraphStats(analysis.graph);

      lines.push(chalk.white(`  Total files: ${stats.totalFiles}`));
      lines.push(chalk.white(`  Average dependencies: ${stats.avgDependencies}`));
      lines.push(chalk.white(`  Max dependencies: ${stats.maxDependencies}`));
      lines.push(chalk.white(`  Average dependents: ${stats.avgDependents}`));
      lines.push(chalk.white(`  Max dependents: ${stats.maxDependents}`));
      lines.push(chalk.white(`  Isolated files: ${stats.isolatedFiles}`));
    }

    lines.push(chalk.bold('\n💡 Recommendations:'));
    lines.push(this.generateRecommendations(analysis));

    lines.push(chalk.cyan('\n' + '━'.repeat(60)));

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   * @param {object} analysis - Dependency analysis
   * @returns {string} JSON report
   */
  static generateJSONReport(analysis) {
    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Generate Markdown report
   * @param {object} analysis - Dependency analysis
   * @param {object} options - Options
   * @returns {string} Markdown report
   */
  static generateMarkdownReport(analysis, options) {
    const lines = [];

    lines.push('# Dependency Analysis Report\n');

    if (analysis.circular && analysis.circular.length > 0) {
      lines.push(`## Circular Dependencies (${analysis.circular.length})\n`);

      analysis.circular.forEach((circ, index) => {
        lines.push(`### Cycle #${index + 1} (Length: ${circ.length})`);
        circ.cycle.forEach((file) => {
          lines.push(`- ${this.shortenPath(file)}`);
        });
        lines.push('');
      });
    }

    if (analysis.unused && analysis.unused.length > 0) {
      lines.push(`## Unused Dependencies (${analysis.unused.length})\n`);

      analysis.unused.forEach((dep) => {
        lines.push(`- ${dep.name} (${dep.version})`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Shorten file path
   * @param {string} filePath - Full file path
   * @returns {string} Shortened path
   */
  static shortenPath(filePath) {
    const parts = filePath.split('/');
    if (parts.length > 3) {
      return '.../' + parts.slice(-3).join('/');
    }
    return filePath;
  }

  /**
   * Calculate graph statistics
   * @param {object} graph - Dependency graph
   * @returns {object} Statistics
   */
  static calculateGraphStats(graph) {
    const files = Object.keys(graph);
    const totalFiles = files.length;

    if (totalFiles === 0) {
      return {
        totalFiles: 0,
        avgDependencies: 0,
        maxDependencies: 0,
        avgDependents: 0,
        maxDependents: 0,
        isolatedFiles: 0,
      };
    }

    let totalDeps = 0;
    let maxDeps = 0;
    let totalDependents = 0;
    let maxDependents = 0;
    let isolated = 0;

    files.forEach((file) => {
      const deps = graph[file].dependencies?.length || 0;
      const dependents = graph[file].dependents?.length || 0;

      totalDeps += deps;
      maxDeps = Math.max(maxDeps, deps);

      totalDependents += dependents;
      maxDependents = Math.max(maxDependents, dependents);

      if (deps === 0 && dependents === 0) {
        isolated++;
      }
    });

    return {
      totalFiles,
      avgDependencies: (totalDeps / totalFiles).toFixed(2),
      maxDependencies: maxDeps,
      avgDependents: (totalDependents / totalFiles).toFixed(2),
      maxDependents,
      isolatedFiles: isolated,
    };
  }

  /**
   * Generate recommendations
   * @param {object} analysis - Dependency analysis
   * @returns {string} Recommendations
   */
  static generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.circular && analysis.circular.length > 0) {
      recommendations.push(
        chalk.red('• Resolve circular dependencies to improve code maintainability')
      );
      recommendations.push(
        chalk.yellow('• Consider extracting shared code to a separate module')
      );
    }

    if (analysis.unused && analysis.unused.length > 0) {
      recommendations.push(
        chalk.yellow(`• Remove ${analysis.unused.length} unused dependencies to reduce bundle size`)
      );
    }

    if (analysis.external?.packages?.length > 50) {
      recommendations.push(
        chalk.yellow('• Large number of dependencies - consider consolidation')
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        chalk.green('✓ Dependency structure looks healthy!')
      );
    }

    return recommendations.join('\n');
  }

  /**
   * Generate graph visualization
   * @param {object} graph - Dependency graph
   * @returns {string} ASCII graph
   */
  static generateGraphVisualization(graph) {
    const lines = [];
    const files = Object.keys(graph).slice(0, 10); // Limit to first 10 files

    files.forEach((file) => {
      const shortPath = this.shortenPath(file);
      lines.push(`\n${chalk.bold(shortPath)}`);

      const deps = graph[file].dependencies || [];
      if (deps.length > 0) {
        lines.push(chalk.gray('  Dependencies:'));
        deps.slice(0, 5).forEach((dep) => {
          lines.push(chalk.gray(`    → ${this.shortenPath(dep)}`));
        });
        if (deps.length > 5) {
          lines.push(chalk.gray(`    ... and ${deps.length - 5} more`));
        }
      }
    });

    if (Object.keys(graph).length > 10) {
      lines.push(chalk.gray(`\n... and ${Object.keys(graph).length - 10} more files`));
    }

    return lines.join('\n');
  }

  /**
   * Generate summary
   * @param {object} analysis - Dependency analysis
   * @returns {object} Summary
   */
  static generateSummary(analysis) {
    return {
      circularDependencies: analysis.circular?.length || 0,
      unusedDependencies: analysis.unused?.length || 0,
      totalPackages: analysis.external?.packages?.length || 0,
      builtinModules: analysis.external?.builtin?.length || 0,
      relativeImports: analysis.external?.relative?.length || 0,
    };
  }
}

module.exports = DependencyReporter;
