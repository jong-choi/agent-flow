# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache ca-certificates

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}
# Only the prerender database connection is needed at build time. No model keys.
RUN --mount=type=secret,id=database_url,required=true \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    AUTH_SECRET=build-only-placeholder \
    NODE_OPTIONS=--max-old-space-size=1024 npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
CMD ["node", "server.js"]
