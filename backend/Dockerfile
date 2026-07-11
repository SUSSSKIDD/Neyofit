# Stage 1: Build TypeScript code
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using npm ci
RUN npm ci

# Copy all source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directories for gym pictures
RUN mkdir -p /app/uploads/gym-pictures /app/uploads/general

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]