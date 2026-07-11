import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.utils';
import User from '@/user/user.model.js';
import { TokenBlacklist } from '@/auth/tokenBlacklist.model';

/**
 * Express middleware to authenticate requests using JWT.
 * Attaches the user object to req.user if valid.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ success: false, message: 'No token provided' });
		}
		const token = authHeader.split(' ')[1];

		// Check if token is blacklisted (logged out)
		const isBlacklisted = await TokenBlacklist.findOne({ token });
		if (isBlacklisted) {
			return res.status(401).json({ success: false, message: 'Token has been revoked' });
		}

		const payload = verifyToken(token);
		if (!payload) {
			return res.status(401).json({ success: false, message: 'Invalid or expired token' });
		}

        // Attach user to request
		const user = await User.findById(payload.id);
		if (!user || !user.isActive) {
			return res.status(401).json({ success: false, message: 'User not found or inactive' });
		}

		req.user = user;
		req.token = token;
		next();
	} catch (error) {
		return res.status(401).json({ success: false, message: 'Authentication failed', error: (error as Error).message });
	}
};
