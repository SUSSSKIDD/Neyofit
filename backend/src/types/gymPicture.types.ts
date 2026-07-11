
import { Document, Types } from "mongoose";

/**
 * Enum for supported image MIME types
 */
export enum GymPictureMimeType {
  JPEG = "image/jpeg",
  JPG = "image/jpg",
  PNG = "image/png",
  GIF = "image/gif",
  WEBP = "image/webp",
  BMP = "image/bmp",
  SVG = "image/svg+xml",
  TIFF = "image/tiff",
  HEIC = "image/heic",
  HEIF = "image/heif"
}

/**
 * Gym Picture Interface (with image data stored in MongoDB)
 */
export interface IGymPicture extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;           // Reference to the gym
  filePath?: string;               // Path to the file on disk
  fileName?: string;               // Name of the file on disk
  imageUrl?: string;               // URL for external images (optional)
  imageType: GymPictureMimeType;   // MIME type, e.g. 'image/png'
  imageSize?: number;              // Size in bytes (optional for URL-based)
  caption?: string;                // Optional caption or description
  altText?: string;                // Alternative text for accessibility
  uploadedBy?: Types.ObjectId;     // (Optional) Reference to user who uploaded
  isCover?: boolean;               // Is this the cover/main picture?
  createdAt: Date;
  updatedAt: Date;
}


/**
 * Request type for uploading a gym picture (with image data as base64 or Buffer)
 */
export interface IGymPictureUploadRequest {
  gymId: string;
  filePath: string;
  fileName: string;
  imageType: string;
  imageSize: number;
  caption?: string;
  isCover?: boolean;
}


/**
 * Response type for a gym picture (with image metadata)
 */
export interface IGymPictureResponse {
  id: string;
  gymId: string;
  imageType: string;
  imageSize: number;
  caption?: string;
  isCover?: boolean;
  createdAt: Date;
  updatedAt: Date;
}