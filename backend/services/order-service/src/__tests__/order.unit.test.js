// src/__tests__/order.unit.test.js
import { jest } from '@jest/globals';
import { OrderService } from '../services/order.service.js';

describe('Order Service Unit Tests', () => {
    let orderService;
    
    beforeEach(() => {
        // Mock all dependencies
        const mockRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn()
        };
        
        orderService = new OrderService({
            orderRepository: mockRepository,
            productService: null,
            userService: null
        });
    });
    
    describe('calculatePricing', () => {
        it('should calculate pricing with valid inputs', () => {
            const items = [
                { subtotal: 100 },
                { subtotal: 50 }
            ];
            const address = { state: 'CA' };
            
            const result = orderService.calculatePricing(items, address);
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('subtotal');
            expect(result).toHaveProperty('tax');
            expect(result).toHaveProperty('shipping');
            expect(result).toHaveProperty('total');
            expect(result.subtotal).toBe(150);
        });
    });
});