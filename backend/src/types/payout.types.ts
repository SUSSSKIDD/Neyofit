import { Document, Types } from "mongoose";

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum PayoutSchedule {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
}

export enum TimeFormat {
  TWELVE_HOUR = "12h",
  TWENTY_FOUR_HOUR = "24h",
}

export interface IPayout extends Document {
  _id: Types.ObjectId;
  gymOwnerId: Types.ObjectId;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  paymentIds: Types.ObjectId[];
  status: PayoutStatus;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformSettings extends Document {
  _id: Types.ObjectId;
  defaultCommissionRate: number;
  defaultPayoutSchedule: PayoutSchedule;
  minimumPayoutAmount: number;
  isAutoPayout: boolean;
  timeFormat: TimeFormat;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
  isVerified: boolean;
}
