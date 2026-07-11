import { Request, Response, NextFunction } from "express";
import { Gym } from "@/gym/gym.model";
import { GymMember } from "@/gymMember/gymMember.model";
import { UserType } from "@/types/user.types";

/**
 * Middleware that verifies the authenticated user owns the gym specified by gymId.
 * Checks req.body.gymId, req.params.gymId, or req.query.gymId.
 * Superadmins bypass the check.
 */
export const verifyGymOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Superadmins can access any gym
    if (user.userType === UserType.SUPERADMIN) {
      return next();
    }

    const gymId =
      req.body.gymId || req.params.gymId || (req.query.gymId as string);

    if (!gymId) {
      return res
        .status(400)
        .json({ success: false, message: "Gym ID is required" });
    }

    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res
        .status(404)
        .json({ success: false, message: "Gym not found" });
    }

    if (gym.ownerId?.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. You do not own this gym." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Middleware that verifies gym ownership via a member record.
 * Looks up the member by req.params.id or req.params.memberId, gets its gymId,
 * then verifies the logged-in user owns that gym.
 */
export const verifyOwnershipViaMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (user.userType === UserType.SUPERADMIN) {
      return next();
    }

    const memberId = req.params.id || req.params.memberId;
    if (!memberId) {
      return res.status(400).json({ success: false, message: "Member ID is required" });
    }

    const member = await GymMember.findById(memberId).select("gymId");
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const gym = await Gym.findById(member.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }

    if (gym.ownerId?.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this gym." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Middleware that verifies gym ownership via a visit record.
 * Looks up the visit by req.params.visitId, gets its gymId, then verifies ownership.
 */
export const verifyOwnershipViaVisit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (user.userType === UserType.SUPERADMIN) {
      return next();
    }

    const visitId = req.params.visitId;
    if (!visitId) {
      return res.status(400).json({ success: false, message: "Visit ID is required" });
    }

    // Lazy import to avoid circular dependency
    const { Visit } = await import("@/visit/visit.model");
    const visit = await Visit.findById(visitId).select("gymId");
    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit not found" });
    }

    const gym = await Gym.findById(visit.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }

    if (gym.ownerId?.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this gym." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

/**
 * Middleware that verifies gym ownership via a payment record.
 * Looks up the payment by req.params.id, gets its gymId, then verifies ownership.
 */
export const verifyOwnershipViaPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (user.userType === UserType.SUPERADMIN) {
      return next();
    }

    const paymentId = req.params.id;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: "Payment ID is required" });
    }

    const { OfflinePayment } = await import("@/offlinePayment/offlinePayment.model");
    const payment = await OfflinePayment.findById(paymentId).select("gymId");
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const gym = await Gym.findById(payment.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Gym not found" });
    }

    if (gym.ownerId?.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. You do not own this gym." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
