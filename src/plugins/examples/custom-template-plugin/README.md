# Custom Template Plugin

Adds custom project templates to TryForge.

## Features

- Provides custom project templates
- Integrates with template loading system
- Adds template generation commands

## Templates

### Minimal API
Lightweight REST API template with Express.js

### Full Stack App
Complete full-stack template with React frontend and Express backend

## Installation

```bash
tryforge plugin install ./src/plugins/examples/custom-template-plugin
```

## Usage

### List Custom Templates

```bash
tryforge templates:custom
```

### Generate from Template

```bash
tryforge generate:custom --template=minimal-api --name=my-api
tryforge generate:custom --template=fullstack-app --name=my-app
```

## Hooks

- `template:load` - Adds custom templates to available templates
- `template:render` - Modifies template rendering context

## Permissions

- `filesystem:read` - Read template files
- `filesystem:write` - Write generated files

## Extending

To add your own templates, modify the `templates` object in `index.js`:

```javascript
templates: {
  'my-template': {
    name: 'My Template',
    description: 'Custom template description',
    framework: 'express',
    features: ['api'],
    files: [
      'server.js',
      'package.json'
    ]
  }
}
```

## License

MIT
