# 🔥 TryForge CLI - Quick Start

## Installation

```bash
# Install dependencies
npm install

# Link CLI globally
npm link

# Verify installation
tryforge --version
```

## First Steps

```bash
# Initialize TryForge
tryforge init

# Configure your API keys
cp .env.example .env
# Edit .env and add your keys

# Create your first app
tryforge create my-first-app
```

## Basic Commands

### Create a New Application

```bash
# Interactive mode (recommended)
tryforge create my-app

# Specify application type
tryforge create blog --type blog
tryforge create store --type ecommerce
tryforge create dashboard --type dashboard

# Skip AI-generated graphics
tryforge create my-app --no-graphics

# Backend only
tryforge create api --no-frontend

# Frontend only
tryforge create ui --no-backend
```

### Analyze Existing Code

```bash
# Full analysis
tryforge analyze ./my-app

# Security audit
tryforge analyze ./my-app --security

# Performance analysis
tryforge analyze ./my-app --performance

# Code complexity
tryforge analyze ./my-app --complexity
```

### Refactor and Improve

```bash
# Get improvement suggestions
tryforge refactor ./my-app

# Focus on specific area
tryforge refactor ./my-app --focus ui
tryforge refactor ./my-app --focus performance
tryforge refactor ./my-app --focus security

# Auto-apply changes
tryforge refactor ./my-app --auto

# Generate report only
tryforge refactor ./my-app --report
```

### Deploy

```bash
# Deploy to production
tryforge deploy ./my-app

# Deploy with Docker
tryforge deploy ./my-app --docker

# Deploy to staging
tryforge deploy ./my-app --env staging

# Verify deployment
tryforge deploy ./my-app --verify
```

## Application Types

- **blog** - Full-featured blog platform
- **ecommerce** - Online store with cart and checkout
- **social** - Social media application
- **saas** - SaaS application template
- **dashboard** - Admin dashboard with analytics
- **webapp** - General web application

## Advanced Usage

### Using Modules Programmatically

#### Web Crawler

```javascript
const { WebCrawler } = require('tryforge/src/core/crawler');

const crawler = new WebCrawler();
const data = await crawler.crawl('https://example.com');
await crawler.close();
```

#### Background Jobs

```javascript
const { JobProcessor } = require('tryforge/src/core/jobs');

const jobs = new JobProcessor();
await jobs.addJob('emails', { to: 'user@example.com', subject: 'Hello' });
jobs.processQueue('emails', async (data) => {
  // Process job
});
```

#### Rate Limiting

```javascript
const express = require('express');
const { RateLimiter } = require('tryforge/src/core/rate-limiter');

const app = express();
const limiter = new RateLimiter();

app.use('/api/', limiter.middleware({
  max: 100,
  windowMs: 60000
}));
```

#### Real-Time Analytics

```javascript
const { AnalyticsEngine } = require('tryforge/src/core/analytics');

const analytics = new AnalyticsEngine();
await analytics.trackEvent('page_view', { page: '/home', userId: 123 });
const stats = await analytics.getDashboardData();
```

#### Big Data Processing

```javascript
const { BigDataProcessor } = require('tryforge/src/core/big-data');

const processor = new BigDataProcessor();
await processor.batchInsert('users', records);
const results = await processor.processParallel(data, async (item) => {
  return processItem(item);
});
```

#### Data Visualization

```javascript
const { DataVisualization } = require('tryforge/src/core/visualization');

const viz = new DataVisualization();
const chartConfig = viz.createChartConfig('line', {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{ label: 'Sales', data: [100, 200, 150] }]
});
```

## Configuration

Edit `.tryforge/config.json`:

```json
{
  "version": "1.0.0",
  "tripleAI": {
    "claude": { "enabled": true },
    "githubSpark": { "enabled": true },
    "pollinations": { "enabled": true }
  },
  "defaults": {
    "projectType": "webapp",
    "generateGraphics": true,
    "includeFrontend": true,
    "includeBackend": true
  }
}
```

## Environment Variables

Required in `.env`:

```env
# AI Services
CLAUDE_API_KEY=your_key
GITHUB_TOKEN=your_token

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis (for jobs and rate limiting)
REDIS_URL=redis://localhost:6379

# Optional
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tryforge
DB_USER=postgres
DB_PASSWORD=password
```

## Examples

See `/examples` directory:
- `examples/blog-app/` - Blog platform example
- More examples coming soon!

## Documentation

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete feature guide
- **[ROADMAP.md](./ROADMAP.md)** - Future plans and features
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (Polish)
- **[CREATE_MODE.md](./CREATE_MODE.md)** - Creating apps guide (Polish)
- **[REFACTOR_MODE.md](./REFACTOR_MODE.md)** - Refactoring guide (Polish)

## Troubleshooting

### Redis Not Connected
```bash
# Start Redis
redis-server

# Verify
redis-cli ping
```

### PostgreSQL Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Command Not Found
```bash
# Re-link CLI
npm link

# Or use npx
npx tryforge create my-app
```

## Support

- GitHub Issues: [Report bugs](https://github.com/jedrzej82/tryforge/issues)
- Documentation: This repository
- Examples: `/examples` directory

## License

MIT - See [LICENSE](./LICENSE) file

---

**🔥 TryForge - Triple AI Application Framework**

*Build production-ready apps in minutes with Claude + GitHub Spark + Pollinations AI*
