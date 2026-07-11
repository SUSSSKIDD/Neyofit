import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '@/user/user.model.js';
import { UserType, IUserRegistrationRequest } from '@/types/user.types.js';
import { ILoginRequest, ILoginResponse, IRegistrationResponse, ISendOtpRequest, IVerifyOtpRequest } from '@/types/auth.types.js';
import { generateToken, verifyToken } from '@/utils/jwt.utils';
import logger from '@/utils/logger.js';
import { TokenBlacklist } from '@/auth/tokenBlacklist.model';
import { EmailTemplateService } from '@/config/email/templates/emailTemplates.config';
import { sendEmailSafe } from '@/utils/sendEmailSafe';

// Register new user
export const registerUser = async (req: Request<{}, {}, IUserRegistrationRequest>, res: Response): Promise<void> => {
    try {
        const { userType, name, email, phone, password, userAvatar } = req.body;

        // Validate required fields - only email is mandatory
        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required'
            });
            return;
        }

        // If password provided, name is also required
        if (password && !name) {
            res.status(400).json({
                success: false,
                message: 'Name is required when setting a password'
            });
            return;
        }

        // Validate user type
        if (!Object.values(UserType).includes(userType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user type. Must be: customer, gym, or employee'
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered'
            });
            return;
        }

        // Create new user
        const user = new User({
            userType,
            name,
            email,
            phone,
            password,
            userAvatar: userAvatar || null,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        await user.save();

        const token = generateToken(user);

        logger.info('User registered successfully', {
            userId: user._id,
            userType,
            email,
            requestId: req.requestId
        });

        const response: IRegistrationResponse = {
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                token
            }
        };

        res.status(201).json(response);

        // Send verification email (fire-and-forget)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.emailVerificationToken = hashedVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.save().then(() => {
            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
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

        logger.info(`[DEBUG LOGIN] email="${email}", passwordLength=${password?.length}, body=${JSON.stringify(req.body)}`);

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            logger.info(`[DEBUG LOGIN] User not found for email="${email}"`);
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        // If user has no password, they must use OTP
        if (!user.password) {
            res.status(400).json({
                success: false,
                message: 'This account uses OTP login. Please sign in with OTP.',
                requiresOtp: true
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        logger.info(`[DEBUG LOGIN] comparePassword result: ${isMatch} for email="${email}"`);

        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        const token = generateToken(user);

        logger.info('User logged in successfully', {
            userId: user._id,
            email,
            requestId: req.requestId
        });

        const response: ILoginResponse = {
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                token
            }
        };

        res.status(200).json(response);

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
export const registerGymOwner = async (req: Request<{}, {}, IUserRegistrationRequest>, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password, userAvatar } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, phone, password'
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered'
            });
            return;
        }

        // Create new gym owner with userType 'gym'
        const user = new User({
            userType: UserType.GYM,
            name,
            email,
            phone,
            password,
            userAvatar: userAvatar || null,
            isActive: true
        });

        await user.save();

        const token = generateToken(user);

        logger.info('Gym owner registered successfully', {
            userId: user._id,
            email,
            requestId: req.requestId
        });

        const response: IRegistrationResponse = {
            success: true,
            message: 'Gym owner account created successfully',
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                token
            }
        };

        res.status(201).json(response);

        // Send verification email (fire-and-forget)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        user.emailVerificationToken = hashedVerificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.save().then(() => {
            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
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

        // Validate required fields
        if (!name || !email || !phone || !password) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, phone, password'
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Phone already registered'
            });
            return;
        }

        // Create new superadmin
        const user = new User({
            userType: UserType.SUPERADMIN,
            name,
            email,
            phone,
            password,
            isActive: true
        });

        await user.save();

        const token = generateToken(user);

        logger.info('SuperAdmin registered successfully', {
            userId: user._id,
            email,
            requestId: req.requestId
        });

        const response: IRegistrationResponse = {
            success: true,
            message: 'SuperAdmin account created successfully',
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                token
            }
        };

        res.status(201).json(response);

    } catch (error) {
        logger.error('SuperAdmin registration failed', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Logout user - blacklist the current JWT token
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.token;
        if (!token) {
            res.status(400).json({ success: false, message: 'No token to revoke' });
            return;
        }

        // Decode token to get expiry for TTL
        const decoded = verifyToken(token);
        const expiresAt = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // fallback 10 days

        await TokenBlacklist.create({ token, expiresAt });

        logger.info('User logged out', { userId: req.user?._id, requestId: req.requestId });

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

// Verify token endpoint - return current user data
export const verifyTokenEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid token' });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isEmailVerified: user.isEmailVerified,
                    isActive: user.isActive
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Token verification failed' });
    }
};

