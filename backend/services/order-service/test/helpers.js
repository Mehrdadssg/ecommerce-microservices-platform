import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectTestDB() {
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        
        await mongoose.connect(uri);
        console.log('Test database connected');
    } catch (error) {
        console.error('Test database connection failed:', error);
        throw error;
    }
}

export async function disconnectTestDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}

export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

export function createTestOrderData(overrides = {}) {
    return {
        userId: new mongoose.Types.ObjectId(),
        userEmail: 'test@example.com',
        items: [
            {
                productId: new mongoose.Types.ObjectId(),
                productName: 'Test Product',
                price: 99.99,
                quantity: 2,
                subtotal: 199.98
            }
        ],
        shippingAddress: {
            fullName: 'Test User',
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345'
        },
        payment: {
            method: 'credit_card',
            status: 'pending'
        },
        ...overrides
    };
}