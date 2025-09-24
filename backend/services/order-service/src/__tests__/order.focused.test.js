import { jest } from '@jest/globals';
import { OrderService } from '../services/order.service.js';

describe('Order Service Focused Tests', () => {
    let orderService;
    
    beforeEach(() => {
        const mockRepository = {
            create: jest.fn().mockResolvedValue({ 
                _id: '123', 
                orderNumber: 'ORD-123' 
            }),
            findById: jest.fn().mockResolvedValue({ 
                _id: '123',
                status: 'pending',
                items: [],
                payment: { status: 'pending' }
            }),
            updateStatus: jest.fn().mockResolvedValue(true)
        };
        
        orderService = new OrderService({
            orderRepository: mockRepository,
            productService: null,
            userService: null
        });
    });
    
    test('calculatePricing returns correct structure', () => {
        const result = orderService.calculatePricing(
            [{ subtotal: 100 }],
            { state: 'CA' }
        );
        
        expect(result).toEqual(expect.objectContaining({
            subtotal: expect.any(Number),
            tax: expect.any(Number),
            shipping: expect.any(Number),
            discount: expect.any(Number),
            total: expect.any(Number)
        }));
    });
    
    test('calculatePricing applies free shipping over $100', () => {
        const result = orderService.calculatePricing(
            [{ subtotal: 150 }],
            { state: 'CA' }
        );
        
        expect(result.shipping).toBe(0);
    });
    
    test('calculatePricing charges shipping under $100', () => {
        const result = orderService.calculatePricing(
            [{ subtotal: 50 }],
            { state: 'FL' }
        );
        
        expect(result.shipping).toBeGreaterThan(0);
    });
});