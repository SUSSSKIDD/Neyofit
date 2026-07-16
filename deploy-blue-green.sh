#!/bin/bash
set -e

# Blue-Green Deployment Script for Neyofit
# This script performs zero-downtime deployment using blue-green strategy

# Configuration
PROJECT_DIR="/srv/projects/pratyush/neyofit"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
SYMLINK_NAME="neyofit.conf"
COMPOSE_FILE="docker-compose.yml"
DB_COMPOSE_FILE="docker-compose.db.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Health check function
check_health() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $name to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url/health" > /dev/null 2>&1; then
            log_info "$name is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$name health check failed after $max_attempts attempts"
    return 1
}

# Start deployment
cd "$PROJECT_DIR" || { log_error "Project directory not found"; exit 1; }

log_info "=== Starting Blue-Green Deployment ==="

# Determine current active environment
if [ -L "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}" ]; then
    CURRENT_CONF=$(readlink "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}")
    if [[ "$CURRENT_CONF" == *"neyofit-blue.conf"* ]]; then
        ACTIVE_ENV="blue"
        NEW_ENV="green"
    else
        ACTIVE_ENV="green"
        NEW_ENV="blue"
    fi
else
    ACTIVE_ENV="none"
    NEW_ENV="blue"
fi

log_info "Current active environment: $ACTIVE_ENV"
log_info "Deploying to: $NEW_ENV environment"

# Pull latest code
log_info "Pulling latest code from main branch..."
git pull origin main || { log_error "Git pull failed"; exit 1; }

# Build and start new environment
log_info "Building and starting $NEW_ENV environment..."
docker compose -f "$COMPOSE_FILE" build --no-cache "backend-${NEW_ENV}" "frontend-${NEW_ENV}" || {
    log_error "Docker build failed"
    exit 1
}

docker compose -f "$COMPOSE_FILE" up -d "backend-${NEW_ENV}" "frontend-${NEW_ENV}" || {
    log_error "Failed to start new environment containers"
    exit 1
}

# Wait for services to initialize
log_info "Waiting for services to initialize (15s)..."
sleep 15

# Health checks
BACKEND_PORT=$([ "$NEW_ENV" = "blue" ] && echo 8905 || echo 8915)
FRONTEND_PORT=$([ "$NEW_ENV" = "blue" ] && echo 8906 || echo 8916)

log_info "Running health checks..."
check_health "http://localhost:${BACKEND_PORT}" "Backend ($NEW_ENV)" || {
    log_error "Backend health check failed, rolling back..."
    docker compose -f "$COMPOSE_FILE" stop "backend-${NEW_ENV}" "frontend-${NEW_ENV}"
    docker compose -f "$COMPOSE_FILE" rm -f "backend-${NEW_ENV}" "frontend-${NEW_ENV}"
    exit 1
}

check_health "http://localhost:${FRONTEND_PORT}" "Frontend ($NEW_ENV)" || {
    log_warn "Frontend health check failed, but continuing..."
}

# Switch Nginx configuration
log_info "Switching Nginx routing to $NEW_ENV..."
sudo cp "${PROJECT_DIR}/nginx/neyofit-${NEW_ENV}.conf" "${NGINX_SITES_AVAILABLE}/neyofit-${NEW_ENV}.conf" || {
    log_error "Failed to copy Nginx config"
    exit 1
}

sudo rm -f "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}"
sudo ln -s "${NGINX_SITES_AVAILABLE}/neyofit-${NEW_ENV}.conf" "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}" || {
    log_error "Failed to create Nginx symlink"
    exit 1
}

# Test Nginx config
if sudo nginx -t; then
    sudo systemctl reload nginx
    log_info "Nginx reloaded successfully"
else
    log_error "Nginx config test failed"
    exit 1
fi

# Wait for traffic to switch
sleep 5

# Tear down old environment
if [ "$ACTIVE_ENV" != "none" ]; then
    log_info "Stopping and removing old $ACTIVE_ENV environment..."
    docker compose -f "$COMPOSE_FILE" stop "backend-${ACTIVE_ENV}" "frontend-${ACTIVE_ENV}" || log_warn "Failed to stop old containers"
    docker compose -f "$COMPOSE_FILE" rm -f "backend-${ACTIVE_ENV}" "frontend-${ACTIVE_ENV}" || log_warn "Failed to remove old containers"
fi

# Clean up unused images
log_info "Cleaning up unused Docker images..."
docker image prune -f || log_warn "Image prune failed"

log_info "=== Blue-Green Deployment completed successfully! ==="
log_info "Active environment is now: $NEW_ENV"

# Show running containers
docker compose -f "$COMPOSE_FILE" ps