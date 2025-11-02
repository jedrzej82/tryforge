const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

/**
 * Graphics Discovery System
 * Analyzes application requirements and discovers needed graphics
 */
class GraphicsDiscovery {
  constructor(aiService) {
    this.ai = aiService;
    this.knownGraphics = new Map();
    this.graphicsTypes = {
      branding: ['logo', 'logo-dark', 'logo-light', 'favicon', 'app-icon'],
      ui: ['hero-image', 'background', 'pattern', 'texture'],
      icons: ['feature-icons', 'navigation-icons', 'social-icons', 'payment-icons'],
      content: ['illustrations', 'photos', 'thumbnails', 'avatars', 'placeholders'],
      marketing: ['og-image', 'twitter-card', 'screenshots']
    };
  }

  /**
   * Discover all graphics needed for an application
   */
  async discoverGraphics(requirements) {
    console.log('🎨 Analyzing application requirements for graphics needs...');

    const prompt = `Analyze this web application and determine ALL graphics/images needed:

Application Type: ${requirements.type || 'web application'}
Name: ${requirements.name || 'Application'}
Description: ${requirements.description || 'Web application'}
Features: ${JSON.stringify(requirements.features || [])}
Style: ${requirements.style || 'modern, professional'}
Color Scheme: ${requirements.colorScheme || 'blue and white'}
Target Audience: ${requirements.targetAudience || 'general users'}

Consider:
1. Branding (logo, favicon, app icons)
2. UI elements (hero images, backgrounds, patterns)
3. Feature icons and illustrations
4. Content placeholders
5. Social media sharing images

Return a JSON array of ALL graphics needed with this EXACT structure:
[
  {
    "name": "logo",
    "category": "branding",
    "purpose": "Main application logo",
    "prompt": "Modern professional logo for [app name], minimalist design, tech startup style",
    "variations": [
      {"name": "logo-light", "description": "Logo for light backgrounds"},
      {"name": "logo-dark", "description": "Logo for dark backgrounds"}
    ],
    "formats": ["svg", "png"],
    "sizes": [
      {"width": 512, "height": 512, "usage": "app icon"},
      {"width": 200, "height": 50, "usage": "navbar"}
    ],
    "priority": "critical"
  }
]

Categories: branding, ui, icons, content, marketing
Priorities: critical, high, medium, low

Return ONLY valid JSON array, no markdown, no explanations.`;

    try {
      const response = await this.ai.generateCode(prompt, {
        type: 'analysis',
        maxTokens: 8000
      });

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      const graphics = JSON.parse(jsonMatch[0]);

      // Enrich with metadata
      graphics.forEach(graphic => {
        graphic.id = this.generateGraphicId(graphic);
        graphic.discovered = new Date().toISOString();
        this.knownGraphics.set(graphic.id, graphic);
      });

      console.log(`✅ Discovered ${graphics.length} graphics needed`);
      return graphics;

    } catch (error) {
      console.error('Error discovering graphics:', error.message);
      // Fallback to essential graphics
      return this.getEssentialGraphics(requirements);
    }
  }

  /**
   * Get essential graphics when AI discovery fails
   */
  getEssentialGraphics(requirements) {
    const appName = requirements.name || 'Application';
    const style = requirements.style || 'modern professional';
    const colors = requirements.colorScheme || 'blue and white';

    return [
      {
        id: 'logo-main',
        name: 'logo',
        category: 'branding',
        purpose: 'Main application logo',
        prompt: `Modern professional logo for ${appName}, ${style}, ${colors} color scheme, minimalist design`,
        variations: [
          { name: 'logo-light', description: 'For light backgrounds' },
          { name: 'logo-dark', description: 'For dark backgrounds' }
        ],
        formats: ['svg', 'png'],
        sizes: [
          { width: 512, height: 512, usage: 'app icon' },
          { width: 200, height: 50, usage: 'navbar' }
        ],
        priority: 'critical'
      },
      {
        id: 'favicon',
        name: 'favicon',
        category: 'branding',
        purpose: 'Browser favicon',
        prompt: `Favicon icon for ${appName}, simple recognizable symbol, ${colors}`,
        formats: ['ico', 'png'],
        sizes: [
          { width: 16, height: 16, usage: 'favicon-16' },
          { width: 32, height: 32, usage: 'favicon-32' },
          { width: 180, height: 180, usage: 'apple-touch-icon' }
        ],
        priority: 'critical'
      },
      {
        id: 'hero-image',
        name: 'hero',
        category: 'ui',
        purpose: 'Hero section background',
        prompt: `Hero section image for ${appName}, ${style}, abstract gradient background, ${colors}`,
        formats: ['jpg', 'webp'],
        sizes: [
          { width: 1920, height: 1080, usage: 'desktop' },
          { width: 768, height: 1024, usage: 'mobile' }
        ],
        priority: 'high'
      },
      {
        id: 'og-image',
        name: 'og-image',
        category: 'marketing',
        purpose: 'Social media sharing image',
        prompt: `Open Graph image for ${appName}, professional social media card, includes app name and tagline, ${colors}`,
        formats: ['png'],
        sizes: [
          { width: 1200, height: 630, usage: 'og-image' }
        ],
        priority: 'high'
      }
    ];
  }

