import { Types, Document } from "mongoose"
import { Currency } from "@/types/currency.types";

export enum SubscriptionListingType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// Location Interface
export interface ISubscriptionListing extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  type: SubscriptionListingType;
  customTypeText?: string; // Custom text when type is 'custom'
  durationInDays: number;
  gymId: Types.ObjectId;
  cost: number;
  currency: Currency;
  discount?: {
    amount: number;
    type: 'percentage' | 'fixed';
    validUntil?: Date;
  };
  isActive: boolean; // For toggling availability
  isRecurring?: boolean; // For recurring vs one-time
  features?: string[]; // Optional: list of included features
  startDate?: Date; // For custom/limited subscriptions
  endDate?: Date;   // For custom/limited subscriptions
  createdAt: Date;
  updatedAt: Date;
}
