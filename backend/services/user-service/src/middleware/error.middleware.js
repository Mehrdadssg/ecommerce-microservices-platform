// src/middleware/error.middleware.js

import config from '../config/index.js';

/**
 * Error Handler Middleware
 * Centralizes error handling for the application
 */

/**
 * Not Found Handler
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

/**
 * Error Handler
 */
export const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code
    let status = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    
    // Log error
    console.error('Error:', {
        status,
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    // Handle specific error types
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyValue || {})[0];
        message = `${field} already exists`;
    }
    
    // MongoDB validation error
    if (err.name === 'ValidationError') {
        status = 400;
        const errors = Object.values(err.errors).map(e => e.message);
        message = `Validation Error: ${errors.join(', ')}`;
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Invalid token';
    }
    
    if (err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Token expired';
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        status = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }
    
    // Send error response
    res.status(status).json({
        success: false,
        message,
        code: err.code || 'ERROR',
        ...(config.isDevelopment && {
            error: err.name,
            stack: err.stack,
            details: err
        })
    });
};

/**
 * Async Handler - Wraps async route handlers
 * Catches errors and passes to error handler
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default {
    notFound,
    errorHandler,
    asyncHandler
};