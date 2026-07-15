import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserType } from '@/types/user.types.js';
import { encrypt, decrypt, EncryptedData } from '@/utils/encryption.utils.js';

const encryptedFields = ['accountNumber', 'ifscCode', 'upiId'] as const;
type EncryptedField = typeof encryptedFields[number];

// User schema
export const userSchema = new Schema<IUser>({
    userType: {
        type: String,
        enum: Object.values(UserType),
        required: true,
        index: true
    },
    name: {
        type: String,
        required: false,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: false,
        minlength: 12
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    otp: {
        type: String,
        default: undefined
    },
    otpExpires: {
        type: Date,
        default: undefined
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    userAvatar: {
        type: String,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: undefined
    },
    passwordResetExpires: {
        type: Date,
        default: undefined
    },
    emailVerificationToken: {
        type: String,
        default: undefined
    },
    emailVerificationExpires: {
        type: Date,
        default: undefined
    },
    bankDetails: {
        accountHolderName: { type: String },
        accountNumber: { type: Schema.Types.Mixed },
        ifscCode: { type: Schema.Types.Mixed },
        bankName: { type: String },
        upiId: { type: Schema.Types.Mixed },
        isVerified: { type: Boolean, default: false }
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes for better query performance
userSchema.index({ email: 1, userType: 1 });
userSchema.index({ phone: 1, userType: 1 });
userSchema.index({ userType: 1, createdAt: -1 });
userSchema.index({ tokenVersion: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Encrypt bank details before saving
userSchema.pre('save', function (next) {
    if (this.isModified('bankDetails') && this.bankDetails) {
        for (const field of encryptedFields) {
            if (this.bankDetails[field] && typeof this.bankDetails[field] === 'string') {
                const encrypted = encrypt(this.bankDetails[field]);
                this.bankDetails[field] = encrypted;
            }
        }
    }
    next();
});

// Encrypt bank details before updating
userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate() as any;
    
    if (update.password) {
        try {
            const salt = await bcrypt.genSalt(12);
            update.password = await bcrypt.hash(update.password, salt);
        } catch (error) {
            next(error as Error);
        }
    }
    
    if (update.bankDetails) {
        for (const field of encryptedFields) {
            if (update.bankDetails[field] && typeof update.bankDetails[field] === 'string') {
                update.bankDetails[field] = encrypt(update.bankDetails[field]);
            }
        }
    }
    
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Method to get decrypted bank details
userSchema.methods.getDecryptedBankDetails = function (): any {
    const bankDetails = this.bankDetails ? { ...this.bankDetails } : {};
    if (bankDetails) {
        for (const field of encryptedFields) {
            if (bankDetails[field] && typeof bankDetails[field] === 'object' && bankDetails[field].encrypted) {
                bankDetails[field] = decrypt(bankDetails[field]);
            }
        }
    }
    return bankDetails;
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    delete user.otpExpires;
    delete user.otpAttempts;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    // Bank details are already encrypted in DB, but ensure not exposed
    if (user.bankDetails) {
        for (const field of encryptedFields) {
            if (user.bankDetails[field] && typeof user.bankDetails[field] === 'object' && user.bankDetails[field].encrypted) {
                delete user.bankDetails[field].encrypted;
                delete user.bankDetails[field].iv;
                delete user.bankDetails[field].authTag;
            }
        }
    }
    return user;
};

export default mongoose.model<IUser>('User', userSchema);