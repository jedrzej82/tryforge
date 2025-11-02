const AutonomousGraphicsSystem = require('../../automation/autonomous-graphics-system');
const path = require('path');
const fs = require('fs').promises;

/**
 * Graphics CLI Commands
 * Handle autonomous graphics generation from command line
 */
class GraphicsCommand {
  /**
   * Generate graphics from description or requirements
   */
  static async generate(options = {}) {
    console.log('🎨 TryForge Graphics Generator\n');

    const projectPath = options.path || process.cwd();

    try {
      // Verify project exists
      await fs.access(projectPath);

      const graphicsSystem = new AutonomousGraphicsSystem({
        outputDir: options.output || 'public/images',
        quality: options.quality || 90,
        optimize: options.optimize !== false,
        autoEnrich: options.enrich !== false,
        generateVariations: options.variations !== false
      });

      let result;

      if (options.description) {
        // Generate from simple description
        result = await graphicsSystem.generateFromDescription(
          options.description,
          projectPath
        );
      } else if (options.requirements) {
        // Generate from requirements file
        const requirementsPath = path.resolve(options.requirements);
        const requirements = require(requirementsPath);
        result = await graphicsSystem.generateMissingGraphics(
          requirements,
          projectPath
        );
      } else if (options.type) {
        // Generate based on application type
        const requirements = {
          type: options.type,
          name: options.name || path.basename(projectPath),
          description: options.description || `${options.type} application`,
          style: options.style || 'modern professional',
          colorScheme: options.colors || 'blue and white'
        };
        result = await graphicsSystem.generateMissingGraphics(
          requirements,
          projectPath
        );
      } else {
        console.error('❌ Error: Please provide --description, --requirements, or --type');
        process.exit(1);
      }

      if (result.success) {
        console.log('\n✨ Success! Graphics generated.\n');
        if (result.successful) {
          console.log(`Generated ${result.successful} graphics`);
          console.log(`Output: ${options.output || 'public/images'}\n`);
        }
      } else {
        console.error('\n❌ Generation failed:', result.error);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Detect missing graphics from code
   */
  static async detect(options = {}) {
    console.log('🔍 TryForge Graphics Detector\n');

    const projectPath = options.path || process.cwd();

    try {
      const graphicsSystem = new AutonomousGraphicsSystem({
        outputDir: options.output || 'public/images',
        quality: options.quality || 90
      });

      const result = await graphicsSystem.detectAndGenerateMissing(projectPath);

      if (result.success) {
        if (result.successful > 0) {
          console.log(`✨ Generated ${result.successful} missing graphics\n`);
        } else {
          console.log('✅ No missing graphics found\n');
        }
      } else {
        console.error('❌ Detection failed:', result.error);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Watch project and auto-generate missing graphics
   */
  static async watch(options = {}) {
    console.log('👀 TryForge Graphics Watch Mode\n');

    const projectPath = options.path || process.cwd();

    try {
      const graphicsSystem = new AutonomousGraphicsSystem({
        outputDir: options.output || 'public/images',
        quality: options.quality || 90,
        watchMode: true
      });

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n\n⏹️  Stopping watch mode...');
        await graphicsSystem.stopWatch();
        process.exit(0);
      });

      await graphicsSystem.watch(projectPath);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * List all graphics in project
   */
  static async list(options = {}) {
    console.log('📋 TryForge Graphics List\n');

    const projectPath = options.path || process.cwd();

    try {
      const graphicsSystem = new AutonomousGraphicsSystem();
      await graphicsSystem.listGraphics(projectPath);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze graphics and provide insights
   */
  static async analyze(options = {}) {
    console.log('📊 TryForge Graphics Analyzer\n');

    const projectPath = options.path || process.cwd();

    try {
      const AutonomousGraphicsSystem = require('../../automation/autonomous-graphics-system');
      const graphicsSystem = new AutonomousGraphicsSystem();

      // Get existing graphics
      const analysis = await graphicsSystem.discovery.analyzeProject(projectPath);

      console.log('Graphics Analysis:\n');
      console.log(`Total Files: ${analysis.foundGraphics.length}`);
      console.log(`Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Formats: ${Array.from(analysis.imageFormats).join(', ')}\n`);

      // Analyze by format
      const byFormat = {};
      analysis.foundGraphics.forEach(g => {
        if (!byFormat[g.format]) byFormat[g.format] = { count: 0, size: 0 };
        byFormat[g.format].count++;
        byFormat[g.format].size += g.size;
      });

      console.log('By Format:');
      Object.entries(byFormat).forEach(([format, data]) => {
        const sizeMB = (data.size / 1024 / 1024).toFixed(2);
        console.log(`  ${format.toUpperCase()}: ${data.count} files (${sizeMB} MB)`);
      });
      console.log('');

      // Check for missing essentials
      const essentialGraphics = ['logo', 'favicon', 'og-image'];
      const existing = new Set(analysis.foundGraphics.map(g => g.name.toLowerCase()));

      const missing = essentialGraphics.filter(name => !existing.has(name));

      if (missing.length > 0) {
        console.log('⚠️  Missing Essential Graphics:');
        missing.forEach(name => console.log(`  - ${name}`));
        console.log('\nRun "tryforge graphics:generate" to create missing graphics\n');
      } else {
        console.log('✅ All essential graphics present\n');
      }

      // Optimization suggestions
      console.log('💡 Optimization Suggestions:');

      const largePNGs = analysis.foundGraphics.filter(
        g => g.format === 'png' && g.size > 500 * 1024
      );

      if (largePNGs.length > 0) {
        console.log(`  • Convert ${largePNGs.length} large PNGs to WebP for better compression`);
      }

      const noWebP = !analysis.imageFormats.has('webp');
      if (noWebP && analysis.foundGraphics.length > 0) {
        console.log('  • Consider using WebP format for better performance');
      }

      if (analysis.totalSize > 10 * 1024 * 1024) {
        console.log('  • Total graphics size > 10MB, consider optimization');
      }

      console.log('');

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Generate specific graphic type
   */
  static async generateType(type, options = {}) {
    console.log(`🎨 Generating ${type}...\n`);

    const projectPath = options.path || process.cwd();

    const typePrompts = {
      logo: {
        name: 'logo',
        category: 'branding',
        purpose: 'Main application logo',
        prompt: `Professional modern logo for ${options.name || 'application'}, minimalist design, ${options.style || 'tech startup'} style`,
        variations: [
          { name: 'logo-light', description: 'Light background version' },
          { name: 'logo-dark', description: 'Dark background version' }
        ],
        formats: ['svg', 'png'],
        sizes: [
          { width: 512, height: 512 },
          { width: 200, height: 50 }
        ],
        priority: 'critical'
      },
      favicon: {
        name: 'favicon',
        category: 'branding',
        purpose: 'Browser favicon',
        prompt: `Favicon for ${options.name || 'application'}, simple recognizable icon`,
        formats: ['ico', 'png'],
        sizes: [
          { width: 16, height: 16 },
          { width: 32, height: 32 },
          { width: 180, height: 180 }
        ],
        priority: 'critical'
      },
      hero: {
        name: 'hero',
        category: 'ui',
        purpose: 'Hero section image',
        prompt: `Hero section background image, ${options.style || 'modern abstract'}, gradient design`,
        formats: ['jpg', 'webp'],
        sizes: [
          { width: 1920, height: 1080 }
        ],
        priority: 'high'
      },
      'og-image': {
        name: 'og-image',
        category: 'marketing',
        purpose: 'Social media sharing',
        prompt: `Social media card for ${options.name || 'application'}, professional design with app name`,
        formats: ['png'],
        sizes: [
          { width: 1200, height: 630 }
        ],
        priority: 'high'
      }
    };

    const spec = typePrompts[type];
    if (!spec) {
      console.error(`❌ Unknown type: ${type}`);
      console.log('\nAvailable types: logo, favicon, hero, og-image\n');
      process.exit(1);
    }

    try {
      const graphicsSystem = new AutonomousGraphicsSystem({
        outputDir: options.output || 'public/images'
      });

      const result = await graphicsSystem.generator.generateGraphics(
        [spec],
        projectPath,
        options
      );

      if (result[0]?.success) {
        console.log(`\n✅ ${type} generated successfully!\n`);
      } else {
        console.error(`\n❌ Failed to generate ${type}\n`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = GraphicsCommand;
