/**
 * Pollinations AI Client - Free Image Generation
 * 
 * Completely free, no API key required!
 * High-quality image generation comparable to Midjourney/DALL-E
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PollinationsClient {
  constructor(config = {}) {
    this.baseURL = 'https://image.pollinations.ai/prompt';
    this.defaultStyle = config.defaultStyle || 'realistic';
    this.defaultSize = config.defaultSize || '1024x1024';
    this.cacheEnabled = config.cacheEnabled !== false;
    this.cacheTTL = config.cacheTTL || 86400000; // 24h
    this.cache = new Map();
    
    // Style presets
    this.styles = {
      'realistic': 'photorealistic, 8k, detailed, professional photography',
      'digital-art': 'digital art, concept art, trending on artstation',
      'anime': 'anime style, manga, vibrant colors',
      'sketch': 'pencil sketch, hand drawn, artistic',
      'abstract': 'abstract art, modern, creative',
      '3d-render': '3d render, octane render, unreal engine',
      'pixel-art': 'pixel art, retro gaming style',
      'watercolor': 'watercolor painting, artistic',
      'minimalist': 'minimalist design, simple, clean',
      'cyberpunk': 'cyberpunk style, neon, futuristic'
    };
  }

  /**
   * Generate image from prompt
   */
  async generate(options) {
    const {
      prompt,
      style = this.defaultStyle,
      size = this.defaultSize,
      seed,
      negative,
      enhance = true
    } = options;

    // Build enhanced prompt
    const enhancedPrompt = this.buildPrompt(prompt, style, negative, enhance);
    
    // Check cache
    if (this.cacheEnabled) {
      const cached = this.getFromCache(enhancedPrompt, size);
      if (cached) {
        return {
          ...cached,
          cached: true
        };
      }
    }

    // Parse size
    const [width, height] = size.split('x').map(Number);

    try {
      // Build URL
      let url = `${this.baseURL}/${encodeURIComponent(enhancedPrompt)}`;
      url += `?width=${width}&height=${height}`;
      
      if (seed) {
        url += `&seed=${seed}`;
      }
      
      if (negative) {
        url += `&negative=${encodeURIComponent(negative)}`;
      }

      // Generate image
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000  // 60s timeout
      });

      const imageBuffer = Buffer.from(response.data);
      const imageBase64 = imageBuffer.toString('base64');
      const imageData = `data:image/png;base64,${imageBase64}`;

      const result = {
        url,
        data: imageData,
        buffer: imageBuffer,
        prompt: enhancedPrompt,
        originalPrompt: prompt,
        style,
        size,
        seed,
        timestamp: Date.now(),
        free: true,
        cost: 0
      };

      // Cache result
      if (this.cacheEnabled) {
        this.addToCache(enhancedPrompt, size, result);
      }

      return result;

    } catch (error) {
      console.error('Pollinations AI Error:', error.message);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Generate and save to file
   */
  async generateAndSave(options) {
    const {
      outputPath,
      filename = 'generated-image.png',
      ...generateOptions
    } = options;

    const result = await this.generate(generateOptions);
    
    // Ensure output directory exists
    const fullPath = path.join(outputPath || './output', filename);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save image
    fs.writeFileSync(fullPath, result.buffer);

    return {
      ...result,
      filepath: fullPath
    };
  }

  /**
   * Generate multiple variations
   */
  async generateVariations(options) {
    const {
      prompt,
      count = 4,
      ...otherOptions
    } = options;

    const variations = [];
    
    for (let i = 0; i < count; i++) {
      const result = await this.generate({
        prompt,
        seed: Date.now() + i,  // Different seed for each
        ...otherOptions
      });
      
      variations.push(result);
      
      // Rate limiting (10 images/min)
      if (i < count - 1) {
        await this.delay(6000);  // 6s between requests
      }
    }

    return variations;
  }

  /**
   * Build enhanced prompt with style
   */
  buildPrompt(prompt, style, negative, enhance) {
    let enhancedPrompt = prompt;

    // Add style preset
    if (this.styles[style]) {
      enhancedPrompt += `, ${this.styles[style]}`;
    }

    // Add quality enhancers
    if (enhance) {
      enhancedPrompt += ', high quality, detailed, professional';
    }

    return enhancedPrompt;
  }

  /**
   * Generate logo
   */
  async generateLogo(options) {
    const {
      companyName,
      industry,
      style = 'minimalist',
      colors = []
    } = options;

    let prompt = `professional logo for ${companyName}`;
    
    if (industry) {
      prompt += `, ${industry} industry`;
    }
    
    if (colors.length > 0) {
      prompt += `, colors: ${colors.join(', ')}`;
    }

    return this.generate({
      prompt,
      style,
      size: '512x512',
      enhance: true
    });
  }

  /**
   * Generate hero image
   */
  async generateHeroImage(options) {
    const {
      theme,
      mood = 'professional',
      colors = []
    } = options;

    let prompt = `hero image for website, ${theme}`;
    prompt += `, ${mood} atmosphere`;
    
    if (colors.length > 0) {
      prompt += `, ${colors.join(' and ')} color scheme`;
    }

    return this.generate({
      prompt,
      style: 'digital-art',
      size: '1920x1080',
      enhance: true
    });
  }

  /**
   * Generate icon
   */
  async generateIcon(options) {
    const {
      iconType,
      style = 'minimalist',
      color = 'blue'
    } = options;

    const prompt = `${iconType} icon, ${style} style, ${color}, simple, clean`;

    return this.generate({
      prompt,
      style: 'digital-art',
      size: '512x512',
      enhance: true
    });
  }

  /**
   * Generate product mockup
   */
  async generateProductMockup(options) {
    const {
      productType,
      background = 'white',
      angle = 'front view'
    } = options;

    const prompt = `${productType} mockup, ${angle}, ${background} background, professional product photography`;

    return this.generate({
      prompt,
      style: '3d-render',
      size: '1024x1024',
      enhance: true
    });
  }

  /**
   * Generate background pattern
   */
  async generateBackground(options) {
    const {
      pattern = 'abstract',
      colors = ['blue', 'purple'],
      style = 'abstract'
    } = options;

    const prompt = `${pattern} background pattern, ${colors.join(' and ')} gradient, seamless tile`;

    return this.generate({
      prompt,
      style,
      size: '1920x1080',
      enhance: false
    });
  }

  /**
   * Generate illustration
   */
  async generateIllustration(options) {
    const {
      subject,
      style = 'digital-art',
      mood = 'friendly'
    } = options;

    const prompt = `illustration of ${subject}, ${mood} mood, colorful`;

    return this.generate({
      prompt,
      style,
      size: '1024x1024',
      enhance: true
    });
  }

  /**
   * Cache management
   */
  getFromCache(prompt, size) {
    const key = `${prompt}-${size}`;
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached;
    }
    
    return null;
  }

  addToCache(prompt, size, result) {
    const key = `${prompt}-${size}`;
    this.cache.set(key, result);
    
    // Clean old cache entries (keep last 100)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get available styles
   */
  getAvailableStyles() {
    return Object.keys(this.styles).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
      description: this.styles[key]
    }));
  }

  /**
   * Get common sizes
   */
  getCommonSizes() {
    return {
      'square-small': '512x512',
      'square-medium': '1024x1024',
      'landscape': '1920x1080',
      'portrait': '1080x1920',
      'wide': '2560x1440',
      'social': '1200x628',
      'story': '1080x1920',
      'banner': '1920x600'
    };
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test generation
   */
  async test() {
    try {
      const result = await this.generate({
        prompt: 'test image, simple red circle on white background',
        size: '512x512',
        style: 'minimalist'
      });
      
      return {
        success: true,
        message: 'Pollinations AI working correctly',
        imageGenerated: true,
        size: result.size,
        free: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PollinationsClient;
