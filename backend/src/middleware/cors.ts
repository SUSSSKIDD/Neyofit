import cors from 'cors';

const isProd = process.env.NODE_ENV === 'production';

// Allowed origins - exact matches
const allowedOrigins = [
    'https://neyofit.in',
    'https://www.neyofit.in',
    'https://api.neyofit.in',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Regex for preview deployments (e.g., preview-123.neyofit.in)
const allowedOriginRegex = /^https:\/\/.*\.neyofit\.in$/;

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow non-browser requests (no origin header)
        if (!origin) {
            return callback(null, true);
        }

        // Check exact matches
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Check regex for preview deployments
        if (allowedOriginRegex.test(origin)) {
            return callback(null, true);
        }

        // In development, allow localhost
        if (!isProd && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
        }

        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: isProd ? 86400 : 600, // 24 hours in prod, 10 min in dev
    preflightContinue: false,
    optionsSuccessStatus: 204
};

export default cors(corsOptions);