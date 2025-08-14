# Multi-stage build for Dev Launcher
FROM node:20-alpine AS base

# Install required tools
RUN apk add --no-cache \
    curl \
    bash \
    git \
    docker-cli \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json* ./
COPY server/prisma ./server/prisma/

# Install dependencies
FROM base AS deps
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

FROM base AS dev-deps
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Development stage
FROM base AS development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=./server/prisma/schema.prisma
CMD ["npm", "run", "dev:server"]

# Build stage
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=./server/prisma/schema.prisma
RUN npm run build:server

# Production stage
FROM node:20-alpine AS production
RUN apk add --no-cache curl docker-cli
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 9976

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:9976/api/v1/health || exit 1

CMD ["node", "dist/server/src/index.js"]