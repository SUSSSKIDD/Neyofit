

import { APIError } from '@/utils/APIError';
import { IEmailTemplate } from '@/types/emailTemplates.types';
import { validationService, ValidationRule } from '@/middleware/variableValidation';
import { EmailTemplate } from './emailTemplates.model';
import { EmailService } from '../nodemailer/nodemailer.config';
import User from '@/user/user.model';
import ejs from 'ejs';


type TemplateDataValue = string | number | boolean;

interface SendTemplateEmailOptions {
    templateId?: string;
    templateType?: string;
    userId?: string;
    to: string | string[];
    subject: string;
    data?: Record<string, TemplateDataValue | undefined>;
    bcc?: string | string[];
}

interface SendTemplatedEmailResult {
    success: boolean;
    messageId: string;
}

export class EmailTemplateService {
    private static instance: EmailTemplateService;

    private constructor() { }

    public static getInstance(): EmailTemplateService {
        if (!EmailTemplateService.instance) {
            EmailTemplateService.instance = new EmailTemplateService();
        }
        return EmailTemplateService.instance;
    }

    private async renderTemplate(template: IEmailTemplate, data: Record<string, TemplateDataValue | undefined>): Promise<string> {
        if (!template.htmlContent) {
            throw APIError.BadRequest('Template HTML content is missing');
        }

        // First, ensure all template variables have at least an empty string
        const mergedData: Record<string, TemplateDataValue | undefined> = {};

        // Initialize all template variables with empty strings
        for (const varDef of template.variables) {
            mergedData[varDef.variable] = "";
        }

        // Apply default values where they exist
        if (template.defaultData) {
            Object.assign(mergedData, template.defaultData);
        }

        // Validate variables with regex and use defaults for failed validations
        for (const varDef of template.variables) {
            // If the variable exists in the provided data
            const dataValue = data[varDef.variable];
            if (dataValue !== undefined) {
                // Check if validation is required and the variable has a validation regex
                if (varDef.validationRegex) {
                    const validationResult = validationService.validateData(
                        dataValue,
                        `regex:${varDef.validationRegex}` as ValidationRule
                    );

                    if (validationResult.isValid) {
                        // If validation passes, use the provided value
                        mergedData[varDef.variable] = dataValue;
                    } else {
                        // If validation fails, log the issue but keep the default value
                        // If no default value exists, the empty string will remain
                        console.warn(
                            `Validation failed for variable '${varDef.variable}': ${validationResult.error}. Using default value or empty string.`
                        );
                    } 
                } else {
                    // No validation required, use the provided value
                    mergedData[varDef.variable] = dataValue;
                }
            }
            // If variable doesn't exist in data, we already have default or empty string
        }

        // Add any remaining data fields that aren't defined in variables
        // This ensures we don't lose any extra data that might be needed
        for (const key in data) {
            if (!template.variables.some(v => v.variable === key)) {
                mergedData[key] = data[key];
            }
        }


        try {
            const result = ejs.render(template.htmlContent, mergedData, {
                // EJS options
                rmWhitespace: false,
                strict: false,
                async: false
            });

            return result;
        } catch (error) {
            console.error('Template rendering error:', {
                error,
                template: template.htmlContent,
                data: mergedData
            });
            throw error;
        }
    }


    private async getTemplate(options: { templateId?: string; templateType?: string }): Promise<IEmailTemplate> {
        let template: IEmailTemplate | null;

        if (options.templateId) {
            template = await EmailTemplate.findById(options.templateId).exec();
            if (!template) {
                throw APIError.NotFound('Template not found');
            }
        } else if (options.templateType) {
            template = await EmailTemplate.findOne({
                templateType: options.templateType,
                isActive: true
            }).sort({ priority: -1 }).exec();

            if (!template) {
                throw APIError.NotFound(`No active template found for type: ${options.templateType}`);
            }
        } else {
            throw APIError.BadRequest('Either templateId or templateType must be provided');
        }

        return template;
    }

    private async processTemplateData(
        template: IEmailTemplate,
        userId: string | undefined,
        data: Record<string, TemplateDataValue | undefined>
    ): Promise<Record<string, TemplateDataValue | undefined>> {
        let processedData = { ...data };

        // If userId provided, fetch user data for template variables
        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                processedData = {
                    userName: user.name,
                    userEmail: user.email,
                    ...processedData
                };
            }
        }

        return processedData;
    }

    public static async sendTemplatedEmail(options: SendTemplateEmailOptions): Promise<SendTemplatedEmailResult> {
        const service = EmailTemplateService.getInstance();

        try {
            // Get template
            const template = await service.getTemplate({
                templateId: options.templateId,
                templateType: options.templateType
            });

            // Process template data
            const processedData = await service.processTemplateData(
                template,
                options.userId,
                options.data || {}
            );

            // Render template
            const html = await service.renderTemplate(template, processedData);

            // Send email
            const emailService = EmailService.getInstance();
            const result = await emailService.sendEmail({
                to: options.to,
                subject: options.subject,
                html,
                provider: template.providerName,
                bcc: options.bcc
            });
            // console.log("Email template, send response: ", template.templateType, result);

            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error: unknown) {
            const err = error as Error & { code?: string };
            throw APIError.InternalError(
                err.message || 'Failed to send templated email',
                err.code
            );
        }
    }
}
