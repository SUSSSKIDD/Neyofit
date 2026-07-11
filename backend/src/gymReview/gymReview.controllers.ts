import { Request, Response } from 'express';
import { GymReview } from './gymReview.model';
import { IGymReviewRequest, IGymReviewResponse } from '../types/gymReview.types';
import mongoose from 'mongoose';
import { Gym } from '@/gym/gym.model';
import User from '@/user/user.model';
import { sendEmailSafe } from '@/utils/sendEmailSafe';

/**
 * Create a new gym review
 */
export const createGymReview = async (req: Request, res: Response) => {
  try {
    const reviewData: IGymReviewRequest = req.body;

    // Validate request data
    if (!reviewData.gymId || !reviewData.rating) {
      return res.status(400).json({ message: 'Missing required fields: gymId and rating' });
    }

    // Use authenticated user's ID (req.user is set by authMiddleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user._id.toString();

    // Create new review
    const review = new GymReview({
      gymId: new mongoose.Types.ObjectId(reviewData.gymId),
      userId: new mongoose.Types.ObjectId(userId),
      rating: reviewData.rating,
      comment: reviewData.comment,
      images: reviewData.images?.map(id => new mongoose.Types.ObjectId(id))
    });

    await review.save();

    const response: IGymReviewResponse = {
      id: review._id.toString(),
      gymId: review.gymId.toString(),
      userId: review.userId.toString(),
      rating: review.rating,
      comment: review.comment,
      images: review.images?.map(id => id.toString()),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    };

    res.status(201).json(response);

    // Notify gym owner of new review (fire-and-forget)
    try {
      const gym = await Gym.findById(reviewData.gymId).select('name ownerId');
      if (gym?.ownerId) {
        const [owner, reviewer] = await Promise.all([
          User.findById(gym.ownerId).select('name email'),
          User.findById(userId).select('name'),
        ]);
        if (owner) {
          sendEmailSafe({
            templateType: 'new-gym-review',
            to: owner.email,
            subject: `Neyofit - New Review for ${gym.name}`,
            data: {
              userName: owner.name,
              gymName: gym.name,
              reviewerName: reviewer?.name || 'A customer',
              rating: reviewData.rating,
              comment: reviewData.comment || 'No comment',
              dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gym-owner/dashboard`,
            },
          });
        }
      }
    } catch (_) { /* email notification is non-critical */ }
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User has already reviewed this gym' });
    }
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

/**
 * Get reviews for a specific gym
 */
export const getGymReviews = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.params;

    const reviews = await GymReview.find({ gymId: new mongoose.Types.ObjectId(gymId) })
      .populate('userId', 'name') // Add user name to the response
      .sort({ createdAt: -1 });

    const response: IGymReviewResponse[] = reviews.map(review => ({
      id: review._id.toString(),
      gymId: review.gymId.toString(),
      userId: review.userId.toString(),
      rating: review.rating,
      comment: review.comment,
      images: review.images?.map(id => id.toString()),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

/**
 * Get reviews written by a specific user
 */
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const reviews = await GymReview.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('gymId', 'name')
      .sort({ createdAt: -1 });

    const response = reviews.map(review => ({
      id: review._id.toString(),
      gymId: review.gymId.toString(),
      userId: review.userId.toString(),
      rating: review.rating,
      comment: review.comment,
      images: review.images?.map((id: mongoose.Types.ObjectId) => id.toString()),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      gym: review.gymId,
    }));

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching user reviews', error: error.message });
  }
};

/**
 * Update a gym review
 */
export const updateGymReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<IGymReviewRequest> = req.body;

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the review first to check ownership
    const review = await GymReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review or is a superadmin
    const userId = req.user._id.toString();
    const reviewUserId = review.userId.toString();
    const isSuperAdmin = req.user.userType === 'superadmin';

    if (reviewUserId !== userId && !isSuperAdmin) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Prevent updating gymId and userId
    delete updateData.gymId;
    delete updateData.userId;

    // Update the review
    const updatedReview = await GymReview.findByIdAndUpdate(
      id,
      {
        ...updateData,
        images: updateData.images?.map(id => new mongoose.Types.ObjectId(id))
      },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const response: IGymReviewResponse = {
      id: updatedReview._id.toString(),
      gymId: updatedReview.gymId.toString(),
      userId: updatedReview.userId.toString(),
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      images: updatedReview.images?.map(id => id.toString()),
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

/**
 * Delete a gym review
 */
export const deleteGymReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the review first to check ownership
    const review = await GymReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review or is a superadmin
    const userId = req.user._id.toString();
    const reviewUserId = review.userId.toString();
    const isSuperAdmin = req.user.userType === 'superadmin';

    if (reviewUserId !== userId && !isSuperAdmin) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    // Delete the review
    await GymReview.findByIdAndDelete(id);

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
