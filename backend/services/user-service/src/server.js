// src/server.js

import app from './app.js';
import config from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

// Function to start the server
const startServer = async () => {
    console.log('Starting User Service...');
    
    try {
       
        await connectDatabase();
        
        // Step 2: Start Express server
        const server = app.listen(config.port, () => {
            console.log('════════════════════════════════════════');
            console.log(` User Service is running!`);
            console.log(` Port: ${config.port}`);
            console.log(` Environment: ${config.nodeEnv}`);
            console.log(` Health check: http://localhost:${config.port}/health`);
            console.log('════════════════════════════════════════');
        });
        
       
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received: Starting graceful shutdown...');
            
            // Stop accepting new connections
            server.close(async () => {
                console.log('HTTP server closed');
                
                // Disconnect from database
                await disconnectDatabase();
                
                // Exit successfully
                process.exit(0);
            });
        });
        
        process.on('SIGINT', async () => {
            console.log('\nSIGINT received: Starting graceful shutdown...');
            
            server.close(async () => {
                console.log('HTTP server closed');
                await disconnectDatabase();
                process.exit(0);
            });
        });
        
        // Uncaught exceptions (programming errors)
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            // Give time to log error before exiting
            setTimeout(() => process.exit(1), 1000);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Give time to log error before exiting
            setTimeout(() => process.exit(1), 1000);
        });
        
    } catch (error) {
        console.error(' Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();