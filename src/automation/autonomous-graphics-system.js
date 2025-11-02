const GraphicsDiscovery = require('./graphics-discovery');
const GraphicsGenerator = require('./graphics-generator');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

/**
 * Autonomous Graphics System
 * Orchestrates automatic discovery and generation of professional graphics
 */
class AutonomousGraphicsSystem {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'public/images',
      quality: options.quality || 90,
      optimize: options.optimize !== false,
      autoEnrich: options.autoEnrich !== false,
      generateVariations: options.generateVariations !== false,
      watchMode: options.watchMode || false,
      ...options
    };

    // Initialize AI service (will be injected)
    this.ai = options.aiService || this.getDefaultAIService();

    this.discovery = new GraphicsDiscovery(this.ai);
    this.generator = new GraphicsGenerator(this.options);

    this.watcher = null;
  }

  /**
   * Get default AI service
   */
  getDefaultAIService() {
    try {
      const aiProvider = process.env.AI_PROVIDER || 'claude';

      if (aiProvider === 'openrouter') {
        const OpenRouterAPI = require('../ai-services/openrouter-api');
        return new OpenRouterAPI();
      } else {
        const ClaudeAPI = require('../ai-services/claude-api');
        return new ClaudeAPI();
      }
    } catch (error) {
      console.warn('⚠️  AI service not available, using fallback mode');
      return {
        generateCode: async (prompt) => {
          return JSON.stringify([]);
        }
      };
    }
  }

  /**
   * Generate all missing graphics for a project
   */
  async generateMissingGraphics(requirements, projectPath) {
    console.log('\n🚀 Autonomous Graphics Generation Starting...\n');
    console.log(`📁 Project: ${projectPath}`);
    console.log(`🎨 Requirements: ${requirements.name || requirements.type}\n`);

    try {
      // 1. Analyze existing project
      console.log('Step 1: Analyzing existing graphics...');
      const projectAnalysis = await this.discovery.analyzeProject(projectPath);

      // 2. Discover required graphics
      console.log('\nStep 2: Discovering required graphics with AI...');
      const requiredGraphics = await this.discovery.discoverGraphics(requirements);

      // 3. Determine missing graphics
      console.log('\nStep 3: Identifying missing graphics...');
      const missingGraphics = await this.discovery.getMissingGraphics(
        requiredGraphics,
        projectPath
      );

      if (missingGraphics.length === 0) {
        console.log('\n✨ All required graphics already exist!\n');
        return {
          success: true,
          message: 'No graphics generation needed',
          existing: projectAnalysis.foundGraphics.length
        };
      }

      // 4. Enrich graphics with AI suggestions
      let enrichedGraphics = missingGraphics;
      if (this.options.autoEnrich) {
        console.log('\nStep 4: Enriching graphics with AI...');
        enrichedGraphics = await this.enrichGraphics(missingGraphics, requirements);
      }

      // 5. Generate graphics
      console.log('\nStep 5: Generating professional graphics...');
      const results = await this.generator.generateGraphics(
        enrichedGraphics,
        projectPath,
        this.options
      );

      // 6. Generate manifest and update HTML
      await this.generateManifest(results, projectPath);
      await this.updateHTMLWithGraphics(results, projectPath);

      const successful = results.filter(r => r.success).length;

      console.log('\n✨ Graphics Generation Complete!\n');
      console.log(`✅ Successfully generated: ${successful}/${results.length}`);
      console.log(`📁 Output directory: ${this.options.outputDir}\n`);

      return {
        success: true,
        generated: results,
        graphics: enrichedGraphics,
        total: results.length,
        successful
      };

    } catch (error) {
      console.error('\n❌ Graphics generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect and generate missing graphics from code analysis
   */
  async detectAndGenerateMissing(projectPath) {
    console.log('\n🔍 Detecting missing graphics from code...\n');

    try {
      // Analyze code for graphics references
      const referencedGraphics = await this.discovery.detectGraphicsInCode(projectPath);

      if (referencedGraphics.length === 0) {
        console.log('✅ No graphics references found in code\n');
        return { success: true, generated: [] };
      }

      // Check which are missing
      const existingAnalysis = await this.discovery.analyzeProject(projectPath);
      const existing = new Set(
        existingAnalysis.foundGraphics.map(g => g.name.toLowerCase())
      );

      const missing = referencedGraphics.filter(
        g => !existing.has(g.name.toLowerCase())
      );

      if (missing.length === 0) {
        console.log('✅ All referenced graphics exist\n');
        return { success: true, generated: [] };
      }

      console.log(`📊 Found ${missing.length} missing graphics`);

      // Generate graphics specs from names
      const graphicsSpecs = await this.generateGraphicsFromNames(missing, projectPath);

      // Generate graphics
      const results = await this.generator.generateGraphics(
        graphicsSpecs,
        projectPath,
        this.options
      );

      const successful = results.filter(r => r.success).length;

      console.log(`\n✨ Generated ${successful}/${results.length} missing graphics\n`);

      return {
        success: true,
        generated: results,
        total: results.length,
        successful
      };

    } catch (error) {
      console.error('❌ Detection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate graphics from simple description
   */
  async generateFromDescription(description, projectPath) {
    console.log('\n🎨 Generating graphics from description...\n');

    try {
      const requirements = {
        description,
        name: path.basename(projectPath),
        type: 'web application'
      };

      return await this.generateMissingGraphics(requirements, projectPath);

    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Watch project and auto-generate missing graphics
   */
  async watch(projectPath) {
    console.log('\n👀 Starting graphics watch mode...\n');
    console.log(`📁 Watching: ${projectPath}`);
    console.log('🎨 Will auto-generate missing graphics on file changes\n');

    // Watch source files
    this.watcher = chokidar.watch([
      `${projectPath}/src/**/*.{js,jsx,ts,tsx,vue}`,
      `${projectPath}/*.html`,
      `${projectPath}/src/**/*.{css,scss}`
    ], {
      ignored: /node_modules|dist|build/,
      persistent: true
    });

    let debounceTimer;

    this.watcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${path.relative(projectPath, filePath)}`);

      // Debounce to avoid multiple rapid regenerations
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log('🔄 Checking for missing graphics...\n');
        await this.detectAndGenerateMissing(projectPath);
      }, 2000);
    });

    // Keep process alive
    return new Promise(() => {});
  }

  /**
   * Stop watching
   */
  async stopWatch() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('✅ Watch mode stopped');
    }
  }

  /**
   * Enrich graphics specifications with AI
   */
  async enrichGraphics(graphics, requirements) {
    console.log('  🤖 Enhancing graphics prompts with AI...');

    for (const graphic of graphics) {
      try {
        const enrichmentPrompt = `Improve this image generation prompt to create a professional, modern graphic:

Original: ${graphic.prompt}
Category: ${graphic.category}
Purpose: ${graphic.purpose}
Application: ${requirements.name || 'web application'}
Style: ${requirements.style || 'modern professional'}

Return an improved prompt that will generate a high-quality, professional image.
Keep it concise (max 2 sentences).`;

        const enhanced = await this.ai.generateCode(enrichmentPrompt, {
          type: 'text',
          maxTokens: 200
        });

        // Update prompt if enhancement is better
        if (enhanced && enhanced.length > 10 && enhanced.length < 500) {
          graphic.prompt = enhanced.trim();
        }

      } catch (error) {
        // Keep original prompt if enrichment fails
        console.warn(`  ⚠️  Could not enrich ${graphic.name}, using original`);
      }
    }

    return graphics;
  }

  /**
   * Generate graphics specs from just names
   */
  async generateGraphicsFromNames(graphicsRefs, projectPath) {
    const specs = [];

    for (const ref of graphicsRefs) {
      const name = ref.name;
      const category = this.inferCategory(name);

      specs.push({
        name,
        category,
        purpose: `${name} for the application`,
        prompt: await this.generatePromptFromName(name, category),
        formats: ['png'],
        sizes: [{ width: 1024, height: 1024 }],
        priority: 'medium'
      });
    }

    return specs;
  }

  /**
   * Infer category from graphic name
   */
  inferCategory(name) {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('logo') || nameLower.includes('brand')) return 'branding';
    if (nameLower.includes('icon')) return 'icons';
    if (nameLower.includes('hero') || nameLower.includes('background')) return 'ui';
    if (nameLower.includes('avatar') || nameLower.includes('photo')) return 'content';
    if (nameLower.includes('og-') || nameLower.includes('social')) return 'marketing';

    return 'content';
  }

  /**
   * Generate AI prompt from graphic name
   */
  async generatePromptFromName(name, category) {
    // Convert kebab-case or snake_case to readable text
    const readable = name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    const categoryDescriptions = {
      branding: 'professional logo design',
      icons: 'modern icon',
      ui: 'user interface element',
      content: 'high quality image',
      marketing: 'marketing graphic'
    };

    return `${readable}, ${categoryDescriptions[category]}, modern professional style`;
  }

  /**
   * Generate manifest.json with icons
   */
  async generateManifest(results, projectPath) {
    const manifestPath = path.join(projectPath, 'public', 'manifest.json');

    try {
      // Find icon files
      const icons = results
        .filter(r => r.success && r.graphic.includes('icon') || r.graphic.includes('logo'))
        .flatMap(r => r.files || [])
        .filter(f => f.format === 'png')
        .map(f => ({
          src: `/${f.relativePath}`,
          sizes: f.size,
          type: 'image/png'
        }));

      if (icons.length === 0) return;

      const manifest = {
        name: path.basename(projectPath),
        short_name: path.basename(projectPath),
        icons,
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone'
      };

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✅ Generated manifest.json with icons');

    } catch (error) {
      console.warn('⚠️  Could not generate manifest.json:', error.message);
    }
  }

  /**
   * Update HTML files with generated graphics
   */
  async updateHTMLWithGraphics(results, projectPath) {
    try {
      const htmlFiles = [
        path.join(projectPath, 'public', 'index.html'),
        path.join(projectPath, 'index.html')
      ];

      for (const htmlPath of htmlFiles) {
        try {
          await fs.access(htmlPath);

          let html = await fs.readFile(htmlPath, 'utf-8');

          // Add favicon links
          const faviconResult = results.find(r => r.graphic === 'favicon');
          if (faviconResult && !html.includes('favicon')) {
            const faviconLinks = `
    <link rel="icon" type="image/x-icon" href="/images/branding/favicon-32x32.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/branding/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/branding/favicon-180x180.png">`;

            html = html.replace('</head>', `${faviconLinks}\n  </head>`);
          }

          // Add OG image
          const ogResult = results.find(r => r.graphic === 'og-image');
          if (ogResult && !html.includes('og:image')) {
            const ogTags = `
    <meta property="og:image" content="/images/marketing/og-image-1200x630.png">
    <meta name="twitter:card" content="summary_large_image">`;

            html = html.replace('</head>', `${ogTags}\n  </head>`);
          }

          await fs.writeFile(htmlPath, html);
          console.log(`✅ Updated ${path.basename(htmlPath)} with graphics`);

        } catch (err) {
          // File doesn't exist, skip
        }
      }

    } catch (error) {
      console.warn('⚠️  Could not update HTML files:', error.message);
    }
  }

  /**
   * List all graphics in project
   */
  async listGraphics(projectPath) {
    const analysis = await this.discovery.analyzeProject(projectPath);

    console.log('\n📊 Graphics in Project\n');
    console.log(`Total: ${analysis.foundGraphics.length} files`);
    console.log(`Total size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Group by directory
    const byDirectory = {};
    analysis.foundGraphics.forEach(graphic => {
      const dir = path.dirname(graphic.path);
      if (!byDirectory[dir]) byDirectory[dir] = [];
      byDirectory[dir].push(graphic);
    });

    for (const [dir, graphics] of Object.entries(byDirectory)) {
      console.log(`📁 ${dir}/`);
      graphics.forEach(g => {
        const size = (g.size / 1024).toFixed(1);
        console.log(`  - ${g.name}.${g.format} (${size} KB)`);
      });
      console.log('');
    }

    return analysis;
  }
}

module.exports = AutonomousGraphicsSystem;
