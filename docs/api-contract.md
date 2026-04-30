# API Contract (Phase 0 - Fast MVP)

Base URL: `/api`

## Response Shape

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

## Auth and Cookies

- Access token: HTTP-only cookie, short expiry (recommended 15m).
- Refresh token: HTTP-only cookie, longer expiry (recommended 7d).
- Protected routes require valid access token.

## Auth Routes

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

## Category Routes

- `GET /categories`
- `POST /categories` (admin only)
  - body: `{ "name": "Community", "slug": "community" }`

## Event Routes

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

### Event Create/Update Payload

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

- `providerPlaceId`: optional stable id returned by the client geocoder (e.g. LocationIQ or Geoapify). Maps and tiles are not Google-powered; see [docs/mapping.md](mapping.md).

## Moderation Routes (Admin)

- `GET /admin/events/pending`
  - query:
    - `page` (default 1)
    - `limit` (default 20, max 100)
  - response includes `data.pagination` with `page`, `limit`, `total`, `totalPages`
- `PATCH /admin/events/:id/approve`
  - body: `{}`
- `PATCH /admin/events/:id/reject`
  - body: `{ "rejectionReason": "Insufficient details" }`

## User Management Routes (Admin)

- `GET /admin/users`
  - query:
    - `page` (default 1)
    - `limit` (default 20, max 100)
  - response includes `data.pagination` with `page`, `limit`, `total`, `totalPages`
- `PATCH /admin/users/:id/promote`
- `PATCH /admin/users/:id/deactivate`
- `DELETE /admin/users/:id` (if needed; use cautiously)

## Upload Route

- `POST /uploads/event-image` (auth user)
  - accepts image file upload only (`image/*`)
  - max file size: 2MB
  - returns Cloudinary URL/publicId

## HTTP Status Guidelines

- `200` OK
- `201` Created
- `400` Bad request / validation
- `401` Unauthenticated
- `403` Forbidden
- `404` Not found
- `409` Conflict (email, phone number, or category slug already exists)
- `500` Internal server error
