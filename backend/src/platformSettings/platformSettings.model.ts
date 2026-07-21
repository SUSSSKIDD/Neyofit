import { Schema, model } from "mongoose";
import { IPlatformSettings, PayoutSchedule, TimeFormat } from "@/types/payout.types";

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
    timeFormat: {
      type: String,
      enum: Object.values(TimeFormat),
      default: TimeFormat.TWENTY_FOUR_HOUR,
    },
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
      timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
    });
  }
  return settings;
}
