import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserType } from '@/types/user.types.js';

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
        minlength: 6
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
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        upiId: { type: String },
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

// Hash password before updating
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

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    delete user.otpExpires;
    delete user.otpAttempts;
    return user;
};

export default mongoose.model<IUser>('User', userSchema);
