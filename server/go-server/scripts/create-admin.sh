#!/usr/bin/env bash
# Create an admin on the test or prod environment (same host/context as deploy).
# Requires the app image to be deployed (image includes /app/add-admin).
#
# Usage:
#   ADMIN_PASSWORD=yourpassword ./scripts/create-admin.sh test admin@example.com
#   ./scripts/create-admin.sh prod admin@example.com yourpassword
#
# Uses .env.deploy (PROD_HOST, PROD_USER, PROD_APP_DIR_TEST / PROD_APP_DIR_PROD).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$REPO_ROOT/.env.deploy" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env.deploy"
  set +a
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
die() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${GREEN}[INFO]${NC} $1"; }

ENV_NAME="${1:-}"
EMAIL="${2:-}"
PASSWORD="${3:-}"

if [ "$ENV_NAME" = "test" ] || [ "$ENV_NAME" = "prod" ]; then
  :
else
  die "First argument must be 'test' or 'prod'."
fi

[ -n "$EMAIL" ] || die "Usage: $0 test|prod <email> [password]   or   ADMIN_PASSWORD=xxx $0 test|prod <email>"

if [ -z "$PASSWORD" ]; then
  PASSWORD="${ADMIN_PASSWORD:-}"
fi
[ -n "$PASSWORD" ] || die "Set password via third argument or ADMIN_PASSWORD env."

[ -n "$PROD_HOST" ]    || die "PROD_HOST is not set in .env.deploy"
[ -n "$PROD_USER" ]   || die "PROD_USER is not set in .env.deploy"

if [ "$ENV_NAME" = "test" ]; then
  PROD_APP_DIR="${PROD_APP_DIR_TEST:-}"
else
  PROD_APP_DIR="${PROD_APP_DIR_PROD:-}"
fi
[ -n "$PROD_APP_DIR" ] || die "PROD_APP_DIR_${ENV_NAME^^} is not set in .env.deploy"

# APP_IMAGE required by compose file (same as deploy)
if [ -f "$REPO_ROOT/VERSION" ]; then
  TAG="$(cat "$REPO_ROOT/VERSION" | tr -d '[:space:]')"
else
  TAG="latest"
fi
IMAGE="${DOCKER_REGISTRY_IMAGE}:${TAG}"
[ -n "$DOCKER_REGISTRY_IMAGE" ] || die "DOCKER_REGISTRY_IMAGE is not set in .env.deploy"

SSH_TARGET="${PROD_USER}@${PROD_HOST}"

# Escape single quotes for remote shell: ' -> '\''
esc() { echo "$1" | sed "s/'/'\\\\''/g"; }
EMAIL_ESC=$(esc "$EMAIL")
PASS_ESC=$(esc "$PASSWORD")

info "Creating admin on $ENV_NAME: $EMAIL"
ssh "$SSH_TARGET" "cd $PROD_APP_DIR && export APP_IMAGE='$IMAGE' && \
  (docker-compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T app /app/add-admin --email='$EMAIL_ESC' --password='$PASS_ESC') || \
  (docker compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T app /app/add-admin --email='$EMAIL_ESC' --password='$PASS_ESC')"

info "Admin created: $EMAIL"
