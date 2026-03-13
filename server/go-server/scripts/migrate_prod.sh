#!/usr/bin/env bash
# Run migrations against the prod database.
# Usage: ./scripts/migrate_prod.sh up | down [version] | status
# Requires .env.deploy with DB_PROD_HOST, DB_PROD_USER, DB_PROD_PASSWORD, DB_PROD_NAME (and optional DB_PROD_PORT).
exec "$(dirname "$0")/migrate-env.sh" prod "$@"
