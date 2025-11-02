# TryForge - User Guide

**Triple AI Application Framework - From idea to app in minutes!**

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/jedrzej82/tryforge.git
cd tryforge

# Install dependencies
npm install

# Make CLI available globally (optional)
npm link
```

### Create Your First App

```bash
# Simple blog
tryforge create "Blog platform with posts and comments"

# E-commerce store
tryforge create "E-commerce store for handmade jewelry"

# Social network
tryforge create "Social media app for sharing workouts"

# With options
tryforge create "Blog platform" --framework react --database postgresql --auth jwt
```

## Commands

### CREATE - Build New Applications

Create a complete application from natural language description:

```bash
tryforge create [description] [options]
```

**Examples:**

```bash
# Interactive mode
tryforge create

# Simple description
tryforge create "Todo app with user authentication"

# Detailed description
tryforge create "Project management tool with tasks, boards, teams, and real-time collaboration"

# With specific options
tryforge create "Blog platform" \
  --framework react \
  --styling tailwind \
  --database postgresql \
  --auth jwt \
  --graphics modern \
  --colors "purple blue"
```

**Options:**
- `--framework <type>` - react|vue|angular|svelte (default: react)
- `--styling <type>` - css|scss|tailwind|styled-components (default: css)
- `--database <type>` - postgresql|mysql|mongodb|sqlite (default: postgresql)
- `--auth <type>` - jwt|oauth|session|none (default: jwt)
- `--graphics <style>` - modern|minimalist|professional|playful (default: modern)
- `--colors <scheme>` - Color scheme (e.g., "purple blue")
- `--template <name>` - minimal|standard|full (default: standard)

### REFACTOR - Improve Existing Apps

Analyze and improve existing applications:

```bash
tryforge refactor [description] [options]
```

**Examples:**

```bash
# General improvements
tryforge refactor "modernize UI and improve performance"

# UI only
tryforge refactor "add dark mode and improve mobile experience"

# Performance only
tryforge refactor "optimize database queries and add caching"

# Security only
tryforge refactor "fix security vulnerabilities and add input validation"

# Specific component
tryforge refactor "improve HomePage component design"
```

**Options:**
- `--scope <area>` - ui|performance|security|quality|all (default: all)
- `--files <pattern>` - Specific files to refactor

### ANALYZE - Code Analysis

Analyze codebase for issues and opportunities:

```bash
tryforge analyze [type]
```

**Types:**
- `codebase` - Full codebase analysis (default)
- `performance` - Performance bottlenecks
- `security` - Security vulnerabilities
- `ui` - UI/UX issues
- `database` - Database optimization
- `bundle` - Bundle size analysis
- `dependencies` - Dependency audit

**Examples:**

```bash
tryforge analyze
tryforge analyze performance
tryforge analyze security
```

### TEST - Run Tests

Run tests on your application:

```bash
tryforge test [type] [options]
```

**Types:**
- `all` - All tests (default)
- `backend` - Backend tests only
- `frontend` - Frontend tests only
- `integration` - Integration tests
- `e2e` - End-to-end tests

**Options:**
- `--watch` - Watch mode

**Examples:**

```bash
tryforge test
tryforge test backend
tryforge test --watch
```

### BUILD - Production Build

Build application for production:

```bash
tryforge build [options]
```

**Options:**
- `--env <environment>` - development|staging|production (default: production)

**Examples:**

```bash
tryforge build
tryforge build --env staging
```

### START - Development Servers

Start all development servers:

```bash
tryforge start
```

This will:
1. Check and start PostgreSQL
2. Check and start Redis
3. Install dependencies if needed
4. Run database migrations
5. Start backend server (port 3000)
6. Start frontend dev server (port 5173)

### STOP - Stop All Servers

Stop all running servers:

```bash
tryforge stop
```

### DB - Database Operations

Database management commands:

```bash
# Reset database (drop, create, migrate, seed)
tryforge db:reset

# Run migrations
tryforge db:migrate

# Seed database with sample data
tryforge db:seed

