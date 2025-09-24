import {Order} from '../models/order.model.js'
import mongoose from 'mongoose';


export class OrderRepository {
    
    async create(orderData) {
        try{

            const  order = new Order (orderData)
            // Only calculate total if items exist
        if (order.items && order.items.length > 0) {
            await order.calculateTotal();
            
        }
        return await order.save();

        }catch(error){

             if (error.code === 11000) {
                throw new Error('Order number already exists');
            }
            throw error;

        }
    }

    async findByID(id) {
        try {

            if(!mongoose.Types.ObjectId.isValid(id)){
                return null;
            }

            return await Order.findById(id).lean();
        } catch (error) {
            throw error;
        }
        
    }

    async findByOrderNumber (orderNumber){
        try{
            return await Order.findOne({orderNumber}).lean();
        }catch(error){
            throw error;
        }
    }

    async findByUserID (userId , option={}){
        
        const  {
            page = 1,
            limit = 10,
            sort = {createdAt: -1},
            status = null

        } = option;

        const query = {userId};

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

         const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query)
        ]);

        return {
            data:orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }
    return await Order.findById(id).lean();
}

    async updateStatus(orderId, newStatus , reason ,changedBy){

        const order = await Order.findById(orderId);

        if(!order){
            throw new Error('Order not found');
        }

         order.addStatusHistory(newStatus, reason, changedBy);

              // Update specific timestamps
        if (newStatus === 'delivered') {
            order.deliveredAt = new Date();
        } else if (newStatus === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelReason = reason;
        }
        
        return await order.save();

        }

        async updatePaymentStatus(orderId, newPaymentStatus,transactionId){

            const update = {
                'payment.status': newPaymentStatus,
            'payment.transactionId': transactionId
            }

            if (paymentStatus === 'completed') {
            update['payment.paidAt'] = new Date();
        }

        return await Order.findByIdAndUpdate(orderId,  { $set: update }, {new: true}).lean();
            

        }

        async findPendingOrders(olderThan) {
        const cutoffTime = new Date(Date.now() - olderThan);
        
        return await Order.find({
            status: 'pending',
            createdAt: { $lt: cutoffTime }
        }).lean();
    }


        async getOrderStatus (userId){

        }

         async getOrderStats(userId) {
        const stats = await Order.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$pricing.total' },
                    averageOrderValue: { $avg: '$pricing.total' },
                    ordersByStatus: {
                        $push: '$status'
                    }
                }
            }
        ]);
        
        return stats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0
        };
    }

    }







       

