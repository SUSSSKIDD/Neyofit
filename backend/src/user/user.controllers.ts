import { Request, Response } from 'express';
import User from '@/user/user.model.js';
import {
    IUserUpdateRequest,
    IUserQueryParams,
    IUserSearchFilter
} from '@/types/user.types.js';
import logger from '@/utils/logger.js';
import { sendEmailSafe } from '@/utils/sendEmailSafe';

// Get all users (with pagination and filtering)
export const getAllUsers = async (req: Request<{}, {}, {}, IUserQueryParams>, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, userType, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Build filter
        const filter: IUserSearchFilter = {};
        if (userType) filter.userType = userType;
        if (req.query.isActive !== undefined) {
            const isActiveParam = req.query.isActive as string;
            filter.isActive = isActiveParam === 'true';
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query
        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(filter)
        ]);

        logger.info('Users retrieved successfully', {
            count: users.length,
            total,
            page: Number(page),
            requestId: req.requestId
        });

        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        logger.error('Failed to retrieve users', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Get user by ID
export const getUserById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        logger.info('User retrieved successfully', {
            userId: id,
            requestId: req.requestId
        });

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        logger.error('Failed to retrieve user', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Update user
export const updateUser = async (req: Request<{ id: string }, {}, IUserUpdateRequest>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Users can only update their own profile unless they are SUPERADMIN
        if (req.user?.userType !== 'superadmin' && req.user?._id?.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only update your own profile'
            });
            return;
        }

        const updateData = { ...req.body };

        // Remove fields that shouldn't be updated
        delete (updateData as any).password;
        delete (updateData as any).email; // Email should be updated separately for verification
        delete (updateData as any).userType; // User type shouldn't change after creation
        // Non-admins cannot change sensitive fields
        if (req.user?.userType !== 'superadmin') {
            delete (updateData as any).isActive;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        logger.info('User updated successfully', {
            userId: id,
            requestId: req.requestId
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        logger.error('Failed to update user', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Delete user
export const deleteUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        logger.info('User deleted successfully', {
            userId: id,
            requestId: req.requestId
        });

        // Notify user of account deletion (fire-and-forget)
        sendEmailSafe({
            templateType: 'account-deleted',
            to: user.email,
            subject: 'Neyofit - Your Account Has Been Deleted',
            data: { userName: user.name }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        logger.error('Failed to delete user', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// Toggle user active status
export const toggleUserActiveStatus = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Toggle the active status
        user.isActive = !user.isActive;
        await user.save();

        logger.info('User active status toggled', {
            userId: id,
            newStatus: user.isActive,
            requestId: req.requestId
        });

        // Notify user of account status change (fire-and-forget)
        if (user.isActive) {
            sendEmailSafe({
                templateType: 'account-reactivated',
                to: user.email,
                subject: 'Neyofit - Your Account Has Been Reactivated',
                data: {
                    userName: user.name,
                    loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
                }
            });
        } else {
            sendEmailSafe({
                templateType: 'account-suspended',
                to: user.email,
                subject: 'Neyofit - Your Account Has Been Suspended',
                data: {
                    userName: user.name,
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@Neyofit.com'
                }
            });
        }

        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully 🎉👌🏻`,
            data: {
                id: user._id,
                isActive: user.isActive
            }
        });

    } catch (error) {
        logger.error('Failed to toggle user active status', error as Error, { requestId: req.requestId });

        res.status(500).json({
            success: false,
            message: 'Failed to toggle user active status',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        });
    }
};

// PUT /users/bank-details — update own bank details (gym owner)
export const updateBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                bankDetails: {
                    accountHolderName,
                    accountNumber,
                    ifscCode,
                    bankName,
                    upiId,
                    isVerified: false,
                },
            },
            { new: true }
        ).select('bankDetails name email');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Notify user of bank details update (fire-and-forget)
        const maskedAccountNumber = accountNumber
            ? '****' + String(accountNumber).slice(-4)
            : '****';
        sendEmailSafe({
            templateType: 'bank-details-updated',
            to: user.email,
            subject: 'Neyofit - Bank Details Updated',
            data: {
                userName: user.name,
                bankName: bankName || 'Your Bank',
                maskedAccountNumber
            }
        });

        res.json({ success: true, data: user.bankDetails });
    } catch (error) {
        logger.error('Failed to update bank details', error as Error);
        res.status(500).json({ success: false, message: 'Failed to update bank details' });
    }
};

// GET /users/bank-details — get own bank details (gym owner)
export const getBankDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const user = await User.findById(userId).select('bankDetails');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, data: user.bankDetails || {} });
    } catch (error) {
        logger.error('Failed to get bank details', error as Error);
        res.status(500).json({ success: false, message: 'Failed to get bank details' });
    }
};

// GET /users/bank-details/:userId — get bank details for a user (superadmin)
export const getBankDetailsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.userId).select('bankDetails name email');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, data: { bankDetails: user.bankDetails || {}, name: user.name, email: user.email } });
    } catch (error) {
        logger.error('Failed to get bank details', error as Error);
        res.status(500).json({ success: false, message: 'Failed to get bank details' });
    }
};
