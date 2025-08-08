# Solarify Solar Marketplace Application
# Multi-stage Docker build for production deployment

# =====================================================
# STAGE 1: Dependencies
# =====================================================
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production --ignore-scripts; \
  else echo "No package-lock.json found. Please run 'npm install' to generate one." && exit 1; \
  fi

# =====================================================
# STAGE 2: Builder
# =====================================================
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Install all dependencies (including devDependencies)
RUN npm ci --ignore-scripts

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# =====================================================
# STAGE 3: Runner
# =====================================================
FROM node:18-alpine AS runner
WORKDIR /app

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy additional files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p /app/.next/cache
RUN mkdir -p /app/uploads

# Set correct permissions
RUN chown -R nextjs:nodejs /app
RUN chown -R nextjs:nodejs /app/.next
RUN chown -R nextjs:nodejs /app/uploads

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js || exit 1

# Start the application
CMD ["node", "server.js"]

# =====================================================
# DEVELOPMENT DOCKERFILE
# =====================================================
FROM node:18-alpine AS development
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set development environment
ENV NODE_ENV development
ENV NEXT_TELEMETRY_DISABLED 1

# Start development server
CMD ["npm", "run", "dev"]

# =====================================================
# BUILD METADATA
# =====================================================
LABEL maintainer="Solarify Team"
LABEL description="Solarify Solar Marketplace Application"
LABEL version="1.0.0"
LABEL org.opencontainers.image.title="Solarify App"
LABEL org.opencontainers.image.description="Production-ready solar marketplace platform"
LABEL org.opencontainers.image.vendor="Solarify"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/solarify/solarify-app"