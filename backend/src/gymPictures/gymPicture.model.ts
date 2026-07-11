import { Schema, model } from "mongoose";
import { IGymPicture } from "@/types/gymPicture.types";

const GymPictureSchema = new Schema<IGymPicture>({
	gymId: { type: Schema.Types.ObjectId, ref: "Gym", required: true },
	filePath: { type: String, required: false },
	fileName: { type: String, required: false },
	imageUrl: { type: String, required: false },
	imageType: { type: String, required: true },
	imageSize: { type: Number, required: false, default: 0 },
	caption: { type: String },
	altText: { type: String },
	uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
	isCover: { type: Boolean, default: false }
}, {
	timestamps: true
});

GymPictureSchema.index({ gymId: 1 });

export const GymPicture = model<IGymPicture>("GymPicture", GymPictureSchema);
