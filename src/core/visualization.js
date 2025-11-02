/**
 * Data Visualization Components
 * Generate charts and dashboards
 */

const Logger = require('../utils/logger');

class DataVisualization {
  constructor(options = {}) {
    this.logger = new Logger();
    this.theme = options.theme || 'light';
  }

  /**
   * Generate chart configuration for various chart libraries
   */
  createChartConfig(type, data, options = {}) {
    switch (type) {
      case 'line':
        return this.createLineChart(data, options);
      case 'bar':
        return this.createBarChart(data, options);
      case 'pie':
        return this.createPieChart(data, options);
      case 'area':
        return this.createAreaChart(data, options);
      case 'scatter':
        return this.createScatterChart(data, options);
      case 'heatmap':
        return this.createHeatmap(data, options);
      default:
        throw new Error(`Unknown chart type: ${type}`);
    }
  }

  createLineChart(data, options) {
    return {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: data.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.color || this.getColor(index),
          backgroundColor: this.addAlpha(dataset.color || this.getColor(index), 0.1),
          fill: options.fill !== false,
          tension: options.tension || 0.4
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title
          },
          legend: {
            display: options.legend !== false
          }
        },
        scales: {
          y: {
            beginAtZero: options.beginAtZero !== false
          }
        }
      }
    };
  }

  createBarChart(data, options) {
    return {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.colors || this.getColorArray(dataset.data.length),
          borderColor: dataset.borderColors || this.getColorArray(dataset.data.length),
          borderWidth: options.borderWidth || 1
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        indexAxis: options.horizontal ? 'y' : 'x'
      }
    };
  }

  createPieChart(data, options) {
    return {
      type: 'pie',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values,
          backgroundColor: data.colors || this.getColorArray(data.values.length),
          borderWidth: options.borderWidth || 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title
          },
          legend: {
            position: options.legendPosition || 'right'
          }
        }
      }
    };
  }

  createAreaChart(data, options) {
    const config = this.createLineChart(data, { ...options, fill: true });
    config.type = 'line';
    return config;
  }

  createScatterChart(data, options) {
    return {
      type: 'scatter',
      data: {
        datasets: data.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.points, // [{ x, y }, ...]
          backgroundColor: dataset.color || this.getColor(index)
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: !!options.xLabel,
              text: options.xLabel
            }
          },
          y: {
            title: {
              display: !!options.yLabel,
              text: options.yLabel
            }
          }
        }
      }
    };
  }

  createHeatmap(data, options) {
    return {
      type: 'matrix',
      data: {
        datasets: [{
          label: options.label || 'Heatmap',
          data: data.points, // [{ x, y, v }, ...]
          backgroundColor: (context) => {
            const value = context.dataset.data[context.dataIndex].v;
            return this.getHeatmapColor(value, data.min, data.max);
          },
          borderWidth: 1,
          width: options.cellWidth || 20,
          height: options.cellHeight || 20
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: () => '',
              label: (context) => {
                const v = context.dataset.data[context.dataIndex];
                return `(${v.x}, ${v.y}): ${v.v}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            labels: data.xLabels || []
          },
          y: {
            type: 'category',
            labels: data.yLabels || []
          }
        }
      }
    };
  }

  /**
   * Generate dashboard layout
   */
  createDashboard(widgets, options = {}) {
    return {
      layout: options.layout || 'grid',
      theme: this.theme,
      widgets: widgets.map(widget => ({
        id: widget.id || this.generateId(),
        type: widget.type,
        title: widget.title,
        position: widget.position || {},
        size: widget.size || { cols: 2, rows: 2 },
        config: widget.config || {},
        refreshInterval: widget.refreshInterval || null
      })),
      globalOptions: {
        refreshable: options.refreshable !== false,
        exportable: options.exportable !== false,
        draggable: options.draggable !== false
      }
    };
  }

  /**
   * Generate React component code for chart
   */
  generateReactChart(type, data, options = {}) {
    const chartConfig = this.createChartConfig(type, data, options);
    
    return `import React from 'react';
import { ${this.getChartComponentName(type)} } from 'react-chartjs-2';

export default function ${options.componentName || 'Chart'}() {
  const data = ${JSON.stringify(chartConfig.data, null, 2)};
  const options = ${JSON.stringify(chartConfig.options, null, 2)};

  return (
    <div className="chart-container">
      <${this.getChartComponentName(type)} data={data} options={options} />
    </div>
  );
}`;
  }

  /**
   * Generate dashboard React component
   */
  generateReactDashboard(dashboard, options = {}) {
    return `import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Grid container spacing={3}>
      ${dashboard.widgets.map(widget => `
      <Grid item xs={12} md={${widget.size.cols * 4}} key="${widget.id}">
        <Paper sx={{ p: 2, height: ${widget.size.rows * 200} }}>
          <Typography variant="h6" gutterBottom>
            ${widget.title}
          </Typography>
          {/* ${widget.type} widget */}
        </Paper>
      </Grid>`).join('')}
    </Grid>
  );
}`;
  }

  /**
   * Data transformation utilities
   */
  transformData(data, transformType) {
    switch (transformType) {
      case 'timeSeries':
        return this.transformToTimeSeries(data);
      case 'aggregate':
        return this.transformToAggregate(data);
      case 'normalize':
        return this.normalizeData(data);
      default:
        return data;
    }
  }

  transformToTimeSeries(data) {
    // Group by time intervals
    const grouped = {};
    
    for (const item of data) {
      const timestamp = new Date(item.timestamp).toISOString().split('T')[0];
      if (!grouped[timestamp]) {
        grouped[timestamp] = [];
      }
      grouped[timestamp].push(item.value);
    }
    
    return {
      labels: Object.keys(grouped).sort(),
      datasets: [{
        label: 'Value',
        data: Object.keys(grouped).sort().map(key => {
          const values = grouped[key];
          return values.reduce((a, b) => a + b, 0) / values.length;
        })
      }]
    };
  }

  transformToAggregate(data) {
    const aggregated = {};
    
    for (const item of data) {
      const key = item.category;
      if (!aggregated[key]) {
        aggregated[key] = 0;
      }
      aggregated[key] += item.value;
    }
    
    return {
      labels: Object.keys(aggregated),
      values: Object.values(aggregated)
    };
  }

  normalizeData(data) {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return data.map(d => ({
      ...d,
      normalizedValue: range === 0 ? 0 : (d.value - min) / range
    }));
  }

  // Helper methods
  getColor(index) {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    return colors[index % colors.length];
  }

  getColorArray(count) {
    return Array.from({ length: count }, (_, i) => this.getColor(i));
  }

  addAlpha(color, alpha) {
    // Simple hex to rgba conversion
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getHeatmapColor(value, min, max) {
    const normalized = (value - min) / (max - min);
    const hue = (1 - normalized) * 240; // Blue to red
    return `hsl(${hue}, 100%, 50%)`;
  }

  getChartComponentName(type) {
    const names = {
      line: 'Line',
      bar: 'Bar',
      pie: 'Pie',
      area: 'Line',
      scatter: 'Scatter',
      heatmap: 'Chart'
    };
    return names[type] || 'Chart';
  }

  generateId() {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = DataVisualization;
