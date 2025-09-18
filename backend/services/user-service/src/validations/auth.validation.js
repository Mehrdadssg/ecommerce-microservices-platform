// src/validations/auth.validation.js

import { z } from 'zod';

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        ),
    
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name too long')
        .trim(),
    
    role: z
        .enum(['customer', 'vendor', 'admin'])
        .optional()
        .default('customer')
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    
    password: z
        .string()
        .min(1, 'Password is required')
});

/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
    token: z
        .string()
        .min(1, 'Verification token is required')
});

/**
 * Password reset request schema
 */
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
});

/**
 * Password reset schema
 */
export const resetPasswordSchema = z.object({
    token: z
        .string()
        .min(1, 'Reset token is required'),
    
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        )
});

/**
 * Change password schema (for logged-in users)
 */
export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    
    newPassword: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        ),
    
    confirmPassword: z
        .string()
        .min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name too long')
        .trim()
        .optional(),
    
    phone: z
        .string()
        .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
        .optional(),
    
    address: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        zipCode: z.string().trim().optional(),
        country: z.string().trim().optional()
    }).optional()
});