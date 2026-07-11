import mongoose, { Schema } from 'mongoose';
import { IGymReview } from '../types/gymReview.types';

const gymReviewSchema = new Schema<IGymReview>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: false
    },
    images: [{
      type: Schema.Types.ObjectId,
      ref: 'GymPicture',
      required: false
    }]
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one review per user per gym
gymReviewSchema.index({ gymId: 1, userId: 1 }, { unique: true });

// Index for efficient queries by gym
gymReviewSchema.index({ gymId: 1 });

export const GymReview = mongoose.model<IGymReview>('GymReview', gymReviewSchema);
