import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting for payment endpoints
// Allow maximum 100 payment attempts per 15 minutes
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many payment attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for localhost during development
  skip: (req: Request): boolean => {
    const ip = req.ip || (req as any).connection?.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  },
  // Custom handler for when rate limit is exceeded
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many payment attempts. Please try again later.',
      retryAfter: 900 // 15 minutes in seconds
    });
  },
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from counting against the limit
  skipFailedRequests: false
});

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost during development
  skip: (req: Request): boolean => {
    const ip = req.ip || (req as any).connection?.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }
});