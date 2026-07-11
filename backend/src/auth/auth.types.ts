import { IUser } from '@/types/user.types.js';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            token?: string;
            // requestId: string;
        }
    }
}
