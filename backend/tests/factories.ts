import { UserType } from '@/types/user.types';

export interface MockUser {
  _id?: string;
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  password?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  tokenVersion?: number;
  userAvatar?: string | null;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
    isVerified?: boolean;
  };
}

export interface MockGym {
  _id?: string;
  name: string;
  description?: string;
  locationId: string;
  ownerId: string;
  facilities?: string[];
  openingHours?: any;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rating?: number;
  priceRange?: 'budget' | 'mid-range' | 'premium';
  isActive?: boolean;
  status?: 'draft' | 'published' | 'archived';
  commissionRate?: number;
}

export interface MockSubscriptionListing {
  _id?: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customTypeText?: string;
  durationInDays: number;
  gymId: string;
  cost: number;
  currency: string;
  discount?: {
    amount: number;
    type: 'percentage' | 'fixed';
    validUntil: string;
  };
  isActive?: boolean;
  isRecurring?: boolean;
  features?: string[];
  startDate?: string;
  endDate?: string;
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  userType: UserType.CUSTOMER,
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  phone: '+919876543210',
  password: 'Test@123456',
  isActive: true,
  isEmailVerified: true,
  tokenVersion: 0,
  userAvatar: null,
  ...overrides,
});

export const createMockGym = (overrides: Partial<MockGym> = {}): MockGym => ({
  name: 'Test Gym',
  description: 'A test gym for E2E testing',
  locationId: 'loc_123',
  ownerId: 'owner_123',
  facilities: ['WiFi', 'AC', 'Parking'],
  openingHours: {
    monday: { isClosed: false, slots: [{ id: 's1', name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true }] },
    tuesday: { isClosed: false, slots: [{ id: 's2', name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true }] },
    wednesday: { isClosed: false, slots: [{ id: 's3', name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true }] },
    thursday: { isClosed: false, slots: [{ id: 's4', name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true }] },
    friday: { isClosed: false, slots: [{ id: 's5', name: 'Morning', startTime: '06:00', endTime: '10:00', isActive: true }] },
    saturday: { isClosed: false, slots: [{ id: 's6', name: 'Morning', startTime: '08:00', endTime: '12:00', isActive: true }] },
    sunday: { isClosed: true, slots: [] },
  },
  contact: { phone: '+919876543210', email: 'gym@test.com' },
  rating: 4.5,
  priceRange: 'mid-range',
  isActive: true,
  status: 'published',
  commissionRate: 20,
  ...overrides,
});

export const createMockSubscriptionListing = (overrides: Partial<MockSubscriptionListing> = {}): MockSubscriptionListing => ({
  name: 'Monthly Pass',
  description: 'Unlimited access for 30 days',
  type: 'monthly',
  durationInDays: 30,
  gymId: 'gym_123',
  cost: 2999,
  currency: 'INR',
  discount: { amount: 10, type: 'percentage', validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  isActive: true,
  isRecurring: false,
  features: ['Unlimited access', 'All classes', 'Locker access'],
  ...overrides,
});

export const TEST_CONSTANTS = {
  VALID_PASSWORD: 'Test@123456',
  WEAK_PASSWORD: '123456',
  INVALID_EMAIL: 'invalid-email',
  VALID_PHONE: '+919876543210',
  INVALID_PHONE: '12345',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-min-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-min-32-chars',
  ENCRYPTION_KEY: 'a'.repeat(64),
};

export const EDGE_CASES = {
  EMPTY_STRING: '',
  WHITESPACE_ONLY: '   ',
  VERY_LONG_STRING: 'a'.repeat(1000),
  SPECIAL_CHARS: '<script>alert("xss")</script>',
  SQL_INJECTION: "'; DROP TABLE users; --",
  UNICODE: '🙂🎉测试тест',
  MAX_INT: 2147483647,
  NEGATIVE_NUMBER: -1,
  ZERO: 0,
  FLOAT: 3.14,
  BOOLEAN_AS_STRING: 'true',
  NULL_AS_STRING: 'null',
  UNDEFINED_AS_STRING: 'undefined',
};