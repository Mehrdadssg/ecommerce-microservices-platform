// src/controllers/auth.controller.js

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */
export class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }
    
    /**
     * Register new user
     * POST /api/auth/register
     */
    register = async (req, res, next) => {
        try {
            const result = await this.authService.register(req.body);
            
            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    expiresIn: result.tokens.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Login user
     * POST /api/auth/login
     */
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            
            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    expiresIn: result.tokens.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Logout user
     * POST /api/auth/logout
     */
    logout = async (req, res, next) => {
        try {
            // Clear refresh token cookie
            res.clearCookie('refreshToken');
            
            // If user is authenticated, log them out
            if (req.user) {
                await this.authService.logout(req.user.id);
            }
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    refreshToken = async (req, res, next) => {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token not provided'
                });
            }
            
            const tokens = await this.authService.refreshToken(refreshToken);
            
            // Update refresh token cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            
            res.json({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                    expiresIn: tokens.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Get current user
     * GET /api/auth/me
     */
    getMe = async (req, res, next) => {
        try {
            // req.user is set by auth middleware
            const user = await this.authService.getUserById(req.user.id);
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Verify email
     * POST /api/auth/verify-email
     */
    verifyEmail = async (req, res, next) => {
        try {
            const { token } = req.body;
            await this.authService.verifyEmail(token);
            
            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Request password reset
     * POST /api/auth/forgot-password
     */
    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const message = await this.authService.requestPasswordReset(email);
            
            // Always return success (don't reveal if email exists)
            res.json({
                success: true,
                message: message || 'If the email exists, a reset link has been sent'
            });
        } catch (error) {
            next(error);
        }
    };
    
    /**
     * Reset password
     * POST /api/auth/reset-password
     */
    resetPassword = async (req, res, next) => {
        try {
            const { token, password } = req.body;
            await this.authService.resetPassword(token, password);
            
            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;