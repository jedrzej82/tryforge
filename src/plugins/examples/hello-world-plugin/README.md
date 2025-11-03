# Hello World Plugin

A simple example plugin for TryForge that demonstrates the basic plugin capabilities.

## Features

- Registers hooks for `before:create` and `after:create` events
- Adds a custom CLI command `hello`
- Demonstrates filters and actions
- Shows plugin configuration usage

## Installation

```bash
tryforge plugin install ./src/plugins/examples/hello-world-plugin
```

Or install as symlink for development:

```bash
tryforge plugin install ./src/plugins/examples/hello-world-plugin --symlink
```

## Usage

Once installed, the plugin will automatically:

1. Log messages when creating new projects
2. Add a custom `hello` command

### Custom Command

```bash
tryforge hello
tryforge hello --name=John
```

## Hooks

This plugin registers the following hooks:

- `before:create` - Runs before project creation
- `after:create` - Runs after project creation

## API Used

The plugin demonstrates usage of:

- `api.hooks.before()` - Register before hooks
- `api.hooks.after()` - Register after hooks
- `api.hooks.addAction()` - Register action hooks
- `api.hooks.addFilter()` - Register filter hooks
- `api.cli.addCommand()` - Add custom CLI commands
- `api.config` - Plugin configuration storage
- `api.logger` - Logging utilities

## Development

This plugin serves as a template for creating your own TryForge plugins. Copy this structure and modify it to create your own plugin.

## License

MIT
