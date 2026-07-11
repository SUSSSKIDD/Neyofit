import { Request } from 'express';
import { IUser } from '@/types/user.types.js';

// Authentication request interface
export interface IAuthRequest extends Request {
  user?: IUser; // User object attached after authentication
  token?: string; // JWT token
  // requestId?: string; // Unique request ID for logging
}

// Login request interface
export interface ILoginRequest {
  email: string;
  password: string;
}

// Login response interface
export interface ILoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      userType: string;
      name: string;
      email: string;
      phone: string;
    };
    token: string;
  };
}

// Registration response interface
export interface IRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      userType: string;
      name: string;
      email: string;
      phone: string;
    };
    token: string;
  };
}

// JWT payload interface
export interface IJwtPayload {
  id: string;
  userType: string;
  email: string;
  exp?: number;
  iat?: number;
}

// OTP types
export interface ISendOtpRequest {
  email: string;
  purpose: 'login' | 'signup';
}

export interface ISendOtpResponse {
  success: boolean;
  message: string;
  data?: {
    hasPassword: boolean;
    isNewUser: boolean;
  };
}

export interface IVerifyOtpRequest {
  email: string;
  otp: string;
  purpose: 'login' | 'signup';
  name?: string;
  phone?: string;
  password?: string;
}

export interface IVerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      userType: string;
      name: string;
      email: string;
      phone: string;
    };
    token: string;
  };
}

export interface ICheckEmailRequest {
  email: string;
}

export interface ICheckEmailResponse {
  success: boolean;
  exists: boolean;
  hasPassword: boolean;
}

// Error response interface
export interface IAuthErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}
