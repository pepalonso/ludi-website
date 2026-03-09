#!/usr/bin/env bash
# Deploy to server only: SSH, pull image, restart. No build (run build-push.sh first).
#
# Usage:
#   ./scripts/deploy_test.sh [TAG]   or   ./scripts/deploy_prod.sh [TAG]
#   Or: ./scripts/deploy-from-local.sh test [TAG]  /  deploy-from-local.sh prod [TAG]
#   TAG defaults to VERSION file. Image must already be in the registry (./scripts/build-push.sh).
#
# Flow: build-push.sh  →  deploy_test.sh / deploy_prod.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load config first
if [ -f "$REPO_ROOT/.env.deploy" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env.deploy"
  set +a
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

die() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# First arg: test or prod
ENV_NAME="${1:-}"
if [ "$ENV_NAME" = "test" ] || [ "$ENV_NAME" = "prod" ]; then
  shift
else
  die "First argument must be 'test' or 'prod'. Use deploy_test.sh or deploy_prod.sh, or: $0 test|prod [TAG]"
fi

# Second arg (optional): tag
if [ -n "${1:-}" ]; then
  TAG="$1"
elif [ -f "$REPO_ROOT/VERSION" ]; then
  TAG="$(cat "$REPO_ROOT/VERSION" | tr -d '[:space:]')"
else
  TAG="latest"
fi

# Set PROD_APP_DIR from env-specific var
if [ "$ENV_NAME" = "test" ]; then
  PROD_APP_DIR="${PROD_APP_DIR_TEST:-}"
else
  PROD_APP_DIR="${PROD_APP_DIR_PROD:-}"
fi

[ -n "$DOCKER_REGISTRY_IMAGE" ] || die "DOCKER_REGISTRY_IMAGE is not set in .env.deploy"
[ -n "$PROD_HOST" ]             || die "PROD_HOST is not set"
[ -n "$PROD_USER" ]             || die "PROD_USER is not set"
[ -n "$PROD_APP_DIR" ]          || die "PROD_APP_DIR_${ENV_NAME^^} is not set in .env.deploy"

IMAGE="${DOCKER_REGISTRY_IMAGE}:${TAG}"
SSH_TARGET="${PROD_USER}@${PROD_HOST}"

info "Deploying to $ENV_NAME: pull and restart (APP_IMAGE=$IMAGE)"
# Use docker-compose (standalone) for Pi/older Docker; fallback to docker compose (plugin).
# --pull always: ensure we get the latest image for this tag from the registry (avoids stale cache).
ssh "$SSH_TARGET" "cd $PROD_APP_DIR && \
  export APP_IMAGE=$IMAGE && \
  (docker-compose -f docker-compose.prod.registry.yml --env-file .env.prod.local pull app && \
   docker-compose -f docker-compose.prod.registry.yml --env-file .env.prod.local up -d --force-recreate app) || \
  (docker compose -f docker-compose.prod.registry.yml --env-file .env.prod.local pull app && \
   docker compose -f docker-compose.prod.registry.yml --env-file .env.prod.local up -d --force-recreate app)"

info "Done. Check health: ssh $SSH_TARGET 'curl -s http://localhost:\${GO_SERVER_PORT:-8080}/health'"
