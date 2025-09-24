import { z } from 'zod';

// The schema should validate req.body directly
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional()
});

// For update (all fields optional)
export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional()
});

// For query parameters
export const queryProductSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional()
}).passthrough(); 
// For ID parameter
export const idParamSchema = z.string().length(24, 'Invalid MongoDB ObjectId'); 