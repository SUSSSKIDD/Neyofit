import { Router } from "express";
import { getPlatformSettings, updatePlatformSettings } from "./platformSettings.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeRoles } from "@/middleware/roleAuth";
import { UserType } from "@/types/user.types";

const router = Router();

router.get("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getPlatformSettings);
router.patch("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), updatePlatformSettings);

export const platformSettingsRoutes = router;
