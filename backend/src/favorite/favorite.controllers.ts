import { Request, Response } from "express";
import { Favorite } from "./favorite.model";

// Toggle favorite (add if not exists, remove if exists)
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({ success: false, message: "gymId is required" });
    }

    const existing = await Favorite.findOne({ userId, gymId });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ success: true, message: "Removed from favorites", data: { isFavorite: false } });
    }

    await Favorite.create({ userId, gymId });
    res.status(201).json({ success: true, message: "Added to favorites", data: { isFavorite: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: (error as Error).message });
  }
};

// Get user's favorites
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const favorites = await Favorite.find({ userId })
      .populate("gymId", "name location pictures status")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: (error as Error).message });
  }
};

// Check if a gym is favorited
export const checkFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { gymId } = req.params;

    const existing = await Favorite.findOne({ userId, gymId });
    res.json({ success: true, data: { isFavorite: !!existing } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: (error as Error).message });
  }
};

// Remove favorite
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { gymId } = req.params;

    await Favorite.deleteOne({ userId, gymId });
    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: (error as Error).message });
  }
};
