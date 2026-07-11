import { Router } from "express";
import {
	createGym,
	getGyms,
	getGymById,
	updateGym,
	deleteGym,
	findGymsNearby,
	getGymSubscriptionListings,
	addGymSubscriptionListing,
	addGymFacility,
	removeGymFacility,
	uploadGym,
	createGymDraft,
	updateGymStatus,
	getGymsByStatus,
	updateGymCommission,
} from "@/gym/gym.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement, authorizeRoles } from "@/middleware/roleAuth";
import { UserType } from "@/types/user.types";

const router = Router();

/**
 * @swagger
 * /api/v1/gyms:
 *   post:
 *     tags: [Gyms]
 *     summary: Create a new gym
 *     description: Creates a new gym with the provided details
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
 *               - locationId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Fit Club"
 *               description:
 *                 type: string
 *                 example: "A modern gym"
 *               locationId:
 *                 type: string
 *                 format: ObjectId
 *                 example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *               similarGyms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *               openingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   tuesday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   wednesday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   thursday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   friday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   saturday:
 *                     $ref: '#/components/schemas/DayHours'
 *                   sunday:
 *                     $ref: '#/components/schemas/DayHours'
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "1234567890"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "info@fitclub.com"
 *                   website:
 *                     type: string
 *                     format: uri
 *                     example: "https://fitclub.com"
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 4.5
 *               priceRange:
 *                 type: string
 *                 enum: [budget, mid-range, premium, luxury]
 *                 example: "mid-range"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Gym created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gym'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can create gyms
 */
router.post("/", authMiddleware, createGym);

/**
 * @swagger
 * /api/v1/gyms/{id}/subscription-listings:
 *   get:
 *     tags: [Gyms, Subscriptions]
 *     summary: Get all subscription listings for a gym
 *     description: Retrieves all subscription plans associated with a specific gym
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the gym
 *     responses:
 *       200:
 *         description: List of subscription listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionListing'
 *       404:
 *         description: Gym not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/subscription-listings", getGymSubscriptionListings);

/**
 * @swagger
 * /api/v1/gyms/{id}/subscription-listings:
 *   post:
 *     tags: [Gyms, Subscriptions]
 *     summary: Add a subscription listing to a gym
 *     description: Associates a subscription plan with a specific gym
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the gym
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionListingId
 *             properties:
 *               subscriptionListingId:
 *                 type: string
 *                 format: ObjectId
 *                 example: "64e9c2f1a1b2c3d4e5f6a7b9"
 *     responses:
 *       200:
 *         description: Subscription listing added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gym'
 *       400:
 *         description: Invalid input or subscription listing already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Gym or subscription listing not found
 */
router.post("/:id/subscription-listings", authMiddleware, authorizeGymManagement, addGymSubscriptionListing);


/**
 * @swagger
 * /api/v1/gyms:
 *   get:
 *     tags: [Gyms]
 *     summary: Get all gyms
 *     description: Retrieves a paginated list of all gyms
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, name, -rating, -name]
 *         description: Sort field and order (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of gyms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gyms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gym'
 *                 total:
 *                   type: integer
 *                   description: Total number of gyms
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 pages:
 *                   type: integer
 *                   description: Total number of pages
 */
router.get("/", getGyms);

/**
 * @swagger
 * /api/v1/gyms/{id}:
 *   get:
 *     tags: [Gyms]
 *     summary: Get a single gym by ID
 *     description: Retrieves detailed information about a specific gym
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the gym
 *     responses:
 *       200:
 *         description: Gym details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gym'
 *       404:
 *         description: Gym not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", getGymById);

// Set per-gym commission override (superadmin only)
router.patch("/:id/commission", authMiddleware, authorizeRoles([UserType.SUPERADMIN]), updateGymCommission);

/**
 * @swagger
 * /api/v1/gyms/{id}:
 *   put:
 *     tags: [Gyms]
 *     summary: Update a gym
 *     description: Updates the details of an existing gym
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the gym to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Gym Name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               openingHours:
 *                 $ref: '#/components/schemas/OpeningHours'
 *               contact:
 *                 $ref: '#/components/schemas/Contact'
 *               priceRange:
 *                 type: string
 *                 enum: [budget, mid-range, premium, luxury]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Gym updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gym'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can update gyms
 *       404:
 *         description: Gym not found
 */
router.put("/:id", authMiddleware, authorizeGymManagement, updateGym);

/**
 * @swagger
 * /api/v1/gyms/{id}:
 *   delete:
 *     tags: [Gyms]
 *     summary: Delete a gym
 *     description: Deletes a gym and all associated data (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the gym to delete
 *     responses:
 *       200:
 *         description: Gym deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gym deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can delete gyms
 *       404:
 *         description: Gym not found
 */
router.delete("/:id", authMiddleware, authorizeGymManagement, deleteGym);


/**
 * @route GET /gyms/search/nearby
 * @summary Find gyms nearby a location
 * @queryParam {number} longitude.required - Longitude of user
 * @queryParam {number} latitude.required - Latitude of user
 * @queryParam {number} [radiusInKm=5] - Search radius in kilometers
 * @queryParam {number} [limit=50] - Maximum number of results
 * @example /gyms/search/nearby?longitude=77.5946&latitude=12.9716&radiusInKm=10&limit=20
 */
