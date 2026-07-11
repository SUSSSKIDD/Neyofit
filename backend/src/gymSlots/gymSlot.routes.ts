import { Router } from "express";
import { authMiddleware } from "@/auth/auth.middleware";
import { authorizeGymManagement } from "@/middleware/roleAuth";
import {
  createOrUpdateGymSlots,
  getGymSlots,
  updateGymSlot,
  deleteGymSlot
} from "./gymSlot.controllers";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TimeSlot:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "17:00"
 *         maxCapacity:
 *           type: number
 *           example: 10
 *         price:
 *           type: number
 *           example: 0
 *         isActive:
 *           type: boolean
 *           example: true
 *     
 *     GymSlot:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         gymId:
 *           type: string
 *         dayOfWeek:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         slots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *         isClosed:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/gym-slots/{gymId}:
 *   post:
 *     tags: [Gym Slots]
 *     summary: Create or update gym slots for a specific day
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dayOfWeek
 *               - slots
 *               - isClosed
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               slots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *               isClosed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Gym slots created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 gymSlot:
 *                   $ref: '#/components/schemas/GymSlot'
 *       500:
 *         description: Server error
 */
router.post("/:gymId", authMiddleware, authorizeGymManagement, createOrUpdateGymSlots);

/**
 * @swagger
 * /api/v1/gym-slots/{gymId}:
 *   get:
 *     tags: [Gym Slots]
 *     summary: Get all slots for a gym
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ID
 *     responses:
 *       200:
 *         description: Gym slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 gymSlots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GymSlot'
 *       500:
 *         description: Server error
 */
router.get("/:gymId", authMiddleware, getGymSlots);

/**
 * @swagger
 * /api/v1/gym-slots/{gymId}/{dayOfWeek}:
 *   put:
 *     tags: [Gym Slots]
 *     summary: Update specific gym slot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ID
 *       - in: path
 *         name: dayOfWeek
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         description: Day of week
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *               isClosed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Gym slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 gymSlot:
 *                   $ref: '#/components/schemas/GymSlot'
 *       500:
 *         description: Server error
 */
router.put("/:gymId/:dayOfWeek", authMiddleware, authorizeGymManagement, updateGymSlot);

/**
 * @swagger
 * /api/v1/gym-slots/{gymId}/{dayOfWeek}:
 *   delete:
 *     tags: [Gym Slots]
 *     summary: Delete gym slot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ID
 *       - in: path
 *         name: dayOfWeek
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         description: Day of week
 *     responses:
 *       200:
 *         description: Gym slot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 */
router.delete("/:gymId/:dayOfWeek", authMiddleware, authorizeGymManagement, deleteGymSlot);

export default router;


