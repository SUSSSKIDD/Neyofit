import { Request, Response } from 'express';
import { Subscription } from './subscription.model';
import { ISubscribeRequest, ISubscribeResponse, IUserSubscriptionListResponse, SubscriptionStatus } from '@/types/subscription.types';
import { SubscriptionListing } from '@/subscriptionListing/subscriptionListing.model';

// Subscribe to a plan
export const subscribe = async (req: Request<{}, {}, ISubscribeRequest>, res: Response) => {
  try {
    // Always use authenticated user
    const userId = req.user?._id;
    const { subscriptionListingId, isRecurring } = req.body;

    // Validate subscription listing
    const listing = await SubscriptionListing.findById(subscriptionListingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Subscription listing not found' });
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + listing.durationInDays);

    // Create subscription
    const subscription = await Subscription.create({
      userId,
      subscriptionListingId,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      isRecurring: !!isRecurring
    });

    const response: ISubscribeResponse = {
      success: true,
      message: 'Subscription successful',
      data: { subscription }
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: (error as Error).message });
  }
};

// Get all subscriptions for a user
export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Auto-expire subscriptions that have passed their end date
    await Subscription.updateMany(
      { userId, status: SubscriptionStatus.ACTIVE, endDate: { $lte: new Date() } },
      { $set: { status: SubscriptionStatus.EXPIRED } }
    );

    const subs = await Subscription.find({ userId })
      .populate({
        path: 'subscriptionListingId',
        populate: {
          path: 'gymId',
          model: 'Gym',
          select: 'name location pictures',
        },
      })
      .sort({ createdAt: -1 });
    const response: IUserSubscriptionListResponse = {
      success: true,
      data: subs
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: (error as Error).message });
  }
};

// Cancel a subscription
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Only the subscription owner or a superadmin can cancel
    if (sub.userId.toString() !== req.user?._id?.toString() && req.user?.userType !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'You can only cancel your own subscriptions' });
    }

    sub.status = SubscriptionStatus.CANCELLED;
    await sub.save();
    res.json({ success: true, message: 'Subscription cancelled', data: { subscription: sub } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: (error as Error).message });
  }
};
