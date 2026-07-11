// email.providers.routes.ts
import express from "express";
import { GmailProvider } from "./email.providers.config";
import { EmailService } from "../nodemailer/nodemailer.config";
import EmailProvider from './email.providers.model';
import { OAuth2AuthConfig } from '@/types/email/mailer.types';

interface TokenRefreshError {
    response?: {
        data?: {
            error?: string;
            error_description?: string;
        };
    };
    status?: number;
    message?: string;
}

const router = express.Router();

router.get('/auth/gmail/:email', async (req, res) => {
    try {
        const { email } = req.params;

        // Find the Gmail provider for this email in the database
        const provider = await EmailProvider.findOne({
            'auth.user': email,
            type: 'gmail',
            isActive: true
        });

        if (!provider) {
            res.status(404).send('Gmail provider not configured for this email');
            return;
        }


        const emailService = EmailService.getInstance();

        const gmailProvider = Array.from(emailService['providers'].values())
            .find(provider => provider instanceof GmailProvider);

        console.log('Gmail Provider found:', !!gmailProvider);

        if (!gmailProvider) {
            res.status(500).send('Gmail provider not configured');
            return;
        }

        const gmailProviderInstance = gmailProvider as GmailProvider;

        // Get the authorization URL for initial token retrieval
        const authUrl = gmailProviderInstance.getAuthUrl();

        res.redirect(authUrl);
    } catch (error) {
    }
});

router.get('/gmail-callback/:email', async (req, res): Promise<void> => {
    try {
        const { email } = req.params;
        const { code } = req.query;

        if (!code || typeof code !== 'string') {
            res.status(400).send('No code provided');
            return;
        }

        // Check if provider exists in database for this email
        const providerExists = await EmailProvider.findOne({
            'auth.user': email,
            type: 'gmail'
        });

        if (!providerExists) {
            res.status(404).send('No Gmail provider configured for this email');
            return;
        }

        const emailService = EmailService.getInstance();
        const gmailProvider = Array.from(emailService['providers'].values())
            .find(provider =>
                provider instanceof GmailProvider &&
                ((provider as GmailProvider).config.auth as OAuth2AuthConfig).user === email
            );

        if (!gmailProvider) {
            res.status(500).send('Gmail provider not initialized for this email');
            return;
        }

        const gmailProviderInstance = gmailProvider as GmailProvider;
        
        await gmailProviderInstance.handleCallback(code);

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isConnected = await gmailProviderInstance.verifyConnection();
        if (isConnected) {
            res.send('Gmail authentication successful! You can close this window.');
        } else {
            res.status(500).send('Failed to verify Gmail connection');
        }
    } catch (error) {
        console.error('Gmail callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Create a temporary debug route to test your tokens
// Add this to your email.providers.routes.ts temporarily

router.post('/debug/gmail/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const provider = await EmailProvider.findOne({
            'auth.user': email,
            type: 'gmail'
        });

        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const { google } = require('googleapis');
        const { OAuth2Client } = require('google-auth-library');

        // Create OAuth2 client with your credentials
        const oAuth2Client = new OAuth2Client(
            provider.auth.clientId,
            provider.auth.clientSecret,
            provider.auth.redirectUrl // Try with redirectUrl first
        );

        console.log('Debug info:', {
            email: provider.auth.user,
            clientId: provider.auth.clientId,
            redirectUrl: provider.auth.redirectUrl,
            callbackUrl: provider.auth.callbackUrl,
            hasRefreshToken: !!provider.auth.refreshToken,
            refreshTokenLength: provider.auth.refreshToken?.length,
            hasAccessToken: !!provider.auth.accessToken,
            tokenExpiry: provider.auth.expiryDate ? new Date(provider.auth.expiryDate).toISOString() : 'none'
        });

        // Set only the refresh token
        oAuth2Client.setCredentials({
            refresh_token: provider.auth.refreshToken
        });

        try {
            // Try to get a new access token
            const { token, credentials } = await oAuth2Client.getAccessToken();
            
            res.json({
                success: true,
                message: 'Token refresh successful',
                tokenInfo: {
                    hasAccessToken: !!token,
                    accessTokenLength: token?.length,
                    expiryDate: credentials?.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'none',
                    scope: credentials?.scope,
                    tokenType: credentials?.token_type
                }
            });
            
        } catch (tokenError) {
            console.error('Token refresh error:', tokenError);

            let errorDetails: {
                errorCode: string | undefined;
                errorDescription: string | undefined;
                status: number | undefined;
                message: string | undefined;
            } = {
                errorCode: undefined,
                errorDescription: undefined,
                status: undefined,
                message: undefined
            };

            if (typeof tokenError === 'object' && tokenError !== null) {
                const typedError = tokenError as TokenRefreshError;
                errorDetails = {
                    errorCode: typedError.response?.data?.error,
                    errorDescription: typedError.response?.data?.error_description,
                    status: typedError.status,
                    message: typedError.message
                };
            }

            res.json({
                success: false,
                error: 'Token refresh failed',
                details: errorDetails
            });
        }

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            error: 'Debug failed',
            details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error)
        });
    }
});

export default router;