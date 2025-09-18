// src/config/database.js

import mongoose from 'mongoose';
import config from './index.js';

// Function to connect to MongoDB
export const connectDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(' MongoDB connected successfully');
        console.log(` Database: ${mongoose.connection.db.databaseName}`);
        
        // Set up event listeners for connection issues
        
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });
        
        // If MongoDB disconnects
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
        
        // If MongoDB reconnects
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });
        
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        console.error('Make sure MongoDB is running and connection string is correct');
        
        process.exit(1);
        
    }
};

// Function to disconnect from MongoDB (for graceful shutdown)
export const disconnectDatabase = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected gracefully');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};