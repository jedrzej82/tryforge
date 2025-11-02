/**
 * DB Monitoring CLI Extension
 * Extension to add monitoring commands to the DB CLI
 *
 * Usage: Add these methods to DbCommand class or import them
 */

const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const {
  DatabaseHealthCheck,
  PerformanceMonitor,
  ConnectionMonitor,
  MetricsCollector,
  initializeMonitoring,
  startMonitoring,
  stopMonitoring,
  startHealthServer,
} = require('./index');

class DbMonitoringCommands {
  /**
   * Get database config (same as DbCommand.getDbConfig)
   */
  static getDbConfig() {
    require('dotenv').config();

    const databaseUrl = process.env.DATABASE_URL ||
                       'postgresql://devuser:devpass123@localhost:5432/app_db';

    const url = new URL(databaseUrl);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }

  /**
   * Check database health
   */
  static async health() {
    console.log(chalk.cyan.bold('\n🏥 Database Health Check\n'));

    const spinner = ora('Checking database health...').start();

    try {
      const config = this.getDbConfig();
      const healthCheck = new DatabaseHealthCheck(config);

      const health = await healthCheck.checkHealth();

      spinner.stop();

      // Display overall status
      const statusEmoji = health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌';
      const statusColor = health.status === 'healthy' ? 'green' : health.status === 'degraded' ? 'yellow' : 'red';

      console.log(chalk[statusColor].bold(`\n${statusEmoji} Status: ${health.status.toUpperCase()}\n`));

      // Display individual checks
      console.log(chalk.bold('Health Checks:'));
      health.checks.forEach(check => {
        const icon = check.healthy ? (check.warning ? '⚠️' : '✅') : '❌';
        const color = check.healthy ? (check.warning ? 'yellow' : 'green') : 'red';

        console.log(chalk[color](`  ${icon} ${check.name}`));

        if (check.details) {
          Object.entries(check.details).forEach(([key, value]) => {
            console.log(chalk.gray(`      ${key}: ${value}`));
          });
        }

        if (check.error) {
          console.log(chalk.red(`      Error: ${check.error}`));
        }
      });

      console.log(chalk.gray(`\nCheck completed in ${health.duration}ms\n`));

    } catch (error) {
      spinner.fail(chalk.red('Health check failed'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Show database statistics
   */
  static async stats() {
    console.log(chalk.cyan.bold('\n📊 Database Statistics\n'));

    const spinner = ora('Collecting statistics...').start();

    try {
      const config = this.getDbConfig();
      const perfMonitor = new PerformanceMonitor(config);

      // Get table statistics
      spinner.text = 'Fetching table statistics...';
      const tableStats = await perfMonitor.getTableStats();

      spinner.stop();

      if (tableStats.error) {
        console.log(chalk.red(`\n❌ Error: ${tableStats.error}\n`));
        return;
      }

      // Display table statistics
      console.log(chalk.bold('Table Statistics:'));
      console.log(chalk.gray(`Total tables: ${tableStats.totalTables}\n`));

      if (tableStats.tables.length > 0) {
        console.log(chalk.bold('Top 10 Tables by Size:'));
        tableStats.tables.slice(0, 10).forEach((table, idx) => {
          console.log(chalk.cyan(`  ${idx + 1}. ${table.tablename}`));
          console.log(chalk.gray(`     Total Size: ${table.total_size}`));
          console.log(chalk.gray(`     Rows: ${table.live_tuples} live, ${table.dead_tuples} dead`));
        });
      }

      // Display recommendations
      if (tableStats.recommendations.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:'));
        tableStats.recommendations.forEach(rec => {
          const icon = rec.type === 'warning' ? '⚠️' : '✅';
          const color = rec.type === 'warning' ? 'yellow' : 'green';
          console.log(chalk[color](`  ${icon} ${rec.message}`));
        });
      }

      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Failed to collect statistics'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  /**
   * Show connection pool status
   */
  static async connections() {
    console.log(chalk.cyan.bold('\n🔌 Connection Pool Status\n'));

    try {
      const config = this.getDbConfig();
      const { Pool } = require('pg');
      const pool = new Pool(config);
      const monitor = new ConnectionMonitor(pool);

      const stats = monitor.getPoolStats();

      console.log(chalk.bold('Connection Pool:'));
      console.log(chalk.cyan(`  Total: ${stats.total}/${stats.maxSize}`));
      console.log(chalk.cyan(`  Active: ${stats.active}`));
      console.log(chalk.cyan(`  Idle: ${stats.idle}`));
      console.log(chalk.cyan(`  Waiting: ${stats.waiting}`));
      console.log(chalk.cyan(`  Usage: ${stats.usagePercent.toFixed(2)}%`));

      // Warning if usage is high
      if (stats.usagePercent > 80) {
        console.log(chalk.yellow('\n⚠️  Warning: Connection pool usage is high'));
      }

      await pool.end();
      console.log();

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  /**
   * Show slow queries
   */
  static async slowQueries(threshold = 1000) {
    console.log(chalk.cyan.bold('\n🐌 Slow Queries\n'));

    const spinner = ora('Analyzing query performance...').start();

    try {
      const config = this.getDbConfig();
      const perfMonitor = new PerformanceMonitor(config);

      // Track some queries to get data
      spinner.text = 'Checking for slow queries...';

      // Get slow queries from database statistics
      const indexUsage = await perfMonitor.getIndexUsage();

      spinner.stop();

      if (indexUsage.error) {
        console.log(chalk.yellow(`\n⚠️  ${indexUsage.message}\n`));
        return;
      }

      console.log(chalk.bold('Index Usage:'));
      console.log(chalk.gray(`Total indexes: ${indexUsage.total}`));
      console.log(chalk.gray(`Unused indexes: ${indexUsage.unused.length}\n`));

      if (indexUsage.unused.length > 0) {
        console.log(chalk.bold('Unused Indexes:'));
        indexUsage.unused.slice(0, 10).forEach(index => {
          console.log(chalk.yellow(`  ⚠️  ${index.indexname} on ${index.tablename} (${index.index_size})`));
        });
      }

      // Display recommendations
      if (indexUsage.recommendations.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:'));
        indexUsage.recommendations.slice(0, 5).forEach(rec => {
          const icon = rec.type === 'warning' ? '⚠️' : '✅';
          const color = rec.type === 'warning' ? 'yellow' : 'green';
          console.log(chalk[color](`  ${icon} ${rec.message}`));
        });
      }

      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Failed to analyze queries'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  /**
   * Start monitoring
   */
  static async monitor() {
    console.log(chalk.cyan.bold('\n📡 Starting Database Monitoring\n'));

    try {
      const config = this.getDbConfig();

      // Initialize monitoring
      const monitoring = initializeMonitoring({
        database: config,
      });

      // Start monitoring
      startMonitoring(monitoring);

      console.log(chalk.green('✅ Monitoring started successfully\n'));

      // Start health check server
      const port = process.env.HEALTH_CHECK_PORT || 9090;
      const server = startHealthServer(monitoring, port);

      console.log(chalk.cyan(`🌐 Health check server running on http://localhost:${port}`));
      console.log(chalk.gray(`   Health endpoint: http://localhost:${port}/health`));
      console.log(chalk.gray(`   Metrics endpoint: http://localhost:${port}/metrics`));
      console.log(chalk.gray(`   Dashboard: http://localhost:${port}/dashboard\n`));

      console.log(chalk.yellow('Press Ctrl+C to stop monitoring...\n'));

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n🛑 Stopping monitoring...\n'));

        server.close(() => {
          stopMonitoring(monitoring);
          console.log(chalk.green('✅ Monitoring stopped\n'));
          process.exit(0);
        });
      });

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  }

  /**
   * Show metrics
   */
  static async metrics(format = 'json') {
    console.log(chalk.cyan.bold('\n📈 Database Metrics\n'));

    const spinner = ora('Collecting metrics...').start();

    try {
      const config = this.getDbConfig();
      const collector = new MetricsCollector(config);

      const metrics = await collector.collect();

      spinner.stop();

      if (format === 'prometheus') {
        // Export Prometheus format
        const promMetrics = collector.exportPrometheus();
        console.log(promMetrics);
      } else {
        // Display JSON format
        console.log(chalk.bold('Current Metrics:\n'));

        if (metrics.queries) {
          console.log(chalk.cyan('Queries:'));
          console.log(chalk.gray(`  Total: ${metrics.queries.totalQueries}`));
          console.log(chalk.gray(`  Avg Time: ${metrics.queries.avgTime.toFixed(2)}ms`));
          console.log(chalk.gray(`  Max Time: ${metrics.queries.maxTime.toFixed(2)}ms\n`));
        }

        if (metrics.connections) {
          console.log(chalk.cyan('Connections:'));
          console.log(chalk.gray(`  Total: ${metrics.connections.total}`));
          console.log(chalk.gray(`  Active: ${metrics.connections.active}`));
          console.log(chalk.gray(`  Idle: ${metrics.connections.idle}\n`));
        }

        if (metrics.performance) {
          console.log(chalk.cyan('Performance:'));
          console.log(chalk.gray(`  DB Size: ${(metrics.performance.databaseSize / 1024 / 1024).toFixed(2)} MB`));
          console.log(chalk.gray(`  Cache Hit Ratio: ${metrics.performance.cacheHitRatio.toFixed(2)}%\n`));
        }
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to collect metrics'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  /**
   * Export metrics
   */
  static async exportMetrics(outputPath) {
    console.log(chalk.cyan.bold('\n💾 Exporting Metrics\n'));

    const spinner = ora('Collecting and exporting metrics...').start();

    try {
      const config = this.getDbConfig();
      const collector = new MetricsCollector(config);

      const metrics = await collector.collect();

      const output = outputPath || path.join(process.cwd(), 'metrics-export.json');
      await fs.writeJson(output, metrics, { spaces: 2 });

      spinner.succeed(chalk.green(`✅ Metrics exported to: ${output}\n`));

    } catch (error) {
      spinner.fail(chalk.red('Failed to export metrics'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }

  /**
   * Analyze a query
   */
  static async analyzeQuery(query) {
    console.log(chalk.cyan.bold('\n🔍 Query Analysis\n'));

    if (!query) {
      console.log(chalk.red('❌ Please provide a query to analyze\n'));
      return;
    }

    const spinner = ora('Analyzing query...').start();

    try {
      const config = this.getDbConfig();
      const perfMonitor = new PerformanceMonitor(config);

      const analysis = await perfMonitor.analyzeQuery(query);

      spinner.stop();

      if (analysis.error) {
        console.log(chalk.red(`\n❌ Error: ${analysis.error}\n`));
        return;
      }

      console.log(chalk.bold('Query:'));
      console.log(chalk.gray(`  ${analysis.query}\n`));

      console.log(chalk.bold('Analysis:'));
      console.log(chalk.cyan(`  Total Cost: ${analysis.analysis.totalCost.toFixed(2)}`));
      console.log(chalk.cyan(`  Execution Time: ${analysis.analysis.executionTime.toFixed(2)}ms`));
      console.log(chalk.cyan(`  Planning Time: ${analysis.analysis.planningTime.toFixed(2)}ms`));
      console.log(chalk.cyan(`  Rows Returned: ${analysis.analysis.rowsReturned}`));
      console.log(chalk.cyan(`  Sequential Scans: ${analysis.analysis.seqScans}`));
      console.log(chalk.cyan(`  Index Scans: ${analysis.analysis.indexScans}\n`));

      if (analysis.recommendations.length > 0) {
        console.log(chalk.bold('💡 Recommendations:'));
        analysis.recommendations.forEach(rec => {
          const icon = rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️';
          const color = rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'cyan';
          console.log(chalk[color](`  ${icon} ${rec.message}`));
        });
      }

      console.log();

    } catch (error) {
      spinner.fail(chalk.red('Query analysis failed'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
  }
}

module.exports = DbMonitoringCommands;
