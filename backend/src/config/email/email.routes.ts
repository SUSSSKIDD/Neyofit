import { Router } from 'express';
import { authMiddleware } from '@/auth/auth.middleware';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserType } from '@/types/user.types';
import nodemailerRoutes from './nodemailer/nodemailer.routes';
import providerRoutes from './providers/email.providers.routes';
import templateRoutes from './templates/emailTemplates.routes';
import schedulerRoutes from './scheduler/scheduler.routes';

const router = Router();

// All email routes require superadmin access
router.use('/nodemailer', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), nodemailerRoutes);
router.use('/providers', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), providerRoutes);
router.use('/templates', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), templateRoutes);
router.use('/scheduler', schedulerRoutes);

export default router;
