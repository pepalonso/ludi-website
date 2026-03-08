#!/usr/bin/env bash
# Build multi-arch image (amd64 + arm64) and push to the registry.
# No deploy. Run this first, then deploy_test.sh or deploy_prod.sh.
#
# Usage: ./scripts/build-push.sh [TAG]
#   TAG defaults to VERSION file (e.g. 0.1.0-beta).

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

[ -n "$DOCKER_REGISTRY_IMAGE" ] || die "DOCKER_REGISTRY_IMAGE is not set in .env.deploy"

if [ -n "${1:-}" ]; then
  TAG="$1"
elif [ -f "$REPO_ROOT/VERSION" ]; then
  TAG="$(cat "$REPO_ROOT/VERSION" | tr -d '[:space:]')"
else
  TAG="latest"
fi

IMAGE="${DOCKER_REGISTRY_IMAGE}:${TAG}"

if ! docker buildx version &>/dev/null; then
  die "docker buildx is required. Run: docker buildx create --name multiarch --use"
fi

info "Building multi-arch: $IMAGE (linux/amd64, linux/arm64)"
cd "$REPO_ROOT"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$IMAGE" \
  --push \
  -f Dockerfile .

info "Pushed $IMAGE — next: ./scripts/deploy_test.sh $TAG or ./scripts/deploy_prod.sh $TAG"
