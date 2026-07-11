import { Request, Response, NextFunction } from 'express';
import { UserType } from '@/types/user.types';

/**
 * Middleware to authorize users based on their roles
 * @param allowedRoles - Array of user types that are allowed to access the endpoint
 */
export const authorizeRoles = (allowedRoles: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated (should be set by authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.userType)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: (error as Error).message
      });
    }
  };
};

/**
 * Middleware specifically for gym management operations
 * Allows gym owners, employees, and superadmins
 */
export const authorizeGymManagement = authorizeRoles([
  UserType.GYM,
  UserType.EMPLOYEE,
  UserType.SUPERADMIN
]);