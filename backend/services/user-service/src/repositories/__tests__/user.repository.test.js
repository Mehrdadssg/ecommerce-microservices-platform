// src/repositories/__tests__/user.repository.test.js

import { jest } from '@jest/globals';
import { User } from '../../models/user.model.js';
import { UserRepository } from '../user.repository.js';
import { 
    connectTestDB, 
    disconnectTestDB, 
    clearDatabase,
    createTestUserData,
    createMultipleTestUsers 
} from '../../../test/helpers.js';

// Describe what we're testing
describe('UserRepository', () => {
    let userRepository;
    
    // Run before all tests in this file
    beforeAll(async () => {
        await connectTestDB();
        userRepository = new UserRepository();
    });
    
    // Run after all tests in this file
    afterAll(async () => {
        await disconnectTestDB();
    });
    
    // Run before each test
    beforeEach(async () => {
        await clearDatabase();
        jest.clearAllMocks();
    });

    afterEach(async () => {
    await clearDatabase();
    });
    
    // Group related tests
    describe('create', () => {
        it('should create a new user', async () => {
            // Arrange - prepare test data
            const userData = createTestUserData();
            
            // Act - perform the action
            const user = await userRepository.create(userData);
            
            // Assert - check the result
            expect(user).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            expect(user.password).not.toBe(userData.password); // Should be hashed
            expect(user._id).toBeDefined();
        });
        
        it('should not return password by default', async () => {
            const userData = createTestUserData();
            const user = await userRepository.create(userData);
            
            // Password should not be in returned object
            const foundUser = await userRepository.findById(user._id);
            expect(foundUser.password).toBeUndefined();
        });
        
        it.skip('should throw error for duplicate email', async () => {

            const userData = createTestUserData({ 
                    email: 'duplicate@test.com' 
                });            
            // Create first user
            await userRepository.create(userData);
            await User.syncIndexes()
            
            // Try to create second user with same email
             await expect(userRepository.create({
                ...userData,
                email: 'duplicate@test.com'  // Exact same email
            })).rejects.toThrow();

    });
    
    describe('findByEmail', () => {
        it('should find user by email', async () => {
            // Create a user first
            const userData = createTestUserData();
            const createdUser = await userRepository.create(userData);
            
            // Find by email
            const foundUser = await userRepository.findByEmail(userData.email);
            
            expect(foundUser).toBeDefined();
            expect(foundUser._id.toString()).toBe(createdUser._id.toString());
            expect(foundUser.email).toBe(userData.email);
        });
        
        it('should return null for non-existent email', async () => {
            const user = await userRepository.findByEmail('nonexistent@example.com');
            expect(user).toBeNull();
        });
        
        it('should be case-insensitive', async () => {
            const userData = createTestUserData({ 
                email: 'Test@Example.com' 
            });
            await userRepository.create(userData);
            
            // Search with different case
            const foundUser = await userRepository.findByEmail('test@example.com');
            expect(foundUser).toBeDefined();
        });
    });
    
    describe('findByEmailWithPassword', () => {
        it('should include password field', async () => {
            const userData = createTestUserData();
            await userRepository.create(userData);
            
            const user = await userRepository.findByEmailWithPassword(userData.email);
            
            expect(user.password).toBeDefined();
            expect(user.password).toMatch(/^\$2[aby]\$/); // Bcrypt hash pattern
        });
    });
    
    describe('findById', () => {
        it('should find user by ID', async () => {
            const userData = createTestUserData();
            const createdUser = await userRepository.create(userData);
            
            const foundUser = await userRepository.findById(createdUser._id);
            
            expect(foundUser).toBeDefined();
            expect(foundUser.email).toBe(userData.email);
        });
        
        it('should return null for invalid ID', async () => {
            const user = await userRepository.findById('507f1f77bcf86cd799439011');
            expect(user).toBeNull();
        });
    });
    
    describe('update', () => {
        it('should update user fields', async () => {
            const userData = createTestUserData();
            const user = await userRepository.create(userData);
            
            const updated = await userRepository.update(user._id, {
                name: 'Updated Name',
                phone: '+1234567890'
            });
            
            expect(updated.name).toBe('Updated Name');
            expect(updated.phone).toBe('+1234567890');
            expect(updated.email).toBe(userData.email); // Unchanged
        });
        
        it.skip('should not update email to duplicate', async () => {
            // Create two users
            const user1 = await userRepository.create(
                createTestUserData({ email: 'user1@example.com' })
            );
            await userRepository.create(
                createTestUserData({ email: 'user2@example.com' })
            );
            
            // Try to update user1's email to user2's email
            await expect(
                userRepository.update(user1._id, { email: 'user2@example.com' })
            ).rejects.toThrow(/duplicate key error/i);
        });
    });
    
    describe('delete', () => {
        it('should delete user', async () => {
            const userData = createTestUserData();
            const user = await userRepository.create(userData);
            
            const result = await userRepository.delete(user._id);
            expect(result).toBe(true);
            
            const foundUser = await userRepository.findById(user._id);
            expect(foundUser).toBeNull();
        });
        
        it('should return false for non-existent user', async () => {
            const result = await userRepository.delete('507f1f77bcf86cd799439011');
            expect(result).toBe(false);
        });
    });
    
    describe('findAll', () => {
        beforeEach(async () => {
            // Create test users
            const users = createMultipleTestUsers(5);
            for (const user of users) {
                await userRepository.create(user);
            }
        });
        
        it('should return all users with pagination', async () => {
            const result = await userRepository.findAll({
                page: 1,
                limit: 3
            });
            
            expect(result.data).toHaveLength(3);
            expect(result.pagination.total).toBe(5);
            expect(result.pagination.pages).toBe(2);
            expect(result.pagination.page).toBe(1);
        });
        
        it('should filter by role', async () => {
            const result = await userRepository.findAll({
                filters: { role: 'admin' }
            });
            
            expect(result.data).toHaveLength(1);
            expect(result.data[0].role).toBe('admin');
        });
        
        it('should sort by createdAt descending by default', async () => {
            const result = await userRepository.findAll();
            
            const dates = result.data.map(u => new Date(u.createdAt).getTime());
            const sortedDates = [...dates].sort((a, b) => b - a);
            
            expect(dates).toEqual(sortedDates);
        });
    });
    
    describe('findByRole', () => {
        beforeEach(async () => {
            const users = createMultipleTestUsers(5);
            for (const user of users) {
                await userRepository.create(user);
            }
        });
        
        it('should find users by role', async () => {
            const customers = await userRepository.findByRole('customer');
            const admins = await userRepository.findByRole('admin');
            
            expect(customers).toHaveLength(4);
            expect(admins).toHaveLength(1);
            
            customers.forEach(user => {
                expect(user.role).toBe('customer');
            });
        });
    });
    
    describe('updateLastLogin', () => {
        it('should update last login timestamp', async () => {
            const userData = createTestUserData();
            const user = await userRepository.create(userData);
            
            // Wait a bit to see time difference
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const updated = await userRepository.updateLastLogin(user._id);
            expect(user).not.toBeNull()
            expect(updated.lastLogin).toBeDefined();
            expect(new Date(updated.lastLogin).getTime())
                .toBeGreaterThan(new Date(user.createdAt).getTime());
        });
    });
});})