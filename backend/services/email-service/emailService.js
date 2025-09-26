/**
 * Professional Email Service
 * 
 * This handles all email communications with proper templates,
 * retry logic, and delivery tracking.
 */

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import config from '../../config/index.js';

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
        this.templates = new Map(); // Cache compiled templates
        this.retryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
    }
    
    /**
     * Create email transporter based on environment
     */
    createTransporter() {
        if (config.isProduction) {
            // Production: Use SendGrid
            return nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
        } else {
            // Development: Use Mailtrap for testing
            return nodemailer.createTransport({
                host: 'smtp.mailtrap.io',
                port: 2525,
                auth: {
                    user: process.env.MAILTRAP_USER || 'test',
                    pass: process.env.MAILTRAP_PASS || 'test'
                }
            });
        }
    }
    
    /**
     * Load and compile email template
     */
    async loadTemplate(templateName) {
        // Check cache
        if (this.templates.has(templateName)) {
            return this.templates.get(templateName);
        }
        
        // Load template file
        const templatePath = path.join(
            process.cwd(),
            'src/templates/emails',
            `${templateName}.hbs`
        );
        
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Compile with Handlebars
        const compiled = handlebars.compile(templateContent);
        
        // Cache for future use
        this.templates.set(templateName, compiled);
        
        return compiled;
    }
    
    /**
     * Send email with retry logic
     */
    async sendEmail(to, subject, template, data, options = {}) {
        let lastError;
        
        // Retry logic
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                // Load and render template
                const templateFn = await this.loadTemplate(template);
                const html = templateFn(data);
                
                // Email options
                const mailOptions = {
                    from: config.email.from || '"Your Store" <noreply@yourstore.com>',
                    to,
                    subject,
                    html,
                    text: this.htmlToText(html), // Fallback plain text
                    ...options
                };
                
                // Send email
                const info = await this.transporter.sendMail(mailOptions);
                
                console.log(`✉️ Email sent: ${info.messageId}`);
                
                // Track delivery
                await this.trackDelivery(to, subject, info.messageId);
                
                return info;
                
            } catch (error) {
                lastError = error;
                console.error(`Email attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    // Wait before retry
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        // All retries failed
        throw new Error(`Email delivery failed after ${this.retryAttempts} attempts: ${lastError.message}`);
    }
    
    /**
     * Send order confirmation
     */
    async sendOrderConfirmation(order) {
        const data = {
            customerName: order.shippingAddress.fullName,
            orderNumber: order.orderNumber,
            orderDate: new Date(order.createdAt).toLocaleDateString(),
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: this.formatCurrency(item.price),
                subtotal: this.formatCurrency(item.subtotal)
            })),
            subtotal: this.formatCurrency(order.pricing.subtotal),
            tax: this.formatCurrency(order.pricing.tax),
            shipping: this.formatCurrency(order.pricing.shipping),
            total: this.formatCurrency(order.pricing.total),
            shippingAddress: this.formatAddress(order.shippingAddress),
            estimatedDelivery: this.calculateEstimatedDelivery(order)
        };
        
        await this.sendEmail(
            order.userEmail,
            `Order Confirmation - ${order.orderNumber}`,
            'order-confirmation',
            data,
            { priority: 'high' }
        );
    }
    
    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    /**
     * Format address for display
     */
    formatAddress(address) {
        return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    }
    
    /**
     * Calculate estimated delivery date
     */
    calculateEstimatedDelivery(order) {
        const days = order.shippingMethod === 'express' ? 2 : 5;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + days);
        return deliveryDate.toLocaleDateString();
    }
    
    /**
     * Convert HTML to plain text
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }
    
    /**
     * Track email delivery
     */
    async trackDelivery(to, subject, messageId) {
        // In production, you'd save this to database
        console.log('Email delivery tracked:', {
            to,
            subject,
            messageId,
            timestamp: new Date()
        });
    }
    
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const emailService = new EmailService();
export default emailService;