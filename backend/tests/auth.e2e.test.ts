import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserModel from '@/user/user.model.js';
import { User, UserType } from '@/types/user.types.js';
import { hashToken } from '@/utils/crypto.utils.js';
import { authMiddleware } from '@/auth/auth.middleware.js';
import { securityHeaders } from '@/middleware/security.js';
import { generalRateLimit, loginRateLimit, otpSendRateLimit, otpVerifyRateLimit } from '@/middleware/rateLimiting.js';
import { registerUser, loginUser, logoutUser, refreshAccessToken, verifyTokenEndpoint, sendOtp, verifyOtp, checkEmail, sendVerificationEmail, verifyEmail, resetPassword, forgotPassword } from '@/auth/auth.controllers.js';

// Setup environment variables BEFORE any module imports
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only-32';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RAZORPAY_KEY_ID = 'rzp_test_xxx';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

const TEST_CONSTANTS = {
  VALID_PASSWORD: 'Test@12345678',
  WEAK_PASSWORD: '123456',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only-32',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-purposes-only-32',
};

let mongod: MongoMemoryServer;
let authApp: express.Express;
let securityApp: express.Express;
let edgeApp: express.Express;
let customer: any;
let gymOwner: any;
let superAdmin: any;
let customerToken: string;
let gymOwnerToken: string;
let superAdminToken: string;

// Helper to create test app with common middleware
function createTestApp(routes: { path: string; handler: any; middleware?: any[] }[] = []) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = ['https://neyofit.in', 'https://www.neyofit.in', 'https://api.neyofit.in'];
      if (allowed.includes(origin) || /^https:\/\/.*\.neyofit\.in$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 600
  }));
  app.use(securityHeaders);
  app.use(generalRateLimit);
  
  // Default health check
  app.get('/api/v1/health', (req, res) => res.json({ status: 'OK' }));
  
  // Apply custom routes
  routes.forEach(({ path, handler, middleware = [] }) => {
    app.post(path, ...middleware, handler);
  });
  
  return app;
}

function generateAccessToken(user: any) {
  return jwt.sign(
    { id: user._id.toString(), userType: user.userType, tv: user.tokenVersion || 0, type: 'access' },
    'test-jwt-secret-key-for-testing-purposes-only-32',
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user: any) {
  return jwt.sign(
    { id: user._id.toString(), tv: user.tokenVersion || 0, type: 'refresh' },
    'test-refresh-secret-key-for-testing-purposes-only-32',
    { expiresIn: '7d' }
  );
}

// Global setup - single MongoDB instance for all tests
beforeAll(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only-32';
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_xxx';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
});

afterAll(async () => {
  await mongoose.disconnect();
});


// Single setup for all test suites
beforeAll(async () => {
  // Create test apps with shared middleware
  // Create test apps with shared middleware
  authApp = createTestApp([
    { path: '/api/v1/auth/register-user', handler: registerUser },
    { path: '/api/v1/auth/login-user', handler: loginUser, middleware: [loginRateLimit] },
    { path: '/api/v1/auth/logout', handler: logoutUser },
    { path: '/api/v1/auth/refresh-token', handler: refreshAccessToken },
    { path: '/api/v1/auth/verify-token', handler: verifyTokenEndpoint, middleware: [authMiddleware] },
    { path: '/api/v1/auth/send-otp', handler: sendOtp, middleware: [otpSendRateLimit] },
    { path: '/api/v1/auth/verify-otp', handler: verifyOtp, middleware: [otpVerifyRateLimit] },
    { path: '/api/v1/auth/forgot-password', handler: forgotPassword },
    { path: '/api/v1/auth/reset-password', handler: resetPassword },
    { path: '/api/v1/auth/check-email', handler: checkEmail },
    { path: '/api/v1/auth/send-verification-email', handler: sendVerificationEmail, middleware: [authMiddleware] },
    { path: '/api/v1/auth/verify-email/:token', handler: verifyEmail },
  ]);

  securityApp = createTestApp([
    { path: '/api/v1/auth/login-user', handler: loginUser, middleware: [loginRateLimit] },
    { path: '/api/v1/auth/register-user', handler: registerUser },
    { path: '/api/v1/auth/send-otp', handler: sendOtp, middleware: [otpSendRateLimit] },
    { path: '/api/v1/auth/verify-otp', handler: verifyOtp, middleware: [otpVerifyRateLimit] },
    { path: '/api/v1/auth/forgot-password', handler: forgotPassword },
    { path: '/api/v1/auth/reset-password', handler: resetPassword },
    { path: '/api/v1/auth/check-email', handler: checkEmail },
    { path: '/api/v1/health', handler: (req: any, res: any) => res.json({ status: 'OK' }) },
  ]);

  edgeApp = createTestApp([
    { path: '/api/v1/auth/register-user', handler: registerUser },
    { path: '/api/v1/auth/login-user', handler: loginUser },
    { path: '/api/v1/auth/verify-otp', handler: verifyOtp },
  ]);
});


