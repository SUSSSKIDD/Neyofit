import { Router } from 'express';
import {
  createGymReview,
  getGymReviews,
  getUserReviews,
  updateGymReview,
  deleteGymReview
} from '@/gymReview/gymReview.controllers';
import { authMiddleware } from '@/auth/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/gym-reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a new gym review
 *     description: Create a new review for a gym. Users can only submit one review per gym.
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
 *               - userId
 *               - rating
 *             properties:
 *               gymId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the gym being reviewed
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the user writing the review
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Optional review text
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Optional array of image IDs associated with the review
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GymReviewResponse'
 *       400:
 *         description: Invalid input or user has already reviewed this gym
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User has already reviewed this gym"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Gym or user not found
 */
router.post('/', authMiddleware, createGymReview);

/**
 * @swagger
 * /api/v1/gym-reviews/gym/{gymId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a gym
 *     description: Retrieve all reviews for a specific gym, sorted by creation date
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the gym to get reviews for
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
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: List of reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GymReviewResponse'
 *       404:
 *         description: Gym not found
 *       500:
 *         description: Server error
 */
router.get('/gym/:gymId', getGymReviews);

/**
 * @route   GET /api/v1/gym-reviews/user/:userId
 * @desc    Get all reviews written by a specific user
 * @access  Protected
 */
router.get('/user/:userId', authMiddleware, getUserReviews);

/**
 * @swagger
 * /api/v1/gym-reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update a gym review
 *     description: Update an existing review. Users can only update their own reviews.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating
 *               comment:
 *                 type: string
 *                 description: Updated review text
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Updated array of image IDs
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GymReviewResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only update own reviews
 *       404:
 *         description: Review not found
 */
router.put('/:id', authMiddleware, updateGymReview);

/**
 * @swagger
 * /api/v1/gym-reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a gym review
 *     description: Delete an existing review. Users can only delete their own reviews.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the review to delete
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only delete own reviews
 *       404:
 *         description: Review not found
 */
router.delete('/:id', authMiddleware, deleteGymReview);

export default router;
