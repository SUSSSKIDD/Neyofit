import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '@/utils/logger.js';

// Extend Request interface to include requestId
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            startTime: number;
        }
    }
}

// Generate unique request ID
const generateRequestId = (): string => {
    return randomUUID();
};

// Logging middleware
const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Generate unique request ID
    req.requestId = generateRequestId();
    req.startTime = Date.now();

    // Log incoming request
    logger.info(`Incoming ${req.method} request`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        headers: req.headers
    }, req.requestId);

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any): Response {
        const responseTime = Date.now() - req.startTime;

        // Log response
        logger.logRequest(
            req.method,
            req.url,
            res.statusCode,
            responseTime,
            req.requestId
        );

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
    };

    next();
};

export default loggingMiddleware;
