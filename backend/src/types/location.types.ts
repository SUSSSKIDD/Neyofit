import {Types, Document} from "mongoose"

// Location Interface
export interface ILocation extends Document {
  _id: Types.ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  //Now, coordinates in GeoJSON Point Formnat
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}
