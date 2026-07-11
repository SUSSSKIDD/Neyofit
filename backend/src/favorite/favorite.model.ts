import { Schema, model, Types } from "mongoose";

export interface IFavorite {
  userId: Types.ObjectId;
  gymId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gymId: { type: Schema.Types.ObjectId, ref: "Gym", required: true },
  },
  { timestamps: true }
);

// One favorite per user per gym
favoriteSchema.index({ userId: 1, gymId: 1 }, { unique: true });

export const Favorite = model<IFavorite>("Favorite", favoriteSchema);
