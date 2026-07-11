// nodemailer.routes.ts
import express from "express";
import { EmailService } from "./nodemailer.config";
import { validateEmailProvider } from "@/middleware/validateEmailProvider";
import { EmailOptions } from "@/types/email/mailer.types";

const router = express.Router();

// Get all configured email providers
router.get('/providers', async (req, res) => {
    try {
        const emailService = EmailService.getInstance();
        const providers = Array.from(emailService['providers'].entries()).map(([name, provider]) => ({
            name,
            type: provider.config.type,
            isDefault: provider.config.isDefault,
            from: provider.config.from
        }));
        
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch email providers' });
    }
});

// Send email using specified or default provider
router.post('/send', validateEmailProvider, async (req, res) => {
    try {
        const emailOptions: EmailOptions = {
            to: req.body.to,
            subject: req.body.subject,
            text: req.body.text,
            html: req.body.html,
            provider: req.body.provider,
            from: req.body.from,
            replyTo: req.body.replyTo,
            attachments: req.body.attachments
        };

        const emailService = EmailService.getInstance();
        const result = await emailService.sendEmail(emailOptions);
        
        res.json({
            success: true,
            messageId: result.messageId,
            provider: emailOptions.provider || 'default'
        });
    } catch (error: any) {
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

// Verify provider connection
router.post('/verify/:provider', validateEmailProvider, async (req, res) => {
    try {
        const { provider } = req.params;
        const emailService = EmailService.getInstance();
        const connections = await emailService.verifyAllConnections();
        
        const status = connections.get(provider);
        if (status === undefined) {
            res.status(404).json({ error: 'Provider not found' });
            return;
        }

        res.json({ 
            provider,
            connected: status 
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Connection verification failed',
            details: error.message
        });
    }
});

// Set default provider
router.put('/default/:provider', validateEmailProvider, async (req, res) => {
    try {
        const { provider } = req.params;
        const emailService = EmailService.getInstance();
        emailService.setDefaultProvider(provider);

        res.json({
            success: true,
            message: `Set ${provider} as default email provider`
        });
    } catch (error: any) {
        res.status(error.status || 500).json({
            error: error.message
        });
    }
});

export default router;