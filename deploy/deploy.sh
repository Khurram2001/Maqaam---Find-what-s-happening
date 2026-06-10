#!/usr/bin/env bash
# Pull latest code, install deps, migrate DB, build frontends, restart PM2.
# Run on the EC2 instance from repo root: bash deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DIR="${MAQAAM_ENV_DIR:-/etc/maqaam}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$ROOT"

echo "==> Pulling $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

if [[ ! -f "$ENV_DIR/backend.env" ]]; then
  echo "Missing $ENV_DIR/backend.env — copy from deploy/env/backend.env.example"
  exit 1
fi

echo "==> Syncing env files"
cp "$ENV_DIR/backend.env" "$ROOT/backend/.env"
cp "$ENV_DIR/frontend-user.env" "$ROOT/frontend-user/.env.production.local"
cp "$ENV_DIR/frontend-admin.env" "$ROOT/frontend-admin/.env.production.local"

echo "==> Backend: install + migrate"
cd "$ROOT/backend"
npm ci
npm run prisma:migrate:deploy

echo "==> User app: install + build"
cd "$ROOT/frontend-user"
npm ci
npm run build

echo "==> Admin app: install + build"
cd "$ROOT/frontend-admin"
npm ci
npm run build

echo "==> Restarting PM2"
cd "$ROOT"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Deploy complete"
pm2 status
