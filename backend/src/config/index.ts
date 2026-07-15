import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'RAZORPAY_WEBHOOK_SECRET',
    'MONGODB_URI',
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const jwtConfig = {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'neyofit-api',
    audience: 'neyofit-client',
};

export const encryptionConfig = {
    key: Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    algorithm: 'aes-256-gcm',
    ivLength: 12,
};

export const razorpayConfig = {
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET!,
};

export const corsConfig = {
    allowedOrigins: [
        'https://neyofit.in',
        'https://www.neyofit.in',
        'https://api.neyofit.in',
    ],
    allowedOriginRegex: /^https:\/\/.*\.neyofit\.in$/,
};