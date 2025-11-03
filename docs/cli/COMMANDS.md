# TryForge CLI Commands Reference

Complete reference for all TryForge CLI commands.

## Table of Contents

- [Project Creation](#project-creation)
- [Code Generation](#code-generation)
- [Database Commands](#database-commands)
- [Graphics Commands](#graphics-commands)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Analysis](#analysis)
- [Configuration](#configuration)
- [Help System](#help-system)

## Project Creation

### `tryforge create [description]`

Create a new application from a description.

**Usage:**
```bash
tryforge create [description] [options]
```

**Options:**
- `-f, --framework <type>` - Framework (react|vue|angular|svelte) [default: react]
- `-s, --styling <type>` - Styling (css|scss|tailwind|styled-components) [default: css]
- `-d, --database <type>` - Database (postgresql|mysql|mongodb|sqlite) [default: postgresql]
- `-a, --auth <type>` - Authentication (jwt|oauth|session|none) [default: jwt]
- `-g, --graphics <style>` - Graphics style (modern|minimalist|professional|playful)
- `-c, --colors <scheme>` - Color scheme
- `-t, --template <name>` - Template (minimal|standard|full) [default: standard]
- `--features <list>` - Comma-separated feature list
- `--verbose` - Enable debug mode

**Examples:**
```bash
# Natural language description
tryforge create "A blog platform with user authentication"

# Explicit options
tryforge create --framework react --database postgresql --auth jwt

# Interactive mode
tryforge create --interactive

# With specific features
tryforge create "E-commerce store" --features "cart,checkout,payments"
```

## Code Generation

### `tryforge generate [type] [description]`

AI-powered code generation.

**Usage:**
```bash
tryforge generate [type] [description] [options]
```

**Types:**
- `component` - Generate React/Vue component
- `feature` - Generate complete feature
- `route` - Generate API route
- `test` - Generate test file

**Options:**
- `-p, --path <path>` - Project path
- `-f, --file <file>` - File path (for test generation)
- `--verbose` - Enable debug mode

**Examples:**
```bash
# Generate component
tryforge generate component "UserProfile with avatar, name, and bio"

# Generate feature
tryforge generate feature "Shopping cart with add, remove, and checkout"

# Generate API route
tryforge generate route "CRUD operations for products"

# Generate tests
tryforge generate test --file src/components/Button.jsx
```

## Database Commands

### `tryforge models:generate`

Automatically generate database models from description.

**Usage:**
```bash
tryforge models:generate [options]
```

**Options:**
- `-d, --description <desc>` - Application description
- `-r, --requirements <file>` - Requirements JSON file
- `-p, --path <path>` - Project path [default: current directory]
- `--orm <type>` - ORM type (prisma|sequelize|typeorm|mongoose) [default: prisma]
- `--language <lang>` - Language (typescript|javascript) [default: typescript]
- `--no-enrich` - Skip AI enrichment
- `--no-migrations` - Skip migration generation
- `-i, --interactive` - Interactive mode with confirmations
- `-v, --verbose` - Verbose output

**Examples:**
```bash
# Auto-generate from description
tryforge models:generate -d "Blog platform with posts, comments, and users"

# Interactive mode
tryforge models:generate --interactive -d "E-commerce store"

# Specify ORM
tryforge models:generate --orm sequelize -d "Social network"
```

### `tryforge models:detect`

Detect and generate missing models from code.

**Usage:**
```bash
tryforge models:detect [options]
```

**Options:**
- `-p, --path <path>` - Project path
- `--orm <type>` - ORM type
- `--language <lang>` - Language
- `--no-migrations` - Skip migration generation
- `-v, --verbose` - Verbose output

**Examples:**
```bash
tryforge models:detect
tryforge models:detect --orm prisma
```

### `tryforge models:watch`

Watch and auto-generate missing models.

**Usage:**
```bash
tryforge models:watch [options]
```

**Examples:**
```bash
tryforge models:watch
```

### `tryforge models:list`

List existing models in project.

**Usage:**
```bash
tryforge models:list [options]
```

### `tryforge models:analyze`

Analyze models and suggest improvements.

**Usage:**
```bash
tryforge models:analyze [options]
```

### `tryforge db:reset`

Reset database (drop, migrate, seed).

**Usage:**
```bash
tryforge db:reset
```

### `tryforge db:migrate`

Run database migrations.

**Usage:**
```bash
tryforge db:migrate
```

### `tryforge db:seed`

Seed database with sample data.

**Usage:**
```bash
tryforge db:seed
```

## Graphics Commands

### `tryforge graphics:generate`

Automatically generate professional graphics.

**Usage:**
```bash
tryforge graphics:generate [options]
```

**Options:**
- `-d, --description <desc>` - Application description
- `-r, --requirements <file>` - Requirements JSON file
- `-t, --type <type>` - Application type (e-commerce|blog|dashboard|saas)
- `-n, --name <name>` - Application name
- `-p, --path <path>` - Project path
- `-o, --output <dir>` - Output directory [default: public/images]
- `--style <style>` - Graphics style (modern|minimalist|professional)
- `--colors <scheme>` - Color scheme
- `--quality <percent>` - Image quality (1-100) [default: 90]
- `--no-enrich` - Skip AI enrichment
- `--no-variations` - Skip generating variations
- `--no-optimize` - Skip image optimization
- `-v, --verbose` - Verbose output

**Examples:**
```bash
# Generate complete set
tryforge graphics:generate -n "TechStartup" --style modern

# With specific colors
tryforge graphics:generate -n "MyApp" --colors "blue and white"

# Specific type
tryforge graphics:type logo -n "MyBrand"
```

### `tryforge graphics:detect`

Detect and generate missing graphics from code.

### `tryforge graphics:watch`

Watch and auto-generate missing graphics.

### `tryforge graphics:list`

List all graphics in project.

### `tryforge graphics:analyze`

Analyze graphics and provide optimization insights.

## Development

### `tryforge start`

Start development servers.

**Usage:**
```bash
tryforge start
```

### `tryforge stop`

Stop all servers.

**Usage:**
```bash
tryforge stop
```

### `tryforge preview [path]`

Start live preview with hot reload.

**Usage:**
```bash
tryforge preview [path]
```

**Examples:**
```bash
tryforge preview
tryforge preview ./my-app
```

## Testing

### `tryforge test [type]`

Run tests.

**Usage:**
```bash
tryforge test [type] [options]
```

**Types:**
- `all` - All tests
- `backend` - Backend tests
- `frontend` - Frontend tests
- `integration` - Integration tests
- `e2e` - End-to-end tests

**Options:**
- `-w, --watch` - Watch mode

**Examples:**
```bash
tryforge test all
tryforge test --watch
tryforge test e2e
```

## Deployment

### `tryforge deploy [platform]`

Deploy to cloud platforms.

**Usage:**
```bash
tryforge deploy [platform] [options]
```

**Platforms:**
- `vercel` - Deploy to Vercel
- `netlify` - Deploy to Netlify
- `railway` - Deploy to Railway
- `render` - Deploy to Render

**Options:**
- `-p, --path <path>` - Project path

**Examples:**
```bash
tryforge deploy vercel
tryforge deploy netlify --path ./my-app
```

### `tryforge deploy:status <platform>`

Check deployment status.

**Usage:**
```bash
tryforge deploy:status <platform> [options]
```

**Examples:**
```bash
tryforge deploy:status vercel
```

## Build

### `tryforge build`

Build application for production.

**Usage:**
```bash
tryforge build [options]
```

**Options:**
- `-e, --env <environment>` - Environment (development|staging|production) [default: production]

**Examples:**
```bash
tryforge build
tryforge build --env staging
```

## Analysis

### `tryforge analyze [type]`

Analyze codebase, performance, security, or UI.

**Usage:**
```bash
tryforge analyze [type] [options]
```

**Types:**
- `codebase` - Full codebase analysis
- `performance` - Performance analysis
- `security` - Security audit
- `ui` - UI/UX analysis
- `database` - Database analysis
- `bundle` - Bundle size analysis

**Options:**
- `-o, --output <format>` - Output format (console|json|markdown) [default: console]

**Examples:**
```bash
tryforge analyze codebase
tryforge analyze performance --output json
tryforge analyze security
```

### `tryforge refactor [description]`

Refactor and improve existing application.

**Usage:**
```bash
tryforge refactor [description] [options]
```

**Options:**
- `-s, --scope <area>` - Scope (ui|performance|security|quality|all) [default: all]
- `-f, --files <pattern>` - File pattern to refactor

**Examples:**
```bash
tryforge refactor "Improve component organization" --scope ui
tryforge refactor --scope performance
```

## Configuration

### `tryforge admin`

Open admin panel for API configuration.

**Usage:**
```bash
tryforge admin [options]
```

**Options:**
- `-p, --port <port>` - Port for admin panel [default: 3333]

**Examples:**
```bash
tryforge admin
tryforge admin --port 4000
```

## Status

### `tryforge status`

Show system and project status.

**Usage:**
```bash
tryforge status
```

## Help System

### `tryforge help [command]`

Display help for a specific command.

**Usage:**
```bash
tryforge help [command]
```

**Examples:**
```bash
tryforge help create
tryforge help models:generate
```

### `tryforge help --search <keyword>`

Search help content.

**Usage:**
```bash
tryforge help --search <keyword>
```

**Examples:**
```bash
tryforge help --search database
tryforge help --search deploy
```

### `tryforge examples [command]`

Show examples for a command.

**Usage:**
```bash
tryforge examples [command]
```

**Examples:**
```bash
tryforge examples create
tryforge examples models:generate
```

### `tryforge guide <topic>`

Show guide on specific topic.

**Usage:**
```bash
tryforge guide <topic>
```

**Topics:**
- `getting-started` - Getting started guide
- `project-setup` - Project setup guide
- `templates` - Template guide
- `database` - Database setup guide
- `deployment` - Deployment guide
- `troubleshooting` - Troubleshooting guide
- `best-practices` - Best practices
- `ai-features` - AI features guide

**Examples:**
```bash
tryforge guide getting-started
tryforge guide deployment
tryforge guide --list
```

### `tryforge doctor`

Diagnose common issues.

**Usage:**
```bash
tryforge doctor
```

## Global Options

All commands support these global options:

- `--verbose` - Enable debug mode with detailed logging
- `-h, --help` - Display help for command
- `-v, --version` - Output version number

## Environment Variables

TryForge uses these environment variables:

- `ANTHROPIC_API_KEY` - Claude API key
- `GITHUB_TOKEN` - GitHub token (optional)
- `POLLINATIONS_API_KEY` - Pollinations AI key (optional)

Set them in `.env` file or configure via `tryforge admin`.

---

For more information, visit [https://docs.tryforge.dev](https://docs.tryforge.dev)
