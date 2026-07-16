// Setup environment variables BEFORE any module imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/neyofit-test';
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only-32';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RAZORPAY_KEY_ID = 'rzp_test_xxx';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';