#!/usr/bin/env bash
# Run or rollback database migrations.
#
# Usage:
#   ./scripts/migrate.sh up              # Apply all pending migrations
#   ./scripts/migrate.sh up 2            # Apply up to and including version 2
#   ./scripts/migrate.sh down            # Rollback the latest applied migration
#   ./scripts/migrate.sh down 2          # Rollback version 2
#   ./scripts/migrate.sh status          # Show applied and pending migrations
#
# Connection:
#   ./scripts/migrate.sh docker up       # Use Docker Compose db (before other args)
#   DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... ./scripts/migrate.sh up
#
# Env (direct MySQL): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# Defaults match docker-compose.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/database/migrations"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
die() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Parse "docker" from args so subcommand is $1 or $2
USE_DOCKER=""
if [ "${1:-}" = "docker" ]; then
  USE_DOCKER=1
  shift
fi

CMD="${1:-}"
ARG="${2:-}"

# Defaults (match docker-compose)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3307}"
DB_USER="${DB_USER:-tournament_user}"
DB_PASSWORD="${DB_PASSWORD:-tournament_dev_pass}"
DB_NAME="${DB_NAME:-tournament}"
# For direct mysql (non-Docker): --skip-ssl so local DBs without SSL work.
# Omit for Docker (client runs inside container). Set MYSQL_USE_SSL=1 to not pass --skip-ssl.
MYSQL_EXTRA_OPTS=""
[ -z "$USE_DOCKER" ] && [ "${MYSQL_USE_SSL:-0}" != "1" ] && MYSQL_EXTRA_OPTS="--skip-ssl"

run_sql() {
  local sql="$1"
  if [ -n "$USE_DOCKER" ]; then
    docker compose -f "$REPO_ROOT/docker-compose.yml" exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$sql"
  else
    mysql $MYSQL_EXTRA_OPTS -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$sql"
  fi
}

run_sql_file() {
  local file="$1"
  if [ -n "$USE_DOCKER" ]; then
    docker compose -f "$REPO_ROOT/docker-compose.yml" exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
  else
    mysql $MYSQL_EXTRA_OPTS -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
  fi
}

ensure_schema_migrations() {
  run_sql "CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT UNSIGNED PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );"
}

# Output current max applied version (number only), or 0 if none
get_current_version() {
  local out
  out=$(run_sql "SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations;" 2>/dev/null | tail -1 | tr -d ' \t\r')
  echo "${out:-0}"
}

# List migration .up.sql files: one line per "version path" (version number, then path), sorted by version
list_up_migrations() {
  for f in "$MIGRATIONS_DIR"/[0-9]*_*.up.sql; do
    [ -f "$f" ] || continue
    local base name version
    base=$(basename "$f")
    name="${base%.up.sql}"
    version="${name%%_*}"
    echo "$version $f"
  done | sort -n
}

# List migration .down.sql files: one line per "version path", sorted by version desc (latest first)
list_down_migrations() {
  for f in "$MIGRATIONS_DIR"/[0-9]*_*.down.sql; do
    [ -f "$f" ] || continue
    local base name version
    base=$(basename "$f")
    name="${base%.down.sql}"
    version="${name%%_*}"
    echo "$version $f"
  done | sort -rn
}

migrate_up() {
  ensure_schema_migrations
  local target="${ARG:-999999}"
  local current
  current=$(get_current_version)
  local applied=0
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    local version path
    version="${line%% *}"
    path="${line#* }"
    if [ "$version" -le "$current" ]; then
      continue
    fi
    if [ "$version" -gt "$target" ]; then
      break
    fi
    info "Applying migration $version ($path)"
    run_sql_file "$path"
    run_sql "INSERT INTO schema_migrations (version) VALUES ($version);"
    info "Applied version $version"
    applied=$((applied + 1))
    current=$version
  done < <(list_up_migrations)
  if [ "$applied" -eq 0 ]; then
    info "No pending migrations."
  fi
}

migrate_down() {
  ensure_schema_migrations
  local current
  current=$(get_current_version)
  if [ "$current" -eq 0 ]; then
    warn "No migrations applied; nothing to roll back."
    return 0
  fi
  local target="${ARG:-$current}"
  if [ "$target" -gt "$current" ]; then
    die "Version $target is not applied; current is $current."
  fi
  local down_file=""
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    local version path
    version="${line%% *}"
    path="${line#* }"
    if [ "$version" = "$target" ]; then
      down_file="$path"
      break
    fi
  done < <(list_down_migrations)
  if [ -z "$down_file" ] || [ ! -f "$down_file" ]; then
    die "No .down.sql found for version $target"
  fi
  info "Rolling back migration $target ($down_file)"
  run_sql_file "$down_file"
  run_sql "DELETE FROM schema_migrations WHERE version = $target;"
  info "Rolled back version $target"
}

status() {
  ensure_schema_migrations
  local current
  current=$(get_current_version)
  info "Current version: $current"
  echo ""
  echo "Applied:"
  run_sql "SELECT version, applied_at FROM schema_migrations ORDER BY version;" 2>/dev/null || true
  echo ""
  echo "Pending (up):"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    local version path
    version="${line%% *}"
    path="${line#* }"
    if [ "$version" -gt "$current" ]; then
      echo "  $version  $path"
    fi
  done < <(list_up_migrations)
}

case "$CMD" in
  up)
    migrate_up
    ;;
  down)
    migrate_down
    ;;
  status)
    status
    ;;
  "")
    echo "Usage: $0 [docker] up [version] | down [version] | status"
    echo "  up       Apply all pending migrations (or up to version if given)"
    echo "  down     Roll back latest migration (or given version)"
    echo "  status   Show current version and pending migrations"
    exit 0
    ;;
  *)
    die "Unknown command: $CMD (use up, down, or status)"
    ;;
esac
