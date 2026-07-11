// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import logger from '@/utils/logger.js';

// // Get current directory for ES6 modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, '../../.env') });

// const connectDB = async (): Promise<void> => {
//     try {
//         const mongoURI = process.env.MONGODB_URI || 'mongodb://mongo-docker:27017/Neyofit';

//         await mongoose.connect(mongoURI);

//         logger.info('✅ MongoDB connected successfully');
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//         logger.error('❌ MongoDB connection error:', new Error(errorMessage));
//         process.exit(1);
//     }
// };

// export default connectDB;


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
console.log(`🔹 Loading environment variables from: ${path.join(__dirname, '../../.env')}`);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection function
const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://mongo-docker:27017/Neyofit';

        console.log(`🔹 Attempting to connect to MongoDB at: ${mongoURI}`);

        const connection = await mongoose.connect(mongoURI);

        console.log('🔹 MongoDB connection details:');
        console.log(`  Host: ${connection.connection.host}`);
        console.log(`  Port: ${connection.connection.port}`);
        console.log(`  Database: ${connection.connection.name}`);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ MongoDB connection failed');
        console.error(`Error details: ${errorMessage}`);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
        process.exit(1); // Exit process with failure code
    }
};

export default connectDB;
