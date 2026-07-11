import { model, Schema } from "mongoose";
import { IGym, IGymFacility } from "@/types/gym.types";
//GymFacility Schema
const GymFacilitySchema = new Schema<IGymFacility>({
  name:{
    type: String,
    trim: true,
    required: true
  }
})
// Gym Schema
const GymSchema = new Schema<IGym>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  facilities: [{
    type: Schema.Types.ObjectId,
    ref: 'GymFacility',
    required: false
  }],
  similarGyms:[{
        type: Schema.Types.ObjectId,
        ref: 'Gym',
        required: false
    }],
  contact: {
    phone: String,
    email: String,
    website: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  priceRange: {
    type: String,
    enum: ['budget', 'mid-range', 'premium']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  commissionRate: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  payoutSchedule: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: null
  },
  subscriptionListings:[{
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionListing',
    required: false
  }],
  pictures:[{
    type: Schema.Types.ObjectId,
    ref: 'GymPicture',
    required: false
  }]
}, {
  timestamps: true
});

// Index on locationId for faster joins
GymSchema.index({ locationId: 1 });
GymSchema.index({ isActive: 1 });
GymSchema.index({ status: 1 });

export const GymFacility = model<IGymFacility>('GymFacility', GymFacilitySchema)
export const Gym = model<IGym>('Gym', GymSchema);
