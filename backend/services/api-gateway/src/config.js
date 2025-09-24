export const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    routes: ['/api/auth']
  },
  products: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000',
    routes: ['/api/products']
  }
};