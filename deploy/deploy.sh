#!/usr/bin/env bash
# Pull latest code, install deps, migrate DB, build frontends, restart PM2.
# Run on the EC2 instance from repo root: bash deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DIR="${MAQAAM_ENV_DIR:-/etc/maqaam}"
BRANCH="${DEPLOY_BRANCH:-main}"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

cd "$ROOT"

free_disk_space() {
  echo "==> Freeing disk space"
  rm -f "$ROOT/.git/index.lock"
  rm -rf "$ROOT/frontend-user/.next" "$ROOT/frontend-admin/.next"
  rm -rf "$ROOT/backend/node_modules" "$ROOT/frontend-user/node_modules" "$ROOT/frontend-admin/node_modules"
  npm cache clean --force 2>/dev/null || true
  rm -rf "${HOME}/.npm/_cacache" 2>/dev/null || true
  pm2 flush 2>/dev/null || true
  rm -rf "${HOME}/.pm2/logs/"* 2>/dev/null || true
  sudo journalctl --vacuum-size=30M 2>/dev/null || true
  sudo apt-get clean 2>/dev/null || true
  df -h / || true
}

free_disk_space

echo "==> Pulling $BRANCH"
SCRIPT_BEFORE="$(sha256sum "$ROOT/deploy/deploy.sh" | awk '{print $1}')"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"
SCRIPT_AFTER="$(sha256sum "$ROOT/deploy/deploy.sh" | awk '{print $1}')"

if [[ "$SCRIPT_BEFORE" != "$SCRIPT_AFTER" ]] && [[ "${MAQAAM_DEPLOY_REEXEC:-}" != "1" ]]; then
  echo "==> deploy.sh updated — re-running with new script"
  export MAQAAM_DEPLOY_REEXEC=1
  exec bash "$ROOT/deploy/deploy.sh"
fi

if [[ ! -f "$ENV_DIR/backend.env" ]]; then
  echo "Missing $ENV_DIR/backend.env — copy from deploy/env/backend.env.example"
  exit 1
fi

echo "==> Syncing env files"
if [[ ! -r "$ENV_DIR/backend.env" ]]; then
  echo "Cannot read $ENV_DIR/backend.env — run: sudo chown root:\$USER $ENV_DIR/*.env && sudo chmod 640 $ENV_DIR/*.env"
  exit 1
fi
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
npm prune --omit=dev
npm cache clean --force 2>/dev/null || true

echo "==> Admin app: install + build"
cd "$ROOT/frontend-admin"
npm ci
npm run build
npm prune --omit=dev
npm cache clean --force 2>/dev/null || true

echo "==> Restarting PM2"
cd "$ROOT"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Deploy complete"
pm2 status
