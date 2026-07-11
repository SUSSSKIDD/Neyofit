import { Document, Types } from "mongoose";

export enum PaymentMethod {
  CASH = "cash",
  UPI = "upi",
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
  OTHER = "other",
}

export enum OfflinePaymentType {
  MEMBERSHIP_NEW = "membership_new",
  MEMBERSHIP_RENEWAL = "membership_renewal",
  DAY_PASS = "day_pass",
  PERSONAL_TRAINING = "personal_training",
  OTHER = "other",
}

export enum OfflinePaymentStatus {
  COMPLETED = "completed",
  REFUNDED = "refunded",
  PARTIAL = "partial",
}

export interface IOfflinePayment extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  subscriptionListingId?: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paymentDate: Date;
  paymentType: OfflinePaymentType;
  receiptNumber: string;
  notes?: string;
  recordedBy?: Types.ObjectId;
  status: OfflinePaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOfflinePaymentRequest {
  gymId: string;
  memberId: string;
  subscriptionListingId?: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentDate?: string;
  paymentType: string;
  notes?: string;
}

export interface IRefundRequest {
  notes?: string;
}
