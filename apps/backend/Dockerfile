# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy shared package
COPY packages/shared/ ./packages/shared/

# Copy backend package
COPY apps/backend/package.json ./apps/backend/

# Install all workspace dependencies
RUN npm ci --workspace=@basemsg/backend --include-workspace-root

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Build NestJS (TypeScript → dist/)
WORKDIR /app/apps/backend
RUN npx nest build

# ── Stage 2: Production ────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy shared package (runtime dependency)
COPY packages/shared/ ./packages/shared/

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN npm ci --workspace=@basemsg/backend --include-workspace-root --omit=dev

# Copy built output from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/main"]
