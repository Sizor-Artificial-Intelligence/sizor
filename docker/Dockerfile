# ---------- BUILD STAGE ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV npm_config_loglevel=info \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_fetch_timeout=300000 \
    npm_config_fetch_retries=5

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

COPY . .

ARG VITE_NODE_ENV=production
ARG VITE_DOMAIN
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL
ARG VITE_API_URL_DEV
ARG VITE_PHONE_NUMBER_WHATSAPP

ENV VITE_NODE_ENV=${VITE_NODE_ENV} \
    VITE_DOMAIN=${VITE_DOMAIN} \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_API_URL_DEV=${VITE_API_URL_DEV} \
    VITE_PHONE_NUMBER_WHATSAPP=${VITE_PHONE_NUMBER_WHATSAPP}

RUN npx prisma generate \
  && npm run build \
  && npm prune --omit=dev

# ---------- PRODUCTION STAGE ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl curl ca-certificates dumb-init tzdata \
  && ln -sf /usr/share/zoneinfo/America/Bogota /etc/localtime \
  && echo "America/Bogota" > /etc/timezone \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    TZ=America/Bogota

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl --fail --silent http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
