// src/middleware/__tests__/validation.middleware.test.js

import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../validation.middleware.js';
import { jest } from '@jest/globals';


describe('Validation Middleware', () => {
    let req, res, next;
    
    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });
    
    describe('validateBody', () => {
        const schema = z.object({
            email: z.string().email(),
            age: z.number().min(18)
        });
        
        it('should pass valid data', async () => {
            req.body = {
                email: 'test@example.com',
                age: 25
            };
            
            const middleware = validateBody(schema);
            await middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
        
        it('should reject invalid data', async () => {
            req.body = {
                email: 'not-an-email',
                age: 15
            };
            
            const middleware = validateBody(schema);
            await middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Validation failed'
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});