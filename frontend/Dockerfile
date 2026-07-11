# ------------------------------
# Stage 1: Build Next.js app
# ------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies using npm ci
COPY package*.json ./
RUN npm ci

# Copy environment variables (production)
COPY .env .env

# Copy source code
COPY . .

# Build Next.js app (Standalone output mode)
RUN npm run build

# ------------------------------
# Stage 2: Production
# ------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and public folder
COPY --from=builder /app/public ./public

# Set correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js using the standalone server
CMD ["node", "server.js"]