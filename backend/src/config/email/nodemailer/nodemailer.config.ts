// src/services/email/nodemailer/nodemailer.config.ts
import { APIError } from '../../../utils/APIError';
import dotenv from 'dotenv';
import EmailProvider from '../providers/email.providers.model';

import {
    SMTPConfig,
    GmailConfig,
    SendGridConfig,
    MailgunConfig,
    ProviderConfig,
    EmailOptions,
    ProviderType
} from '@/types/email/mailer.types';

import {
    BaseEmailProvider,
    SMTPProvider,
    GmailProvider,
    SendGridProvider,
    MailgunProvider
} from '../providers/email.providers.config';

dotenv.config();

export class EmailService {
    private providers: Map<string, BaseEmailProvider> = new Map();
    private defaultProvider?: BaseEmailProvider;
    private static instance: EmailService;

    private constructor() { }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    public async addProvider(config: ProviderConfig): Promise<void> {
        try {
            const provider = this.createProvider(config);
            await provider.initialize();

            const name = config.name || config.type;
            this.providers.set(name, provider);

            if (config.isDefault || this.providers.size === 1) {
                this.defaultProvider = provider;
            }
        } catch (error) {
            throw APIError.BadRequest(`Failed to add email provider: ${config.type}`, 'PROVIDER_ADD_ERROR', error);
        }
    }

    public async removeProvider(name: string): Promise<void> {
        const provider = this.providers.get(name);
        if (!provider) {
            throw APIError.NotFound(`Provider not found: ${name}`);
        }

        this.providers.delete(name);
        if (this.defaultProvider === provider) {
            this.defaultProvider = this.providers.values().next().value || undefined;
        }
    }

    public setDefaultProvider(name: string): void {
        const provider = this.providers.get(name);
        if (!provider) {
            throw APIError.NotFound(`Provider not found: ${name}`);
        }
        this.defaultProvider = provider;
    }

    public async sendEmail(options: EmailOptions): Promise<any> {
        const provider = this.getProvider(options.provider);

        try {
            return await provider.sendMail(options);
        } catch (error) {
            if (error instanceof APIError) throw error;
            throw APIError.BadRequest('Failed to send email', 'EMAIL_SEND_ERROR', error);
        }
    }

    public async verifyAllConnections(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();
        for (const [name, provider] of this.providers) {
            try {
                const isConnected = await provider.verifyConnection();
                console.log(`Connection status for provider "${name}": ${isConnected ? 'Success' : 'Failure'}`);
                results.set(name, isConnected);
            } catch (error) {
                results.set(name, false);
            }
        }
        return results;
    }

    private createProvider(config: ProviderConfig): BaseEmailProvider {
        // To assert the type of config as ProviderConfig to let TypeScript know it has the necessary properties.
        // This was necessary because of TypeScript cannot infer the type of the config parameter in the createProvider method, and as a result, it defaults to never. 
        const providerConfig = config as ProviderConfig;
        switch (config.type) {
            case 'smtp':
                return new SMTPProvider(providerConfig);
            case 'gmail':
                return new GmailProvider(providerConfig);
            case 'sendgrid':
                return new SendGridProvider(config);
            case 'mailgun':
                return new MailgunProvider(providerConfig);
            default:
                throw APIError.BadRequest(`Unsupported provider type: ${providerConfig.type}`);
        }
    }

    private getProvider(providerName?: string): BaseEmailProvider {
        if (providerName) {
            const provider = this.providers.get(providerName);
            if (!provider) {
                throw APIError.NotFound(`Provider not found: ${providerName}`);
            }
            return provider;
        }

        if (!this.defaultProvider) {
            throw APIError.BadRequest('No email provider configured');
        }

        return this.defaultProvider;
    }
}



export const setupEmailProviders = async (): Promise<void> => {
    try {
        const emailService = EmailService.getInstance();
        
        // Find all active providers in the database
        const providers = await EmailProvider.find({ isActive: true });
        
        if (providers.length === 0) {
            // await initializeDefaultProviders()
            console.log("No active email providers found in database.");
            return;
        }

        // Add each provider to the email service
        for (const provider of providers) {
            try {
                const providerConfig = provider.toProviderConfig();
                await emailService.addProvider(providerConfig);
                
                // Update last verified timestamp
                provider.lastVerified = new Date();
                await provider.save();
                
                // console.log(`Successfully initialized provider: ${provider.name}`);
            } catch (error) {
                console.error(`Failed to initialize provider ${provider.name}:`, error);
                
                // Update failure count and status
                provider.failureCount += 1;
                provider.connectionStatus = false;
                await provider.save();
            }
        }

        // Verify all connections
        const connectionStatus = await emailService.verifyAllConnections();
        
        // Update connection status in database
        for (const [name, status] of connectionStatus) {
            await EmailProvider.findOneAndUpdate(
                { name },
                { 
                    $set: { 
                        connectionStatus: status,
                        lastVerified: new Date()
                    }
                }  
            );
        }

    } catch (error) {
        console.error("Failed to setup email providers:", error);
        // throw new APIError.InternalServerError("Failed to setup email providers");
    }
};

// Initialize default providers if database is empty
// async function initializeDefaultProviders(): Promise<void> {
//     try {
//         // Create SMTP Provider
//         await EmailProvider.create({
//             name: 'default-smtp',
//             type: 'smtp',
//             isDefault: true,
//             isActive: true,
//             host: process.env.SMTP_HOST,
//             port: Number(process.env.SMTP_PORT),
//             secure: true,
//             from: process.env.SMTP_FROM,
//             auth: {
//                 type: 'smtp',
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASS
//             }
//         });

//         // Create Gmail Provider
//         await EmailProvider.create({
//             name: 'gmail',
//             type: 'gmail',
//             isActive: true,
//             from: process.env.GMAIL_FROM,
//             auth: {
//                 type: 'oauth2',
//                 user: process.env.GMAIL_USER,
//                 clientId: process.env.GMAIL_CLIENT_ID,
//                 clientSecret: process.env.GMAIL_CLIENT_SECRET,
//                 redirectUrl: process.env.GMAIL_REDIRECT_URI,
//                 callbackUrl:process.env.GMAIL_CALLBACK_URI,
//             }
//         });

//         // Optional: Create SendGrid Provider
//         // if (process.env.SENDGRID_API_KEY) {
//         //     await EmailProvider.create({
//         //         name: 'sendgrid',
//         //         type: 'sendgrid',
//         //         isActive: true,
//         //         from: process.env.SENDGRID_FROM,
//         //         auth: {
//         //             type: 'api',
//         //             apiKey: process.env.SENDGRID_API_KEY
//         //         }
//         //     });
//         // }

//         // // Optional: Create Mailgun Provider
//         // if (process.env.MAILGUN_API_KEY) {
//         //     await EmailProvider.create({
//         //         name: 'mailgun',
//         //         type: 'mailgun',
//         //         isActive: true,
//         //         from: process.env.MAILGUN_FROM,
//         //         domain: process.env.MAILGUN_DOMAIN,
//         //         auth: {
//         //             type: 'api',
//         //             apiKey: process.env.MAILGUN_API_KEY
//         //         }
//         //     });
//         // }

//         console.log("Successfully initialized default providers in database");
        
//         // Recursively call setup to initialize the service with new providers
//         await setupEmailProviders();

//     } catch (error) {
//         console.error("Failed to initialize default providers:", error);
//         // throw new APIError.InternalServerError("Failed to initialize default email providers");
//     }
// }
