import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenBlacklist extends Document {
    token: string;
    expiresAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: auto-deletes when expiresAt is reached
    }
});

export const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', tokenBlacklistSchema);
