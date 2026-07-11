import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate superadmin registration secret key
 * This prevents unauthorized superadmin account creation
 */
export const validateSuperAdminSecret = (req: Request, res: Response, next: NextFunction) => {
	try {
		const secretKey = req.headers['x-superadmin-secret'] || req.body.secretKey;
		const requiredSecret = process.env.SUPERADMIN_REGISTRATION_SECRET;

		// If no secret is configured, disable this endpoint in production
		if (!requiredSecret) {
			if (process.env.NODE_ENV === 'production') {
				return res.status(403).json({
					success: false,
					message: 'Superadmin registration is disabled in production'
				});
			}
			// Allow in development if no secret is set
			return next();
		}

		// Validate secret key
		if (!secretKey || secretKey !== requiredSecret) {
			return res.status(403).json({
				success: false,
				message: 'Invalid or missing superadmin registration secret'
			});
		}

		next();
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Secret validation failed',
			error: (error as Error).message
		});
	}
};

