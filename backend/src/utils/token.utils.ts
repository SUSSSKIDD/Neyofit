import jwt from 'jsonwebtoken';
import { IUser } from '@/types/user.types';
import { jwtConfig } from '@/config/jwt.config';

export interface IJwtPayload {
    id: string;
    userType: string;
    email: string;
    tv: number;
    type?: 'access' | 'refresh';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export const generateTokenPair = (user: IUser): TokenPair => {
    const tokenVersion = user.tokenVersion || 0;
    
    const accessToken = jwt.sign(
        { 
            id: user._id.toString(), 
            userType: user.userType, 
            email: user.email,
            tv: tokenVersion,
            type: 'access'
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessExpiresIn }
    );
    
    const refreshToken = jwt.sign(
        { 
            id: user._id.toString(), 
            tv: tokenVersion,
            type: 'refresh'
        },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshExpiresIn }
    );
    
    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): IJwtPayload | null => {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret) as IJwtPayload;
        if (decoded.type !== 'access') return null;
        return decoded;
    } catch {
        return null;
    }
};

export const verifyRefreshToken = (token: string): IJwtPayload | null => {
    try {
        const decoded = jwt.verify(token, jwtConfig.refreshSecret) as IJwtPayload;
        if (decoded.type !== 'refresh') return null;
        return decoded;
    } catch {
        return null;
    }
};

export const rotateRefreshToken = async (user: IUser): Promise<TokenPair> => {
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return generateTokenPair(user);
};

export const getTokenExpiry = (token: string): Date | null => {
    try {
        const decoded = jwt.decode(token) as IJwtPayload;
        if (decoded?.exp) {
            return new Date(decoded.exp * 1000);
        }
    } catch {}
    return null;
};