  /**
   * Analyze existing project to find what graphics are present
   */
  async analyzeProject(projectPath) {
    console.log('📁 Analyzing existing graphics in project...');

    const analysis = {
      foundGraphics: [],
      graphicsPaths: [],
      imageFormats: new Set(),
      totalSize: 0
    };

    try {
      // Common graphics directories
      const graphicsDirs = [
        'public/images',
        'public/img',
        'public/assets',
        'src/assets/images',
        'src/assets/img',
        'static/images',
        'assets/images'
      ];

      for (const dir of graphicsDirs) {
        const fullPath = path.join(projectPath, dir);
        try {
          await fs.access(fullPath);
          const files = await glob(`${fullPath}/**/*.{png,jpg,jpeg,svg,webp,gif,ico}`, {
            nodir: true
          });

          for (const file of files) {
            const stats = await fs.stat(file);
            const relativePath = path.relative(projectPath, file);
            const ext = path.extname(file).substring(1);

            analysis.foundGraphics.push({
              name: path.basename(file, path.extname(file)),
              path: relativePath,
              format: ext,
              size: stats.size
            });

            analysis.graphicsPaths.push(relativePath);
            analysis.imageFormats.add(ext);
            analysis.totalSize += stats.size;
          }
        } catch (err) {
          // Directory doesn't exist, skip
        }
      }

      console.log(`✅ Found ${analysis.foundGraphics.length} existing graphics`);
      return analysis;

    } catch (error) {
      console.error('Error analyzing project:', error.message);
      return analysis;
    }
  }

  /**
   * Determine which graphics are missing
   */
  async getMissingGraphics(requiredGraphics, projectPath) {
    const existingAnalysis = await this.analyzeProject(projectPath);
    const existing = new Set(
      existingAnalysis.foundGraphics.map(g => g.name.toLowerCase())
    );

    const missing = requiredGraphics.filter(graphic => {
      const graphicName = graphic.name.toLowerCase();

      // Check main graphic
      if (existing.has(graphicName)) return false;

      // Check variations
      if (graphic.variations) {
        const allVariationsExist = graphic.variations.every(v =>
          existing.has(v.name.toLowerCase())
        );
        if (allVariationsExist) return false;
      }

      return true;
    });

    console.log(`📊 Missing ${missing.length} of ${requiredGraphics.length} graphics`);
    return missing;
  }

  /**
   * Detect graphics referenced in code but missing from project
   */
  async detectGraphicsInCode(projectPath) {
    console.log('🔍 Scanning code for graphics references...');

    const referenced = new Set();
    const patterns = [
      /src=["']([^"']*\.(png|jpg|jpeg|svg|webp|gif))["']/gi,
      /url\(["']?([^"')]*\.(png|jpg|jpeg|svg|webp|gif))["']?\)/gi,
      /background(?:-image)?:\s*url\(["']?([^"')]*\.(png|jpg|jpeg|svg|webp|gif))["']?\)/gi,
      /import\s+.*?from\s+["']([^"']*\.(png|jpg|jpeg|svg|webp|gif))["']/gi,
      /require\(["']([^"']*\.(png|jpg|jpeg|svg|webp|gif))["']\)/gi
    ];

    try {
      // Find all source files
      const sourceFiles = await glob(`${projectPath}/**/*.{js,jsx,ts,tsx,html,css,scss,vue}`, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        nodir: true
      });

      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf-8');

        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const imagePath = match[1];
            const imageName = path.basename(imagePath, path.extname(imagePath));
            referenced.add({
              name: imageName,
              path: imagePath,
              referencedIn: path.relative(projectPath, file)
            });
          }
        });
      }

      console.log(`✅ Found ${referenced.size} graphics referenced in code`);
      return Array.from(referenced);

    } catch (error) {
      console.error('Error detecting graphics in code:', error.message);
      return [];
    }
  }

  /**
   * Analyze application type and suggest graphics
   */
  async suggestGraphicsForType(appType, requirements = {}) {
    const suggestions = {
      'e-commerce': [
        'product-placeholder',
        'shopping-cart-icon',
        'payment-icons',
        'category-banners',
        'sale-badges'
      ],
      'blog': [
        'author-avatar',
        'post-thumbnail-placeholder',
        'category-icons',
        'featured-image'
      ],
      'dashboard': [
        'chart-placeholders',
        'widget-icons',
        'user-avatar',
        'empty-state-illustrations'
      ],
      'landing-page': [
        'hero-image',
        'feature-icons',
        'testimonial-avatars',
        'cta-background'
      ],
      'portfolio': [
        'project-thumbnails',
        'skill-icons',
        'about-photo',
        'contact-illustration'
      ],
      'saas': [
        'feature-illustrations',
        'integration-logos',
        'dashboard-preview',
        'pricing-icons'
      ]
    };

    return suggestions[appType] || suggestions['landing-page'];
  }

  /**
   * Generate unique ID for graphic
   */
  generateGraphicId(graphic) {
    return `${graphic.category}-${graphic.name}-${Date.now()}`;
  }

  /**
   * Get graphics by priority
   */
  getGraphicsByPriority(graphics, priority) {
    return graphics.filter(g => g.priority === priority);
  }

  /**
   * Get graphics by category
   */
  getGraphicsByCategory(graphics, category) {
    return graphics.filter(g => g.category === category);
  }
}

module.exports = GraphicsDiscovery;
