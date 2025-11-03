# TryForge CLI Examples

Real-world examples for common use cases.

## Quick Examples

### Create a Blog

```bash
# Simple blog
tryforge create "Personal blog" --framework react --auth jwt

# Blog with specific features
tryforge create "Blog platform with comments and SEO" \
  --framework nextjs \
  --database postgresql \
  --auth oauth \
  --features "seo,comments,analytics"
```

### Create an E-commerce Store

```bash
# Basic store
tryforge create "E-commerce store for handmade crafts" \
  --framework react \
  --database mongodb \
  --auth jwt \
  --features "cart,checkout,payments,inventory"

# Advanced store with Stripe
tryforge create "Online jewelry store" \
  --framework nextjs \
  --database postgresql \
  --features "cart,stripe,admin,analytics"
```

### Create a Dashboard

```bash
# Analytics dashboard
tryforge create "Analytics dashboard" \
  --framework vue \
  --styling tailwind \
  --database postgresql \
  --features "charts,realtime,export"
```

### Create a REST API

```bash
# Basic API
tryforge create "REST API for mobile app" \
  --template api \
  --framework express \
  --database mysql \
  --auth jwt

# API with documentation
tryforge create "API with Swagger docs" \
  --framework express \
  --database postgresql \
  --features "swagger,rate-limiting,logging"
```

## Auto-Generate Database Models

### From Description

```bash
# E-commerce models
tryforge models:generate -d "E-commerce platform with users, products, orders, reviews, and payments"

# Social network models
tryforge models:generate -d "Social network with users, posts, comments, likes, and messages"

# Blog models
tryforge models:generate -d "Blog with posts, comments, categories, tags, and authors"
```

### Interactive Mode

```bash
# Review each model before generating
tryforge models:generate --interactive -d "Project management app"
```

### Detect Missing Models

```bash
# Scan code for undefined models
tryforge models:detect

# With specific ORM
tryforge models:detect --orm prisma
```

### Watch Mode

```bash
# Auto-generate as you code
tryforge models:watch
```

## Auto-Generate Graphics

### Complete Graphics Set

```bash
# Modern style
tryforge graphics:generate \
  -n "TechStartup" \
  --style modern \
  --colors "blue and white"

# Minimalist style
tryforge graphics:generate \
  -n "MinimalApp" \
  --style minimalist \
  --colors "black and white"

# Professional style
tryforge graphics:generate \
  -n "CorporateApp" \
  --style professional \
  --colors "navy and gold"
```

### Specific Graphics

```bash
# Just logo
tryforge graphics:type logo -n "MyBrand" --style modern

# Just favicon
tryforge graphics:type favicon -n "MyApp"

# Hero image
tryforge graphics:type hero -n "MyApp" --style minimalist

# OG image for social media
tryforge graphics:type og-image -n "MyApp"
```

### Detect Missing Graphics

```bash
# Scan code for missing images
tryforge graphics:detect

# Watch and auto-generate
tryforge graphics:watch
```

## Code Generation

### Components

```bash
# Simple component
tryforge generate component "Button with loading state"

# Complex component
tryforge generate component "UserProfile with avatar, name, bio, social links, and edit mode"

# Form component
tryforge generate component "ContactForm with validation and submission"
```

### Features

```bash
# Shopping cart
tryforge generate feature "Shopping cart with add, remove, update quantity, and checkout"

# User authentication
tryforge generate feature "User authentication with login, register, forgot password, and email verification"

# Admin dashboard
tryforge generate feature "Admin dashboard with user management and analytics"
```

### API Routes

```bash
# CRUD routes
tryforge generate route "CRUD operations for products with pagination and search"

# Authentication routes
tryforge generate route "Authentication routes with JWT tokens"

# Upload route
tryforge generate route "File upload with image resizing"
```

### Tests

```bash
# Generate tests for component
tryforge generate test --file src/components/Button.jsx

# Generate tests for route
tryforge generate test --file src/api/products.js
```

## Refactoring

### UI Refactoring

```bash
# Improve component organization
tryforge refactor "Improve component organization and reusability" --scope ui

# Modernize UI
tryforge refactor "Update to modern UI patterns" --scope ui
```

