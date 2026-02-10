FROM node:20-alpine AS base

RUN apk add --no-cache ca-certificates

# 1) deps + build
FROM base AS builder
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm i; \
  fi

COPY . .

# ---- Build-time env (필요한 경우에만) ----
ARG AUTH_GOOGLE_SECRET
ENV AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}
ARG AUTH_SECRET
ENV AUTH_SECRET=${AUTH_SECRET}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

ARG TEST_PASSWORD
ENV TEST_PASSWORD=${TEST_PASSWORD}
ARG GOOGLE_AI_API_KEY
ENV GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
ARG GOOGLE_SEARCH_API_KEY
ENV GOOGLE_SEARCH_API_KEY=${GOOGLE_SEARCH_API_KEY}
ARG NAVER_CLIENT_SECRET
ENV NAVER_CLIENT_SECRET=${NAVER_CLIENT_SECRET}
ARG BRAVE_API_KEY
ENV BRAVE_API_KEY=${BRAVE_API_KEY}
ARG SEARXNG_API_KEY
ENV SEARXNG_API_KEY=${SEARXNG_API_KEY}
ARG GROQ_API_KEY
ENV GROQ_API_KEY=${GROQ_API_KEY}

ARG AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
ARG AUTH_URL
ENV AUTH_URL=${AUTH_URL}
ARG BASE_URL
ENV BASE_URL=${BASE_URL}
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}
ARG GOOGLE_SEARCH_CX
ENV GOOGLE_SEARCH_CX=${GOOGLE_SEARCH_CX}
ARG NAVER_CLIENT_ID
ENV NAVER_CLIENT_ID=${NAVER_CLIENT_ID}
ARG SEARXNG_BASE_URL
ENV SEARXNG_BASE_URL=${SEARXNG_BASE_URL}

RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm build; \
  else npm run build; \
  fi


# 2) runner (standalone)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone 산출물
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 런타임에서도 필요하면 env로 들어올 수 있게 ARG만 열어둠 (실제 값은 compose env_file로 주입)
ARG AUTH_GOOGLE_SECRET
ARG AUTH_SECRET
ARG DATABASE_URL
ARG TEST_PASSWORD
ARG GOOGLE_AI_API_KEY
ARG GOOGLE_SEARCH_API_KEY
ARG NAVER_CLIENT_SECRET
ARG BRAVE_API_KEY
ARG SEARXNG_API_KEY
ARG GROQ_API_KEY
ARG AUTH_GOOGLE_ID
ARG AUTH_URL
ARG BASE_URL
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN
ARG GOOGLE_SEARCH_CX
ARG NAVER_CLIENT_ID
ARG SEARXNG_BASE_URL

USER nextjs
CMD ["node", "server.js"]
