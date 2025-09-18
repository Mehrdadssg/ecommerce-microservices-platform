// src/middleware/validation.middleware.js

import { ZodError } from 'zod';

/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

/**
 * Validate request body
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            // Parse and validate request body
            const validated = await schema.parseAsync(req.body);
            
            // Replace request body with validated data
            // This ensures data types are correct (e.g., strings to numbers)
            req.body = validated;
            
            // Continue to next middleware
            next();
        } catch (error) {
            // Handle validation error
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: formatZodError(error)
                });
            }
            
            // Pass other errors to error handler
            next(error);
        }
    };
};

/**
 * Validate request query parameters
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            // Parse and validate query parameters
            const validated = await schema.parseAsync(req.query);
            
            // Store validated query 
            req.validatedQuery = validated;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: formatZodError(error)
                });
            }
            
            next(error);
        }
    };
};

/**
 * Validate request params (URL parameters)
 * @param {Object} schema - Zod schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            // Parse and validate URL parameters
            const validated = await schema.parseAsync(req.params);
            
            // Store validated params
            req.validatedParams = validated;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL parameters',
                    errors: formatZodError(error)
                });
            }
            
            next(error);
        }
    };
};

/**
 * Validate complete request (body, query, params)
 * @param {Object} schemas - Object with body, query, params schemas
 * @returns {Function} Express middleware
 */
export const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            // Validate each part if schema provided
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            
            if (schemas.query) {
                req.validatedQuery = await schemas.query.parseAsync(req.query);
            }
            
            if (schemas.params) {
                req.validatedParams = await schemas.params.parseAsync(req.params);
            }
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: formatZodError(error)
                });
            }
            
            next(error);
        }
    };
};

/**
 * Format Zod error for response
 * @private
 */
function formatZodError(error) {
    // Check if error has the expected structure
    if (!error.errors || !Array.isArray(error.errors)) {
        return [{
            field: 'unknown',
            message: error.message || 'Validation error',
            code: 'VALIDATION_ERROR'
        }];
    }
    
    return error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
    }));
}
/**
 * Sanitize input to prevent XSS attacks
 * @returns {Function} Express middleware
 */
export const sanitizeInput = () => {
    return (req, res, next) => {
        // Sanitize body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize query
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        next();
    };
};

/**
 * Recursively sanitize object
 * @private
 */
function sanitizeObject(obj) {
    const sanitized = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            
            if (typeof value === 'string') {
                // Remove script tags and other dangerous patterns
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
}

// Export all validators
export default {
    validateBody,
    validateQuery,
    validateParams,
    validate,
    sanitizeInput
};