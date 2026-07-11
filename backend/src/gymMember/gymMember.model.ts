import { Schema, model } from "mongoose";
import {
  IGymMember,
  MembershipStatus,
  MemberType,
  MemberSource,
} from "@/types/gymMember.types";

const FreezeRecordSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  { _id: false }
);

const GymMemberSchema = new Schema<IGymMember>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: { type: Date },
    emergencyContact: { type: EmergencyContactSchema },
    membershipNumber: {
      type: String,
      required: true,
      unique: true,
    },
    subscriptionListingId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionListing",
    },
    membershipStartDate: { type: Date },
    membershipEndDate: { type: Date },
    membershipStatus: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },
    memberType: {
      type: String,
      enum: Object.values(MemberType),
      default: MemberType.REGULAR,
    },
    source: {
      type: String,
      enum: Object.values(MemberSource),
      default: MemberSource.WALK_IN,
    },
    freezeHistory: [FreezeRecordSchema],
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique phone per gym
GymMemberSchema.index({ gymId: 1, phone: 1 }, { unique: true });
// Expiry queries
GymMemberSchema.index({ gymId: 1, membershipStatus: 1, membershipEndDate: 1 });
// Member listing
GymMemberSchema.index({ gymId: 1, isActive: 1 });
// App-linked members (sparse: only index documents where userId exists)
GymMemberSchema.index({ userId: 1 }, { sparse: true });

export const GymMember = model<IGymMember>("GymMember", GymMemberSchema);
