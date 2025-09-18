// tests/helpers.js

import { timeStamp } from 'console';
import mongoose from 'mongoose';

// Connect to test database
export async function connectTestDB() {
    const uri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test';
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
    });
}


// Disconnect from test database
export async function disconnectTestDB() {
    await mongoose.disconnect();
}

// Clear all collections
export async function clearDatabase() {
    const collections = mongoose.connection.collections;
    
    // Use Promise.all to clear all collections in parallel
    await Promise.all(
        Object.keys(collections).map(async (key) => {
            await collections[key].deleteMany({});
            // Also drop indexes to reset unique constraints
            try {
                await collections[key].dropIndexes();
            } catch (error) {
                // Ignore error if no indexes exist
            }
        })
    );
}

let userCounter = 0;
// Create test user data
export function createTestUserData(overrides = {}) {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return {
        email: overrides.email || `test.${timestamp}.${random}@example.com`,
        password: overrides.password || 'SecurePass123!',
        name: overrides.name || 'Test User',
        role: overrides.role || 'customer',
        ...overrides,
        
    };
     
}

// Reset counter between test suites
export function resetUserCounter() {
    userCounter = 0;
}

// Create multiple test users with guaranteed unique emails
export function createMultipleTestUsers(count = 5) {
    return Array.from({ length: count }, (_, i) => {
        userCounter++;
        return {
            email: `test${userCounter}@example.com`,
            password: 'Test123!@#',
            name: `Test User ${userCounter}`,
            role: i === 0 ? 'admin' : 'customer'
        };
    });
}