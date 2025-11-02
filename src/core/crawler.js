/**
 * Web Crawler Module
 * Headless browser automation and web scraping
 */

const { chromium } = require('playwright');
const cheerio = require('cheerio');
const Logger = require('../utils/logger');

class WebCrawler {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent: options.userAgent || 'TryForge-Crawler/1.0',
      rateLimit: options.rateLimit || 1000, // ms between requests
      maxConcurrent: options.maxConcurrent || 5
    };
    this.logger = new Logger();
    this.browser = null;
  }

  async initialize() {
    this.logger.info('Initializing web crawler...');
    this.browser = await chromium.launch({
      headless: this.options.headless
    });
  }

  async crawl(url, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    this.logger.info(`Crawling: ${url}`);
    
    const context = await this.browser.newContext({
      userAgent: this.options.userAgent
    });
    
    const page = await context.newPage();
    
    try {
      await page.goto(url, { 
        timeout: this.options.timeout,
        waitUntil: 'networkidle'
      });

      // Wait for rate limit
      await this.sleep(this.options.rateLimit);

      // Extract data
      const html = await page.content();
      const data = await this.extractData(html, options.selectors);
      
      // Take screenshot if requested
      if (options.screenshot) {
        await page.screenshot({ 
          path: options.screenshotPath || 'screenshot.png' 
        });
      }

      await context.close();
      
      return {
        url,
        data,
        html,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Crawling failed for ${url}:`, error);
      throw error;
    }
  }

  async crawlMultiple(urls, options = {}) {
    this.logger.info(`Crawling ${urls.length} URLs...`);
    
    const results = [];
    const chunks = this.chunkArray(urls, this.options.maxConcurrent);
    
    for (const chunk of chunks) {
      const promises = chunk.map(url => this.crawl(url, options));
      const chunkResults = await Promise.allSettled(promises);
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error('Crawl failed:', result.reason);
        }
      }
    }
    
    return results;
  }

  async extractData(html, selectors = {}) {
    const $ = cheerio.load(html);
    const data = {};

    if (selectors.title) {
      data.title = $(selectors.title).first().text().trim();
    }

    if (selectors.description) {
      data.description = $(selectors.description).first().text().trim();
    }

    if (selectors.links) {
      data.links = [];
      $(selectors.links).each((i, el) => {
        data.links.push($(el).attr('href'));
      });
    }

    if (selectors.images) {
      data.images = [];
      $(selectors.images).each((i, el) => {
        data.images.push($(el).attr('src'));
      });
    }

    // Default extraction if no selectors provided
    if (Object.keys(selectors).length === 0) {
      data.title = $('title').text().trim();
      data.headings = [];
      $('h1, h2, h3').each((i, el) => {
        data.headings.push($(el).text().trim());
      });
    }

    return data;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.logger.info('Crawler closed');
    }
  }

  // Helper methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = WebCrawler;
