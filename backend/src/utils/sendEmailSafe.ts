import { EmailTemplateService } from '@/config/email/templates/emailTemplates.config';
import logger from '@/utils/logger';

type TemplateDataValue = string | number | boolean;

interface SendEmailSafeOptions {
    templateType: string;
    to: string;
    subject: string;
    data?: Record<string, TemplateDataValue | undefined>;
}

/**
 * Fire-and-forget email sender. Does NOT await — truly non-blocking.
 * Logs success/failure internally and prevents email errors from crashing the parent request.
 */
export const sendEmailSafe = (options: SendEmailSafeOptions): void => {
    EmailTemplateService.sendTemplatedEmail(options)
        .then(() => {
            logger.info(`Email sent: ${options.templateType}`, { to: options.to });
        })
        .catch((error: Error) => {
            logger.error(`Email failed: ${options.templateType}`, error, { to: options.to });
        });
};
