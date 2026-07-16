import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: '.env' });

import connectDB from '@/config/database.js';
import corsMiddleware from '@/middleware/cors.js';
import loggingMiddleware from '@/middleware/logging.js';
import logger from '@/utils/logger.js';
import mainRoutes from '@/mainroutes';
import { specs } from '@/config/swagger.config.js';
import { globalErrorHandler } from '@/middleware/errorHandler';
import { securityHeaders, devSecurityHeaders } from '@/middleware/security';
import { setupEmailProviders } from '@/config/email/nodemailer/nodemailer.config';
import { startEmailScheduler } from '@/config/email/scheduler/neyofit-email-cron';
import { seedEmailTemplates } from '@/config/email/templates/seedTemplates';

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting and IP detection behind nginx
app.set('trust proxy', 1);

// Request size limits - prevent DoS via large payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser for HTTP-only cookies
app.use(cookieParser());

// Bootstrap: connect to DB first, then start the server
const bootstrap = async () => {
    // 1. Validate database connection before anything else
    await connectDB();
    logger.info('MongoDB connection established');

    // 2. Initialize email providers from database
    try {
        await setupEmailProviders();
        logger.info('Email providers initialized');
    } catch (error) {
        logger.error('Failed to initialize email providers', error as Error);
    }

    // 3. Seed email templates
    await seedEmailTemplates();

    // 4. Start email scheduler
    startEmailScheduler();

    // 5. Create upload directories
    const uploadDirs = [
        path.join(process.cwd(), 'uploads/gym-pictures'),
        path.join(process.cwd(), 'uploads/general')
    ];
    for (const dir of uploadDirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // 6. Security headers middleware (must be early)
    app.use(securityHeaders);
    
    // Development-only: allow unsafe-eval for hot reloading
    if (!isProduction) {
        app.use(devSecurityHeaders);
    }

    // CORS middleware
    app.use(corsMiddleware);

    // Logging middleware
    app.use(loggingMiddleware);

    // Serve uploaded files as static assets
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // API Documentation - DISABLED IN PRODUCTION
    if (!isProduction) {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Neyofit API Documentation'
        }));
    } else {
        // In production, return 404 for Swagger
        app.use('/api-docs', (req, res) => {
            res.status(404).json({ success: false, message: 'Not found' });
        });
    }

    // Use main routes
    app.use('/api/v1', mainRoutes);

    // Global error handler (must be after all routes)
    app.use(globalErrorHandler);

    // 7. Start server only after everything is ready
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Server URL: http://localhost:${PORT}`);
    });
};

bootstrap().catch((error) => {
    logger.error('Server failed to start', error);
    process.exit(1);
});

export default app;