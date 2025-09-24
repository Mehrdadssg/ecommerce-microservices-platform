import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';
import config from './config/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (config.isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export both default and named
export { app };
export default app;