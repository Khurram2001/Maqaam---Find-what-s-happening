### 🕋 Maqaam (مقام) | Discover & Share Local Islamic Gatherings

**Live Platform:** [maqaam.me](https://www.google.com/search?q=https://maqaam.me)

**Production Status:** 2026 Deployment Ready

Maqaam is a premium, minimalist, map-first platform engineered to bridge the gap for Muslim communities—particularly those living in non-Islamic countries. The application enables users to seamlessly locate and share verified local Islamic lectures, halaqas, sisters' events, youth circles, and community gatherings with precise spatial mapping.

---

### 🌟 Core Features

#### 🔹 User Platform (`frontend-user`)

* **Map-First Discovery:** Interactive geographic tracking using OpenStreetMap to pinpoint verified sacred knowledge circles.
* **Advanced Scannability:** Clean, dynamic layout filtering on real-time search queries (by topic, city, or country) and categorized pills.
* **Intuitive Gathering Request:** A secure submission workflow requiring chronological date validation ($\text{Starts} \ge \text{Current Time}$) and mandatory asset attachment.

#### 🔹 Governance Engine (`frontend-admin`)

* **Strict Moderation Loop:** Multi-tier processing queue allowing administrators to inspect incoming requests via dedicated review screens before listings go live[cite: 1].
* **Secure Rejection Flow:** Zod-validated custom dialog wrappers forcing valid, structural `rejectionReason` strings (3–500 characters) to pass down to the server layer[cite: 1].
* **User & Audit Supervision:** Comprehensive logging arrays tracking systemic operations (promotions, soft-deletions, auth statuses) and administrative states[cite: 1].

---

### 🎨 Tech Stack & Design Language

* **Frontends:** Next.js (React), Tailwind CSS, shadcn/ui components.
* **Backend Runtime:** Node.js, Express, Prisma ORM[cite: 1].
* **Database Infrastructure:** PostgreSQL (Managed via Supabase Cloud).
* **Mapping Engine:** Leaflet API paired with OpenStreetMap tiles.
* **Visual Philosophy:** Premium Modern Minimalism grounded heavily in:
* `#0B4D53` (Deep Signature Teal)
* `#2DD4BF` (Luminous Mint Teal)
* `#FAF6F0` (Soothing Warm Cream Canvas)



---

### 📂 Repository Architecture

```text
maqaam/
├── frontend-user/       # Client portal for discovering and pitching gatherings
├── frontend-admin/      # Enterprise management console for moderators & metrics
└── backend/             # Node.js API engine handling JWT tokens & core logic

```

---

### ⚡ Quick Start

#### 1. Environmental Configuration

Create a `.env` file in your `backend/` directory root:

```env
DATABASE_URL="postgresql://YOUR_SUPABASE_USER:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"
JWT_ACCESS_SECRET="your_ultra_secure_access_token_hash"
JWT_REFRESH_SECRET="your_ultra_secure_refresh_token_hash"

```

#### 2. Install Dependencies

Execute inside each specific component directory:

```bash
npm install

```

#### 3. Database Initialization

```bash
cd backend
npx prisma db push

```

#### 4. Spin up Development Servers

```bash
# In backend
npm run dev

# In frontend-user / frontend-admin
npm run dev

```

---

### 🔒 Operational Rules & Security Standards

* **Session Management:** All protected endpoints require a logged-in user passing valid HTTP-only JWT secure cookie credentials[cite: 1].
* **Administrative Gate:** Non-admin accounts attempting access on backend loops or admin directories are immediately restricted via `403 Forbidden` interceptors[cite: 1].
* **Validation Layer:** Hardware-accelerated transitions operate under safe-motion configurations, and API payload inputs are filtered dynamically before mutating database records.
