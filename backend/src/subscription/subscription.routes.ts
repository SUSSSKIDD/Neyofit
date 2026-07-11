import { Router } from 'express';
import { subscribe, getUserSubscriptions, cancelSubscription } from './subscription.controllers';
import { authMiddleware } from '@/auth/auth.middleware';

const router = Router();

// Subscribe to a plan (protected)
router.post('/', authMiddleware, subscribe);

// Get all subscriptions for the logged-in user (protected)
router.get('/', authMiddleware, getUserSubscriptions);

// Cancel a subscription (protected)
router.patch('/:id/cancel', authMiddleware, cancelSubscription);

export default router;
