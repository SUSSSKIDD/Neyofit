import { Router } from 'express';
import {
    registerUser,
    loginUser,
    registerGymOwner,
    logoutUser,
    verifyTokenEndpoint,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    checkEmail,
    sendOtp,
    verifyOtp,
    refreshToken
} from '@/auth/auth.controllers';
import { authMiddleware } from '@/auth/auth.middleware';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserType } from '@/types/user.types';
import {
    authRateLimit,
    loginRateLimit,
    otpSendRateLimit,
    otpVerifyRateLimit,
    passwordResetRateLimit
} from '@/middleware/rateLimiting';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication End Points | Register a user | Authenticate user, etc.
 */

/**
 * @swagger
 * /api/v1/auth/register-user:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "********"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+91123456789"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email or Phone already exists
 */
router.post('/register-user', authRateLimit, registerUser);

/**
 * @route   POST /api/v1/auth/check-email
 * @desc    Check if email exists and has password
 * @access  Public (rate-limited)
 */
router.post('/check-email', authRateLimit, checkEmail);

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to email for login or signup
 * @access  Public (rate-limited)
 */
router.post('/send-otp', otpSendRateLimit, sendOtp);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public (rate-limited)
 */
router.post('/verify-otp', otpVerifyRateLimit, verifyOtp);

/**
 * @route   POST /api/v1/auth/login-user
 * @desc    Login a user
 * @access  Public
 */
router.post('/login-user', loginRateLimit, loginUser);

/**
 * @route   POST /api/v1/auth/register-gym-owner
 * @desc    Register a gym owner (employee) account
 * @access  Protected (SuperAdmin only)
 */
router.post('/register-gym-owner', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), registerGymOwner);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (uses refresh token cookie)
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Protected
 */
router.post('/logout', authMiddleware, logoutUser);

/**
 * @route   GET /api/v1/auth/verify-token
 * @desc    Verify JWT token and return current user data
 * @access  Protected
 */
router.get('/verify-token', authMiddleware, verifyTokenEndpoint);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public (rate-limited)
 */
router.post('/forgot-password', passwordResetRateLimit, forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public (rate-limited)
 */
router.post('/reset-password', passwordResetRateLimit, resetPassword);

/**
 * @route   POST /api/v1/auth/send-verification-email
 * @desc    Send email verification link
 * @access  Protected
 */
router.post('/send-verification-email', authMiddleware, sendVerificationEmail);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email using token
 * @access  Public
 */
router.get('/verify-email/:token', verifyEmail);

export default router;