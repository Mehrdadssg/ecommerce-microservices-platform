

import amqp from 'amqplib';
import config from '../../config/index.js';

class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        
        // Exchange names (like different departments in our post office)
        this.exchanges = {
            ORDERS: 'orders.topic',      // For order-related events
            INVENTORY: 'inventory.topic', // For inventory events
            NOTIFICATIONS: 'notifications.topic' // For notifications
        };
    }
    
    /**
     * Connect to RabbitMQ
     * This establishes connection and creates our messaging infrastructure
     */
    async connect() {
        try {
            // 1. Connect to RabbitMQ server
            console.log('🔌 Connecting to RabbitMQ...');
            this.connection = await amqp.connect(
                config.rabbitmq.url || 'amqp://localhost'
            );
            
            // 2. Create a channel (like opening a communication line)
            this.channel = await this.connection.createChannel();
            
            // 3. Set up error handlers
            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                this.isConnected = false;
            });
            
            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.isConnected = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connect(), 5000);
            });
            
            // 4. Create exchanges (routing centers for messages)
            await this.setupExchanges();
            
            // 5. Create queues (mailboxes for specific types of messages)
            await this.setupQueues();
            
            this.isConnected = true;
            console.log(' Connected to RabbitMQ');
            
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.connect(), 5000);
        }
    }
    
    /**
     * Set up exchanges
     */
    async setupExchanges() {
        // Topic exchange allows routing based on patterns
        // e.g., "orders.created.premium" goes to premium order handlers
        for (const exchange of Object.values(this.exchanges)) {
            await this.channel.assertExchange(exchange, 'topic', {
                durable: true  // Survives server restart
            });
        }
    }
    
    /**
     * Set up queues
     */
    async setupQueues() {
        // Email notification queue
        await this.channel.assertQueue('email.notifications', {
            durable: true,
            arguments: {
                'x-max-priority': 10,  // Support priority messages
                'x-message-ttl': 86400000  // Messages expire after 24 hours
            }
        });
        
        // Inventory update queue
        await this.channel.assertQueue('inventory.updates', {
            durable: true,
            arguments: {
                'x-max-length': 10000  // Maximum 10,000 messages
            }
        });
        
        // Webhook delivery queue
        await this.channel.assertQueue('webhook.delivery', {
            durable: true,
            arguments: {
                'x-max-retries': 3  // Custom retry limit
            }
        });
        
        // Bind queues to exchanges with routing patterns
        // This tells RabbitMQ which messages go to which queues
        
        // Email queue listens for all order events
        await this.channel.bindQueue(
            'email.notifications',
            this.exchanges.ORDERS,
            'orders.*'  // Matches orders.created, orders.shipped, etc.
        );
        
        // Inventory queue listens for specific events
        await this.channel.bindQueue(
            'inventory.updates',
            this.exchanges.ORDERS,
            'orders.created'
        );
        
        await this.channel.bindQueue(
            'inventory.updates',
            this.exchanges.ORDERS,
            'orders.cancelled'
        );
    }
    
    /**
     * Publish an event
     * @param {string} exchange - Which exchange to use
     * @param {string} routingKey - Routing pattern (e.g., 'orders.created')
     * @param {object} message - The event data
     * @param {object} options - Additional options like priority
     */
    async publish(exchange, routingKey, message, options = {}) {
        if (!this.isConnected) {
            console.error('Not connected to RabbitMQ');
            // Store message for retry or handle appropriately
            return false;
        }
        
        try {
            // Convert message to Buffer (RabbitMQ requirement)
            const messageBuffer = Buffer.from(JSON.stringify({
                ...message,
                timestamp: new Date().toISOString(),
                messageId: this.generateMessageId()
            }));
            
            // Publish with options
            const published = this.channel.publish(
                exchange,
                routingKey,
                messageBuffer,
                {
                    persistent: true,  // Survive server restart
                    contentType: 'application/json',
                    ...options
                }
            );
            
            if (published) {
                console.log(` Published event: ${routingKey}`);
            } else {
                console.error(`Failed to publish event: ${routingKey}`);
            }
            
            return published;
            
        } catch (error) {
            console.error('Error publishing message:', error);
            return false;
        }
    }
    
    /**
     * Subscribe to a queue
     * @param {string} queue - Queue name
     * @param {function} handler - Function to process messages
     */
    async subscribe(queue, handler) {
        if (!this.isConnected) {
            console.error('Not connected to RabbitMQ');
            return;
        }
        
        try {
            // Set prefetch to 1 (process one message at a time)
            await this.channel.prefetch(1);
            
            // Start consuming messages
            await this.channel.consume(queue, async (msg) => {
                if (!msg) return;
                
                try {
                    // Parse message
                    const content = JSON.parse(msg.content.toString());
                    
                    console.log(`Processing message from ${queue}:`, 
                        content.messageId);
                    
                    // Call handler
                    await handler(content);
                    
                    // Acknowledge message (remove from queue)
                    this.channel.ack(msg);
                    
                } catch (error) {
                    console.error(`Error processing message:`, error);
                    
                    // Reject and requeue (will retry)
                    // false = don't requeue if it's been retried too many times
                    this.channel.nack(msg, false, msg.fields.redelivered ? false : true);
                }
            });
            
            console.log(` Listening to queue: ${queue}`);
            
        } catch (error) {
            console.error(`Error subscribing to ${queue}:`, error);
        }
    }
    
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Graceful shutdown
     */
    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
        this.isConnected = false;
    }
}

// Create singleton instance
export const rabbitmq = new RabbitMQConnection();
export default rabbitmq;