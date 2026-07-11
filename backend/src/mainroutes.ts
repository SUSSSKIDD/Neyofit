import { Router } from 'express';
import logger from '@/utils/logger.js';
import userRoutes from '@/user/user.routes.js';
import authRoutes from '@/auth/auth.routes.js';
import dashboardRoutes from '@/auth/dashboard.routes.js';
import { gymRouter } from '@/gym/gym.routes';
import { locationRouter } from '@/location/location.routes';
import { subscriptionListingRouter } from '@/subscriptionListing/subscriptionListing.routes';
import { gymFacilityRouter } from '@/gym/gym-facility.routes';
import { gymPictureRouter } from './gymPictures/gymPicture.routes';
import gymReviewRouter from './gymReview/gymReview.routes';
import { paymentRoutes } from './payment/payment.routes';
import subscriptionRoutes from './subscription/subscription.routes';
import gymSlotRoutes from './gymSlots/gymSlot.routes';
import emailRoutes from '@/config/email/email.routes';
import { payoutRoutes } from './payout/payout.routes';
import { platformSettingsRoutes } from './platformSettings/platformSettings.routes';
import gymMemberRoutes from './gymMember/gymMember.routes';
import visitRoutes from './visit/visit.routes';
import offlinePaymentRoutes from './offlinePayment/offlinePayment.routes';
import favoriteRoutes from './favorite/favorite.routes';

const router = Router();



// API info route
router.get('/', (req, res) => {
    logger.info('API info requested', { requestId: req.requestId });
    res.json({
        name: 'Neyofit Backend API',
        version: '1.0.0',
        description: 'Fitness and wellness backend API',
        endpoints: {
            health: '/health',
            users: '/users',
            api: '/'
        },
        timestamp: new Date().toISOString()
    });
});

// Root route
router.get('/health', (req, res) => {
    logger.info('Health check requested', { requestId: req.requestId });
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/gyms', gymRouter);
router.use('/locations', locationRouter);
router.use('/subscription-listings', subscriptionListingRouter);
router.use('/gym-facilities', gymFacilityRouter);
router.use('/gym-pictures', gymPictureRouter);
router.use('/gym-reviews', gymReviewRouter);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/gym-slots', gymSlotRoutes);
router.use('/email', emailRoutes);
router.use('/payouts', payoutRoutes);
router.use('/platform-settings', platformSettingsRoutes);

// CRM routes
router.use('/gym-members', gymMemberRoutes);
router.use('/visits', visitRoutes);
router.use('/offline-payments', offlinePaymentRoutes);

// Customer routes
router.use('/favorites', favoriteRoutes);

export default router;
