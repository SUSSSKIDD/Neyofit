import jwt from 'jsonwebtoken';
import { IUser } from '@/types/user.types.js';
import { IJwtPayload } from '@/types/auth.types.js';
import logger from '@/utils/logger.js';
import { jwtConfig } from '@/config/jwt.config';
const { secret, expiresIn } = jwtConfig;
import { StringValue } from 'ms';
// Generate JWT token
export const generateToken = (user: IUser): string => {
    const payload: IJwtPayload = {
        id: user._id.toString(),
        userType: user.userType,
        email: user.email
    };

    try {
        const token = jwt.sign(payload, secret, {expiresIn: expiresIn as StringValue});
        logger.info('JWT token generated successfully', { userId: user._id });
        return token;
    } catch (error) {
        logger.error('Error generating JWT token', error as Error, { userId: user._id });
        throw new Error('Failed to generate JWT token');
    }
};

// Verify JWT token
export const verifyToken = (token: string): IJwtPayload | null => {
    try {
        const decoded = jwt.verify(token, secret) as IJwtPayload;
        logger.info('JWT token verified successfully', { userId: decoded.id });
        return decoded;
    } catch (error) {
        logger.error('JWT token verification failed', error as Error);
        return null;
    }
};
