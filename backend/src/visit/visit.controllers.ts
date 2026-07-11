import { Request, Response } from "express";
import { Visit } from "./visit.model";
import { GymMember } from "@/gymMember/gymMember.model";
import { MembershipStatus } from "@/types/gymMember.types";
import { ICheckInRequest } from "@/types/visit.types";

// Check in a member
export const checkIn = async (
  req: Request<{}, {}, ICheckInRequest>,
  res: Response
) => {
  try {
    const { gymId, memberId, notes } = req.body;

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

    // Warn if membership expired (but allow check-in)
    let warning: string | undefined;
    if (member.membershipStatus === MembershipStatus.EXPIRED) {
      warning = "Member's membership has expired";
    } else if (member.membershipStatus === MembershipStatus.FROZEN) {
      warning = "Member's membership is frozen";
    } else if (
      member.membershipEndDate &&
      member.membershipEndDate < new Date()
    ) {
      // Auto-expire
      member.membershipStatus = MembershipStatus.EXPIRED;
      await member.save();
      warning = "Member's membership has expired";
    }

    // Check for existing open check-in (no check-out yet)
    const openVisit = await Visit.findOne({
      memberId,
      gymId,
      checkOutTime: null,
    });
    if (openVisit) {
      return res.status(400).json({
        success: false,
        message: "Member is already checked in. Please check out first.",
        data: openVisit,
      });
    }

    const visit = await Visit.create({
      gymId,
      memberId,
      checkInTime: new Date(),
      notes,
      checkedInBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      warning,
      data: visit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Check out
export const checkOut = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    if (visit.checkOutTime) {
      return res
        .status(400)
        .json({ success: false, message: "Already checked out" });
    }

    visit.checkOutTime = new Date();
    if (req.body.notes) visit.notes = req.body.notes;
    await visit.save();

    res.json({
      success: true,
      message: "Check-out successful",
      data: visit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Today's attendance
export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const visits = await Visit.find({
      gymId,
      checkInTime: { $gte: todayStart, $lte: todayEnd },
    })
      .populate("memberId", "name phone membershipNumber membershipStatus")
      .sort({ checkInTime: -1 });

    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Currently in gym (checked in, not checked out)
export const getCurrentlyInGym = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;

    const visits = await Visit.find({
      gymId,
      checkOutTime: null,
    })
      .populate("memberId", "name phone membershipNumber membershipStatus")
      .sort({ checkInTime: -1 });

    res.json({ success: true, data: visits, count: visits.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Visit history (with date range filter)
export const getVisitHistory = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;
    const {
      startDate,
      endDate,
      page = "1",
      limit = "50",
    } = req.query;

    const filter: any = { gymId };
    if (startDate || endDate) {
      filter.checkInTime = {};
      if (startDate) filter.checkInTime.$gte = new Date(startDate as string);
      if (endDate) filter.checkInTime.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100); // Cap at 100

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .populate("memberId", "name phone membershipNumber")
        .sort({ checkInTime: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Visit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        visits,
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

// Member's visit history
export const getMemberVisits = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    const visits = await Visit.find({ memberId })
      .sort({ checkInTime: -1 })
      .limit(50);

    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

// Visit stats (daily/weekly/monthly counts)
export const getVisitStats = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);

    const [todayCount, weekCount, monthCount, currentlyIn] = await Promise.all([
      Visit.countDocuments({
        gymId,
        checkInTime: { $gte: todayStart },
      }),
      Visit.countDocuments({
        gymId,
        checkInTime: { $gte: weekStart },
      }),
      Visit.countDocuments({
        gymId,
        checkInTime: { $gte: monthStart },
      }),
      Visit.countDocuments({
        gymId,
        checkOutTime: null,
      }),
    ]);

    res.json({
      success: true,
      data: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        currentlyIn,
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