# Backup database
tryforge db:backup
```

### STATUS - System Status

Check system and project status:

```bash
tryforge status
```

Shows:
- PostgreSQL status
- Redis status
- Node.js version
- Playwright availability
- Recent activity
- Project statistics

## How It Works

### Triple AI Architecture

TryForge uses three AI services working together:

1. **Claude (Orchestrator)** - The brain
   - Analyzes your requirements
   - Plans architecture
   - **Creates detailed prompts for other AIs**
   - Generates backend code
   - Integrates everything

2. **Pollinations AI (Graphics)** - Visual assets
   - **Receives prompts from Claude**
   - Generates custom graphics
   - Logos, hero images, icons, illustrations

3. **GitHub Spark (UI)** - Frontend components
   - **Receives descriptions from Claude**
   - Generates React/Vue components
   - Modern, responsive UI

### Workflow Example

```
User: "Blog platform with comments"
         ↓
Claude: Analyzes and creates plan
         ↓
    ┌────┴────┐
    ↓         ↓         ↓
Pollinations  Spark    Claude Backend
(graphics)    (UI)     (API & DB)
    ↓         ↓         ↓
    └────┬────┘
         ↓
Claude: Integrates everything
         ↓
Working Application!
```

## Project Structure

Generated projects have this structure:

```
my-app/
├── frontend/              # React/Vue frontend
│   ├── src/
│   │   ├── components/    # UI components (from Spark)
│   │   ├── pages/         # Page components
│   │   ├── assets/        # Graphics (from Pollinations)
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── server.js      # Server entry point
│   ├── sql/
│   │   ├── schema.sql     # Database schema
│   │   ├── migrations/    # Migrations
│   │   └── seeds/         # Seed data
│   └── package.json
│
├── docs/                  # Documentation
├── .env                   # Environment variables
├── .env.example           # Example env file
└── README.md              # Project README
```

## Environment Variables

Create `.env` file in your project root:

```bash
# Database
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/myapp_db
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass123
POSTGRES_DB=myapp_db

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## Tips & Best Practices

### 1. Be Specific in Descriptions

**Good:**
```bash
tryforge create "E-commerce store for handmade jewelry with product catalog, shopping cart, checkout with Stripe, user reviews, and admin dashboard"
```

**Too vague:**
```bash
tryforge create "make me a website"
```

### 2. Use Templates for Speed

```bash
# Minimal - fastest generation (2-3 min)
tryforge create "Blog" --template minimal

# Standard - balanced (4-6 min)
tryforge create "Blog" --template standard

# Full - all features (8-12 min)
tryforge create "Blog" --template full
```

### 3. Iterate with Refactor

```bash
# Start simple
tryforge create "Simple blog"

# Then improve
tryforge refactor "add dark mode"
tryforge refactor "improve performance"
tryforge refactor "add comment system"
```

### 4. Analyze Before Refactoring

```bash
# Always analyze first
tryforge analyze

# Then refactor based on results
tryforge refactor "fix critical issues"
```

## Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Create devuser if doesn't exist
sudo -u postgres createuser -s devuser
sudo -u postgres psql -c "ALTER USER devuser WITH PASSWORD 'devpass123';"
```

### npm Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### GitHub Spark Authentication

```bash
# Delete saved session to force re-login
rm -rf ~/.tryforge/.github-session/

# Run create command again - will prompt for login
tryforge create "test app"
```

## Examples

### Example 1: Blog Platform

```bash
tryforge create "Blog platform with posts, categories, comments, and user authentication" \
  --framework react \
  --styling tailwind \
  --database postgresql \
  --auth jwt \
  --graphics modern
```

Generated features:
- User registration/login
- Post creation and editing
- Categories
- Comments system
- Responsive design
- Dark mode
- Custom logo and graphics

### Example 2: E-commerce Store

```bash
tryforge create "E-commerce store for handmade crafts with products, cart, checkout, and admin panel" \
  --framework react \
  --database postgresql \
  --auth jwt \
  --graphics professional
```

Generated features:
- Product catalog
- Shopping cart
- Checkout flow
- User authentication
- Admin dashboard
- Order management
- Payment integration (ready for Stripe)

### Example 3: Social Network

```bash
tryforge create "Social media platform with posts, comments, friends, and real-time messaging" \
  --framework react \
  --database postgresql \
  --auth jwt \
  --graphics playful
```

Generated features:
- User profiles
- Post creation
- Comments
- Friend system
- Real-time messaging (WebSocket)
- Notifications
- News feed

## Support

- **Documentation**: See all `.md` files in this repository
- **Issues**: https://github.com/jedrzej82/tryforge/issues
- **Examples**: See `examples/` directory

## License

MIT

---

**TryForge - From idea to production-ready app in minutes!** 🚀
