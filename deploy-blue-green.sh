#!/bin/bash
set -e

# Define variables
PROJECT_DIR="/srv/projects/pratyush/neyofit" # Updated VPS project path
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
SYMLINK_NAME="neyofit.conf"

cd $PROJECT_DIR

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
    # If no symlink exists, default to starting blue
    ACTIVE_ENV="none"
    NEW_ENV="blue"
fi

echo "Current active environment is: $ACTIVE_ENV"
echo "Deploying to: $NEW_ENV environment"

# 1. Build and start new environment
echo "Building and starting $NEW_ENV environment..."
docker compose build --no-cache backend-${NEW_ENV} frontend-${NEW_ENV}
docker compose up -d backend-${NEW_ENV} frontend-${NEW_ENV}

# 2. Health check (simple wait + curl could be added, here we just wait 10 seconds for containers to initialize)
echo "Waiting for services to initialize (10s)..."
sleep 10

# TODO: Add specific curl health checks here if you have a health endpoint
# curl -f http://localhost:8915/api/health || exit 1

# 3. Switch Nginx configuration
echo "Switching Nginx routing to $NEW_ENV..."
sudo cp "${PROJECT_DIR}/nginx/neyofit-${NEW_ENV}.conf" "${NGINX_SITES_AVAILABLE}/neyofit-${NEW_ENV}.conf"

# Remove old symlink if exists
sudo rm -f "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}"

# Create new symlink
sudo ln -s "${NGINX_SITES_AVAILABLE}/neyofit-${NEW_ENV}.conf" "${NGINX_SITES_ENABLED}/${SYMLINK_NAME}"

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# 4. Tear down old environment
if [ "$ACTIVE_ENV" != "none" ]; then
    echo "Stopping and removing old $ACTIVE_ENV environment..."
    docker compose stop backend-${ACTIVE_ENV} frontend-${ACTIVE_ENV}
    docker compose rm -f backend-${ACTIVE_ENV} frontend-${ACTIVE_ENV}
fi

echo "✅ Blue-Green Deployment completed successfully. Active environment is now $NEW_ENV."
