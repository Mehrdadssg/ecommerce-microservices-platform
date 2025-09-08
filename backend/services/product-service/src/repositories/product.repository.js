// Modern Repository Pattern with ES6+

export class ProductRepository {
  #database;
  #logger;

  constructor({ database, logger = console }) {
    this.#database = database;
    this.#logger = logger;
  }

  findAll = async ({ 
    query = {}, 
    pagination = { page: 1, limit: 20 }, 
    sort = { createdAt: 'desc' } 
  } = {}) => {
    try {
      // In real app: Build MongoDB/PostgreSQL query
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      
      // Simulate database query with modern array methods
      let results = this.#database.products ?? [];
      
      // Apply filters
      if (Object.keys(query).length > 0) {
        results = results.filter(product => 
          Object.entries(query).every(([key, value]) => {
            // Handle special MongoDB-like operators
            if (typeof value === 'object' && value !== null) {
              if ('$gte' in value) return product[key] >= value.$gte;
              if ('$lte' in value) return product[key] <= value.$lte;
              if ('$search' in value) {
                return product.name.toLowerCase().includes(value.$search.toLowerCase());
              }
            }
            return product[key] === value;
          })
        );
      }
      
      // Apply sorting
      const [sortField, sortOrder] = Object.entries(sort)[0];
      results.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        return sortOrder === 'asc' ? 
          (aVal > bVal ? 1 : -1) : 
          (bVal > aVal ? 1 : -1);
      });
      
      // Apply pagination
      return results.slice(skip, skip + limit);
    } catch (error) {
      this.#logger.error('Repository error:', error);
      throw new RepositoryError('Failed to fetch products', error);
    }
  };

  findById = async (id) => {
    const products = await this.findAll();
    return products.find(product => product.id === id && !product.deletedAt);
  };

  create = async (productData) => {
    const newProduct = {
      id: crypto.randomUUID(), // Modern UUID generation
      ...productData
    };
    
    // Initialize products array if needed
    this.#database.products ??= [];
    this.#database.products.push(newProduct);
    
    return newProduct;
  };

  update = async (id, updateData, options = {}) => {
    const products = this.#database.products ?? [];
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new RepositoryError(`Product ${id} not found`, null, 404);
    }
    
    // Optimistic locking check
    if (options.expectedVersion !== undefined) {
      if (products[index].version !== options.expectedVersion) {
        throw new RepositoryError('Version mismatch - concurrent update detected', null, 409);
      }
    }
    
    products[index] = {
      ...products[index],
      ...updateData
    };
    
    return products[index];
  };

  // Batch operations for performance
  bulkCreate = async (products) => {
    const created = products.map(product => ({
      id: crypto.randomUUID(),
      ...product,
      createdAt: new Date().toISOString()
    }));
    
    this.#database.products ??= [];
    this.#database.products.push(...created);
    
    return created;
  };

  // Advanced query methods
  aggregate = async (pipeline) => {
    // Simulate MongoDB aggregation pipeline
    // In production, this would be actual MongoDB aggregation
    const products = this.#database.products ?? [];
    
    return pipeline.reduce((acc, stage) => {
      const [[operation, params]] = Object.entries(stage);
      
      switch(operation) {
        case '$match':
          return acc.filter(item => 
            Object.entries(params).every(([key, value]) => item[key] === value)
          );
        case '$group':
          // Simplified grouping logic
          return Object.values(
            acc.reduce((groups, item) => {
              const key = item[params._id.substring(1)]; // Remove $ prefix
              groups[key] ??= [];
              groups[key].push(item);
              return groups;
            }, {})
          );
        default:
          return acc;
      }
    }, products);
  };
}

export class RepositoryError extends Error {
  constructor(message, cause = null, statusCode = 500) {
    super(message);
    this.name = 'RepositoryError';
    this.cause = cause;
    this.statusCode = statusCode;
  }
}