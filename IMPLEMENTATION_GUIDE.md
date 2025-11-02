# 🚀 TryForge Implementation Guide

## Getting Started with Full Functionality

This guide covers all implemented features of TryForge.

## Installation

```bash
# Clone the repository
git clone https://github.com/jedrzej82/tryforge.git
cd tryforge

# Install dependencies
npm install

# Make CLI globally available
npm link

# Initialize TryForge
tryforge init
```

## Configuration

1. Copy `.env.example` to `.env`
2. Add your API keys:

```env
CLAUDE_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

## Core Features

### 1. CREATE Mode

Create a new application from scratch:

```bash
# Interactive mode
tryforge create my-app

# With options
tryforge create my-blog --type blog
tryforge create my-store --type ecommerce --no-graphics
tryforge create api-service --no-frontend
```

**Supported Types:**
- `blog` - Blog platform
- `ecommerce` - E-commerce store
- `social` - Social media app
- `saas` - SaaS application
- `dashboard` - Admin dashboard
- `webapp` - General web application

### 2. REFACTOR Mode

Improve existing applications:

```bash
# Analyze and suggest improvements
tryforge refactor ./my-app

# Focus on specific area
tryforge refactor ./my-app --focus ui
tryforge refactor ./my-app --focus performance
tryforge refactor ./my-app --focus security

# Auto-apply changes
tryforge refactor ./my-app --auto
```

### 3. ANALYZE Mode

Deep analysis of your codebase:

```bash
# Full analysis
tryforge analyze ./my-app

# Specific analyses
tryforge analyze ./my-app --complexity
tryforge analyze ./my-app --security
tryforge analyze ./my-app --performance
```

### 4. DEPLOY Mode

Deploy to production:

```bash
# Deploy
tryforge deploy ./my-app

# Deploy with Docker
tryforge deploy ./my-app --docker

# Deploy to specific environment
tryforge deploy ./my-app --env staging
```

## Advanced Features

### Web Crawler

Use the built-in web crawler for data collection:

```javascript
const { WebCrawler } = require('tryforge/src/core/crawler');

const crawler = new WebCrawler({
  headless: true,
  rateLimit: 1000,
  maxConcurrent: 5
});

// Crawl a single URL
const result = await crawler.crawl('https://example.com', {
  selectors: {
    title: 'h1',
    description: 'p.description',
    links: 'a'
  }
});

// Crawl multiple URLs
const urls = ['https://site1.com', 'https://site2.com'];
const results = await crawler.crawlMultiple(urls);

await crawler.close();
```

### Background Jobs

Process background jobs with queues:

```javascript
const { JobProcessor } = require('tryforge/src/core/jobs');

const processor = new JobProcessor({
  host: 'localhost',
  port: 6379
});

// Create a queue
const emailQueue = processor.createQueue('emails');

// Add jobs
await processor.addJob('emails', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Hello...'
});

// Process jobs
processor.processQueue('emails', async (jobData) => {
  // Send email
  console.log(`Sending email to ${jobData.to}`);
  await sendEmail(jobData);
}, { concurrency: 3 });

// Schedule recurring jobs
await processor.scheduleJob('reports', {
  reportType: 'daily'
}, '0 9 * * *'); // Every day at 9 AM
```

### Rate Limiting

Add rate limiting to your APIs:

```javascript
const express = require('express');
const { RateLimiter } = require('tryforge/src/core/rate-limiter');

const app = express();
const limiter = new RateLimiter();

// Apply rate limiting
app.use('/api/', limiter.middleware({
  max: 100,           // 100 requests
  windowMs: 60000,    // per minute
  strategy: 'sliding' // sliding window algorithm
}));

// Quota system
app.get('/api/data', async (req, res) => {
  const quota = await limiter.checkQuota(
    req.user.id,
    'api-calls',
    1000,  // 1000 calls
    'daily' // per day
  );
  
  if (!quota.allowed) {
    return res.status(429).json({
      error: 'Quota exceeded',
      remaining: quota.remaining
    });
  }
  
  res.json({ data: 'response' });
});
```

### Triple AI Orchestration

Use the Triple AI system programmatically:

```javascript
const { TripleAI } = require('tryforge');

const tripleAI = new TripleAI({
  claudeKey: process.env.CLAUDE_API_KEY,
  githubToken: process.env.GITHUB_TOKEN
});

// Generate full project architecture
const result = await tripleAI.orchestrate(
  'E-commerce store for handmade jewelry',
  {
    type: 'ecommerce',
    graphics: true
  }
);

console.log('Architecture:', result.architecture);
console.log('Components:', result.components);
console.log('Graphics:', result.graphics);
```

## Project Templates

### Basic Web Application

```bash
tryforge create my-app --template basic-web
```

Includes:
- React frontend
- Express backend
- PostgreSQL database
- User authentication
- Basic CRUD operations

### API Service

```bash
tryforge create my-api --template api-service
```

Includes:
- REST API with Express
- API documentation (OpenAPI)
- Rate limiting
- Authentication middleware
- Database integration

### Full-Stack SaaS

```bash
tryforge create my-saas --template saas
```

Includes:
- Multi-tenant architecture
- Subscription management
- Payment integration
- Admin dashboard
- User portal

## Examples

See the `/examples` directory for complete working examples:

- **Blog Platform** - Full-featured blog with comments
- **E-commerce Store** - Online store with cart and checkout
- **Dashboard** - Admin panel with analytics
- **Social Network** - Basic social media app

## Testing

Run tests:

```bash
npm test
```

## Troubleshooting

### Common Issues

**1. Redis Connection Failed**
```bash
# Make sure Redis is running
redis-cli ping
# Should return: PONG
```

**2. Database Connection Error**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

**3. CLI Command Not Found**
```bash
# Re-link the CLI
npm link
```

## Best Practices

1. **Always initialize** before creating projects: `tryforge init`
2. **Use version control** for your generated projects
3. **Test locally** before deploying
4. **Monitor rate limits** in production
5. **Keep dependencies updated**

## Performance Tips

- Use Redis caching for frequently accessed data
- Implement background jobs for heavy operations
- Apply rate limiting to prevent abuse
- Use the web crawler responsibly with rate limits
- Monitor job queues for bottlenecks

## Security Guidelines

- Never commit `.env` files
- Use environment variables for secrets
- Apply rate limiting to all public APIs
- Validate all user inputs
- Keep dependencies updated
- Use HTTPS in production

## Next Steps

- Read the [ROADMAP.md](../ROADMAP.md) for upcoming features
- Check out [Examples](../examples/) for inspiration
- Join the community and contribute
- Build something amazing! 🚀

## Support

- **Documentation**: This repository
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with 🔥 TryForge - Triple AI Application Framework**
