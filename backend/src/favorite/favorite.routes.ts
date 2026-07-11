import { Router } from "express";
import { toggleFavorite, getUserFavorites, checkFavorite, removeFavorite } from "./favorite.controllers";
import { authMiddleware } from "@/auth/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Toggle favorite (add/remove)
router.post("/toggle", toggleFavorite);

// Get all user favorites
router.get("/", getUserFavorites);

// Check if a specific gym is favorited
router.get("/check/:gymId", checkFavorite);

// Remove a specific favorite
router.delete("/:gymId", removeFavorite);

export default router;
