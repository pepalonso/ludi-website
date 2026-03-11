# Admin accounts

Admins are stored in the `admins` table (email + bcrypt password). Login uses the DB; you can remove `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` if they were set.

## Create an admin

From the **server/go-server** directory (so `.env` and DB config are available):

```bash
go run ./cmd/add-admin --email=admin@example.com --password=yourpassword
```

- Use a **strong password**.
- If the email already exists, the command exits with an error.

## First-time setup

1. Apply the schema so the `admins` table exists (e.g. run `database/schema.sql` or your migration).
2. Create the first admin with the command above.

## Password from env

To avoid putting the password on the command line:

```bash
ADMIN_PASSWORD=yourpassword go run ./cmd/add-admin --email=admin@example.com
```

## Create an admin on test or prod (deployed environment)

Uses the same host and config as deploy (`.env.deploy`: `PROD_HOST`, `PROD_USER`, `PROD_APP_DIR_TEST` / `PROD_APP_DIR_PROD`). The app image must already be deployed (it includes `/app/add-admin`).

From **server/go-server**:

```bash
# Password from env (recommended)
ADMIN_PASSWORD=yourpassword ./scripts/create-admin.sh test admin@example.com
ADMIN_PASSWORD=yourpassword ./scripts/create-admin.sh prod admin@example.com

# Or pass password as third argument
./scripts/create-admin.sh test admin@example.com yourpassword
./scripts/create-admin.sh prod admin@example.com yourpassword
```
