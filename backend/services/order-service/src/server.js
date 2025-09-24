import mongoose from 'mongoose';
import { app } from './app.js';
import config from './config/index.js';

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    process.exit(1);
});

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(' MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Start server
async function startServer() {
    await connectDB();
    
    const server = app.listen(config.port, () => {
        console.log(` Order Service running on port ${config.port}`);
        console.log(` Environment: ${config.nodeEnv}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            mongoose.connection.close();
            process.exit(0);
        });
    });
}

startServer().catch(console.error);