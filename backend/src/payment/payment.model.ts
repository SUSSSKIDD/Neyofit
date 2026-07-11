import { Schema, model, Types } from 'mongoose';

import { IPayment } from '@/types/payment.types';

// const PaymentSchema = new Schema<IPayment>({
//   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
//   razorpayOrderId: { type: String, required: true },
//   razorpayPaymentId: { type: String },
//   razorpaySignature: { type: String },
//   amount: { type: Number, required: true },
//   currency: { type: String, required: true },
//   status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' }
// }, {
//   timestamps: true
// });

const paymentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  subscriptionId: { type: Types.ObjectId, ref: "Subscription", required: false },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ["created", "paid", "failed"], required: true },
  // Commission & payout fields
  gymId: { type: Types.ObjectId, ref: "Gym" },
  gymOwnerId: { type: Types.ObjectId, ref: "User" },
  commissionRate: { type: Number },
  commissionAmount: { type: Number },
  gymOwnerShare: { type: Number },
  payoutId: { type: Types.ObjectId, ref: "Payout" },
  payoutStatus: { type: String, enum: ["unpaid", "included", "paid"], default: "unpaid" },
}, {
  timestamps: true
});

paymentSchema.index({ gymOwnerId: 1, status: 1, payoutStatus: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
