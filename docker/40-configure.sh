#!/bin/sh
# Runs at container startup (before nginx) to:
#   1. Resolve the app config.yaml (generate from AZURE_* env, or keep a mount).
#   2. Resolve the listen port: env PORT > server.port in config.yaml > 8080.
#   3. Render the nginx config with that port.
# So the port can be set in config.yaml, with env PORT overriding it (e.g. for
# Azure Container Apps / Cloud Run, which inject PORT).
set -eu

HTML_DIR="/usr/share/nginx/html"
CONFIG_FILE="${HTML_DIR}/config.yaml"
NGINX_TEMPLATE="/etc/nginx/spa.conf.template"
NGINX_CONF="/etc/nginx/conf.d/default.conf"
PORT_FILE="/tmp/nginx.port"

# Escape backslashes and double quotes for safe embedding in a YAML string.
esc() {
  printf '%s' "${1:-}" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# Extract the first "port: <number>" (server.port) from config.yaml, if present.
port_from_config() {
  [ -f "$CONFIG_FILE" ] || return 1
  awk 'match($0, /port:[[:space:]]*[0-9]+/) {
         s = substr($0, RSTART, RLENGTH); gsub(/[^0-9]/, "", s); print s; exit
       }' "$CONFIG_FILE"
}

# 1) Resolve the listen port (before regenerating config.yaml).
if [ -n "${PORT:-}" ]; then
  RESOLVED_PORT="$PORT"
else
  RESOLVED_PORT="$(port_from_config || true)"
  [ -n "${RESOLVED_PORT:-}" ] || RESOLVED_PORT=8080
fi

# 2) Resolve the app config.yaml.
if [ -n "${AZURE_CLIENT_ID:-}" ]; then
  cat > "$CONFIG_FILE" <<EOF
server:
  port: ${RESOLVED_PORT}
azure:
  clientId: "$(esc "${AZURE_CLIENT_ID:-}")"
  tenantId: "$(esc "${AZURE_TENANT_ID:-}")"
  authorityHost: "$(esc "${AZURE_AUTHORITY_HOST:-}")"
  redirectUri: "$(esc "${AZURE_REDIRECT_URI:-}")"
  postLogoutRedirectUri: "$(esc "${AZURE_POST_LOGOUT_REDIRECT_URI:-}")"
  scopes: "$(esc "${AZURE_SCOPES:-}")"
EOF
  echo "[configure] rendered ${CONFIG_FILE} from environment"
elif [ -f "$CONFIG_FILE" ]; then
  echo "[configure] using existing ${CONFIG_FILE}"
else
  echo "azure: {}" > "$CONFIG_FILE"
  echo "[configure] no AZURE_* env and no mounted config; wrote empty ${CONFIG_FILE}"
fi

# 3) Render the nginx config with the resolved port.
export PORT="$RESOLVED_PORT"
envsubst '${PORT}' < "$NGINX_TEMPLATE" > "$NGINX_CONF"
printf '%s' "$RESOLVED_PORT" > "$PORT_FILE"
echo "[configure] nginx listening on ${RESOLVED_PORT}"