### Performance Optimization

```bash
# Optimize performance
tryforge refactor --scope performance

# Optimize specific files
tryforge refactor --scope performance --files "src/components/**/*.jsx"
```

### Security Improvements

```bash
# Security audit and fixes
tryforge refactor --scope security

# Fix specific security issues
tryforge refactor "Fix XSS vulnerabilities" --scope security
```

## Analysis

### Codebase Analysis

```bash
# Full analysis
tryforge analyze codebase

# JSON output for CI/CD
tryforge analyze codebase --output json > analysis.json

# Markdown report
tryforge analyze codebase --output markdown > ANALYSIS.md
```

### Performance Analysis

```bash
# Performance check
tryforge analyze performance

# Bundle size analysis
tryforge analyze bundle
```

### Security Audit

```bash
# Security scan
tryforge analyze security

# Database security
tryforge analyze database
```

## Testing

### Run All Tests

```bash
# All tests
tryforge test all

# With coverage
tryforge test all --coverage
```

### Watch Mode

```bash
# Watch all tests
tryforge test --watch

# Watch specific type
tryforge test unit --watch
```

### Specific Test Types

```bash
# Unit tests
tryforge test unit

# Integration tests
tryforge test integration

# E2E tests
tryforge test e2e
```

## Development

### Start Development

```bash
# Start servers
tryforge start

# Live preview
tryforge preview

# Preview specific project
tryforge preview ./my-app
```

### Build

```bash
# Production build
tryforge build

# Staging build
tryforge build --env staging
```

## Deployment

### Deploy to Vercel

```bash
# Deploy
tryforge deploy vercel

# Check status
tryforge deploy:status vercel
```

### Deploy to Netlify

```bash
# Deploy
tryforge deploy netlify

# Deploy specific project
tryforge deploy netlify --path ./my-app
```

### Deploy to Railway

```bash
# Deploy with database
tryforge deploy railway
```

## Complete Workflows

### Workflow 1: Create Full-Stack App from Scratch

```bash
# 1. Create app
tryforge create "Task management app" \
  --framework nextjs \
  --database postgresql \
  --auth jwt

# 2. Navigate to project
cd task-management-app

# 3. Generate models
tryforge models:generate -d "Tasks with users, projects, and comments"

# 4. Generate graphics
tryforge graphics:generate -n "TaskApp" --style modern

# 5. Start preview
tryforge preview

# 6. Run tests
tryforge test all

# 7. Deploy
tryforge deploy vercel
```

### Workflow 2: Add Feature to Existing App

```bash
# 1. Generate feature
tryforge generate feature "User profile with avatar upload and settings"

# 2. Detect missing models
tryforge models:detect

# 3. Generate missing graphics
tryforge graphics:detect

# 4. Generate tests
tryforge generate test --file src/features/profile/UserProfile.jsx

# 5. Test changes
tryforge test --watch

# 6. Analyze impact
tryforge analyze performance
```

### Workflow 3: Refactor and Optimize

```bash
# 1. Analyze current state
tryforge analyze codebase

# 2. Performance analysis
tryforge analyze performance

# 3. Security audit
tryforge analyze security

# 4. Refactor
tryforge refactor --scope all

# 5. Run tests
tryforge test all

# 6. Verify improvements
tryforge analyze performance

# 7. Deploy
tryforge deploy vercel
```

## Tips

### Be Specific

```bash
# Good
tryforge create "E-commerce store for vintage vinyl records with Stripe integration"

# Less specific
tryforge create "online store"
```

### Use Interactive Mode

```bash
# Interactive mode guides you
tryforge create --interactive
tryforge models:generate --interactive
```

### Watch Modes for Development

```bash
# Auto-generate models
tryforge models:watch &

# Auto-generate graphics
tryforge graphics:watch &

# Watch tests
tryforge test --watch
```

### Combine Commands

```bash
# Generate and test
tryforge generate component "Button" && tryforge test --file src/components/Button.test.jsx
```

---

For more examples, run:
```bash
tryforge examples <command>
```

Or view guides:
```bash
tryforge guide --list
```
