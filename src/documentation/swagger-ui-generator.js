const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Swagger UI Generator
 * Generates interactive Swagger UI documentation
 */
class SwaggerUIGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './docs/api',
      theme: options.theme || 'default',
      title: options.apiName || 'API Documentation',
      faviconUrl: options.faviconUrl,
      logoUrl: options.logoUrl,
      customCss: options.customCss || '',
      deepLinking: options.deepLinking !== false,
      displayRequestDuration: options.displayRequestDuration !== false,
      syntaxHighlight: options.syntaxHighlight !== false,
      tryItOutEnabled: options.tryItOutEnabled !== false,
      ...options
    };
  }

  /**
   * Generate Swagger UI HTML page
   */
  async generate(specPath) {
    logger.debug('Generating Swagger UI...');

    // Read OpenAPI spec
    let spec;
    if (typeof specPath === 'string') {
      const specContent = await fs.readFile(specPath, 'utf-8');
      spec = JSON.parse(specContent);
    } else {
      spec = specPath;
    }

    // Generate HTML
    const html = this.buildHTML(spec);

    // Write to file
    const outputPath = path.join(this.options.outputDir, 'index.html');
    await fs.writeFile(outputPath, html);

    logger.debug(`Swagger UI generated at ${outputPath}`);
    return outputPath;
  }

  /**
   * Build complete HTML page
   */
  buildHTML(spec) {
    const specJson = JSON.stringify(spec, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.options.title)}</title>
  ${this.options.faviconUrl ? `<link rel="icon" type="image/png" href="${this.escapeHtml(this.options.faviconUrl)}" />` : ''}
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .swagger-ui .topbar {
      ${this.getThemeStyles()}
    }

    ${this.options.logoUrl ? `
    .swagger-ui .topbar-wrapper::before {
      content: "";
      display: inline-block;
      width: 40px;
      height: 40px;
      margin-right: 10px;
      background-image: url('${this.escapeHtml(this.options.logoUrl)}');
      background-size: contain;
      background-repeat: no-repeat;
      vertical-align: middle;
    }
    ` : ''}

    ${this.options.customCss}
  </style>
</head>

<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson};

      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: ${this.options.deepLinking},
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        displayRequestDuration: ${this.options.displayRequestDuration},
        syntaxHighlight: ${this.options.syntaxHighlight ? 'true' : 'false'},
        tryItOutEnabled: ${this.options.tryItOutEnabled},
        requestInterceptor: function(request) {
          // Add custom headers or modify request here
          return request;
        },
        responseInterceptor: function(response) {
          // Process response here
          return response;
        },
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          console.error('Failed to load Swagger UI:', error);
        }
      });
    };
  </script>
