# Stage 1: build
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install build dependencies (use package.json / package-lock.json if present)
COPY package*.json ./
# install python and build tools so node-gyp and native modules can build,
# then run npm ci in the same layer and clean apt lists to keep image small
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential g++ make ca-certificates git && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential g++ make ca-certificates git && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --production --legacy-peer-deps

# Copy built Next.js output and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/lingui.config.js ./

EXPOSE 3000

CMD ["npm", "start"]