router.get("/search/nearby", findGymsNearby);

/**
 * @route GET /gyms/:id/subscription-listings
 * @summary Get all subscription listings for a gym
 * @param {string} id.path.required - Gym ID
 * @returns {Array<ISubscriptionListing>} 200 - List of subscription listings
 * @example /gyms/64e9c2f1a1b2c3d4e5f6a7b8/subscription-listings
 */
router.get(":id/subscription-listings", getGymSubscriptionListings);

/**
 * @route PATCH /gyms/:id/subscription-listings
 * @summary Add a subscription listing to a gym
 * @param {string} id.path.required - Gym ID
 * @bodyExample
 * {
 *   "subscriptionListingId": "64e9c2f1a1b2c3d4e5f6a7b9"
 * }
 */
router.patch(":id/subscription-listings", addGymSubscriptionListing);

/**
 * @route POST /gyms/:id/facilities
 * @summary Add a facility to a gym
 * @param {string} id.path.required - Gym ID
 * @bodyExample
 * {
 *   "facilityId": "<facilityObjectId>"
 * }
 */
router.patch("/:id/facilities", addGymFacility);

/**
 * @route DELETE /gyms/:id/facilities
 * @summary Remove a facility from a gym
 * @param {string} id.path.required - Gym ID
 * @bodyExample
 * {
 *   "facilityId": "<facilityObjectId>"
 * }
 */
router.delete("/:id/facilities", removeGymFacility);

/**
 * @swagger
 * /api/v1/gyms/upload:
 *   post:
 *     tags: [Gyms]
 *     summary: Upload/Create a new gym (Authorized users only)
 *     description: Creates a new gym with enhanced validation. Only accessible to gym owners, employees, and superadmins.
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
 *               - locationId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Elite Fitness Center"
 *               description:
 *                 type: string
 *                 example: "Premium fitness facility with state-of-the-art equipment"
 *               locationId:
 *                 type: string
 *                 format: ObjectId
 *                 example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 example: ["64e9c2f1a1b2c3d4e5f6a7b9"]
 *               openingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "06:00"
 *                       close:
 *                         type: string
 *                         example: "22:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   tuesday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "06:00"
 *                       close:
 *                         type: string
 *                         example: "22:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   wednesday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "06:00"
 *                       close:
 *                         type: string
 *                         example: "22:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   thursday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "06:00"
 *                       close:
 *                         type: string
 *                         example: "22:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   friday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "06:00"
 *                       close:
 *                         type: string
 *                         example: "22:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   saturday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "08:00"
 *                       close:
 *                         type: string
 *                         example: "20:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *                   sunday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "08:00"
 *                       close:
 *                         type: string
 *                         example: "18:00"
 *                       closed:
 *                         type: boolean
 *                         example: false
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "contact@elitefitness.com"
 *                   website:
 *                     type: string
 *                     format: uri
 *                     example: "https://www.elitefitness.com"
 *               priceRange:
 *                 type: string
 *                 enum: [budget, mid-range, premium]
 *                 example: "premium"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Gym created successfully
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
 *                   example: "Gym created successfully"
 *                 gym:
 *                   $ref: '#/components/schemas/Gym'
 *       400:
 *         description: Validation error
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
 *                   example: "Name and location are required fields"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient permissions
 *       500:
 *         description: Server error
 */
router.post("/upload", authMiddleware, authorizeGymManagement, uploadGym);

/**
 * @swagger
 * /api/v1/gyms/draft:
 *   post:
 *     tags: [Gyms]
 *     summary: Create a gym in draft mode
 *     description: Creates a new gym in draft status for multi-stage creation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Draft Gym"
 *               description:
 *                 type: string
 *                 example: "A gym in draft mode"
 *               locationId:
 *                 type: string
 *                 format: ObjectId
 *                 example: "64e9c2f1a1b2c3d4e5f6a7b8"
 *     responses:
 *       201:
 *         description: Gym draft created successfully
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
 *                   example: "Gym draft created successfully"
 *                 gym:
 *                   $ref: '#/components/schemas/Gym'
 */
router.post("/draft", authMiddleware, authorizeGymManagement, createGymDraft);

/**
 * @swagger
 * /api/v1/gyms/{id}/status:
 *   patch:
 *     tags: [Gyms]
 *     summary: Update gym status
 *     description: Update the status of a gym (draft, published, archived)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Gym ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: "published"
 *     responses:
 *       200:
 *         description: Gym status updated successfully
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
 *                   example: "Gym status updated to published"
 *                 gym:
 *                   $ref: '#/components/schemas/Gym'
 */
router.patch("/:id/status", authMiddleware, authorizeGymManagement, updateGymStatus);

/**
 * @swagger
 * /api/v1/gyms/status:
 *   get:
 *     tags: [Gyms]
 *     summary: Get gyms by status
 *     description: Retrieve gyms filtered by status with pagination
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by gym status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Gyms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 gyms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gym'
 *                 total:
 *                   type: integer
 *                   example: 25
 */
router.get("/status", getGymsByStatus);

export const gymRouter = router;
