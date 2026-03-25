# ── Base image ────────────────────────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="IUC Student"
LABEL description="pkgman — CLI Package Management System"

# ── System dependencies ───────────────────────────────────────────────────────
# Install yarn (optional — used when --yarn flag is passed)
RUN npm install -g yarn

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Install pkgman itself ─────────────────────────────────────────────────────
# Copy package manifests first (better layer caching)
COPY package*.json ./

RUN npm ci --only=production

# Copy source code
COPY . .

# Make the CLI binary executable
RUN chmod +x bin/cli.js

# Install pkgman globally inside the container
RUN npm link

# ── Default working directory for managed projects ───────────────────────────
RUN mkdir -p /workspace
WORKDIR /workspace

# ── Entrypoint ────────────────────────────────────────────────────────────────
ENTRYPOINT ["pkgman"]
CMD ["--help"]
