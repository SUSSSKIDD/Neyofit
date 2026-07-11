

import { listAllGymPictures } from "./gymPicture.controllers";
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
	createGymPicture,
	createGymPictureFromUrl,
	getGymPictureMetadata,
	getGymPictureImage,
	deleteGymPicture,
	listGymPictures,
	bulkUploadGymPictures
} from "./gymPicture.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";
import { gymPictureUpload } from "@/config/upload.config";
import { APIError } from "@/utils/APIError";

// Converts multer errors into APIError so the global error handler processes them
// consistently — same pattern used across all other services
function handleUpload(handler: ReturnType<typeof gymPictureUpload.array> | ReturnType<typeof gymPictureUpload.single>) {
	return (req: Request, _res: Response, next: NextFunction) => {
		handler(req, _res, (err: any) => {
			if (!err) return next();
			if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
				return next(APIError.BadRequest("File too large. Maximum allowed size is 10MB per image.", "FILE_TOO_LARGE"));
			}
			// fileFilter rejections (invalid type) and other multer errors
			return next(APIError.BadRequest(err.message, "UPLOAD_ERROR"));
		});
	};
}

const router = Router();

/**
 * @swagger
 * /api/v1/gym-pictures:
 *   get:
 *     tags: [Pictures]
 *     summary: Get metadata for all gym images
 *     description: Retrieves a paginated list of all gym picture metadata from the database
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of images to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of images to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved gym pictures
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 pictures:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GymPicture'
 */
router.get("/", listAllGymPictures);

/**
 * @swagger
 * /api/v1/gym-pictures:
 *   post:
 *     tags: [Pictures]
 *     summary: Upload a new gym picture
 *     description: Upload a new picture for a gym with metadata
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gymId
 *               - imageData
 *             properties:
 *               gymId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the gym this picture belongs to
 *               caption:
 *                 type: string
 *                 description: Optional caption for the image
 *               isCover:
 *                 type: boolean
 *                 description: Whether this image should be the gym's cover photo
 *                 default: false
 *               imageData:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       201:
 *         description: Picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GymPicture'
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.post("/", authMiddleware, authorizeGymManagement, handleUpload(gymPictureUpload.single("imageData")), createGymPicture);

/**
 * @swagger
 * /api/v1/gym-pictures/url:
 *   post:
 *     tags: [Pictures]
 *     summary: Add gym picture from URL
 *     description: Add a new picture for a gym using an external URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gymId
 *               - imageUrl
 *             properties:
 *               gymId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the gym this picture belongs to
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the image
 *               caption:
 *                 type: string
 *                 description: Optional caption for the image
 *               altText:
 *                 type: string
 *                 description: Alternative text for accessibility
 *               isCover:
 *                 type: boolean
 *                 description: Whether this image should be the gym's cover photo
 *                 default: false
 *     responses:
 *       201:
 *         description: Picture added successfully
 *       400:
 *         description: Invalid input or missing required fields
 */
router.post("/url", authMiddleware, authorizeGymManagement, createGymPictureFromUrl);

/**
 * @swagger
 * /api/v1/gym-pictures/{id}/metadata:
 *   get:
 *     tags: [Pictures]
 *     summary: Get gym picture metadata
 *     description: Retrieve metadata for a specific gym picture without the image binary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Picture ID
 *     responses:
 *       200:
 *         description: Picture metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GymPicture'
 *       404:
 *         description: Picture not found
 */
router.get("/:id/metadata", getGymPictureMetadata);

/**
 * @swagger
 * /api/v1/gym-pictures/{id}/image:
 *   get:
 *     tags: [Pictures]
 *     summary: Get gym picture image
 *     description: Retrieve the actual image binary data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Picture ID
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Picture not found
 */
router.get("/:id/image", getGymPictureImage);

/**
 * @swagger
 * /api/v1/gym-pictures/{id}:
 *   delete:
 *     tags: [Pictures]
 *     summary: Delete a gym picture
 *     description: Delete a gym picture and its associated metadata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Picture ID
 *     responses:
 *       200:
 *         description: Picture deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can delete pictures
 *       404:
 *         description: Picture not found
 */
router.delete("/:id", authMiddleware, authorizeGymManagement, deleteGymPicture);

/**
 * @swagger
 * /api/v1/gym-pictures/gym/{gymId}:
 *   get:
 *     tags: [Pictures]
 *     summary: List gym pictures
 *     description: Get all pictures for a specific gym (metadata only)
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Gym ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of pictures to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of pictures to skip
 *     responses:
 *       200:
 *         description: Pictures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 pictures:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GymPicture'
 *       404:
 *         description: Gym not found
 */
router.get("/gym/:gymId", listGymPictures);

/**
 * @swagger
 * /api/v1/gym-pictures/bulk:
 *   post:
 *     tags: [Pictures]
 *     summary: Bulk upload gym pictures
 *     description: Upload multiple pictures for a gym at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gymId
 *               - images
 *             properties:
 *               gymId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the gym
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple image files
 *               captions:
 *                 type: string
 *                 description: JSON array of captions for each image
 *                 example: '["Caption 1", "Caption 2"]'
 *               isCover:
 *                 type: string
 *                 description: JSON array of boolean values for cover image selection
 *                 example: '[true, false, false]'
 *     responses:
 *       201:
 *         description: Pictures uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pictures:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GymPicture'
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.post("/bulk", authMiddleware, authorizeGymManagement, handleUpload(gymPictureUpload.array("images", 10)), bulkUploadGymPictures);

export const gymPictureRouter = router;
