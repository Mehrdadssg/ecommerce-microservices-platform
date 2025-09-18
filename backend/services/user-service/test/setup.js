// tests/setup.js

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// This runs once before all tests
export default async function globalSetup() {
    console.log('\n Setting up test environment...\n');
    
    // Create in-memory MongoDB instance
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Store URI for tests to use
    process.env.MONGO_URI_TEST = mongoUri;
    
    // Store server instance to stop later
    global.__MONGOSERVER__ = mongoServer;
    
    console.log(' Test MongoDB started\n');
}