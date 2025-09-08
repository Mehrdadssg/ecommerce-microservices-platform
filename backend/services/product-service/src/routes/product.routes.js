import express from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { ProductService } from '../services/product.service.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { validate } from '../middleware/validation.middleware.js';
import { createProductSchema, queryProductSchema,updateProductSchema,idParamSchema } from '../validations/product.validation.js';

const router = express.Router();

const database = {products:[]}

const productRepository = new ProductRepository({ database });
const productService = new ProductService({ repository: productRepository });
const productController = new ProductController({ productService });

router.get('/products', validate(queryProductSchema),productController.getAllProducts);
router.get('/products/:id', validate(idParamSchema),productController.getProductById);
router.post('/products',validate(createProductSchema) ,productController.createProduct);
router.patch('/:id', validate(idParamSchema), validate(updateProductSchema), productController.updateProduct);
export default router;