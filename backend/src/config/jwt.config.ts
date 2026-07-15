import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
}

const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

export const jwtConfig = {
    secret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};