// src/middleware/validateEmailProvider.ts
import { Request, Response, NextFunction } from 'express';
// import { EmailOptions } from '@shared/types/email/mailer.types';
import { EmailService } from '@/config/email/nodemailer/nodemailer.config';


export const validateEmailProvider = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const emailService = EmailService.getInstance();
        if (req.path === '/send') {
            const { to, subject, provider } = req.body;

            // Validate required fields
            if (!to) {
                res.status(400).json({
                    error: 'Recipient (to) is required'
                });
                return;
            }

            if (!subject) {
                res.status(400).json({
                    error: 'Subject is required'
                });
                return;
            }

            if (!req.body.text && !req.body.html) {
                res.status(400).json({
                    error: 'Either text or html content is required'
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(to)) {
                res.status(400).json({
                    error: 'Invalid recipient email format'
                });
                return;
            }

            // If provider specified, verify it exists
            if (provider) {
                const providers = Array.from(emailService['providers'].keys());
                if (!providers.includes(provider)) {
                    res.status(404).json({
                        error: `Provider ${provider} not found`
                    });
                    return;
                }
            }
        }

        // For provider-specific routes
        if (req.path.startsWith('/verify/') || req.path.startsWith('/default/')) {
            const providerName = req.params.provider;
            const providers = Array.from(emailService['providers'].keys());
            
            if (!providers.includes(providerName)) {
                res.status(404).json({
                    error: `Provider ${providerName} not found`
                });
                return;
            }
        }

        next();
    } catch (error: any) {
        res.status(500).json({
            error: 'Email provider validation failed',
            details: error.message
        });
    }
};

// Optional: Additional validation middleware for specific providers
export const validateGmailProvider = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { email } = req.params;
    
    if (!email) {
        res.status(400).json({
            error: 'Email parameter is required'
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            error: 'Invalid email format'
        });
        return;
    }

    next();
};