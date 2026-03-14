# Stage 1: Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-bookworm-slim AS runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY drizzle.config.ts ./
COPY shared ./shared
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x scripts/start.sh

RUN useradd -r -u 1001 -m appuser
USER appuser

EXPOSE 5000
CMD ["scripts/start.sh"]