</body>
</html>`;
  }

  /**
   * Get theme-specific styles
   */
  getThemeStyles() {
    const themes = {
      default: `
        background-color: #38b2ac;
        border-bottom: 2px solid #2c7a7b;
      `,
      dark: `
        background-color: #1a202c;
        border-bottom: 2px solid #2d3748;
      `,
      blue: `
        background-color: #3182ce;
        border-bottom: 2px solid #2c5282;
      `,
      purple: `
        background-color: #805ad5;
        border-bottom: 2px solid #6b46c1;
      `,
      green: `
        background-color: #48bb78;
        border-bottom: 2px solid #38a169;
      `
    };

    return themes[this.options.theme] || themes.default;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Generate standalone Swagger UI bundle
   */
  async generateStandalone(spec, outputPath) {
    logger.debug('Generating standalone Swagger UI bundle...');

    // Create output directory
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Generate HTML
    const html = this.buildHTML(spec);
    await fs.writeFile(outputPath, html);

    logger.success(`Standalone Swagger UI saved to ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate with custom template
   */
  async generateFromTemplate(spec, templatePath, outputPath) {
    logger.debug('Generating Swagger UI from template...');

    // Read template
    const template = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders
    const html = template
      .replace('{{SPEC}}', JSON.stringify(spec, null, 2))
      .replace('{{TITLE}}', this.escapeHtml(this.options.title))
      .replace('{{THEME_STYLES}}', this.getThemeStyles())
      .replace('{{CUSTOM_CSS}}', this.options.customCss);

    // Write output
    await fs.writeFile(outputPath, html);

    logger.success(`Swagger UI generated from template at ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate ReDoc documentation
   */
  async generateReDoc(spec, outputPath) {
    logger.debug('Generating ReDoc documentation...');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.options.title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url="openapi.json"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

    await fs.writeFile(outputPath, html);

    // Also save spec
    const specPath = path.join(path.dirname(outputPath), 'openapi.json');
    await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

    logger.success(`ReDoc documentation saved to ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate RapiDoc documentation
   */
  async generateRapiDoc(spec, outputPath) {
    logger.debug('Generating RapiDoc documentation...');

    const specJson = JSON.stringify(spec, null, 2);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escapeHtml(this.options.title)}</title>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body>
  <rapi-doc
    spec-url=""
    theme="dark"
    bg-color="#1a202c"
    text-color="#f7fafc"
    header-color="#2d3748"
    primary-color="#4299e1"
    render-style="read"
    schema-style="table"
    show-header="true"
    allow-search="true"
    allow-try="true"
    allow-spec-url-load="false"
    allow-spec-file-load="false"
  >
    <div slot="overview">
      ${spec.info.description || ''}
    </div>
  </rapi-doc>

  <script>
    const spec = ${specJson};
    document.querySelector('rapi-doc').loadSpec(spec);
  </script>
</body>
</html>`;

    await fs.writeFile(outputPath, html);

    logger.success(`RapiDoc documentation saved to ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate multiple documentation formats
   */
  async generateAll(spec) {
    const outputs = {};

    // Swagger UI
    const swaggerPath = path.join(this.options.outputDir, 'swagger.html');
    outputs.swagger = await this.generate(spec, swaggerPath);

    // ReDoc
    const redocPath = path.join(this.options.outputDir, 'redoc.html');
    outputs.redoc = await this.generateReDoc(spec, redocPath);

    // RapiDoc
    const rapidocPath = path.join(this.options.outputDir, 'rapidoc.html');
    outputs.rapidoc = await this.generateRapiDoc(spec, rapidocPath);

    // Create index page with links
    const indexPath = path.join(this.options.outputDir, 'index.html');
    const indexHtml = this.buildIndexPage();
    await fs.writeFile(indexPath, indexHtml);
    outputs.index = indexPath;

    return outputs;
  }

  /**
   * Build index page with links to all docs
   */
  buildIndexPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.options.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f7fafc;
    }
    h1 {
      color: #2d3748;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card h2 {
      margin-top: 0;
      color: #2d3748;
    }
    .card p {
      color: #4a5568;
    }
    a {
      display: inline-block;
      padding: 10px 20px;
      background: #4299e1;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background 0.3s;
    }
    a:hover {
      background: #3182ce;
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(this.options.title)}</h1>
  <p>Choose your preferred documentation viewer:</p>

  <div class="card">
    <h2>Swagger UI</h2>
    <p>Interactive API documentation with try-it-out features.</p>
    <a href="swagger.html">View Swagger UI</a>
  </div>

  <div class="card">
    <h2>ReDoc</h2>
    <p>Clean, responsive documentation with a focus on readability.</p>
    <a href="redoc.html">View ReDoc</a>
  </div>

  <div class="card">
    <h2>RapiDoc</h2>
    <p>Modern API documentation with customizable layout.</p>
    <a href="rapidoc.html">View RapiDoc</a>
  </div>

  <div class="card">
    <h2>OpenAPI Spec</h2>
    <p>Raw OpenAPI specification files.</p>
    <a href="openapi.json">Download JSON</a>
    <a href="openapi.yaml">Download YAML</a>
  </div>
</body>
</html>`;
  }
}

module.exports = SwaggerUIGenerator;
