import { Schema, model } from "mongoose";
import { IPayout, PayoutStatus } from "@/types/payout.types";

const payoutSchema = new Schema<IPayout>(
  {
    gymOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    paymentIds: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
      required: true,
    },
    paymentMethod: { type: String },
    transactionReference: { type: String },
    notes: { type: String },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

payoutSchema.index({ gymOwnerId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

export const Payout = model<IPayout>("Payout", payoutSchema);
