import { Document, Types } from "mongoose";

export enum MembershipStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  FROZEN = "frozen",
  CANCELLED = "cancelled",
  TRIAL = "trial",
}

export enum MemberType {
  REGULAR = "regular",
  TRIAL = "trial",
  GUEST = "guest",
  COMPLIMENTARY = "complimentary",
}

export enum MemberSource {
  WALK_IN = "walk_in",
  REFERRAL = "referral",
  ONLINE = "online",
  PHONE_INQUIRY = "phone_inquiry",
  OTHER = "other",
}

export interface IFreezeRecord {
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface IGymMember extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: Date;
  emergencyContact?: IEmergencyContact;
  membershipNumber: string;
  subscriptionListingId?: Types.ObjectId;
  membershipStartDate?: Date;
  membershipEndDate?: Date;
  membershipStatus: MembershipStatus;
  memberType: MemberType;
  source: MemberSource;
  freezeHistory: IFreezeRecord[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateGymMemberRequest {
  gymId: string;
  name: string;
  phone: string;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  emergencyContact?: IEmergencyContact;
  subscriptionListingId?: string;
  membershipStartDate?: string;
  memberType?: MemberType;
  source?: MemberSource;
  notes?: string;
  payment?: {
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  };
}

export interface IRenewMemberRequest {
  subscriptionListingId: string;
  payment?: {
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  };
}

export interface IFreezeMemberRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}
