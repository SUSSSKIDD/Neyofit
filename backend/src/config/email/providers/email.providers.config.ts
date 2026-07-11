// src/services/email/providers/email.providers.config.ts
import nodemailer from 'nodemailer';
import EmailProvider from './email.providers.model';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { APIError } from '../../../utils/APIError';
import {
    ProviderConfig,
    EmailOptions,
    OAuth2AuthConfig,
    GmailConfig
} from '@/types/email/mailer.types';

export abstract class BaseEmailProvider {
    protected transporter!: nodemailer.Transporter;
    public config: ProviderConfig;
    private isInitialized: boolean = false;
    private lastConnectionTime?: Date;
    private readonly RECONNECT_THRESHOLD = 1000 * 60 * 30;

    constructor(config: ProviderConfig) {
        this.config = config;
    }

    protected getBaseEmailOptions(options: EmailOptions) {
        return {
            from: options.from || this.config.from,
            replyTo: options.replyTo || this.config.replyTo,
            ...options
        };
    }

    protected async ensureConnection(): Promise<void> {
        if (!this.isInitialized || this.shouldReconnect()) {
            await this.initialize();
            this.isInitialized = true;
            this.lastConnectionTime = new Date();
        }
    }

    private shouldReconnect(): boolean {
        if (!this.lastConnectionTime) return true;
        const timeSinceLastConnection = Date.now() - this.lastConnectionTime.getTime();
        return timeSinceLastConnection > this.RECONNECT_THRESHOLD;
    }

    abstract initialize(): Promise<void>;
    abstract verifyConnection(): Promise<boolean>;

    async sendMail(options: EmailOptions): Promise<any> {
        try {
            await this.ensureConnection();

            if (!options.to || (!options.text && !options.html)) {
                throw APIError.BadRequest('Missing required email fields');
            }

            const emailOptions = this.getBaseEmailOptions(options);
            return await this.transporter.sendMail(emailOptions);
        } catch (error: any) {
            if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
                this.isInitialized = false; // Force reconnection next time
                throw APIError.BadRequest('Email server connection failed', 'EMAIL_CONNECTION_ERROR', error);
            }
            if (error instanceof APIError) throw error;
            throw APIError.BadRequest('Failed to send email', 'EMAIL_SEND_ERROR', error);
        }
    }
}

export class SMTPProvider extends BaseEmailProvider {
    async initialize(): Promise<void> {
        try {
            if (this.config.type !== 'smtp') {
                throw new Error('Invalid config type for SMTP provider');
            }

            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.auth.user,
                    pass: this.config.auth.pass
                }
            });
        } catch (error) {
            throw APIError.BadRequest('Failed to initialize SMTP provider', 'SMTP_INIT_ERROR', error);
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Error during SMTP connection verification:', error);
            throw APIError.BadRequest('SMTP connection verification failed');
        }
    }
}


export class GmailProvider extends BaseEmailProvider {
    private oAuth2Client!: OAuth2Client;
    public refreshToken?: string | undefined;    

    private isTokenError(error: any): boolean {
        return error.code === 'EAUTH' ||
            error.message?.includes('invalid_grant') ||
            error.message?.includes('Invalid Credentials') ||
            error.message?.includes('invalid_token');
    }

