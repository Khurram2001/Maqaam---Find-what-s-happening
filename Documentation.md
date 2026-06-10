# Maqaam (MEMS) — Project Documentation

> **Maqaam** is a minimalist Islamic event management platform. Internally the codebase is also referred to as **MEMS** (Minimalist Event Management System). **This file is the only project documentation** — architecture, APIs, forms, security, deployment, admin operations, testing, and full development history are all maintained here.

**Last updated:** 2026-06-09

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technical Stack](#3-technical-stack)
4. [Delivery Phases & Build Order](#4-delivery-phases--build-order)
5. [Design System](#5-design-system)
6. [Database Schema](#6-database-schema)
7. [Backend](#7-backend)
8. [Frontend — User App](#8-frontend--user-app)
9. [Frontend — Admin App](#9-frontend--admin-app)
10. [API Contract](#10-api-contract)
11. [Frontend Forms Contract](#11-frontend-forms-contract)
12. [Mapping & Geocoding](#12-mapping--geocoding)
13. [Security](#13-security)
14. [Environment Variables](#14-environment-variables)
15. [Testing & QA](#15-testing--qa)
16. [Local Development & Deployment](#16-local-development--deployment)
17. [Admin Operations Overview](#17-admin-operations-overview)
18. [Appendix: Full Development Log](#18-appendix-full-development-log)

---

## 1. Project Overview

### Purpose

Maqaam connects communities with verified local Islamic gatherings — halaqas, lectures, youth circles, sisters events, and Eid socials. Hosts submit events for admin review; approved events appear in public discovery.

### Architecture Principles

- **Backend-first:** API is the single source of truth for auth, roles, and moderation.
- **Three-app monorepo:** shared backend; separate user and admin Next.js frontends.
- **Cost-conscious maps:** Leaflet + MapTiler/OSM tiles; LocationIQ or Geoapify geocoding (no Google Maps).
- **Moderation pipeline:** all new events start `PENDING` → admin approve/reject → public listing when `APPROVED`.
- **Deployment-ready:** mock event data removed; production uses live API data only.

### Core User Flows

| Actor | Flow |
|-------|------|
| **Guest** | Browse homepage → discover gatherings → view event detail |
| **User** | Register → verify email → login → create/edit events → track status in My Events |
| **Admin** | Sign in → review pending queue → approve/reject → manage users → view audit logs |

---

## 2. Repository Structure

```
Maqaam/
├── backend/                 # Node.js + Express API (port 5000)
│   ├── prisma/              # Schema + migrations
│   ├── scripts/             # smoke-test.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend-user/           # Next.js public site (port 3000)
│   ├── app/                 # App Router pages
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── tests/
├── frontend-admin/          # Next.js admin panel (port 3001)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── tests/
├── docs/
│   └── postman/             # Postman collection JSON (import into Postman)
└── Documentation.md         # Single project documentation (this file)
```

---

## 3. Technical Stack

| Layer | Technology |
|-------|------------|
| **User frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons, Zod, Vitest |
| **Admin frontend** | Next.js 16, React 19, Tailwind CSS 4, Vitest |
| **Backend** | Node.js, Express 5, Prisma 7, PostgreSQL (Supabase/Neon) |
| **Auth** | JWT in HTTP-only cookies (access + refresh), server-side session store |
| **Email** | Resend (verification + password reset) |
| **Images** | Cloudinary (2MB max, image-only) |
| **Maps** | Leaflet + react-leaflet; MapTiler or OSM tiles; LocationIQ/Geoapify geocoding |

### NPM Scripts

**Backend** (`maqaam-backend`):
- `npm run dev` — nodemon (port 5000)
- `npm start` — production
- `npm run smoke` — end-to-end API smoke test
- `npm run prisma:generate` / `prisma:migrate` / `prisma:migrate:deploy` / `prisma:studio`

**User frontend** (`maqaam-user`, port 3000):
- `npm run dev` / `build` / `start` / `lint` / `test`

**Admin frontend** (`maqaam-admin`, port 3001):
- `npm run dev` / `build` / `start` / `lint` / `test`

---

## 4. Delivery Phases & Build Order

Build order: **Backend → User frontend → Admin frontend → Hardening → Deploy**

### Phase 0: Project Setup & Contracts (1–2 days)
- Repo structure, env templates, API conventions (`success`/`data`/`error`), pagination format, cookie strategy.
- **Exit:** folders ready, env templates, API contract documented.

### Phase 1: Database + Backend Core (3–5 days)
- Prisma models, auth (register/login/logout/me/refresh), middleware, event CRUD, moderation APIs, Cloudinary uploads.
- **Exit:** all APIs work in Postman; role checks enforced; migrations stable.

### Phase 2: User Frontend MVP (4–6 days)
- Design foundation, navbar/hero, auth modal, event grid with pagination, My Events dashboard, create event form with map.
- **Exit:** full user create → pending → dashboard flow; paginated browse; palette applied.

### Phase 3: Admin Frontend MVP (3–4 days)
- Admin login, pending queue, approve/reject, user management, stats cards.
- **Exit:** end-to-end moderation; actions auditable.

### Phase 4: Stabilization, Security & QA (2–4 days)
- Rate limiting, CORS/cookies, input sanitization, tests, loading/empty/error states.
- **Exit:** no critical auth/moderation bugs; checklist passes.

### Phase 5: Deployment & Handover (1–2 days)
- Deploy backend + DB, both frontends, production env, smoke tests, runbook.
- **Exit:** production release with operational docs.

### Execution Rule
For each phase: build scope → verify exit criteria → freeze milestone → next phase.

---

## 5. Design System

### Visual Language

- **Style:** Premium modern minimalist — high whitespace, clear hierarchy, subtle motion only.
- **Inspiration:** Reference screenshots are inspiration only; do not copy layouts 1:1.
- **Implementation:** Tailwind utilities + shadcn/ui; minimal custom CSS; design tokens in `globals.css`.

### Color Palette (Locked)

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary / Deep Teal** | `#0B4D53` | Text, logo, accents, buttons, focus rings |
| **Background base** | `#F4F6F6` | App/page base (blueprint); avoid pure white as default page bg |
| **Cream canvas** | `#FAF6F0` | Homepage sections, auth/reset pages, browse canvas (evolved in UI) |
| **Supporting / Ice Blue** | `#D4E6F1` | Cards, borders, soft overlays, map accents |
| **Arabic tagline accent** | `#2DD4BF` | Hero Arabic layer with subtle mint glow |
| **Sand-gold accent** | Used on CTA banner tags | Organize-event banner accent |

### Typography

- **Sans:** Geist (`--font-geist-sans`) — body and headings
- **Arabic tagline:** Amiri — hero Arabic layer
- **Weights:** Limited, consistent; heading font via `--font-heading`

### Surfaces & Layout

- Soft cards, subtle borders (`border-[#0B4D53]/15`), light shadows, `rounded-xl` / `rounded-2xl`
- **Site grid:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` — navbar, hero, sections, footer aligned
- **Modal surface:** `#FAF6F0` with teal focus inputs
- **Footer:** Dark premium variant with brand block, nav links, contact form (`mailto:`)

### Motion

- GPU-friendly keyframes: `fadeInUp`, `fadeIn` (`translate3d`, `motion-safe` compatible)
- Staggered homepage section reveals; card hover lift + teal shadow
- Avoid heavy animation

### Brand Copy (Homepage)

- **Hero:** Islamic-focused headline, Arabic tagline, primary CTA → Organize Event (`/events/create` or `/events/new`)
- **Navbar links:** Create Event, Browse Events, How it works, About us
- **How It Works:** Create → admin review → live discovery; OpenStreetMap footnote
- **About / Mission:** Non-profit Islamic platform copy
- **Footer:** Browse Events, Create Event, Our Mission; Global Ummah meta; OpenStreetMap attribution

### UI Components (shadcn / Base UI)

User app includes: `button`, `card`, `input`, `badge`, `dialog`, `tabs`, `separator`, `label`, `alert`, `dropdown-menu`, `scroll-area`, `password-input`

### Admin UI

Same minimalist system and palette (`#0B4D53`, `#F4F6F6`, `#D4E6F1`) — clear spacing, subtle borders, low visual noise.

---

## 6. Database Schema

**ORM:** Prisma + PostgreSQL  
**File:** `backend/prisma/schema.prisma`

### Enums

- `Role`: `USER`, `ADMIN`
- `EventStatus`: `PENDING`, `APPROVED`, `REJECTED`

### Models

| Model | Key Fields |
|-------|------------|
| **User** | `id`, `email` (unique), `phoneNumber` (unique, E.164), `passwordHash`, `name`, `role`, `isActive`, `isEmailVerified`, `emailVerifiedAt` |
| **Category** | `id`, `name` (unique), `slug` (unique) |
| **Event** | `id`, `userId`, `categoryId?`, `title` (max 160), `description`, `imageUrl?`, address fields, `providerPlaceId?`, `latitude`/`longitude`, `startDate`/`endDate`, `status`, moderation fields, `deletedAt?` (soft delete) |
| **EventImage** | `id`, `eventId`, `url`, `publicId?`, `sortOrder` |
| **AuthSession** | `id`, `userId`, `refreshTokenHash` (indexed), `userAgent?`, `ipAddress?`, `expiresAt`, `revokedAt?` |
| **AuditLog** | `id`, `actorUserId`, `action`, `targetType`, `targetId`, `meta?` (JSON) |
| **VerificationToken** | `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt?` |
| **PasswordResetToken** | `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt?` |

### Indexes

- `events(status, startDate)`, `events(userId)`, `events(categoryId)`, `events(createdAt)`, `events(latitude, longitude)`
- `auth_sessions(userId)`, `auth_sessions(expiresAt)`, `auth_sessions(refreshTokenHash)`
- `audit_logs(actorUserId)`, `audit_logs(targetType, targetId)`

### Constraints

- `endDate >= startDate`
- Latitude `[-90, 90]`, longitude `[-180, 180]`
- Email uniqueness (case-insensitive at application layer)

---

## 7. Backend

### Entry Points

- `backend/src/server.js` — HTTP server, graceful shutdown (SIGTERM/SIGINT, Prisma disconnect)
- `backend/src/app.js` — Express app, Helmet, CORS, cookie parser, rate limits, routes, generic errors in production

### Route Groups

All routes mounted under `/api`. Full contract in [Section 10](#10-api-contract).

| Group | Endpoints |
|-------|-----------|
| **health** | `GET /health` (includes DB ping) |
| **auth** | register, login, refresh, logout, me, verify-email, forgot/reset password |
| **categories** | GET (public), POST (admin) |
| **events** | list, detail, create, update, delete, my/list, images |
| **admin** | pending queue, approve/reject, users CRUD actions, audit-logs |
| **uploads** | `POST /uploads/event-image` |

### Auth Model

- **Access token:** HTTP-only cookie, ~15m expiry, JWT HS256
- **Refresh token:** HTTP-only cookie, ~7d, hashed in `AuthSession`
- **Email verification required** before login/refresh (`403` if unverified)
- **Password reset** revokes all sessions; one-time hashed tokens
- **Cookies:** `SameSite=Lax` locally; `SameSite=None` + `Secure` when `COOKIE_SECURE=true`

### Middleware

- `requireAuth`, `requireAdmin` — `backend/src/middleware/auth.middleware.js`
- Rate limiters — auth, email actions, uploads, global API (300/15m), write routes
- Zod validation on request bodies/queries

### Key Services & Utils

- `email.service.js` — Resend; HTML-escaped dynamic content
- `auth.js` — JWT sign/verify, cookie options (cookie names: `mems_access_token`, `mems_refresh_token`)
- `token.js` — generate/hash email/reset tokens
- `audit.js` — non-blocking audit log writes
- `security.js` — magic-byte image validation
- `http-errors.js` — shared route error helpers
- `lib/cloudinary.js` — shared Cloudinary config; uploads folder `maqaam/events`

### Event Business Rules

- Public `GET /events` returns **approved only** by default
- Owner/admin can view non-approved events
- Owner **update resets status to PENDING**
- **Soft delete** via `deletedAt`
- Browse filters: `q`, `category`, `startDateFrom`, `startDateTo`, `lat`/`lng`/`radiusKm`, pagination

### Production Env Validation

`backend/src/config/env.js` enforces in production:
- JWT secrets ≥ 32 chars, no placeholders
- `COOKIE_SECURE=true`
- Resend, Cloudinary, CORS origins, HTTPS `FRONTEND_USER_BASE_URL`

---

## 8. Frontend — User App

**Package:** `maqaam-user`  
**Port:** 3000  
**Base API:** `NEXT_PUBLIC_API_BASE_URL` (required in production builds)

### Static Assets

Local images live under `frontend-user/public/assets/` and are referenced via `lib/site-assets.js`:

| Folder | Files | Usage |
|--------|-------|-------|
| `assets/brand/` | `maqaam-logo-teal.png`, `maqaam-logo-white.png` | Header, footer |
| `assets/home/` | `hero-landscape.png`, `organize-banner-prayer.png` | Hero, organize CTA banner |

Add new images under `public/assets/`, register paths in `site-assets.js`, import in components.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage: Hero → Upcoming (3) → Organize CTA → How It Works → About → Footer |
| `/events` | Full browse/discovery (9 per page, filters, search, pagination) |
| `/events/new` | Create event form (map client-only via `dynamic(..., { ssr: false })`) |
| `/events/create` | Redirect alias → `/events/new` |
| `/events/[id]` | Event detail (read-only map for guests; owner sees pending/rejected) |
| `/events/[id]/edit` | Edit/delete with unsaved-change guard; type `DELETE` for approved events |
| `/my-events` | Dashboard with status badges |
| `/verify-email` | Email verification confirm |
| `/reset-password` | Password reset with token from email |
| `/?signin=1` | Opens login modal on homepage |

### Key Features

**Auth modal (`sign-in-dialog.jsx`):**
- Single dialog with Login / Register tabs
- Register: name, email, phone (country code + number, E.164), password, confirm
- Forgot password, resend verification, password show/hide toggle
- Zod validation via `register-validation.js`

**Browse (`event-discovery.jsx`):**
- 9 events per page (`BROWSE_EVENTS_PAGE_SIZE`)
- Today + upcoming only (`startDateFrom` = start of local day)
- Search, gathering filter tags, sort, server pagination
- 5-minute ISR cache (`PUBLIC_EVENTS_REVALIDATE = 300`)
- Empty state when no API results (no mock data)

**Create/Edit event:**
- All fields required including banner image
- Map search via MapTiler/LocationIQ; Leaflet marker
- Upload `POST /uploads/event-image` then `POST /events`
- Schedule validation in `event-validation.js`

**Session handling (`api-client.js`):**
- `credentials: "include"`
- Auto `POST /auth/refresh` on 401, retry once

### Key Libraries

- `lib/public-api.js` — cached server fetches, `getTopUpcomingEvents`
- `lib/browse-events.js` — pagination helpers, date filters
- `lib/geocode.js` — MapTiler / LocationIQ / Geoapify address search
- `lib/site-assets.js` — static image path manifest
- `lib/format-event.js` — date/time display
- `lib/phone-countries.js`, `register-validation.js` — phone + register validation

### Tests

`frontend-user/tests/user-lib.test.js` — config, format-event, api-client, public-api, register/phone validation

---

## 9. Frontend — Admin App

**Package:** `maqaam-admin`  
**Port:** 3001 (default in `package.json` scripts)  
**Env:** `NEXT_PUBLIC_API_BASE_URL` only (no map keys — admin has no geocoding UI)

### Routes

| Route | Screen |
|-------|--------|
| `/` | Events dashboard — all gatherings with schedule/status filters, stats cards, approve/reject on pending rows |
| `/events/[id]` | Event review detail with sticky approve/reject footer |
| `/users` | User management (promote, deactivate, delete with typed `DELETE` confirm) |
| `/audit-logs` | Filterable audit log viewer |
| `/sign-in` | Standalone sign-in (optional; protected layout embeds sign-in inline) |

### Protected Layout

- `app/(dashboard)/layout.js` wraps routes with `AdminProtectedLayout`
- Single session check per layout mount; sidebar stays mounted across navigations
- `AdminSidebar` — Events, Users, Audit logs; mobile drawer with scroll lock
- Lazy-loaded screens via `admin-lazy-screens.jsx` + `next/dynamic`
- Guest state renders inline `AdminSignInScreen`; non-admin gets forbidden panel

### Stats Cards

Client-side aggregates: total events (sum of statuses), pending count, total users

### Validation & Tests

- `lib/admin-validation.js` — UUID, reject reason, audit filters, delete confirm token
- `lib/admin-auth-validation.js` — sign-in Zod rules
- `lib/admin-events.js` — schedule/status query builders for events list
- Tests: `tests/admin-validation.test.js`, `admin-auth-validation.test.js`, `admin-events.test.js` (16 tests total)

See [Section 17](#17-admin-operations-overview) for admin API data model and dashboard flow.

---

## 10. API Contract

### API Contract (Phase 0 - Fast MVP)

Base URL: `/api`

#### Response Shape

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable message"
  }
}
```

#### Auth and Cookies

- Access token: HTTP-only cookie, short expiry (recommended 15m).
- Refresh token: HTTP-only cookie, longer expiry (recommended 7d).
- Protected routes require valid access token.

#### Auth Routes

- `POST /auth/register`
  - body: `{ "name": "John", "email": "john@x.com", "phoneNumber": "+923001234567", "password": "secret123" }`
  - `phoneNumber` must be in E.164 format (regex: `^\+[1-9]\d{7,14}$`)
- `POST /auth/login`
  - body: `{ "email": "john@x.com", "password": "secret123" }`
- `POST /auth/refresh`
  - body: `{}`
- `POST /auth/logout`
  - body: `{}`
- `GET /auth/me`
  - returns current user profile
- `POST /auth/forgot-password`
  - body: `{ "email": "john@x.com" }`
  - always returns generic success message (no account enumeration)
  - sends reset email when an active account exists
- `POST /auth/reset-password`
  - body: `{ "token": "<raw-token-from-email-link>", "newPassword": "newsecret123" }`
  - `newPassword` min 8, max 128
  - invalid/expired/used tokens return `403 FORBIDDEN`
  - revokes existing sessions after successful reset
- `POST /auth/verify-email/request`
  - body: `{ "email": "john@x.com" }`
  - always returns generic success message (no account enumeration)
  - sends verification email when an active unverified account exists
- `POST /auth/verify-email/confirm`
  - body: `{ "token": "<raw-token-from-email-link>" }`
  - invalid/expired/used tokens return `403 FORBIDDEN`
  - sets `isEmailVerified=true` on success
- `POST /auth/register` returns `emailVerificationRequired: true`; login is blocked until email is verified (`403 FORBIDDEN`)

#### Category Routes

- `GET /categories`
- `POST /categories` (admin only)
  - body: `{ "name": "Community", "slug": "community" }`

#### Event Routes

- `GET /events`
  - query:
    - `q` (search by title/description)
    - `status` (`PENDING|APPROVED|REJECTED`) (admin can use all, public defaults approved)
    - `category`
    - `startDateFrom`
    - `startDateTo`
    - `lat`
    - `lng`
    - `radiusKm`
    - `page` (default 1)
    - `limit` (default 12)
- `GET /events/:id`
- `POST /events` (auth user)
- `PATCH /events/:id` (owner or admin)
- `DELETE /events/:id` (owner or admin; soft delete preferred)
- `GET /events/my/list` (auth user)

##### Event Create/Update Payload

```json
{
  "title": "Community Iftar",
  "description": "Join us for a local gathering.",
  "imageUrl": "https://...",
  "categoryId": "uuid",
  "addressLine": "Street 10",
  "formattedAddress": "Street 10, City, Country",
  "providerPlaceId": "optional-id-from-geocoder",
  "latitude": 24.8607,
  "longitude": 67.0011,
  "startDate": "2026-05-01T18:00:00.000Z",
  "endDate": "2026-05-01T20:00:00.000Z"
}
```

- `providerPlaceId`: optional stable id returned by the client geocoder (e.g. LocationIQ or Geoapify). Maps and tiles are not Google-powered; see [Section 12 — Mapping & Geocoding](#12-mapping--geocoding).

#### Moderation Routes (Admin)

- `GET /admin/events/pending`
  - query:
    - `page` (default 1)
    - `limit` (default 20, max 100)
  - response includes `data.pagination` with `page`, `limit`, `total`, `totalPages`
- `PATCH /admin/events/:id/approve`
  - body: `{}`
- `PATCH /admin/events/:id/reject`
  - body: `{ "rejectionReason": "Insufficient details" }`

#### User Management Routes (Admin)

- `GET /admin/users`
  - query:
    - `page` (default 1)
    - `limit` (default 20, max 100)
  - response includes `data.pagination` with `page`, `limit`, `total`, `totalPages`
- `PATCH /admin/users/:id/promote`
- `PATCH /admin/users/:id/deactivate`
- `DELETE /admin/users/:id` (if needed; use cautiously)

#### Upload Route

- `POST /uploads/event-image` (auth user)
  - accepts image file upload only (`image/*`)
  - max file size: 2MB
  - returns Cloudinary URL/publicId

#### HTTP Status Guidelines

- `200` OK
- `201` Created
- `400` Bad request / validation
- `401` Unauthenticated
- `403` Forbidden
- `404` Not found
- `409` Conflict (email, phone number, or category slug already exists)
- `500` Internal server error

---

## 11. Frontend Forms Contract

All authenticated requests: `credentials: "include"`.

### User App Forms

| Form | Endpoint | Required Fields |
|------|----------|-----------------|
| Register | `POST /auth/register` | name (2–120), email, phoneNumber (E.164), password (8–128) |
| Login | `POST /auth/login` | email, password |
| Verify request | `POST /auth/verify-email/request` | email |
| Verify confirm | `POST /auth/verify-email/confirm` | token (min 10) |
| Forgot password | `POST /auth/forgot-password` | email |
| Reset password | `POST /auth/reset-password` | token, newPassword (8–128) |
| Create event | `POST /events` | title (3–160), description (min 10), lat/lng, start/end dates; imageUrl optional |
| Update event | `PATCH /events/:id` | same fields, all optional, ≥1 required |
| Upload image | `POST /uploads/event-image` | `image` file; optional `eventId` |

**Browse query (`GET /events`):** `q`, `status`, `category`, `startDateFrom`, `startDateTo`, `page`, `limit` (max 50)

**Browse UI behavior:**
- Initial fetch with pagination; reset page on filter change
- Homepage/browse: 9 cards per page with numbered pagination
- Empty states when no results

### Admin Forms

| Form | Endpoint | Fields |
|------|----------|--------|
| Create category | `POST /categories` | name (2–100), slug (2–120, `^[a-z0-9-]+$`) |
| Reject event | `PATCH /admin/events/:id/reject` | rejectionReason (3–500) |
| Audit filters | `GET /admin/audit-logs` | actorUserId, targetType, targetId, page, limit |

### No-Body Actions

`POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /categories`, `GET /events/:id`, `GET /events/my/list`, `DELETE /events/:id`, admin approve, user promote/deactivate, etc.

---

## 12. Mapping & Geocoding

### Mapping and geocoding (cost-conscious)

Google Maps is not used (non-profit budget). Location and map UI live in the Next.js frontends; the API stores coordinates and address text only.

#### Stack

| Concern | Choice |
|--------|--------|
| Map UI | [Leaflet](https://leafletjs.com/) with [`react-leaflet`](https://react-leaflet.js.org/) |
| Raster tiles | [MapTiler](https://www.maptiler.com/) free tier, or OpenStreetMap-derived tiles where policy allows |
| Address autocomplete / geocode | [LocationIQ](https://locationiq.com/) or [Geoapify](https://www.geoapify.com/) (client-side search → lat/lng + optional `providerPlaceId` for the API) |

#### Phase 2.2 (features)

- **Event grid:** Prefer static map thumbnails (e.g. small Leaflet snapshot or pre-rendered image from stored lat/lng) or a simple location pin icon to limit tile requests.
- **Search bar:** Use LocationIQ (or Geoapify) for address → coordinates; send `latitude`, `longitude`, `formattedAddress`, and optional `providerPlaceId` to the backend per [Section 10 — API Contract](#10-api-contract).

#### Environment variables (frontends)

Set in `frontend-user/.env.local` only (admin app does not use maps). Keys must remain `NEXT_PUBLIC_*` only for values safe to expose in the browser. Restrict keys by domain in provider dashboards for production.

#### Database note

If an older database still has a `googlePlaceId` column, create a Prisma migration to rename it to `providerPlaceId` (or reset the dev database) so it matches `backend/prisma/schema.prisma`.

---

## 13. Security

### Baseline Controls

- Access + refresh JWT with server-side refresh session tracking
- Refresh tokens hashed in `AuthSession.refreshTokenHash` (indexed)
- Email verification enforced before login/refresh
- Expiring hashed one-time tokens for email verify + password reset
- Password reset revokes all active sessions
- `requireAuth` + `requireAdmin` on protected routes
- Zod validation on inputs
- Upload: image MIME only, 2MB, magic-byte validation, Cloudinary format restrictions
- Rate limiting: auth, email actions, uploads, global API, write routes
- Audit logs for auth, events, admin actions
- Helmet, security headers on Next.js apps
- Generic error messages in production (no stack leaks)
- Email HTML escaped (`escapeHtml`)
- Admin sign-in open-redirect protection
- Automatic session refresh on 401 (both frontends)
- **No mock event data in production** — API-only listings

### Production Requirements Summary

| App | Requirement |
|-----|-------------|
| Backend | Strong JWT secrets, `COOKIE_SECURE=true`, HTTPS frontend URL, Resend + Cloudinary configured |
| Frontends | `NEXT_PUBLIC_API_BASE_URL` required at build time |
| Keys | Restrict MapTiler/LocationIQ/Cloudinary keys by domain in provider dashboards |

### Security Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Mock event data removed from user frontend; production uses API-only listings |
| 2026-06-08 | Production hardening: Helmet, rate limits, JWT HS256, magic-byte uploads, email HTML escape, env validation, session refresh on 401, security headers on Next.js apps, admin open-redirect guard |
| 2026-04-29 | Security baseline established: hashed refresh tokens, email verification, rate limiting, audit logs, Zod validation |

Additional security-related entries appear in [Section 18](#18-appendix-full-development-log).

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | Default `5000` |
| `DATABASE_URL` | PostgreSQL connection (URL-encode password for Supabase pooler) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32 chars in production |
| `ACCESS_TOKEN_EXPIRES_IN` | Default `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN_USER` / `CORS_ORIGIN_ADMIN` | Frontend origins |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` | Cookie settings |
| `TRUST_PROXY` | Behind reverse proxy |
| `CLOUDINARY_*` | Image uploads |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `FRONTEND_USER_BASE_URL` | Email link base (HTTPS in prod) |
| `EMAIL_VERIFY_TOKEN_TTL_MINUTES` | Default 60 |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Default 30 |

### Frontend User (`frontend-user/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Map tiles + geocoding |
| `NEXT_PUBLIC_LOCATIONIQ_API_KEY` | Optional geocoder |
| `NEXT_PUBLIC_GEOAPIFY_API_KEY` | Optional geocoder |

### Frontend Admin (`frontend-admin/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | e.g. `http://localhost:5000/api` |

No map/geocoder keys required for the admin app.

---

## 15. Testing & QA

### Backend Smoke Test

```bash
cd backend && npm run smoke
# or: node backend/scripts/smoke-test.js
```

Covers: health, register, login (before/after verify), verify-email, forgot/reset password, admin promotion, category, event create, pending list, approve, public events fetch. Loads `backend/.env` automatically.

### Postman

**Collection file:** `docs/postman/maqaam-backend.postman_collection.json` (import into Postman)

**Setup:**
- Backend running at `http://localhost:5000`
- Use one Postman session so cookie auth works automatically
- If register returns `EMAIL_SEND_FAILED`, use existing verified users or verify in DB

**Core API flow checklist:**
- [ ] `GET /api/health` returns `200`
- [ ] `POST /api/auth/register` (user and admin)
- [ ] `POST /api/auth/login` (user and admin) returns `200`
- [ ] `POST /api/categories` (admin) returns `201`
- [ ] `POST /api/events` (user) returns `201`
- [ ] `GET /api/admin/events/pending?page=1&limit=20` with pagination
- [ ] `PATCH /api/admin/events/:id/approve` returns `200`
- [ ] `GET /api/events?page=1&limit=12` shows approved event
- [ ] `GET /api/admin/users?page=1&limit=20` with pagination

**Optional:** `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

### Frontend Unit Tests

```bash
cd frontend-user && npm test
cd frontend-admin && npm test
```

### Phase 4 Exit Criteria

- No critical auth/moderation bugs
- Loading/empty/error states on all major screens
- Backend route tests for auth + moderation rules
- Query/index verification for list endpoints

---

## 16. Local Development & Deployment

### Local Setup

1. **Database:** PostgreSQL (local, Supabase, or Neon)
2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env   # configure DATABASE_URL, secrets, etc.
   npm install
   npm run prisma:migrate
   npm run dev              # http://localhost:5000
   ```
3. **User frontend:**
   ```bash
   cd frontend-user
   cp .env.example .env.local
   npm install
   npm run dev              # http://localhost:3000
   ```
4. **Admin frontend:**
   ```bash
   cd frontend-admin
   cp .env.example .env.local
   npm install
   npm run dev              # http://localhost:3001
   ```

### Pre-deploy verification (run locally)

```bash
cd backend && npm run smoke
cd ../frontend-user && npm run lint && npm test && npm run build
cd ../frontend-admin && npm run lint && npm test && npm run build
```

All must pass before promoting to production.

### Production deployment order

Deploy in this sequence so each layer has its dependencies ready:

1. **PostgreSQL** — provision managed Postgres (Supabase, Neon, Railway, etc.); note connection string for migrations
2. **Backend API** — deploy `backend/` (port 5000 or platform default)
3. **Run migrations** — `cd backend && npm run prisma:migrate:deploy` against production `DATABASE_URL`
4. **User frontend** — deploy `frontend-user/` (port 3000 or custom domain)
5. **Admin frontend** — deploy `frontend-admin/` (port 3001 or separate subdomain)

### Production environment matrix

| Variable | Backend | User app | Admin app |
|----------|---------|----------|-----------|
| `NODE_ENV` | `production` | (build-time) | (build-time) |
| `DATABASE_URL` | Required | — | — |
| `JWT_*_SECRET` | ≥32 chars, no placeholders | — | — |
| `COOKIE_SECURE` | `true` | — | — |
| `COOKIE_DOMAIN` | Parent domain if subdomains share cookies (e.g. `.maqaam.app`) | — | — |
| `TRUST_PROXY` | `true` behind reverse proxy | — | — |
| `CORS_ORIGIN_USER` | User site HTTPS origin | — | — |
| `CORS_ORIGIN_ADMIN` | Admin site HTTPS origin | — | — |
| `FRONTEND_USER_BASE_URL` | HTTPS user site (email links) | — | — |
| `RESEND_API_KEY` / `EMAIL_FROM` | Required | — | — |
| `CLOUDINARY_*` | Required | — | — |
| `NEXT_PUBLIC_API_BASE_URL` | — | `https://api.example.com/api` | Same API URL |

**User app only:** `NEXT_PUBLIC_MAPTILER_API_KEY` (and optional LocationIQ/Geoapify fallbacks).

### Deployment checklist

**Infrastructure**
- [ ] Production Postgres reachable; `DATABASE_URL` URL-encoded if password has special chars
- [ ] Custom domains + HTTPS certificates for API, user site, admin site
- [ ] Backend behind reverse proxy with `TRUST_PROXY=true`

**Backend**
- [ ] All Section 14 backend vars set; secrets rotated from dev placeholders
- [ ] `npm run prisma:migrate:deploy` applied successfully
- [ ] `GET /api/health` returns `database: ok`
- [ ] `npm run smoke` against production API (or Postman checklist in Section 15)

**Frontends**
- [ ] `NEXT_PUBLIC_API_BASE_URL` set at **build** time for both apps
- [ ] User and admin builds complete without env errors
- [ ] CORS origins on backend match exact deployed frontend URLs (scheme + host + port)

**Auth & cookies**
- [ ] `COOKIE_SECURE=true`; API served over HTTPS
- [ ] If API and frontends on different sites: `SameSite=None` + `Secure` (automatic when `COOKIE_SECURE=true`)
- [ ] `COOKIE_DOMAIN` set only when sharing cookies across subdomains

**Third-party services**
- [ ] Resend domain verified; test verify-email and reset-password emails
- [ ] Cloudinary upload works from create-event flow
- [ ] MapTiler/LocationIQ keys restricted to production domains

**Smoke test (production)**
- [ ] Register → verify email → login (user app)
- [ ] Create event with image → appears pending (admin)
- [ ] Admin approve → event visible on browse/homepage
- [ ] Admin login rejected for non-admin accounts
- [ ] Logout clears session

### Operational runbook

| Scenario | Action |
|----------|--------|
| **Rollback app** | Redeploy previous build artifact; DB migrations are forward-only — do not roll back schema without a planned migration |
| **Env change (backend)** | Update platform env → restart backend process |
| **Env change (`NEXT_PUBLIC_*`)** | Rebuild and redeploy affected frontend |
| **Login fails after deploy** | Check CORS origins, `COOKIE_SECURE`, cookie domain, email verified |
| **401 on all requests** | Confirm API URL in frontend build; check refresh cookie path/domain |
| **Emails not sending** | Verify Resend domain, `EMAIL_FROM`, API key; check backend logs |
| **Images fail upload** | Verify Cloudinary credentials and 2MB limit |

### Suggested hosting layout

| Service | Example |
|---------|---------|
| API | `api.maqaam.app` → backend |
| User site | `maqaam.app` or `www.maqaam.app` → frontend-user |
| Admin | `admin.maqaam.app` → frontend-admin |
| Database | Supabase PostgreSQL (managed; not on EC2) |

### Minimal AWS EC2 deployment (recommended)

One EC2 instance runs all three apps via **PM2**; **nginx** terminates HTTPS and routes by subdomain. **Postgres on Supabase**; EC2 hosts backend + both frontends only. Push to GitHub `main` can auto-deploy via GitHub Actions.

**Resources (minimal):**
- **Supabase** — PostgreSQL database (`DATABASE_URL` session pooler URI)
- 1× **EC2** (e.g. `t3.small`, Ubuntu 22.04) — API + user + admin
- **Namecheap DNS** — A records for `@`, `www`, `api`, `admin` → EC2 public IP
- ACM not required if using **certbot** on nginx (included in setup script)

**Repo deploy files:**

| Path | Purpose |
|------|---------|
| `deploy/setup-ec2.sh` | One-time server bootstrap (Node 20, PM2, nginx) |
| `deploy/deploy.sh` | Pull, install, migrate, build, restart PM2 |
| `deploy/ecosystem.config.cjs` | PM2: backend `:5000`, user `:3000`, admin `:3001` |
| `deploy/nginx/maqaam.conf.example` | Reverse proxy for three subdomains |
| `deploy/env/*.env.example` | Production env templates (copy to `/etc/maqaam/` on server) |
| `.github/workflows/deploy.yml` | SSH deploy on push to `main` |

**First-time server setup:**

```bash
# On EC2 (as root), after cloning the repo to /var/www/maqaam:
export MAQAAM_REPO_URL=https://github.com/YOUR_ORG/Maqaam.git
sudo bash /var/www/maqaam/deploy/setup-ec2.sh

# Edit production secrets (never commit these):
sudo nano /etc/maqaam/backend.env
sudo nano /etc/maqaam/frontend-user.env
sudo nano /etc/maqaam/frontend-admin.env

# Set domains in nginx, then HTTPS:
sudo nano /etc/nginx/sites-available/maqaam
sudo certbot --nginx -d example.com -d www.example.com -d api.example.com -d admin.example.com

# First deploy:
cd /var/www/maqaam && bash deploy/deploy.sh
```

**GitHub auto-deploy secrets** (repo → Settings → Secrets):

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_USER` | `ubuntu` (or your SSH user) |
| `EC2_SSH_KEY` | Private key for deploy user |

After setup: commit and push to `main` → workflow runs `deploy/deploy.sh` on the server.

**Manual redeploy:** `ssh` to EC2, `cd /var/www/maqaam && bash deploy/deploy.sh`

### Documentation maintenance

- **This file (`Documentation.md`) is the only project documentation.**
- When shipping features, fixes, or deploy changes: add a dated entry to [Section 18](#18-appendix-full-development-log).

---

## 17. Admin Operations Overview

Brief reference for admin-facing backend data, API behavior, permissions, and the dashboard flow.

### What data the backend shows admin

All admin APIs live under `/api/admin/*` and require `role: "ADMIN"`. Authentication uses HTTP-only JWT cookies (`credentials: "include"` on every request).

**Pending events queue** — `GET /api/admin/events/pending?page&limit`

| Field | Purpose |
|-------|---------|
| `id`, `title`, `description`, `imageUrl` | Event preview |
| `status` | Always `PENDING` in this list |
| `createdAt`, `startDate`, `endDate` | When submitted / scheduled |
| `formattedAddress` | Location |
| `user.id`, `user.name`, `user.email` | Host who submitted |
| `category` | Category id, name, slug |
| `pagination` | `page`, `limit`, `total`, `totalPages` |

**Users list** — `GET /api/admin/users?page&limit`: `id`, `name`, `email`, `role`, `isActive`, `createdAt`, pagination. Does not return `phoneNumber` or email verification status.

**Audit logs** — `GET /api/admin/audit-logs?actorUserId&targetType&targetId&page&limit`: `action`, `targetType`, `targetId`, `meta`, `createdAt`, actor name/email/role.

Common audit actions: `AUTH_*`, `EVENT_*`, `ADMIN_EVENT_APPROVE`, `ADMIN_EVENT_REJECT`, `ADMIN_USER_PROMOTE`, `ADMIN_USER_DEACTIVATE`, `ADMIN_USER_DELETE`.

**Event detail** — `GET /api/events/:id`: admin sees pending, approved, and rejected events. Returns moderation fields; host name/email only in pending queue response.

**Stats (computed client-side):** pending total from pending endpoint; users total from users endpoint; total events = sum of `GET /events` pagination totals for PENDING + APPROVED + REJECTED.

### What admin can do

| Area | Actions |
|------|---------|
| **Moderation** | View pending queue, approve, reject (reason 3–500 chars), view full event |
| **Users** | List, promote to admin, deactivate, delete (cannot delete self or last admin) |
| **Audit** | View/filter logs by actor, target type, target id |
| **API-only** | Browse events by status, create category, edit/delete any event, view event images |

### Admin API request flow

```
Browser (maqaam-admin, port 3001)
    ↓  credentials: "include"
POST /api/auth/login  →  JWT cookies
GET  /api/auth/me     →  role === "ADMIN"
    ↓
/api/admin/*          →  requireAuth + requireAdmin
    ↓
PostgreSQL (Prisma)
```

On `401`, frontend auto-calls `POST /auth/refresh` once and retries. Login blocked until email verified (`403`). Approve/reject writes audit logs.

### Dashboard flow

1. User creates event → status `PENDING`
2. Admin sees it in events dashboard (pending filter or queue)
3. Admin approves → `APPROVED` → public site, or rejects → `REJECTED` + reason
4. Action recorded in audit logs

**Screens:** Inline sign-in when guest → protected shell with sidebar → Events (schedule/status filters, stats, approve/reject) → Users → Audit logs → Event review at `/events/[id]`.

**Reject UX:** Dialog with Zod validation (3–500 chars). **Delete user:** must type `DELETE`. **Deactivate:** confirmation dialog.

### Admin API quick reference

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Current user + role |
| POST | `/auth/logout` | Sign out |
| POST | `/auth/refresh` | Refresh session |
| GET | `/admin/events/pending` | Moderation queue |
| PATCH | `/admin/events/:id/approve` | Approve |
| PATCH | `/admin/events/:id/reject` | Reject with reason |
| GET | `/admin/users` | User list |
| PATCH | `/admin/users/:id/promote` | Promote |
| PATCH | `/admin/users/:id/deactivate` | Deactivate |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/audit-logs` | Activity history |
| GET | `/events/:id` | Full event detail |
| GET | `/events?status=...&schedule=...` | Filter events (admin) |

---

## 18. Appendix: Full Development Log

> Timestamped record of all meaningful development work. Update this section when shipping features or fixes.

<!-- DEVLOG_START -->
### 2026-06-10 (UTC+5) - Supabase + EC2 deploy layout (maqaam.me)
- Database on Supabase; backend + frontends on single EC2. Updated `deploy/DEPLOY-STEPS.md` and env templates.

### 2026-06-10 (UTC+5) - EC2 deploy-ready monorepo
- Fixed git: `frontend-user` and `frontend-admin` are normal monorepo folders (removed broken submodule links).
- Added `deploy/` (PM2, nginx, `setup-ec2.sh`, `deploy.sh`, env examples) and `.github/workflows/deploy.yml` for push-to-main SSH deploy.
- Backend: `postinstall` runs `prisma generate`; smoke test supports `SMOKE_BASE_URL`.

### 2026-06-09 (UTC+5) - Rejected event resubmit + re-review flow
- Owner edit clears moderation fields and returns event to `PENDING`; admin approve/reject limited to pending gatherings.
- User: rejected events show edit/resubmit CTAs and resubmitted confirmation; admin queue defaults to pending filter.

### 2026-06-09 (UTC+5) - Admin category management
- Backend: `PATCH` / `DELETE` on `/api/categories/:id`; list includes `eventCount`.
- Admin: `/categories` screen (create, edit, delete) with sidebar nav; validation helpers + tests.
- User: browse filters and create-event form use live categories from the API.

### 2026-06-09 (UTC+5) - Pre-deployment database fresh start
- Added `backend/scripts/fresh-start-db.js`: keeps only `khurramzaman2001@gmail.com` (ADMIN) and `uw-21-cs-bsc-091@student.uow.edu.pk` (USER); clears events, categories, sessions, tokens, audit logs, and other users.

### 2026-06-09 (UTC+5) - docs/ cleanup
- Removed generated PDF pipeline (`admin-overview.pdf`, `admin-overview-print.html`, `generate-admin-overview-pdf.mjs`); admin reference remains in Section 17.
- Removed unused `marked` backend devDependency; kept `docs/postman/maqaam-backend.postman_collection.json` only.

### 2026-06-09 (UTC+5) - Pre-deploy verification complete
- Backend smoke test passed; frontend-user lint + 10 tests + build passed; frontend-admin lint + 16 tests + build passed.
- Reinstalled `marked` (backend devDependency) for `docs/generate-admin-overview-pdf.mjs`; regenerated `docs/admin-overview.pdf`.

### 2026-06-09 (UTC+5) - Production deployment runbook
- Expanded Section 16 with pre-deploy verification, env matrix, checklist, operational runbook, and hosting layout.
- Updated `docs/generate-admin-overview-pdf.mjs` to extract Section 17 from `Documentation.md` (replaces deleted admin-overview source).

### 2026-06-09 (UTC+5) - Single-file documentation policy
- All project documentation consolidated into root `Documentation.md` only; removed separate markdown files across the repo.

### 2026-06-09 (UTC+5) - Frontend-user static assets reorganized
- Moved homepage/brand images into `frontend-user/public/assets/{brand,home}/`.
- Added `frontend-user/lib/site-assets.js` manifest; updated hero, header, footer, and CTA banner.

### 2026-06-09 (UTC+5) - Frontend-admin pre-deployment cleanup
- Removed unused default Next.js public SVGs; stripped unused map keys from admin env template.
- Package renamed `maqaam-admin`; port 3001; consolidated date formatters; lint/test/build verified.

### 2026-06-09 (UTC+5) - Frontend-user pre-deployment cleanup
- Removed unused components/deps; geocoding consolidated; production build + ESLint clean.

### 2026-06-09 (UTC+5) - Backend pre-deployment cleanup
- Shared `http-errors.js`, `lib/cloudinary.js`; Postman moved to `docs/postman/`; `npm run smoke` added.

### 2026-06-09 (UTC+5) - Admin shell, mobile UI, events dashboard overhaul
- Sidebar layout, lazy screens, schedule/status filters on events list, premium admin UI, reject/deactivate/delete dialogs.

### 2026-06-09 (UTC+5) - Mock event data removed for deployment
- Deleted `frontend-user/lib/mock-data.js`, `mock-browse-events.js`, `mock-upcoming-events.js`.
- `app/page.js`: homepage upcoming events use API only; empty state when none.
- `event-discovery.jsx`: removed mock preview fallback; browse always uses live API with empty-state UI.

### 2026-06-08 (UTC+5) - Homepage GPU micro-animations
- Added `fadeInUp` / `fadeIn` keyframes in `frontend-user/app/globals.css` (translate3d, motion-safe compatible).
- `hero-section.jsx`: staggered fade-and-rise on text/CTA; delayed featured image card; motion-safe CTA hover scale.
- `event-card.jsx`: motion-safe lift + teal shadow hover on gathering cards.
- `how-it-works-section.jsx`: staggered step column fade-in (0.2s/0.4s/0.6s); motion-safe scale on step circles.

### 2026-06-08 (UTC+5) - Browse/discovery performance pass
- `frontend-user/lib/public-api.js`: 5-minute cache (`PUBLIC_EVENTS_REVALIDATE = 300`) via fetch `revalidate` + `unstable_cache` wrapper (`getCachedPublicEvents`).
- `frontend-user/app/events/page.js` + `app/page.js`: page-level `revalidate = 300`; browse SSR uses cached fetch.
- `frontend-user/components/home/event-card.jsx`: optimized `next/image` with `fill`, lazy load, responsive `sizes`.
- `frontend-user/next.config.mjs`: AVIF/WebP image formats enabled.
- Note: browse grid is card-only (no Leaflet bundle); event detail map already uses `dynamic(..., { ssr: false })`.

### 2026-06-08 (UTC+5) - Production hardening (important audit fixes)
- Gated mock event data to development only (`frontend-user/lib/mock-data.js`, `event-discovery.jsx`, `app/page.js`).
- Required `NEXT_PUBLIC_API_BASE_URL` in prod builds (`frontend-user/lib/config.js`, `frontend-admin/lib/config.js`); hardened `backend/src/config/env.js` for production secrets/services.
- Backend: Helmet + generic errors (`app.js`), DB health ping, JWT HS256 pin, email HTML escape, upload magic-byte validation, global/write rate limits, `refreshTokenHash` index migration, graceful shutdown.
- Frontends: automatic session refresh on 401 (`api-client.js`), admin sign-in open-redirect guard, security headers in `next.config.mjs`.
- Verified: smoke test passes; Prisma migration applied.

### 2026-06-08 (UTC+5) - Password fields show/hide toggle
- Added `frontend-user/components/ui/password-input.jsx` with teal `#0B4D53` Eye/EyeOff toggle.
- Wired into `sign-in-dialog.jsx` (login + register) and `reset-password-client.jsx`.

### 2026-06-08 (UTC+5) - Host gathering form validation + map overlay fix
- Refactored `create-event-form.jsx`: Islamic microcopy, all fields required (incl. banner), schedule validation with brand toasts, teal error styling.
- Updated `create-event-map.jsx`: narrowed search overlay (`left-14`, `max-w-[280px]`) to clear Leaflet zoom controls.
- Extended `lib/event-validation.js` with `validateGatheringSchedule`, `formToastClass`, and `toDatetimeLocalValue`.

### 2026-06-08 (UTC+5) - Browse events today + upcoming only
- Extended `frontend-user/lib/browse-events.js` with `getBrowseEventsStartDateFrom()` and `filterCurrentOrUpcomingEvents()`.
- Updated `app/events/page.js` and `event-discovery.jsx` to pass `startDateFrom` (start of local day) so past gatherings are excluded from browse listings and mock preview.

### 2026-06-08 (UTC+5) - Browse events 9-per-page pagination
- Added `frontend-user/lib/browse-events.js` with `BROWSE_EVENTS_PAGE_SIZE = 9`.
- Updated `frontend-user/app/events/page.js` and `event-discovery.jsx` to always fetch/display 9 cards per page, reset page on filter changes, and show result range in pagination.

### 2026-06-08 (UTC+5) - Register email verification end-to-end hardening
- Backend: `auth.routes.js` — URL-encode verify tokens, dev verification-link logging, register/verify-email request tolerate email-delivery failures (account still created / generic 200), atomic verify confirm via `$transaction` + invalidate all verification tokens.
- Backend: `email.service.js` — premium verification email HTML with CTA button.
- Backend: `scripts/smoke-test.js` — added login-before-verify (403), verify request/confirm, and login-after-verify checks.
- Frontend: `verify-email-inner.jsx` token decode; `verify-email-client.jsx` premium layout + post-verify Sign in CTA; `sign-in-dialog.jsx` resend keeps verify prompt visible after success.
- documented verify-email request/confirm routes.

### 2026-06-08 (UTC+5) - Reset password page premium layout polish
- Updated `frontend-user/components/auth/reset-password-client.jsx`: cream canvas `#FAF6F0`, white `rounded-2xl` card, teal focus inputs, primary/secondary button tokens, and heading/back-link typography aligned to Maqaam design system.
- Updated `frontend-user/app/reset-password/page.js` loading fallback to match cream canvas.

### 2026-06-08 (UTC+5) - Forgot/reset password end-to-end hardening
- Backend: `auth.routes.js` — URL-encode reset tokens, dev console reset-link logging, swallow email-delivery failures on `POST /auth/forgot-password` with generic 200, atomic `$transaction` on reset + revoke all reset tokens/sessions.
- Backend: `email.service.js` — clearer reset email HTML with CTA button.
- Backend: `scripts/smoke-test.js` — added forgot-password, reset-password, and login-after-reset checks.
- Frontend: `sign-in-dialog.jsx` — forgot-password success state + clearer copy; `reset-password-inner.jsx` — decode token from query; `reset-password-client.jsx` — post-reset Sign in CTA; `home-sign-in-prompt.jsx` + `app/page.js` — open login modal via `/?signin=1`.
- documented forgot/reset auth routes.

### 2026-06-08 (UTC+5) - Register manual country code input
- Replaced country code dropdown with manual text field in `frontend-user/components/auth/sign-in-dialog.jsx`.
- Added `sanitizeCountryCode()` / `validateCountryCode()` in `frontend-user/lib/phone-countries.js`; split `countryCode` vs `phoneNumber` validation paths in `register-validation.js`.

### 2026-06-08 (UTC+5) - Register form validation + worldwide phone codes
- Added `frontend-user/lib/phone-country-codes-data.js` (248 ITU codes via `scripts/gen-phone-codes.mjs`) and `frontend-user/lib/register-validation.js` (Zod: required fields, email, E.164 min/max, password strength, confirm match).
- Updated `frontend-user/lib/phone-countries.js` with `getPhoneCountryOptions()`, dynamic local digit bounds, and `validatePhoneFields()`.
- Updated `frontend-user/components/auth/sign-in-dialog.jsx`: mandatory fields, narrower country code select with Common/All optgroups, validation toasts + inline errors, password/phone rules.
- Extended `frontend-user/tests/user-lib.test.js` for register/phone validation helpers.

### 2026-06-08 (UTC+5) - Auth register ScrollArea scroll fix
- Fixed `frontend-user/components/ui/scroll-area.jsx`: `overflow-hidden` on Root, `ScrollArea.Content` wrapper inside Viewport, Maqaam teal thumb styling.
- Fixed `frontend-user/components/auth/sign-in-dialog.jsx`: register `ScrollArea` uses explicit `h-[min(52vh,400px)]` (not `max-h` only) so viewport height resolves and wheel/track scroll works.

### 2026-06-08 (UTC+5) - Auth register modal ScrollArea + layout polish
- Added shadcn/Base UI `frontend-user/components/ui/scroll-area.jsx` with Maqaam teal thumb styling (`#0B4D53` at 20%/40% opacity).
- Refactored `frontend-user/components/auth/sign-in-dialog.jsx`: modal uses flex column (no outer native scroll); register fields (Name–Confirm password) wrapped in `ScrollArea`; Create Account button, toast, and legal copy pinned below scroll.
- Removed unused `.auth-dialog-scroll` custom scrollbar rules from `frontend-user/app/globals.css`.

### 2026-06-06 (UTC+5) - Browse events wide card grid refactor
- Refactored `frontend-user/components/home/event-discovery.jsx` to full-width 3-column card grid (map removed), horizontal filter tags, centered pagination, and Calendar/Clock/MapPin meta rows.
- Extended `frontend-user/lib/format-event.js` with date/time format helpers; updated mock browse titles and page fetch limit to 9.

### 2026-06-06 (UTC+5) - Browse events page premium map-list refactor
- Refactored `frontend-user/components/home/event-discovery.jsx` with cream canvas, 7xl grid, map/list split layout, gathering filter dropdown, teal search CTA, homepage-style cards, and pagination controls.
- Added `frontend-user/lib/mock-browse-events.js` for contextual preview data when API returns empty/smoke events.
- Updated `frontend-user/app/events/page.js` metadata and initial page size.

### 2026-06-06 (UTC+5) - Hero Arabic tagline luminous teal styling
- Updated `frontend-user/components/home/hero-section.jsx` Arabic layer to `#2DD4BF` with subtle mint glow and `tracking-wide` for sharper legibility.

### 2026-06-06 (UTC+5) - Footer container aligned to site grid
- Updated `frontend-user/components/home/site-footer.jsx` inner wrapper to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full` (footer background color unchanged).

### 2026-06-06 (UTC+5) - About Mission container aligned to site grid
- Updated `frontend-user/components/home/about-mission-section.jsx` inner wrapper to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full`.

### 2026-06-06 (UTC+5) - How It Works container aligned to site grid
- Updated `frontend-user/components/home/how-it-works-section.jsx` inner wrapper to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full`.

### 2026-06-06 (UTC+5) - CTA banner container aligned to site grid
- Updated `frontend-user/components/home/organize-event-banner.jsx` outer wrapper to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full` so the rounded banner aligns with the upcoming events card grid.

### 2026-06-06 (UTC+5) - Hero container alignment with site grid
- Updated `frontend-user/components/home/hero-section.jsx` to use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full`, balanced two-column grid, and full-width image card within column bounds.
- Aligned `site-header.jsx` and `upcoming-events-section.jsx` to the same container width/padding for vertical guide-line consistency.

### 2026-06-06 (UTC+5) - Footer copy, links, and contact button polish
- Updated `frontend-user/components/home/site-footer.jsx` with non-profit Islamic platform copy, OpenStreetMap footnote, standard nav links (Browse Events, Create Event, Our Mission), and Global Ummah meta line.
- Updated `frontend-user/components/home/footer-contact-form.jsx` Send button with off-white teal-accent styling and hover scale transition.

### 2026-06-06 (UTC+5) - Hero copy, CTA, and layout alignment upgrade
- Updated `frontend-user/components/home/hero-section.jsx` with Islamic-focused headline/subtext, brighter Arabic tagline, Explore the Map CTA (#0B4D53), bottom fade into cream section, and `max-w-7xl px-6` content alignment.
- Updated `frontend-user/components/home/site-header.jsx` inner container to `max-w-7xl px-6` so hero text aligns with the navbar logo grid.

### 2026-06-06 (UTC+5) - CTA banner contrast and premium polish
- Updated `frontend-user/components/home/organize-event-banner.jsx` with asymmetric left-to-right dark gradient overlay, sand-gold accent tag, heading drop shadow, CalendarPlus CTA with hover scale/ring, and minimalist trust badges row.

### 2026-06-06 (UTC+5) - Auth modal form fields restored to labeled layout
- Updated `frontend-user/components/auth/sign-in-dialog.jsx` to restore previous labeled vertical field structure (Name, Email, Phone, Password on register; Email, Password on login) while keeping the premium teal modal design, headers, and CTAs.

### 2026-06-06 (UTC+5) - Auth modal premium redesign
- Updated `frontend-user/components/auth/sign-in-dialog.jsx` to match Maqaam palette (#0B4D53 primary, #FAF6F0 modal surface, teal focus inputs).
- Context-specific headers/copy per tab (Welcome Back / Join Maqaam), Sign In / Create Account CTAs, 4-field register grid + contact phone for API, legal microcopy, and pill tab switcher styling.

### 2026-06-02 (UTC+5) - Hero navbar fixed on scroll
- Updated `frontend-user/components/home/site-header.jsx` hero variant to `fixed top-0` with scroll-aware cream background and teal text after scrolling past the hero.
- Kept transparent overlay styling at the top of the homepage; navbar remains visible while scrolling.

### 2026-06-02 (UTC+5) - Navbar nav sequence updated
- Updated `frontend-user/components/home/site-header.jsx` nav links to: Create Event, Browse Events, How it works, About us (in order).
- Added `id="how-it-works"` and `id="about-us"` with `scroll-mt-20` on homepage sections for anchor navigation.

### 2026-06-02 (UTC+5) - How It Works copy updated for listing pipeline
- Updated text only in `frontend-user/components/home/how-it-works-section.jsx` to reflect create → admin review → live discovery flow and OpenStreetMap footnote.

### 2026-06-02 (UTC+5) - Homepage section backgrounds unified to cream
- Updated `upcoming-events-section.jsx`, `organize-event-banner.jsx`, and `how-it-works-section.jsx` backgrounds from `#F4F6F6` to `#FAF6F0` to match the About Mission section.

### 2026-06-02 (UTC+5) - About Us / Our Mission homepage section
- Added `frontend-user/components/home/about-mission-section.jsx` with premium minimalist 2-column layout (1/3 mission heading + 2/3 copy), cream background `#FAF6F0`, deep teal typography, and mission/mantra content.
- Updated `frontend-user/app/page.js` to render the section after How It Works and before the footer.

### 2026-06-02 (UTC+5) - Navbar auth consolidated to single user icon
- Updated `frontend-user/components/home/site-header.jsx` to replace separate Register/Login icon buttons with one `User` icon trigger that opens the existing sign-in/register dialog (tabs unchanged).

### 2026-06-02 (UTC+5) - Navbar auth buttons replaced with icon triggers
- Extended `frontend-user/components/auth/sign-in-dialog.jsx` with optional `triggerIcon`, plus `aria-label`/`title` from `triggerLabel` for accessible icon-only triggers.
- Updated `frontend-user/components/home/site-header.jsx` to use `UserPlus` (Register) and `LogIn` (Login) lucide icons in rounded premium icon buttons for hero and default navbar variants.

### 2026-06-02 (UTC+5) - Homepage upcoming events mock fallback
- Added `frontend-user/lib/mock-upcoming-events.js` with three placeholder events (local images + future dates) for UI preview.
- Updated `frontend-user/app/page.js` to use mock data when `getTopUpcomingEvents` returns no results.

### 2026-06-02 (UTC+5) - Hero CTA visual refinement
- Updated `frontend-user/components/home/hero-section.jsx` primary button to a larger rounded-pill outline style with transparent background, white border, and white text to match the banner CTA language.

### 2026-06-02 (UTC+5) - Hero CTA simplified to single organize action
- Updated `frontend-user/components/home/hero-section.jsx` to replace dual CTA buttons with one `Organize Event` button.
- Wired the hero CTA to `/events/create`, matching the banner CTA redirect behavior.

### 2026-06-02 (UTC+5) - Upcoming events layout rollback
- Reverted `frontend-user/components/home/upcoming-events-section.jsx` to the simple 3-card grid (removed the featured-row variant) and restored homepage fetch to top 3 upcoming events.

### 2026-06-02 (UTC+5) - Upcoming events: featured row + 3 cards (top 4)
- Updated `getTopUpcomingEvents` default/limit to 4 and `frontend-user/app/page.js` to fetch four nearest upcoming events by start date.
- Redesigned `frontend-user/components/home/upcoming-events-section.jsx`: nearest event as a horizontal featured block (image left, details right on desktop); next three in the existing card grid below.

### 2026-06-02 (UTC+5) - CTA banner restyled from reference inspiration
- Updated `frontend-user/components/home/organize-event-banner.jsx` to a premium dark panel composition inspired by the provided reference: abstract layered circles on the left, right-aligned content focus, rounded pill CTA, and refined border/shadow treatment.
- Preserved Maqaam design language and palette while keeping the Kaaba image as a subtle atmospheric background layer.

### 2026-06-02 (UTC+5) - CTA banner redesign (taller enhanced image-first treatment)
- Updated `frontend-user/components/home/organize-event-banner.jsx` to a taller cinematic layout with stronger layered overlays, improved contrast, and upgraded shadow depth.
- Added an elevated glass-style content panel over the image, increased headline prominence, and refined CTA button sizing/weight for a more premium modern feel.

### 2026-06-02 (UTC+5) - CTA banner background image update
- Added `frontend-user/public/organize-banner-kaaba.png` from the newly provided image.
- Updated `frontend-user/components/home/organize-event-banner.jsx` to use the Kaaba image as full-bleed banner background with a readable deep-teal gradient overlay behind CTA text/actions.

### 2026-06-02 (UTC+5) - Homepage spacing rhythm pass
- Rebalanced vertical spacing across homepage sections for a cleaner premium flow: reduced oversized repeated paddings and introduced a more intentional rhythm between Hero, Upcoming, CTA, How It Works, and Footer.
- Updated section-specific spacing in `frontend-user/components/home/hero-section.jsx`, `upcoming-events-section.jsx`, `organize-event-banner.jsx`, `how-it-works-section.jsx`, and `site-footer.jsx`.

### 2026-06-02 (UTC+5) - How It Works redesigned from visual inspiration
- Reworked `frontend-user/components/home/how-it-works-section.jsx` into a centered 3-step premium flow inspired by the provided reference: numbered circles, subtle dashed connector line, icon accents, and minimalist step copy.
- Added explicit footer note in the section: “Location discovery powered by maps.”

### 2026-06-02 (UTC+5) - Homepage sectional hierarchy implementation (premium minimalist)
- Updated `frontend-user/app/page.js` to implement the new homepage order: Hero → Upcoming Events (top 3) → Organize Event CTA banner → How It Works → Footer.
- Added `frontend-user/components/home/upcoming-events-section.jsx` with a 3-column premium card grid (image, title, formatted date/time, “View Details”), backed by top-upcoming API data.
- Added `frontend-user/components/home/organize-event-banner.jsx` and `frontend-user/components/home/how-it-works-section.jsx` with generous vertical spacing and minimalist premium styling.
- Extended `frontend-user/lib/public-api.js` with `getTopUpcomingEvents()` and added route alias `frontend-user/app/events/create/page.js` redirecting to `/events/new` for CTA compatibility.

### 2026-06-02 (UTC+5) - Footer redesigned (premium dark variant with brand details)
- Rebuilt `frontend-user/components/home/site-footer.jsx` into a dark, premium footer with brand block, logo, navigation links, contact details, and refined legal/meta bottom row.
- Added logo usage in footer via `maqaam-logo-teal-transparent.png` with white tile treatment to match navbar brand language.

### 2026-06-02 (UTC+5) - Footer contact form added
- Added `frontend-user/components/home/footer-contact-form.jsx` with 3 fields (Name, Subject, Message) and `mailto:` submission behavior.
- Updated `frontend-user/components/home/site-footer.jsx` to embed the form under the Contact column.

### 2026-06-02 (UTC+5) - Homepage UI rollback to pre-guideline-update visuals
- Reverted homepage styling files to the visual state used before applying the new palette-guideline implementation: `frontend-user/app/globals.css`, `frontend-user/components/home/site-header.jsx`, `hero-section.jsx`, `event-discovery.jsx`, and `site-footer.jsx`.
- Kept the latest logo asset flow while restoring earlier hero/discovery/footer color treatments and interaction styling.

### 2026-06-02 (UTC+5) - Hero overlay rollback to pre-tuning state
- Reverted `frontend-user/components/home/hero-section.jsx` overlay and geometry opacity to the earlier pre-tuning values after Option A/B experiments.

### 2026-06-02 (UTC+5) - Hero overlay contrast adjusted (Option B)
- Updated `frontend-user/components/home/hero-section.jsx` overlay to a slightly darker gradient and raised geometry opacity slightly to improve headline/body contrast over the landscape image.

### 2026-06-02 (UTC+5) - Hero overlay tuning for cleaner premium look
- Updated `frontend-user/components/home/hero-section.jsx` to reduce overlay intensity (lighter gradient opacity and lower decorative geometry opacity) so the hero image reads more naturally.

### 2026-06-02 (UTC+5) - Homepage palette application (premium minimalist pass)
- Updated `frontend-user/app/globals.css` design tokens to the locked palette: primary `#0B4D53`, background `#F4F6F6`, supporting tone `#D4E6F1`, plus aligned border/input/muted values.
- Updated homepage components (`frontend-user/components/home/site-header.jsx`, `hero-section.jsx`, `event-discovery.jsx`, `site-footer.jsx`) to remove leftover off-palette colors and apply the new premium minimalist theme consistently.
- Refined hero overlays/buttons/surfaces and discovery cards/inputs/empty states to use teal + ice-blue accents with softer contrast.

### 2026-06-02 (UTC+5) - Design docs updated for premium minimalist palette

### 2026-06-02 (UTC+5) - Navbar logo square size reduced
- Updated `frontend-user/components/home/site-header.jsx` to reduce the rounded-square logo tile size and inner logo dimensions for a more compact navbar brand.

### 2026-06-02 (UTC+5) - Teal logo black-fill removal
- Created `frontend-user/public/maqaam-logo-teal-transparent.png` by removing black background pixels and preserving the teal logo color.
- Updated `frontend-user/components/home/site-header.jsx` to use the transparent teal logo inside the white rounded square tile.

### 2026-06-02 (UTC+5) - Navbar logo tile changed to white
- Updated `frontend-user/components/home/site-header.jsx` logo square background to white (hero + non-hero variants) while keeping rounded corners and existing wordmark layout.

### 2026-06-02 (UTC+5) - Navbar brand restyled with teal logo tile + text
- Added `frontend-user/public/maqaam-logo-teal.png` from the newly provided logo asset.
- Updated `frontend-user/components/home/site-header.jsx` brand area to use a rounded-square logo tile background and restored the `Maqaam` wordmark text beside it.
- Kept hero/non-hero aware tile styling so the logo block remains visible and polished in both contexts.

### 2026-06-02 (UTC+5) - Hero-integrated navbar seamless styling pass
- Updated `frontend-user/components/home/site-header.jsx` hero variant to remove the extra frosted overlay layer (`bg-black/20` + blur) and use transparent navbar styling.
- Softened hero auth button treatment to transparent outlined controls so navbar reads as part of hero instead of a separate bar.

### 2026-06-02 (UTC+5) - Logo black-box fix with regenerated asset
- Generated `frontend-user/public/maqaam-logo-v2.png` with transparent background and white glyph from the provided source logo to eliminate the visible black square.
- Updated `frontend-user/components/home/site-header.jsx` to use `/maqaam-logo-v2.png` (cache-busting and clean rendering).

### 2026-06-02 (UTC+5) - Navbar logo converted to true transparency
- Converted `frontend-user/public/maqaam-logo.png` to a transparent-background white logo asset (black pixels removed to alpha, glyph normalized to white).
- Updated `frontend-user/components/home/site-header.jsx` to remove temporary `mix-blend-screen` usage and render the logo directly.

### 2026-06-02 (UTC+5) - Hero logo visual transparency tweak
- Updated `frontend-user/components/home/site-header.jsx` to apply `mix-blend-screen` on the hero logo, making the black image background visually disappear while keeping the logo glyph white over the hero image.

### 2026-06-02 (UTC+5) - Homepage logo refresh + seamless navbar/hero polish
- Replaced `frontend-user/public/maqaam-logo.png` with the new user-provided transparent-background logo asset.
- Updated `frontend-user/components/home/site-header.jsx` to remove the textual `Maqaam` label and keep only the logo mark in the navbar brand.
- Removed the hero navbar bottom separator in `frontend-user/components/home/site-header.jsx` (`hero` variant) to keep navbar and hero visually seamless.

### 2026-06-02 (UTC+5) - Homepage hero/navbar redesign with provided assets
- Updated `frontend-user/components/home/site-header.jsx` to support a `hero` variant, replaced icon mark with the provided `maqaam-logo.png`, and tuned nav/auth controls for transparent-on-image presentation.
- Updated `frontend-user/components/home/hero-section.jsx` to integrate the header and hero into one seamless section with layered landscape background, modern glass panel styling, and refined CTA hierarchy.
- Updated `frontend-user/app/page.js` to render only `HeroSection` (header now lives inside hero on home), and added `frontend-user/public/maqaam-logo.png` + `frontend-user/public/hero-landscape.png`.

### 2026-05-07 (UTC+5) - Hydration + dropdown menu fixes (Base UI)
- Fixed `frontend-user/components/home/event-discovery.jsx` hydration error by removing nested `<button>` rendering in the filters dialog trigger (use Base UI `render` prop instead of wrapping a `<Button>` inside `<DialogTrigger>`).
- Fixed `frontend-user/components/auth/user-menu.jsx` dropdown runtime error by wrapping `DropdownMenuLabel`/items inside `DropdownMenuGroup` to satisfy Base UI menu group context requirements.

### 2026-05-07 (UTC+5) - Login modal close fix + user menu sign-out refresh
- Fixed `frontend-user/components/auth/sign-in-dialog.jsx` successful-login flow by removing an invalid state call path and using dialog open-change handling to close the popup reliably before running post-login refresh logic.
- Updated `frontend-user/components/auth/user-menu.jsx` logout flow to navigate to home and refresh router state after `POST /auth/logout`, ensuring header/menu state updates immediately without manual reload.

### 2026-05-07 (UTC+5) - User CTA flow updates (register/login/explore/host)
- Updated `frontend-user/components/auth/sign-in-dialog.jsx` to support configurable trigger label/style, default login/register tab, and controlled open state so auth dialogs can be reused for context-specific CTAs.
- Updated `frontend-user/components/home/site-header.jsx` to show `Register` + `Login` for signed-out users (replacing `Browse` / `Sign in` wording) and switched discover navigation to the dedicated `/events` listing route.
- Added `frontend-user/app/events/page.js` for a full explore screen using `EventDiscovery` + backend pagination/search/filter flow; updated `frontend-user/components/home/hero-section.jsx` so `Explore events` opens this page.
- Added `frontend-user/components/events/host-event-cta.jsx` and wired it from `hero-section.jsx` so `Host an event` checks session first, opens login/register popup when signed out, and redirects to `/events/new` after successful authentication.

### 2026-05-04 (UTC+5) - Frontend user hydration warning guard
- Updated `frontend-user/app/layout.js` to add `suppressHydrationWarning` on the root `<body>` to prevent extension-injected attributes (e.g., Grammarly) from triggering client hydration mismatch warnings in local dev.
- Re-ran `frontend-user` lint to confirm no regressions.

### 2026-05-04 (UTC+5) - User Phase 4 checks: test baseline added
- Added `vitest` setup in `frontend-user/package.json` (`npm test`).
- Added `frontend-user/tests/user-lib.test.js` with baseline automated checks for user-side helpers and API adapters: `lib/config.js` (`getApiBaseUrl`), `lib/format-event.js` (`formatEventRange`), `lib/api-client.js` (`apiJson` request/error shape), and `lib/public-api.js` (`getPublicEvents` success/fallback).

### 2026-05-04 (UTC+5) - Admin Step 7: automated validation checks
- Added/expanded `frontend-admin/lib/admin-validation.js` with reusable filter validation (`validateAuditFilters`) and delete-confirm token checking.
- Updated admin screens to consume the shared validation helpers (`frontend-admin/components/admin/admin-audit-logs-screen.jsx`, `frontend-admin/components/admin/admin-users-screen.jsx`) to reduce duplicated validation logic.
- Added test setup for `frontend-admin` (`vitest`) with `npm test` script and `frontend-admin/tests/admin-validation.test.js` covering UUID checks, reject reason constraints, target type normalization, audit filter validation, and delete token confirmation behavior.

### 2026-05-04 (UTC+5) - Admin Step 6: Phase 4 UX hardening
- Added `frontend-admin/lib/admin-validation.js` for shared client-side validation helpers (UUID checks, reject reason guard, and `targetType` normalization/validation).
- Updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx`, `frontend-admin/components/admin/admin-users-screen.jsx`, `frontend-admin/components/admin/admin-audit-logs-screen.jsx`, and `frontend-admin/components/admin/admin-event-review-screen.jsx` with clearer loading/empty states, retry actions after failed API calls, and success notices after admin actions.
- Added stronger destructive-action safety in users screen (`DELETE` typed confirmation) and stricter reject/filter validation before sending API requests.

### 2026-05-04 (UTC+5) - Admin Step 5: protected layout + sign-in + stats
- Added `frontend-admin/components/admin/admin-protected-layout.jsx` and wrapped protected pages (`frontend-admin/app/page.js`, `frontend-admin/app/users/page.js`, `frontend-admin/app/audit-logs/page.js`, `frontend-admin/app/events/[id]/page.js`) so admin gating (`GET /auth/me`) and nav/sign-out (`POST /auth/logout`) are shared in one place.
- Added `frontend-admin/components/admin/admin-sign-in-screen.jsx` and `frontend-admin/app/sign-in/page.js` for dedicated admin login via `POST /auth/login`, with non-admin rejection flow.
- Updated admin screens to remove duplicated per-page auth/nav boilerplate and updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx` stats cards to include total events, pending events, and total users by aggregating existing API totals.

### 2026-05-04 (UTC+5) - Admin Step 4: audit logs screen
- Added `frontend-admin/app/audit-logs/page.js` and `frontend-admin/components/admin/admin-audit-logs-screen.jsx` with admin guard, filter form (`actorUserId`, `targetType`, `targetId`), paginated `GET /admin/audit-logs`, and JSON `meta` rendering per log row.
- Added audit navigation links in `frontend-admin/components/admin/admin-moderation-dashboard.jsx`, `frontend-admin/components/admin/admin-event-review-screen.jsx`, and `frontend-admin/components/admin/admin-users-screen.jsx`.

### 2026-05-04 (UTC+5) - Admin Step 3: users management screen
- Added `frontend-admin/app/users/page.js` and `frontend-admin/components/admin/admin-users-screen.jsx` with admin guard, paginated `GET /admin/users`, and user actions wired to `PATCH /admin/users/:id/promote`, `PATCH /admin/users/:id/deactivate`, and `DELETE /admin/users/:id`.
- Added navigation links between admin queue/review/users screens via updates in `frontend-admin/components/admin/admin-moderation-dashboard.jsx` and `frontend-admin/components/admin/admin-event-review-screen.jsx`.

### 2026-05-04 (UTC+5) - Admin Step 2: event review screen
- Added `frontend-admin/app/events/[id]/page.js` and `frontend-admin/components/admin/admin-event-review-screen.jsx` for moderation review with admin guard, `GET /events/:id` event context, and approve/reject actions (`PATCH /admin/events/:id/approve`, `PATCH /admin/events/:id/reject`).
- Updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx` to include a per-row **Review** link into the new route.

### 2026-05-04 (UTC+5) - Admin Step 1: guard + pending queue
- Added `frontend-admin/lib/config.js` and `frontend-admin/lib/api-client.js` for cookie-based API calls (`credentials: include`) with network-safe error shape.
- Replaced `frontend-admin/app/page.js` placeholder with `frontend-admin/components/admin/admin-moderation-dashboard.jsx` and updated `frontend-admin/app/layout.js` metadata.
- Implemented admin guard flow (`GET /auth/me`) and pending moderation screen (`GET /admin/events/pending` with pagination), including inline approve/reject actions wired to `PATCH /admin/events/:id/approve` and `PATCH /admin/events/:id/reject`.

### 2026-05-04 (UTC+5) - User event edit/detail polish
- `frontend-user/components/events/event-edit-screen.jsx`: unsaved-change detection vs loaded snapshot, `beforeunload` + confirm on leave links, inline “unsaved changes” hint, stricter delete flow for `APPROVED` events (second confirm + type `DELETE`), redirect to detail with `?updated=1` after save; address pick sets `providerPlaceId` from OSM id or LocationIQ place id.
- `frontend-user/components/events/event-detail-screen.jsx`: dismissible “Changes saved” banner when `updated=1` query is present; strips query via `router.replace`.

### 2026-05-04 (UTC+5) - User events edit screen added
- Added `frontend-user/app/events/[id]/edit/page.js` + `frontend-user/components/events/event-edit-screen.jsx` with owner/admin guard (`GET /auth/me` + `GET /events/:id`), prefilled edit form, map/location search, optional image replacement upload (`POST /uploads/event-image`), update action (`PATCH /events/:id`), and delete action (`DELETE /events/:id`).
- Updated `frontend-user/components/events/event-detail-screen.jsx` to show Edit action for owner/admin and keep detail map read-only.
- Updated `frontend-user/components/dashboard/my-events-dashboard.jsx` cards to expose both View and Edit actions.

### 2026-05-04 (UTC+5) - User dashboard: My events + create placeholder
- Added `app/my-events/page.js` + `components/dashboard/my-events-dashboard.jsx`: client gate via `GET /auth/me`; guests see sign-in guidance; signed-in users load `GET /events/my/list` with status badges (pending / approved / rejected), rejection reason, links to `/events/:id`, and **Create event** CTA to `/events/new`.
- Added `app/events/new/page.js` placeholder (next step: full create form) with nav back to My events / discover.
- Extracted `lib/format-event.js` (`formatEventRange`) and reused from `event-discovery.jsx`.
- Updated `site-header.jsx` nav (My events when logged in, Create event → `/events/new`), `user-menu.jsx` (My events item), `hero-section.jsx` (Host an event → `/events/new`).

### 2026-05-04 (UTC+5) - User routes: verify email + reset password
- Added `app/verify-email/page.js` + `verify-email-inner.jsx` (Suspense + `useSearchParams`) and `components/auth/verify-email-client.jsx` calling `POST /auth/verify-email/confirm` (manual **Verify my email** button to avoid double-submit in Strict Mode).
- Added `app/reset-password/page.js` + `reset-password-inner.jsx` and `components/auth/reset-password-client.jsx` with Zod-matched password + confirm, calling `POST /auth/reset-password`.
- Both screens use shadcn Card/Alert/Button/Input/Label and match minimalist Maqaam styling; `npm run lint` / `npm run build` pass.

### 2026-05-04 (UTC+5) - User app auth (register, login, forgot, verify resend)
- Added `zod`, shadcn `alert`, and `dropdown-menu` in `frontend-user/`.
- New `lib/api-client.js`: `apiJson` helper with `credentials: "include"`.
- New `components/auth/sign-in-dialog.jsx`: wired `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/verify-email/request`; client Zod validation; success state after register; unverified-login flow with resend; forgot-password sub-flow; `DialogTrigger` styled with `buttonVariants` (no nested `<button>`).
- New `components/auth/user-menu.jsx`: `GET /auth/me`-driven header state, `POST /auth/logout`, account dropdown.
- Updated `components/home/site-header.jsx`: session probe on load (`setTimeout` deferral for ESLint `set-state-in-effect`), `SignInDialog` / `UserMenu` swap.
- `npm run lint` and `npm run build` pass for `frontend-user`.

### 2026-05-04 (UTC+5) - User homepage (Maqaam) with shadcn + Tailwind
- Initialized shadcn/ui (Base UI) in `frontend-user/` and added `button`, `card`, `input`, `badge`, `dialog`, `tabs`, `separator`, `label`.
- Theming in `frontend-user/app/globals.css`: warm paper background, emerald primary, fixed `--font-sans` mapping to Geist.
- Added `lib/config.js`, `lib/public-api.js` (`getPublicEvents` with try/catch for offline builds), `next.config.mjs` Cloudinary `images.remotePatterns`.
- New home sections: `components/home/site-header.jsx` (nav + auth modal shell), `hero-section.jsx` + `hero-geometry.jsx`, `event-discovery.jsx` (search, filter dialog, cards, load more, `GET /events` + `GET /categories`), `site-footer.jsx`.
- Updated `app/layout.js` (Geist + Amiri for Arabic tagline), `app/page.js`, placeholder `app/events/[id]/page.js`.
- Root `.gitignore` already ignores agent tooling; homepage builds without API at build time.

### 2026-04-30 (UTC+5) - Backend inline comments refined
- Added concise, high-signal inline comments in `backend/src/routes/auth.routes.js`, `backend/src/routes/events.routes.js`, and `backend/src/routes/uploads.routes.js` to clarify session rotation, optional auth visibility rules, moderation reset behavior, and image attachment/primary-image side effects.

### 2026-04-30 (UTC+5) - Frontend styling stack decision documented

### 2026-04-30 (UTC+5) - Frontend event listing strategy updated

### 2026-04-30 (UTC+5) - Postman testing artifacts added
- Added Postman collection with ready-to-import API requests/variables for health, auth, category, event, and admin pagination flows.

### 2026-04-30 (UTC+5) - Admin list pagination added
- Updated `backend/src/routes/admin.routes.js` to add `page`/`limit` query validation and paginated responses (`data.pagination`) for `GET /api/admin/events/pending` and `GET /api/admin/users`.

### 2026-04-29 (UTC+5) - Smoke test synced with auth changes
- Updated ackend/scripts/smoke-test.js for phoneNumber register payloads, login/session checks, resilient cookie capture, and fallback user seeding when email sending is blocked in test mode.
- Re-ran smoke test successfully for core auth/admin/events flow; register currently returns EMAIL_SEND_FAILED due Resend test-recipient restriction.

### 2026-04-29 (UTC+5) - Frontend forms contract added

### 2026-04-29 (UTC+5) - Root security log added

### 2026-04-29 (UTC+5) - API contract updated for frontend auth/uploads

### 2026-04-29 (UTC+5) - Upload size limit reduced
- Updated `backend/src/routes/uploads.routes.js` multer `fileSize` limit from 5MB to 2MB for `POST /api/uploads/event-image`.

### 2026-04-29 (UTC+5) - Auth register phone number support
- Added `User.phoneNumber` (unique, nullable for backward compatibility) in `backend/prisma/schema.prisma` and migration `backend/prisma/migrations/20260429101700_add_user_phone_number/migration.sql`.
- Updated `backend/src/routes/auth.routes.js` register validation/storage to require E.164 `phoneNumber`, include it in sanitized user payload, and return `409` for duplicate phone numbers.
- Updated `backend/src/middleware/auth.middleware.js` to include `phoneNumber` in authenticated user selection.

### 2026-04-29 (UTC+5) - API routes manifest
- Added [`backend/src/routes/api-endpoints.js`](backend/src/routes/api-endpoints.js): exports `API_ENDPOINTS` (`method`, `path`, `group`) for all `/api` routes; cross-link comment in [`backend/src/routes/index.js`](backend/src/routes/index.js).

### 2026-04-28 (UTC+5) - Resend env placeholders added
- Added Resend and email-flow configuration placeholders in `backend/.env`:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `FRONTEND_USER_BASE_URL`
  - `EMAIL_VERIFY_TOKEN_TTL_MINUTES`
  - `PASSWORD_RESET_TOKEN_TTL_MINUTES`

### 2026-04-28 (UTC+5) - Resend email verification + forgot password flows implemented
- Added Prisma auth-email lifecycle schema updates in `backend/prisma/schema.prisma`:
  - `User.isEmailVerified`, `User.emailVerifiedAt`
  - `VerificationToken` and `PasswordResetToken` models
- Created and applied migration:
  - `backend/prisma/migrations/20260428092227_auth_email_verification_and_reset/migration.sql`
- Installed Resend SDK and added email service:
  - `backend/src/services/email.service.js`
  - uses `Resend` from `resend`, env key `RESEND_API_KEY`, `{ data, error }` handling, idempotency keys
- Added secure token helper:
  - `backend/src/utils/token.js` (`generateTokenPair`, `hashRawToken`)
- Extended auth routes in `backend/src/routes/auth.routes.js`:
  - strict login block for unverified users (`403`)
  - `POST /api/auth/verify-email/request`
  - `POST /api/auth/verify-email/confirm`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - register now issues verification token + verification email
  - reset password revokes existing sessions
- Expanded rate limiting:
  - new `emailActionRateLimiter` in `backend/src/middleware/rate-limit.middleware.js`
  - applied to verify/forgot/reset email flows
- Updated env/config surfaces:
  - `backend/.env.example` (Resend + email-link config vars)
  - `backend/src/config/env.js` exports for frontend URL + token TTLs
- Extended auth middleware user selection in `backend/src/middleware/auth.middleware.js` to include email verification fields.

### 2026-04-28 (UTC+5) - Smoke test env-path fix
- Updated `backend/scripts/smoke-test.js` to explicitly load `backend/.env` via absolute path from script directory.
- This allows running the smoke script from project root (`node backend/scripts/smoke-test.js`) without missing env variables.

### 2026-04-28 (UTC+5) - Backend smoke test flow added and executed
- Added `backend/scripts/smoke-test.js` to run an end-to-end API smoke test sequence:
  - health check
  - user/admin registration
  - admin promotion (DB update)
  - category creation
  - event creation
  - admin pending list + approve
  - public events fetch
- Executed the script successfully with all checks passing.

### 2026-04-28 (UTC+5) - Frontend-integration gap fixes applied
- Created and applied initial Prisma migration:
  - `backend/prisma/migrations/20260428071532_init/migration.sql`
  - Database is now managed by Prisma Migrate and in sync with schema.
- Fixed `POST /api/auth/refresh` error handling in `backend/src/routes/auth.routes.js` so non-auth server errors are no longer masked as `401`.
- Fixed partial event updates in `backend/src/routes/events.routes.js` by validating merged `startDate` / `endDate` values before saving.
- Fixed upload flow in `backend/src/routes/uploads.routes.js` to validate and authorize `eventId` before uploading to Cloudinary.
- Improved cookie behavior in `backend/src/utils/auth.js`:
  - omit `domain` for `localhost`
  - use `SameSite=None` automatically when `COOKIE_SECURE=true`, otherwise `lax`
- Added basic rate limiting:
  - new `backend/src/middleware/rate-limit.middleware.js`
  - applied auth limiter to `register`, `login`, `refresh`, `logout`
  - applied upload limiter to `POST /api/uploads/event-image`

### 2026-04-28 (UTC+5) - Upload API implemented
- Added `backend/src/routes/uploads.routes.js` with `POST /api/uploads/event-image`.
- Integrated `multer` memory upload, image-only validation, 5MB limit, and Cloudinary upload.
- Wired upload routes in `backend/src/routes/index.js` (`/api/uploads`).
- Extended upload endpoint with optional `eventId` attachment flow:
  - Validates `eventId` (UUID), enforces owner/admin access, creates `EventImage` row, and auto-sets `Event.imageUrl` when empty.
- Added event image management in `backend/src/routes/events.routes.js`:
  - `GET /api/events/:id/images` (public for approved events; owner/admin for non-approved)
  - `DELETE /api/events/:id/images/:imageId` (owner/admin)
  - On delete: removes DB record, attempts Cloudinary cleanup by `publicId`, and refreshes event primary `imageUrl`.
- Added lightweight audit logging support:
  - New helper `backend/src/utils/audit.js` for safe non-blocking `AuditLog` writes.
  - Integrated audit writes in auth routes (`register`, `login`, `logout`), event routes (`create`, `update`, `soft delete`, `image delete`), and admin routes (`approve/reject`, `promote/deactivate/delete user`).
- Added `GET /api/admin/audit-logs` in `backend/src/routes/admin.routes.js` with filters:
  - `actorUserId`
  - `targetType`
  - `targetId`
  - `page`
  - `limit`
  and pagination metadata in the response.

### 2026-04-28 (UTC+5) - Admin APIs implemented (moderation + user management)
- Added `backend/src/routes/admin.routes.js`:
  - `GET /api/admin/events/pending`
  - `PATCH /api/admin/events/:id/approve`
  - `PATCH /api/admin/events/:id/reject`
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/:id/promote`
  - `PATCH /api/admin/users/:id/deactivate`
  - `DELETE /api/admin/users/:id`
- Applied admin protection globally on admin routes via `requireAuth` + `requireAdmin`.
- Wired admin routes in `backend/src/routes/index.js` (`/api/admin`).

### 2026-04-28 (UTC+5) - Event table API implemented
- Added `backend/src/routes/events.routes.js` with:
  - `GET /api/events` (public; approved-only by default, admin status filtering via optional auth)
  - `GET /api/events/:id` (approved for public; owner/admin can view non-approved)
  - `POST /api/events` (auth; creates `PENDING` events)
  - `PATCH /api/events/:id` (owner/admin; owner updates reset status to `PENDING`)
  - `DELETE /api/events/:id` (owner/admin soft delete via `deletedAt`)
  - `GET /api/events/my/list` (auth user’s own events)
- Added validation and pagination/query filtering for list endpoint.
- Wired event routes in `backend/src/routes/index.js`.

### 2026-04-28 (UTC+5) - Category table API started
- Implemented `Category` routes in `backend/src/routes/categories.routes.js`:
  - `GET /api/categories` (public)
  - `POST /api/categories` (auth + admin)
- Added request validation via Zod and conflict handling (`409`) for duplicate `name`/`slug`.
- Wired category routes in `backend/src/routes/index.js`.

### 2026-04-28 (UTC+5) - MapTiler key placeholders updated
- Updated `NEXT_PUBLIC_MAPTILER_API_KEY` default value in:
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`
- Set default key to the provided MapTiler key for faster local setup.

### 2026-04-28 (UTC+5) - DATABASE_URL encoding fix
- Updated `backend/.env` `DATABASE_URL` to URL-encoded password format for Supabase Session Pooler connectivity.

### 2026-04-28 (UTC+5) - Auth API MVP implemented
- Switched Prisma generator to `prisma-client-js` in `backend/prisma/schema.prisma` and regenerated client for CommonJS backend compatibility.
- Added Prisma Postgres adapter runtime (`@prisma/adapter-pg` + `pg`) and wired it in `backend/src/lib/prisma.js` for Prisma v7 engine compatibility.
- Added auth infrastructure:
  - `backend/src/lib/prisma.js`
  - `backend/src/utils/auth.js`
  - `backend/src/middleware/auth.middleware.js`
- Implemented `backend/src/routes/auth.routes.js`:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Wired auth router in `backend/src/routes/index.js` and extended API error payload with optional validation details in `backend/src/app.js`.

### 2026-04-28 (UTC+5) - Mapping stack: Leaflet / MapTiler / LocationIQ
- Dropped Google Maps server env from backend templates; geocoding is client-side via LocationIQ or Geoapify.
- Renamed `Event.googlePlaceId` → `providerPlaceId` in `backend/prisma/schema.prisma`; event API payload updated in API contract.
- Documented Leaflet + react-leaflet mapping stack and Phase 2.2 grid/search notes.
- Updated env examples in backend and both frontends; removed `GOOGLE_MAPS_SERVER_API_KEY` from backend env.
- Aligned delivery phases and product blueprint with the new mapping stack.

### 2026-04-27 16:47 (UTC+5) - Logging policy enabled

### 2026-04-27 16:41 (UTC+5) - Phase 0 setup completed
- Created project folders: `backend`, `frontend-user`, `frontend-admin`, `docs`.
- Added env templates:
  - `backend/.env.example`
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`

### 2026-04-27 16:52 (UTC+5) - Phase 1 started (backend bootstrap)
- Initialized backend npm project and installed core dependencies.
- Added scripts in `backend/package.json` for dev/start/Prisma commands.
- Initialized Prisma and created first schema models/enums:
  - `User`, `Category`, `Event`, `EventImage`, `AuthSession`, `AuditLog`
  - `Role`, `EventStatus`
- Scaffolded minimal Express structure:
  - `backend/src/server.js`
  - `backend/src/app.js`
  - `backend/src/config/env.js`
  - `backend/src/routes/index.js`
  - `backend/src/routes/health.routes.js`
- Updated `backend/.env` for local MVP defaults.
- Fixed Prisma v7 datasource config issue and generated Prisma client successfully.

### 2026-04-27 17:13 (UTC+5) - Frontend setup completed first
- Scaffolded `frontend-user` with Next.js (App Router + Tailwind + ESLint).
- Scaffolded `frontend-admin` with Next.js (App Router + Tailwind + ESLint).
- Added env templates:
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`
- Replaced default starter pages with simple project-ready placeholders:
  - `frontend-user/app/page.js`
  - `frontend-admin/app/page.js`


<!-- DEVLOG_END -->

---

*End of Maqaam project documentation.*