// ============================================
// Authentication E2E Tests
// ============================================
describe('Authentication E2E Tests', () => {
  let customer: any;
  let gymOwner: any;
  let superAdmin: any;
  let customerToken: string;
  let gymOwnerToken: string;
  let superAdminToken: string;

  beforeEach(async () => {
    await UserModel.deleteMany({});
    
    customer = await UserModel.create({
      userType: UserType.CUSTOMER,
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+919876543210',
      password: 'Test@12345678',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    
    gymOwner = await UserModel.create({
      userType: UserType.GYM,
      name: 'Test Gym Owner',
      email: 'gymowner@test.com',
      phone: '+919876543211',
      password: 'Test@12345678',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    
    superAdmin = await UserModel.create({
      userType: UserType.SUPERADMIN,
      name: 'Test Super Admin',
      email: 'superadmin@test.com',
      phone: '+919876543212',
      password: 'Test@12345678',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });

    customerToken = generateAccessToken(customer);
    gymOwnerToken = generateAccessToken(gymOwner);
    superAdminToken = generateAccessToken(superAdmin);
  });

  describe('POST /auth/register-user', () => {
    const testCases = [
      { name: 'Valid customer registration', data: { userType: UserType.CUSTOMER, name: 'New User', email: 'new@test.com', phone: '+919876543213', password: 'Test@12345678' }, expectedStatus: 201, shouldPass: true },
      { name: 'Valid gym registration', data: { userType: UserType.GYM, name: 'Gym User', email: 'gym@test.com', phone: '+919876543214', password: 'Test@12345678' }, expectedStatus: 201, shouldPass: true },
      { name: 'Missing email', data: { name: 'User', phone: '+919876543215', password: 'Test@12345678' }, expectedStatus: 400, shouldPass: false },
      { name: 'Password without name', data: { email: 'test@test.com', password: 'Test@12345678' }, expectedStatus: 400, shouldPass: false },
      { name: 'Invalid userType', data: { userType: 'invalid', email: 'test@test.com', name: 'Test', password: 'Test@12345678' }, expectedStatus: 400, shouldPass: false },
      { name: 'Duplicate email', data: { userType: UserType.CUSTOMER, name: 'Test', email: 'customer@test.com', password: 'Test@12345678' }, expectedStatus: 409, shouldPass: false },
      { name: 'Duplicate phone', data: { userType: UserType.CUSTOMER, name: 'Test', email: 'new@test.com', phone: '+919876543210', password: 'Test@12345678' }, expectedStatus: 409, shouldPass: false },
      { name: 'Weak password (6 chars)', data: { userType: UserType.CUSTOMER, name: 'Test', email: 'weak@test.com', password: '123456' }, expectedStatus: 400, shouldPass: false },
    ];

    test.each(testCases)('$name', async ({ data, expectedStatus, shouldPass }) => {
      const res = await request(authApp)
        .post('/api/v1/auth/register-user')
        .send(data);
      
      expect(res.status).toBe(expectedStatus);
      if (shouldPass) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
      } else {
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('POST /auth/login-user', () => {
    test('Valid login', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Test@12345678' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
    });

    test('Wrong password', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Wrong@123' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Non-existent email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'none@test.com', password: 'Test@12345678' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Missing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ password: 'Test@12345678' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Missing password', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout and clear cookies', async () => {
      const loginRes = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Test@12345678' });
      
      const accessToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('accessToken='));
      const refreshToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('refreshToken='));
      
      const res = await request(authApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [accessToken, refreshToken]);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should increment tokenVersion on logout', async () => {
      const loginRes = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Test@12345678' });
      
      const accessToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('accessToken='));
      const refreshToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('refreshToken='));
      
      const oldTokenVersion = customer.tokenVersion;
      
      await request(authApp)
        .post('/api/v1/auth/logout')
        .set('Cookie', [accessToken, refreshToken]);
      
      const updatedUser = await UserModel.findById(customer._id);
      expect(updatedUser!.tokenVersion).toBe(oldTokenVersion + 1);
    });
  });

  describe('POST /auth/refresh-token', () => {
    test('should issue new access token with valid refresh token', async () => {
      const loginRes = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Test@12345678' });
      
      const refreshToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('refreshToken='));
      
      const res = await request(authApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', refreshToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should reject expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { id: customer._id.toString(), tv: customer.tokenVersion, type: 'refresh' },
        'test-refresh-secret-key-for-testing-purposes-only-32',
        { expiresIn: '-1h' }
      );
      
      const res = await request(authApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', `refreshToken=${expiredToken}`);
      
      expect(res.status).toBe(401);
    });

    test('should reject refresh token with wrong tokenVersion', async () => {
      const oldVersionToken = jwt.sign(
        { id: customer._id.toString(), tv: customer.tokenVersion - 1, type: 'refresh' },
        'test-refresh-secret-key-for-testing-purposes-only-32',
        { expiresIn: '7d' }
      );
      
      const res = await request(authApp)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', `refreshToken=${oldVersionToken}`);
      
      expect(res.status).toBe(401);
    });

    test('should reject missing refresh token', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/refresh-token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/verify-token', () => {
    test('should return user data with valid token', async () => {
      const loginRes = await request(authApp)
        .post('/api/v1/auth/login-user')
        .send({ email: 'customer@test.com', password: 'Test@12345678' });
      
      const accessToken = loginRes.headers['set-cookie'].find((c: string) => c.startsWith('accessToken='));
      
      const res = await request(authApp)
        .get('/api/v1/auth/verify-token')
        .set('Cookie', accessToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('customer@test.com');
    });

    test('should return 401 without token', async () => {
      const res = await request(authApp)
        .get('/api/v1/auth/verify-token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/send-otp', () => {
    test('Valid OTP send for login', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'customer@test.com', purpose: 'login' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasPassword).toBe(true);
    });

    test('Valid OTP send for signup', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'newsignup@test.com', purpose: 'signup' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Missing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ purpose: 'login' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Missing purpose', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'test@test.com' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Invalid purpose', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'test@test.com', purpose: 'invalid' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Rate limit exceeded', async () => {
      const user = await UserModel.create({
        userType: UserType.CUSTOMER,
        email: 'otprate@test.com',
        isActive: true,
        isEmailVerified: false,
      });
      user.otpAttempts = 5;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      
      const res = await request(authApp)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'otprate@test.com', purpose: 'login' });
      
      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/check-email', () => {
    test('should return uniform response for existing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/check-email')
        .send({ email: 'customer@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account exists');
    });

    test('should return uniform response for non-existent email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/check-email')
        .send({ email: 'none@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 for missing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/check-email')
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should return uniform response for existing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'customer@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account with that email exists');
    });

    test('should return uniform response for non-existent email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'none@test.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 for missing email', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/forgot-password')
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetUser: any;
    let validToken: string;

    beforeEach(async () => {
      resetUser = await UserModel.create({
        userType: UserType.CUSTOMER,
        email: 'reset@test.com',
        name: 'Reset User',
        phone: '+919876543219',
        password: 'Test@12345678',
        isActive: true,
        isEmailVerified: true,
        tokenVersion: 0,
      });
      
      validToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(validToken).digest('hex');
      
      resetUser.passwordResetToken = hashedToken;
      resetUser.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await resetUser.save();
    });

    test('Valid password reset', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, password: 'NewPass@123456' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Invalid token', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid', password: 'NewPass@123456' });
      
      expect(res.status).toBe(400);
    });

    test('Expired token', async () => {
      resetUser.passwordResetExpires = new Date(Date.now() - 1000);
      await resetUser.save();
      
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, password: 'NewPass@123456' });
      
      expect(res.status).toBe(400);
    });

    test('Weak new password (6 chars)', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, password: '123456' });
      
      expect(res.status).toBe(400);
    });

    test('Missing token', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ password: 'NewPass@123456' });
      
      expect(res.status).toBe(400);
    });

    test('Missing password', async () => {
      const res = await request(authApp)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /auth/verify-email/:token', () => {
    test('should verify email with valid token', async () => {
      const user = await UserModel.create({
        userType: UserType.CUSTOMER,
        email: 'verify@test.com',
        name: 'Verify User',
        phone: '+919876543218',
        isActive: true,
        isEmailVerified: false,
      });
      
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      
      const res = await request(authApp)
        .get(`/api/v1/auth/verify-email/${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid token', async () => {
      const res = await request(authApp)
        .get('/api/v1/auth/verify-email/invalid');
      
      expect(res.status).toBe(400);
    });

    test('should reject expired token', async () => {
      const user = await UserModel.create({
        userType: UserType.CUSTOMER,
        email: 'expiredverify@test.com',
        isEmailVerified: false,
      });
      
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(Date.now() - 1000);
      await user.save();
      
      const res = await request(authApp)
        .get(`/api/v1/auth/verify-email/${token}`);
      
      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// Security & Rate Limiting Tests
// ============================================
describe('Security & Rate Limiting Tests', () => {
  let customer: any;
  let customerToken: string;

  beforeEach(async () => {
    customer = await UserModel.create({
      userType: UserType.CUSTOMER,
      name: 'Rate Limit Test',
      email: 'ratelimit@test.com',
      phone: '+919876543210',
      password: 'Test@12345678',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    customerToken = generateAccessToken(customer);
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(securityApp)
          .post('/api/v1/auth/login-user')
          .send({ email: customer.email, password: 'wrong' });
      }

      const res = await request(securityApp)
        .post('/api/v1/auth/login-user')
        .send({ email: customer.email, password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Too many');
    });

    test('should apply rate limiting middleware', async () => {
      const res = await request(securityApp)
        .get('/api/v1/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Input Validation', () => {
    test('should reject SQL injection attempts', async () => {
      const res = await request(securityApp)
        .post('/api/v1/auth/login-user')
        .send({ email: "admin' OR '1'='1", password: 'test' });

      expect([401, 429]).toContain(res.status);
    });

    test('should reject XSS payloads in registration', async () => {
      const res = await request(securityApp)
        .post('/api/v1/auth/register-user')
        .send({
          email: 'xss@test.com',
          name: '<script>alert(1)</script>',
          password: 'Test@12345678',
          userType: UserType.CUSTOMER,
        });

      expect(res.status).toBe(400);
    });

    test('should reject oversized payloads', async () => {
      const largeString = 'x'.repeat(20000);
      const res = await request(securityApp)
        .post('/api/v1/auth/register-user')
        .send({
          email: 'large@test.com',
          name: largeString,
          password: 'Test@12345678',
          userType: UserType.CUSTOMER,
        });

      expect([400, 413]).toContain(res.status);
    });
  });

  describe('CORS', () => {
    test('should allow configured origins', async () => {
      const res = await request(securityApp)
        .get('/api/v1/health')
        .set('Origin', 'https://neyofit.in');

      expect(res.headers['access-control-allow-origin']).toBe('https://neyofit.in');
    });

    test('should reject unauthorized origins', async () => {
      const res = await request(securityApp)
        .get('/api/v1/health')
        .set('Origin', 'https://evil.com');

      expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    });
  });

  describe('Security Headers', () => {
    test('should include CSP header', async () => {
      const res = await request(securityApp).get('/api/v1/health');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    test('should include HSTS in production', async () => {
      process.env.NODE_ENV = 'production';
      const res = await request(securityApp).get('/api/v1/health');
      expect(res.headers['strict-transport-security']).toBeDefined();
      process.env.NODE_ENV = 'test';
    });

    test('should include X-Frame-Options', async () => {
      const res = await request(securityApp).get('/api/v1/health');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    test('should include X-Content-Type-Options', async () => {
      const res = await request(securityApp).get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should remove X-Powered-By', async () => {
      const res = await request(securityApp).get('/api/v1/health');
      const header = res.headers['x-powered-by'];
      if (header) {
        expect(header).not.toBe('Express');
      } else {
        expect(header).toBeUndefined();
      }
    });
  });
});

// ============================================
// Edge Cases & Error Handling Tests
// ============================================
describe('Edge Cases & Error Handling', () => {
  let customer: any;
  let customerToken: string;

  beforeEach(async () => {
    customer = await UserModel.create({
      userType: UserType.CUSTOMER,
      name: 'Edge Case User',
      email: 'edge@test.com',
      phone: '+919876543210',
      password: 'Test@12345678',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    customerToken = generateAccessToken(customer);
  });

  describe('Token Edge Cases', () => {
    test('should reject expired access token', async () => {
      const expiredToken = jwt.sign(
        { id: customer._id.toString(), userType: customer.userType, tv: customer.tokenVersion, type: 'access' },
        'test-jwt-secret-key-for-testing-purposes-only-32',
        { expiresIn: '-1h' }
      );

      const res = await request(edgeApp)
        .get('/api/v1/auth/verify-token')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    test('should reject token with wrong signature', async () => {
      const tamperedToken = jwt.sign(
        { id: customer._id.toString(), userType: customer.userType, tv: customer.tokenVersion, type: 'access' },
        'wrong-secret',
        { expiresIn: '15m' }
      );

      const res = await request(edgeApp)
        .get('/api/v1/auth/verify-token')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
    });

    test('should reject token for inactive user', async () => {
      customer.isActive = false;
      await customer.save();

      const res = await request(edgeApp)
        .get('/api/v1/auth/verify-token')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(401);
    });

    test('should reject token after password reset (tokenVersion increment)', async () => {
      customer.tokenVersion += 1;
      await customer.save();

      const res = await request(edgeApp)
        .get('/api/v1/auth/verify-token')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('revoked');
    });
  });

  describe('Concurrency', () => {
    test('should handle concurrent login attempts', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(edgeApp).post('/api/v1/auth/login-user').send({ email: customer.email, password: 'Test@12345678' })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle concurrent OTP verification', async () => {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      
      customer.otp = hashedOtp;
      customer.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      customer.otpAttempts = 0;
      await customer.save();

      const promises = Array(3).fill(null).map(() =>
        request(edgeApp).post('/api/v1/auth/verify-otp').send({ email: customer.email, otp, purpose: 'login' })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Errors', () => {
    test('should handle duplicate key errors gracefully', async () => {
      await UserModel.create({
        userType: UserType.CUSTOMER,
        email: 'dup@test.com',
        name: 'Test',
        phone: '+919876543210',
        password: 'Test@12345678',
        userType: UserType.CUSTOMER,
      });
      
      const res = await request(edgeApp)
        .post('/api/v1/auth/register-user')
        .send({ email: 'dup@test.com', name: 'Test', password: 'Test@12345678', userType: UserType.CUSTOMER });
  
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Health Check', () => {
    test('should return health status without auth', async () => {
      const res = await request(edgeApp).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });
});