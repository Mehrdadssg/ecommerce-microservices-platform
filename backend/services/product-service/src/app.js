import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import compression from 'compression';
import { time } from 'console';
import productRoutes from './routes/product.routes.js';

const app = express();

app.use(express.json());
app.use(helmet());

if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));  
}

app.use(compression());
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_, res) => {
    res.json({status: 'healthy',
              service: 'product-service',  
              time: new Date().toISOString()
            });
})

//API Routes
app.use('/api/products', productRoutes);



// Add 404 handler for unknown routes
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// error handling middleware  
app.use((error, req, res, next) => {
  console.error('Error handler called:', error.message);
  const status = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  // Make sure we always send JSON response
  if (!res.headersSent) {
    res.status(status).json({
      success: false,
      message,
      ...(config.nodeEnv === 'development' && { 
        stack: error.stack,
        details: error 
      })
    });
  }
});

export default app;