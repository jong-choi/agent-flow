FROM node:20-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time envs used by Next.js build (if referenced during build/render).
ARG AUTH_GOOGLE_ID
ARG AUTH_GOOGLE_SECRET
ARG AUTH_SECRET
ARG AUTH_URL
ARG BASE_URL
ARG DATABASE_URL
ARG TEST_PASSWORD
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN
ARG GOOGLE_AI_API_KEY
ARG GOOGLE_SEARCH_API_KEY
ARG GOOGLE_SEARCH_CX
ARG NAVER_CLIENT_ID
ARG NAVER_CLIENT_SECRET
ARG BRAVE_API_KEY
ARG SEARXNG_API_KEY
ARG SEARXNG_BASE_URL
ARG GROQ_API_KEY

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
USER nextjs
CMD ["node", "server.js"]
