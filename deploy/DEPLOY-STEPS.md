# Maqaam deployment — maqaam.me

**Database:** Supabase PostgreSQL  
**Apps:** AWS EC2 (backend + user + admin on one server)

| URL | App |
|-----|-----|
| `https://maqaam.me` | User frontend |
| `https://api.maqaam.me` | Backend API |
| `https://admin.maqaam.me` | Admin frontend |

GitHub: `https://github.com/Khurram2001/Maqaam---Find-what-s-happening.git`

**Status:** Production is live. Push to `main` auto-deploys via GitHub Actions.

---

## Step 1 — Supabase database — **YOU**

1. Go to [supabase.com](https://supabase.com) → **New project**
2. **Name:** `maqaam` (or any name)
3. **Database password:** choose a strong password and **save it**
4. **Region:** pick closest to your EC2 region (e.g. `eu-west-1`)
5. Wait until the project is **Active**

### Get connection string

1. Supabase Dashboard → **Project Settings** → **Database**
2. Under **Connection string**, choose **URI**
3. Select **Session pooler** (port `5432`) — works with Prisma migrations from EC2
4. Copy the URI. It looks like:

   ```
   postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
   ```

5. Replace `[YOUR-PASSWORD]` with your real DB password
6. **URL-encode** special characters in the password (`@` → `%40`, `#` → `%23`, etc.)

### Optional: run migrations from your PC now

```bash
cd backend
# paste your Supabase URI as DATABASE_URL in .env temporarily
npm run prisma:migrate:deploy
```

If this succeeds, tables exist before EC2 deploy. Otherwise `deploy/deploy.sh` runs migrations on the server.

**Save for Step 5:** the full `DATABASE_URL` string (keep it secret).

> **Note:** Maqaam uses Prisma directly — you do **not** need Supabase Auth, Storage, or RLS for this app. Only Postgres.

---

## Step 2 — AWS EC2 — **YOU**

1. AWS Console → **EC2** → **Launch instance**
2. **Name:** `maqaam-server`
3. **AMI:** Ubuntu Server 22.04 or 24.04 LTS
4. **Instance type:** `t3.small` (or `t3.micro` for testing)
5. **Key pair:** Create new → download `.pem` file (keep safe)
6. **Security group:** create `maqaam-ec2-sg` with inbound rules:

   | Type | Port | Source | Notes |
   |------|------|--------|-------|
   | SSH | 22 | Your IP | For your manual SSH |
   | SSH | 22 | `0.0.0.0/0` | Required for GitHub Actions auto-deploy |
   | HTTP | 80 | `0.0.0.0/0` | |
   | HTTPS | 443 | `0.0.0.0/0` | |

7. Launch instance
8. Copy **Public IPv4 address**

No RDS or VPC database rules needed — Supabase is reached over the internet.

---

## Step 3 — Namecheap DNS — **YOU**

Namecheap → Domain List → **maqaam.me** → **Advanced DNS**

Add **A records** (replace `YOUR_EC2_IP`):

| Host | Type | Value | TTL |
|------|------|-------|-----|
| `@` | A | YOUR_EC2_IP | Automatic |
| `www` | A | YOUR_EC2_IP | Automatic |
| `api` | A | YOUR_EC2_IP | Automatic |
| `admin` | A | YOUR_EC2_IP | Automatic |

DNS can take 5–30 minutes to propagate.

---

## Step 4 — Server bootstrap — **SSH**

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

sudo git clone https://github.com/Khurram2001/Maqaam---Find-what-s-happening.git /var/www/maqaam
sudo bash /var/www/maqaam/deploy/setup-ec2.sh
```

---

## Step 5 — Production env files — **SSH**

On EC2:

```bash
sudo nano /etc/maqaam/backend.env
sudo nano /etc/maqaam/frontend-user.env
sudo nano /etc/maqaam/frontend-admin.env
```

Use `deploy/env/*.env.example` as templates.

**`backend.env` — key fields:**

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
CORS_ORIGIN_USER=https://maqaam.me
CORS_ORIGIN_ADMIN=https://admin.maqaam.me
FRONTEND_USER_BASE_URL=https://maqaam.me
COOKIE_SECURE=true
TRUST_PROXY=true
```

Generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run twice for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**Set permissions** so the `ubuntu` user can read env files during deploy:

```bash
sudo chown root:ubuntu /etc/maqaam/*.env
sudo chmod 640 /etc/maqaam/*.env
```

---

## Step 6 — HTTPS (certbot) — **SSH**

```bash
sudo certbot --nginx \
  -d maqaam.me \
  -d www.maqaam.me \
  -d api.maqaam.me \
  -d admin.maqaam.me
```

---

## Step 7 — First deploy — **SSH**

```bash
cd /var/www/maqaam
sudo chown -R ubuntu:ubuntu /var/www/maqaam
export NODE_OPTIONS="--max-old-space-size=768"
bash deploy/deploy.sh
pm2 save
```

Optional — persist memory limit for future deploys:

```bash
echo 'export NODE_OPTIONS="--max-old-space-size=768"' >> ~/.bashrc
```

Verify:

```bash
curl https://api.maqaam.me/api/health
pm2 status
```

Expected: `"database": "ok"` and all three apps **online**.

---

## Step 8 — Third-party services — **YOU**

| Service | Action |
|---------|--------|
| **Resend** | Verify domain `maqaam.me`, set `EMAIL_FROM` |
| **Cloudinary** | Production API keys |
| **MapTiler** | API key; restrict to `maqaam.me` |

After editing env files on EC2, redeploy:

```bash
cd /var/www/maqaam && bash deploy/deploy.sh
```

Or push any commit to `main` to trigger GitHub Actions.

---

## Step 9 — GitHub auto-deploy — **YOU**

### 9a. Add secrets (GitHub website)

Repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP (e.g. `54.82.8.220`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of your `.pem` file |

Copy the key on **Windows PowerShell** (not on EC2):

```powershell
Get-Content E:\path\to\your-key.pem | Set-Clipboard
```

Paste into the `EC2_SSH_KEY` secret on GitHub.

### 9b. Trigger first auto-deploy (Windows PC)

```powershell
cd E:\path\to\your\repo
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

### 9c. Verify

GitHub → **Actions** → **Deploy to EC2** → latest run should show a green checkmark.

Workflow file: `.github/workflows/deploy.yml`

---

## Step 10 — Smoke test — **YOU**

1. Open `https://maqaam.me`
2. Register → verify email → login
3. Create event with image
4. Open `https://admin.maqaam.me` → approve event
5. Event appears on browse/homepage

---

## Ongoing — push changes to production

Every code change follows the same flow:

**On your PC (PowerShell):**

```powershell
cd E:\path\to\your\repo
git add .
git commit -m "Describe your change"
git push origin main
```

**What happens automatically:**

1. GitHub Actions SSHs into EC2
2. Runs `deploy/deploy.sh` which:
   - `git pull` latest code
   - Copies env files from `/etc/maqaam/`
   - `npm ci` + DB migrations (backend)
   - Builds user + admin frontends
   - Restarts all apps via PM2

**Confirm deploy:** GitHub → **Actions** → **Deploy to EC2** (usually 5–15 minutes).

**Manual redeploy (optional):**

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /var/www/maqaam
export NODE_OPTIONS="--max-old-space-size=768"
bash deploy/deploy.sh
```

| Topic | Detail |
|-------|--------|
| **Branch** | Only pushes to **`main`** trigger auto-deploy |
| **Env secrets** | Edit `/etc/maqaam/*.env` on EC2 — never commit to git |
| **Frontend env** | Changes to `NEXT_PUBLIC_*` require a redeploy (rebuild) |

---

## Server maintenance — disk space

Small EC2 volumes (~7 GB) fill up quickly. **`deploy/deploy.sh` and GitHub Actions auto-clean** old `node_modules`, `.next` builds, and npm cache before each deploy.

Check disk anytime:

```bash
df -h /
```

See what uses space:

```bash
sudo du -sh /var/www/maqaam/* 2>/dev/null | sort -hr
```

If a deploy still fails with `ENOSPC` / `no space left on device`, run this manually on EC2 then push again:

```bash
sudo rm -f /var/www/maqaam/.git/index.lock
sudo rm -rf /var/www/maqaam/frontend-user/.next
sudo rm -rf /var/www/maqaam/frontend-admin/.next
sudo rm -rf /var/www/maqaam/backend/node_modules
sudo rm -rf /var/www/maqaam/frontend-user/node_modules
sudo rm -rf /var/www/maqaam/frontend-admin/node_modules
npm cache clean --force
sudo apt clean
sudo journalctl --vacuum-size=30M
df -h /
```

Then redeploy. `deploy/deploy.sh` reinstalls dependencies and rebuilds frontends.
