import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import path from 'path';
// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = dotenv.config({
    path: path.join(__dirname, '../../.env')
});

// Check if .env was loaded successfully
if (result.error) {
    console.error('⚠️  Could not load .env file');
    console.error('⚠️  Error:', result.error.message);
    console.error('⚠️  Make sure .env exists in:', path.join(__dirname, '../../.env'));
} else {
    console.log('✅ Environment variables loaded from .env');
}


export const config = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI || (() => {
        console.error(' MONGODB_URI is not set in .env file!');
        console.error('Please add: MONGODB_URI=your-connection-string');
        return null;
    })(),
    nodeEnv: process.env.NODE_ENV || 'development',
    dbName: process.env.DB_NAME || 'user-db',

    jwt : {
        secret: process.env.JWT_SECRET || 'default-secret-change-this',
        expire: process.env.JWT_EXPIRE || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret-change-this'

    },

    bcrypt : {
        rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
    },

    isProduction: process.env.NODE_ENV === 'production'


};

console.log('User Service Configuration Loaded:', {
    port: config.port,
    environment: config.nodeEnv,
    dbName: config.dbName,
    jwtExpiresIn: config.jwt.expiresIn,
    bcryptRounds: config.bcrypt.rounds
});

export default config;
