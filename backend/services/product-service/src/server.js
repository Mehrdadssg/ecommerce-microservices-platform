import app from './app.js';
import config from './config/index.js';

const startServer = async () => {

    try{
        app.listen(config.port, () => {
            console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
        });
    }
    catch(error){   
        console.error('Failed to start server:', error);
        process.exit(1);
    }
  
    
}

startServer();