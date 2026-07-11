import { Schema, model } from "mongoose";
import { IVisit } from "@/types/visit.types";

const VisitSchema = new Schema<IVisit>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "GymMember",
      required: true,
    },
    checkInTime: { type: Date, required: true, default: Date.now },
    checkOutTime: { type: Date, default: null },
    notes: { type: String },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Today's attendance
VisitSchema.index({ gymId: 1, checkInTime: -1 });
// Member visit history
VisitSchema.index({ memberId: 1, checkInTime: -1 });
// Currently in gym
VisitSchema.index({ gymId: 1, checkOutTime: 1 });

export const Visit = model<IVisit>("Visit", VisitSchema);
