import { Request, Response } from "express";
import { PlatformSettings, getOrCreateSettings } from "./platformSettings.model";
import logger from "@/utils/logger";

// GET /platform-settings
export const getPlatformSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error(`Failed to get platform settings: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to get platform settings" });
  }
};

// PATCH /platform-settings
export const updatePlatformSettings = async (req: Request, res: Response) => {
  try {
    const { defaultCommissionRate, defaultPayoutSchedule, minimumPayoutAmount, isAutoPayout } = req.body;

    const settings = await getOrCreateSettings();

    if (defaultCommissionRate !== undefined) {
      if (defaultCommissionRate < 0 || defaultCommissionRate > 100) {
        return res.status(400).json({ success: false, message: "Commission rate must be between 0 and 100" });
      }
      settings.defaultCommissionRate = defaultCommissionRate;
    }
    if (defaultPayoutSchedule !== undefined) settings.defaultPayoutSchedule = defaultPayoutSchedule;
    if (minimumPayoutAmount !== undefined) settings.minimumPayoutAmount = minimumPayoutAmount;
    if (isAutoPayout !== undefined) settings.isAutoPayout = isAutoPayout;

    await settings.save();

    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error(`Failed to update platform settings: ${(error as Error).message}`, error as Error);
    res.status(500).json({ success: false, message: "Failed to update platform settings" });
  }
};
