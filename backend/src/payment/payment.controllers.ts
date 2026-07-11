import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "./payment.model";
import { Subscription } from "@/subscription/subscription.model";
import { SubscriptionListing } from "@/subscriptionListing/subscriptionListing.model";
import { Gym } from "@/gym/gym.model";
import { getOrCreateSettings } from "@/platformSettings/platformSettings.model";
import logger from "@/utils/logger";
import User from "@/user/user.model";
import { sendEmailSafe } from "@/utils/sendEmailSafe";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create Razorpay order for a subscription
export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { subscriptionListingId } = req.body;

    // Validate input
    if (!subscriptionListingId) {
      return res.status(400).json({
        success: false,
        message: "Subscription listing ID is required",
      });
    }

    const listing = await SubscriptionListing.findById(subscriptionListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Subscription listing not found",
      });
    }

    // Check if user already has an active subscription for this listing
    const existingSubscription = await Subscription.findOne({
      userId,
      subscriptionListingId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription for this plan",
      });
    }

    const makeReceipt = (userId: string | undefined) => {
      // keep only safe chars and a short slice of userId
      const uid = String(userId || "anon")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 8);
      const ts = Date.now().toString(36); // compact time string
      const rand = Math.random().toString(36).slice(2, 6); // 4-char rand
      const receipt = `rcpt_${uid}_${ts}_${rand}`; // likely < 40
      return receipt.slice(0, 40); // force max length just in case
    };

    // Create a Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round((listing.cost as number) * 100), // Razorpay expects paise
      currency: listing.currency,
      receipt: makeReceipt(userId),
      payment_capture: true,
    });

    // Create a payment record with 'created' status
    const payment = await Payment.create({
      userId,
      subscriptionId: null, // Will be set after verification
      razorpayOrderId: order.id,
      amount: listing.cost,
      currency: listing.currency,
      status: "created",
    });

    logger.info("Payment order created", {
      userId,
      orderId: order.id,
      amount: listing.cost,
      subscriptionListingId,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    });
  } catch (error) {
    logger.error(
      `Failed to create payment order: ${(error as Error).message}`,
      error as Error
    );
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// Verify payment and activate subscription (grant gym pass)
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      subscriptionListingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Validate required fields
    if (
      !subscriptionListingId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    // Find the subscription listing
    const listing = await SubscriptionListing.findById(subscriptionListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Subscription listing not found",
      });
    }

    // Find the existing payment record
    const existingPayment = await Payment.findOne({
      razorpayOrderId,
      userId,
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Check if payment is already processed
    if (existingPayment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already processed",
      });
    }

    // Razorpay signature verification for transaction security
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      logger.error("Razorpay secret not configured");
      return res.status(500).json({
        success: false,
        message: "Payment configuration error",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      // Mark payment as failed
      await Payment.findByIdAndUpdate(existingPayment._id, {
        status: "failed",
        razorpayPaymentId,
        razorpaySignature,
      });

      logger.warn("Invalid payment signature detected", {
        userId,
        razorpayOrderId,
        razorpayPaymentId,
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Access denied.",
      });
    }

    // Double-check with Razorpay API for additional security
    try {
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      if (payment.status !== "captured" && payment.status !== "authorized") {
        await Payment.findByIdAndUpdate(existingPayment._id, {
          status: "failed",
          razorpayPaymentId,
          razorpaySignature,
        });

        return res.status(400).json({
          success: false,
          message: "Payment not completed. Access denied.",
        });
      }
    } catch (razorpayError) {
      logger.error(
        `Failed to verify payment with Razorpay: ${(razorpayError as Error).message
        }`,
        razorpayError as Error
      );
      return res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Double-check no active subscription was created between order creation and verification
    const duplicateCheck = await Subscription.findOne({
      userId,
      subscriptionListingId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (duplicateCheck) {
      // Still mark the payment as paid but link to existing subscription
      await Payment.findByIdAndUpdate(existingPayment._id, {
        subscriptionId: duplicateCheck._id,
        razorpayPaymentId,
        razorpaySignature,
        status: "paid",
      });

      return res.json({
        success: true,
        message: "Payment verified. You already have an active subscription for this plan.",
        data: {
          subscription: {
            id: duplicateCheck._id,
            startDate: duplicateCheck.startDate,
            endDate: duplicateCheck.endDate,
            status: duplicateCheck.status,
          },
          gymPassGranted: true,
        },
      });
    }

    // Payment is valid - Grant gym pass by creating subscription
    const subscription = await Subscription.create({
      userId,
      subscriptionListingId,
      startDate: new Date(),
      endDate: new Date(
        Date.now() + listing.durationInDays * 24 * 60 * 60 * 1000
      ),
      status: "active",
      isRecurring: false,
    });

    // Calculate commission for gym owner payout
    let commissionFields: Record<string, unknown> = {};
    try {
      const gym = await Gym.findById(listing.gymId);
      if (gym && gym.ownerId) {
        const platformSettings = await getOrCreateSettings();
        const commissionRate =
          gym.commissionRate != null
            ? gym.commissionRate
            : platformSettings.defaultCommissionRate;
        const amount = listing.cost as number;
        const commissionAmount = Math.round((amount * commissionRate) / 100);
        const gymOwnerShare = amount - commissionAmount;

        commissionFields = {
          gymId: gym._id,
          gymOwnerId: gym.ownerId,
          commissionRate,
          commissionAmount,
          gymOwnerShare,
          payoutStatus: "unpaid",
        };
      }
    } catch (commErr) {
      logger.warn("Failed to calculate commission, payment will still succeed", {
        error: (commErr as Error).message,
      });
    }

    // Update payment record with success status
    const updatedPayment = await Payment.findByIdAndUpdate(
      existingPayment._id,
      {
        subscriptionId: subscription._id,
        razorpayPaymentId,
        razorpaySignature,
        status: "paid",
        ...commissionFields,
      },
      { new: true }
    );

    logger.info("Payment verified and gym pass granted", {
      userId,
      subscriptionId: subscription._id,
      paymentId: updatedPayment?._id,
      amount: listing.cost,
    });

    // Send subscription confirmation email (fire-and-forget)
    try {
      const buyer = await User.findById(userId).select("name email");
      const gym = await Gym.findById(listing.gymId).select("name");
      if (buyer) {
        sendEmailSafe({
          templateType: "subscription-confirmation",
          to: buyer.email,
          subject: "Neyofit - Subscription Confirmed!",
          data: {
            userName: buyer.name,
            gymName: gym?.name || "your gym",
            planName: (listing as any).name || "Gym Pass",
            duration: `${listing.durationInDays} days`,
            startDate: subscription.startDate.toLocaleDateString(),
            endDate: subscription.endDate.toLocaleDateString(),
            dashboardUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/customer`,
          },
        });
      }
    } catch (emailLookupErr) {
      logger.error("Failed to send subscription confirmation email", emailLookupErr as Error);
    }

    res.json({
      success: true,
      message: "Payment verified successfully. Gym pass activated!",
      data: {
        subscription: {
          id: subscription._id,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        },
        gymPassGranted: true,
      },
    });
  } catch (error) {
    logger.error(
      `Failed to verify payment: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    const payment = await Payment.findOne({
      razorpayOrderId: orderId,
      userId,
    }).populate("subscriptionId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        subscription: payment.subscriptionId,
        gymPassActive: payment.status === "paid",
      },
    });
  } catch (error) {
    logger.error(
      `Failed to get payment status: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
    });
  }
};

// Get user's active subscriptions (gym passes)
export const getActiveGymPasses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Auto-expire subscriptions that have passed their end date
    await Subscription.updateMany(
      { userId, status: "active", endDate: { $lte: new Date() } },
      { $set: { status: "expired" } }
    );

    const activeSubscriptions = await Subscription.find({
      userId,
      status: "active",
      endDate: { $gt: new Date() },
    }).populate({
      path: "subscriptionListingId",
      populate: {
        path: "gymId",
        model: "Gym",
      },
    });

    res.json({
      success: true,
      data: {
        activeGymPasses: activeSubscriptions.length,
        subscriptions: activeSubscriptions,
      },
    });
  } catch (error) {
    logger.error(
      `Failed to get active gym passes: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get active gym passes",
    });
  }
};

// Get user's payment history
export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const payments = await Payment.find({ userId })
      .populate({
        path: "subscriptionId",
        populate: {
          path: "subscriptionListingId",
          model: "SubscriptionListing",
          select: "name type durationInDays cost",
          populate: {
            path: "gymId",
            model: "Gym",
            select: "name",
          },
        },
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    logger.error(
      `Failed to get user payments: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get user payments",
    });
  }
};

// Get all payments (superadmin)
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate("userId", "name email phone")
      .populate({
        path: "subscriptionId",
        populate: {
          path: "subscriptionListingId",
          model: "SubscriptionListing",
          populate: {
            path: "gymId",
            model: "Gym",
            select: "name status ownerId",
          },
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        payments,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(
      `Failed to get all payments: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get payments",
    });
  }
};

// Get payout summary per gym owner (superadmin only)
export const getPayoutSummary = async (req: Request, res: Response) => {
  try {
    // Get all paid payments with deep populate
    const payments = await Payment.find({ status: "paid" })
      .populate("userId", "name email")
      .populate({
        path: "subscriptionId",
        populate: {
          path: "subscriptionListingId",
          model: "SubscriptionListing",
          populate: {
            path: "gymId",
            model: "Gym",
            select: "name ownerId",
            populate: {
              path: "ownerId",
              model: "User",
              select: "name email phone",
            },
          },
        },
      })
      .sort({ createdAt: -1 });

    // Aggregate by gym owner
    const ownerMap = new Map<
      string,
      {
        ownerId: string;
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string;
        totalEarnings: number;
        gymCount: Set<string>;
        paymentCount: number;
        lastPaymentDate: Date | null;
      }
    >();

    for (const payment of payments) {
      const sub = payment.subscriptionId as any;
      if (!sub?.subscriptionListingId?.gymId?.ownerId) continue;

      const owner = sub.subscriptionListingId.gymId.ownerId;
      const ownerId = owner._id?.toString() || owner.toString();
      const gymId = sub.subscriptionListingId.gymId._id?.toString();

      if (!ownerMap.has(ownerId)) {
        ownerMap.set(ownerId, {
          ownerId,
          ownerName: owner.name || "Unknown",
          ownerEmail: owner.email || "",
          ownerPhone: owner.phone || "",
          totalEarnings: 0,
          gymCount: new Set(),
          paymentCount: 0,
          lastPaymentDate: null,
        });
      }

      const entry = ownerMap.get(ownerId)!;
      entry.totalEarnings += payment.amount;
      if (gymId) entry.gymCount.add(gymId);
      entry.paymentCount += 1;
      const paymentDate = (payment as any).createdAt;
      if (!entry.lastPaymentDate || paymentDate > entry.lastPaymentDate) {
        entry.lastPaymentDate = paymentDate;
      }
    }

    const summary = Array.from(ownerMap.values()).map((entry) => ({
      ownerId: entry.ownerId,
      ownerName: entry.ownerName,
      ownerEmail: entry.ownerEmail,
      ownerPhone: entry.ownerPhone,
      totalEarnings: entry.totalEarnings,
      gymCount: entry.gymCount.size,
      paymentCount: entry.paymentCount,
      lastPaymentDate: entry.lastPaymentDate,
    }));

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error(
      `Failed to get payout summary: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get payout summary",
    });
  }
};

// Get payments for gym owner's gyms
export const getGymOwnerPayments = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?._id;

    // Find all gyms owned by this user
    const gyms = await Gym.find({ ownerId }).select("_id");
    const gymIds = gyms.map((g) => g._id);

    // Find subscription listings for these gyms
    const listings = await SubscriptionListing.find({
      gymId: { $in: gymIds },
    }).select("_id");
    const listingIds = listings.map((l) => l._id);

    // Find subscriptions for these listings
    const subscriptions = await Subscription.find({
      subscriptionListingId: { $in: listingIds },
    }).select("_id");
    const subscriptionIds = subscriptions.map((s) => s._id);

    // Find payments for these subscriptions
    const payments = await Payment.find({
      subscriptionId: { $in: subscriptionIds },
    })
      .populate("userId", "name email phone")
      .populate("subscriptionId")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    logger.error(
      `Failed to get gym owner payments: ${(error as Error).message}`,
      error as Error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get gym owner payments",
    });
  }
};
