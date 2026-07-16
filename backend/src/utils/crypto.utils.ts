import crypto from 'crypto';
import { encryptionConfig } from '@/config';

const { key, algorithm, ivLength } = encryptionConfig;

export function encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;
    
    try {
        const buf = Buffer.from(encryptedData, 'base64');
        const iv = buf.subarray(0, ivLength);
        const authTag = buf.subarray(ivLength, ivLength + 16);
        const encrypted = buf.subarray(ivLength + 16);
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString('utf8');
    } catch (error) {
        throw new Error('Decryption failed - data may be corrupted or key changed');
    }
}

export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export function generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}

export function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}