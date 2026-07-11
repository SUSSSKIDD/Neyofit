import { Router } from 'express';
import {
    // registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserActiveStatus,
    updateBankDetails,
    getBankDetails,
    getBankDetailsByUserId
} from '@/user/user.controllers.js';
import { authMiddleware } from '@/auth/auth.middleware';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserType } from '@/types/user.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieve a list of all users with pagination
 *     parameters:
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
 *         description: List of users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', getAllUsers);

// Bank details routes (must be before /:id to avoid conflicts)
router.put('/bank-details', authMiddleware, authorizeRoles([UserType.GYM]), updateBankDetails);
router.get('/bank-details', authMiddleware, authorizeRoles([UserType.GYM]), getBankDetails);
router.get('/bank-details/:userId', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), getBankDetailsByUserId);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *   
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), deleteUser);

/**
 * @swagger
 * /api/v1/users/{id}/toggle-active:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user active status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/toggle-active', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), toggleUserActiveStatus);

export default router;
