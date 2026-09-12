FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
COPY migrations ./migrations
ENV AI_MAINTENANCE_ENABLED=false
USER node
CMD ["npm", "run", "models:maintenance", "--", "worker"]
