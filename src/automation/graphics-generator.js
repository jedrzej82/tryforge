const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

/**
 * Graphics Generator
 * Generates professional graphics using Pollinations AI and other services
 */
class GraphicsGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'public/images',
      quality: options.quality || 90,
      optimize: options.optimize !== false,
      generateVariations: options.generateVariations !== false,
      ...options
    };

    // Pollinations AI endpoint
    this.pollinationsAPI = 'https://image.pollinations.ai/prompt';

    // Alternative AI image services
    this.services = {
      pollinations: 'https://image.pollinations.ai/prompt',
      // Fallback to other free services if needed
    };
  }

  /**
   * Generate all graphics for a project
   */
  async generateGraphics(graphics, projectPath, options = {}) {
    console.log(`\n🎨 Generating ${graphics.length} professional graphics...\n`);

    const results = [];
    const outputDir = path.join(projectPath, this.options.outputDir);

    // Create output directory
    await this.ensureDirectory(outputDir);

    // Sort by priority
    const sortedGraphics = this.sortByPriority(graphics);

    for (const graphic of sortedGraphics) {
      try {
        console.log(`📸 Generating: ${graphic.name} (${graphic.category})...`);

        const result = await this.generateGraphic(graphic, outputDir, options);
        results.push({
          success: true,
          graphic: graphic.name,
          ...result
        });

        console.log(`✅ Generated ${graphic.name} successfully`);

        // Small delay to avoid rate limiting
        await this.delay(500);

      } catch (error) {
        console.error(`❌ Failed to generate ${graphic.name}:`, error.message);
        results.push({
          success: false,
          graphic: graphic.name,
          error: error.message
        });
      }
    }

    // Generate summary
    const successful = results.filter(r => r.success).length;
    console.log(`\n✨ Graphics generation complete: ${successful}/${graphics.length} successful\n`);

    return results;
  }

  /**
   * Generate a single graphic with all its variations and sizes
   */
  async generateGraphic(graphic, outputDir, options = {}) {
    const files = [];

    // Enhance prompt with quality indicators
    const enhancedPrompt = this.enhancePrompt(graphic.prompt, graphic);

    // Generate main graphic
    const mainImage = await this.generateImage(enhancedPrompt, {
      width: graphic.sizes?.[0]?.width || 1024,
      height: graphic.sizes?.[0]?.height || 1024
    });

    // Save in all required formats and sizes
    for (const size of graphic.sizes || [{ width: 1024, height: 1024 }]) {
      for (const format of graphic.formats || ['png']) {
        const fileName = `${graphic.name}-${size.width}x${size.height}.${format}`;
        const filePath = path.join(outputDir, graphic.category || 'general', fileName);

        await this.ensureDirectory(path.dirname(filePath));
        await this.saveImage(mainImage, filePath, size, format);

        files.push({
          path: filePath,
          relativePath: path.relative(outputDir, filePath),
          size: `${size.width}x${size.height}`,
          format
        });
      }
    }

    // Generate variations if specified
    if (graphic.variations && this.options.generateVariations) {
      for (const variation of graphic.variations) {
        const variationPrompt = `${enhancedPrompt}, ${variation.description}`;
        const variationImage = await this.generateImage(variationPrompt, {
          width: graphic.sizes?.[0]?.width || 1024,
          height: graphic.sizes?.[0]?.height || 1024
        });

        for (const format of graphic.formats || ['png']) {
          const fileName = `${variation.name}.${format}`;
          const filePath = path.join(outputDir, graphic.category || 'general', fileName);

          await this.saveImage(variationImage, filePath, graphic.sizes?.[0], format);

          files.push({
            path: filePath,
            relativePath: path.relative(outputDir, filePath),
            variation: variation.name,
            format
          });
        }

        await this.delay(500);
      }
    }

    return { files };
  }

  /**
   * Generate image using Pollinations AI
   */
  async generateImage(prompt, dimensions = {}) {
    const width = dimensions.width || 1024;
    const height = dimensions.height || 1024;

    // Encode prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // Build Pollinations AI URL
    const imageUrl = `${this.pollinationsAPI}/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`;

    try {
      console.log(`  → Requesting from AI: ${width}x${height}`);
      const imageBuffer = await this.downloadImage(imageUrl);

      // Optimize image if enabled
      if (this.options.optimize) {
        return await this.optimizeImage(imageBuffer);
      }

      return imageBuffer;

    } catch (error) {
      console.error('  ⚠️  Pollinations AI failed, trying fallback...');
      return await this.generateFallbackImage(prompt, dimensions);
    }
  }

  /**
   * Download image from URL
   */
  downloadImage(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Generate fallback image (gradient or placeholder)
   */
  async generateFallbackImage(prompt, dimensions) {
    const width = dimensions.width || 1024;
    const height = dimensions.height || 1024;

    // Generate a nice gradient placeholder
    const colors = this.extractColorsFromPrompt(prompt);

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
        <text x="50%" y="50%" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.8">
          ${prompt.substring(0, 50)}
        </text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  /**
   * Save image to file with proper format and size
   */
  async saveImage(imageBuffer, filePath, size, format) {
    let pipeline = sharp(imageBuffer);

    // Resize if needed
    if (size) {
      pipeline = pipeline.resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      });
    }

    // Convert format and optimize
    switch (format.toLowerCase()) {
      case 'png':
        pipeline = pipeline.png({ quality: this.options.quality, compressionLevel: 9 });
        break;
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: this.options.quality, progressive: true });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: this.options.quality });
        break;
      case 'svg':
        // SVG is already in the correct format
        await fs.writeFile(filePath, imageBuffer);
        return;
      case 'ico':
        // For ICO, we need to use PNG and rename
        pipeline = pipeline.png({ quality: 100 });
        break;
    }

    await pipeline.toFile(filePath);
  }

  /**
   * Optimize image
   */
  async optimizeImage(imageBuffer) {
    try {
      const optimized = await sharp(imageBuffer)
        .normalize()
        .sharpen()
        .toBuffer();

      return optimized;
    } catch (error) {
      console.warn('  ⚠️  Optimization failed, using original');
      return imageBuffer;
    }
  }

  /**
   * Enhance prompt with quality indicators
   */
  enhancePrompt(basePrompt, graphic) {
    const qualityKeywords = [
      'professional',
      'high quality',
      'detailed',
      'modern design',
      '8k resolution'
    ];

    const categoryEnhancements = {
      branding: 'clean logo design, vector style, professional branding',
      ui: 'modern UI design, user interface element, clean aesthetics',
      icons: 'icon design, simple and recognizable, flat style',
      content: 'high quality photography, realistic, professional',
      marketing: 'eye-catching, marketing material, professional design'
    };

    const enhancement = categoryEnhancements[graphic.category] || 'professional design';

    return `${basePrompt}, ${enhancement}, ${qualityKeywords.join(', ')}`;
  }

  /**
   * Extract colors from prompt for fallback
   */
  extractColorsFromPrompt(prompt) {
    const colorMap = {
      blue: ['#3B82F6', '#1E40AF'],
      red: ['#EF4444', '#B91C1C'],
      green: ['#10B981', '#047857'],
      purple: ['#8B5CF6', '#6D28D9'],
      orange: ['#F59E0B', '#D97706'],
      pink: ['#EC4899', '#BE185D'],
    };

    const lowerPrompt = prompt.toLowerCase();

    for (const [color, values] of Object.entries(colorMap)) {
      if (lowerPrompt.includes(color)) {
        return values;
      }
    }

    // Default gradient
    return ['#667EEA', '#764BA2'];
  }

  /**
   * Sort graphics by priority
   */
  sortByPriority(graphics) {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return [...graphics].sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 3;
      const bPriority = priorityOrder[b.priority] ?? 3;
      return aPriority - bPriority;
    });
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate sprite sheet from multiple icons
   */
  async generateSpriteSheet(icons, outputPath) {
    console.log(`📦 Generating sprite sheet with ${icons.length} icons...`);

    // Calculate sprite dimensions
    const iconSize = 64;
    const columns = Math.ceil(Math.sqrt(icons.length));
    const rows = Math.ceil(icons.length / columns);

    const spriteWidth = columns * iconSize;
    const spriteHeight = rows * iconSize;

    // Create composite image
    const composites = icons.map((icon, index) => ({
      input: icon.buffer,
      top: Math.floor(index / columns) * iconSize,
      left: (index % columns) * iconSize
    }));

    await sharp({
      create: {
        width: spriteWidth,
        height: spriteHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(composites)
      .png()
      .toFile(outputPath);

    console.log(`✅ Sprite sheet generated: ${spriteWidth}x${spriteHeight}`);
  }

  /**
   * Generate favicon package (all sizes)
   */
  async generateFaviconPackage(baseImage, outputDir) {
    console.log('🎯 Generating favicon package...');

    const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
    const files = [];

    for (const size of sizes) {
      const fileName = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
      const filePath = path.join(outputDir, fileName);

      await sharp(baseImage)
        .resize(size, size)
        .png()
        .toFile(filePath);

      files.push(filePath);
    }

    // Generate ICO file (16x16, 32x32, 48x48)
    const icoPath = path.join(outputDir, 'favicon.ico');
    await sharp(baseImage)
      .resize(32, 32)
      .png()
      .toFile(icoPath);

    files.push(icoPath);

    console.log(`✅ Generated ${files.length} favicon files`);
    return files;
  }
}

module.exports = GraphicsGenerator;
