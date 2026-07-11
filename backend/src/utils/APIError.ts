export class APIError extends Error {
    public statusCode: number;
    public code?: string;
    public details?: unknown;

    constructor(message: string, statusCode: number, code?: string, details?: unknown) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    static BadRequest(message: string = 'Bad Request', code?: string, details?: unknown): APIError {
        return new APIError(message, 400, code, details);
    }

    static Unauthorized(message: string = 'Unauthorized', code?: string, details?: unknown): APIError {
        return new APIError(message, 401, code, details);
    }

    static Forbidden(message: string = 'Forbidden', code?: string, details?: unknown): APIError {
        return new APIError(message, 403, code, details);
    }

    static NotFound(message: string = 'Not Found', code?: string, details?: unknown): APIError {
        return new APIError(message, 404, code, details);
    }

    static InternalError(message: string = 'Internal Server Error', code?: string, details?: unknown): APIError {
        return new APIError(message, 500, code, details);
    }
}
