const TestDataFactory = require('../data-factory');
const logger = require('../../../utils/logger');

/**
 * ProductGenerator - Generate product test data
 *
 * Specialized generator for product-related test data
 */
class ProductGenerator {
  constructor(config = {}) {
    this.factory = new TestDataFactory(config);
    this.config = config;
  }

  /**
   * Generate single product
   */
  generate(options = {}) {
    return this.factory.generateProduct(options);
  }

  /**
   * Generate multiple products
   */
  generateMany(count, options = {}) {
    const products = [];

    for (let i = 0; i < count; i++) {
      products.push(this.generate(options));
    }

    return products;
  }

  /**
   * Generate featured product
   */
  generateFeatured(options = {}) {
    return this.factory.generateProduct({
      isFeatured: true,
      isActive: true,
      stock: this.factory.generateInteger(50, 500),
      ...options
    });
  }

  /**
   * Generate out of stock product
   */
  generateOutOfStock(options = {}) {
    return this.factory.generateProduct({
      stock: 0,
      isActive: false,
      ...options
    });
  }

  /**
   * Generate low stock product
   */
  generateLowStock(options = {}) {
    return this.factory.generateProduct({
      stock: this.factory.generateInteger(1, 10),
      lowStockThreshold: 10,
      isActive: true,
      ...options
    });
  }

  /**
   * Generate product on sale
   */
  generateOnSale(options = {}) {
    const price = this.factory.generatePrice(50, 500);
    const comparePrice = parseFloat((price * 1.3).toFixed(2));

    return this.factory.generateProduct({
      price,
      comparePrice,
      isActive: true,
      isFeatured: true,
      ...options
    });
  }

  /**
   * Generate digital product
   */
  generateDigital(options = {}) {
    return this.factory.generateProduct({
      weight: 0,
      weightUnit: null,
      stock: 999999,
      isActive: true,
      type: 'digital',
      downloadUrl: `https://example.com/downloads/${this.factory.generateUUID()}`,
      ...options
    });
  }

  /**
   * Generate product with variants
   */
  generateWithVariants(variantCount = 3, options = {}) {
    const baseProduct = this.generate(options);

    baseProduct.variants = [];

    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['Red', 'Blue', 'Green', 'Black', 'White'];

    for (let i = 0; i < variantCount; i++) {
      const size = sizes[i % sizes.length];
      const color = colors[i % colors.length];

      baseProduct.variants.push({
        id: this.factory.generateInteger(1000, 9999),
        productId: baseProduct.id,
        sku: `${baseProduct.sku}-${size}-${color.substring(0, 2).toUpperCase()}`,
        name: `${baseProduct.name} (${size}, ${color})`,
        price: baseProduct.price + this.factory.generateFloat(-10, 10, 2),
        stock: this.factory.generateInteger(0, 100),
        attributes: {
          size,
          color
        },
        isActive: true,
        createdAt: baseProduct.createdAt,
        updatedAt: baseProduct.updatedAt
      });
    }

    return baseProduct;
  }

  /**
   * Generate product with categories
   */
  generateWithCategories(categoryCount = 2, options = {}) {
    const product = this.generate(options);

    product.categories = [];
    for (let i = 0; i < categoryCount; i++) {
      product.categories.push(this.factory.generateCategory());
    }

    return product;
  }

  /**
   * Generate product with reviews
   */
  generateWithReviews(reviewCount = 10, options = {}) {
    const product = this.generate(options);

    product.reviews = [];
    let totalRating = 0;

    for (let i = 0; i < reviewCount; i++) {
      const review = this.factory.generateReview({
        productId: product.id,
        verified: i % 3 === 0, // Every third review is verified
        status: i % 5 === 0 ? 'pending' : 'approved'
      });

      totalRating += review.rating;
      product.reviews.push(review);
    }

    // Calculate average rating
    product.averageRating = parseFloat((totalRating / reviewCount).toFixed(2));
    product.reviewCount = reviewCount;

    return product;
  }

  /**
   * Generate product with images
   */
  generateWithImages(imageCount = 4, options = {}) {
    const product = this.generate(options);

    product.images = [];
    for (let i = 0; i < imageCount; i++) {
      product.images.push({
        id: this.factory.generateInteger(1000, 9999),
        productId: product.id,
        url: `https://picsum.photos/seed/${product.sku}-${i}/800/600`,
        thumbnailUrl: `https://picsum.photos/seed/${product.sku}-${i}/200/150`,
        altText: `${product.name} - Image ${i + 1}`,
        sortOrder: i,
        isPrimary: i === 0,
        createdAt: product.createdAt
      });
    }

    return product;
  }

