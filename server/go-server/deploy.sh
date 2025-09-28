#!/bin/bash

# Tournament Management System Production Deployment Script
# This script deploys the application to a Linux production server

set -e  # Exit on any error

echo "🚀 Tournament Management System - Production Deployment"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user with sudo privileges."
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Go is installed (for CLI tools)
if ! command -v go &> /dev/null; then
    print_warning "Go is not installed. CLI tools will not be available."
    print_warning "You can still use docker-compose directly."
fi

print_success "Prerequisites check passed"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    print_error ".env.prod not found!"
    print_status "Creating from template..."
    
    if [ -f "env.prod.example" ]; then
        cp env.prod.example .env.prod
        print_success ".env.prod created from template"
        print_warning "⚠️  IMPORTANT: Edit .env.prod with secure passwords before continuing!"
        print_status "Please edit .env.prod and run this script again."
        exit 1
    else
        print_error "env.prod.example not found!"
        exit 1
    fi
fi

# Check if passwords are still default
if grep -q "CHANGE_THIS_TO_SECURE" .env.prod; then
    print_error "Default passwords detected in .env.prod!"
    print_warning "Please edit .env.prod with secure passwords before continuing."
    exit 1
fi

print_success "Environment configuration verified"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Pull latest images (if using remote registry)
print_status "Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service status
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Health check
print_status "Performing health checks..."

# Check database
if docker-compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost &> /dev/null; then
    print_success "Database is healthy"
else
    print_error "Database health check failed"
    exit 1
fi

# Check Go server
if curl -f http://localhost:8080/health &> /dev/null; then
    print_success "Go server is healthy"
else
    print_warning "Go server health check failed (may still be starting up)"
fi

print_success "Deployment completed successfully!"
echo ""
echo "📊 Service Information:"
echo "  - Go Server: http://localhost:8080"
echo "  - API Health: http://localhost:8080/health"
echo "  - Database: localhost:3306 (localhost only)"
echo ""
echo "🔧 Management Commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "📝 Logs location:"
echo "  - Application logs: docker-compose -f docker-compose.prod.yml logs app"
echo "  - Database logs: docker-compose -f docker-compose.prod.yml logs db" 