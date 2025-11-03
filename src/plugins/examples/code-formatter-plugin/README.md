# Code Formatter Plugin

Automatically formats generated code using Prettier.

## Features

- Automatic code formatting after generation
- Format entire projects or specific files
- Configurable formatting rules
- Support for multiple file types (JS, TS, JSX, TSX, CSS, SCSS, JSON, MD)

## Installation

```bash
tryforge plugin install ./src/plugins/examples/code-formatter-plugin
```

## Usage

### Automatic Formatting

Once installed, the plugin automatically formats:
- Generated code files
- Newly created projects

### Manual Formatting

Format entire project:
```bash
tryforge format
```

Format specific files:
```bash
tryforge format --files=src/index.js,src/app.js
```

Format specific directory:
```bash
tryforge format --path=./src
```

### Configuration

Show current configuration:
```bash
tryforge format:config --show
```

Set configuration value:
```bash
tryforge format:config --set=singleQuote=false
tryforge format:config --set=tabWidth=4
```

Reset to defaults:
```bash
tryforge format:config --reset
```

### Toggle Auto-Formatting

Enable/disable auto-formatting:
```bash
tryforge format:toggle
```

## Configuration Options

The plugin uses Prettier for formatting with the following default configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

## Supported File Types

- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- JSON (.json)
- CSS/SCSS/LESS
- Markdown (.md)
- HTML (.html)
- Vue (.vue)

## Hooks

- `after:generate` - Formats generated code files
- `after:create` - Formats newly created project files

## Permissions

- `filesystem:read` - Read files for formatting
- `filesystem:write` - Write formatted files

## License

MIT
