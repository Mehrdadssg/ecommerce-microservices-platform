// src/routes/auth.routes.js

import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../validations/auth.validation.js';

const router = express.Router();

// Initialize dependencies
const userRepository = new UserRepository();
const authService = new AuthService({ userRepository });
const authController = new AuthController({ authService });

// Public routes (no authentication required)
router.post('/register', 
    validateBody(registerSchema), 
    authController.register
);

router.post('/login', 
    validateBody(loginSchema), 
    authController.login
);

router.post('/logout', 
    authController.logout
);

router.post('/refresh', 
    authController.refreshToken
);

router.post('/verify-email', 
    validateBody(verifyEmailSchema), 
    authController.verifyEmail
);

router.post('/forgot-password', 
    validateBody(forgotPasswordSchema), 
    authController.forgotPassword
);

router.post('/reset-password', 
    validateBody(resetPasswordSchema), 
    authController.resetPassword
);

// Protected routes (authentication required)
router.get('/me', 
    authenticate, 
    authController.getMe
);

export default router;