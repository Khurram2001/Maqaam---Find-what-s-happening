# Maqaam deployment — maqaam.me (step-by-step)

Domain layout:

| URL | App |
|-----|-----|
| `https://maqaam.me` | User frontend |
| `https://api.maqaam.me` | Backend API |
| `https://admin.maqaam.me` | Admin frontend |

GitHub: `https://github.com/Khurram2001/Maqaam---Find-what-s-happening.git`

---

## Step 1 — AWS RDS (PostgreSQL) — **YOU**

1. AWS Console → **RDS** → **Create database**
2. **Engine:** PostgreSQL 16 (or 15)
3. **Templates:** Free tier (or Dev/Test if free tier unavailable)
4. **DB instance:** `db.t4g.micro` or `db.t3.micro`
5. **DB identifier:** `maqaam-db`
6. **Master username:** `maqaam_admin`
7. **Master password:** save this securely
8. **Database name:** `maqaam`
9. **Public access:** No
10. **VPC security group:** create new → name `maqaam-rds-sg`
11. Create database (wait ~5–10 min)

**Save these values:**
- RDS endpoint (e.g. `maqaam-db.xxxxx.eu-west-1.rds.amazonaws.com`)
- Username, password, database name `maqaam`

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

**Then:** EC2 security group → allow RDS access:
- Edit `maqaam-rds-sg` → Inbound → PostgreSQL 5432 → Source = `maqaam-ec2-sg`

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

## Step 4 — Server bootstrap — **SSH + scripts**

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

Copy from `deploy/env/*.env.example` and fill real secrets.

Generate JWT secrets (on your PC or EC2):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run twice for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**DATABASE_URL format:**

```
postgresql://maqaam_admin:PASSWORD@ENDPOINT:5432/maqaam
```

URL-encode special characters in the password (`@` → `%40`, etc.).

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
