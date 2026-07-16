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

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Copy built files from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create uploads directories
RUN mkdir -p /app/uploads/gym-pictures /app/uploads/general \
    && chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start server
CMD ["node", "dist/server.js"]