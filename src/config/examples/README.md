# TryForge Configuration Examples

This directory contains example configuration files in various formats. Choose the format that best suits your needs.

## Supported Formats

TryForge supports multiple configuration file formats:

### 1. JavaScript (`.js`)
**File:** `tryforge.config.js`

```javascript
module.exports = {
  ai: {
    provider: 'claude',
    model: 'claude-3-sonnet-20240229'
  }
};
```

**Advantages:**
- Can use JavaScript logic and expressions
- Can import other modules
- Can use environment variables directly
- Comments and dynamic values

### 2. JSON (`.json`)
**Files:** `tryforge.config.json`, `.tryforgerc`, `.tryforgerc.json`

```json
{
  "ai": {
    "provider": "claude",
    "model": "claude-3-sonnet-20240229"
  }
}
```

**Advantages:**
- Simple and widely supported
- Easy to parse and validate
- Good for programmatic access

### 3. YAML (`.yaml`, `.yml`)
**Files:** `.tryforgerc.yaml`, `.tryforgerc.yml`

```yaml
ai:
  provider: claude
  model: claude-3-sonnet-20240229
```

**Advantages:**
- Human-readable and clean syntax
- Supports comments
- Less verbose than JSON

### 4. package.json
Add a `tryforge` field to your `package.json`:

```json
{
  "name": "my-app",
  "tryforge": {
    "ai": {
      "provider": "claude",
      "model": "claude-3-sonnet-20240229"
    }
  }
}
```

### 5. Environment Variables
**File:** `.env`

```bash
TRYFORGE_AI_PROVIDER=claude
TRYFORGE_AI_MODEL=claude-3-sonnet-20240229
TRYFORGE_DATABASE_URL=postgresql://user:pass@host:5432/db
```

**Advantages:**
- Secure for sensitive data (API keys, passwords)
- Easy deployment configuration
- Platform-agnostic

## Configuration Priority

Configuration is loaded and merged in this order (highest to lowest priority):

1. **CLI flags** - Command-line arguments
2. **Environment variables** - `TRYFORGE_*` variables
3. **Project config** - Config file in project directory
4. **User config** - `~/.tryforge/config.json`
5. **Defaults** - Built-in default values

## Quick Start

### Option 1: Copy an Example

```bash
# Copy JavaScript config
cp src/config/examples/tryforge.config.js ./

# Or JSON config
cp src/config/examples/tryforge.config.json ./

# Or YAML config
cp src/config/examples/.tryforgerc.yaml ./
```

### Option 2: Use CLI Commands

```bash
# Initialize with defaults
tryforge config:reset

# Set specific values
tryforge config:set ai.model claude-3-opus-20240229
tryforge config:set project.defaultTemplate nextjs-14

# Edit in your preferred editor
tryforge config:edit
```

### Option 3: Environment Variables

```bash
# Copy example .env file
cp src/config/examples/.env.example .env

# Edit with your values
nano .env
```

## CLI Commands

```bash
# Show current configuration
tryforge config

# Get a specific value
tryforge config get ai.model

# Set a value
tryforge config set ai.model claude-3-opus-20240229

# Set a value globally (user config)
tryforge config set ai.model claude-3-opus-20240229 --global

# Unset a value (reset to default)
tryforge config unset ai.temperature

# List all configuration keys
tryforge config list

# Edit configuration in editor
tryforge config edit

# Edit global user configuration
tryforge config edit --global

# Validate configuration
tryforge config validate

# Reset to defaults
tryforge config reset

# Show configuration info
tryforge config info

# Migrate old configuration
tryforge config migrate
```

## Configuration Schema

### General Settings

```javascript
{
  version: "1.0.0",           // Config version
  logLevel: "info"            // debug, info, warn, error
}
```

### AI Service

```javascript
ai: {
  provider: "claude",         // claude, openai, custom
  apiKey: "sk-ant-...",      // Set via TRYFORGE_AI_API_KEY
  model: "claude-3-sonnet-20240229",
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 30000,
  retries: 3
}
```

### Templates

```javascript
templates: {
  directory: "~/.tryforge/templates",
  autoUpdate: true,
  custom: []
}
```

### Database

```javascript
database: {
  provider: "postgresql",     // postgresql, mysql, sqlite, mongodb
  host: "localhost",
  port: 5432,
  name: "tryforge",
  username: "postgres",
  password: null,            // Set via TRYFORGE_DATABASE_PASSWORD
  ssl: false,
  poolMin: 2,
  poolMax: 10
}
```

### Project

```javascript
project: {
  defaultTemplate: "react-typescript",
  defaultDatabase: "postgresql",
  includeTests: true,
  includeDocs: true,
  gitInit: true,
  installDeps: true
}
```

### CLI

```javascript
cli: {
  interactive: true,
  verbose: false,
  color: true,
  progress: true,
  editor: "vim",
  confirmDestructive: true
}
```

### Code Generation

```javascript
generate: {
  fileCase: "kebab",         // kebab, camel, pascal, snake
  importStyle: "named",      // named, default, namespace
  quotes: "single",          // single, double
  semicolons: true,
  trailingComma: "es5",      // none, es5, all
  tabWidth: 2,
  useTabs: false
}
```

## Security Best Practices

### Never Commit Secrets

❌ **DON'T:**
```javascript
module.exports = {
  ai: {
    apiKey: 'sk-ant-real-key-here'  // Never do this!
  }
};
```

✅ **DO:**
```javascript
module.exports = {
  ai: {
    apiKey: process.env.TRYFORGE_AI_API_KEY
  }
};
```

Or use environment variables:
```bash
# .env (add to .gitignore)
TRYFORGE_AI_API_KEY=sk-ant-real-key-here
```

### Recommended .gitignore

```gitignore
# Environment variables
.env
.env.local

# Config backups
*.backup
*.backup.json
tryforge.config.backup.*

# User-specific config
.tryforgerc
tryforge.config.json
```

## Troubleshooting

### Configuration Not Loading

1. **Check file location:**
   ```bash
   tryforge config info
   ```

2. **Validate configuration:**
   ```bash
   tryforge config validate
   ```

3. **Check for syntax errors:**
   - JSON: Use a JSON validator
   - YAML: Check indentation
   - JavaScript: Check for syntax errors

### Validation Errors

```bash
# Validate and see detailed errors
tryforge config validate

# Common issues:
# - Invalid API key format
# - Missing required fields
# - Type mismatches (string instead of number)
# - Unknown configuration keys
```

### Migration Issues

```bash
# Check if migration is needed
tryforge config info

# Run migration
tryforge config migrate

# Restore from backup if needed
ls -l *.backup.json
```

## Examples by Use Case

### Development Environment

```javascript
module.exports = {
  logLevel: 'debug',
  cli: {
    verbose: true
  },
  database: {
    name: 'tryforge_dev'
  }
};
```

### Production Environment

```bash
# .env
NODE_ENV=production
TRYFORGE_LOG_LEVEL=warn
TRYFORGE_DATABASE_SSL=true
TRYFORGE_DATABASE_URL=postgresql://...
```

### CI/CD Environment

```bash
# Environment variables only
TRYFORGE_CLI_INTERACTIVE=false
TRYFORGE_CLI_COLOR=false
TRYFORGE_PROJECT_INSTALL_DEPS=false
```

## More Information

- [Full Documentation](../../docs/configuration.md)
- [API Reference](../../docs/api/config.md)
- [Environment Variables](../../docs/environment-variables.md)
