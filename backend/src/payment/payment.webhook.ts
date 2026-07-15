import { Request, Response } from 'express';
import crypto from 'crypto';
import { Payment } from './payment.model';
import { Subscription } from '@/subscription/subscription.model';
import { SubscriptionListing } from '@/subscriptionListing/subscriptionListing.model';
import User from '@/user/user.model';
import { Gym } from '@/gym/gym.model';
import { sendEmailSafe } from '@/utils/sendEmailSafe';
import logger from '@/utils/logger';
import { hashToken, constantTimeCompare } from '@/utils/crypto.utils';

// Razorpay webhook handler
export const razorpayWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!secret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ success: false, message: 'Webhook not configured' });
  }

  // Razorpay sends the signature in this header
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  // Use constant-time comparison to prevent timing attacks
  if (!constantTimeCompare(signature, expectedSignature)) {
    logger.warn('Invalid webhook signature received', { 
      ip: req.ip,
      signature: signature?.substring(0, 10) + '...'
    });
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  // Only handle payment successful events
  if (req.body.event === 'payment.captured') {
    const paymentEntity = req.body.payload.payment.entity;
    const { order_id, id: payment_id, amount, currency, notes } = paymentEntity;
    
    const userId = notes?.userId;
    const subscriptionListingId = notes?.subscriptionListingId;
    
    if (!userId || !subscriptionListingId) {
      logger.warn('Missing userId or subscriptionListingId in webhook notes', { order_id });
      return res.status(400).json({ success: false, message: 'Missing required data in notes' });
    }

    try {
      // Check if already processed (idempotency)
      const existingPayment = await Payment.findOne({ razorpayPaymentId: payment_id });
      if (existingPayment) {
        logger.info('Webhook already processed', { payment_id });
        return res.status(200).json({ success: true, message: 'Already processed' });
      }

      // Get listing
      const listing = await SubscriptionListing.findById(subscriptionListingId);
      if (!listing) {
        logger.error('Subscription listing not found', { subscriptionListingId });
        return res.status(404).json({ success: false, message: 'Subscription listing not found' });
      }

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

      // Send subscription confirmation email
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
              dashboardUrl: `${process.env.FRONTEND_URL || 'https://neyofit.in'}/customer`,
            },
          });
        }
      } catch (emailErr) {
        logger.error('Failed to send subscription confirmation from webhook', emailErr as Error);
      }

      logger.info('Webhook processed - subscription activated', { 
        userId, 
        payment_id,
        subscriptionId: subscription._id 
      });

      return res.status(200).json({ success: true, message: 'Webhook processed, subscription activated' });
    } catch (error) {
      logger.error('Webhook processing failed', error as Error, { payment_id });
      return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  }

  // Handle other payment events
  if (req.body.event === 'payment.failed') {
    const paymentEntity = req.body.payload.payment.entity;
    const { order_id, id: payment_id, notes } = paymentEntity;
    
    // Update payment record as failed
    await Payment.findOneAndUpdate(
      { razorpayOrderId: order_id },
      { 
        status: 'failed',
        razorpayPaymentId: payment_id,
      }
    );
    
    logger.info('Payment failed webhook received', { order_id, payment_id });
    return res.status(200).json({ success: true, message: 'Payment failure recorded' });
  }

  if (req.body.event === 'refund.created') {
    const refundEntity = req.body.payload.refund.entity;
    const { payment_id, amount } = refundEntity;
    
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: payment_id },
      { 
        status: 'refunded',
        // Store refund info in notes or separate field
      }
    );
    
    logger.info('Refund webhook received', { payment_id, amount: amount / 100 });
    return res.status(200).json({ success: true, message: 'Refund recorded' });
  }

  // For other events, just acknowledge
  return res.status(200).json({ success: true, message: 'Event acknowledged' });
};