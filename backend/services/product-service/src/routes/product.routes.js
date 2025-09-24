import express from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { ProductService } from '../services/product.service.js';
import { ProductRepositoryMongo } from '../repositories/product.repository.mongo.js';
import {  validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { createProductSchema, queryProductSchema,updateProductSchema,idParamSchema } from '../validations/product.validation.js';
import { authenticate, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initialize dependencies
const repository = new ProductRepositoryMongo();
const service = new ProductService({ repository });
const controller = new ProductController({ productService: service });

// Routes with proper validation
// router.get('/', validateQuery(queryProductSchema), controller.getAllProducts);
// router.get('/:id', controller.getProductById);  // We'll validate ID inside controller for now
// router.post('/', validateBody(createProductSchema), controller.createProduct);
// router.patch('/:id', validateBody(updateProductSchema), controller.updateProduct);
// router.delete('/:id', controller.deleteProduct);
router.get('/', controller.getAllProducts);  // Remove validateQuery for now
router.get('/:id', controller.getProductById);
router.post('/', adminOnly, validateBody(createProductSchema), controller.createProduct);
router.patch('/:id',adminOnly, validateBody(updateProductSchema), controller.updateProduct);
router.delete('/:id', adminOnly ,controller.deleteProduct);

export default router;