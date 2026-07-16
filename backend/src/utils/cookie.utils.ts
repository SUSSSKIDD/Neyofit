import { Response } from 'express';
import { TokenPair } from '@/utils/token.utils';

const isProd = process.env.NODE_ENV === 'production';

export const setAuthCookies = (res: Response, tokens: TokenPair) => {
    res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
    });
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
};

export const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken', { path: '/', httpOnly: true, secure: isProd, sameSite: 'strict' });
    res.clearCookie('refreshToken', { path: '/', httpOnly: true, secure: isProd, sameSite: 'strict' });
};

export const getAccessTokenFromRequest = (req: any): string | null => {
    // Check Authorization header first (for API clients)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    // Check cookies (for browsers)
    return req.cookies?.accessToken || null;
};

export const getRefreshTokenFromRequest = (req: any): string | null => {
    return req.cookies?.refreshToken || null;
};