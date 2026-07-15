#!/bin/bash
# SECRET ROTATION SCRIPT - RUN ON VPS (200.97.166.2)
# This script generates new secrets and updates configuration files.
# RUN THIS FIRST before any code deployment!

set -e

echo "========================================="
echo "  NEYOFIT SECRET ROTATION SCRIPT"
echo "  Run on VPS: 200.97.166.2"
echo "========================================="
echo ""

# Generate new secrets
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')
ENCRYPTION_KEY=$(openssl rand -hex 32)
RAZORPAY_WEBHOOK_SECRET=$(openssl rand -base64 32 | tr -d '\n')
MONGO_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')

echo "Generated new secrets:"
echo "  JWT_SECRET: ${JWT_SECRET}"
echo "  JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}"
echo "  ENCRYPTION_KEY: ${ENCRYPTION_KEY}"
echo "  RAZORPAY_WEBHOOK_SECRET: ${RAZORPAY_WEBHOOK_SECRET}"
echo "  MONGO_PASSWORD: ${MONGO_PASSWORD}"
echo ""

# Backup current .env files
cp /srv/projects/pratyush/neyofit/backend/.env /srv/projects/pratyush/neyofit/backend/.env.backup.$(date +%s)
cp /srv/projects/pratyush/neyofit/frontend/.env /srv/projects/pratyush/neyofit/frontend/.env.backup.$(date +%s)
cp /srv/projects/pratyush/neyofit/docker-compose.db.yml /srv/projects/pratyush/neyofit/docker-compose.db.yml.backup.$(date +%s)

echo "Backups created."
echo ""

# Update backend/.env
cat > /srv/projects/pratyush/neyofit/backend/.env <<EOF
PORT=5000
NODE_ENV=production

# MongoDB connection string
MONGODB_URI=mongodb://neyofit_user:${MONGO_PASSWORD}@mongodb:27017/neyofit?authSource=admin

# CORS
CORS_ORIGIN=https://neyofit.in

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption key for bank details (32 bytes hex)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Razorpay
RAZORPAY_KEY_ID=rzp_live_RLOJY1xgbnnsPk
RAZORPAY_KEY_SECRET=<UPDATE_FROM_RAZORPAY_DASHBOARD>
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}

# Frontend/Backend URLs
FRONTEND_URL=https://neyofit.in
PUBLIC_API_URL=https://api.neyofit.in
EOF

echo "Updated backend/.env"
echo ""

# Update frontend/.env
cat > /srv/projects/pratyush/neyofit/frontend/.env <<EOF
NEXT_PUBLIC_ADMIN_SECRET=systempaaddenge
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_RLOJY1xgbnnsPk
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<UPDATE_FROM_GOOGLE_CLOUD_CONSOLE>
NEXT_PUBLIC_API_BASE_URL=https://api.neyofit.in/api/v1
EOF

echo "Updated frontend/.env"
echo ""

# Update docker-compose.db.yml
cat > /srv/projects/pratyush/neyofit/docker-compose.db.yml <<EOF
version: "3.9"

services:
  mongodb:
    image: mongo:latest
    container_name: neyofit-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: neyofit_user
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: neyofit
    volumes:
      - /srv/projects/pratyush/neyofit/mongodb_data:/data/db
    networks:
      - neyofit-docker-net
    # Port 27017 NOT exposed to host - internal only

networks:
  neyofit-docker-net:
    external: true
EOF

echo "Updated docker-compose.db.yml (MongoDB port no longer exposed)"
echo ""

# Update MongoDB password
echo "Updating MongoDB user password..."
docker exec neyofit-mongodb mongosh admin -u neyofit_user -p "$(grep MONGO_INITDB_ROOT_PASSWORD /srv/projects/pratyush/neyofit/docker-compose.db.yml.backup.$(ls -t /srv/projects/pratyush/neyofit/docker-compose.db.yml.backup.* | head -1) | cut -d: -f2 | tr -d ' ')" --eval "db.changeUserPassword('neyofit_user', '${MONGO_PASSWORD}')" 2>/dev/null || {
    echo "Warning: Could not update MongoDB password automatically."
    echo "Run manually: docker exec neyofit-mongodb mongosh admin -u neyofit_user -p 'OLD_PASSWORD' --eval \"db.changeUserPassword('neyofit_user', '${MONGO_PASSWORD}')\""
}

echo ""
echo "========================================="
echo "  MANUAL STEPS REQUIRED:"
echo "========================================="
echo ""
echo "1. RAZORPAY KEY SECRET:"
echo "   - Login to Razorpay Dashboard → Settings → API Keys"
echo "   - Generate new Key Secret"
echo "   - Update backend/.env: RAZORPAY_KEY_SECRET=new_secret"
echo ""
echo "2. GOOGLE MAPS API KEY:"
echo "   - Google Cloud Console → APIs & Services → Credentials"
echo "   - Create new API key, restrict to neyofit.in/* and api.neyofit.in/*"
echo "   - Update frontend/.env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=new_key"
echo ""
echo "3. RAZORPAY WEBHOOK:"
echo "   - Razorpay Dashboard → Settings → Webhooks"
echo "   - Add webhook: https://api.neyofit.in/api/v1/payments/webhook"
echo "   - Select events: payment.captured, payment.failed, refund.created"
echo "   - Copy webhook secret to backend/.env (already set above)"
echo ""
echo "4. GIT HISTORY CLEANUP (run locally, NOT on VPS):"
echo "   cd /path/to/local/neyofit"
echo "   git filter-repo --path backend/.env --path frontend/.env --path docker-compose.db.yml --invert-paths"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "5. RESTART SERVICES:"
echo "   cd /srv/projects/pratyush/neyofit"
echo "   docker compose -f docker-compose.db.yml up -d"
echo "   ./deploy-blue-green.sh"
echo ""
echo "========================================="
echo "  Secrets saved to /tmp/neyofit-secrets-$(date +%s).txt"
echo "========================================="

# Save secrets for reference
cat > /tmp/neyofit-secrets-$(date +%s).txt <<EOF
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}
MONGO_PASSWORD=${MONGO_PASSWORD}
EOF

chmod 600 /tmp/neyofit-secrets-$(date +%s).txt