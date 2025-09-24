import request from 'supertest';
import  app  from '../app.js';
import { generateToken } from '../../test/utils.js';
import jwt from 'jsonwebtoken';

describe('Order API Integration Tests', () => {
    let authToken;
    let orderId;
    
    
    beforeAll(async () => {
        // Generate a valid test token
        authToken = jwt.sign(
            {
                id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                role: 'customer'
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });
    
    describe('POST /api/orders', () => {
        it.skip('should create order with valid data', async () => {
            const orderData = {
                items: [
                    { productId: '507f1f77bcf86cd799439011', quantity: 2 }
                ],
                shippingAddress: {
                    fullName: 'John Doe',
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001'
                },
                paymentMethod: 'credit_card'
            };
            
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('orderNumber');
            orderId = response.body.data._id;
        });
        
        it('should reject order without authentication', async () => {
            const response = await request(app)
                .post('/api/orders')
                .send({})
                .expect(401);

                expect(response.body.success).toBe(false);
        });
        
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);
            
            expect(response.body.message).toBeDefined();
        });
    });
    
    describe('GET /api/orders/:id', () => {
        it.skip('should get order by ID', async () => {
            const response = await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data._id).toBe(orderId);
        });
        
        it.skip('should not allow accessing other user orders', async () => {
            const otherUserToken = generateToken({
                id: '507f1f77bcf86cd799439012',
                email: 'other@example.com'
            });
            
            await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(403);
        });
    });
    
    describe('POST /api/orders/:id/cancel', () => {
        it.skip('should cancel own order', async () => {
            await request(app)
                .post(`/api/orders/${orderId}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'Changed my mind' })
                .expect(200);
        });
    });
});