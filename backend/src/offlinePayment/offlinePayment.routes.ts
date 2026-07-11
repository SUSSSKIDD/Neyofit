import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";
import { verifyGymOwnership, verifyOwnershipViaMember, verifyOwnershipViaPayment } from "@/utils/gymOwnershipCheck";
import {
  createOfflinePayment,
  getGymPayments,
  getMemberPayments,
  getRevenueSummary,
  refundPayment,
} from "./offlinePayment.controllers";

const router = Router();

// All routes require auth + gym management role
router.use(authMiddleware, authorizeGymManagement);

// Record payment
router.post("/", verifyGymOwnership, createOfflinePayment);

// Gym payments (paginated, date filter)
router.get("/gym/:gymId", verifyGymOwnership, getGymPayments);

// Revenue summary
router.get("/gym/:gymId/summary", verifyGymOwnership, getRevenueSummary);

// Member payments (verify ownership via member's gymId)
router.get("/member/:memberId", verifyOwnershipViaMember, getMemberPayments);

// Refund (verify ownership via payment's gymId)
router.post("/:id/refund", verifyOwnershipViaPayment, refundPayment);

export default router;
