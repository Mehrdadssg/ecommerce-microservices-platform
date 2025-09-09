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
app.use(morgan(config.logLevel));
app.use(compression());
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_, res) => {
    res.json({status: 'healthy',
              service: 'product-service',  
              time: new Date().toISOString()
            });
})

//API Routes
app.use('/api', productRoutes);



// Add 404 handler for unknown routes
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Not Found' });
// });



// error handling middleware  
app.use((error, req, res, next) => {
  console.error('Error handler called:', error.message);
  
  // Don't print "debug" - send proper error response
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