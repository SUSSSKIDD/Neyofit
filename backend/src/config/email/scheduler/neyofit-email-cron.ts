import cron from 'node-cron';
import User from '@/user/user.model';
import { EmailTemplateService } from '../templates/emailTemplates.config';
import logger from '@/utils/logger';
import { IUser } from '@/types/user.types';
import { ISubscriptionListing } from '@/types/subscriptionListing.types';
import { Types } from 'mongoose';

interface PopulatedGym {
    _id: Types.ObjectId;
    name: string;
}

interface PopulatedSubscriptionListing extends Omit<ISubscriptionListing, 'gymId'> {
    gymId: PopulatedGym | null;
}

interface PopulatedSubscription {
    userId: IUser | null;
    subscriptionListingId: PopulatedSubscriptionListing | null;
    endDate: Date;
    status: string;
}

// Check for new users who need welcome emails (runs hourly)
const sendWelcomeEmails = async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Find users created in the last hour who haven't received a welcome email
        const newUsers = await User.find({
            createdAt: { $gte: oneHourAgo },
            isActive: true
        }).limit(50);

        for (const user of newUsers) {
            try {
                await EmailTemplateService.sendTemplatedEmail({
                    templateType: 'welcome-email',
                    to: user.email,
                    subject: 'Welcome to Neyofit!',
                    data: {
                        userName: user.name,
                        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
                    }
                });
            } catch (emailError) {
                logger.error(`Failed to send welcome email to ${user.email}`, emailError as Error);
            }
        }

        if (newUsers.length > 0) {
            logger.info(`Processed ${newUsers.length} welcome emails`);
        }
    } catch (error) {
        logger.error('Welcome email cron error', error as Error);
    }
};

// Check for subscription expiry reminders (runs daily at 10 AM)
const sendSubscriptionReminders = async () => {
    try {
        // Import subscription model dynamically to avoid circular deps
        const { Subscription } = await import('@/subscription/subscription.model');

        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Find subscriptions expiring in 7 days
        const expiringIn7Days = await Subscription.find({
            endDate: {
                $gte: new Date(sevenDaysFromNow.getTime() - 12 * 60 * 60 * 1000),
                $lte: new Date(sevenDaysFromNow.getTime() + 12 * 60 * 60 * 1000)
            },
            status: 'active'
        }).populate('userId').populate({ path: 'subscriptionListingId', populate: { path: 'gymId' } });

        for (const sub of (expiringIn7Days as unknown as PopulatedSubscription[])) {
            const user = sub.userId;
            const gym = sub.subscriptionListingId?.gymId;
            if (!user?.email) continue;

            try {
                await EmailTemplateService.sendTemplatedEmail({
                    templateType: 'subscription-reminder',
                    to: user.email,
                    subject: 'Neyofit - Your Subscription Expires in 7 Days',
                    data: {
                        userName: user.name,
                        gymName: gym?.name || 'your gym',
                        expiryDate: sub.endDate?.toLocaleDateString() || '',
                        daysRemaining: '7',
                        renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gyms/${gym?._id}`
                    }
                });
            } catch (emailError) {
                logger.error(`Failed to send 7-day reminder to ${user.email}`, emailError as Error);
            }
        }

        // Find subscriptions expiring tomorrow
        const expiringTomorrow = await Subscription.find({
            endDate: {
                $gte: new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000),
                $lte: new Date(oneDayFromNow.getTime() + 12 * 60 * 60 * 1000)
            },
            status: 'active'
        }).populate('userId').populate({ path: 'subscriptionListingId', populate: { path: 'gymId' } });

        for (const sub of (expiringTomorrow as unknown as PopulatedSubscription[])) {
            const user = sub.userId;
            const gym = sub.subscriptionListingId?.gymId;
            if (!user?.email) continue;

            try {
                await EmailTemplateService.sendTemplatedEmail({
                    templateType: 'subscription-reminder',
                    to: user.email,
                    subject: 'Neyofit - Your Subscription Expires Tomorrow!',
                    data: {
                        userName: user.name,
                        gymName: gym?.name || 'your gym',
                        expiryDate: sub.endDate?.toLocaleDateString() || '',
                        daysRemaining: '1',
                        renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gyms/${gym?._id}`
                    }
                });
            } catch (emailError) {
                logger.error(`Failed to send 1-day reminder to ${user.email}`, emailError as Error);
            }
        }

        logger.info(`Subscription reminders: ${expiringIn7Days.length} (7-day), ${expiringTomorrow.length} (1-day)`);
    } catch (error) {
        logger.error('Subscription reminder cron error', error as Error);
    }
};

export const startEmailScheduler = () => {
    // Every hour - welcome emails
    cron.schedule('0 * * * *', sendWelcomeEmails);

    // Daily at 10 AM - subscription reminders
    cron.schedule('0 10 * * *', sendSubscriptionReminders);

    logger.info('Neyofit email scheduler started');
};
