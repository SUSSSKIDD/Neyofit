import { model, Schema } from "mongoose";
import { ILocation } from "@/types/location.types";
// Location Schema
const LocationSchema = new Schema<ILocation>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords: number[]) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
LocationSchema.index({ coordinates: '2dsphere' });

//Now, export the model that implements the schema
export const Location = model<ILocation>('Location', LocationSchema);

