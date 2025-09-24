import express from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { OrderService } from '../services/order.service.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import {
    createOrderSchema,
    updateOrderStatusSchema,
    cancelOrderSchema,
    queryOrdersSchema
} from '../validations/order.validation.js';

const router = express.Router();

//Initialize  dependencies
const orderRepository = new OrderRepository();
const orderService = new OrderService({ 
    orderRepository,
    productService: null, // Would inject actual service
    userService: null     // Would inject actual service
});
const orderController = new OrderController({ orderService });

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/',
    validateBody(createOrderSchema),
    orderController.createOrder
);

router.get('/my-orders',
    validateQuery(queryOrdersSchema),
    orderController.getMyOrders
);

router.get('/stats',
    orderController.getOrderStats
);

router.get('/:id',
    orderController.getOrder
);

router.post('/:id/cancel',
    validateBody(cancelOrderSchema),
    orderController.cancelOrder
);

// Admin only routes
router.patch('/:id/status',
    authorize('admin', 'employee'),
    validateBody(updateOrderStatusSchema),
    orderController.updateOrderStatus
);

export default router;