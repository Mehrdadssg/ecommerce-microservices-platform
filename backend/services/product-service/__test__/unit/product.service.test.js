import { jest } from '@jest/globals';
import { ProductService, ProductError } from '../../src/services/product.service.js';

describe('ProductService', () => {
  let productService;
  let mockRepository;
  let mockCache;
  let mockValidators;

  beforeEach(() => {
    // Modern mock setup
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    };

    mockValidators = {
      product: {
        parseAsync: jest.fn(data => Promise.resolve(data))
      }
    };

    // Dependency injection with object destructuring
    productService = new ProductService({
      repository: mockRepository,
      cache: mockCache,
      validators: mockValidators
    });
  });

  describe('getAllProducts', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = [
        { id: '1', name: 'iPhone 15', price: 999 }
      ];
      
      mockCache.get.mockResolvedValue(cachedProducts);
      
      const result = await productService.getAllProducts();
      
      expect(result).toEqual(cachedProducts);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('should fetch from repository if cache miss', async () => {
      const products = [
        { id: '1', name: 'iPhone 15', price: 999, stock: 10 }
      ];
      
      mockCache.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(products);
      
      const result = await productService.getAllProducts();
      
      // Check transformation
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'iPhone 15',
        displayPrice: expect.stringContaining('$'),
        isAvailable: true,
        slug: 'iphone-15'
      });
      
      // Verify caching
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle pagination and filters', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([]);
      
      await productService.getAllProducts({
        page: 2,
        limit: 10,
        filters: { category: 'electronics', minPrice: 100 }
      });
      
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        query: { category: 'electronics', price: { $gte: 100 } },
        pagination: { page: 2, limit: 10 },
        sort: { createdAt: 'desc' }
      });
    });
  });

  describe('createProduct', () => {
    it('should validate and create product', async () => {
      const productData = { name: 'iPad Pro', price: 1299, stock: 5 };
      const created = { id: '123', ...productData };
      
      mockRepository.create.mockResolvedValue(created);
      
      const result = await productService.createProduct(productData);
      
      expect(mockValidators.product.parseAsync).toHaveBeenCalledWith(productData);
      expect(result).toMatchObject({
        slug: 'ipad-pro',
        displayPrice: expect.stringContaining('$')
      });
      
      // Verify cache invalidation
      expect(mockCache.delete).toHaveBeenCalledWith('products:*');
    });

    it('should handle validation errors', async () => {
      mockValidators.product.parseAsync.mockRejectedValue(
        new Error('Validation failed')
      );
      
      await expect(
        productService.createProduct({ name: 'Invalid' })
      ).rejects.toThrow();
    });
  });

  describe('updateProduct with optimistic locking', () => {
    it('should update with version check', async () => {
      const existing = { 
        id: '1', 
        name: 'iPhone', 
        version: 1,
        stock: 10 
      };
      
      const updated = { ...existing, name: 'iPhone 15', version: 2 };
      
      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);
      
      const result = await productService.updateProduct('1', { name: 'iPhone 15' });
      
      expect(mockRepository.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ version: 2 }),
        { expectedVersion: 1 }
      );
      
      // Verify cache clearing
      expect(mockCache.delete).toHaveBeenCalledWith('product:1');
      expect(mockCache.delete).toHaveBeenCalledWith('products:*');
    });
  });

  describe('error handling', () => {
    it('should throw ProductError for business logic failures', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      try {
        await productService.getProductById('999');
      } catch (error) {
        expect(error).toBeInstanceOf(ProductError);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.statusCode).toBe(404);
      }
    });
  });
});