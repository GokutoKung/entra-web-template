# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Build stage — install with Bun and produce the static bundle.
# No VITE_* build args: configuration is injected at RUNTIME (see the runtime
# stage / docker/40-configure.sh), so one image works for any tenant.
# ─────────────────────────────────────────────────────────────
FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source and build.
COPY . .
RUN bun run build

# ─────────────────────────────────────────────────────────────
# Runtime stage — serve the static files with nginx.
# On startup docker/40-configure.sh resolves config.yaml + the listen port
# (env PORT > server.port in config.yaml > 8080) and renders the nginx config.
# ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# SPA nginx template, rendered by the entrypoint (NOT nginx's own template dir),
# so the port can come from config.yaml as well as the PORT env var.
COPY nginx.conf.template /etc/nginx/spa.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# nginx's official entrypoint runs executable scripts in this dir before start.
COPY docker/40-configure.sh /docker-entrypoint.d/40-configure.sh
RUN chmod +x /docker-entrypoint.d/40-configure.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- "http://localhost:$(cat /tmp/nginx.port 2>/dev/null || echo 8080)/" >/dev/null 2>&1 || exit 1

# nginx:alpine already runs `nginx -g "daemon off;"` as its default CMD.
