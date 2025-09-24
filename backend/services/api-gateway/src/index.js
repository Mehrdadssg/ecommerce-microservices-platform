import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from './config.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Proxy routes to services
Object.keys(services).forEach(serviceName => {
  const service = services[serviceName];
  
  service.routes.forEach(route => {
    app.use(route, createProxyMiddleware({
      target: service.url,
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error(`Error proxying to ${serviceName}:`, err);
        res.status(503).json({
          success: false,
          message: `Service ${serviceName} unavailable`
        });
      }
    }));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` API Gateway running on port ${PORT}`);
  console.log(' Routing configuration:');
  Object.entries(services).forEach(([name, config]) => {
    console.log(`   ${name}: ${config.routes.join(', ')} → ${config.url}`);
  });
});