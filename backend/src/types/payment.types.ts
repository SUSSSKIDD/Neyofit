import { Types } from "mongoose";

export type PayoutStatusOnPayment = 'unpaid' | 'included' | 'paid';

export interface IPayment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  // Commission & payout fields
  gymId?: Types.ObjectId;
  gymOwnerId?: Types.ObjectId;
  commissionRate?: number;
  commissionAmount?: number;
  gymOwnerShare?: number;
  payoutId?: Types.ObjectId;
  payoutStatus?: PayoutStatusOnPayment;
  createdAt: Date;
  updatedAt: Date;
}
