# Backend Postman Testing Checklist

Use collection file: `backend/postman_collection_mems_backend.json`

## Setup

- [ ] Import collection JSON into Postman.
- [ ] Confirm backend is running at `http://localhost:5000`.
- [ ] Keep one Postman session so cookie auth works automatically.
- [ ] If register returns `EMAIL_SEND_FAILED`, use existing verified users or verify users in DB for local testing.

## Core API flow

- [ ] ✔ `GET /api/health` returns `200`.
- [ ] ✔ `POST /api/auth/register` (user) tested.
- [ ] ✔ `POST /api/auth/register` (admin) tested.
- [ ] ✔ `POST /api/auth/login` (user) returns `200`.
- [ ] ✔ `POST /api/auth/login` (admin) returns `200`.
- [ ] ✔ `POST /api/categories` (admin) returns `201` and sets `categoryId`.
- [ ] ✔ `POST /api/events` (user) returns `201` and sets `eventId`.
- [ ] ✔ `GET /api/admin/events/pending?page=1&limit=20` returns `200` with `pagination`.
- [ ] ✔ `PATCH /api/admin/events/{{eventId}}/approve` returns `200`.
- [ ] ✔ `GET /api/events?page=1&limit=12` returns approved event list.
- [ ] ✔ `GET /api/admin/users?page=1&limit=20` returns `200` with `pagination`.

## Optional checks

- [ ] `POST /api/auth/refresh` works with cookies.
- [ ] `POST /api/auth/logout` clears auth cookies.
- [ ] `GET /api/auth/me` returns current authenticated user.
