import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { GymPicture } from "./gymPicture.model";
import { IGymPicture } from "@/types/gymPicture.types";
import { Gym } from "@/gym/gym.model";
import { compressImage } from "@/utils/imageProcessor";
// Build a stable image URL using the API endpoint (works in both local and Docker)
function toImageUrl(req: Request, pictureId: string, imageUrl?: string): string {
	if (imageUrl) return imageUrl;
	// Use PUBLIC_API_URL env var to avoid mixed-content issues when nginx terminates SSL
	// (without it, req.protocol would be "http" inside the container even when the site is HTTPS)
	const base = process.env.PUBLIC_API_URL ||
		`${req.get("x-forwarded-proto") || req.protocol}://${req.get("x-forwarded-host") || req.get("host")}`;
	return `${base}/api/v1/gym-pictures/${pictureId}/image`;
}

// Create gym picture from URL
export const createGymPictureFromUrl = async (
	req: Request,
	res: Response<{ success: boolean; picture?: Partial<IGymPicture>; error?: string }>
) => {
	try {
		const { gymId, imageUrl, caption, altText, isCover } = req.body;

		if (!gymId || !imageUrl) {
			return res.status(400).json({ success: false, error: "Missing gymId or imageUrl" });
		}

		const picture = await GymPicture.create({
			gymId,
			imageUrl,
			imageType: "image/jpeg",
			imageSize: 0,
			caption,
			altText,
			isCover,
		});

		await Gym.findByIdAndUpdate(
			gymId,
			{ $push: { pictures: picture._id } },
			{ new: true }
		);

		res.status(201).json({ success: true, picture: picture.toObject() });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

// Upload a new gym picture (disk storage via multer)
export const createGymPicture = async (
	req: Request,
	res: Response<{ success: boolean; picture?: Partial<IGymPicture>; error?: string }>
) => {
	try {
		const file = req.file;
		const { gymId, caption, isCover } = req.body;
		if (!file || !gymId) {
			return res.status(400).json({ success: false, error: "Missing required fields" });
		}

		// Compress the uploaded image
		const compressed = await compressImage(file.path);

		const picture = await GymPicture.create({
			gymId,
			filePath: file.path,
			fileName: file.filename,
			imageType: file.mimetype,
			imageSize: compressed.size,
			caption,
			isCover,
		});

		await Gym.findByIdAndUpdate(
			gymId,
			{ $push: { pictures: picture._id } },
			{ new: true }
		);

		res.status(201).json({ success: true, picture: picture.toObject() });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

// Get gym picture metadata by ID
export const getGymPictureMetadata = async (
	req: Request<{ id: string }>,
	res: Response<{ success: boolean; picture?: IGymPicture; error?: string }>
) => {
	try {
		const picture = await GymPicture.findById(req.params.id);
		if (!picture) return res.status(404).json({ success: false, error: "Picture not found" });
		res.json({ success: true, picture });
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};

// Get the image file itself
export const getGymPictureImage = async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const picture = await GymPicture.findById(req.params.id);
		if (!picture) return res.status(404).send("Image not found");

		// If it's a URL-based image, redirect to the URL
		if (picture.imageUrl) {
			return res.redirect(picture.imageUrl);
		}

		// Serve from disk
		if (!picture.filePath) {
			return res.status(404).send("Image file not found");
		}

		res.set("Content-Type", picture.imageType);
		res.sendFile(path.resolve(picture.filePath));
	} catch (error) {
		res.status(500).send("Error retrieving image");
	}
};

// Delete a gym picture
export const deleteGymPicture = async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const picture = await GymPicture.findByIdAndDelete(req.params.id);
		if (!picture) return res.status(404).json({ success: false, error: "Picture not found" });

		// Delete file from disk if it exists
		if (picture.filePath) {
			try {
				await fs.unlink(picture.filePath);
			} catch {
				// File may have been already deleted, ignore
			}
		}

		// Remove picture reference from gym
		await Gym.findByIdAndUpdate(
			picture.gymId,
			{ $pull: { pictures: picture._id } }
		);

		res.json({ success: true, data: { message: "Picture deleted" } });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};

// List all pictures for a gym (metadata only)
export const listGymPictures = async (
	req: Request<{ gymId: string }>,
	res: Response
) => {
	try {
		const pictures = await GymPicture.find({ gymId: req.params.gymId });
		const data = pictures.map(p => {
			const obj = p.toObject();
			return { ...obj, imageUrl: toImageUrl(req, obj._id.toString(), obj.imageUrl) };
		});
		res.json({ success: true, data });
	} catch (error) {
		res.status(500).json({ success: false, error: (error as Error).message });
	}
};

// Get metadata for all images in the database (with pagination)
export const listAllGymPictures = async (
	req: Request<{}, {}, {}, { limit?: string; skip?: string }>,
	res: Response<{ success: boolean; total: number; pictures: Partial<IGymPicture>[]; error?: string }>
) => {
	try {
		const limit = req.query.limit ? parseInt(req.query.limit) : 20;
		const skip = req.query.skip ? parseInt(req.query.skip) : 0;
		const total = await GymPicture.countDocuments();
		const pictures = await GymPicture.find()
			.skip(skip)
			.limit(limit);
		res.json({ success: true, total, pictures });
	} catch (error) {
		res.status(500).json({ success: false, total: 0, pictures: [], error: (error as Error).message });
	}
};

// Bulk upload multiple gym pictures
export const bulkUploadGymPictures = async (
	req: Request,
	res: Response
) => {
	try {
		const files = req.files as Express.Multer.File[];
		const { gymId, captions, isCover } = req.body;

		if (!files || !Array.isArray(files) || files.length === 0) {
			return res.status(400).json({ success: false, error: "No files provided" });
		}

		if (!gymId) {
			return res.status(400).json({ success: false, error: "Gym ID is required" });
		}

		const captionsArray = captions ? JSON.parse(captions) : [];
		const isCoverArray = isCover ? JSON.parse(isCover) : [];

		const pictures = [];
		const pictureIds = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Compress each uploaded image
			const compressed = await compressImage(file.path);

			const picture = await GymPicture.create({
				gymId,
				filePath: file.path,
				fileName: file.filename,
				imageType: file.mimetype,
				imageSize: compressed.size,
				caption: captionsArray[i] || '',
				isCover: isCoverArray[i] || false,
			});

			pictureIds.push(picture._id);
			pictures.push(picture.toObject());
		}

		// Update gym with all picture IDs
		await Gym.findByIdAndUpdate(
			gymId,
			{ $push: { pictures: { $each: pictureIds } } },
			{ new: true }
		);

		// Add imageUrl to each picture for frontend consumption
		const picturesWithUrls = pictures.map(p => ({
			...p,
			imageUrl: toImageUrl(req, p._id.toString(), p.imageUrl),
		}));

		res.status(201).json({ success: true, data: { uploaded: pictures.length, pictures: picturesWithUrls } });
	} catch (error) {
		res.status(400).json({ success: false, error: (error as Error).message });
	}
};
