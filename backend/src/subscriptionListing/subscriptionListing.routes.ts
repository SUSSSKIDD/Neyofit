import { Router } from "express";
import {
	createSubscriptionListing,
	getSubscriptionListings,
	getSubscriptionListingById,
	updateSubscriptionListing,
	deleteSubscriptionListing
} from "./subscriptionListing.controllers";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/subscription-listings:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a new subscription listing
 *     description: Creates a new subscription plan or package for a gym
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
 *               - type
 *               - durationInDays
 *               - gymId
 *               - cost
 *               - currency
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Monthly Pass"
 *                 description: Name of the subscription package
 *               description:
 *                 type: string
 *                 example: "Access for 30 days"
 *               type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly, yearly, custom]
 *                 example: "monthly"
 *               durationInDays:
 *                 type: integer
 *                 minimum: 1
 *                 example: 30
 *               gymId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the gym offering this subscription
 *               cost:
 *                 type: number
 *                 minimum: 0
 *                 example: 1200
 *               currency:
 *                 type: string
 *                 enum: [INR, USD, EUR, GBP]
 *                 example: "INR"
 *               discount:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     minimum: 0
 *                     example: 10
 *                   type:
 *                     type: string
 *                     enum: [percentage, fixed]
 *                     example: "percentage"
 *                   validUntil:
 *                     type: string
 *                     format: date-time
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isRecurring:
 *                 type: boolean
 *                 default: false
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["pool", "steam"]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Subscription listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionListing'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only gym owners or admins can create subscriptions
 */
router.post("/", authMiddleware, authorizeGymManagement, createSubscriptionListing);

/**
 * @swagger
 * /api/v1/subscription-listings:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all subscription listings
 *     description: Retrieve a list of all subscription listings with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: gymId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filter subscriptions by gym
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
 *         description: Filter by subscription type
 *       - in: query
 *         name: minCost
 *         schema:
 *           type: number
 *         description: Minimum cost filter
 *       - in: query
 *         name: maxCost
 *         schema:
 *           type: number
 *         description: Maximum cost filter
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [INR, USD, EUR, GBP]
 *         description: Filter by currency
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of subscription listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionListing'
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
router.get("/", getSubscriptionListings);

/**
 * @swagger
 * /api/v1/subscription-listings/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get a subscription listing by ID
 *     description: Retrieve detailed information about a specific subscription listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Subscription Listing ID
 *     responses:
 *       200:
 *         description: Subscription listing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionListing'
 *       404:
 *         description: Subscription listing not found
 */
router.get("/:id", getSubscriptionListingById);

/**
 * @swagger
 * /api/v1/subscription-listings/{id}:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update a subscription listing
 *     description: Update details of an existing subscription listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Subscription Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *                 minimum: 0
 *               discount:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     minimum: 0
 *                   type:
 *                     type: string
 *                     enum: [percentage, fixed]
 *                   validUntil:
 *                     type: string
 *                     format: date-time
 *               isActive:
 *                 type: boolean
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Subscription listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionListing'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only gym owners or admins can update subscriptions
 *       404:
 *         description: Subscription listing not found
 */
router.put("/:id", authMiddleware, authorizeGymManagement, updateSubscriptionListing);

/**
 * @swagger
 * /api/v1/subscription-listings/{id}:
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Delete a subscription listing
 *     description: Delete a subscription listing (only if no active subscriptions exist)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Subscription Listing ID
 *     responses:
 *       200:
 *         description: Subscription listing deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subscription listing deleted successfully"
 *       400:
 *         description: Cannot delete - Active subscriptions exist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only gym owners or admins can delete subscriptions
 *       404:
 *         description: Subscription listing not found
 */
router.delete("/:id", authMiddleware, authorizeGymManagement, deleteSubscriptionListing);

export const subscriptionListingRouter = router;
