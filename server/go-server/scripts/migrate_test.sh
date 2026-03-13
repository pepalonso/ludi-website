#!/usr/bin/env bash
# Run migrations against the test database.
# Usage: ./scripts/migrate_test.sh up | down [version] | status
# Requires .env.deploy with DB_TEST_HOST, DB_TEST_USER, DB_TEST_PASSWORD, DB_TEST_NAME (and optional DB_TEST_PORT).
exec "$(dirname "$0")/migrate-env.sh" test "$@"
