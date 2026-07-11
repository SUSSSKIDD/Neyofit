import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";
import { verifyGymOwnership, verifyOwnershipViaMember } from "@/utils/gymOwnershipCheck";
import {
  createGymMember,
  getGymMembers,
  getGymMember,
  updateGymMember,
  deleteGymMember,
  freezeMembership,
  unfreezeMembership,
  renewMembership,
  getExpiringMembers,
  searchMembers,
} from "./gymMember.controllers";

const router = Router();

// All routes require auth + gym management role
router.use(authMiddleware, authorizeGymManagement);

// Create member (with optional inline payment)
router.post("/", verifyGymOwnership, createGymMember);

// List members for a gym (paginated, filterable)
router.get("/gym/:gymId", verifyGymOwnership, getGymMembers);

// Search members (quick phone/name search)
router.get("/gym/:gymId/search", verifyGymOwnership, searchMembers);

// Expiring members
router.get("/gym/:gymId/expiring", verifyGymOwnership, getExpiringMembers);

// Single member CRUD (verify ownership via member's gymId)
router.get("/:id", verifyOwnershipViaMember, getGymMember);
router.put("/:id", verifyOwnershipViaMember, updateGymMember);
router.delete("/:id", verifyOwnershipViaMember, deleteGymMember);

// Membership lifecycle (verify ownership via member's gymId)
router.post("/:id/freeze", verifyOwnershipViaMember, freezeMembership);
router.post("/:id/unfreeze", verifyOwnershipViaMember, unfreezeMembership);
router.post("/:id/renew", verifyOwnershipViaMember, renewMembership);

export default router;
