// src/services/auth.service.js

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { error } from 'console';

/**
 * Authentication Service
 * Handles all authentication business logic
 */
export class AuthService {
    constructor({ userRepository }) {
        // Dependency injection - we receive repository
        this.userRepository = userRepository;
        
        // Bind methods to preserve 'this' context
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    
    return this.sanitizeUser(user);
}
    
    /**
     * Register a new user
     * @param {Object} userData - Registration data
     * @returns {Promise<Object>} User and token
     */
    async register(userData) {
        // Step 1: Validate business rules
        await this.validateRegistration(userData);
        
        // Step 2: Check if user exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            // Don't reveal too much info (security)
            const error = new Error('Registration failed');
            error.statusCode = 409; // Conflict
            error.code = 'USER_EXISTS';
            throw error;
        }
        
        // Step 3: Create user (password hashed by model)
        const user = await this.userRepository.create({
            email: userData.email.toLowerCase().trim(),
            password: userData.password,
            name: userData.name,
            role: userData.role || 'customer'
        }); 
        
        // Step 4: Generate tokens
        const tokens = this.generateTokens(user);
        
        // Step 5: Log the registration (for analytics)
        console.log(`New user registered: ${user.email} with role: ${user.role}`);
        
        // Step 6: Return user data and tokens
        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }
    
    /**
     * Login existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User and token
     */
    async login(email, password) {
        // Step 1: Find user with password field
        const user = await this.userRepository.findByEmailWithPassword(email);
        
        if (!user) {
            // Generic error message (don't reveal if email exists)
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        
        // Step 2: Check if account is active
        if (!user.isActive) {
            const error = new Error('Account is disabled');
            error.statusCode = 403;
            error.code = 'ACCOUNT_DISABLED';
            throw error;
        }
        
        // Step 3: Check if account is locked (too many failed attempts)
        if (user.isLocked && user.lockUntil > Date.now()) {
            const error = new Error('Account is locked. Try again later');
            error.statusCode = 423; // Locked
            error.code = 'ACCOUNT_LOCKED';
            throw error;
        }
        
        // Step 4: Verify password
        // Import User model to use the comparePassword method
        const { User } = await import('../models/user.model.js');
        const userDoc = await User.findById(user._id).select('+password');

        if (!userDoc){
            throw new Error('Invalid Credential')
        }

        const isPasswordValid = await userDoc.comparePassword(password);
        
        if (!isPasswordValid) {
            // Handle failed login attempt
            await this.handleFailedLogin(user._id);
            
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        
        // Step 5: Reset failed attempts on successful login
        await this.userRepository.updateLastLogin(user._id);

        
        // Step 6: Generate tokens
        const tokens = this.generateTokens(user);
        
        // Step 7: Log the login (for analytics/security)
        console.log(`User logged in: ${user.email} from IP: ${user.lastIP || 'unknown'}`);
        
        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }
    
    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret || config.jwt.secret);
            
            // Get user
            const user = await this.userRepository.findById(decoded.id);
            
            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }
            
            // Generate new tokens
            const tokens = this.generateTokens(user);
            
            return tokens;
        } catch (error) {
            const err = new Error('Invalid refresh token');
            err.statusCode = 401;
            throw err;
        }
    }
    
    /**
     * Logout user (invalidate tokens)
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success
     */
    async logout(userId) {
        
        console.log(`User logged out: ${userId}`);
        return true;
    }
    
    /**
     * Verify email with token
     * @param {string} token - Verification token
     * @returns {Promise<boolean>} Success
     */
    async verifyEmail(token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            await this.userRepository.update(decoded.id, {
                isEmailVerified: true,
                emailVerifiedAt: new Date()
            });
            
            return true;
        } catch (error) {
            throw new Error('Invalid verification token');
        }
    }
    
    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<string>} Reset token
     */
    async requestPasswordReset(email) {
        const user = await this.userRepository.findByEmail(email);
        
        if (!user) {
            // Don't reveal if user exists
            return 'If the email exists, a reset link has been sent';
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id, type: 'password-reset' },
            config.jwt.secret,
            { expiresIn: '1h' }
        );
        
        // In production, send email here
        console.log(`Password reset requested for: ${email}`);
        
        return resetToken;
    }
    
    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success
     */
    async resetPassword(token, newPassword) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            if (decoded.type !== 'password-reset') {
                throw new Error('Invalid token type');
            }
            
            // Update password (will be hashed by model)
            await this.userRepository.update(decoded.id, {
                password: newPassword,
                loginAttempts: 0,
                lockUntil: null
            });
            
            return true;
        } catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    }
    
    // ===== HELPER METHODS =====
    
    /**
     * Validate registration data
     * @private
     */
    async validateRegistration(userData) {
        // Check password strength
        if (userData.password.length < 6) {
            const error = new Error('Password must be at least 6 characters');
            error.statusCode = 400;
            throw error;
        }
        
        // Check if password contains username
        const emailUsername = userData.email.split('@')[0].toLowerCase();
    if (userData.password.toLowerCase() === emailUsername) {
        const error = new Error('Password cannot be the same as your email username');
        error.statusCode = 400;
        throw error;
    }

    const weakPasswords = ['password', '123456', 'password123', 'admin'];
    if (weakPasswords.includes(userData.password.toLowerCase())) {
        const error = new Error('Password is too common. Please choose a stronger password');
        error.statusCode = 400;
        throw error;
    }
        // Add more validation as needed
    }
    
    /**
     * Handle failed login attempt
     * @private
     */
    async handleFailedLogin(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
        console.error('User not found for failed login handling:', userId);
        return;
    }
        const attempts = (user.loginAttempts || 0) + 1;
        
        const updateData = {
            loginAttempts: attempts
        };
        
        // Lock account after 5 attempts for 2 hours
        if (attempts >= 5) {
            updateData.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
            console.log(`Account locked due to failed attempts: ${user.email}`);
        }
        
        await this.userRepository.update(userId, updateData);
    }
    
    /**
     * Generate access and refresh tokens
     * @private
     */
    generateTokens(user) {
        // Access token - short lived (15 minutes)
        const accessToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                type: 'access'
            },
            config.jwt.secret,
            { 
                expiresIn: '15m',
                issuer: 'ecommerce-api',
                audience: 'ecommerce-client'
            }
        );
        
        // Refresh token - long lived (7 days)
        const refreshToken = jwt.sign(
            {
                id: user._id,
                type: 'refresh'
            },
            config.jwt.refreshSecret || config.jwt.secret,
            { 
                expiresIn: '7d',
                issuer: 'ecommerce-api'
            }
        );
        
        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
            tokenType: 'Bearer'
        };
    }
    
    /**
     * Remove sensitive data from user object
     * @private
     */
    sanitizeUser(user) {
        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.loginAttempts;
        delete sanitized.lockUntil;
        delete sanitized.__v;
        return sanitized;
    }
}

export default AuthService;