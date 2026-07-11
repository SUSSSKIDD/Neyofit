export type ProviderType = 'smtp' | 'gmail' | 'sendgrid' | 'mailgun';

export type AuthType = 'smtp' | 'oauth2' | 'api' | 'certificate' | 'xoauth2' | 'custom';

export interface SMTPAuthConfig {
    type: 'smtp';
    user: string;
    pass: string;
}

export interface OAuth2AuthConfig {
    type: 'oauth2';
    user: string;
    clientId: string;
    clientSecret: string;
    redirectUrl?: string;
    callbackUrl?: string;
    refreshToken?: string;
    accessToken?: string;
    tokenType?: string;
    scope?: string;
    expiryDate?: number;
}

export interface APIAuthConfig {
    type: 'api';
    apiKey: string;
}

export type AuthConfig = SMTPAuthConfig | OAuth2AuthConfig | APIAuthConfig;

interface BaseProviderConfig {
    name?: string;
    from?: string;
    replyTo?: string;
    isDefault?: boolean;
}

export interface SMTPConfig extends BaseProviderConfig {
    type: 'smtp';
    host: string;
    port: number;
    secure: boolean;
    auth: SMTPAuthConfig;
}

export interface GmailConfig extends BaseProviderConfig {
    type: 'gmail';
    auth: OAuth2AuthConfig;
}

export interface SendGridConfig extends BaseProviderConfig {
    type: 'sendgrid';
    auth: APIAuthConfig;
}

export interface MailgunConfig extends BaseProviderConfig {
    type: 'mailgun';
    domain: string;
    auth: APIAuthConfig;
}

export type ProviderConfig = SMTPConfig | GmailConfig | SendGridConfig | MailgunConfig;

export interface EmailOptions {
    to: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    from?: string;
    replyTo?: string;
    provider?: string;
    bcc?: string | string[];
    cc?: string | string[];
    attachments?: Array<{
        filename: string;
        content?: string | Buffer;
        path?: string;
        contentType?: string;
    }>;
}
