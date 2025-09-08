// Centralized error handling

import { ApiError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
    
    let error = {...err}
    error.message = err.message;

    // Log the error details (could be enhanced to use a logging library)
    console.error(err);

    if(err.name ==='castError'){
        const message = `Resource not found. Invalid: ${err.path}`;
        error = new ApiError(message, err, 404);
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ApiError(message, err, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
}

export const notFound = (req, res, next) => {
    const error = new ApiError(`Not Found - ${req.originalUrl}`, null, 404);
    next(error);
}