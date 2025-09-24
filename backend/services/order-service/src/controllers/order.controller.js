import {OrderService} from "../services/order.service";

export class OrderController {

    constructor({ orderService }) {
        this.orderService = orderService;
    }

    //  create orders
    createOrder  = async(req, res, next) => {
        try{
            const userId = req.user.id;
            const orders = await this.orderService.createOrder(req.body,userId);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order
            });

        }catch(error){
            next(error);
        }
    }

    /**
     * Get order by ID
     * GET /api/orders/:id
     */

    getOrder = async(req, res, next) => {
        try{
            const order = await this.orderService.getOrderById(req.params.id,req.user.id);

            res.status(200).json({
                success: true,
                message: 'Order fetched successfully',
                data: order
            });

        }catch(error){
            next(error);
        }
    }

     /**
     * Get user's orders
     * GET /api/orders/my-orders
     */

     getMyOrders = async (req,res,next)=> {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                status: req.query.status || null
            };
            
            const result = await this.orderService.getUserOrders(
                req.user.id,
                options
            );
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
     }

     /**
     * Cancel order
     * POST /api/orders/:id/cancel
     */

     cancelOrder = async (req, res, next) => {
        try {

             await this.orderService.cancelOrder(
                req.params.id,
                req.body.reason || 'Cancelled by user',
                req.user.id
            );

            res.json({
                success: true,
                message: 'Order cancelled successfully',
               
            });

           
        } catch (error) {
            next(error);
        }
     }

      /**
     * Update order status (admin only)
     * PATCH /api/orders/:id/status
     */

      updateOrderStatus = async (req, res, next) => {
        try {

            const order  = await this.OrderService.updateOrderStatus(
                req.params.id,
                req.body.status,
                req.body.reason || null,
                req.user.id
            );

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
          
         
        } catch (error) {
            next(error);
        }
      }

       /**
     * Get order statistics
     * GET /api/orders/stats
     */

    getOrderStats = async (req, res, next) => {
        try {
            const stats = await this.orderService.getOrderStats(req.user.id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }



}

export default OrderController;


