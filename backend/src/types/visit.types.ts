import { Document, Types } from "mongoose";

export interface IVisit extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  checkInTime: Date;
  checkOutTime?: Date;
  notes?: string;
  checkedInBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckInRequest {
  gymId: string;
  memberId: string;
  notes?: string;
}

export interface ICheckOutRequest {
  notes?: string;
}
