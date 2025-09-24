import { jest } from '@jest/globals';
import { OrderService } from '../order.service.js';
import { OrderRepository } from '../../repositories/order.repository.js';
import { Order, ORDER_STATUS } from '../../models/order.model.js';
import { connectTestDB, disconnectTestDB, clearDatabase } from '../../../test/helpers.js';

describe('OrderService', () => {
    let orderService;
    let orderRepository;
    
     beforeAll(async () => {
        await connectTestDB();
        orderRepository = new OrderRepository();
        orderService = new OrderService({ 
            orderRepository,
            productService: null,
            userService: null
        });
    });
    
    afterAll(async () => {
        await disconnectTestDB();
    });
    
    beforeEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
    });
    
    describe('createOrder', () => { // for now
        const mockOrderData = {
           items: [
                { productId: '507f1f77bcf86cd799439011', quantity: 2 }
            ],
            shippingAddress: {
                fullName: 'John Doe',
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
                phone: '555-1234'
            },
            paymentMethod: 'credit_card',
            paymentDetails: { token: 'tok_visa' }
        };
        
        it('should create order with valid data', async () => {
            // Mock the validateUser method
            orderService.validateUser = jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                isActive: true
            });
            
            // Mock validateAndEnrichItems
            orderService.validateAndEnrichItems = jest.fn().mockResolvedValue([
                {
                    productId: '507f1f77bcf86cd799439011',
                    productName: 'Product 1',
                    price: 50,
                    quantity: 2,
                    subtotal: 100
                }
            ]);
            
            // Mock other methods
            orderService.checkInventory = jest.fn().mockResolvedValue(true);
            orderService.reserveInventory = jest.fn().mockResolvedValue(true);
            orderService.processPayment = jest.fn().mockResolvedValue({
                success: true,
                transactionId: 'TXN123'
            });
            orderService.confirmOrder = jest.fn().mockResolvedValue(true);
            orderService.finalizeInventory = jest.fn().mockResolvedValue(true);
            orderService.sendOrderConfirmation = jest.fn().mockResolvedValue(true);
            
            // Mock repository create method
            orderRepository.create = jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439012',
                orderNumber: 'ORD-123456789',
                status: 'pending',
                userId: '507f1f77bcf86cd799439011',
                userEmail: 'test@example.com'
            });
            
            const order = await orderService.createOrder(
            mockOrderData,  
            '507f1f77bcf86cd799439011'  
        );
            
            expect(order).toHaveProperty('orderNumber');
            expect(order.status).toBe('pending');
        });
        
        it('should rollback on payment failure', async () => {
            // Mock all required methods for this test
            orderService.validateUser = jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                isActive: true
            });
            
            orderService.validateAndEnrichItems = jest.fn().mockResolvedValue([
                {
                    productId: '507f1f77bcf86cd799439011',
                    productName: 'Product 1',
                    price: 50,
                    quantity: 2,
                    subtotal: 100
                }
            ]);
            
            orderService.checkInventory = jest.fn().mockResolvedValue(true);
            orderService.reserveInventory = jest.fn().mockResolvedValue(true);
            orderService.releaseInventory = jest.fn().mockResolvedValue(true);
            
            // Mock repository create method
            orderRepository.create = jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439012',
                orderNumber: 'ORD-123456789',
                status: 'pending'
            });
            
            // Mock findById to return the created order for cancelOrder
            orderRepository.findById = jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439012',
                status: 'pending',
                items: []
            });
            
            // Mock updateStatus for cancelOrder
            orderRepository.updateStatus = jest.fn().mockResolvedValue(true);
            
            // Mock payment failure
            orderService.processPayment = jest.fn().mockResolvedValue({
                success: false,
                error: 'Insufficient funds'
            });
            
            await expect(
                orderService.createOrder(mockOrderData, '507f1f77bcf86cd799439011')
            ).rejects.toThrow('Payment processing failed');
        });
        
        it('should validate order items quantity', async () => {
            const invalidOrder = {
                ...mockOrderData,
                items: [{ productId: '507f1f77bcf86cd799439011', quantity: 0 }]
            };
            
            // Don't mock validateAndEnrichItems for this test - let it run naturally
            orderService.validateAndEnrichItems = OrderService.prototype.validateAndEnrichItems;
            
            await expect(
                orderService.createOrder(invalidOrder, '507f1f77bcf86cd799439011')
            ).rejects.toThrow('Invalid quantity');
        });
    });
    
     
    describe('calculatePricing', () => {
        it('should calculate correct totals', () => {
            const items = [
                { subtotal: 100 },
                { subtotal: 50 }
            ];
            const address = { state: 'CA' };
            
            const pricing = orderService.calculatePricing(items, address);
            
            expect(pricing).toBeDefined();
            expect(pricing.subtotal).toBe(150);
            expect(pricing.shipping).toBe(0); // Free over $100
        });
        
        it('should charge shipping for orders under $100', () => {
            const items = [{ subtotal: 50 }];
            const address = { state: 'FL' };
            
            const pricing = orderService.calculatePricing(items, address);
            
            expect(pricing).toBeDefined();
            expect(pricing.shipping).toBeGreaterThan(0);
        });
    });
    
    
   describe('cancelOrder', () => {
    it('should cancel pending order', async () => {
        const orderData = {
            userId: '507f1f77bcf86cd799439011',
            userEmail: 'test@example.com',
            orderNumber: `ORD-${Date.now()}`,  // Add orderNumber
            items: [{
                productId: '507f1f77bcf86cd799439011',
                productName: 'Test Product',
                price: 50,
                quantity: 1,
                subtotal: 50
            }],
            shippingAddress: {
                fullName: 'Test User',
                street: '123 Test St',
                city: 'Test City',
                state: 'CA',
                zipCode: '12345'
            },
            payment: { 
                method: 'credit_card',
                status: 'pending'
            },
            pricing: {
                subtotal: 50,
                tax: 4,
                shipping: 10,
                discount: 0,
                total: 64
            }
        };
        
        const createdOrder = await orderRepository.create(orderData);
        
        // Mock the releaseInventory method
        orderService.releaseInventory = jest.fn().mockResolvedValue(true);
        
        // Mock updateStatus if it doesn't exist
        if (!orderRepository.updateStatus) {
            orderRepository.updateStatus = jest.fn().mockResolvedValue(true);
        }
        
        const result = await orderService.cancelOrder(
            createdOrder._id,
            'Customer request',
            '507f1f77bcf86cd799439011'  // Pass the userId as cancelledBy
        );
        
        expect(result).toBe(true);
    });
});
        
        it('should not cancel delivered order', async () => {
            const orderData = {
                userId: '507f1f77bcf86cd799439011',
                userEmail: 'test@example.com',
                orderNumber: `ORD-${Date.now()}`,
                status: ORDER_STATUS.DELIVERED,
                items: [{
                    productId: '507f1f77bcf86cd799439011',
                    productName: 'Test Product',
                    price: 50,
                    quantity: 1,
                    subtotal: 50
                }],
                shippingAddress: {
                    fullName: 'Test User',
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'CA',
                    zipCode: '12345'
                },
                payment: { 
                    method: 'credit_card',
                    status: 'completed'
                },
                pricing: {
                    subtotal: 50,
                    tax: 4,
                    shipping: 10,
                    discount: 0,
                    total: 64
                }
            };
            
            const order = await orderRepository.create(orderData);
            
            // Mock findById to return the delivered order
            orderRepository.findById = jest.fn().mockResolvedValue({
                _id: order._id,
                status: ORDER_STATUS.DELIVERED,
                userId: '507f1f77bcf86cd799439011',
                items: []
            });
            
            await expect(
                orderService.cancelOrder(order._id, 'Too late')
            ).rejects.toThrow('Cancellation not allowed for DELIVERED orders');
        });
    });
    
   describe('order status transitions', () => {
    let orderRepository; 
    let orderService;

     beforeAll(async () => {
        await connectTestDB();  
    });
    
    beforeEach(() => {
        orderRepository = new OrderRepository();
        orderService = new OrderService({
            orderRepository,
            productService: null,
            userService: null
        });

    });
    it('should follow valid status transitions', async () => {
        const transitions = [
            { from: ORDER_STATUS.CONFIRMED, to: ORDER_STATUS.PROCESSING },
            { from: ORDER_STATUS.PROCESSING, to: ORDER_STATUS.SHIPPED },
            { from: ORDER_STATUS.SHIPPED, to: ORDER_STATUS.DELIVERED }
        ];
        
        for (const { from, to } of transitions) {
            const completeOrderData = {
                userId: '507f1f77bcf86cd799439011',
                userEmail: 'test@example.com',
                orderNumber: `ORD-${Date.now()}`,
                status: from,
                items: [{
                    productId: '507f1f77bcf86cd799439011',
                    productName: 'Test',
                    price: 50,
                    quantity: 1,
                    subtotal: 50
                }],
                shippingAddress: {
                    fullName: 'Test User',
                    street: '123 Test St',
                    city: 'Test City',
                    zipCode: '12345'
                },
                payment: {
                    method: 'credit_card'
                },
                pricing: {
                    subtotal: 50,
                    tax: 4,
                    shipping: 10,
                    total: 64
                }
            };
            
            const order = await orderRepository.create(completeOrderData);
            
            const updated = await orderService.updateOrderStatus(
                order._id, to, 'Test', 'system'
            );
            
            expect(updated.status).toBe(to);
        }
    });

        
       it('should reject invalid status transitions', async () => {
    const completeOrderData = {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'test@example.com',
        orderNumber: `ORD-${Date.now()}`,
        status: ORDER_STATUS.PENDING,
        items: [{
            productId: '507f1f77bcf86cd799439011',
            productName: 'Test',
            price: 50,
            quantity: 1,
            subtotal: 50
        }],
        shippingAddress: {
            fullName: 'Test User',
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345'
        },
        payment: {
            method: 'credit_card',
            status: 'pending'
        },
        pricing: {
            subtotal: 50,
            tax: 4,
            shipping: 10,
            discount: 0,
            total: 64
        }
    };
    
    const order = await orderRepository.create(completeOrderData);
    
    await expect(
        orderService.updateOrderStatus(
            order._id,
            ORDER_STATUS.DELIVERED,
            'Invalid',
            'system'
        )
    ).rejects.toThrow('Cannot transition');
});
        });



