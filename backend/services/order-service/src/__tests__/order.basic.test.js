import { Order } from '../models/order.model.js';
import mongoose from 'mongoose';

describe('Order Model Basic Tests', () => {
    it('should create an order with valid data', () => {
        const orderData = {
            userId: new mongoose.Types.ObjectId(),
            userEmail: 'test@example.com',
            orderNumber: 'ORD-123',
            items: [{
                productId: new mongoose.Types.ObjectId(),
                productName: 'Test',
                price: 50,
                quantity: 1,
                subtotal: 50
            }],
            pricing: {
                subtotal: 50,
                tax: 4,
                shipping: 10,
                total: 64
            },
            shippingAddress: {
                fullName: 'Test User',
                street: '123 Test St',
                city: 'Test City',
                zipCode: '12345'
            },
            payment: {
                method: 'credit_card'
            }
        };
        
        const order = new Order(orderData);
        expect(order.orderNumber).toBe('ORD-123');
        expect(order.status).toBe('pending');
    });
});