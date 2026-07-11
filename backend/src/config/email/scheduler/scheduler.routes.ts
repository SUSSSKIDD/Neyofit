import express from 'express';
import { authMiddleware } from '@/auth/auth.middleware';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserType } from '@/types/user.types';
import { EmailTemplateService } from '../templates/emailTemplates.config';

const router = express.Router();

// Send a test email using a template (superadmin only)
router.post('/test-email', authMiddleware, authorizeRoles([UserType.SUPERADMIN]), async (req, res) => {
    try {
        const { templateType, to, subject, data } = req.body;

        if (!templateType || !to || !subject) {
            return res.status(400).json({
                success: false,
                error: 'templateType, to, and subject are required'
            });
        }

        const result = await EmailTemplateService.sendTemplatedEmail({
            templateType,
            to,
            subject,
            data: data || {}
        });

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
