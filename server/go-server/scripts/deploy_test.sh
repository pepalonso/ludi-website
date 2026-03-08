#!/usr/bin/env bash
# Deploy to the test environment (Pi or server). Builds multi-arch image and restarts test.
# Usage: ./scripts/deploy_test.sh [TAG]
exec "$(dirname "$0")/deploy-from-local.sh" test "$@"
