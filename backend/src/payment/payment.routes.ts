import { Router } from 'express';
import { createPaymentOrder, verifyPayment, getPaymentStatus, getActiveGymPasses, getUserPayments, getAllPayments, getGymOwnerPayments, getPayoutSummary } from './payment.controllers';
import { authMiddleware } from '@/auth/auth.middleware';
import { paymentRateLimit } from '@/middleware/rateLimiting';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserType } from '@/types/user.types';

const router = Router();

// Create a Razorpay order (with rate limiting)
router.post('/order', paymentRateLimit, authMiddleware, createPaymentOrder);

// Verify payment and activate subscription (with rate limiting)
router.post('/verify', paymentRateLimit, authMiddleware, verifyPayment);

// Get all payments (superadmin only)
router.get('/all', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getAllPayments);

// Get payout summary (superadmin only)
router.get('/payout-summary', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getPayoutSummary);

// Get payments for gym owner's gyms
router.get('/gym-owner', authMiddleware, authorizeRoles([UserType.GYM]), getGymOwnerPayments);

// Get payment status by order ID
router.get('/status/:orderId', authMiddleware, getPaymentStatus);

// Get user's active gym passes
router.get('/gym-passes', authMiddleware, getActiveGymPasses);

// Get user's payment history
router.get('/user-payments', authMiddleware, getUserPayments);

export const paymentRoutes = router;
