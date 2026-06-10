# Maqaam deployment — maqaam.me

**Database:** Supabase PostgreSQL  
**Apps:** AWS EC2 (backend + user + admin on one server)

| URL | App |
|-----|-----|
| `https://maqaam.me` | User frontend |
| `https://api.maqaam.me` | Backend API |
| `https://admin.maqaam.me` | Admin frontend |

GitHub: `https://github.com/Khurram2001/Maqaam---Find-what-s-happening.git`

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
3. **AMI:** Ubuntu Server 22.04 LTS
4. **Instance type:** `t3.small` (or `t3.micro` for testing)
5. **Key pair:** Create new → download `.pem` file (keep safe)
6. **Security group:** create `maqaam-ec2-sg` with inbound rules:

   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | Your IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

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

## Step 5 — Production env files — **YOU**

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
bash deploy/deploy.sh
pm2 save
```

Verify:

```bash
curl https://api.maqaam.me/api/health
```

Expected: `"database": "ok"`

---

## Step 8 — Third-party services — **YOU**

| Service | Action |
|---------|--------|
| **Resend** | Verify domain `maqaam.me`, set `EMAIL_FROM` |
| **Cloudinary** | Production API keys |
| **MapTiler** | API key; restrict to `maqaam.me` |

---

## Step 9 — GitHub auto-deploy — **YOU**

Repo → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` file |

---

## Step 10 — Smoke test — **YOU**

1. Open `https://maqaam.me`
2. Register → verify email → login
3. Create event with image
4. Open `https://admin.maqaam.me` → approve event
5. Event appears on browse/homepage
