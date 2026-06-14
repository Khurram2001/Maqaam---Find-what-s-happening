#!/usr/bin/env bash
# One-time EC2 bootstrap (Ubuntu 22.04/24.04). Run as a user with sudo.
# Usage: sudo bash deploy/setup-ec2.sh
set -euo pipefail

APP_USER="${MAQAAM_APP_USER:-ubuntu}"
APP_DIR="/var/www/maqaam"
ENV_DIR="/etc/maqaam"
REPO_URL="${MAQAAM_REPO_URL:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo"
  exit 1
fi

echo "==> System packages"
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

echo "==> Node.js 20"
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> PM2"
npm install -g pm2
sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" || true

echo "==> App directory"
mkdir -p "$APP_DIR" "$ENV_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [[ -n "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Env templates"
cp -n "$APP_DIR/deploy/env/backend.env.example" "$ENV_DIR/backend.env" 2>/dev/null || true
cp -n "$APP_DIR/deploy/env/frontend-user.env.example" "$ENV_DIR/frontend-user.env" 2>/dev/null || true
cp -n "$APP_DIR/deploy/env/frontend-admin.env.example" "$ENV_DIR/frontend-admin.env" 2>/dev/null || true
chown root:"$APP_USER" "$ENV_DIR"/*.env 2>/dev/null || true
chmod 640 "$ENV_DIR"/*.env 2>/dev/null || true

echo "==> Nginx site"
if [[ -f "$APP_DIR/deploy/nginx/maqaam.conf" ]]; then
  cp "$APP_DIR/deploy/nginx/maqaam.conf" /etc/nginx/sites-available/maqaam
else
  cp "$APP_DIR/deploy/nginx/maqaam.conf.example" /etc/nginx/sites-available/maqaam
fi
ln -sf /etc/nginx/sites-available/maqaam /etc/nginx/sites-enabled/maqaam
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

cat <<EOF

Setup complete.

Next steps:
1. Edit env files in $ENV_DIR (backend + both frontends)
2. Edit /etc/nginx/sites-available/maqaam — set your domains
3. Point DNS A records to this server's public IP
4. sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
5. As $APP_USER: cd $APP_DIR && bash deploy/deploy.sh
6. pm2 save

For auto-deploy on git push, add GitHub Actions secrets (see deploy/DEPLOY-STEPS.md Step 9 and .github/workflows/deploy.yml).

EOF
