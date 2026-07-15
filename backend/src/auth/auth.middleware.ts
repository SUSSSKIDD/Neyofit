import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, getTokenExpiry } from '@/utils/token.utils';
import User from '@/user/user.model.js';
import { TokenBlacklist } from '@/auth/tokenBlacklist.model';

export interface AuthenticatedRequest extends Request {
    user?: any;
    token?: string;
    tokenExpiry?: Date;
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Try cookie first, then Authorization header (for backwards compat during transition)
        const token = req.cookies?.accessToken || 
            (req.headers.authorization?.startsWith('Bearer ') 
                ? req.headers.authorization.split(' ')[1] 
                : null);

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        // Check if token is blacklisted
        const isBlacklisted = await TokenBlacklist.findOne({ token });
        if (isBlacklisted) {
            clearAuthCookies(res);
            return res.status(401).json({ success: false, message: 'Token has been revoked' });
        }

        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch (error) {
            clearAuthCookies(res);
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // Attach user to request
        const user = await User.findById(payload.id).select('-password -otp -otpExpires -otpAttempts -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');
        if (!user || !user.isActive) {
            clearAuthCookies(res);
            return res.status(401).json({ success: false, message: 'User not found or inactive' });
        }

        // Verify token version matches (for instant revocation)
        if (payload.tv !== user.tokenVersion) {
            clearAuthCookies(res);
            return res.status(401).json({ success: false, message: 'Token revoked - please login again' });
        }

        req.user = user;
        req.token = token;
        req.tokenExpiry = getTokenExpiry(token);
        next();
    } catch (error) {
        clearAuthCookies(res);
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

export const optionalAuthMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.accessToken || 
            (req.headers.authorization?.startsWith('Bearer ') 
                ? req.headers.authorization.split(' ')[1] 
                : null);

        if (!token) {
            return next();
        }

        const isBlacklisted = await TokenBlacklist.findOne({ token });
        if (isBlacklisted) {
            return next();
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            return next();
        }

        const user = await User.findById(payload.id).select('-password -otp -otpExpires -otpAttempts -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');
        if (user && user.isActive && payload.tv === user.tokenVersion) {
            req.user = user;
            req.token = token;
            req.tokenExpiry = getTokenExpiry(token);
        }
        next();
    } catch {
        next();
    }
};

// Re-export cookie utils
import { clearAuthCookies } from '@/utils/cookie.utils';