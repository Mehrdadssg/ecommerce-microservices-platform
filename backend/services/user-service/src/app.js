import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import compression from 'compression';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

// Initialize Express app

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors());
if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));  
}
app.use(compression());

app.use(express.urlencoded({ extended: true }))


app.use((req, res, next) => {
    // Log every request with timestamp
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    
    // Log body for POST/PUT/PATCH (but hide password)
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) bodyCopy.password = '***hidden***';
        console.log('Request body:', bodyCopy);
    }
    
    next(); 
});


app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'user-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime() // How long service has been running
    });
});

app.use('/api/auth', authRoutes);

// 404 handler

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
        method: req.method,
        path: req.path
    });
});


app.use((err, req, res, next) => {
    // Log error for debugging
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body
    });
    
    // Don't send response if already sent
    if (res.headersSent) {
        return next(err);
    }
    
    // Determine status code
    const status = err.statusCode || err.status || 500;
    
    // Prepare error response
    const response = {
        success: false,
        message: err.message || 'Internal server error'
    };
    
    // In development, include more details
    if (config.nodeEnv === 'development') {
        response.error = err.name;
        response.stack = err.stack;
    }
    
    // Send error response
    res.status(status).json(response);
});

// Export the configured app
export default app;
