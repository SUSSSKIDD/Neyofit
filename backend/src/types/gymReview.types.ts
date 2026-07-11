import { Document, Types } from "mongoose";

/**
 * Gym Review Interface
 */
export interface IGymReview extends Document {
	_id: Types.ObjectId;
	gymId: Types.ObjectId;           // Reference to the gym
	userId: Types.ObjectId;          // Reference to the user who wrote the review
	rating: number;                  // Rating (e.g., 1-5)
	comment?: string;                // Optional review text
	images?: Types.ObjectId[];       // Optional: references to GymPicture
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Request type for creating/updating a gym review
 */
export interface IGymReviewRequest {
	gymId: string;
	userId: string;
	rating: number;
	comment?: string;
	images?: string[];
}

/**
 * Response type for a gym review
 */
export interface IGymReviewResponse {
	id: string;
	gymId: string;
	userId: string;
	rating: number;
	comment?: string;
	images?: string[];
	createdAt: Date;
	updatedAt: Date;
}
