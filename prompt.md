# Blueprint: Minimalist Event Management System (MEMS)

## 1. Project Architecture & Structure
The project is divided into three main directories to maintain a clean separation of concerns.

**Root Directory:** `/event-app-root`
- `/backend`: Node.js/Express API (Shared source of truth).
- `/frontend-user`: Next.js (Client-facing site + Contributor Dashboard).
- `/frontend-admin`: Next.js (Internal Admin Management).

---

## 2. Technical Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide React (Icons), Framer Motion (Animations).
- **Backend:** Node.js, Express.js.
- **ORM/Database:** Prisma with PostgreSQL (hosted on Supabase or Neon).
- **Authentication:** JWT (JSON Web Tokens) stored in HTTP-only cookies.
- **Image Handling:** Cloudinary API (for event image uploads).
- **Maps & geocoding:** Leaflet + react-leaflet; MapTiler (free tier) or OSM tiles; LocationIQ or Geoapify for autocomplete and address-to-coordinates (see `docs/mapping.md`).

---

## 3. Database Blueprint (PostgreSQL + Prisma)

### Core Principles
- Keep `backend` as the only source of truth for auth, roles, and moderation.
- Use explicit relational fields over generic JSON for critical data.
- Support auditability for admin actions and moderation decisions.
- Prefer soft-delete for business entities to preserve history.

### Enums
- `Role`: `USER`, `ADMIN`
- `EventStatus`: `PENDING`, `APPROVED`, `REJECTED`

### Users Table
- `id`: UUID (Primary Key)
- `email`: String (Unique, Indexed)
- `passwordHash`: String (Hashed)
- `name`: String
- `role`: Enum (`USER`, `ADMIN`) — Default: `USER`
- `isActive`: Boolean — Default: `true`
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Categories Table
- `id`: UUID (Primary Key)
- `name`: String (Unique)
- `slug`: String (Unique, Indexed)
- `createdAt`: DateTime

### Events Table
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> `users.id`)
- `categoryId`: UUID (Foreign Key -> `categories.id`, Nullable if category not selected)
- `title`: String (Recommended max length: 160)
- `description`: Text
- `imageUrl`: String (Primary banner image)
- `addressLine`: String
- `formattedAddress`: String
- `providerPlaceId`: String (optional; id from geocoder when available)
- `latitude`: Decimal(9,6)
- `longitude`: Decimal(9,6)
- `startDate`: DateTime
- `endDate`: DateTime
- `status`: Enum (`PENDING`, `APPROVED`, `REJECTED`) — Default: `PENDING`
- `rejectionReason`: Text (Nullable)
- `approvedBy`: UUID (Foreign Key -> `users.id`, Nullable)
- `approvedAt`: DateTime (Nullable)
- `rejectedBy`: UUID (Foreign Key -> `users.id`, Nullable)
- `rejectedAt`: DateTime (Nullable)
- `deletedAt`: DateTime (Nullable, soft delete)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### EventImages Table (Optional, Recommended for scalability)
- `id`: UUID (Primary Key)
- `eventId`: UUID (Foreign Key -> `events.id`)
- `url`: String
- `publicId`: String (Cloudinary public identifier)
- `sortOrder`: Int — Default: `0`
- `createdAt`: DateTime

### AuthSessions Table (Recommended for secure refresh token lifecycle)
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> `users.id`)
- `refreshTokenHash`: String
- `userAgent`: String (Nullable)
- `ipAddress`: String (Nullable)
- `expiresAt`: DateTime
- `revokedAt`: DateTime (Nullable)
- `createdAt`: DateTime

### AuditLogs Table (Optional, Recommended for admin accountability)
- `id`: UUID (Primary Key)
- `actorUserId`: UUID (Foreign Key -> `users.id`)
- `action`: String (Examples: `EVENT_APPROVED`, `EVENT_REJECTED`, `USER_PROMOTED`, `USER_DEACTIVATED`)
- `targetType`: String (Examples: `EVENT`, `USER`)
- `targetId`: UUID
- `meta`: JSON
- `createdAt`: DateTime

### Recommended Indexes
- `users(email)` unique
- `users(role)`
- `events(status, startDate)`
- `events(userId)`
- `events(categoryId)`
- `events(createdAt)`
- `events(latitude, longitude)`
- `auth_sessions(userId)`
- `auth_sessions(expiresAt)`
- `audit_logs(actorUserId)`
- `audit_logs(targetType, targetId)`

### Recommended Constraints / Validation Rules
- `endDate >= startDate`
- `latitude` in range `[-90, 90]`
- `longitude` in range `[-180, 180]`
- `email` uniqueness case-insensitive
- Reject event creation/update if required fields are empty or malformed

