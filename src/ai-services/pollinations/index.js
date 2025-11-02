/**
 * Pollinations AI Integration
 * Generates custom graphics based on Claude's detailed prompts
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

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
    // Encode prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct Pollinations AI URL
    const imageUrl = `${this.baseUrl}/${encodedPrompt}?width=${size.width}&height=${size.height}&nologo=true`;

    console.log(chalk.gray(`   Prompt: "${prompt}"`));
    console.log(chalk.gray(`   URL: ${imageUrl}`));

    return imageUrl;
  }

  /**
   * Download generated image to local project
   * @param {string} imageUrl - Pollinations image URL
   * @param {string} name - File name
   * @returns {string} Local file path
   */
  async download(imageUrl, name) {
    try {
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer',
      });

      // Sanitize filename
      const filename = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '.png';
      const filepath = path.join(this.cacheDir, filename);

      // Save image
      await fs.writeFile(filepath, response.data);

      return filepath;

    } catch (error) {
      console.error(chalk.red(`Failed to download ${name}: ${error.message}`));
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
