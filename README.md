# 💰 Financial Dashboard
A full-stack financial management platform built as an internship project. It provides a secure, role-based dashboard for tracking income, expenses, and financial trends — powered by a **Next.js** frontend and an **Express + Prisma** backend.
---
## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [User Roles & Permissions](#user-roles--permissions)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
---
## Overview
Financial Dashboard is a monorepo application split into two workspaces:
| Workspace  | Technology              | Purpose                                    |
|------------|-------------------------|--------------------------------------------|
| `frontend` | Next.js 16, React 19    | Dashboard UI, authentication pages         |
| `backend`  | Express 5, Prisma 7     | REST API, session management, data storage |
The backend exposes a REST API secured with cookie/token-based sessions (via **Better Auth**). The frontend consumes this API and renders an interactive dashboard with summary cards, monthly trend charts, and paginated financial records.
---
## Tech Stack
### Frontend
- **[Next.js 16](https://nextjs.org/)** — React framework with App Router
- **[React 19](https://react.dev/)** — UI library
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[Better Auth](https://www.better-auth.com/)** — Client-side session handling
- **TypeScript**
### Backend
- **[Express 5](https://expressjs.com/)** — HTTP server
- **[Prisma 7](https://www.prisma.io/)** — ORM with PostgreSQL adapter
- **[Better Auth](https://www.better-auth.com/)** — Authentication & session management
- **[Zod 4](https://zod.dev/)** — Request validation
- **[express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)** — Rate limiting
- **PostgreSQL** — Relational database
- **TypeScript**
---
## Project Structure
```
financial-dashboard/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema & models
│   │   └── migrations/            # Prisma migration files
│   ├── src/
│   │   ├── app.ts                 # Express app setup (CORS, routes)
│   │   ├── server.ts              # Server entry point
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── records.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── lib/
│   │   │   ├── auth.ts            # Better Auth configuration
│   │   │   └── prisma.ts          # Prisma client singleton
│   │   ├── middlewares/
│   │   │   ├── authmiddleware.ts  # Session validation
│   │   │   ├── authorizemiddleware.ts # Role-based access control
│   │   │   ├── ratelimit.ts       # Rate limiters
│   │   │   └── validation.ts      # Zod request validation
│   │   ├── routes/
│   │   │   ├── admin.routes.ts    # Admin user management
│   │   │   ├── analytics.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── records.routes.ts  # Financial records CRUD
│   │   │   └── users.routes.ts    # User creation
│   │   └── validators/
│   │       └── schemas.ts         # Zod validation schemas
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── auth/page.tsx          # Login & signup page
    │   ├── dashboard/page.tsx     # Main dashboard page
    │   ├── layout.tsx             # Root layout
    │   └── globals.css            # Global styles
    ├── components/
    │   └── dashboard/
    │       ├── AdminPanels.tsx    # Record & user creation forms
    │       ├── ControlPanel.tsx   # Top toolbar (refresh, logout)
    │       ├── RecordsSection.tsx # Paginated records table
    │       ├── SummaryGrid.tsx    # KPI summary cards
    │       └── TrendsSection.tsx  # Monthly income/expense chart
    ├── lib/
    │   ├── auth/
    │   │   ├── api.ts             # Sign-in / sign-up API calls
    │   │   ├── client.ts          # Better Auth client
    │   │   ├── session.ts         # Session storage helpers
    │   │   └── types.ts
    │   └── dashboard/
    │       ├── api.ts             # Dashboard & records API calls
    │       └── types.ts           # Shared TypeScript types
    ├── package.json
    └── tsconfig.json
```
---
## Features
- **Authentication** — Email & password sign-in / sign-up with secure session tokens
- **Role-based access control** — Three distinct roles (Admin, Analyst, Viewer) with enforced API-level permissions
- **Financial records** — Create, view, update, soft-delete, and restore income/expense records
- **Dashboard summary** — Total income, total expense, net balance, and record counts at a glance
- **Monthly trends** — 6-month and 12-month income vs. expense trend views
- **Category breakdown** — Totals grouped by category and record type
- **Paginated records table** — Filterable and searchable records with configurable page size
- **Admin panel** — User management (list, update role/status, delete), and record creation on behalf of any user
- **Rate limiting** — Separate limiters for auth endpoints and write operations
- **Input validation** — All API inputs validated with Zod schemas
---
## User Roles & Permissions
| Feature                        | ADMIN | ANALYST | VIEWER |
|-------------------------------|:-----:|:-------:|:------:|
| View dashboard summary         | ✅    | ✅      | ✅     |
| View monthly trends            | ✅    | ✅      | ✅     |
| View financial records         | ✅    | ✅      | ❌     |
| Create / update / delete records | ✅  | ❌      | ❌     |
| Restore soft-deleted records   | ✅    | ❌      | ❌     |
| Filter records by any userId   | ✅    | ❌      | ❌     |
| Manage users (CRUD)            | ✅    | ❌      | ❌     |
| Create new users               | ✅    | ❌      | ❌     |
---
## Data Models
### User
| Field           | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| `id`            | String    | Primary key                          |
| `name`          | String    | Display name                         |
| `email`         | String    | Unique email address                 |
| `role`          | Enum      | `ADMIN` \| `ANALYST` \| `VIEWER`     |
| `status`        | Enum      | `ACTIVE` \| `INACTIVE`               |
| `emailVerified` | Boolean   | Email verification status            |
| `image`         | String?   | Optional avatar URL                  |
| `createdAt`     | DateTime  | Account creation timestamp           |
### FinancialRecord
| Field       | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| `id`        | String    | CUID primary key                     |
| `amount`    | Decimal   | Monetary value (12,2 precision)      |
| `type`      | Enum      | `INCOME` \| `EXPENSE`                |
| `category`  | String    | User-defined category label          |
| `date`      | DateTime  | Date of the transaction              |
| `notes`     | String?   | Optional notes                       |
| `userId`    | String    | FK → User                            |
| `deletedAt` | DateTime? | Soft-delete timestamp (null = active)|
---
## API Reference
All routes are prefixed with `/api`. Requests requiring authentication must include a valid session token via the `Authorization: ****** header or a session cookie.
### Auth — `/api/auth/*`
Handled by **Better Auth**. Key endpoints:
| Method | Path                               | Description         |
|--------|------------------------------------|---------------------|
| POST   | `/api/auth/sign-in/email`          | Sign in with email  |
| POST   | `/api/auth/sign-up/email`          | Sign up with email  |
| POST   | `/api/auth/sign-out`               | Sign out            |
### Dashboard — `/api/dashboard`
Requires: authenticated (any role)
| Method | Path                    | Description                                        |
|--------|-------------------------|----------------------------------------------------|
| GET    | `/api/dashboard`        | Summary, recent activity, category totals, 6-month trends |
| GET    | `/api/dashboard/trends` | 12-month monthly income/expense trend              |
### Financial Records — `/api/records`
Requires: authenticated
| Method | Path                    | Roles            | Description                           |
|--------|-------------------------|------------------|---------------------------------------|
| GET    | `/api/records`          | ADMIN, ANALYST   | List records (filterable, paginated)  |
| GET    | `/api/records/:id`      | ADMIN, ANALYST   | Get single record                     |
| POST   | `/api/records`          | ADMIN            | Create a new record                   |
| PATCH  | `/api/records/:id`      | ADMIN            | Update a record                       |
| DELETE | `/api/records/:id`      | ADMIN            | Soft-delete a record                  |
| PATCH  | `/api/records/:id/restore` | ADMIN         | Restore a soft-deleted record         |
**Query parameters for `GET /api/records`:**
| Parameter  | Type   | Description                                       |
|------------|--------|---------------------------------------------------|
| `search`   | string | Full-text search on category, notes, user name/email |
| `type`     | string | `INCOME` or `EXPENSE`                             |
| `category` | string | Filter by category (case-insensitive)             |
| `from`     | string | Start date (ISO 8601)                             |
| `to`       | string | End date (ISO 8601)                               |
| `userId`   | string | Filter by user (ADMIN only)                       |
| `deleted`  | string | `exclude` (default) \| `include` \| `only`        |
| `page`     | number | Page number (default: 1)                          |
| `limit`    | number | Records per page, max 100 (default: 20)           |
### Admin — `/api/admin`
Requires: ADMIN role
| Method | Path                     | Description                           |
|--------|--------------------------|---------------------------------------|
| GET    | `/api/admin/users`       | List users (filterable, paginated)    |
| GET    | `/api/admin/users/:id`   | Get single user                       |
| PATCH  | `/api/admin/users/:id`   | Update user (name, email, role, status) |
| DELETE | `/api/admin/users/:id`   | Permanently delete a user             |
### Users — `/api/users`
Requires: ADMIN role
| Method | Path                 | Description             |
|--------|----------------------|-------------------------|
| POST   | `/api/users/create`  | Create a new user account |
---
## Getting Started
### Prerequisites
- **Node.js** v18 or higher
- **PostgreSQL** database
- **npm** (or your preferred package manager)
### Backend Setup
```bash
# Navigate to the backend directory
cd backend
# Install dependencies
npm install
# Configure environment variables (see Environment Variables section)
cp .env.example .env
# Edit .env with your database URL and secrets
# Run Prisma migrations
npx prisma migrate deploy
# Generate Prisma client
npx prisma generate
# Start in development mode (with hot reload)
npm run dev
# Or build and start in production mode
npm run build
npm start
```
The backend server starts on **http://localhost:5000** by default.
### Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend
# Install dependencies
npm install
# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL
# Start in development mode
npm run dev
# Or build for production
npm run build
npm start
```
The frontend dev server starts on **http://localhost:3000** by default.
---
## Environment Variables
### Backend (`backend/.env`)
| Variable       | Description                                      | Example                              |
|----------------|--------------------------------------------------|--------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                     | `******localhost:5432/findb` |
| `PORT`         | Server port (default: 5000)                      | `5000`                               |
| `CORS_ORIGIN`  | Allowed frontend origins (comma-separated)       | `http://localhost:3000`              |
| `BETTER_AUTH_SECRET` | Secret key used by Better Auth             | `your-secret-key`                    |
| `BETTER_AUTH_URL`    | Base URL of this backend API               | `http://localhost:5000`              |
### Frontend (`frontend/.env.local`)
| Variable                | Description                              | Example                     |
|-------------------------|------------------------------------------|-----------------------------|
| `NEXT_PUBLIC_BACKEND_URL`| Backend API base URL                     | `http://localhost:5000`     |
| `BETTER_AUTH_SECRET`    | Must match the backend secret            | `your-secret-key`           |
| `BETTER_AUTH_URL`       | Backend URL for Better Auth client       | `http://localhost:5000`     |
---
## Scripts
### Backend
| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start with hot reload (nodemon + tsx)    |
| `npm run build` | Compile TypeScript to `dist/`            |
| `npm start`     | Run compiled production build            |
### Frontend
| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start Next.js development server         |
| `npm run build` | Create production build                  |
| `npm start`     | Serve production build                   |
| `npm run lint`  | Run ESLint                               |
