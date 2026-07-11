# Neyofit Backend

Express.js backend with TypeScript, ES6 modules, MongoDB, and CORS support.

## Features

- ✅ Express.js with TypeScript
- ✅ ES6 modules support
- ✅ MongoDB with Mongoose
- ✅ CORS middleware configured
- ✅ Environment variables support
- ✅ Development server with nodemon auto-restart

## Prerequisites

- Node.js (v18 or higher)
- MongoDB running locally or MongoDB Atlas connection

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env .env
```

3. Update `.env` with your MongoDB connection string

## Development

Start development server:
```bash
npm run dev
```

The server will automatically restart when you make changes to your TypeScript files.

## Build & Production

Build the project:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Clean build directory

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # MongoDB connection
│   ├── middleware/
│   │   └── cors.ts          # CORS configuration
│   └── server.ts            # Main server file
├── package.json
├── tsconfig.json
├── env
└── README.md
```

## API Endpoints

- `GET /api/v1/` - Welcome message
- `GET /api/v1/health` - Health check

## Environment Variables

- `PORT` - Server port (default: 4170)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - Allowed CORS origin
