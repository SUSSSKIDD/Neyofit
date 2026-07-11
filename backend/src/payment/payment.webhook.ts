import { Request, Response } from 'express';
import crypto from 'crypto';
import { Payment } from './payment.model';
import { Subscription } from '@/subscription/subscription.model';
import { SubscriptionListing } from '@/subscriptionListing/subscriptionListing.model';
import User from '@/user/user.model';
import { Gym } from '@/gym/gym.model';
import { sendEmailSafe } from '@/utils/sendEmailSafe';
import logger from '@/utils/logger';

// Razorpay webhook handler
export const razorpayWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'Webhook secret not configured' });

  // Razorpay sends the signature in this header
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  // Only handle payment successful events
  if (req.body.event === 'payment.captured') {
    const paymentEntity = req.body.payload.payment.entity;
    const { order_id, id: payment_id, amount, currency, notes } = paymentEntity;
    // You can store extra info in notes when creating the order
    const userId = notes?.userId;
    const subscriptionListingId = notes?.subscriptionListingId;
    if (!userId || !subscriptionListingId) {
      return res.status(400).json({ success: false, message: 'Missing userId or subscriptionListingId in notes' });
    }
    // Check if already processed
    const existingPayment = await Payment.findOne({ razorpayPaymentId: payment_id });
    if (existingPayment) return res.status(200).json({ success: true, message: 'Already processed' });
    // Get listing
    const listing = await SubscriptionListing.findById(subscriptionListingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Subscription listing not found' });
    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + listing.durationInDays);
    const subscription = await Subscription.create({
      userId,
      subscriptionListingId,
      startDate,
      endDate,
      status: 'active',
      isRecurring: false
    });
    // Save payment
    await Payment.create({
      userId,
      subscriptionId: subscription._id,
      razorpayOrderId: order_id,
      razorpayPaymentId: payment_id,
      amount: amount / 100, // convert paise to main unit
      currency,
      status: 'paid'
    });

    // Send subscription confirmation email (fire-and-forget)
    try {
      const buyer = await User.findById(userId).select('name email');
      const gym = await Gym.findById(listing.gymId).select('name');
      if (buyer) {
        sendEmailSafe({
          templateType: 'subscription-confirmation',
          to: buyer.email,
          subject: 'Neyofit - Subscription Confirmed!',
          data: {
            userName: buyer.name,
            gymName: gym?.name || 'your gym',
            planName: (listing as any).name || 'Gym Pass',
            duration: `${listing.durationInDays} days`,
            startDate: startDate.toLocaleDateString(),
            endDate: endDate.toLocaleDateString(),
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
          },
        });
      }
    } catch (emailErr) {
      logger.error('Failed to send subscription confirmation from webhook', emailErr as Error);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed, subscription activated' });
  }
  // For other events, just acknowledge
  res.status(200).json({ success: true, message: 'Event ignored' });
};
