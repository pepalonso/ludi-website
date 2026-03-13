#!/usr/bin/env bash
# Run migrations on the test or prod server via SSH (same as deploy).
# Uses .env.deploy for PROD_HOST, PROD_USER, PROD_APP_DIR_* and the server's
# .env.prod.local for DB credentials (DB_USER, DATABASE_PASSWORD, DB_NAME).
#
# Usage: ./scripts/migrate-env.sh test|prod up | down [version] | status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/database/migrations"

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

ENV_NAME="${1:-}"
CMD="${2:-}"
ARG="${3:-}"

if [ "$ENV_NAME" = "test" ]; then
  PROD_APP_DIR="${PROD_APP_DIR_TEST:-}"
elif [ "$ENV_NAME" = "prod" ]; then
  PROD_APP_DIR="${PROD_APP_DIR_PROD:-}"
else
  die "First argument must be 'test' or 'prod'. Use migrate_test.sh or migrate_prod.sh."
fi

[ -n "$PROD_HOST" ]    || die "PROD_HOST is not set in .env.deploy"
[ -n "$PROD_USER" ]    || die "PROD_USER is not set in .env.deploy"
[ -n "$PROD_APP_DIR" ] || die "PROD_APP_DIR_${ENV_NAME^^} is not set in .env.deploy"
[ -n "$DOCKER_REGISTRY_IMAGE" ] || die "DOCKER_REGISTRY_IMAGE is not set in .env.deploy"

# APP_IMAGE needed so compose file validates (same as deploy-from-local.sh)
if [ -f "$REPO_ROOT/VERSION" ]; then
  TAG=$(tr -d '[:space:]' < "$REPO_ROOT/VERSION")
else
  TAG="latest"
fi
APP_IMAGE="${DOCKER_REGISTRY_IMAGE}:${TAG}"
APP_IMAGE_ESC=$(printf '%s' "$APP_IMAGE" | sed "s/'/'\\\\''/g")

SSH_TARGET="${PROD_USER}@${PROD_HOST}"
# Escape PROD_APP_DIR for remote shell (may contain spaces or quotes)
APP_DIR_ESC=$(printf '%s' "$PROD_APP_DIR" | sed "s/'/'\\\\''/g")

# Remote: cd to app dir, load .env.prod.local, set APP_IMAGE, run mysql inside db container.
# Same order as deploy-from-local.sh: try docker-compose first, then docker compose
run_sql_remote() {
  local sql="$1"
  local sql_escaped
  sql_escaped=$(printf '%s' "$sql" | sed "s/'/'\\\\''/g")
  ssh "$SSH_TARGET" "cd '$APP_DIR_ESC' && set -a && . ./.env.prod.local 2>/dev/null && set +a && export APP_IMAGE='$APP_IMAGE_ESC' && (docker-compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T db mysql -u\"\$DB_USER\" -p\"\$DATABASE_PASSWORD\" \"\$DB_NAME\" -e '$sql_escaped') || (docker compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T db mysql -u\"\$DB_USER\" -p\"\$DATABASE_PASSWORD\" \"\$DB_NAME\" -e '$sql_escaped')"
}

run_sql_file_remote() {
  local file="$1"
  cat "$file" | ssh "$SSH_TARGET" "cd '$APP_DIR_ESC' && set -a && . ./.env.prod.local 2>/dev/null && set +a && export APP_IMAGE='$APP_IMAGE_ESC' && (docker-compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T db mysql -u\"\$DB_USER\" -p\"\$DATABASE_PASSWORD\" \"\$DB_NAME\") || (docker compose -f docker-compose.prod.registry.yml --env-file .env.prod.local exec -T db mysql -u\"\$DB_USER\" -p\"\$DATABASE_PASSWORD\" \"\$DB_NAME\")"
}

ensure_schema_migrations() {
  run_sql_remote "CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT UNSIGNED PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );"
}

get_current_version() {
  local out
  out=$(run_sql_remote "SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations;" 2>/dev/null | tail -1 | tr -d ' \t\r')
  echo "${out:-0}"
}

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
    run_sql_file_remote "$path"
    run_sql_remote "INSERT INTO schema_migrations (version) VALUES ($version);"
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
  run_sql_file_remote "$down_file"
  run_sql_remote "DELETE FROM schema_migrations WHERE version = $target;"
  info "Rolled back version $target"
}

status() {
  ensure_schema_migrations
  local current
  current=$(get_current_version)
  info "Current version on $ENV_NAME: $current"
  echo ""
  echo "Applied:"
  run_sql_remote "SELECT version, applied_at FROM schema_migrations ORDER BY version;" 2>/dev/null || true
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
    info "Running migrations on $ENV_NAME ($SSH_TARGET:$PROD_APP_DIR)"
    migrate_up
    ;;
  down)
    info "Rolling back migration on $ENV_NAME ($SSH_TARGET:$PROD_APP_DIR)"
    migrate_down
    ;;
  status)
    status
    ;;
  "")
    echo "Usage: $0 test|prod up | down [version] | status"
    echo "  up       Apply all pending migrations (or up to version if given)"
    echo "  down     Roll back latest migration (or given version)"
    echo "  status   Show current version and pending migrations"
    exit 0
    ;;
  *)
    die "Unknown command: $CMD (use up, down, or status)"
    ;;
esac
