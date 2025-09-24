import { OrderRepository } from '../repositories/order.repository.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../models/order.model.js';
import axios from 'axios';
import config from '../config/index.js';


export class OrderService {
    constructor({ orderRepository, productService, userService }) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.userService = userService;
        
        // Bind methods
        this.createOrder = this.createOrder.bind(this);
        this.validateOrder = this.validateOrder.bind(this);
    }

    async createOrder (orderData, userId) {

        // Step 1 : Validate user
       const user = await this.validateUser(userId);

        // Step 2: Validate and enrich items with product data
        const enrichedItems = await this.validateAndEnrichItems(orderData.items);
        
        // Step 3: Check inventory availability
        await this.checkInventory(enrichedItems);
        
        // Step 4: Calculate pricing
        const pricing = this.calculatePricing(enrichedItems, orderData.shippingAddress);

        // Step 5 : Create order
        const order = {

            userId:userId,
            userEmail: user.email,
            items: enrichedItems,
            pricing,
            shippingAddress: orderData.shippingAddress,
            payment: {
                method: orderData.paymentMethod,
                status: PAYMENT_STATUS.PENDING
            },
            status: ORDER_STATUS.PENDING,
            notes: orderData.notes || ''
        }

        
       let createdOrder = null;
       
       try{
        await this.reserveInventory(enrichedItems);

        //Create order
        createdOrder = await this.orderRepository.create(order);

        //Payment process
        const paymentResult = await this.processPayment(createdOrder, orderData.paymentDetails);
         
      if (paymentResult.success) {
                // Step 9: Confirm order and finalize inventory
                await this.confirmOrder(createdOrder._id, paymentResult.transactionId);
                await this.finalizeInventory(enrichedItems);
                
                // Step 10: Send notifications (async)
                this.sendOrderConfirmation(createdOrder).catch(console.error);
                
                return createdOrder;
            } else {
                // Payment failed - release inventory and cancel order
                await this.releaseInventory(enrichedItems);
                if (createdOrder) {
                    await this.cancelOrder(createdOrder._id, 'Payment failed');
                }
                
                throw new Error('Payment processing failed');
            }
            
       }catch (error) {
            // Rollback on any error
            await this.releaseInventory(enrichedItems);
            
            // Only try to cancel if order was actually created
            if (createdOrder) {
                try {
                    await this.cancelOrder(createdOrder._id, 'Order creation failed');
                } catch (cancelError) {
                    console.error('Failed to cancel order during rollback:', cancelError);
                }
            }
            
            throw error;
        }


    }

    // Validate User
    async validateUser(userId) {
         try {
            // In production, this would use internal service communication
            // For now, we'll simulate it
            const user = {
                _id: userId,
                email: 'user@example.com',
                isActive: true
            };
            
            if (!user.isActive) {
                throw new Error('User account is not active');
            }
            
            return user;
        } catch (error) {
            throw new Error(`User validation failed: ${error.message}`);
        }

    }

    /**
 * Validate order data before creation
 */
