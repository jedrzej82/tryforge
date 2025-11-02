/**
 * Health Check HTTP Endpoints
 * Provides HTTP endpoints for database health monitoring
 */

const express = require('express');

/**
 * Create health check endpoints
 * @param {Object} components - Monitoring components
 * @returns {Router} Express router
 */
function createHealthEndpoint(components = {}) {
  const router = express.Router();

  const {
    healthCheck,
    performanceMonitor,
    connectionMonitor,
    metricsCollector,
    queryLogger,
    alertManager,
    dashboardData,
  } = components;

  /**
   * GET /health - Overall health status
   */
  router.get('/health', async (req, res) => {
    try {
      if (!healthCheck) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Health check not configured',
        });
      }

      const health = await healthCheck.checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  /**
   * GET /health/connection - Connection health check
   */
  router.get('/health/connection', async (req, res) => {
    try {
      if (!healthCheck) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Health check not configured',
        });
      }

      const check = await healthCheck.checkConnection();
      const statusCode = check.healthy ? 200 : 503;

      res.status(statusCode).json(check);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /health/performance - Performance health check
   */
  router.get('/health/performance', async (req, res) => {
    try {
      if (!healthCheck) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Health check not configured',
        });
      }

      const check = await healthCheck.checkQueryPerformance();
      const statusCode = check.healthy ? 200 : 503;

      res.status(statusCode).json(check);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /health/live - Liveness probe (simple check)
   */
  router.get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date(),
    });
  });

  /**
   * GET /health/ready - Readiness probe
   */
  router.get('/health/ready', async (req, res) => {
    try {
      if (!healthCheck) {
        return res.status(503).json({
          status: 'not_ready',
          message: 'Health check not configured',
        });
      }

      const connectionCheck = await healthCheck.checkConnection();

      if (connectionCheck.healthy) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date(),
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          reason: connectionCheck.error || 'Database not accessible',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        error: error.message,
        timestamp: new Date(),
      });
    }
  });

  /**
   * GET /metrics - Prometheus metrics
   */
  router.get('/metrics', async (req, res) => {
    try {
      if (!metricsCollector) {
        return res.status(503).send('# Metrics collector not configured\n');
      }

      const metrics = metricsCollector.exportPrometheus();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(500).send(`# Error: ${error.message}\n`);
    }
  });

  /**
   * GET /metrics/json - Metrics in JSON format
   */
  router.get('/metrics/json', async (req, res) => {
    try {
      if (!metricsCollector) {
        return res.status(503).json({
          error: 'Metrics collector not configured',
        });
      }

      const metrics = await metricsCollector.collect();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /dashboard - Dashboard overview
   */
  router.get('/dashboard', async (req, res) => {
    try {
      if (!dashboardData) {
        return res.status(503).json({
          error: 'Dashboard data not configured',
        });
      }

      const overview = await dashboardData.getOverview();
      res.json(overview);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /dashboard/performance - Performance summary
   */
  router.get('/dashboard/performance', async (req, res) => {
    try {
      if (!dashboardData) {
        return res.status(503).json({
          error: 'Dashboard data not configured',
        });
      }

      const performance = await dashboardData.getPerformanceSummary();
      res.json(performance);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /dashboard/recommendations - System recommendations
   */
  router.get('/dashboard/recommendations', async (req, res) => {
    try {
      if (!dashboardData) {
        return res.status(503).json({
          error: 'Dashboard data not configured',
        });
      }

      const recommendations = await dashboardData.getRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /performance/slow-queries - Slow queries
   */
  router.get('/performance/slow-queries', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const threshold = parseInt(req.query.threshold);

      let slowQueries = [];

      if (performanceMonitor) {
        slowQueries = performanceMonitor.getSlowQueries(threshold);
      } else if (queryLogger) {
        slowQueries = queryLogger.getSlowQueryLogs(limit);
      }

      res.json({
        count: slowQueries.length,
        queries: slowQueries.slice(0, limit),
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /performance/stats - Performance statistics
   */
  router.get('/performance/stats', (req, res) => {
    try {
      let stats = {};

      if (performanceMonitor) {
        stats = performanceMonitor.getQueryStats();
      } else if (queryLogger) {
        stats = queryLogger.getStatistics();
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /connections - Connection pool stats
   */
  router.get('/connections', (req, res) => {
    try {
      if (!connectionMonitor) {
        return res.status(503).json({
          error: 'Connection monitor not configured',
        });
      }

      const stats = connectionMonitor.getPoolStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /connections/leaks - Connection leak detection
   */
  router.get('/connections/leaks', (req, res) => {
    try {
      if (!connectionMonitor) {
        return res.status(503).json({
          error: 'Connection monitor not configured',
        });
      }

      const leaks = connectionMonitor.getLeakSuspects();
      res.json({
        count: leaks.length,
        suspects: leaks,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /alerts - Active alerts
   */
  router.get('/alerts', (req, res) => {
    try {
      if (!alertManager) {
        return res.status(503).json({
          error: 'Alert manager not configured',
        });
      }

      const activeAlerts = alertManager.getActiveAlerts();
      res.json({
        count: activeAlerts.length,
        alerts: activeAlerts,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /alerts/history - Alert history
   */
  router.get('/alerts/history', (req, res) => {
    try {
      if (!alertManager) {
        return res.status(503).json({
          error: 'Alert manager not configured',
        });
      }

      const limit = parseInt(req.query.limit) || 100;
      const severity = req.query.severity;

      const history = alertManager.getAlertHistory({
        limit,
        severity,
      });

      res.json({
        count: history.length,
        alerts: history,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /alerts/stats - Alert statistics
   */
  router.get('/alerts/stats', (req, res) => {
    try {
      if (!alertManager) {
        return res.status(503).json({
          error: 'Alert manager not configured',
        });
      }

      const stats = alertManager.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  /**
   * GET /status - Complete system status
   */
  router.get('/status', async (req, res) => {
    try {
      const status = {
        timestamp: new Date(),
        components: {},
      };

      // Health check status
      if (healthCheck) {
        status.health = await healthCheck.checkHealth();
      }

      // Performance monitor status
      if (performanceMonitor) {
        status.components.performanceMonitor = 'active';
      }

      // Connection monitor status
      if (connectionMonitor) {
        status.components.connectionMonitor = connectionMonitor.getStatus();
      }

      // Metrics collector status
      if (metricsCollector) {
        status.components.metricsCollector = metricsCollector.getStatus();
      }

      // Query logger status
      if (queryLogger) {
        status.components.queryLogger = 'active';
      }

      // Alert manager status
      if (alertManager) {
        status.components.alertManager = alertManager.getStatistics();
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}

/**
 * Create a standalone health check server
 * @param {Object} components - Monitoring components
 * @param {number} port - Port to listen on
 * @returns {Object} Server instance
 */
function createHealthServer(components, port = 9090) {
  const app = express();

  // Add JSON middleware
  app.use(express.json());

  // Mount health endpoints
  app.use('/', createHealthEndpoint(components));

  // Start server
  const server = app.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
  });

  return server;
}

module.exports = {
  createHealthEndpoint,
  createHealthServer,
};
