/**
 * Pollinations AI Integration
 * Generates custom graphics based on Claude's detailed prompts
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const logger = require('../../utils/logger');
const { retryWithBackoff, errorHandler } = require('../../utils/error-handler');

class PollinationsAI {
  constructor() {
    this.baseUrl = 'https://image.pollinations.ai/prompt';
    this.cacheDir = path.join(process.cwd(), '.tryforge-cache', 'images');
    fs.ensureDirSync(this.cacheDir);
  }

  /**
   * Generate image from Claude's prompt
   * @param {string} prompt - Detailed prompt created by Claude
   * @param {Object} size - Image dimensions
   * @returns {string} Image URL
   */
  async generate(prompt, size = { width: 1024, height: 1024 }) {
    logger.logAIRequest('Pollinations', 'image-generation', 'generate_image', {
      promptLength: prompt.length,
      width: size.width,
      height: size.height
    });

    try {
      // Encode prompt for URL
      const encodedPrompt = encodeURIComponent(prompt);

      // Construct Pollinations AI URL
      const imageUrl = `${this.baseUrl}/${encodedPrompt}?width=${size.width}&height=${size.height}&nologo=true`;

      console.log(chalk.gray(`   Prompt: "${prompt}"`));
      console.log(chalk.gray(`   URL: ${imageUrl}`));

      logger.logAIResponse('Pollinations', true, {
        operation: 'generate_image',
        imageUrl: imageUrl
      });

      return imageUrl;
    } catch (error) {
      logger.error('Pollinations image generation error', {
        error: error.message,
        prompt: prompt.substring(0, 100)
      });

      errorHandler.handleAIError(error, 'Pollinations', 'image generation', {
        silent: true
      });

      throw error;
    }
  }

  /**
   * Download generated image to local project
   * @param {string} imageUrl - Pollinations image URL
   * @param {string} name - File name
   * @returns {string} Local file path
   */
  async download(imageUrl, name) {
    logger.info('Downloading image from Pollinations', {
      name: name,
      url: imageUrl
    });

    try {
      const filepath = await retryWithBackoff(
        async () => {
          const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 30000, // 30 second timeout
          });

          // Sanitize filename
          const filename = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '.png';
          const filePath = path.join(this.cacheDir, filename);

          // Save image
          await fs.writeFile(filePath, response.data);

          return filePath;
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (error, attempt, maxRetries) => {
            logger.warn(`Retrying image download (${attempt}/${maxRetries})`, {
              name: name,
              error: error.message
            });
            console.log(chalk.yellow(`⏳ Retrying download... (${attempt}/${maxRetries})`));
          }
        }
      );

      logger.info('Image downloaded successfully', {
        name: name,
        filepath: filepath
      });

      return filepath;

    } catch (error) {
      logger.error('Failed to download image after retries', {
        name: name,
        url: imageUrl,
        error: error.message
      });

      errorHandler.handleNetworkError(error, imageUrl, {
        context: `Downloading image: ${name}`,
        recovery: 'Check your internet connection and try again',
        suggestion: 'The Pollinations API may be experiencing issues'
      });

      throw error;
    }
  }

  /**
   * Optimize image (resize, compress)
   * @param {string} filepath - Path to image
   */
  async optimize(filepath) {
    // Simplified - actual implementation would use sharp or similar
    console.log(chalk.gray(`   Optimizing: ${filepath}`));
    return filepath;
  }

  /**
   * Copy image to project assets
   * @param {string} sourcePath - Source file path
   * @param {string} projectPath - Project directory
   * @param {string} assetsSubdir - Subdirectory in assets
   */
  async copyToProject(sourcePath, projectPath, assetsSubdir = '') {
    const assetsDir = path.join(projectPath, 'src', 'assets', assetsSubdir);
    await fs.ensureDir(assetsDir);

    const filename = path.basename(sourcePath);
    const destPath = path.join(assetsDir, filename);

    await fs.copy(sourcePath, destPath);

    return path.join('src', 'assets', assetsSubdir, filename);
  }
}

module.exports = PollinationsAI;
