import { Request, Response } from "express";
import { GymMember } from "./gymMember.model";
import { OfflinePayment } from "@/offlinePayment/offlinePayment.model";
import { SubscriptionListing } from "@/subscriptionListing/subscriptionListing.model";
import { normalizePhone } from "@/utils/phoneNormalize";
import {
  ICreateGymMemberRequest,
  IRenewMemberRequest,
  IFreezeMemberRequest,
  MembershipStatus,
} from "@/types/gymMember.types";
import {
  OfflinePaymentType,
  OfflinePaymentStatus,
} from "@/types/offlinePayment.types";

/**
 * Generate membership number: GYM-YYMMDD-RANDOM
 * Uses random suffix to avoid race conditions from count-based approach.
 */
async function generateMembershipNumber(gymId: string): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `GYM-${yy}${mm}${dd}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000); // 4-digit random
  return `${prefix}-${rand}`;
}

/**
 * Generate receipt number: RCP-YYMMDD-RANDOM
 * Uses random suffix to avoid race conditions.
 */
async function generateReceiptNumber(gymId: string): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `RCP-${yy}${mm}${dd}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000); // 4-digit random
  return `${prefix}-${rand}`;
}

// Create a new gym member (with optional inline payment)
export const createGymMember = async (
  req: Request<{}, {}, ICreateGymMemberRequest>,
  res: Response
) => {
  try {
    const {
      gymId,
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      emergencyContact,
      subscriptionListingId,
      membershipStartDate,
      memberType,
      source,
      notes,
      payment,
    } = req.body;

    // Input validation
    if (!gymId || !name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "gymId, name, and phone are required",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters",
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (gender && !["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be male, female, or other",
      });
    }

    if (payment && payment.amount !== undefined && payment.amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount cannot be negative",
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    // Check duplicate phone in this gym
    const existing = await GymMember.findOne({
      gymId,
      phone: normalizedPhone,
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists in this gym",
      });
    }

    const membershipNumber = await generateMembershipNumber(gymId);

    let membershipEndDate: Date | undefined;
    const startDate = membershipStartDate
      ? new Date(membershipStartDate)
      : new Date();

    if (subscriptionListingId) {
      const listing = await SubscriptionListing.findById(subscriptionListingId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Subscription plan not found",
        });
      }
      membershipEndDate = new Date(startDate);
      membershipEndDate.setDate(
        membershipEndDate.getDate() + listing.durationInDays
      );
    }

    const member = await GymMember.create({
      gymId,
      name: name.trim(),
      phone: normalizedPhone,
      email: email?.trim(),
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      emergencyContact,
      membershipNumber,
      subscriptionListingId,
      membershipStartDate: startDate,
      membershipEndDate,
      membershipStatus: subscriptionListingId
        ? MembershipStatus.ACTIVE
        : MembershipStatus.TRIAL,
      memberType: memberType || "regular",
      source: source || "walk_in",
      notes,
    });

    // Create inline payment if provided
    let paymentRecord = null;
    if (payment && payment.amount > 0) {
      const receiptNumber = await generateReceiptNumber(gymId);
      paymentRecord = await OfflinePayment.create({
        gymId,
        memberId: member._id,
        subscriptionListingId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: new Date(),
        paymentType: OfflinePaymentType.MEMBERSHIP_NEW,
        receiptNumber,
        notes: payment.notes,
        recordedBy: req.user?._id,
        status: OfflinePaymentStatus.COMPLETED,
      });
    }

    res.status(201).json({
      success: true,
      message: "Member registered successfully",
      data: { member, payment: paymentRecord },
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists in this gym",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// List gym members (paginated, search)
export const getGymMembers = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const {
      page = "1",
      limit = "20",
      status,
      search,
      memberType,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Cap at 100

    // Auto-expire members whose membership has ended but still marked active
    await GymMember.updateMany(
      {
        gymId,
        isActive: true,
        membershipStatus: MembershipStatus.ACTIVE,
        membershipEndDate: { $lt: new Date() },
      },
      { $set: { membershipStatus: MembershipStatus.EXPIRED } }
    );

    const filter: any = { gymId, isActive: true };

    if (status && status !== "all") {
      filter.membershipStatus = status;
    }
    if (memberType) {
      filter.memberType = memberType;
    }
    if (search) {
      const searchStr = search as string;
      filter.$or = [
        { name: { $regex: searchStr, $options: "i" } },
        { phone: { $regex: searchStr } },
        { email: { $regex: searchStr, $options: "i" } },
        { membershipNumber: { $regex: searchStr, $options: "i" } },
      ];
    }

    const [members, total] = await Promise.all([
      GymMember.find(filter)
        .populate("subscriptionListingId", "name cost type durationInDays")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      GymMember.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        members,
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

// Get single member
export const getGymMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const member = await GymMember.findById(id)
      .populate("subscriptionListingId")
      .populate("gymId", "name");

    if (!member || !member.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Update member
export const updateGymMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.phone) {
      updates.phone = normalizePhone(updates.phone);
    }

    // Don't allow direct status manipulation through update — use dedicated endpoints
    delete updates.membershipNumber;
    delete updates.gymId;

    const member = await GymMember.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("subscriptionListingId");

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A member with this phone number already exists in this gym",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Soft delete member
export const deleteGymMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const member = await GymMember.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    res.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Freeze membership
export const freezeMembership = async (
  req: Request<{ id: string }, {}, IFreezeMemberRequest>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    if (start >= end) {
      return res
        .status(400)
        .json({ success: false, message: "Start date must be before end date" });
    }

    const member = await GymMember.findById(id);
    if (!member || !member.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    if (member.membershipStatus === MembershipStatus.FROZEN) {
      return res
        .status(400)
        .json({ success: false, message: "Membership is already frozen" });
    }

    member.membershipStatus = MembershipStatus.FROZEN;
    member.freezeHistory.push({
      startDate: start,
      endDate: end,
      reason,
    });
    await member.save();

    res.json({
      success: true,
      message: "Membership frozen successfully",
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Unfreeze membership — extends end date by frozen days
export const unfreezeMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const member = await GymMember.findById(id);
    if (!member || !member.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    if (member.membershipStatus !== MembershipStatus.FROZEN) {
      return res
        .status(400)
        .json({ success: false, message: "Membership is not frozen" });
    }

    // Get the last freeze record
    const lastFreeze = member.freezeHistory[member.freezeHistory.length - 1];
    if (lastFreeze && member.membershipEndDate) {
      const frozenDays = Math.ceil(
        (new Date(lastFreeze.endDate).getTime() -
          new Date(lastFreeze.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      member.membershipEndDate = new Date(
        member.membershipEndDate.getTime() + frozenDays * 24 * 60 * 60 * 1000
      );
    }

    member.membershipStatus = MembershipStatus.ACTIVE;
    await member.save();

    res.json({
      success: true,
      message: "Membership unfrozen successfully",
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Renew membership
export const renewMembership = async (
  req: Request<{ id: string }, {}, IRenewMemberRequest>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { subscriptionListingId, payment } = req.body;

    const member = await GymMember.findById(id);
    if (!member || !member.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    const listing = await SubscriptionListing.findById(subscriptionListingId);
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription plan not found" });
    }

    const now = new Date();
    let newStart: Date;

    // If membership hasn't expired, new start = old end (continuous)
    if (
      member.membershipEndDate &&
      member.membershipEndDate > now
    ) {
      newStart = new Date(member.membershipEndDate);
    } else {
      newStart = now;
    }

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + listing.durationInDays);

    member.subscriptionListingId = listing._id;
    member.membershipStartDate = newStart;
    member.membershipEndDate = newEnd;
    member.membershipStatus = MembershipStatus.ACTIVE;
    await member.save();

    // Create payment record if provided
    let paymentRecord = null;
    if (payment && payment.amount > 0) {
      const receiptNumber = await generateReceiptNumber(
        member.gymId.toString()
      );
      paymentRecord = await OfflinePayment.create({
        gymId: member.gymId,
        memberId: member._id,
        subscriptionListingId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: new Date(),
        paymentType: OfflinePaymentType.MEMBERSHIP_RENEWAL,
        receiptNumber,
        recordedBy: req.user?._id,
        status: OfflinePaymentStatus.COMPLETED,
      });
    }

    res.json({
      success: true,
      message: "Membership renewed successfully",
      data: { member, payment: paymentRecord },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Get expiring members (within N days)
export const getExpiringMembers = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const days = parseInt((req.query.days as string) || "7", 10);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const members = await GymMember.find({
      gymId,
      isActive: true,
      membershipStatus: MembershipStatus.ACTIVE,
      membershipEndDate: { $gte: now, $lte: futureDate },
    })
      .populate("subscriptionListingId", "name cost type")
      .sort({ membershipEndDate: 1 });

    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Quick search by phone or name
export const searchMembers = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const q = (req.query.q as string) || "";

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const members = await GymMember.find({
      gymId,
      isActive: true,
      $or: [
        { phone: { $regex: q } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select("name phone membershipNumber membershipStatus membershipEndDate")
      .sort({ name: 1 })
      .limit(10);

    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
