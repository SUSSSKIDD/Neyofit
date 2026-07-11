//email.providers.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ProviderType, AuthType, ProviderConfig, AuthConfig } from '@/types/email/mailer.types';

// Interface for the Email Provider document
export interface IEmailProvider extends Document {
    toProviderConfig: () => any;
    name: string;
    type: ProviderType;
    isDefault: boolean;
    isActive: boolean;
    from?: string;
    replyTo?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    domain?: string;
    auth: {
        type: AuthType;
        user?: string;
        pass?: string;
        clientId?: string;
        clientSecret?: string;
        redirectUrl?: string;
        callbackUrl?: string;
        apiKey?: string;
        refreshToken?: string;
        accessToken?: string;
        scope?: string;
        tokenType?: string;
        expiryDate?: number;
    };
    createdAt: Date;
    updatedAt: Date;
    lastVerified?: Date;
    lastUsed?: Date;
    connectionStatus?: boolean;
    failureCount: number;
    customHeaders?: Record<string, string>;
}

// Schema for authentication configuration
const AuthSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['smtp', 'oauth2', 'api', 'certificate', 'xoauth2', 'custom']
    },
    user: {
        type: String,
        unique: true
    },
    pass: String,
    clientId: String,
    clientSecret: String,
    redirectUrl: String,
    callbackUrl:String,
    apiKey: String,
    refreshToken: String,
    accessToken: String,
    scope: String,
    tokenType: String,
    expiryDate: Number
}, { _id: false });

// Main Email Provider Schema
const EmailProviderSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['smtp', 'gmail', 'outlook', 'sendgrid', 'mailgun', 'ses', 'custom']
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    from: String,
    replyTo: String,
    host: String,
    port: Number,
    secure: Boolean,
    domain: String,
    auth: {
        type: AuthSchema,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastVerified: Date,
    lastUsed: Date,
    connectionStatus: Boolean,
    failureCount: {
        type: Number,
        default: 0
    },
    customHeaders: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes for optimization
EmailProviderSchema.index({ type: 1 });
EmailProviderSchema.index({ isDefault: 1 });
EmailProviderSchema.index({ isActive: 1 });

// Methods to convert between ProviderConfig and Document
EmailProviderSchema.methods.toProviderConfig = function (): ProviderConfig {
    const providerConfig: any = {
        type: this.type,
        name: this.name,
        from: this.from,
        replyTo: this.replyTo,
        isDefault: this.isDefault
    };

    switch (this.type) {
        case 'smtp':
            return {
                ...providerConfig,
                host: this.host,
                port: this.port,
                secure: this.secure,
                auth: {
                    type: 'smtp',
                    user: this.auth.user,
                    pass: this.auth.pass
                }
            };

        case 'gmail':
            return {
                ...providerConfig,
                auth: {
                    type: 'oauth2',
                    user: this.auth.user,
                    clientId: this.auth.clientId,
                    clientSecret: this.auth.clientSecret,
                    redirectUrl: this.auth.redirectUrl,
                    callbackUrl: this.auth.callbackUrl,
                    refreshToken: this.auth.refreshToken,
                    accessToken: this.auth.accessToken
                }
            };

        case 'sendgrid':
            return {
                ...providerConfig,
                auth: {
                    type: 'api',
                    apiKey: this.auth.apiKey
                }
            };

        case 'mailgun':
            return {
                ...providerConfig,
                domain: this.domain,
                auth: {
                    type: 'api',
                    apiKey: this.auth.apiKey
                }
            };

        default:
            throw new Error(`Unsupported provider type: ${this.type}`);
    }
};

// Static methods for provider management
EmailProviderSchema.statics.findDefault = function () {
    return this.findOne({ isDefault: true, isActive: true });
};

EmailProviderSchema.statics.setDefault = async function (providerId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Remove default flag from all other providers
        await this.updateMany(
            { _id: { $ne: providerId } },
            { $set: { isDefault: false } },
            { session }
        );

        // Set new default provider
        await this.findByIdAndUpdate(
            providerId,
            { $set: { isDefault: true } },
            { session }
        );

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Pre-save middleware
EmailProviderSchema.pre('save', function (next) {
    if (this.isModified('auth')) {
        // Reset connection status and failure count when auth is modified
        this.connectionStatus = undefined;
        this.failureCount = 0;
    }
    next();
});

// Create and export the model
const EmailProvider = mongoose.model<IEmailProvider>('EmailProvider', EmailProviderSchema);
export default EmailProvider;