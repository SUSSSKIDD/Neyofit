import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const encryptionKey = process.env.ENCRYPTION_KEY;
if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required (32 bytes hex)');
}

const KEY = Buffer.from(encryptionKey, 'hex');
if (KEY.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex characters)`);
}

export interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
}

export const encrypt = (plaintext: string): EncryptedData => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
};

export const decrypt = (encryptedData: EncryptedData): string => {
    const { encrypted, iv, authTag } = encryptedData;
    
    const decipher = crypto.createDecipheriv(
        ALGORITHM, 
        KEY, 
        Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
    ]);
    
    return decrypted.toString('utf8');
};

export const encryptFields = (obj: Record<string, any>, fields: string[]): Record<string, any> => {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = encrypt(result[field]);
        }
    }
    return result;
};

export const decryptFields = (obj: Record<string, any>, fields: string[]): Record<string, any> => {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'object' && result[field].encrypted) {
            result[field] = decrypt(result[field]);
        }
    }
    return result;
};