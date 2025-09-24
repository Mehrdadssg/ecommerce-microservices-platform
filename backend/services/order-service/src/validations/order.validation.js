//order Validation

import {z} from 'zod';

const orderItemSchema = z.object({
    productId : z.string().min(1 ,'Product ID is required'),
    quantity: z.number().positive().int().min(1, 'Quantity must be at least 1').max(50),
    price: z.number().min(0, 'Price must be non-negative')
})

/**
 * Shipping address schema
 */
const shippingAddressSchema = z.object({
    fullName: z.string().min(2).max(100),
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    state: z.string().length(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().default('USA'),
    phone: z.string().regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number').optional()
});

/**
 * Create order schema
 */
export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item required'),
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe']),
    paymentDetails: z.object({
        // In production, would have encrypted card details or token
        token: z.string().optional()
    }).optional(),
    notes: z.string().max(500).optional()
});

/**
 * Update order status schema (admin)
 */
export const updateOrderStatusSchema = z.object({
    status: z.enum([
        'pending', 'confirmed', 'processing', 
        'shipped', 'delivered', 'cancelled', 'refunded'
    ]),
    reason: z.string().max(500).optional()
});

/**
 * Cancel order schema
 */
export const cancelOrderSchema = z.object({
    reason: z.string().min(5).max(500)
});

/**
 * Query orders schema
 */
export const queryOrdersSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum([
        'pending', 'confirmed', 'processing', 
        'shipped', 'delivered', 'cancelled', 'refunded'
    ]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});