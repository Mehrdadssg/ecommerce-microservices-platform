// src/services/__tests__/auth.service.test.js

import { jest } from '@jest/globals';
import { AuthService } from '../auth.service.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { 
    connectTestDB, 
    disconnectTestDB, 
    clearDatabase,
    createTestUserData,
    resetUserCounter
} from '../../../test/helpers.js';

describe('AuthService', () => {
    let authService;
    let userRepository;
    
    beforeAll(async () => {
        await connectTestDB();
        userRepository = new UserRepository();
        authService = new AuthService({ userRepository });
        resetUserCounter();
    });
    
    afterAll(async () => {
        await disconnectTestDB();
    });
    
    beforeEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
      
    });
    
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = createTestUserData();
            
            const result = await authService.register(userData);
            
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('tokens');
            expect(result.user.email).toBe(userData.email.toLowerCase());
            expect(result.user.password).toBeUndefined();
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
        });
        
        it('should not register duplicate email', async () => {
            const userData = createTestUserData();
            
            // Register first user
            await authService.register(userData);
            
            // Try to register same email
            await expect(authService.register(userData))
                .rejects
                .toThrow('Registration failed');
        });
        
        it('should validate password strength', async () => {
            const userData = createTestUserData({ password: '123' });
            
            await expect(authService.register(userData))
                .rejects
                .toThrow('Password must be at least 6 characters');
        });
    });
    
    describe('login', () => {
        let testUser;
        const password = 'Test123!@#';
        
        beforeEach(async () => {
            // Create a user for login tests
            const userData = createTestUserData({ password });
            const result = await authService.register(userData);
            testUser = result.user;
        });
        
        it('should login with correct credentials', async () => {
            const result = await authService.login(testUser.email, password);
            
            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('tokens');
            expect(result.user.email).toBe(testUser.email);
            expect(result.tokens.accessToken).toBeDefined();
        });
        
        it('should not login with wrong password', async () => {
            await expect(authService.login(testUser.email, 'wrong password'))
                .rejects
                .toThrow('Invalid credentials');
        });
        
        it('should not login with non-existent email', async () => {
            await expect(authService.login('nonexistent@example.com', password))
                .rejects
                .toThrow('Invalid credentials');
        });
        
        it('should update last login time', async () => {
            await authService.login(testUser.email, password);
            
           const updatedUser = await userRepository.findById(testUser._id);
            expect(updatedUser.lastLogin).toBeDefined();
            
        });
    });
    
    describe('token generation', () => {
        it('should generate valid JWT tokens', async () => {
            const userData = createTestUserData();
            const result = await authService.register(userData);
            
            expect(result.tokens).toMatchObject({
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
                expiresIn: expect.any(Number),
                tokenType: 'Bearer'
            });
            
            // Verify token structure (3 parts separated by dots)
            expect(result.tokens.accessToken.split('.')).toHaveLength(3);
            expect(result.tokens.refreshToken.split('.')).toHaveLength(3);
        });
    });
});