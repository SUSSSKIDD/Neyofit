import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '@/user/user.model.js';
import { UserType, IUserRegistrationRequest } from '@/types/user.types.js';
import { ILoginRequest, ILoginResponse, IRegistrationResponse, ISendOtpRequest, IVerifyOtpRequest } from '@/types/auth.types.js';
import { generateTokenPair, verifyRefreshToken, verifyAccessToken, getTokenExpiry } from '@/utils/token.utils';
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromRequest } from '@/utils/cookie.utils';
import logger from '@/utils/logger.js';
import { TokenBlacklist } from '@/auth/tokenBlacklist.model';
import { EmailTemplateService } from '@/config/email/templates/emailTemplates.config';
import { sendEmailSafe } from '@/utils/sendEmailSafe';
import { generateSecureOTP, hashToken, constantTimeCompare } from '@/utils/crypto.utils';

interface AuthenticatedRequest extends Request {
    user?: any;
    token?: string;
    tokenExpiry?: Date;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neyofit.in';

function getClientInfo(req: Request): { ip: string; userAgent: string } {
    return {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
    };
}

function sanitizeUserResponse(user: any) {
    return {
        id: user._id,
        userType: user.userType,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        userAvatar: user.userAvatar,
        lastLogin: user.lastLogin,
    };
}

// Register new user
export const registerUser = async (req: Request<{}, {}, IUserRegistrationRequest>, res: Response): Promise<void> => {
    try {
        const { userType, name, email, phone, password, userAvatar } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        if (password && !name) {
            res.status(400).json({ success: false, message: 'Name is required when setting a password' });
            return;
        }

        if (!Object.values(UserType).includes(userType)) {
            res.status(400).json({ success: false, message: 'Invalid user type. Must be: customer, gym, or employee' });
            return;
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            logger.warn('Registration attempt with existing credentials', { email, phone, ip: clientInfo.ip });
            res.status(409).json({ 
                success: false, 
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered' 
            });
            return;
        }

        const user = new User({
            userType,
            name,
            email,
            phone,
            password,
            userAvatar: userAvatar || null,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
            tokenVersion: 0,
        });

        await user.save();

        const tokens = generateTokenPair(user);
        setAuthCookies(res, tokens);

        logger.info('User registered successfully', {
            userId: user._id,
            userType,
            email,
            ip: clientInfo.ip,
            requestId: req.requestId
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: sanitizeUserResponse(user) }
        });

        // Send verification email (fire-and-forget)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = hashToken(verificationToken);
        user.emailVerificationToken = hashedVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.save().then(() => {
            const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
            sendEmailSafe({
                templateType: 'email-verification',
                to: user.email,
                subject: 'Neyofit - Verify Your Email',
                data: { userName: user.name, verifyUrl }
            });
        }).catch((err: Error) => logger.error('Failed to save verification token', err));

    } catch (error) {
        logger.error('User registration failed', error as Error, { requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Login user
export const loginUser = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            logger.info('Login attempt with non-existent email', { email, ip: clientInfo.ip });
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        if (!user.password) {
            res.status(400).json({
                success: false,
                message: 'This account uses OTP login. Please sign in with OTP.',
                requiresOtp: true
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn('Failed login attempt', { email, ip: clientInfo.ip });
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({ success: false, message: 'Account is deactivated' });
            return;
        }

        user.lastLogin = new Date();
        await user.save();

        const tokens = generateTokenPair(user);
        setAuthCookies(res, tokens);

        logger.info('User logged in successfully', {
            userId: user._id,
            email,
            ip: clientInfo.ip,
            requestId: req.requestId
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: sanitizeUserResponse(user) }
        });

    } catch (error) {
        logger.error('User login failed', error as Error, { requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Register new gym owner (employee)
export const registerGymOwner = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, userAvatar } = req.body;

        if (!name || !email || !phone || !password) {
            res.status(400).json({ success: false, message: 'Missing required fields: name, email, phone, password' });
            return;
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            res.status(409).json({ 
                success: false, 
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered' 
            });
            return;
        }

        const user = new User({
            userType: UserType.GYM,
            name,
            email,
            phone,
            password,
            userAvatar: userAvatar || null,
            isActive: true,
            tokenVersion: 0,
        });

        await user.save();

        logger.info('Gym owner registered successfully', {
            userId: user._id,
            email,
            requestId: req.requestId
        });

        res.status(201).json({
            success: true,
            message: 'Gym owner account created successfully',
            data: { user: sanitizeUserResponse(user) }
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = hashToken(verificationToken);
        user.emailVerificationToken = hashedVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.save().then(() => {
            const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
            sendEmailSafe({
                templateType: 'email-verification',
                to: user.email,
                subject: 'Neyofit - Verify Your Email',
                data: { userName: user.name, verifyUrl }
            });
        }).catch((err: Error) => logger.error('Failed to save verification token', err));

    } catch (error) {
        logger.error('Gym owner registration failed', error as Error, { requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Register new superadmin (restricted)
export const registerSuperAdmin = async (req: Request<{}, {}, IUserRegistrationRequest>, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password } = req.body;
        const clientInfo = getClientInfo(req);

        if (!name || !email || !phone || !password) {
            res.status(400).json({ success: false, message: 'Missing required fields: name, email, phone, password' });
            return;
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            res.status(409).json({ 
                success: false, 
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered' 
            });
            return;
        }

        const user = new User({
            userType: UserType.SUPERADMIN,
            name,
            email,
            phone,
            password,
            isActive: true,
            tokenVersion: 0,
        });

        await user.save();

        logger.info('SuperAdmin registered successfully', {
            userId: user._id,
            email,
            ip: clientInfo.ip,
            requestId: req.requestId
        });

        res.status(201).json({
            success: true,
            message: 'SuperAdmin account created successfully',
            data: { user: sanitizeUserResponse(user) }
        });

    } catch (error) {
        logger.error('SuperAdmin registration failed', error as Error, { requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Logout user - revoke refresh token and clear cookies
export const logoutUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        
        if (refreshToken) {
            try {
                const payload = verifyRefreshToken(refreshToken);
                const hashedToken = hashToken(refreshToken);
                const expiresAt = getTokenExpiry(refreshToken) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await TokenBlacklist.create({ token: hashedToken, expiresAt });
            } catch (e) {
                // Invalid refresh token, just clear cookies
            }
        }

        if (req.user) {
            // Increment token version to invalidate all access tokens
            req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
            await req.user.save();
            logger.info('User logged out - token version incremented', { userId: req.user._id, requestId: req.requestId });
        }

        clearAuthCookies(res);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout failed', error as Error, { requestId: req.requestId });
        clearAuthCookies(res);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        
        if (!refreshToken) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'No refresh token provided' });
            return;
        }

        const hashedToken = hashToken(refreshToken);
        const isBlacklisted = await TokenBlacklist.findOne({ token: hashedToken });
        if (isBlacklisted) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Refresh token revoked' });
            return;
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
            return;
        }

        const user = await User.findById(payload.id);
        if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Session invalid' });
            return;
        }

        const tokens = generateTokenPair(user);
        setAuthCookies(res, tokens);

        logger.info('Access token refreshed', { userId: user._id, requestId: req.requestId });
        res.status(200).json({ success: true, message: 'Token refreshed' });
    } catch (error) {
        logger.error('Token refresh failed', error as Error, { requestId: req.requestId });
        clearAuthCookies(res);
        res.status(401).json({ success: false, message: 'Token refresh failed' });
    }
};

// Verify token endpoint - return current user data
export const verifyTokenEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid token' });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user: sanitizeUserResponse(user) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Token verification failed' });
    }
};

// Refresh access token using refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        
        if (!refreshToken) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'No refresh token provided' });
            return;
        }

        const hashedToken = hashToken(refreshToken);
        const isBlacklisted = await TokenBlacklist.findOne({ token: hashedToken });
        if (isBlacklisted) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Refresh token revoked' });
            return;
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
            return;
        }

        const user = await User.findById(payload.id);
        if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Session invalid' });
            return;
        }

        const tokens = generateTokenPair(user);
        setAuthCookies(res, tokens);

        logger.info('Access token refreshed', { userId: user._id, requestId: req.requestId });
        res.status(200).json({ success: true, message: 'Token refreshed' });
    } catch (error) {
        logger.error('Token refresh failed', error as Error, { requestId: req.requestId });
        clearAuthCookies(res);
        res.status(401).json({ success: false, message: 'Token refresh failed' });
    }
};

