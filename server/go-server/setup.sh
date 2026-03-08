#!/bin/bash

# Tournament Management System Setup Script for Linux
# This script helps you set up the environment files for development and production

echo "🏀 Tournament Management System Setup"
echo "====================================="
echo ""

# Check if .env.dev exists
if [ ! -f ".env.dev" ]; then
    echo "📝 Creating .env.dev file..."
    if [ -f "env.dev.example" ]; then
        cp env.dev.example .env.dev
        echo "✅ .env.dev created from template"
    else
        echo "❌ env.dev.example not found!"
        echo "Please create .env.dev manually with the following variables:"
        echo "DB_NAME=tournament"
        echo "DB_USER=tournament_user"
        echo "DB_PASSWORD=tournament_dev_pass"
        echo "DB_ROOT_PASSWORD=admin_dev_root"
        echo "DB_PORT=3307"
        echo "PMA_PORT=8081"
        echo "APP_PORT=8080"
        echo "APP_ENV=development"
    fi
else
    echo "✅ .env.dev already exists"
fi

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "📝 Creating .env.prod file..."
    if [ -f "env.prod.example" ]; then
        cp env.prod.example .env.prod
        echo "✅ .env.prod created from template"
        echo "⚠️  IMPORTANT: Edit .env.prod with secure passwords!"
    else
        echo "❌ env.prod.example not found!"
        echo "Please create .env.prod manually with secure values"
    fi
else
    echo "✅ .env.prod already exists"
fi

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. For development: go run cmd/dev/main.go start"
echo "2. For production:  use scripts/deploy_test.sh or scripts/deploy_prod.sh (see docs/REGISTRY_AND_DEPLOY.md)"
echo ""
echo "Remember to edit .env.prod.local with secure passwords before using production!" 