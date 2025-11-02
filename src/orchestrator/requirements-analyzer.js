/**
 * Requirements Analyzer
 * Analyzes user's natural language description to extract requirements
 */

class RequirementsAnalyzer {
  async analyze(description, options) {
    // Simplified analysis - real implementation would use NLP/Claude API
    const type = this.detectApplicationType(description);
    const features = this.extractFeatures(description);
    const techStack = this.determineTechStack(type, options);

    return {
      type,
      complexity: this.estimateComplexity(description, features),
      features,
      techStack,
      suggestedName: this.suggestProjectName(type),
    };
  }

  detectApplicationType(description) {
    const desc = description.toLowerCase();

    if (desc.includes('blog') || desc.includes('post')) return 'Blog Platform';
    if (desc.includes('store') || desc.includes('shop') || desc.includes('ecommerce')) return 'E-commerce';
    if (desc.includes('social') || desc.includes('network')) return 'Social Network';
    if (desc.includes('booking') || desc.includes('reservation')) return 'Booking System';
    if (desc.includes('project') || desc.includes('task')) return 'Project Management';

    return 'Custom Application';
  }

  extractFeatures(description) {
    const features = [];
    const desc = description.toLowerCase();

    if (desc.includes('auth') || desc.includes('login') || desc.includes('user')) features.push('authentication');
    if (desc.includes('comment')) features.push('comments');
    if (desc.includes('cart') || desc.includes('checkout')) features.push('shopping-cart');
    if (desc.includes('payment')) features.push('payments');
    if (desc.includes('search')) features.push('search');
    if (desc.includes('notification')) features.push('notifications');
    if (desc.includes('real-time') || desc.includes('live')) features.push('real-time');

    return features;
  }

  determineTechStack(type, options) {
    return [
      options.framework || 'React',
      options.database || 'PostgreSQL',
      'Express.js',
      'Node.js',
      options.styling || 'CSS Modules',
    ];
  }

  estimateComplexity(description, features) {
    if (features.length >= 5) return 'High';
    if (features.length >= 3) return 'Medium';
    return 'Low';
  }

  suggestProjectName(type) {
    const names = {
      'Blog Platform': 'my-blog',
      'E-commerce': 'my-store',
      'Social Network': 'my-social',
      'Booking System': 'my-booking',
      'Project Management': 'my-projects',
    };

    return names[type] || 'my-app';
  }
}

module.exports = RequirementsAnalyzer;
