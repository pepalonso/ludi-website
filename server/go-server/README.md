# Tournament Management System

A generic tournament management system built with Go, MariaDB, and Docker.

## 🏗️ Architecture

- **Backend**: Go HTTP API with WebSocket support
- **Database**: MariaDB with optimized schema
- **Development**: Docker Compose with phpMyAdmin
- **Production**: Docker Compose with security best practices

## 📁 Project Structure

```
server/go-server/
├── cmd/
│   └── dev/
│       ├── main.go        # Main entry point
│       ├── utils.go       # Utility functions
│       ├── start.go       # Start command
│       ├── stop.go        # Stop command
│       ├── restart.go     # Restart command
│       ├── logs.go        # Logs command
│       ├── reset.go       # Reset command
│       ├── connect.go     # Connect command
│       ├── status.go      # Status command
│       └── help.go        # Help command
├── database/
│   └── schema.sql          # Database schema
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── .env.dev                # Development environment variables
├── .env.prod               # Production environment variables template
├── dev.ps1                 # PowerShell helper script
├── go.mod                  # Go module file
└── README.md              # This file
```

## 🚀 Quick Start (Development)

### Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for dev script)

### 1. Setup Environment

```bash
# Run the setup script to create environment files
.\setup.ps1

# Or manually copy the example files
cp env.dev.example .env.dev
cp env.prod.example .env.prod.local
# Edit .env.prod.local with secure passwords
```

### 2. Start Development Environment

```bash
# Using the Go CLI tool (recommended)
.\dev.ps1 start

# Or manually
docker-compose --env-file .env.dev up -d
```

### 3. Access Services

- **Database**: `localhost:3307`
- **phpMyAdmin**: http://localhost:8081
  - Username: `root`
  - Password: `admin_dev_root`
- **Go Server**: http://localhost:8080
- **API Health**: http://localhost:8080/health

### 4. Verify Setup

```bash
# Check status
go run cmd/dev/main.go status

# View logs
go run cmd/dev/main.go logs

# Connect to database
go run cmd/dev/main.go connect
```

## 🔧 Development Commands

```bash
# Start environment
go run cmd/dev/main.go start

# Stop environment
go run cmd/dev/main.go stop

# Restart environment
go run cmd/dev/main.go restart

# View logs
go run cmd/dev/main.go logs [service_name]

# Reset database (delete all data)
go run cmd/dev/main.go reset

# Connect to database CLI
go run cmd/dev/main.go connect

# Show status
go run cmd/dev/main.go status

# Show help
go run cmd/dev/main.go help
```

## 🚀 Production Commands

```bash
# Start production environment
go run cmd/dev/main.go start-prod

# Stop production environment
go run cmd/dev/main.go stop-prod

# Restart production environment
go run cmd/dev/main.go restart-prod

# View production logs
go run cmd/dev/main.go logs-prod

# Show production status
go run cmd/dev/main.go status-prod
```

## 🗄️ Database Schema

### Core Tables

- **clubs** - Tournament clubs/organizations
- **teams** - Tournament teams
- **players** - Team players
- **coaches** - Team coaches
- **allergies** - Player allergies/intolerances
- **documents** - Team documents

### Management Tables

- **registration_tokens** - Team access tokens
- **wa_tokens** - WhatsApp notification tokens
- **qr_tokens** - QR code access tokens
- **edit_sessions** - Team editing sessions
- **changes_log** - Audit trail
- **stats_cache** - Performance caching
- **ws_sessions** - WebSocket session tracking

### ENUM Values

#### Team Categories

- `Pre-mini`, `Mini`, `Pre-infantil`, `Infantil`, `Cadet`, `Júnior`

#### Gender

- `Masculí`, `Femení`

#### Team Status

- `pending_payment`, `canceled`, `active`

#### Shirt Sizes

- `8`, `10`, `12`, `14`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`, `4XL`

## 🔒 Production Deployment

### Linux Deployment (Recommended)

#### 1. Environment Setup

```bash
# Run the Linux setup script
./setup.sh

# Edit production environment with secure passwords
nano .env.prod.local
```

#### 2. Deploy Production

```bash
# Using the deployment script (recommended)
./deploy.sh

# Or using the Go CLI tool
go run cmd/dev/main.go start-prod

# Or manually
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
```

### Windows Deployment

#### 1. Environment Setup

```bash
# Run the PowerShell setup script
.\setup.ps1

# Edit production environment with secure passwords
notepad .env.prod.local
```

#### 2. Deploy Production

```bash
# Using the Go CLI tool
go run cmd/dev/main.go start-prod

# Or manually
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
```

### 3. Production Features

- **Security**: Localhost-only binding
- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Database and Go server availability monitoring
- **No phpMyAdmin**: Use SSH tunneling + CLI for database management
- **Containerized Go Server**: Fully containerized application stack

### 4. Database Management (Production)

```bash
# SSH tunnel to production server
ssh user@server -L 3306:localhost:3306

# Connect to database
mysql -h localhost -u tournament_user -p tournament
```

## 🔐 Security Best Practices

### Development

- Use `.env.dev` for local development
- phpMyAdmin available for easy database management
- Non-secure passwords (acceptable for local development)

### Production

- **Never** use phpMyAdmin in production
- Use SSH tunneling for database access
- Strong, unique passwords for all services
- Localhost-only binding for database ports
- Resource limits to prevent abuse
- Regular security updates

## 🛠️ Database Management

### Development (with phpMyAdmin)

1. Open http://localhost:8081
2. Login with `tournament_user` / `tournament_dev_pass`
3. Select `tournament` database

### Production (CLI)

```bash
# Connect via SSH tunnel
ssh user@server -L 3306:localhost:3306

# Connect to database
mysql -h localhost -u tournament_user -p tournament

# Common commands
SHOW TABLES;
DESCRIBE teams;
SELECT * FROM clubs;
```

## 🔄 Environment Variables

### Development (`.env.dev`)

```bash
DB_NAME=tournament
DB_USER=tournament_user
DB_PASSWORD=tournament_dev_pass
DB_ROOT_PASSWORD=admin_dev_root
DB_PORT=3307
PMA_PORT=8081
APP_PORT=8080
APP_ENV=development
```

### Production (`.env.prod`)

```bash
DB_NAME=tournament
DB_USER=tournament_user
DB_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD
DB_ROOT_PASSWORD=CHANGE_THIS_TO_SECURE_ROOT_PASSWORD
DB_PORT=3306
APP_PORT=8080
APP_ENV=production
JWT_SECRET=CHANGE_THIS_TO_SECURE_JWT_SECRET
SESSION_SECRET=CHANGE_THIS_TO_SECURE_SESSION_SECRET
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**

   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3307
   # Change port in env.dev if needed
   ```

2. **Database connection issues**

   ```bash
   # Check if database is running
   docker-compose ps
   # View database logs
   docker-compose logs db
   ```

3. **Go not found**

   ```bash
   # Install Go from https://golang.org/dl/
   # Or use package manager
   ```

4. **Reset everything**
   ```bash
   # Stop and remove everything
   docker-compose down -v
   # Start fresh
   .\dev.ps1 start
   ```

## 📝 Next Steps

1. **Go Application**: Implement the Go server with database connection
2. **API Endpoints**: Create REST API for team management
3. **WebSocket**: Implement real-time features
4. **Authentication**: Add JWT-based authentication
5. **File Upload**: Implement document upload functionality
6. **Testing**: Add unit and integration tests

## 🤝 Contributing

1. Follow the existing code structure
2. Use the development environment for testing
3. Update documentation for any changes
4. Test both development and production setups

## 📄 License

This project is part of the tournament management system.
