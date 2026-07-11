import { Schema, model } from "mongoose";
import { IGymSlot } from "@/types/gymSlot.types";

const TimeSlotSchema = new Schema({
  id: { type: String, required: true }, // Unique identifier for the slot
  name: { type: String, required: true }, // Display name for the slot
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  maxCapacity: { type: Number, default: 10 },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const GymSlotSchema = new Schema<IGymSlot>({
  gymId: { 
    type: Schema.Types.ObjectId, 
    ref: "Gym", 
    required: true 
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  slots: [TimeSlotSchema],
  isClosed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Compound index for efficient queries
GymSlotSchema.index({ gymId: 1, dayOfWeek: 1 }, { unique: true });

export const GymSlot = model<IGymSlot>("GymSlot", GymSlotSchema);
