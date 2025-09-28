# Tournament Management System Setup Script
# This script helps you set up the environment files for development and production

Write-Host "🏀 Tournament Management System Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if .env.dev exists
if (-not (Test-Path ".env.dev")) {
    Write-Host "📝 Creating .env.dev file..." -ForegroundColor Yellow
    if (Test-Path "env.dev.example") {
        Copy-Item "env.dev.example" ".env.dev"
        Write-Host "✅ .env.dev created from template" -ForegroundColor Green
    } else {
        Write-Host "❌ env.dev.example not found!" -ForegroundColor Red
        Write-Host "Please create .env.dev manually with the following variables:" -ForegroundColor Yellow
        Write-Host "DB_NAME=tournament" -ForegroundColor Cyan
        Write-Host "DB_USER=tournament_user" -ForegroundColor Cyan
        Write-Host "DB_PASSWORD=tournament_dev_pass" -ForegroundColor Cyan
        Write-Host "DB_ROOT_PASSWORD=admin_dev_root" -ForegroundColor Cyan
        Write-Host "DB_PORT=3307" -ForegroundColor Cyan
        Write-Host "PMA_PORT=8081" -ForegroundColor Cyan
        Write-Host "APP_PORT=8080" -ForegroundColor Cyan
        Write-Host "APP_ENV=development" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ .env.dev already exists" -ForegroundColor Green
}

# Check if .env.prod exists
if (-not (Test-Path ".env.prod")) {
    Write-Host "📝 Creating .env.prod file..." -ForegroundColor Yellow
    if (Test-Path "env.prod.example") {
        Copy-Item "env.prod.example" ".env.prod"
        Write-Host "✅ .env.prod created from template" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Edit .env.prod with secure passwords!" -ForegroundColor Red
    } else {
        Write-Host "❌ env.prod.example not found!" -ForegroundColor Red
        Write-Host "Please create .env.prod manually with secure values" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env.prod already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. For development: go run cmd/dev/main.go start" -ForegroundColor White
Write-Host "2. For production:  go run cmd/dev/main.go start-prod" -ForegroundColor White
Write-Host ""
Write-Host "Remember to edit .env.prod.local with secure passwords before using production!" -ForegroundColor Yellow 