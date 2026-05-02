# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
RUN npm ci --frozen-lockfile --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads && chown -R node:node uploads

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
