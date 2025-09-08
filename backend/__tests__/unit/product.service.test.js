// This is TDD - we write the test before the code exists!
describe('ProductService', () => {
  it('should exist', () => {
    const ProductService = require('../../src/services/product.service');
    expect(ProductService).toBeDefined();
  });

  it('should get all products', async () => {
    // We're testing code that doesn't exist yet!
    const ProductService = require('../../src/services/product.service');
    const mockRepository = {
      findAll: jest.fn().mockResolvedValue([
        { id: 1, name: 'iPhone 15', price: 999 }
      ])
    };
    
    // Dependency Injection in action!
    const service = new ProductService(mockRepository);
    const products = await service.getAllProducts();
    
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('iPhone 15');
  });
});