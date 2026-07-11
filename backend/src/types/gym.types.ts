import {Document, Types} from "mongoose"

// Gym Interface
// Time slot interface for individual slots
export interface ITimeSlot {
  id: string;
  name: string; // e.g., "Morning", "Evening", "Afternoon", "Pre-Morning"
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isActive: boolean;
}

// Day schedule interface
export interface IDaySchedule {
  isClosed: boolean;
  slots: ITimeSlot[];
}

// Opening hours interface with dynamic slots
export interface IOpeningHours {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

export interface IGym extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  locationId: Types.ObjectId;
  ownerId?: Types.ObjectId; // Gym owner (employee) who created this gym
  facilities?: Types.ObjectId[];
  similarGyms?: Types.ObjectId[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rating?: number;
  priceRange?: 'budget' | 'mid-range' | 'premium';
  subscriptionListings?: Types.ObjectId[];
  pictures: Types.ObjectId[];
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  commissionRate?: number | null;
  payoutSchedule?: 'weekly' | 'biweekly' | 'monthly' | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IGymFacility extends Document {
    _id: Types.ObjectId;
    name: string;
}