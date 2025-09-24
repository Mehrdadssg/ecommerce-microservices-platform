import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
    port: process.env.PORT || 3003,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database config
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/order-db',
    dbName: process.env.DB_NAME || 'order-db',

    //jwt token
    jwt: {
        secret: process.env.JWT_SECRET || 'shared-secret-between-services'
    },

    // Other services URLs
    services: {
        userService: process.env.USER_SERVICE_URL || 'http://localhost:3002',
        productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000'
    },

    //order config

    order: {
        maxItemsPerOrder: parseInt(process.env.MAX_ITEMS_PER_ORDER) || 50,
        orderTimeout: parseInt(process.env.ORDER_TIMEOUT) || 3600000, // 1 hour in ms
        taxRate: parseFloat(process.env.TAX_RATE) || 0.08, // 8% default tax
        shippingRate: parseFloat(process.env.SHIPPING_RATE) || 10.00
    },
    
     // Features
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
}


// Validate configuration
if (!config.mongoUri) {
    console.error('MongoDB URI not configured');
}

if (!config.jwt.secret || config.jwt.secret === 'shared-secret-between-services') {
    console.warn('Using default JWT secret - change in production!');
}

console.log('Order Service Configuration Loaded:', {
    port: config.port,
    environment: config.nodeEnv,
    servicesConfigured: Object.keys(config.services)
});

export default config;