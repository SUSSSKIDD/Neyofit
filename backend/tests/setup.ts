import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  
  // Set required env vars for tests
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only-32';
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_xxx';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
});

afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (e) {
    // Ignore connection errors
  }
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Global test utilities
global.createTestUser = async (overrides: any = {}) => {
  const User = mongoose.model('User');
  return User.create({
    userType: 'customer',
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    phone: '+919876543210',
    password: 'Test@123456',
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 0,
    ...overrides,
  });
};

global.generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user._id.toString(), userType: user.userType, tv: user.tokenVersion || 0, type: 'access' },
    'test-jwt-secret-key-for-testing-purposes-only-32',
    { expiresIn: '15m' }
  );
};

global.generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user._id.toString(), tv: user.tokenVersion || 0, type: 'refresh' },
    'test-refresh-secret-key-for-testing-purposes-only-32',
    { expiresIn: '7d' }
  );
};