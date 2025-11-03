# TryForge Plugin System

A comprehensive plugin system that allows extending TryForge functionality through custom plugins.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Plugin Types](#plugin-types)
- [Hook System](#hook-system)
- [Plugin API](#plugin-api)
- [CLI Commands](#cli-commands)
- [Creating Plugins](#creating-plugins)
- [Plugin Structure](#plugin-structure)
- [Security](#security)
- [Examples](#examples)

## Overview

The TryForge plugin system enables developers to:

- **Extend functionality** through hooks and filters
- **Add custom CLI commands** for specialized workflows
- **Create custom templates** for project generation
- **Transform generated code** with custom processors
- **Integrate with external services** seamlessly

### Key Features

- **Hook System**: Before/after hooks, filters, and actions for all major operations
- **Lifecycle Management**: Install, enable, disable, uninstall plugins
- **Plugin API**: Rich API for interacting with TryForge internals
- **Security**: Permission-based system with sandboxing
- **Hot Reload**: Development mode with automatic plugin reloading
- **Dependency Resolution**: Automatic handling of plugin dependencies
- **Version Compatibility**: Ensures plugins work with current TryForge version

## Getting Started

### Installing Plugins

Install from local path:
```bash
tryforge plugin install ./path/to/plugin
```

Install from NPM:
```bash
tryforge plugin install tryforge-plugin-name
```

Install from Git:
```bash
tryforge plugin install https://github.com/user/plugin.git
```

Development mode (symlink):
```bash
tryforge plugin install ./path/to/plugin --symlink
```

### Managing Plugins

List all plugins:
```bash
tryforge plugin list
```

Enable a plugin:
```bash
tryforge plugin enable plugin-name
```

Disable a plugin:
```bash
tryforge plugin disable plugin-name
```

Uninstall a plugin:
```bash
tryforge plugin uninstall plugin-name
```

Get plugin info:
```bash
tryforge plugin info plugin-name
```

## Plugin Types

TryForge supports five types of plugins:

### 1. CLI Plugins
Add custom CLI commands to TryForge.

**Use Cases:**
- Custom project scaffolding
- Specialized build processes
- Integration with external tools

### 2. Template Plugins
Add custom project templates.

**Use Cases:**
- Company-specific templates
- Industry-specific templates
- Custom starter kits

### 3. Generator Plugins
Generate custom code.

**Use Cases:**
- Custom component generators
- API endpoint generators
- Custom scaffolding tools

### 4. Transformer Plugins
Transform or modify generated code.

**Use Cases:**
- Code formatting
- Code optimization
- Custom transpilation

### 5. Integration Plugins
Integrate with external services.

**Use Cases:**
- CI/CD integration
- Analytics integration
- Monitoring integration

## Hook System

The hook system provides extensibility points throughout TryForge.

### Available Hooks

#### Project Lifecycle
- `before:create` - Before project creation
- `after:create` - After project creation

#### Code Generation
- `before:generate` - Before code generation
- `after:generate` - After code generation

#### Build Process
- `before:build` - Before build
- `after:build` - After build

#### Deployment
- `before:deploy` - Before deployment
- `after:deploy` - After deployment

#### Database
- `before:migrate` - Before database migration
- `after:migrate` - After database migration

#### Testing
- `before:test` - Before running tests
- `after:test` - After running tests

#### Templates
- `template:load` - When loading templates
- `template:render` - When rendering templates

### Hook Types

#### Before/After Hooks
Execute code before or after an operation:

```javascript
api.hooks.before('create', async (context) => {
  console.log('About to create project');
  return context; // Can modify context
});

api.hooks.after('create', async (context) => {
  console.log('Project created');
  return context;
});
```

#### Filter Hooks
Transform data:

```javascript
api.hooks.addFilter('template:render', async (template, context) => {
  // Transform template
  return modifiedTemplate;
});
```

#### Action Hooks
Execute side effects:

```javascript
api.hooks.addAction('project:created', async (data) => {
  // Send notification, log event, etc.
});
```

### Hook Priority

Control hook execution order with priority (lower = earlier):

```javascript
api.hooks.before('create', callback, 5);  // Runs first
api.hooks.before('create', callback, 10); // Runs second
api.hooks.before('create', callback, 20); // Runs third
```

## Plugin API

The Plugin API provides access to TryForge functionality.

### Hooks API

```javascript
// Register hooks
api.hooks.before('create', callback, priority);
api.hooks.after('create', callback, priority);
api.hooks.addFilter('name', callback, priority);
api.hooks.addAction('name', callback, priority);

// Remove hooks
api.hooks.remove('name', callback);
```

### CLI API

```javascript
// Add custom command
api.cli.addCommand('my-command', {
  description: 'My custom command',
  action: async (options) => {
    // Command logic
  }
});

// Remove command
api.cli.removeCommand('my-command');

// Get registered commands
api.cli.getCommands();
```

### File System API

```javascript
// Read/write files
await api.fs.readFile(path, encoding);
await api.fs.writeFile(path, content);
await api.fs.readJson(path);
await api.fs.writeJson(path, data);

// Check existence
await api.fs.exists(path);

// Copy/remove
await api.fs.copy(src, dest);
await api.fs.remove(path);

// Read directory
await api.fs.readDir(path);

// Resolve paths
api.fs.resolve(...paths);
```

### Logger API

```javascript
api.logger.info('Info message');
api.logger.warn('Warning message');
api.logger.error('Error message');
api.logger.debug('Debug message');
api.logger.success('Success message');
```

### Config API

```javascript
// Get/set configuration
api.config.get('key', defaultValue);
api.config.set('key', value);
api.config.has('key');
api.config.delete('key');

// Get all config
api.config.getAll();

// Clear config
api.config.clear();
```

### Template API

```javascript
// Register template
api.templates.register('template-name', template);

// Get template path
api.templates.getPath('template-name');

// Load template
await api.templates.load('template-name');

// Render template
await api.templates.render('template-name', data);
```

### Utilities API

```javascript
// Execute shell command
await api.utils.exec('command', options);

// Prompt user
await api.utils.prompt(questions);

// Spinner
const spinner = api.utils.spinner('Loading...');
spinner.start();
spinner.succeed('Done!');

// Path utilities
api.utils.formatPath(path);
api.utils.resolveHome(path);

// Validation
api.utils.isEmail(email);
api.utils.isUrl(url);

// Delay
await api.utils.delay(1000);
```

### Events API

```javascript
// Emit event
api.events.emit('event-name', data);

// Listen to event
api.events.on('event-name', callback);
api.events.once('event-name', callback);

// Remove listener
api.events.off('event-name', callback);
```

### Context API

```javascript
// Get plugin context
api.getContext();

// Get plugin metadata
api.getMetadata();

// Get versions
api.getTryForgeVersion();
api.getNodeVersion();
```

## CLI Commands

### List Plugins

```bash
# List all plugins
tryforge plugin list

# List enabled plugins only
tryforge plugin list --enabled

# List disabled plugins only
tryforge plugin list --disabled
```

### Install Plugin

```bash
# Install from local path
tryforge plugin install ./my-plugin

# Install from NPM
tryforge plugin install tryforge-plugin-name

# Install from Git
tryforge plugin install https://github.com/user/plugin.git

# Install as symlink (development)
tryforge plugin install ./my-plugin --symlink
```

### Uninstall Plugin

```bash
# Uninstall plugin
tryforge plugin uninstall plugin-name

# Skip confirmation
tryforge plugin uninstall plugin-name --force
```

### Enable/Disable Plugin

```bash
# Enable plugin
tryforge plugin enable plugin-name

# Disable plugin
tryforge plugin disable plugin-name
```

### Plugin Info

```bash
# Show plugin information
tryforge plugin info plugin-name
```

### Create Plugin

```bash
# Interactive plugin creation
tryforge plugin create

# Create with name
tryforge plugin create my-plugin

# Specify directory
tryforge plugin create my-plugin --path=/path/to/plugins
```

### Search Plugins

```bash
# Search for plugins
tryforge plugin search keyword
```

### Update Plugin

```bash
# Update plugin to latest version
tryforge plugin update plugin-name
```

### Reload Plugin

```bash
# Reload plugin (for development)
tryforge plugin reload plugin-name
```

## Creating Plugins

### Quick Start

Create a new plugin:
```bash
tryforge plugin create my-awesome-plugin
```

This will:
1. Prompt for plugin details
2. Generate plugin structure
3. Create necessary files

### Plugin Structure

```
my-plugin/
├── package.json      # Plugin metadata
├── index.js          # Plugin entry point
├── README.md         # Documentation
├── hooks.js          # Hook implementations (optional)
├── commands.js       # CLI commands (optional)
└── templates/        # Templates (optional)
```

### package.json

```json
{
  "name": "tryforge-plugin-my-plugin",
  "version": "1.0.0",
  "description": "My TryForge plugin",
  "main": "index.js",
  "keywords": ["tryforge", "plugin"],
  "author": "Your Name",
  "license": "MIT",
  "tryforge": {
    "type": "cli",
    "version": "1.0.0",
    "hooks": ["before:create", "after:create"],
    "permissions": ["filesystem:read"],
    "compatibility": {
      "node": ">=18.0.0",
      "tryforge": ">=1.0.0"
    }
  },
  "peerDependencies": {
    "tryforge": ">=1.0.0"
  }
}
```

### index.js

```javascript
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',

  async init(api) {
    // Register hooks
    api.hooks.before('create', async (context) => {
      api.logger.info('Before create hook');
      return context;
    });

    // Add CLI command
    api.cli.addCommand('my-command', {
      description: 'My custom command',
      action: async (options) => {
        api.logger.info('Running my command');
      }
    });
  },

  async destroy() {
    // Cleanup
  }
};
```

## Security

### Permissions System

Plugins must declare required permissions:

#### Available Permissions

- `filesystem:read` - Read files
- `filesystem:write` - Write/modify files
- `network:request` - Make HTTP requests
- `network:server` - Start network servers
- `process:spawn` - Spawn child processes
- `process:env` - Access environment variables
- `database:read` - Read from database
- `database:write` - Write to database

### Sandboxing

Plugins run in a sandboxed environment with:

- Limited module access
- Permission-based API access
- Timeout protection
- Error isolation

### Best Practices

1. **Declare all permissions** your plugin needs
2. **Validate user input** in CLI commands
3. **Handle errors gracefully**
4. **Document security implications**
5. **Use official TryForge API** instead of direct filesystem access
6. **Test thoroughly** before publishing

## Examples

### Example 1: Hello World Plugin

See [hello-world-plugin](./examples/hello-world-plugin/)

Simple plugin demonstrating:
- Hook registration
- CLI commands
- Filters and actions

### Example 2: Custom Template Plugin

See [custom-template-plugin](./examples/custom-template-plugin/)

Template plugin demonstrating:
- Custom templates
- Template loading hooks
- Template generation

### Example 3: Code Formatter Plugin

See [code-formatter-plugin](./examples/code-formatter-plugin/)

Transformer plugin demonstrating:
- Code transformation
- File system operations
- Configuration management

## Plugin Directory

Plugins are installed to:
- Global: `~/.tryforge/plugins/`
- Project: `./.tryforge/plugins/`
- Examples: `src/plugins/examples/`

## Development Workflow

1. **Create plugin**
   ```bash
   tryforge plugin create my-plugin
   ```

2. **Install as symlink**
   ```bash
   cd my-plugin
   tryforge plugin install . --symlink
   ```

3. **Make changes**
   Edit `index.js` and other files

4. **Reload plugin**
   ```bash
   tryforge plugin reload my-plugin
   ```

5. **Test plugin**
   ```bash
   tryforge my-command
   ```

6. **Publish plugin**
   ```bash
   npm publish
   ```

## Troubleshooting

### Plugin Not Loading

Check:
- Plugin is installed: `tryforge plugin list`
- Plugin is enabled: `tryforge plugin enable plugin-name`
- No validation errors: `tryforge plugin info plugin-name`

### Permission Errors

Ensure plugin declares required permissions in `package.json`:

```json
{
  "tryforge": {
    "permissions": ["filesystem:read", "filesystem:write"]
  }
}
```

### Compatibility Issues

Check version compatibility:
```bash
tryforge plugin info plugin-name
```

Update plugin:
```bash
tryforge plugin update plugin-name
```

## Contributing

To contribute a plugin:

1. Create your plugin following the guidelines
2. Test thoroughly
3. Document clearly
4. Submit to TryForge plugin registry

## Resources

- [Plugin API Documentation](./plugin-api.js)
- [Hook System Documentation](./hook-system.js)
- [Example Plugins](./examples/)
- [TryForge Documentation](../../README.md)

## License

MIT
