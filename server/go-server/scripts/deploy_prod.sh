#!/usr/bin/env bash
# Deploy to the prod environment. Builds multi-arch image and restarts prod.
# Usage: ./scripts/deploy_prod.sh [TAG]
exec "$(dirname "$0")/deploy-from-local.sh" prod "$@"
