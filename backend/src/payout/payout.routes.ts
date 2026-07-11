import { Router } from "express";
import {
  getPayoutsDashboard,
  getAllPayouts,
  getPayoutById,
  createPayout,
  markPayoutCompleted,
  markPayoutFailed,
  getGymOwnerPayouts,
  getGymOwnerEarningsSummary,
} from "./payout.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeRoles } from "@/middleware/roleAuth";
import { UserType } from "@/types/user.types";

const router = Router();

// Gym owner routes (must be before /:id to avoid conflicts)
router.get("/my/history", authMiddleware, authorizeRoles([UserType.GYM]), getGymOwnerPayouts);
router.get("/my/summary", authMiddleware, authorizeRoles([UserType.GYM]), getGymOwnerEarningsSummary);

// Superadmin routes
router.get("/dashboard", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getPayoutsDashboard);
router.get("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getAllPayouts);
router.post("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), createPayout);
router.get("/:id", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getPayoutById);
router.patch("/:id/complete", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), markPayoutCompleted);
router.patch("/:id/fail", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), markPayoutFailed);

export const payoutRoutes = router;
