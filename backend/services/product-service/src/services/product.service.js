
import { NotFoundError, ValidationError } from "../utils/errors.js";

export class ProductService {
  #repository; // Private field (ES2022)
  #cache;
  #validators;

  constructor({ repository, cache = null, validators = {} }) {
    // Destructuring in constructor - cleaner DI pattern
    this.#repository = repository;
    this.#cache = cache;
    this.#validators = validators;
  }

  getAllProducts = async ({ 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    order = 'desc',
    filters = {} 
  } = {}) => {
    try {
  
      const cacheKey = `products:${JSON.stringify({ page, limit, sortBy, order, filters })}`;
      
      if (this.#cache) {
        const cached = await this.#cache.get(cacheKey);
        if (cached) return cached;
      }

      // Modern destructuring with default values
      const { category, minPrice, maxPrice, search } = filters;
      
      // Build query with optional chaining and nullish coalescing
      const query = {
        ...(category && { category }),
        ...(minPrice !== undefined && { price: { $gte: minPrice } }),
        ...(maxPrice !== undefined && { price: { ...query?.price, $lte: maxPrice } }),
        ...(search && { $text: { $search: search } })
      };

      const products = await this.#repository.findAll({
        query,
        pagination: { page, limit },
        sort: { [sortBy]: order }
      });

      const transformed = products.map(this.#transformProduct);

      // Cache the results
      await this.#cache?.set(cacheKey, transformed, 300); // 5 min TTL

      return transformed;
    } catch (error) {
      // Modern error handling with cause (ES2022)
      throw new Error('Failed to fetch products', { cause: error });
    }
  };

  // Private method (ES2022)
  #transformProduct = (product) => ({
    ...product,
    displayPrice: this.#formatPrice(product.price),
    isAvailable: product.stock > 0,
    slug: this.#generateSlug(product.name)
  });

  #formatPrice = (price) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(price);

  #generateSlug = (name) => 
    name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

  getProductById = async (id) => {
    // Guard clause pattern (early return)
    if (!id) {
      throw new ValidationError('Product ID is required');
    }

    // Try cache first
    const cached = await this.#cache?.get(`product:${id}`);
    if (cached) return cached;

    const product = await this.#repository.findById(id);
    
    if (!product) {
      throw new NotFoundError(`Product ${id} not found`);
    }

    const transformed = this.#transformProduct(product);
    await this.#cache?.set(`product:${id}`, transformed, 600);
    
    return transformed;
  };

  createProduct = async (productData) => {
    const validated = await this.#validators.product?.parseAsync(productData);
    
    const data = validated ?? productData;
    
    const enrichedData = {
      ...data,
      slug: this.#generateSlug(data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const created = await this.#repository.create(enrichedData);
    
    // Invalidate cache
    await this.#cache?.delete('products:*');
    
    // Event-driven architecture (emit event for other services)
    await this.#emitEvent('product.created', created);
    
    return this.#transformProduct(created);
  };

  updateProduct = async (id, updateData) => {
    const existing = await this.getProductById(id);
    
    // Modern spread with filtering
    const { id: _, createdAt, ...updateableFields } = updateData;
    
    // Optimistic locking pattern (prevent concurrent updates)
    const updated = await this.#repository.update(id, {
      ...updateableFields,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    }, {
      expectedVersion: existing.version
    });

    // Clear caches
    await Promise.all([
      this.#cache?.delete(`product:${id}`),
      this.#cache?.delete('products:*')
    ]);

    await this.#emitEvent('product.updated', { old: existing, new: updated });
    
    return this.#transformProduct(updated);
  };

  deleteProduct = async (id) => {
    const product = await this.getProductById(id);
    
    // Soft delete pattern (don't actually remove)
    await this.#repository.update(id, {
      deletedAt: new Date().toISOString(),
      status: 'deleted'
    });

    // Clear all caches
    await this.#cache?.delete(`product:${id}`);
    await this.#cache?.delete('products:*');
    
    await this.#emitEvent('product.deleted', product);
    
    return { success: true, id };
  };

  // Bulk operations (modern pattern for efficiency)
  bulkCreateProducts = async (products) => {
    // Process in chunks to avoid memory issues
    const CHUNK_SIZE = 100;
    const results = [];
    
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      
      // Parallel processing with Promise.all
      const created = await Promise.all(
        chunk.map(product => this.createProduct(product).catch(err => ({ error: err.message, product })))
      );
      
      results.push(...created);
    }
    
    return {
      success: results.filter(r => !r.error),
      failed: results.filter(r => r.error)
    };
  };

  // Event emitter for microservices communication
  #emitEvent = async (eventType, data) => {
    console.log(`Event: ${eventType}`, data);
  };
}

// Custom Error class (modern error handling)
export class ProductError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'ProductError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// Named exports for utilities
export const ProductEvents = {
  CREATED: 'product.created',
  UPDATED: 'product.updated',
  DELETED: 'product.deleted',
  VIEWED: 'product.viewed'
};