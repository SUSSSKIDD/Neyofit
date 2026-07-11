// src/routes/emailTemplates.routes.ts
import express from 'express';
import { EmailTemplateService } from './emailTemplates.config';

const router = express.Router();

// ! I have renamed the test to send
router.post('/send', async (req, res) => {
    try {
        const result = await EmailTemplateService.sendTemplatedEmail(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({
            error: error.message,
            code: error.code
        });
    }
});

export default router;