async validateOrder(orderData) {
    // Validate items exist
    if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
    }
    
    // Validate shipping address
    if (!orderData.shippingAddress) {
        throw new Error('Shipping address is required');
    }
    
    // Validate payment method
    if (!orderData.paymentMethod) {
        throw new Error('Payment method is required');
    }
    
    return true;
}


 /**
     * Validate items and enrich with current product data
     */
    async validateAndEnrichItems(items) {
        const enrichedItems = [];
        
        for (const item of items) {
            // Validate quantity
            if (item.quantity < 1) {
                throw new Error(`Invalid quantity for item ${item.productId}`);
            }
            
            if (item.quantity > config.order.maxItemsPerOrder) {
                throw new Error(`Quantity exceeds maximum of ${config.order.maxItemsPerOrder}`);
            }
            
            // Get current product data (price might have changed)
            try {
                // In production, this would call product service
                //const product = await this.productService.getProductById(item.productId);
                // Simulating product data
                const product = {
                    _id: item.productId,
                    name: `Product ${item.productId}`,
                    price: 99.99,
                    stock: 100,
                    isActive: true
                };
                
                if (!product.isActive) {
                    throw new Error(`Product ${product.name} is no longer available`);
                }
                
                enrichedItems.push({
                    productId: product._id,
                    productName: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity
                });
            } catch (error) {
                throw new Error(`Product validation failed: ${error.message}`);
            }
        }
        
        return enrichedItems;
    }

    async checkInventory(items){
        for (const item of items) {
            //in production we user product service to check stock
            //const availableStock = await this.productService.checkProductStock(item.productId, item.quantity);
            const availableStock = 100;

            if(availableStock < items.quantity){
                throw new Error(`Insufficient stock for product ${item.productId}`);
            }
        }
          return true;

    }

    /**
     * Calculate order pricing including tax and shipping
     */
    calculatePricing(items, shippingAddress) {
    console.log('calculatePricing called with:', { items, shippingAddress });
    
    if (!items || items.length === 0) {
        return {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0
        };
    }
    
    // Ensure shippingAddress exists
    if (!shippingAddress) {
        shippingAddress = { state: 'DEFAULT' };
    }
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    // Calculate tax based on state
    const taxRate = this.getTaxRate(shippingAddress.state || 'DEFAULT');
    const tax = subtotal * taxRate;
    
    // Calculate shipping
    const shipping = this.calculateShipping(subtotal, shippingAddress);
    
    // Apply any discounts
    const discount = 0;
    
    // Calculate total
    const total = subtotal + tax + shipping - discount;
    
    // THIS RETURN STATEMENT IS CRITICAL - MAKE SURE IT EXISTS!
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100
    };
}
    /**
     * Get tax rate based on state
     */
    getTaxRate(state) {
        // Simplified - in reality would use tax service
        const taxRates = {
            'CA': 0.0875,
            'NY': 0.08,
            'TX': 0.0625,
            'FL': 0.06,
            // ... other states
        };
        
        return taxRates[state] || 0.08;
    }


    //Calculate Shipping Cost

  calculateShipping(subtotal, shippingAddress = {}) {
    // Free shipping over $100
    if (subtotal >= 100) {
        return 0;
    }
    
    // Express shipping zones (simplified)
    const expressZones = ['CA', 'NY', 'TX'];
    if (shippingAddress.state && expressZones.includes(shippingAddress.state)) {
        return 5.99;
    }
    
    return  10.00;
}


    // Reserver Inventory
    async reserveInventory(items) {
        for (const item of items) {
            // In production, this would call product service
            //await this.productService.reserveProductStock(item.productId, item.quantity);

        console.log('Reserving inventory for items:', items.map(i => i.productId));
        return true;
        }
    }

    //release Inventory
    async releaseInventory(items) {
        for (const item of items) {
            // In production, this would call product service
            //await this.productService.releaseProductStock(item.productId, item.quantity);

        console.log('Releasing inventory for items:', items.map(i => i.productId));
        return true;
        }
    }

    // finalize inventory deduction

    async finalizeInventory(items) {
        for (const item of items) {
            // In production, this would call product service
            //await this.productService.deductProductStock(item.productId, item.quantity);
        console.log('Finalizing inventory for items:', items.map(i => i.productId));
        return true;
        }
    }

    // processing the payment
    async processPayment(order, paymentDetails) {
        // In production, this would call using paypal
        // For now, we'll simulate it
        console.log('Processing payment for order:', order.orderNumber);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const success = Math.random() > 0.1; // 90% success rate
        
        return {
            success,
            transactionId: success ? `TXN-${Date.now()}` : null,
            error: success ? null : 'Insufficient funds'
        };
    }


     /**
     * Confirm order after successful payment
     */

     async confirmOrder(orderId,transactionId){

        return await  this.orderRepository.updatePaymentStatus(
            orderId,
            PAYMENT_STATUS.COMPLETED,
            transactionId
        );

        await this.orderRepository.updateStatus(
            orderId,
            ORDER_STATUS.CONFIRMED,
            'Payment successful',
            'system'
        );

     }

     //Cancel order
     async cancelOrder(orderId, reason, cancelledBy = 'system') {

      

        const order = await this.orderRepository.findById(orderId);

        console.log('Cancelling order:', orderId, 'Reason:', reason, 'Cancelled by:', cancelledBy , 'order Status', order.status);

        

        if(!order){
            throw new Error('Order not found');
        }

         // 2. Security check: ensure user owns this order
        // if (cancelledBy !== 'system' && order.userId && order.userId.toString() !== cancelledBy) {
        //     throw new Error('Unauthorized: Cannot cancel this order');
        // }

          //Check if order can be cancelled
        if ([ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(order.status)) {
            throw new Error(`Cancellation not allowed for ${order.status.toUpperCase()} orders`);
        }

 

        await this.orderRepository.updateStatus(
            orderId,
            ORDER_STATUS.CANCELLED,
            reason,
            cancelledBy
        );

        // Release inventory
        await this.releaseInventory(order.items);
        
        // Process refund if payment was completed
       if (order.payment && order.payment.status === PAYMENT_STATUS.COMPLETED) {
        await this.processRefund(order);
    }
        
        return true;
    }


    //process refund

    async processRefund(order) {
        // In production, this would call payment service
        // For now, we'll simulate it
        console.log('Processing refund for order:', order.orderNumber);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In production, would call payment gateway
        await this.orderRepository.updatePaymentStatus(
            order._id,
            PAYMENT_STATUS.REFUNDED,
            `REFUND-${Date.now()}`
        );   
     }

      /**
     * Send order confirmation email
     */
    async sendOrderConfirmation(order) {
        console.log(`Sending order confirmation email for ${order.orderNumber}`);
        // In production, would use email service like SendGrid
    }

    // Get Order by id
   async getOrderById(orderId,userId){
        const order = await this.orderRepository.findByID(orderId);
        
        if(!order){
            throw new Error('Order not found');
        }
        

        // Verify user owns this order (unless admin)
        if (order.userId.toString() !== userId) {
            throw new Error('Unauthorized access to order');
        }

        return order;

    }

    //get user order

    async  getUserOrders(userId, options) {
        return await this.orderRepository.findByUserId(userId, options);       
    }

    // Update order Status 

    async updateOrderStatus(orderId, newStatus, reason, updatedBy) {
        const validTransitions = {
            [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
            [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
            [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
        };
        
        const order = await this.orderRepository.findById(orderId);
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Check if transition is valid
        const allowedStatuses = validTransitions[order.status] || [];
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(
                `Cannot transition from ${order.status} to ${newStatus}`
            );
        }
        
        return await this.orderRepository.updateStatus(
            orderId,
            newStatus,
            reason,
            updatedBy
        );
    }

     /**
     * Get order statistics
     */
    async getOrderStats(userId) {
        return await this.orderRepository.getOrderStats(userId);
    }

    /**
     * Handle abandoned orders (cron job)
     */

    async handleAbandonedOrders() {
        const pendingOrders = await this.orderRepository.findPendingOrders( config.order.orderTimeout);

        for (const order of pendingOrders) {
           try{
            await this.cancelOrder(order._id, 'Order abandoned' , 'system');
           }catch(error){
            console.error(`Error canceling order ${order._id}:`, error.message);
           }
        }

        return pendingOrders.length;
    }

}

export default OrderService;