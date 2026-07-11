import { Router } from "express";
import {
	createLocation,
	getLocations,
	getLocationById,
	updateLocation,
	deleteLocation,
	searchLocations
} from "@/location/location.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeRoles } from "@/middleware/roleAuth";
import { UserType } from "@/types/user.types";

const router = Router();

/**
 * @swagger
 * /api/v1/locations:
 *   post:
 *     tags: [Locations]
 *     summary: Create a new location
 *     description: Creates a new location with address and geo-coordinates
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
 *               - address
 *               - longitude
 *               - latitude
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Koramangala Branch"
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - state
 *                   - pinCode
 *                   - country
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "Bangalore"
 *                   state:
 *                     type: string
 *                     example: "Karnataka"
 *                   pinCode:
 *                     type: string
 *                     example: "560034"
 *                   country:
 *                     type: string
 *                     example: "India"
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 77.6229
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 12.9345
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can create locations
 */
router.post("/", authMiddleware, authorizeRoles([UserType.SUPERADMIN, UserType.GYM]), createLocation);

/**
 * @swagger
 * /api/v1/locations:
 *   get:
 *     tags: [Locations]
 *     summary: Get all locations
 *     description: Retrieve a list of all locations with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: near
 *         schema:
 *           type: string
 *         description: Coordinates in format "lat,lng" to find locations near a point
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Radius in kilometers for nearby search (when 'near' is provided)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 5
 */
router.get("/", getLocations);

/**
 * @swagger
 * /api/v1/locations/search:
 *   get:
 *     tags: [Locations]
 *     summary: Search locations
 *     description: Search locations by name, city, state, or street
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "Bangalore"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Locations found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 locations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid search query
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
 *                   example: "Search query must be at least 2 characters long"
 */
router.get("/search", searchLocations);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   get:
 *     tags: [Locations]
 *     summary: Get a single location by ID
 *     description: Retrieve detailed information about a specific location
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Location ID
 *         example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *     responses:
 *       200:
 *         description: Location details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 */
router.get("/:id", getLocationById);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   put:
 *     tags: [Locations]
 *     summary: Update a location
 *     description: Update details of an existing location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Branch Name"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "456 New St"
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pinCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               longitude:
 *                 type: number
 *                 format: float
 *               latitude:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can update locations
 *       404:
 *         description: Location not found
 */
router.put("/:id", authMiddleware, authorizeRoles([UserType.SUPERADMIN, UserType.GYM]), updateLocation);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   delete:
 *     tags: [Locations]
 *     summary: Delete a location
 *     description: Delete a location (Note - Only possible if no gyms are associated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Location ID
 *         example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Location deleted successfully"
 *       400:
 *         description: Cannot delete - Location has associated gyms
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can delete locations
 *       404:
 *         description: Location not found
 */
router.delete("/:id", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), deleteLocation);

export const locationRouter = router;
