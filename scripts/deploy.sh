#!/usr/bin/env bash
# deploy.sh — One-command deploy to Oracle Cloud ARM VM.
#
# Prerequisites:
#   1. SSH key set up on the VM
#   2. Add VM hostname to ~/.ssh/config or set DEPLOY_HOST env var
#   3. .env.production file on the VM at ~/oprepo/.env.production
#
# Usage:
#   export DEPLOY_HOST=ubuntu@your-vm-ip
#   ./scripts/deploy.sh

set -euo pipefail

HOST="${DEPLOY_HOST:?Set DEPLOY_HOST to user@host, e.g. ubuntu@10.0.0.1}"
REMOTE_DIR="${DEPLOY_DIR:-~/oprepo}"

echo "→ Deploying to ${HOST}:${REMOTE_DIR}"

# 1. Copy project files (exclude node_modules, .next, etc.)
echo "→ Syncing source files..."
rsync -az --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.turbo' \
  --exclude='*.tsbuildinfo' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.*' \
  ./ "${HOST}:${REMOTE_DIR}/"

# 2. Build and restart on the VM
echo "→ Building and restarting containers on VM..."
ssh "${HOST}" << 'SSHCMD'
  set -euo pipefail
  cd ~/oprepo

  # Load production secrets
  if [ -f .env.production ]; then
    export $(grep -v '^\s*#' .env.production | xargs)
  fi

  # Build and start
  docker compose \
    -f docker-compose.yml \
    -f docker/docker-compose.prod.yml \
    up -d --build --remove-orphans 2>&1

  # Prune old images (keep last 2)
  docker image prune -af --filter "until=48h" 2>/dev/null || true

  echo "→ Health check..."
  sleep 5
  curl -sf http://localhost:4000/api/v1/health > /dev/null && \
    echo "  ✓ API healthy" || echo "  ⚠ API health check failed"

  echo "✓ Deploy complete"
SSHCMD
