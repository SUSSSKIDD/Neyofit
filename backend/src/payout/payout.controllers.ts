import { Request, Response } from "express";
import { Payout } from "./payout.model";
import { Payment } from "@/payment/payment.model";
import { PayoutStatus } from "@/types/payout.types";
import User from "@/user/user.model";
import logger from "@/utils/logger";
import { sendEmailSafe } from "@/utils/sendEmailSafe";

// GET /payouts/dashboard — aggregate unpaid amounts per gym owner (superadmin)
export const getPayoutsDashboard = async (req: Request, res: Response) => {
  try {
    const unpaidAggregation = await Payment.aggregate([
      { $match: { status: "paid", payoutStatus: "unpaid", gymOwnerId: { $ne: null } } },
      {
        $group: {
          _id: "$gymOwnerId",
          totalAmount: { $sum: "$amount" },
          totalCommission: { $sum: "$commissionAmount" },
          totalGymOwnerShare: { $sum: "$gymOwnerShare" },
          paymentCount: { $sum: 1 },
          gymIds: { $addToSet: "$gymId" },
        },
      },
    ]);

    // Get owner details
    const ownerIds = unpaidAggregation.map((a) => a._id);
    const owners = await User.find({ _id: { $in: ownerIds } }).select("name email phone");
    const ownerMap = new Map(owners.map((o) => [o._id.toString(), o]));

    // Get completed payouts totals
    const completedPayouts = await Payout.aggregate([
      { $match: { status: PayoutStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$payoutAmount" },
          totalCommission: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingData = unpaidAggregation.map((a) => {
      const owner = ownerMap.get(a._id.toString());
      return {
        gymOwnerId: a._id,
        ownerName: owner?.name || "Unknown",
        ownerEmail: owner?.email || "",
        ownerPhone: owner?.phone || "",
        totalAmount: a.totalAmount,
        totalCommission: a.totalCommission,
        totalGymOwnerShare: a.totalGymOwnerShare,
        paymentCount: a.paymentCount,
        gymCount: a.gymIds.length,
      };
    });

    const totalUnpaid = pendingData.reduce((s, d) => s + d.totalGymOwnerShare, 0);
    const totalCommissionEarned = pendingData.reduce((s, d) => s + d.totalCommission, 0);
    const completed = completedPayouts[0] || { totalPaid: 0, totalCommission: 0, count: 0 };

    res.json({
      success: true,
      data: {
        summary: {
          totalUnpaidToGyms: totalUnpaid,
          platformCommissionEarned: totalCommissionEarned + completed.totalCommission,
          totalPayoutsCompleted: completed.totalPaid,
          completedPayoutCount: completed.count,
        },
        pendingByOwner: pendingData,
      },
    });
  } catch (error) {
    logger.error(`Failed to get payouts dashboard: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get payouts dashboard" });
  }
};

// GET /payouts — paginated payout history (superadmin)
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const total = await Payout.countDocuments(filter);
    const payouts = await Payout.find(filter)
      .populate("gymOwnerId", "name email phone")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { payouts, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error(`Failed to get payouts: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get payouts" });
  }
};

// GET /payouts/:id — single payout detail (superadmin)
export const getPayoutById = async (req: Request, res: Response) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate("gymOwnerId", "name email phone bankDetails")
      .populate("processedBy", "name email")
      .populate("paymentIds");

    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    logger.error(`Failed to get payout: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get payout" });
  }
};

// POST /payouts — create payout for a gym owner (superadmin)
export const createPayout = async (req: Request, res: Response) => {
  try {
    const { gymOwnerId, notes, paymentMethod } = req.body;

    if (!gymOwnerId) {
      return res.status(400).json({ success: false, message: "gymOwnerId is required" });
    }

    // Atomically claim unpaid payments for this gym owner
    const unpaidPayments = await Payment.find({
      gymOwnerId,
      status: "paid",
      payoutStatus: "unpaid",
    });

    if (unpaidPayments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No unpaid payments found for this gym owner",
      });
    }

    const totalAmount = unpaidPayments.reduce((s, p) => s + p.amount, 0);
    const totalCommission = unpaidPayments.reduce((s, p) => s + (p.commissionAmount || 0), 0);
    const totalPayoutAmount = unpaidPayments.reduce((s, p) => s + (p.gymOwnerShare || 0), 0);
    const paymentIds = unpaidPayments.map((p) => p._id);

    // Calculate average commission rate
    const avgCommissionRate =
      totalAmount > 0 ? Math.round((totalCommission / totalAmount) * 10000) / 100 : 0;

    // Find date range
    const dates = unpaidPayments.map((p) => (p as any).createdAt as Date);
    const periodStart = new Date(Math.min(...dates.map((d) => d.getTime())));
    const periodEnd = new Date(Math.max(...dates.map((d) => d.getTime())));

    const payout = await Payout.create({
      gymOwnerId,
      amount: totalAmount,
      commissionRate: avgCommissionRate,
      commissionAmount: totalCommission,
      payoutAmount: totalPayoutAmount,
      currency: unpaidPayments[0].currency || "INR",
      periodStart,
      periodEnd,
      paymentIds,
      status: PayoutStatus.PENDING,
      notes,
      paymentMethod,
    });

    // Mark payments as included in this payout
    await Payment.updateMany(
      { _id: { $in: paymentIds } },
      { $set: { payoutStatus: "included", payoutId: payout._id } }
    );

    logger.info("Payout created", { payoutId: payout._id, gymOwnerId, paymentCount: paymentIds.length });

    // Notify gym owner of payout initiation (fire-and-forget)
    const gymOwner = await User.findById(gymOwnerId).select("name email");
    if (gymOwner) {
      sendEmailSafe({
        templateType: "payout-initiated",
        to: gymOwner.email,
        subject: "Neyofit - Payout Initiated",
        data: {
          userName: gymOwner.name,
          payoutAmount: String(totalPayoutAmount),
          currency: payout.currency,
          paymentCount: String(paymentIds.length),
          periodStart: periodStart.toLocaleDateString(),
          periodEnd: periodEnd.toLocaleDateString(),
        },
      });
    }

    res.status(201).json({ success: true, data: payout });
  } catch (error) {
    logger.error(`Failed to create payout: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to create payout" });
  }
};

// PATCH /payouts/:id/complete — mark payout completed (superadmin)
export const markPayoutCompleted = async (req: Request, res: Response) => {
  try {
    const { transactionReference, notes } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (payout.status === PayoutStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: "Payout already completed" });
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.transactionReference = transactionReference;
    payout.processedAt = new Date();
    payout.processedBy = req.user?._id;
    if (notes) payout.notes = notes;
    await payout.save();

    // Mark all payments in this payout as paid
    await Payment.updateMany(
      { _id: { $in: payout.paymentIds } },
      { $set: { payoutStatus: "paid" } }
    );

    logger.info("Payout marked completed", { payoutId: payout._id });

    // Notify gym owner of payout completion (fire-and-forget)
    const gymOwner = await User.findById(payout.gymOwnerId).select("name email");
    if (gymOwner) {
      sendEmailSafe({
        templateType: "payout-completed",
        to: gymOwner.email,
        subject: "Neyofit - Payout Completed!",
        data: {
          userName: gymOwner.name,
          payoutAmount: String(payout.payoutAmount),
          currency: payout.currency,
          transactionReference: transactionReference || "N/A",
          dashboardUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/gym-owner/dashboard`,
        },
      });
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    logger.error(`Failed to complete payout: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to complete payout" });
  }
};

// PATCH /payouts/:id/fail — mark payout failed, revert payments (superadmin)
export const markPayoutFailed = async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (payout.status === PayoutStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: "Cannot fail a completed payout" });
    }

    payout.status = PayoutStatus.FAILED;
    if (notes) payout.notes = notes;
    await payout.save();

    // Revert payments back to unpaid
    await Payment.updateMany(
      { _id: { $in: payout.paymentIds } },
      { $set: { payoutStatus: "unpaid", payoutId: null } }
    );

    logger.info("Payout marked failed", { payoutId: payout._id });

    // Notify gym owner of payout failure (fire-and-forget)
    const gymOwner = await User.findById(payout.gymOwnerId).select("name email");
    if (gymOwner) {
      sendEmailSafe({
        templateType: "payout-failed",
        to: gymOwner.email,
        subject: "Neyofit - Payout Failed",
        data: {
          userName: gymOwner.name,
          payoutAmount: String(payout.payoutAmount),
          currency: payout.currency,
          supportEmail: process.env.SUPPORT_EMAIL || "support@Neyofit.com",
        },
      });
    }

    res.json({ success: true, data: payout });
  } catch (error) {
    logger.error(`Failed to fail payout: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to update payout" });
  }
};

// GET /payouts/my/history — gym owner's own payout history
export const getGymOwnerPayouts = async (req: Request, res: Response) => {
  try {
    const gymOwnerId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const total = await Payout.countDocuments({ gymOwnerId });
    const payouts = await Payout.find({ gymOwnerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { payouts, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error(`Failed to get gym owner payouts: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get payouts" });
  }
};

// GET /payouts/my/summary — gym owner earnings summary
export const getGymOwnerEarningsSummary = async (req: Request, res: Response) => {
  try {
    const gymOwnerId = req.user?._id;

    // Get all paid payments for this gym owner
    const earningsAgg = await Payment.aggregate([
      { $match: { gymOwnerId, status: "paid" } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$amount" },
          totalCommission: { $sum: "$commissionAmount" },
          totalNetEarnings: { $sum: "$gymOwnerShare" },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    // Get pending (unpaid) amount
    const pendingAgg = await Payment.aggregate([
      { $match: { gymOwnerId, status: "paid", payoutStatus: "unpaid" } },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: "$gymOwnerShare" },
          pendingCount: { $sum: 1 },
        },
      },
    ]);

    // Get total paid out
    const paidOutAgg = await Payout.aggregate([
      { $match: { gymOwnerId, status: PayoutStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          totalPaidOut: { $sum: "$payoutAmount" },
          payoutCount: { $sum: 1 },
        },
      },
    ]);

    const earnings = earningsAgg[0] || { totalEarnings: 0, totalCommission: 0, totalNetEarnings: 0, totalPayments: 0 };
    const pending = pendingAgg[0] || { pendingAmount: 0, pendingCount: 0 };
    const paidOut = paidOutAgg[0] || { totalPaidOut: 0, payoutCount: 0 };

    res.json({
      success: true,
      data: {
        totalEarnings: earnings.totalEarnings,
        totalCommission: earnings.totalCommission,
        totalNetEarnings: earnings.totalNetEarnings,
        totalPayments: earnings.totalPayments,
        pendingPayout: pending.pendingAmount,
        pendingPaymentCount: pending.pendingCount,
        totalPaidOut: paidOut.totalPaidOut,
        payoutCount: paidOut.payoutCount,
      },
    });
  } catch (error) {
    logger.error(`Failed to get earnings summary: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get earnings summary" });
  }
};
