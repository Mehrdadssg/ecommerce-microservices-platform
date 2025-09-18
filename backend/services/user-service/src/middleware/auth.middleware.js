// src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

/**
 * Authenticate user via JWT token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided',
                code: 'NO_TOKEN'
            });
        }
        
        // Check token format (Bearer <token>)
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Use: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }
        
        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer '
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is empty',
                code: 'EMPTY_TOKEN'
            });
        }
        
        // Verify token
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Check token type
            if (decoded.type !== 'access') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token type',
                    code: 'INVALID_TOKEN_TYPE'
                });
            }
            
            // Attach user to request
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };
            
            // Continue to next middleware
            next();
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired',
                    code: 'TOKEN_EXPIRED',
                    expiredAt: jwtError.expiredAt
                });
            }
            
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            
            // Other errors
            throw jwtError;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token, but that's okay for optional auth
            return next();
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            if (decoded.type === 'access') {
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role
                };
            }
        } catch (error) {
            // Invalid token, but continue anyway (optional)
            console.log('Optional auth: Invalid token provided');
        }
        
        next();
    } catch (error) {
        // Don't fail on errors for optional auth
        next();
    }
};

/**
 * Authorize based on user roles
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} Express middleware
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        // Check if user has required role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }
        
        next();
    };
};

/**
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 * @returns {Function} Express middleware
 */
export const checkOwnership = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }
            
            // Get resource owner ID
            const ownerId = await getResourceOwnerId(req);
            
            // Check ownership
            if (ownerId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource',
                    code: 'NOT_OWNER'
                });
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Rate limiting middleware to prevent brute force
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
export const rateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // Max requests per window
        message = 'Too many requests, please try again later',
        keyGenerator = (req) => req.ip // Use IP as key
    } = options;
    
    const requests = new Map();
    
    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get user's requests
        const userRequests = requests.get(key) || [];
        
        // Filter out old requests
        const recentRequests = userRequests.filter(time => time > windowStart);
        
        // Check if limit exceeded
        if (recentRequests.length >= max) {
            return res.status(429).json({
                success: false,
                message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: new Date(recentRequests[0] + windowMs).toISOString()
            });
        }
        
        // Add current request
        recentRequests.push(now);
        requests.set(key, recentRequests);
        
        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance
            for (const [k, v] of requests.entries()) {
                if (v.every(time => time < windowStart)) {
                    requests.delete(k);
                }
            }
        }
        
        next();
    };
};

// Export all middleware
export default {
    authenticate,
    optionalAuth,
    authorize,
    checkOwnership,
    rateLimit
};