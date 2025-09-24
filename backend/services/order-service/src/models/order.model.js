import mongoose from 'mongoose';

// Order status enum - represents the order lifecycle
const ORDER_STATUS = {
    PENDING: 'pending',           // Order created but not paid
    CONFIRMED: 'confirmed',       // Payment successful
    PROCESSING: 'processing',     // Being prepared
    SHIPPED: 'shipped',          // On the way
    DELIVERED: 'delivered',      // Completed
    CANCELLED: 'cancelled',      // Cancelled by user or system
    REFUNDED: 'refunded'        // Money returned
};

// Payment status
const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Define the schema
const orderSchema = new mongoose.Schema({
    // Order identification
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // User information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        index: true
    },
    
    userEmail: {
        type: String,
        required: true
    },
    
    // Order items
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        productName: String,  // Store name at order time
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    
    // Pricing
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        shipping: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    
    // Shipping information
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: String,
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'USA'
        },
        phone: String
    },
    
    // Order status
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING,
        index: true
    },
    
    // Payment information
    payment: {
        method: {
            type: String,
            enum: ['credit_card', 'debit_card', 'paypal', 'stripe'],
            required: true
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PENDING
        },
        transactionId: String,
        paidAt: Date
    },
    
    // Status history for tracking
    statusHistory: [{
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS)
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        reason: String,
        changedBy: String  // userId or 'system'
    }],
    
    // Additional metadata
    notes: String,
    
    // Timestamps
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String
    
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });  // User's orders by date
orderSchema.index({ status: 1, createdAt: -1 });  // Orders by status
orderSchema.index({ 'payment.status': 1 });       // Payment queries

// Virtual for checking if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
    return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(this.status);
});

// Instance method: Calculate total
orderSchema.methods.calculateTotal = function() {
    const subtotal = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.08;  // 8% tax
    const shipping = subtotal > 100 ? 0 : 10;  // Free shipping over $100
    
    this.pricing = {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: shipping,
        discount: 0,
        total: Math.round((subtotal + tax + shipping) * 100) / 100
    };
    
    return this.pricing.total;
};

// Instance method: Add status history
orderSchema.methods.addStatusHistory = function(newStatus, reason, changedBy) {
    this.statusHistory.push({
        status: newStatus,
        changedAt: new Date(),
        reason: reason || '',
        changedBy: changedBy || 'system'
    });
    this.status = newStatus;
};

// Static method: Generate order number
orderSchema.statics.generateOrderNumber = function() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
};

// Middleware: Before saving
orderSchema.pre('save', function(next) {
    // Generate order number if new
    if (this.isNew && !this.orderNumber) {
        this.orderNumber = this.constructor.generateOrderNumber();
    }
    
    // Add initial status to history
    if (this.isNew) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            reason: 'Order created',
            changedBy: 'system'
        });
    }
    
    next();
});

export const Order = mongoose.model('Order', orderSchema);
export { ORDER_STATUS, PAYMENT_STATUS };
export default Order;