---

## 4. Frontend Specifications (User Side)

### Design Language (Inspiration Only)
- Use the provided reference screenshot only as **visual inspiration**, not as a direct copy.
- **Core style:** Simple, minimalist, and clean with high whitespace and clear visual hierarchy.
- **Typography:** Clean sans-serif (Inter or Geist). Keep font weights limited and consistent.
- **Color system:** Neutral base (white, slate/gray) with one primary accent color used sparingly for CTAs and highlights.
- **Surfaces:** Soft cards, subtle borders (`border-slate-100` / `border-slate-200`), light shadows, and generous border radius (`rounded-xl` or `rounded-2xl`).
- **Layout rhythm:** Consistent spacing scale, roomy sections, and readable content width.
- **Navigation:** Minimal top navbar with concise links and one primary action button.
- **Motion:** Subtle transitions only (hover, focus, micro-interactions); avoid heavy animation.

### Key Features
1. **Unified Auth Modal:**
   - No separate pages for login/signup.
   - A single modal with tabs for "Login" and "Register".
   - Triggered by "Sign In" button or when attempting to "Create Event".
2. **Hero & Search:**
   - Bold headline: "Discover & Create Local Events."
   - Search bar with a "Filter" icon that opens a small pop-up (Date, Category, Location).
3. **Event Listing:**
   - Responsive grid of cards.
   - Cards display: Image (top), Title (bold), Date/Location (muted text).
4. **User Dashboard (Private):**
   - Access only after login.
   - **View:** "My Events" list with a status badge (Yellow for Pending, Green for Approved).
   - **Action:** "Create New Event" button.
5. **Event Creation Form:**
   - Inputs: Title, Description (Rich text), Image Upload (Drag & Drop), Address, Date/Time Picker.
   - **Maps:** LocationIQ (or Geoapify) for address search; Leaflet map preview + marker; prefer static thumbnails or pin icons on the event grid to limit tile/API usage.
   - Save both `formattedAddress` and `latitude/longitude` when submitting event details.

---

## 5. Frontend Specifications (Admin Side)

### Admin Dashboard Features
- **Separate Login:** A clean, minimal login screen strictly for Admin credentials.
- **User Management:** Table view of all users with "Delete" or "Promote" actions.
- **Approval System:**
   - A dedicated tab for "Unapproved Events".
   - Clicking an event opens a preview.
   - Buttons: **[Approve]** (Updates status to APPROVED) or **[Reject]** (Deletes or marks REJECTED).
   - Approval/rejection actions should store actor and timestamp (`approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`).
- **Global Stats:** Simple cards showing Total Events, Pending Approvals, and Total Users.
- **Admin UI Language:** Keep admin interface aligned with the same minimalist system (neutral palette, clear spacing, subtle borders, low visual noise).

---

## 6. Implementation Phases

### Phase 1: Backend & Database
- Initialize Node.js app.
- Setup Prisma schema and connect PostgreSQL.
- Build Auth routes (JWT logic) and Event CRUD routes.
- Implement middleware for `isAdmin` and `isAuth`.
- Add secure session handling (refresh token rotation/session store) and role-based API guards.
- Add DB indexes and constraints for status/date/location filtering.

### Phase 2: User Frontend (Foundation)
- Setup Next.js with Tailwind.
- Build the Navbar and Hero section.
- Implement the Auth Modal logic.
- Connect to GET `/events` to display the grid.
- Add search + filter UI for Date, Category, and Location.

### Phase 3: Event Submission & Dashboard
- Build the "Create Event" form with image upload to Cloudinary.
- Build the User Dashboard to track pending approvals.
- Integrate Leaflet + geocoder (LocationIQ or Geoapify) in event submission flow.

### Phase 4: Admin Frontend
- Create the separate Admin Next.js app.
- Build the Approval Queue and User Management tables.
- Implement moderation audit visibility for admin actions.

---

## 7. Instructions for AI (Cursor)
- Use **Functional Components** and **Tailwind CSS** for all styling.
- Ensure the **Search Bar** filters results in real-time or on "Enter".
- Maintain a **Minimalist** look: use thin borders (`border-slate-100`) and subtle transitions.
- Treat any visual references as **inspiration only**; do not replicate layouts/assets 1:1.
- All forms must have validation (e.g., Zod or simple state checks).
- Enforce authorization and role checks in backend APIs (never trust frontend-only checks).
- Protect secrets and API keys; use environment variables and provider dashboard restrictions (MapTiler, LocationIQ/Geoapify, Cloudinary).