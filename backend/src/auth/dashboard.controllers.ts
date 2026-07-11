import { Request, Response } from 'express';
import { Gym } from '@/gym/gym.model';
import { Subscription } from '@/subscription/subscription.model';
import User from '@/user/user.model';
import logger from '@/utils/logger';
import { UserType } from '@/types/user.types';

// Get gym owner dashboard data
export const getGymOwnerDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        // Get gym owner's gyms
        const gyms = await Gym.find({ ownerId: userId })
            .populate('locationId')
            .populate('facilities')
            .sort({ createdAt: -1 });

        // Get all subscription listings for the owner's gyms
        const gymIds = gyms.map(gym => gym._id);
        const { SubscriptionListing } = await import('@/subscriptionListing/subscriptionListing.model');
        const subscriptionListings = await SubscriptionListing.find({ gymId: { $in: gymIds } });
        const subscriptionListingIds = subscriptionListings.map(sl => sl._id);

        // Get all subscriptions for those subscription listings
        const subscriptions = await Subscription.find({ subscriptionListingId: { $in: subscriptionListingIds } })
            .populate('userId', 'name email phone')
            .populate({
                path: 'subscriptionListingId',
                populate: {
                    path: 'gymId',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        // Get statistics
        const stats = {
            totalGyms: gyms.length,
            publishedGyms: gyms.filter(g => g.status === 'published').length,
            draftGyms: gyms.filter(g => g.status === 'draft').length,
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: subscriptions.filter(s => s.status === 'active').length
        };

        res.status(200).json({
            success: true,
            data: {
                gyms,
                subscriptions,
                stats
            }
        });

    } catch (error) {
        logger.error('Error fetching gym owner dashboard', error as Error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Get superadmin dashboard data
export const getSuperAdminDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user || user.userType !== UserType.SUPERADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied. SuperAdmin privileges required.'
            });
            return;
        }

        // Get all gyms with owner information
        const allGyms = await Gym.find()
            .populate('ownerId', 'name email phone')
            .populate('locationId')
            .sort({ createdAt: -1 });

        // Get all subscriptions with proper population
        const allSubscriptions = await Subscription.find()
            .populate('userId', 'name email phone')
            .populate({
                path: 'subscriptionListingId',
                populate: {
                    path: 'gymId',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        // Get all users
        const allUsers = await User.find().select('-password').sort({ createdAt: -1 });

        // Get gyms pending approval
        const pendingGyms = await Gym.find({ status: 'draft' })
            .populate('ownerId', 'name email phone')
            .populate('locationId')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const stats = {
            totalGyms: allGyms.length,
            publishedGyms: allGyms.filter(g => g.status === 'published').length,
            draftGyms: allGyms.filter(g => g.status === 'draft').length,
            archivedGyms: allGyms.filter(g => g.status === 'archived').length,
            totalUsers: allUsers.length,
            customers: allUsers.filter(u => u.userType === UserType.CUSTOMER).length,
            gymOwners: allUsers.filter(u => u.userType === UserType.GYM).length,
            totalSubscriptions: allSubscriptions.length,
            activeSubscriptions: allSubscriptions.filter(s => s.status === 'active').length
        };

        res.status(200).json({
            success: true,
            data: {
                gyms: allGyms,
                pendingGyms,
                subscriptions: allSubscriptions,
                users: allUsers,
                stats
            }
        });

    } catch (error) {
        logger.error('Error fetching superadmin dashboard', error as Error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Approve gym (superadmin only)
export const approveGym = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const { gymId } = req.params;

        if (!user || user.userType !== UserType.SUPERADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied. SuperAdmin privileges required.'
            });
            return;
        }

        const gym = await Gym.findByIdAndUpdate(
            gymId,
            { status: 'published', isActive: true },
            { new: true }
        ).populate('ownerId', 'name email');

        if (!gym) {
            res.status(404).json({
                success: false,
                message: 'Gym not found'
            });
            return;
        }

        logger.info('Gym approved', { gymId, gymName: gym.name, approvedBy: user._id });

        res.status(200).json({
            success: true,
            message: 'Gym approved successfully',
            data: gym
        });

    } catch (error) {
        logger.error('Error approving gym', error as Error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Reject gym (superadmin only)
export const rejectGym = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const { gymId } = req.params;

        if (!user || user.userType !== UserType.SUPERADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied. SuperAdmin privileges required.'
            });
            return;
        }

        const gym = await Gym.findByIdAndUpdate(
            gymId,
            { status: 'archived', isActive: false },
            { new: true }
        ).populate('ownerId', 'name email');

        if (!gym) {
            res.status(404).json({
                success: false,
                message: 'Gym not found'
            });
            return;
        }

        logger.info('Gym rejected', { gymId, gymName: gym.name, rejectedBy: user._id });

        res.status(200).json({
            success: true,
            message: 'Gym rejected successfully',
            data: gym
        });

    } catch (error) {
        logger.error('Error rejecting gym', error as Error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};
