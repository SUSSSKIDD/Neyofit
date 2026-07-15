import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// Custom key generator that uses user ID if authenticated, otherwise IP
const getRateLimitKey = (req: Request): string => {
    // If authenticated, rate limit per user
    if (req.user && req.user._id) {
        return `user:${req.user._id}`;
    }
    // Otherwise rate limit per IP (with proper proxy support)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
};

// Rate limiting for payment endpoints
export const paymentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each user/IP to 30 payment requests per window
    message: {
        success: false,
        message: 'Too many payment attempts, please try again after 15 minutes',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many payment attempts. Please try again later.',
            retryAfter: 900
        });
    }
});

// General API rate limiting
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 200 : 1000, // Stricter in production
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey,
    skip: (req: Request) => {
        // Skip for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey
});

// OTP send rate limiting (per IP - stricter)
export const otpSendRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 OTP requests per hour per IP
    message: {
        success: false,
        message: 'Too many OTP requests, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown';
        return `otp-send:ip:${ip}`;
    }
});

// OTP verify rate limiting
export const otpVerifyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 verify attempts per window
    message: {
        success: false,
        message: 'Too many verification attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey
});

// Password reset rate limiting
export const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.ip || 'unknown';
        return `pw-reset:ip:${ip}`;
    }
});

// Login rate limiting (per IP + per user)
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getRateLimitKey
});