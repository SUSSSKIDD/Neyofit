import { Request, Response, NextFunction } from 'express';
import { APIError } from '@/utils/APIError';
import logger from '@/utils/logger';

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof APIError) {
        logger.error(`APIError: ${err.message}`, err, {
            statusCode: err.statusCode,
            code: err.code,
            requestId: req.requestId
        });

        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(process.env.NODE_ENV === 'development' && err.details
                ? { details: err.details }
                : {})
        });
    }

    logger.error('Unhandled error', err, { requestId: req.requestId });

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development'
            ? { error: err.message }
            : {})
    });
};
