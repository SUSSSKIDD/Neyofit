import { Schema, model } from "mongoose";
import { IPlatformSettings, PayoutSchedule } from "@/types/payout.types";

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    defaultCommissionRate: { type: Number, required: true, default: 15 },
    defaultPayoutSchedule: {
      type: String,
      enum: Object.values(PayoutSchedule),
      default: PayoutSchedule.MONTHLY,
    },
    minimumPayoutAmount: { type: Number, required: true, default: 500 },
    isAutoPayout: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PlatformSettings = model<IPlatformSettings>(
  "PlatformSettings",
  platformSettingsSchema
);

// Helper to get or create the singleton settings document
export async function getOrCreateSettings(): Promise<IPlatformSettings> {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({
      defaultCommissionRate: 15,
      defaultPayoutSchedule: PayoutSchedule.MONTHLY,
      minimumPayoutAmount: 500,
      isAutoPayout: false,
    });
  }
  return settings;
}