// Forgot password - generate reset token, send email
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Send password reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

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
            // Don't fail the request if email fails - token is still saved
        }

        logger.info('Password reset requested', { userId: user._id, requestId: req.requestId });

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

        if (password.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            return;
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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
        await user.save();

        logger.info('Password reset successful', { userId: user._id, requestId: req.requestId });

        // Notify user of password change (fire-and-forget)
        sendEmailSafe({
            templateType: 'password-changed',
            to: user.email,
            subject: 'Neyofit - Your Password Has Been Changed',
            data: {
                userName: user.name,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
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
export const sendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
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
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

        try {
            await EmailTemplateService.sendTemplatedEmail({
                templateType: 'email-verification',
                to: user.email,
                subject: 'Neyofit - Verify Your Email',
                data: {
                    userName: user.name,
                    verifyUrl
                }
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

// Check if email exists
export const checkEmail = async (req: Request<{}, {}, { email: string }>, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email });

        res.status(200).json({
            success: true,
            exists: !!user,
            hasPassword: !!(user && user.password)
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
            // Create inactive user with just email
            user = new User({
                email,
                userType: UserType.CUSTOMER,
                isActive: false,
                isEmailVerified: false
            });
            await user.save();
            isNewUser = true;
        } else if (!user && purpose === 'login') {
            // Don't reveal that account doesn't exist - still return success
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

        // Generate 6-digit OTP
        const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHashed = crypto.createHash('sha256').update(otpPlain).digest('hex');

        // Store hashed OTP with 10-minute expiry
        user.otp = otpHashed;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();

        // Send OTP email
        sendEmailSafe({
            templateType: 'otp-verification',
            to: email,
            subject: 'Neyofit - Your Verification Code',
            data: {
                userName: user.name || 'there',
                otpCode: otpPlain
            }
        });

        logger.info('OTP sent', { email, purpose, requestId: req.requestId });

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email',
            data: {
                hasPassword: !!user.password,
                isNewUser
            }
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

        if (!email || !otp || !purpose) {
            res.status(400).json({
                success: false,
                message: 'Email, OTP, and purpose are required'
            });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
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

        // Hash provided OTP and compare
        const otpHashed = crypto.createHash('sha256').update(otp).digest('hex');

        if (otpHashed !== user.otp) {
            // Increment attempts
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();

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

        const token = generateToken(user);

        logger.info('OTP verified successfully', {
            userId: user._id,
            email,
            purpose,
            requestId: req.requestId
        });

        res.status(200).json({
            success: true,
            message: purpose === 'signup' ? 'Account verified successfully' : 'Login successful',
            data: {
                user: {
                    id: user._id,
                    userType: user.userType,
                    name: user.name || '',
                    email: user.email,
                    phone: user.phone || '',
                },
                token
            }
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

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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

        // Send success confirmation (fire-and-forget)
        sendEmailSafe({
            templateType: 'email-verified-success',
            to: user.email,
            subject: 'Neyofit - Email Verified Successfully',
            data: {
                userName: user.name,
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
            }
        });

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        logger.error('Email verification failed', error as Error, { requestId: req.requestId });
        res.status(500).json({ success: false, message: 'Email verification failed' });
    }
};