// Forgot password - generate reset token, send email
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            logger.info('Password reset requested for non-existent email', { email, ip: clientInfo.ip });
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashToken(resetToken);

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await EmailTemplateService.sendTemplatedEmail({
                templateType: 'password-reset',
                to: user.email,
                subject: 'Neyofit - Password Reset Request',
                data: {
                    userName: user.name,
                    resetUrl,
                    expiryTime: '1 hour'
                }
            });
        } catch (emailError) {
            logger.error('Failed to send password reset email', emailError as Error);
        }

        logger.info('Password reset requested', { userId: user._id, requestId: req.requestId, ip: clientInfo.ip });

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error) {
        logger.error('Forgot password failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Failed to process request' });
    }
};

// Reset password - validate reset token, update password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ success: false, message: 'Token and new password are required' });
            return;
        }

        if (password.length < 12) {
            res.status(400).json({ success: false, message: 'Password must be at least 12 characters' });
            return;
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
            return;
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all sessions
        await user.save();

        logger.info('Password reset successful', { userId: user._id, requestId: req.requestId });

        sendEmailSafe({
            templateType: 'password-changed',
            to: user.email,
            subject: 'Neyofit - Your Password Has Been Changed',
            data: {
                userName: user.name,
                loginUrl: `${FRONTEND_URL}/login`,
                changeTime: new Date().toLocaleString()
            }
        });

        res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        logger.error('Reset password failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

// Send verification email
export const sendVerificationEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ success: false, message: 'Email is already verified' });
            return;
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashToken(verificationToken);

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

        try {
            await EmailTemplateService.sendTemplatedEmail({
                templateType: 'email-verification',
                to: user.email,
                subject: 'Neyofit - Verify Your Email',
                data: { userName: user.name, verifyUrl }
            });
        } catch (emailError) {
            logger.error('Failed to send verification email', emailError as Error);
        }

        logger.info('Verification email sent', { userId: user._id, requestId: req.requestId });

        res.status(200).json({ success: true, message: 'Verification email sent' });
    } catch (error) {
        logger.error('Send verification email failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Failed to send verification email' });
    }
};