    async sendMail(options: EmailOptions): Promise<any> {
        const emailOptions = this.getBaseEmailOptions(options);
        try {
            return await this.transporter.sendMail(emailOptions);
        } catch (error: any) {
            if (this.isTokenError(error)) {
                try {
                    const { token: newAccessToken } = await this.oAuth2Client.getAccessToken();

                    if (!newAccessToken) {
                        throw new Error('Failed to get new access token');
                    }

                    if (!this.refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    await this.updateTokenAndTransporter(this.refreshToken, newAccessToken);
                    return await this.transporter.sendMail(emailOptions);

                } catch (refreshError) {
                    console.error('Failed to refresh token during send:', refreshError);
                    throw APIError.Unauthorized('Failed to refresh Gmail authentication');
                }
            }
            // If it's not a token error, throw the original error
            if (error instanceof APIError) throw error;
            throw APIError.BadRequest('Failed to send email', 'EMAIL_SEND_ERROR', error);
        }
    }

    private async updateTokenAndTransporter(refreshToken: string, accessToken: string): Promise<void> {
        const auth = this.config.auth as OAuth2AuthConfig;
        const email = auth.user

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: auth.user,
                clientId: auth.clientId,
                clientSecret: auth.clientSecret,
                refreshToken: refreshToken,
                accessToken: accessToken
            }
        });
        await this.storeRefreshToken(refreshToken, false);
    }

    private async storeRefreshToken(refreshToken: string, reinitialize:boolean): Promise<void> {
        try {

            if (!refreshToken) {
                throw new Error('Refresh token and email are required');
            }

            const credentials = this.oAuth2Client.credentials;
            const auth = this.config.auth as OAuth2AuthConfig;

            await EmailProvider.findOneAndUpdate(
                {
                    'auth.user': auth.user,
                    type: 'gmail'
                },
                {
                    $set: {
                        'auth.refreshToken': refreshToken,
                        'auth.accessToken': credentials.access_token || null,
                        'auth.tokenType': credentials.token_type || 'Bearer',
                        'auth.scope': credentials.scope || '',
                        'auth.expiryDate': credentials.expiry_date || Date.now() + 3600 * 1000,
                        lastVerified: new Date(),
                        lastUpdated: new Date(),
                        isActive: true
                    }
                },
                { new: true }
            );

            // Update instance properties
            this.refreshToken = refreshToken;

            (this.config as GmailConfig).auth = {
                ...(this.config.auth as OAuth2AuthConfig),
                refreshToken,
                accessToken: credentials.access_token || '',
                tokenType: credentials.token_type || 'Bearer',
                scope: credentials.scope || '',
                expiryDate: credentials.expiry_date || Date.now() + 3600 * 1000
            };

            // here just update the current instance locally auth data also

            if(reinitialize){
                this.initialize();
            }
        } catch (error) {
            console.error('Failed to store OAuth credentials:', error);
            throw new Error('Failed to store OAuth credentials in database');
        }
    }

    async initialize(): Promise<void> {
        try {
            if (this.config.type !== 'gmail') {
                throw new Error('Invalid config type for Gmail provider');
            }

            const auth = this.config.auth as OAuth2AuthConfig;

            this.oAuth2Client = new google.auth.OAuth2(
                auth.clientId,
                auth.clientSecret,
                auth.callbackUrl,
            );

            // Create transporter without access token initially
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: auth.user,
                    clientId: auth.clientId,
                    clientSecret: auth.clientSecret,
                }
            });

            // Only attempt to set credentials if refresh token exists
            if (auth.refreshToken) {
                this.refreshToken = auth.refreshToken;
                this.oAuth2Client.setCredentials({
                    refresh_token: this.refreshToken
                });

                try {
                    const accessToken = await this.getAccessToken();
                    await this.updateTokenAndTransporter(this.refreshToken, accessToken);
                } catch (tokenError) {
                    console.log('Initial access token retrieval failed:', tokenError);
                }
            }
        } catch (error) {
            throw APIError.BadRequest('Failed to initialize Gmail provider', 'GMAIL_INIT_ERROR', error);
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error: any) {
            if (this.isTokenError(error)) {
                const { token } = await this.oAuth2Client.getAccessToken();
                if (token && this.refreshToken) {
                    await this.updateTokenAndTransporter(this.refreshToken, token);
                    return await this.transporter.verify();
                }
            }
            console.error('Gmail connection verification error:', error);
            throw APIError.BadRequest('Gmail connection verification failed');
        }
    }

    private async getAccessToken(): Promise<string> {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            const { token } = await this.oAuth2Client.getAccessToken();
            if (!token) throw new Error('Failed to get access token');

            console.log('Access token retrieved successfully');
            return token;
        } catch (error) {
            console.error('Access token error:', error);
            throw APIError.Unauthorized('Failed to get OAuth2 access token');
        }
    }

    getAuthUrl(): string {
        const SCOPES = [
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose'
        ];

        return this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });
    }

    async handleCallback(code: string): Promise<void> {
        try {
            const { tokens } = await this.oAuth2Client.getToken(code);
            this.refreshToken = tokens.refresh_token ?? undefined;

            if (this.refreshToken) {
                this.oAuth2Client.setCredentials({
                    refresh_token: this.refreshToken,
                    access_token: tokens.access_token,
                    scope: tokens.scope,
                    token_type: tokens.token_type,
                    expiry_date: tokens.expiry_date
                });
                await this.storeRefreshToken(this.refreshToken, true);
            } else {
                console.warn('No refresh token received');
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw APIError.BadRequest('Failed to handle OAuth callback', 'OAUTH_CALLBACK_ERROR', error);
        }
    }
}

export class SendGridProvider extends BaseEmailProvider {
    async initialize(): Promise<void> {
        try {
            if (this.config.type !== 'sendgrid') {
                throw new Error('Invalid config type for SendGrid provider');
            }

            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: this.config.auth.apiKey
                }
            });
        } catch (error) {
            throw APIError.BadRequest('Failed to initialize SendGrid provider', 'SENDGRID_INIT_ERROR', error);
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            throw APIError.BadRequest('SendGrid connection verification failed');
        }
    }
}

export class MailgunProvider extends BaseEmailProvider {
    async initialize(): Promise<void> {
        try {
            if (this.config.type !== 'mailgun') {
                throw new Error('Invalid config type for Mailgun provider');
            }

            this.transporter = nodemailer.createTransport({
                host: 'smtp.mailgun.org',
                port: 587,
                secure: false,
                auth: {
                    user: 'postmaster@' + this.config.domain,
                    pass: this.config.auth.apiKey
                }
            });
        } catch (error) {
            throw APIError.BadRequest('Failed to initialize Mailgun provider', 'MAILGUN_INIT_ERROR', error);
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            throw APIError.BadRequest('Mailgun connection verification failed');
        }
    }
}
