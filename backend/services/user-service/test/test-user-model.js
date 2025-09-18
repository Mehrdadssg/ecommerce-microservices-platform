

import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import config from '../src/config/index.js';

async function testUserModel() {
    try{
        console.log('Connecting to MongoDB for testing...');
        if (!config.mongoUri) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }
        await mongoose.connect(config.mongoUri)
        console.log('Connected to MongoDB for testing');

         const testUser = new User({
            email: 'test22221444442@example.com',
            password: 'password123',
            name: 'Test User2'
        });
// Save (password should be hashed)
        await testUser.save();
        console.log('User saved:', testUser);

//check if password is hashed
        if(testUser.password === 'password123'){
            throw new Error('Password was not hashed!');
        }
        console.log('Password hashing verified', testUser.password);

         // Test password comparison
        const isMatch = await testUser.comparePassword('password123');
        console.log('Password matches?', isMatch);
    // Generate token
        const token = testUser.generateAuthToken();
        console.log('Generated token:', token);
        
        // Clean up
        await User.deleteOne({ email: 'test@example.com' });
        await mongoose.disconnect();


    }catch(error){
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }


}

testUserModel();
