import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";
import { verifyGymOwnership, verifyOwnershipViaVisit, verifyOwnershipViaMember } from "@/utils/gymOwnershipCheck";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getCurrentlyInGym,
  getVisitHistory,
  getMemberVisits,
  getVisitStats,
} from "./visit.controllers";

const router = Router();

// All routes require auth + gym management role
router.use(authMiddleware, authorizeGymManagement);

// Check in / check out
router.post("/check-in", verifyGymOwnership, checkIn);
router.post("/check-out/:visitId", verifyOwnershipViaVisit, checkOut);

// Gym-level queries
router.get("/gym/:gymId/today", verifyGymOwnership, getTodayAttendance);
router.get("/gym/:gymId/currently-in", verifyGymOwnership, getCurrentlyInGym);
router.get("/gym/:gymId", verifyGymOwnership, getVisitHistory);
router.get("/gym/:gymId/stats", verifyGymOwnership, getVisitStats);

// Member-level query (verify ownership via member's gymId)
router.get("/member/:memberId", verifyOwnershipViaMember, getMemberVisits);

export default router;
