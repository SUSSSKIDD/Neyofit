import { Router } from 'express';
import { getGymOwnerDashboard, getSuperAdminDashboard, approveGym, rejectGym } from './dashboard.controllers';
import { authMiddleware } from './auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/dashboard/gym-owner
 * @desc    Get gym owner dashboard data
 * @access  Private (Gym Owner)
 */
router.get('/gym-owner', authMiddleware, getGymOwnerDashboard);

/**
 * @route   GET /api/v1/dashboard/superadmin
 * @desc    Get superadmin dashboard data
 * @access  Private (SuperAdmin)
 */
router.get('/superadmin', authMiddleware, getSuperAdminDashboard);

/**
 * @route   PUT /api/v1/dashboard/gym/:gymId/approve
 * @desc    Approve a gym
 * @access  Private (SuperAdmin)
 */
router.put('/gym/:gymId/approve', authMiddleware, approveGym);

/**
 * @route   PUT /api/v1/dashboard/gym/:gymId/reject
 * @desc    Reject a gym
 * @access  Private (SuperAdmin)
 */
router.put('/gym/:gymId/reject', authMiddleware, rejectGym);

export default router;
