import { Document, Types } from "mongoose";

export interface ITimeSlot {
  id: string; // Unique identifier for the slot
  name: string; // Display name for the slot (e.g., "Morning", "Evening")
  startTime: string; // Format: "09:00"
  endTime: string;   // Format: "17:00"
  maxCapacity?: number;
  price?: number;
  isActive?: boolean;
}

export interface IGymSlot extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  slots: ITimeSlot[];
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateGymSlot {
  gymId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  slots: ITimeSlot[];
  isClosed: boolean;
}

export interface IUpdateGymSlot {
  slots?: ITimeSlot[];
  isClosed?: boolean;
}
