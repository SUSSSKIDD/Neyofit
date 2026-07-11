import { Schema, model } from "mongoose";
import {
  IOfflinePayment,
  PaymentMethod,
  OfflinePaymentType,
  OfflinePaymentStatus,
} from "@/types/offlinePayment.types";

const OfflinePaymentSchema = new Schema<IOfflinePayment>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "GymMember",
      required: true,
    },
    subscriptionListingId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionListing",
    },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    transactionReference: { type: String },
    paymentDate: { type: Date, default: Date.now },
    paymentType: {
      type: String,
      enum: Object.values(OfflinePaymentType),
      required: true,
    },
    receiptNumber: { type: String, required: true, unique: true },
    notes: { type: String },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(OfflinePaymentStatus),
      default: OfflinePaymentStatus.COMPLETED,
    },
  },
  { timestamps: true }
);

// Payment listing
OfflinePaymentSchema.index({ gymId: 1, paymentDate: -1 });
// Member payments
OfflinePaymentSchema.index({ memberId: 1, paymentDate: -1 });
// Revenue analytics
OfflinePaymentSchema.index({ gymId: 1, paymentDate: 1, paymentMethod: 1 });

export const OfflinePayment = model<IOfflinePayment>(
  "OfflinePayment",
  OfflinePaymentSchema
);
