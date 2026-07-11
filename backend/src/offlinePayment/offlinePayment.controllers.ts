import { Request, Response } from "express";
import { OfflinePayment } from "./offlinePayment.model";
import { GymMember } from "@/gymMember/gymMember.model";
import {
  ICreateOfflinePaymentRequest,
  OfflinePaymentStatus,
} from "@/types/offlinePayment.types";

/**
 * Generate receipt number: RCP-YYMMDD-SEQ
 */
async function generateReceiptNumber(gymId: string): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `RCP-${yy}${mm}${dd}`;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const count = await OfflinePayment.countDocuments({
    gymId,
    createdAt: { $gte: todayStart, $lt: todayEnd },
  });

  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

// Record a new offline payment
export const createOfflinePayment = async (
  req: Request<{}, {}, ICreateOfflinePaymentRequest>,
  res: Response
) => {
  try {
    const {
      gymId,
      memberId,
      subscriptionListingId,
      amount,
      paymentMethod,
      transactionReference,
      paymentDate,
      paymentType,
      notes,
    } = req.body;

    // Input validation
    if (!gymId || !memberId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "gymId, memberId, and amount are required",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    const validMethods = ["cash", "upi", "bank_transfer", "card", "other"];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Payment method must be one of: ${validMethods.join(", ")}`,
      });
    }

    // Validate member exists
    const member = await GymMember.findOne({
      _id: memberId,
      gymId,
      isActive: true,
    });
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found in this gym" });
    }

    const receiptNumber = await generateReceiptNumber(gymId);

    const payment = await OfflinePayment.create({
      gymId,
      memberId,
      subscriptionListingId,
      amount,
      paymentMethod,
      transactionReference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentType,
      receiptNumber,
      notes,
      recordedBy: req.user?._id,
      status: OfflinePaymentStatus.COMPLETED,
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// List gym payments (paginated, date filter)
export const getGymPayments = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const {
      page = "1",
      limit = "20",
      startDate,
      endDate,
      paymentMethod,
      status,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Cap at 100

    const filter: any = { gymId };
    // By default exclude refunded payments; allow explicit status filter
    if (status && status !== "all") {
      filter.status = status;
    } else if (!status) {
      filter.status = { $ne: OfflinePaymentStatus.REFUNDED };
    }
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
      if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const [payments, total] = await Promise.all([
      OfflinePayment.find(filter)
        .populate("memberId", "name phone membershipNumber")
        .populate("subscriptionListingId", "name cost type")
        .sort({ paymentDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      OfflinePayment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Member's payment history
export const getMemberPayments = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    const { status } = req.query;
    const filter: any = { memberId };
    // By default exclude refunded; allow explicit "all" to see everything
    if (status && status !== "all") {
      filter.status = status;
    } else if (!status) {
      filter.status = { $ne: OfflinePaymentStatus.REFUNDED };
    }

    const payments = await OfflinePayment.find(filter)
      .populate("subscriptionListingId", "name cost type")
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Revenue summary (by method, by date range)
export const getRevenueSummary = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const { startDate, endDate } = req.query;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);

    // Build match filter
    const matchFilter: any = {
      gymId: { $exists: true },
      status: OfflinePaymentStatus.COMPLETED,
    };

    // We need to use string comparison for gymId in aggregation
    const gymObjectId = new (require("mongoose").Types.ObjectId)(gymId);

    // Revenue by payment method (all time or filtered)
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const byMethodPipeline: any[] = [
      {
        $match: {
          gymId: gymObjectId,
          status: OfflinePaymentStatus.COMPLETED,
          ...(Object.keys(dateFilter).length > 0
            ? { paymentDate: dateFilter }
            : {}),
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ];

    const [byMethod, todayRevenue, weekRevenue, monthRevenue, totalRevenue] =
      await Promise.all([
        OfflinePayment.aggregate(byMethodPipeline),
        OfflinePayment.aggregate([
          {
            $match: {
              gymId: gymObjectId,
              status: OfflinePaymentStatus.COMPLETED,
              paymentDate: { $gte: todayStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        OfflinePayment.aggregate([
          {
            $match: {
              gymId: gymObjectId,
              status: OfflinePaymentStatus.COMPLETED,
              paymentDate: { $gte: weekStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        OfflinePayment.aggregate([
          {
            $match: {
              gymId: gymObjectId,
              status: OfflinePaymentStatus.COMPLETED,
              paymentDate: { $gte: monthStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        OfflinePayment.aggregate([
          {
            $match: {
              gymId: gymObjectId,
              status: OfflinePaymentStatus.COMPLETED,
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        byMethod: byMethod.map((m) => ({
          method: m._id,
          total: m.total,
          count: m.count,
        })),
        today: todayRevenue[0] || { total: 0, count: 0 },
        thisWeek: weekRevenue[0] || { total: 0, count: 0 },
        thisMonth: monthRevenue[0] || { total: 0, count: 0 },
        allTime: totalRevenue[0] || { total: 0, count: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Mark payment as refunded
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await OfflinePayment.findById(id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (payment.status === OfflinePaymentStatus.REFUNDED) {
      return res
        .status(400)
        .json({ success: false, message: "Payment is already refunded" });
    }

    payment.status = OfflinePaymentStatus.REFUNDED;
    if (req.body.notes) payment.notes = req.body.notes;
    await payment.save();

    res.json({
      success: true,
      message: "Payment marked as refunded",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
