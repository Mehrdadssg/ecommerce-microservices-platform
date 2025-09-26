/**
 * Order Cleanup Job
 * 
 * This runs periodically to clean up abandoned orders,
 */

import cron from 'node-cron';
import { Order } from '../models/order.model.js';
import { eventPublisher } from '../events/rabbitmq/publisher.js';

class OrderCleanupJob {
    constructor() {
        this.isRunning = false;
    }
    
    /**
     * Start the cleanup job
     * Runs every 30 minutes
     */
    start() {
        
        
        cron.schedule('*/30 * * * *', async () => {
            await this.runCleanup();
        });
        
        console.log(' Order cleanup job scheduled (runs every 30 minutes)');
    }
    
    /**
     * Run the cleanup process
     */
    async runCleanup() {
        if (this.isRunning) {
            console.log('Cleanup already running, skipping...');
            return;
        }
        
        this.isRunning = true;
        console.log(' Starting order cleanup...');
        
        try {
            // Find abandoned orders
            const abandonedOrders = await this.findAbandonedOrders();
            console.log(`Found ${abandonedOrders.length} abandoned orders`);
            
            // Process each abandoned order
            for (const order of abandonedOrders) {
                await this.handleAbandonedOrder(order);
            }
            
            // Clean up old completed orders (archive)
            await this.archiveOldOrders();
            
            console.log('✅ Cleanup completed');
            
        } catch (error) {
            console.error('Cleanup job failed:', error);
        } finally {
            this.isRunning = false;
        }
    }
    
    /**
     * Find orders that have been pending for too long
     */
    async findAbandonedOrders() {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        return await Order.find({
            status: 'pending',
            createdAt: { $lt: thirtyMinutesAgo },
            'payment.status': { $ne: 'completed' }
        });
    }
    
    /**
     * Handle a single abandoned order
     */
    async handleAbandonedOrder(order) {
        try {
            console.log(`Processing abandoned order: ${order.orderNumber}`);
            
            // Update order status
            order.status = 'abandoned';
            order.metadata = order.metadata || {};
            order.metadata.abandonedAt = new Date();
            order.metadata.abandonedReason = 'Payment timeout';
            
            await order.save();
            
            // Emit event for other services
            await eventPublisher.publishOrderEvent('abandoned', order);
            
            // Send reminder email (if within 1 hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (order.createdAt > oneHourAgo) {
                await this.sendAbandonmentReminder(order);
            }
            
        } catch (error) {
                      console.error(`Failed to handle abandoned order ${order._id}:`, error);
        }
    }
    
    /**
     * Send reminder email for abandoned cart
     */
    async sendAbandonmentReminder(order) {
        // This would trigger an email to remind the customer
        console.log(`Sending abandonment reminder for ${order.orderNumber}`);
        // Implementation would use email service
    }
    
    /**
     * Archive orders older than 6 months
     */
    async archiveOldOrders() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const oldOrders = await Order.find({
            status: { $in: ['delivered', 'cancelled'] },
            updatedAt: { $lt: sixMonthsAgo }
        }).limit(100); // Process in batches
        
        console.log(`Archiving ${oldOrders.length} old orders`);
        
        // In production,  move these to an archive collection
        // For now, we'll just mark them as archived
        for (const order of oldOrders) {
            order.isArchived = true;
            await order.save();
        }
    }
}

export const orderCleanupJob = new OrderCleanupJob();
export default orderCleanupJob;