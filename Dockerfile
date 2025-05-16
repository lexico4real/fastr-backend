# Stage 1: Development (with hot-reload)
FROM node:22-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "start:dev"]

# Stage 2: Production Builder
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY --from=development /usr/src/app .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /usr/src/app

# Copy production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/.env ./

# Security hardening
RUN apk add --no-cache dumb-init
RUN addgroup -S nodejs && \
    adduser -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /usr/src/app
USER nodejs

HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl --fail http://localhost:3000/api/health || exit 1

EXPOSE 3000
ENV NODE_ENV=production
CMD ["dumb-init", "node", "dist/main.js"]