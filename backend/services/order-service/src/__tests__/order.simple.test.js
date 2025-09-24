// Create a new test file: src/__tests__/order.simple.test.js
import { OrderService } from '../services/order.service.js';
import { jest } from '@jest/globals';

describe('Order Service Simple Tests', () => {
    let orderService;
    
    beforeAll(() => {
        // Create service with mocked dependencies
        orderService = new OrderService({
            orderRepository: {
                create: jest.fn().mockResolvedValue({ _id: '123', orderNumber: 'ORD-123' }),
                findById: jest.fn().mockResolvedValue({ _id: '123' })
            },
            productService: null,
            userService: null
        });
    });
    
    it('should calculate pricing correctly', () => {
        const items = [{ subtotal: 100 }];
        const address = { state: 'CA' };
        
        const pricing = orderService.calculatePricing(items, address);
        
        expect(pricing).toBeDefined();
        expect(pricing.subtotal).toBe(100);
        expect(pricing.total).toBeGreaterThan(100); // Has tax
    });
});