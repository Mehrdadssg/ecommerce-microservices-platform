export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    let status = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        status = 409;
        message = 'Duplicate entry';
    }
    
    // Validation error
    if (err.name === 'ValidationError') {
        status = 400;
        const errors = Object.values(err.errors).map(e => e.message);
        message = `Validation Error: ${errors.join(', ')}`;
    }
    
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.name,
            stack: err.stack
        })
    });
};