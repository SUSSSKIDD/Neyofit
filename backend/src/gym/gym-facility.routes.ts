import { Router } from "express";
import {createGymFacility, updateGymFacility, deleteGymFacility, getAllGymFacilities} from "@/gym/gym.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeRoles } from "@/middleware/roleAuth";
import { UserType } from "@/types/user.types";

const router = Router();

/**
 * @swagger
 * /api/v1/gym-facilities:
 *   post:
 *     tags: [Facilities]
 *     summary: Create a new gym facility
 *     description: Add a new facility type that can be associated with gyms (e.g., Swimming Pool, Sauna, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the facility
 *                 example: "Swimming Pool"
 *                 minLength: 2
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Facility created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 facility:
 *                   $ref: '#/components/schemas/GymFacility'
 *       400:
 *         description: Invalid input or facility already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Facility name is required"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can create facilities
 */
router.post("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), createGymFacility);

/**
 * @swagger
 * /api/v1/gym-facilities/{id}:
 *   delete:
 *     tags: [Facilities]
 *     summary: Delete a gym facility
 *     description: Remove a facility type from the system. Only possible if no gyms are currently using this facility.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the facility to delete
 *         example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *     responses:
 *       200:
 *         description: Facility deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Facility deleted"
 *       400:
 *         description: Cannot delete facility that is in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Facility is currently in use by one or more gyms"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can delete facilities
 *       404:
 *         description: Facility not found
 */
router.put("/:id", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), updateGymFacility);
router.delete("/:id", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), deleteGymFacility);

/**
 * @swagger
 * /api/v1/gym-facilities:
 *   get:
 *     tags: [Facilities]
 *     summary: Get all gym facilities
 *     description: Retrieve a list of all available facility types in the system
 *     responses:
 *       200:
 *         description: List of facilities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 facilities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GymFacility'
 *                   example:
 *                     - _id: "64e9c2f1a1b2c3d4e5f6a7b8"
 *                       name: "Swimming Pool"
 *                     - _id: "64e9c2f1a1b2c3d4e5f6a7b9"
 *                       name: "Sauna"
 *                     - _id: "64e9c2f1a1b2c3d4e5f6a7ba"
 *                       name: "Yoga Studio"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get("/", getAllGymFacilities);

export const gymFacilityRouter = router;