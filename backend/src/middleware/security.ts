import { Request, Response, NextFunction } from 'express';

// Content Security Policy - Allow all required Google Maps domains
const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.razorpay.com https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com https://maps.gstatic.com data:",
    "img-src 'self' data: https: blob: https://maps.googleapis.com https://maps.gstatic.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.ggpht.com",
    "connect-src 'self' https://api.razorpay.com https://maps.googleapis.com https://*.googleapis.com https://*.google.com https://maps.googleapis.com/maps/api/mapsjs/gen_204 wss://*.neyofit.in",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
].join('; ');

// Permissions Policy - Only standard features, no Privacy Sandbox experimental features
const permissionsPolicy = [
    'accelerometer=()',
    'camera=()',
    'geolocation=(self)',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self "https://api.razorpay.com")',
    'usb=()',
    'display-capture=()',
    'fullscreen=(self)',
    'picture-in-picture=()',
].join(', ');

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Check production at request time, not module load time
    const isProduction = process.env.NODE_ENV === 'production';

    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS Protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict Transport Security (only in production)
    if (isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    res.setHeader('Content-Security-Policy', cspDirectives);

    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Cross-Origin policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cache control for sensitive endpoints
    if (req.path.startsWith('/api/v1/auth') || req.path.startsWith('/api/v1/payments')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }

    next();
};

// Additional CSP for development (allows eval for hot reloading)
export const devSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
        // Allow unsafe-eval in development for hot module reloading
        const devCsp = cspDirectives.replace("'unsafe-eval'", "'unsafe-eval'");
        res.setHeader('Content-Security-Policy', devCsp);
    }
    next();
};