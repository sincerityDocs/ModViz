FROM node:20-alpine

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package manifest first (cache-friendly)
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install all deps (handles missing lockfile gracefully on first run)
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY amazon-scraper/ ./amazon-scraper/
COPY ebay-scraper/ ./ebay-scraper/
COPY google-serp/ ./google-serp/

# Build TypeScript
RUN pnpm build

# Which connector to run — pass at build time:
#   docker build --build-arg CONNECTOR=amazon-scraper .
#   docker build --build-arg CONNECTOR=ebay-scraper .
#   docker build --build-arg CONNECTOR=google-serp .
ARG CONNECTOR=amazon-scraper
ENV CONNECTOR_ID=${CONNECTOR}

# Runtime: node runs the compiled JS for the selected connector
CMD sh -c "node dist/${CONNECTOR_ID}/src/index.js"
