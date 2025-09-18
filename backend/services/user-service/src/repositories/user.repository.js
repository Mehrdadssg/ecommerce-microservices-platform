// src/repositories/user.repository.js

import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

export class UserRepository {
    constructor() {
        this.model = User;
    }
    
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user without password
     */
    async create(userData) {
        try {
            const user = new this.model(userData);
            const saved = await user.save();
            
            // Convert to object and remove password
            const userObject = saved.toObject();
            delete userObject.password;
            
            return userObject;
        } catch (error) {
            // Handle duplicate key error
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new Error(`Duplicate key error: ${field} already exists`);
            }
            throw error;
        }
    }
    
    /**
     * Find user by email (without password)
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User or null
     */
    async findByEmail(email) {
        return await this.model
            .findOne({ email: email.toLowerCase() })
            .lean();
    }
    
    /**
     * Find user by email with password field
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User with password or null
     */
    async findByEmailWithPassword(email) {
        return await this.model
            .findOne({ email: email.toLowerCase() })
            .select('+password')
            .lean();
    }
    
    /**
     * Find user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object|null>} User or null
     */
    async findById(id) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        
        return await this.model
            .findById(id)
            .lean();
    }
    
    /**
     * Update user
     * @param {string} id - User ID
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    async update(id, updateData) {
        // Don't allow password update through this method
        delete updateData.password;

        // Ensure ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID');
        }
        
        const updated = await this.model
            .findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .lean();
            
        if (!updated) {
            throw new Error('User not found');
        }
        
        return updated;
    }
    
    /**
     * Delete user
     * @param {string} id - User ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        const result = await this.model.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
    
    /**
     * Find all users with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users and pagination info
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = { createdAt: -1 },
            filters = {}
        } = options;
        
        const skip = (page - 1) * limit;
        
        // Build query
        const query = {};
        
        if (filters.role) {
            query.role = filters.role;
        }
        
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        
        if (filters.isEmailVerified !== undefined) {
            query.isEmailVerified = filters.isEmailVerified;
        }
        
        // Execute query
        const [data, total] = await Promise.all([
            this.model
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(query)
        ]);
        
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Find users by role
     * @param {string} role - User role
     * @returns {Promise<Array>} Users
     */
    async findByRole(role) {
        return await this.model
            .find({ role })
            .lean();
    }
    
    /**
     * Update last login time
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user
     */
 async updateLastLogin(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid user ID');
    }
    
    return await this.model
        .findByIdAndUpdate(
            id,
            { $set: { lastLogin: new Date() } },
            { new: true }
            
        )
            .lean();
       
}
    
    /**
     * Count users by criteria
     * @param {Object} criteria - Query criteria
     * @returns {Promise<number>} Count
     */
    async count(criteria = {}) {
        return await this.model.countDocuments(criteria);
    }
    
    /**
     * Check if email exists
     * @param {string} email - Email to check
     * @returns {Promise<boolean>} Exists or not
     */
    async emailExists(email) {
        const count = await this.model.countDocuments({ 
            email: email.toLowerCase() 
        });
        return count > 0;
    }
}

// Export as default too
export default UserRepository;