// Check if email exists - returns uniform response to prevent enumeration
export const checkEmail = async (req: Request<{}, {}, { email: string }>, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        // Rate limit this endpoint heavily
        // TODO: Add per-IP rate limiting

        // Always return same response structure to prevent enumeration
        // We don't reveal whether email exists
        res.status(200).json({
            success: true,
            message: 'If an account exists, you will receive an email'
        });
    } catch (error) {
        logger.error('Check email failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Send OTP
export const sendOtp = async (req: Request<{}, {}, ISendOtpRequest>, res: Response): Promise<void> => {
    try {
        const { email, purpose } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email || !purpose || !['login', 'signup'].includes(purpose)) {
            res.status(400).json({
                success: false,
                message: 'Valid email and purpose (login/signup) are required'
            });
            return;
        }

        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user && purpose === 'signup') {
            // Create inactive user with just email - DON'T create user until OTP verified
            // Use a temporary approach: store OTP in a separate collection or cache
            // For now, create user but mark as unverified
            user = new User({
                email,
                userType: UserType.CUSTOMER,
                isActive: false,
                isEmailVerified: false,
                tokenVersion: 0,
            });
            await user.save();
            isNewUser = true;
        } else if (!user && purpose === 'login') {
            // Don't reveal that account doesn't exist
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, an OTP has been sent',
                data: { hasPassword: false, isNewUser: true }
            });
            return;
        }

        if (!user) {
            res.status(500).json({ success: false, message: 'Internal server error' });
            return;
        }

        // Rate limit: check if too many OTPs sent recently (user-level)
        if (user.otpExpires && user.otpExpires > new Date() && user.otpAttempts !== undefined && user.otpAttempts >= 5) {
            res.status(429).json({
                success: false,
                message: 'Too many OTP attempts. Please request a new code.'
            });
            return;
        }

        // Generate crypto-secure 6-digit OTP
        const otpPlain = generateSecureOTP();
        const otpHashed = hashToken(otpPlain);

        user.otp = otpHashed;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (reduced from 10)
        user.otpAttempts = 0;
        await user.save();

        sendEmailSafe({
            templateType: 'otp-verification',
            to: email,
            subject: 'Neyofit - Your Verification Code',
            data: {
                userName: user.name || 'there',
                otpCode: otpPlain
            }
        });

        logger.info('OTP sent', { email, purpose, ip: clientInfo.ip, requestId: req.requestId });

        // Uniform response - don't reveal if user has password or is new
        res.status(200).json({
            success: true,
            message: 'OTP sent to your email',
            data: { hasPassword: !!user.password }
        });
    } catch (error) {
        logger.error('Send OTP failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify OTP
export const verifyOtp = async (req: Request<{}, {}, IVerifyOtpRequest>, res: Response): Promise<void> => {
    try {
        const { email, otp, purpose, name, phone, password } = req.body;
        const clientInfo = getClientInfo(req);

        if (!email || !otp || !purpose) {
            res.status(400).json({
                success: false,
                message: 'Email, OTP, and purpose are required'
            });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            logger.warn('OTP verification attempt for non-existent user', { email, ip: clientInfo.ip });
            res.status(401).json({ success: false, message: 'Invalid OTP' });
            return;
        }

        // Check attempts
        if (user.otpAttempts !== undefined && user.otpAttempts >= 5) {
            res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            });
            return;
        }

        // Check expiry
        if (!user.otpExpires || user.otpExpires < new Date()) {
            res.status(401).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
            return;
        }

        // Hash provided OTP and compare using constant-time comparison
        const otpHashed = hashToken(otp);

        if (!constantTimeCompare(otpHashed, user.otp || '')) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();

            logger.warn('Invalid OTP attempt', { email, attempts: user.otpAttempts, ip: clientInfo.ip });
            res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
            return;
        }

        // OTP is valid - clear OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.isEmailVerified = true;
        user.isActive = true;

        // For signup: apply optional profile data
        if (purpose === 'signup') {
            if (name) user.name = name;
            if (phone) user.phone = phone;
            if (password) user.password = password;
        }

        user.lastLogin = new Date();
        await user.save();

        const tokens = generateTokenPair(user);
        setAuthCookies(res, tokens);

        logger.info('OTP verified successfully', {
            userId: user._id,
            email,
            purpose,
            ip: clientInfo.ip,
            requestId: req.requestId
        });

        res.status(200).json({
            success: true,
            message: purpose === 'signup' ? 'Account verified successfully' : 'Login successful',
            data: { user: sanitizeUserResponse(user) }
        });
    } catch (error) {
        logger.error('Verify OTP failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify email - validate token, set isEmailVerified
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        if (!token) {
            res.status(400).json({ success: false, message: 'Verification token is required' });
            return;
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
            return;
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        logger.info('Email verified', { userId: user._id, requestId: req.requestId });

        sendEmailSafe({
            templateType: 'email-verified-success',
            to: user.email,
            subject: 'Neyofit - Email Verified Successfully',
            data: {
                userName: user.name,
                dashboardUrl: `${FRONTEND_URL}/dashboard`
            }
        });

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        logger.error('Email verification failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Email verification failed' });
    }
};