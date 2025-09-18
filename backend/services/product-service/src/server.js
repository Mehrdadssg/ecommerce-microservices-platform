import app from './app.js';
import config from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';


const startServer = async () => {


    try{
        // Connect to MongoDB first
        await connectDatabase();
        // Then start the Express server
        const server = app.listen(config.port, () => {
            console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
        });
        
        // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
    }
    catch(error){   
        console.error('Failed to start server:', error);
        process.exit(1);
    }
  
    
}

startServer();