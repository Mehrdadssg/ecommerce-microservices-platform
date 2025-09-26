import { rabbitmq } from '../rabbitmq/connection.js';
import { emailService } from '../../services/email.service.js';


class  EmailConsumer {

    async start(){

        await rabbitmq.subscribe("email.notifications",this.handleEmailEvent.bind())

    }


    //Process email event

    async handleEmailEvent(message){
        const {eventType,data} = message

        console.log(`Processing email for event: ${eventType}`);

        switch (eventType) {
            case 'orders.created':
                await this.sendOrderConfirmation(data);
                break;
                
            case 'orders.shipped':
                await this.sendShippingNotification(data);
                break;
                
            case 'orders.delivered':
                await this.sendDeliveryConfirmation(data);
                break;
                
            case 'orders.cancelled':
                await this.sendCancellationNotification(data);
                break;
                
            case 'orders.refunded':
                await this.sendRefundNotification(data);
                break;
                
            default:
                console.log(`No email handler for ${eventType}`);
        }
    }

    async sendOrderConfirmation(order) {
        const trackingNumber = order.metadata?.trackingNumber || 'N/A';
        await emailService.sendShippingNotification(order, trackingNumber);
        await emailService.sendOrderConfirmation(userEmail, orderId);
    }

       async sendDeliveryConfirmation(order) {
        await emailService.sendDeliveryConfirmation(order);
    }
    
    async sendCancellationNotification(order) {
        const reason = order.metadata?.reason || 'Order cancelled';
        await emailService.sendCancellationNotification(order, reason);
    }
    
    async sendRefundNotification(order) {
        await emailService.sendRefundNotification(order);
    }
}

export const emailConsumer = new EmailConsumer();
export default emailConsumer;