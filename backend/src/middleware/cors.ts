import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