  /**
   * Generate complete product with all relations
   */
  generateComplete(options = {}) {
    const {
      variants = 3,
      categories = 2,
      reviews = 10,
      images = 4,
      ...productOptions
    } = options;

    let product = this.generate(productOptions);

    // Add variants
    if (variants > 0) {
      const withVariants = this.generateWithVariants(variants, productOptions);
      product.variants = withVariants.variants;
    }

    // Add categories
    if (categories > 0) {
      product.categories = [];
      for (let i = 0; i < categories; i++) {
        product.categories.push(this.factory.generateCategory());
      }
    }

    // Add reviews
    if (reviews > 0) {
      const withReviews = this.generateWithReviews(reviews, productOptions);
      product.reviews = withReviews.reviews;
      product.averageRating = withReviews.averageRating;
      product.reviewCount = withReviews.reviewCount;
    }

    // Add images
    if (images > 0) {
      const withImages = this.generateWithImages(images, productOptions);
      product.images = withImages.images;
    }

    return product;
  }

  /**
   * Generate product catalog
   */
  generateCatalog(count = 20, options = {}) {
    const catalog = {
      featured: [],
      new: [],
      onSale: [],
      regular: []
    };

    const featuredCount = Math.ceil(count * 0.2);
    const newCount = Math.ceil(count * 0.3);
    const saleCount = Math.ceil(count * 0.2);
    const regularCount = count - featuredCount - newCount - saleCount;

    // Featured products
    for (let i = 0; i < featuredCount; i++) {
      catalog.featured.push(this.generateFeatured(options));
    }

    // New products
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < newCount; i++) {
      catalog.new.push(this.generate({
        createdAt: this.factory.generateDate(recentDate, new Date()),
        ...options
      }));
    }

    // Sale products
    for (let i = 0; i < saleCount; i++) {
      catalog.onSale.push(this.generateOnSale(options));
    }

    // Regular products
    for (let i = 0; i < regularCount; i++) {
      catalog.regular.push(this.generate(options));
    }

    return catalog;
  }

  /**
   * Generate products by price range
   */
  generateByPriceRange(counts, options = {}) {
    const {
      budget = 5,     // Under $50
      midRange = 10,  // $50-$200
      premium = 5,    // $200-$500
      luxury = 2      // Over $500
    } = counts;

    const products = [];

    // Budget products
    for (let i = 0; i < budget; i++) {
      products.push(this.generate({
        price: this.factory.generatePrice(10, 50),
        ...options
      }));
    }

    // Mid-range products
    for (let i = 0; i < midRange; i++) {
      products.push(this.generate({
        price: this.factory.generatePrice(50, 200),
        ...options
      }));
    }

    // Premium products
    for (let i = 0; i < premium; i++) {
      products.push(this.generate({
        price: this.factory.generatePrice(200, 500),
        ...options
      }));
    }

    // Luxury products
    for (let i = 0; i < luxury; i++) {
      products.push(this.generate({
        price: this.factory.generatePrice(500, 2000),
        ...options
      }));
    }

    return products;
  }

  /**
   * Generate products with stock distribution
   */
  generateWithStockDistribution(count = 20, options = {}) {
    const products = {
      inStock: [],
      lowStock: [],
      outOfStock: []
    };

    const inStockCount = Math.ceil(count * 0.7);
    const lowStockCount = Math.ceil(count * 0.2);
    const outOfStockCount = count - inStockCount - lowStockCount;

    // In stock
    for (let i = 0; i < inStockCount; i++) {
      products.inStock.push(this.generate({
        stock: this.factory.generateInteger(50, 500),
        ...options
      }));
    }

    // Low stock
    for (let i = 0; i < lowStockCount; i++) {
      products.lowStock.push(this.generateLowStock(options));
    }

    // Out of stock
    for (let i = 0; i < outOfStockCount; i++) {
      products.outOfStock.push(this.generateOutOfStock(options));
    }

    return products;
  }

  /**
   * Generate seasonal products
   */
  generateSeasonal(season, count = 10, options = {}) {
    const seasonalNames = {
      spring: ['Spring Collection', 'Fresh', 'Bloom', 'Garden'],
      summer: ['Summer Special', 'Beach', 'Sunshine', 'Tropical'],
      autumn: ['Fall Collection', 'Harvest', 'Cozy', 'Autumn'],
      winter: ['Winter Warmth', 'Holiday', 'Frost', 'Snow']
    };

    const names = seasonalNames[season.toLowerCase()] || seasonalNames.spring;
    const products = [];

    for (let i = 0; i < count; i++) {
      const baseName = names[i % names.length];
      products.push(this.generate({
        name: `${baseName} ${this.factory.generateProductName()}`,
        isFeatured: true,
        ...options
      }));
    }

    return products;
  }

  /**
   * Generate bundle/kit product
   */
  generateBundle(itemCount = 3, options = {}) {
    const bundle = this.generate({
      name: `Bundle - ${this.factory.generateProductName()}`,
      ...options
    });

    bundle.items = [];
    let totalPrice = 0;

    for (let i = 0; i < itemCount; i++) {
      const item = this.generate();
      bundle.items.push(item);
      totalPrice += item.price;
    }

    // Bundle discount (10-20% off)
    const discount = this.factory.generateFloat(0.1, 0.2, 2);
    bundle.price = parseFloat((totalPrice * (1 - discount)).toFixed(2));
    bundle.comparePrice = totalPrice;

    return bundle;
  }
}

module.exports = ProductGenerator;
