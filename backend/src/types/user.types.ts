import { Document } from 'mongoose';

// User types enum
export enum UserType {
    CUSTOMER = 'customer',
    GYM = 'gym',
    EMPLOYEE = 'employee',
    SUPERADMIN = 'superadmin'
}

// Base user interface
export interface IUser extends Document {
  _id: string;
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  lastLogin?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  password?: string;
  tokenVersion: number;
  otp?: string;
  otpExpires?: Date;
  otpAttempts?: number;
  userAvatar?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
    isVerified: boolean;
  };
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getDecryptedBankDetails(): any;
}

// User registration request interface
export interface IUserRegistrationRequest {
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  password: string;
  userAvatar?: string;
  isActive?: boolean;
}

// User update request interface
export interface IUserUpdateRequest {
  name?: string;
  phone?: string;
  userAvatar?: string;
  isActive?: boolean;
}

// User response interface (without sensitive data)
export interface IUserResponse {
  id: string;
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  lastLogin?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User query parameters interface
export interface IUserQueryParams {
  page?: string;
  limit?: string;
  userType?: UserType;
  search?: string;
  isActive?: string;
}

// User pagination response interface
export interface IUserPaginationResponse {
    success: boolean;
    data: IUserResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// User registration response interface
export interface IUserRegistrationResponse {
    success: boolean;
    message: string;
    data: IUserResponse;
}

// User update response interface
export interface IUserUpdateResponse {
    success: boolean;
    message: string;
    data: IUserResponse;
}

// User delete response interface
export interface IUserDeleteResponse {
    success: boolean;
    message: string;
}

// User error response interface
export interface IUserErrorResponse {
    success: boolean;
    message: string;
    error?: string;
}

// User validation error interface
export interface IUserValidationError {
    field: string;
    message: string;
    value?: string | number | boolean;
}

// User search filter interface
export interface IUserSearchFilter {
  userType?: UserType;
  isActive?: boolean;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    email?: { $regex: string; $options: string };
  }>;
}
