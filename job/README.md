# JobDozo — Fully Synchronized Multi-Role Job Platform

A complete job marketplace ecosystem where **4 connected pages share one backend, one database, one auth system, and real-time WebSocket sync**.

| Page | Role | Purpose |
|---|---|---|
| `index.html` | Public / Job Seeker | Job marketplace — search, filter, apply, save (Amazon-style cards) |
| `seeker.html` | Job Seeker | Application tracker, statuses, recommendations, profile completion |
| `employer.html` | Employer | Post jobs (4-step wizard), manage jobs & applicants, update statuses |
| `admin.html` | Admin | Platform stats, job moderation, user management, activity log |

## Quick Start

```bash
npm install
npm start
```

Then open **http://localhost:8123**

The database auto-seeds on first run (16 jobs, demo users, applications).

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Job Seeker | `rahul@gmail.com` | `rahul123` |
| Employer | `hr@techcorp.in` | `employer123` |
| Admin | `admin@JobDozo.in` | `admin123` |

Every login screen also has one-click demo buttons. New seekers/employers can sign up.

## The Live Workflow (real-time, no refresh)

1. **Employer** posts a job → it **instantly appears** on `index.html` for everyone (Socket.IO broadcast).
2. **Seeker** applies on `index.html` → application **instantly appears** in the employer's Applicants panel + notification.
3. **Employer** changes status (Applied → Viewed → Shortlisted → Interview → Selected / Rejected) → the **seeker dashboard updates live** with a toast + notification.
4. **Admin** sees stats, new jobs, and activity log update live; can approve/suspend/delete any job → it disappears from the live site instantly.

## Architecture

```
Browser (4 pages, shared js/api.js + Socket.IO client)
        │  REST (JWT Bearer)        │  WebSocket events
        ▼                           ▼
Express REST API  ◄──────────►  Socket.IO (rooms: user:<id>, role:<role>)
        │
   Data store (single centralized DB)
   └─ embedded JSON document store (server/data/db.json, zero setup)
      Mongo-style collection API — swappable for MongoDB via MONGODB_URI
```

### Backend (`server/`)
- `index.js` — Express + Socket.IO + static frontend hosting
- `routes.js` — REST API (auth, jobs, applications, saved, notifications, admin)
- `auth.js` — JWT sign/verify + role-based access middleware
- `store.js` — centralized data store (file-persisted)
- `seed.js` — demo data

### Real-time events
`job:created` `job:updated` `job:removed` `application:created` `application:status` `application:withdrawn` `notification:new` `activity:new` `stats:update`

### Key API endpoints
```
POST /api/auth/register | POST /api/auth/login | GET /api/auth/me
GET  /api/jobs | POST /api/jobs | PATCH /api/jobs/:id | DELETE /api/jobs/:id | GET /api/jobs/mine
POST /api/applications | GET /api/applications/mine | GET /api/applications/received
PATCH /api/applications/:id/status | DELETE /api/applications/:id
GET/POST /api/saved/:jobId | GET/POST /api/notifications(/read-all)
GET /api/admin/stats | /api/admin/jobs | /api/admin/users | /api/admin/activity
```

## Features
- **JWT authentication** with role-based access (admin / employer / seeker), login + signup overlay shared by all pages
- **Role-gated dashboards** — wrong role is redirected to its own panel
- **6-stage application pipeline**: Applied → Viewed → Shortlisted → Interview → Selected / Rejected
- **Notifications synced** across pages (badge + dropdown, live via sockets)
- **Activity logging** streamed to the admin panel
- **Dark / light mode** toggle (bottom-left, persisted) on every page
- **Responsive UI**, shared design system, toasts, modals

## Deployment

```bash
docker compose up --build
```
Runs the Node app, MongoDB (optional storage backend), and **Nginx** reverse proxy (port 80) with WebSocket upgrade configured. CI pipeline in `.github/workflows/ci.yml` (syntax check, API smoke test, Docker build).

> Storage note: the demo runs on the embedded JSON store for zero-setup. The store exposes a Mongo-style API so it can be swapped to MongoDB/Mongoose (`MONGODB_URI`) without changing route code. Resume/logo media storage hooks for Cloudinary/S3 are stubbed in `.env.example`.
