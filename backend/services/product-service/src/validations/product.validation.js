import {z} from 'zod';

//schema for creating a product
export const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be a positive number').positive(),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    category: z.string().min(1),
    tags: z.array(z.string()).optional()
});

//schema for updating a product
export const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().min(1).optional(),
    tags: z.array(z.string()).optional()

})


//schema for query parameters (pagination)
export const queryProductSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    category: z.string().optional(),
    minPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional()
});

//schema for ID parameter
export const idParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid ID format')
    })
});