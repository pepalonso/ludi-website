# Database migrations

## When to migrate

- **New installs**: The full schema is applied from `schema.sql` when the DB is first created (e.g. Docker init). You can still run `migrate.sh up` to record applied versions; migration 000002 is idempotent.
- **Existing DBs**: If the database was created with an older schema, run `./scripts/migrate.sh up` to apply pending migrations.

## How to migrate

### Script (recommended): `scripts/migrate.sh`

From the **server/go-server** directory:

```bash
# Apply all pending migrations (Docker db by default)
./scripts/migrate.sh up

# Apply up to and including version 2
./scripts/migrate.sh up 2

# Roll back the latest applied migration
./scripts/migrate.sh down

# Roll back a specific version
./scripts/migrate.sh down 2

# Show current version and pending migrations
./scripts/migrate.sh status
```

**Connection:**

```bash
# Use Docker Compose db (pass "docker" before the command)
./scripts/migrate.sh docker up
./scripts/migrate.sh docker status

# Direct MySQL (env vars)
DB_HOST=prod-db.example.com DB_USER=... DB_PASSWORD=... DB_NAME=tournament ./scripts/migrate.sh up
```

**Env for direct MySQL:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (defaults match docker-compose).

Applied migrations are stored in the `schema_migrations` table (created automatically if missing).

### Test / prod (same pattern as deploy_test.sh, deploy_prod.sh)

Migrations run on the server via SSH. The script uses `.env.deploy` only for `PROD_HOST`, `PROD_USER`, `PROD_APP_DIR_TEST` / `PROD_APP_DIR_PROD`. DB credentials are read from the server’s `.env.prod.local` (same as deploy).

```bash
# Test server
./scripts/migrate_test.sh status
./scripts/migrate_test.sh up

# Prod server
./scripts/migrate_prod.sh status
./scripts/migrate_prod.sh up
```

On the server, `.env.prod.local` must define `DB_USER`, `DATABASE_PASSWORD`, and `DB_NAME` (same vars the app uses). The script runs `docker compose exec db mysql ...` (or `docker-compose`) in the deploy directory.

### Manual SQL

You can run migration files yourself, but you must then insert the version into `schema_migrations` so the script stays in sync:

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/migrations/000002_add_changes_log_team_id.up.sql
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "INSERT INTO schema_migrations (version) VALUES (2);"
```

## Migration files

| Version | File | Purpose |
|---------|------|---------|
| 1 | `000001_initial.up/down.sql` | No-op; full schema comes from `schema.sql` on first init. |
| 2 | `000002_add_changes_log_team_id.up/down.sql` | Adds `team_id` (and index) to `changes_log`; up is idempotent. |

**Adding a new migration:** Add `000003_description.up.sql` and `000003_description.down.sql`, then run `./scripts/migrate.sh up`.

