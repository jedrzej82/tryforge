/**
 * TryForge Monitor Command
 * Performance monitoring and profiling commands
 */

const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../utils/logger');
const { handleError } = require('../../utils/error-handler');
const {
  initializeMonitoring,
  generateReport,
  runAnalysis,
  exportData,
  cleanup,
  CPUProfiler,
  MemoryProfiler,
  DatabaseProfiler,
  SummaryReporter
} = require('../../monitoring');

// Store monitoring instances globally
let monitoringInstances = null;

class MonitorCommand {
  /**
   * Execute monitor command
   */
  static async execute(action, options = {}) {
    try {
      switch (action) {
        case 'start':
          return await this.start(options);
        case 'stop':
          return await this.stop(options);
        case 'status':
          return await this.status(options);
        case 'profile':
          return await this.profile(options);
        case 'analyze':
          return await this.analyze(options);
        case 'report':
          return await this.report(options);
        case 'export':
          return await this.export(options);
        default:
          return await this.status(options);
      }
    } catch (error) {
      handleError(error, { context: 'Monitor Command' });
    }
  }

  /**
   * Start monitoring
   */
  static async start(options = {}) {
    const spinner = ora('Starting performance monitoring...').start();

    try {
      // Initialize monitoring
      monitoringInstances = initializeMonitoring({
        enabled: true,
        monitor: true,
        profilers: {
          api: true,
          ...options.profilers
        },
        collectors: {
          metrics: true,
          logs: true,
          ...options.collectors
        },
        analyzers: {
          performance: true,
          bottleneck: true
        }
      });

      spinner.succeed(chalk.green('Performance monitoring started successfully'));

      console.log(chalk.cyan('\nMonitoring Status:'));
      console.log(chalk.gray('━'.repeat(60)));
      console.log(`${chalk.green('✓')} Performance Monitor: Running`);
      console.log(`${chalk.green('✓')} Metrics Collector: Running`);
      console.log(`${chalk.green('✓')} API Profiler: Running`);

      console.log(chalk.cyan('\nMonitoring Endpoints:'));
      console.log(chalk.gray('  /_monitoring/health') + '  - Health check');
      console.log(chalk.gray('  /_monitoring/metrics') + ' - Metrics data');
      console.log(chalk.gray('  /_monitoring/prometheus') + ' - Prometheus format');

      console.log(chalk.cyan('\nCommands:'));
      console.log(chalk.gray('  tryforge monitor status') + '  - Check monitoring status');
      console.log(chalk.gray('  tryforge monitor report') + '  - Generate performance report');
      console.log(chalk.gray('  tryforge monitor analyze') + ' - Run performance analysis');
      console.log(chalk.gray('  tryforge monitor stop') + '    - Stop monitoring');

      logger.info('Monitoring started', { options });

    } catch (error) {
      spinner.fail('Failed to start monitoring');
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  static async stop(options = {}) {
    const spinner = ora('Stopping performance monitoring...').start();

    try {
      if (!monitoringInstances) {
        spinner.warn('Monitoring is not running');
        return;
      }

      cleanup(monitoringInstances);
      monitoringInstances = null;

      spinner.succeed(chalk.green('Performance monitoring stopped'));
      logger.info('Monitoring stopped');

    } catch (error) {
      spinner.fail('Failed to stop monitoring');
      throw error;
    }
  }

  /**
   * Show monitoring status
   */
  static async status(options = {}) {
    try {
      if (!monitoringInstances || !monitoringInstances.monitor) {
        console.log(chalk.yellow('\n⚠️  Monitoring is not running'));
        console.log(chalk.gray('\nStart monitoring with: tryforge monitor start\n'));
        return;
      }

      const summary = monitoringInstances.monitor.getSummary();

      console.log(chalk.bold.cyan('\n📊 Performance Monitoring Status\n'));
      console.log(chalk.gray('━'.repeat(60)));

      // Overall Status
      const statusIcon = summary.status === 'healthy' ? '✅' :
                        summary.status === 'degraded' ? '⚠️' : '🔴';
      const statusColor = summary.status === 'healthy' ? chalk.green :
                         summary.status === 'degraded' ? chalk.yellow : chalk.red;

      console.log(chalk.bold('Overall Status: ') + statusColor(`${statusIcon} ${summary.status.toUpperCase()}`));
      console.log(chalk.gray(`Uptime: ${Math.round(summary.system.uptime / 60)} minutes\n`));

      // API Performance
      console.log(chalk.bold('API Performance:'));
      const avgResponseTime = summary.api.avgResponseTime;
      const responseTimeIcon = avgResponseTime < 200 ? '✓' : avgResponseTime < 500 ? '⚠️' : '✗';
      const responseTimeColor = avgResponseTime < 200 ? chalk.green : avgResponseTime < 500 ? chalk.yellow : chalk.red;
      console.log(`  Average Response Time: ${responseTimeColor(avgResponseTime + 'ms')} ${responseTimeIcon}`);

      const p95 = summary.api.p95ResponseTime;
      const p95Icon = p95 < 500 ? '✓' : p95 < 1000 ? '⚠️' : '✗';
      const p95Color = p95 < 500 ? chalk.green : p95 < 1000 ? chalk.yellow : chalk.red;
      console.log(`  95th Percentile: ${p95Color(p95 + 'ms')} ${p95Icon}`);

      const errorRate = summary.api.errorRate;
      const errorIcon = errorRate < 1 ? '✓' : errorRate < 5 ? '⚠️' : '✗';
      const errorColor = errorRate < 1 ? chalk.green : errorRate < 5 ? chalk.yellow : chalk.red;
      console.log(`  Error Rate: ${errorColor(errorRate.toFixed(2) + '%')} ${errorIcon}`);

      console.log(chalk.gray(`  Total Requests: ${summary.api.totalRequests.toLocaleString()}\n`));

      // Database Performance
      if (summary.database.totalQueries > 0) {
        console.log(chalk.bold('Database:'));
        const avgQueryTime = summary.database.avgQueryTime;
        const queryIcon = avgQueryTime < 50 ? '✓' : avgQueryTime < 100 ? '⚠️' : '✗';
        const queryColor = avgQueryTime < 50 ? chalk.green : avgQueryTime < 100 ? chalk.yellow : chalk.red;
        console.log(`  Average Query Time: ${queryColor(avgQueryTime + 'ms')} ${queryIcon}`);

        const slowQueries = summary.database.slowQueries;
        const slowIcon = slowQueries < 10 ? '✓' : slowQueries < 50 ? '⚠️' : '✗';
        const slowColor = slowQueries < 10 ? chalk.green : slowQueries < 50 ? chalk.yellow : chalk.red;
        console.log(`  Slow Queries: ${slowColor(slowQueries)} ${slowIcon}`);

        console.log(chalk.gray(`  Total Queries: ${summary.database.totalQueries.toLocaleString()}\n`));
      }

      // System Health
      console.log(chalk.bold('System:'));
      const cpu = summary.system.cpu.average;
      const cpuIcon = cpu < 60 ? '✓' : cpu < 80 ? '⚠️' : '✗';
      const cpuColor = cpu < 60 ? chalk.green : cpu < 80 ? chalk.yellow : chalk.red;
      console.log(`  CPU Usage: ${cpuColor(cpu.toFixed(1) + '%')} ${cpuIcon}`);

      const memory = summary.system.memory.average;
      const memIcon = memory < 70 ? '✓' : memory < 85 ? '⚠️' : '✗';
      const memColor = memory < 70 ? chalk.green : memory < 85 ? chalk.yellow : chalk.red;
      console.log(`  Memory Usage: ${memColor(memory.toFixed(1) + '%')} ${memIcon}`);

      const heap = summary.system.heap.average;
      const heapIcon = heap < 70 ? '✓' : heap < 85 ? '⚠️' : '✗';
      const heapColor = heap < 70 ? chalk.green : heap < 85 ? chalk.yellow : chalk.red;
      console.log(`  Heap Usage: ${heapColor(heap.toFixed(1) + '%')} ${heapIcon}\n`);

      // Alerts
      if (summary.alerts.total > 0) {
        console.log(chalk.bold('Alerts:'));
        console.log(`  Total: ${summary.alerts.total}`);
        if (summary.alerts.unacknowledged > 0) {
          console.log(chalk.red(`  Unacknowledged: ${summary.alerts.unacknowledged}`));
        }
        if (summary.alerts.bySeverity.critical > 0) {
          console.log(chalk.red(`  Critical: ${summary.alerts.bySeverity.critical}`));
        }
        if (summary.alerts.bySeverity.warning > 0) {
          console.log(chalk.yellow(`  Warning: ${summary.alerts.bySeverity.warning}`));
        }
        console.log('');
      }

      console.log(chalk.gray('━'.repeat(60)));
      console.log(chalk.gray('Run "tryforge monitor report" for detailed report\n'));

      logger.info('Status displayed');

    } catch (error) {
      handleError(error, { context: 'Monitor Status' });
    }
  }

  /**
   * Profile system
   */
  static async profile(options = {}) {
    const type = options.type || 'cpu';
    const duration = parseInt(options.duration) || 60000; // 60 seconds default

    try {
      console.log(chalk.cyan(`\nStarting ${type} profiling for ${duration / 1000} seconds...\n`));

      let profiler;
      let profile;

      switch (type) {
        case 'cpu':
          profiler = new CPUProfiler();
          profiler.start();
          await this.wait(duration);
          profile = profiler.stop();
          this.displayCPUProfile(profile);
          break;

        case 'memory':
          profiler = new MemoryProfiler();
          profiler.start();
          await this.wait(duration);
          profile = profiler.stop();
          this.displayMemoryProfile(profile);
          break;

        case 'database':
          if (!monitoringInstances?.databaseProfiler) {
            console.log(chalk.yellow('Database profiler not available. Start monitoring first.'));
            return;
          }
          profile = monitoringInstances.databaseProfiler.generateProfile(duration);
          this.displayDatabaseProfile(profile);
          break;

        default:
          console.log(chalk.red(`Unknown profile type: ${type}`));
          console.log(chalk.gray('Available types: cpu, memory, database'));
          return;
      }

      // Save profile to file if requested
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        await fs.writeJson(outputPath, profile, { spaces: 2 });
        console.log(chalk.green(`\n✓ Profile saved to: ${outputPath}`));
      }

      logger.info('Profiling complete', { type, duration });

    } catch (error) {
      handleError(error, { context: 'Monitor Profile' });
    }
  }

  /**
   * Wait helper
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Display CPU profile
   */
  static displayCPUProfile(profile) {
    console.log(chalk.bold.cyan('CPU Profile Results:\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(`Duration: ${Math.round(profile.duration / 1000)}s`);
    console.log(`CPU Usage: ${profile.cpu.usagePercent.toFixed(2)}%`);
    console.log(`Samples: ${profile.samples}\n`);

    if (profile.functions.hotPaths.length > 0) {
      console.log(chalk.bold('Hot Paths (Top 10):'));
      profile.functions.hotPaths.forEach((fn, i) => {
        console.log(`${i + 1}. ${chalk.yellow(fn.name)}`);
        console.log(`   Calls: ${fn.calls} | Total: ${fn.totalTime}ms | Avg: ${fn.avgTime}ms`);
      });
      console.log('');
    }

    if (profile.recommendations.length > 0) {
      console.log(chalk.bold('Recommendations:'));
      profile.recommendations.forEach(rec => {
        const icon = rec.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${rec.message}`);
      });
    }
  }

  /**
   * Display memory profile
   */
  static displayMemoryProfile(profile) {
    console.log(chalk.bold.cyan('Memory Profile Results:\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(`Duration: ${Math.round(profile.duration / 1000)}s`);
    console.log(`Heap Growth: ${Math.round(profile.memory.growth.heap / 1024 / 1024)}MB`);
    console.log(`Average Heap: ${Math.round(profile.memory.average.heapUsed / 1024 / 1024)}MB`);
    console.log(`Peak Heap: ${Math.round(profile.memory.peak.heapUsed / 1024 / 1024)}MB\n`);

    if (profile.leakDetection.detected) {
      console.log(chalk.red.bold('⚠️  Memory Leak Detected!'));
      console.log(`Growth Rate: ${Math.round(profile.leakDetection.avgGrowth / 1024 / 1024)}MB`);
      console.log('');
    }

    if (profile.heapSnapshots.length > 0) {
      console.log(chalk.bold('Heap Snapshots:'));
      profile.heapSnapshots.forEach((snapshot, i) => {
        console.log(`${i + 1}. ${snapshot.file} (${snapshot.duration}ms)`);
      });
      console.log('');
    }

    if (profile.recommendations.length > 0) {
      console.log(chalk.bold('Recommendations:'));
      profile.recommendations.forEach(rec => {
        const icon = rec.severity === 'critical' ? '🔴' : rec.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${rec.message}`);
      });
    }
  }

  /**
   * Display database profile
   */
  static displayDatabaseProfile(profile) {
    console.log(chalk.bold.cyan('Database Profile Results:\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(`Total Queries: ${profile.queries.total}`);
    console.log(`Slow Queries: ${profile.queries.slow} (${profile.queries.slowPercent}%)`);
    console.log(`Average Duration: ${profile.queries.avgDuration}ms\n`);

    if (profile.slowQueries.length > 0) {
      console.log(chalk.bold('Slowest Queries (Top 5):'));
      profile.slowQueries.slice(0, 5).forEach((query, i) => {
        console.log(`${i + 1}. ${chalk.yellow(query.query.substring(0, 60))}...`);
        console.log(`   Duration: ${query.duration}ms | Table: ${query.table}`);
      });
      console.log('');
    }

    if (profile.n1Patterns.length > 0) {
      console.log(chalk.red.bold('⚠️  N+1 Query Patterns Detected:'));
      profile.n1Patterns.forEach((pattern, i) => {
        console.log(`${i + 1}. Executions: ${pattern.executions} | Total: ${pattern.totalDuration}ms`);
      });
      console.log('');
    }
  }

  /**
   * Run analysis
   */
  static async analyze(options = {}) {
    const spinner = ora('Running performance analysis...').start();

    try {
      if (!monitoringInstances) {
        spinner.fail('Monitoring is not running');
        console.log(chalk.gray('\nStart monitoring with: tryforge monitor start\n'));
        return;
      }

      const analysis = runAnalysis(monitoringInstances);

      spinner.succeed('Analysis complete');

      console.log(chalk.bold.cyan('\n📈 Performance Analysis\n'));
      console.log(chalk.gray('━'.repeat(60)));

      // Bottlenecks
      if (analysis.bottlenecks) {
        const { bottlenecks, criticalCount, warningCount } = analysis.bottlenecks;

        console.log(chalk.bold('Bottlenecks Found:'));
        console.log(`  Critical: ${chalk.red(criticalCount)}`);
        console.log(`  Warning: ${chalk.yellow(warningCount)}`);
        console.log(`  Total: ${bottlenecks.length}\n`);

        if (bottlenecks.length > 0) {
          console.log(chalk.bold('Top Bottlenecks:'));
          bottlenecks.slice(0, 5).forEach((bottleneck, i) => {
            const icon = bottleneck.severity === 'critical' ? '🔴' : '⚠️';
            console.log(`${icon} ${bottleneck.title}`);
            console.log(chalk.gray(`   ${bottleneck.description}`));
          });
          console.log('');
        }

        // Recommendations
        if (analysis.bottlenecks.recommendations.length > 0) {
          console.log(chalk.bold('Recommendations:'));
          analysis.bottlenecks.recommendations.forEach(rec => {
            console.log(`\n${chalk.yellow(rec.title)} [${rec.priority}]`);
            console.log(chalk.gray(rec.description));
            if (rec.actions) {
              rec.actions.forEach(action => {
                if (typeof action === 'string') {
                  console.log(chalk.gray(`  • ${action}`));
                }
              });
            }
          });
        }
      }

      console.log(chalk.gray('\n━'.repeat(60)));

      logger.info('Analysis complete');

    } catch (error) {
      spinner.fail('Analysis failed');
      throw error;
    }
  }

  /**
   * Generate report
   */
  static async report(options = {}) {
    const spinner = ora('Generating performance report...').start();

    try {
      if (!monitoringInstances) {
        spinner.fail('Monitoring is not running');
        console.log(chalk.gray('\nStart monitoring with: tryforge monitor start\n'));
        return;
      }

      const period = options.period || 'daily';
      const format = options.format || 'text';

      const report = generateReport(monitoringInstances, period);

      spinner.succeed('Report generated');

      if (format === 'text') {
        const reporter = new SummaryReporter();
        const output = reporter.export(report, 'text');
        console.log(output);
      }

      // Save report to file if requested
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        const reporter = new SummaryReporter();

        let content;
        if (format === 'json') {
          content = reporter.export(report, 'json');
        } else if (format === 'markdown') {
          content = reporter.export(report, 'markdown');
        } else {
          content = reporter.export(report, 'text');
        }

        await fs.writeFile(outputPath, content, 'utf8');
        console.log(chalk.green(`\n✓ Report saved to: ${outputPath}`));
      }

      logger.info('Report generated', { period, format });

    } catch (error) {
      spinner.fail('Report generation failed');
      throw error;
    }
  }

  /**
   * Export monitoring data
   */
  static async export(options = {}) {
    const spinner = ora('Exporting monitoring data...').start();

    try {
      if (!monitoringInstances) {
        spinner.fail('Monitoring is not running');
        return;
      }

      const format = options.format || 'json';
      const output = options.output || `monitoring-export-${Date.now()}.${format === 'prometheus' ? 'txt' : 'json'}`;

      const data = exportData(monitoringInstances, format);

      const outputPath = path.resolve(process.cwd(), output);
      await fs.writeFile(outputPath, data, 'utf8');

      spinner.succeed(`Data exported to: ${outputPath}`);
      logger.info('Data exported', { format, output });

    } catch (error) {
      spinner.fail('Export failed');
      throw error;
    }
  }
}

module.exports = MonitorCommand;
