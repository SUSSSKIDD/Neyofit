import { Document, Types } from "mongoose";
import { IUser } from "./user.types";
import { ISubscriptionListing } from "./subscriptionListing.types";

// Enum for subscription status
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PENDING = "pending"
}

// User Subscription Model
export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  subscriptionListingId: Types.ObjectId | ISubscriptionListing;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request to subscribe
export interface ISubscribeRequest {
  subscriptionListingId: string;
  isRecurring?: boolean;
}

// Response after subscribing
export interface ISubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    subscription: ISubscription;
  };
}

// For listing user subscriptions
export interface IUserSubscriptionListResponse {
  success: boolean;
  data: ISubscription[];
}