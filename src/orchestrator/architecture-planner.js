/**
 * Architecture Planner
 * Plans application architecture based on requirements
 */

class ArchitecturePlanner {
  async plan(analysis, options) {
    return {
      type: analysis.type,

      database: this.planDatabase(analysis),
      api: this.planAPI(analysis),
      frontend: this.planFrontend(analysis, options),
      graphics: this.planGraphics(analysis),
      design: this.planDesign(options),
    };
  }

  planDatabase(analysis) {
    const tables = ['users'];

    if (analysis.type === 'Blog Platform') {
      tables.push('posts', 'categories', 'comments');
    } else if (analysis.type === 'E-commerce') {
      tables.push('products', 'categories', 'orders', 'cart_items');
    } else if (analysis.type === 'Social Network') {
      tables.push('posts', 'comments', 'friendships', 'messages');
    }

    return { tables };
  }

  planAPI(analysis) {
    const endpoints = [
      { method: 'POST', path: '/api/auth/login' },
      { method: 'POST', path: '/api/auth/register' },
    ];

    if (analysis.type === 'Blog Platform') {
      endpoints.push(
        { method: 'GET', path: '/api/posts' },
        { method: 'POST', path: '/api/posts' },
        { method: 'GET', path: '/api/posts/:id' }
      );
    }

    return { endpoints };
  }

  planFrontend(analysis, options) {
    const components = [
      { name: 'HomePage', features: ['hero', 'overview'] },
      { name: 'Navbar', features: ['navigation', 'user-menu'] },
      { name: 'Footer', features: ['links', 'copyright'] },
    ];

    if (analysis.type === 'Blog Platform') {
      components.push(
        { name: 'PostList', features: ['posts-grid', 'pagination'] },
        { name: 'PostDetail', features: ['content', 'comments'] }
      );
    }

    return {
      framework: options.framework || 'React',
      styling: options.styling || 'CSS Modules',
      components,
    };
  }

  planGraphics(analysis) {
    const items = [
      { name: 'logo', type: 'logo', size: { width: 512, height: 512 } },
      { name: 'hero-image', type: 'hero', size: { width: 1920, height: 1080 }, context: analysis.type },
    ];

    return { items };
  }

  planDesign(options) {
    return {
      style: options.graphics || 'modern',
      colors: options.colors || 'blue purple gradient',
    };
  }
}

module.exports = ArchitecturePlanner;
