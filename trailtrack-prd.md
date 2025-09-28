# CRM Product Requirements Document (PRD)

**Project Name:** TrailTrack CRM
**Owner:** Betsy Pitts
**Date:** September 24, 2025
**Tech Stack:** React (Vite), FastAPI, SQLite (sqlmodel or SQLAlchemy), Python 3.11, Node 20
**Target Users:** Solo founders, small teams (1–20 seats), agencies/consultants managing leads → clients

---

## 1) Problem Statement & Goals

**Problem:** You need a lightweight CRM to track engagements and all communications from first contact to closed-won, without the bloat.
**Primary Goal:** Provide one place to:

* Capture organizations and people (contacts)
* Log communications (emails, calls, meetings, notes) and files
* Move leads through a clear pipeline (stages) until sale (and optionally post‑sale account mgmt)
* Produce basic dashboards & reminders

**Non-goals (MVP):** Omnichannel inbox, complex quoting, deep marketing automation, multi‑currency.

---

## 2) Personas

1. **Owner / Principal** – needs pipeline visibility, revenue forecast, and follow-up discipline.
2. **Account Manager / Sales Rep** – needs quick capture on the go, repeatable follow-ups, and activity history.
3. **Operations/CS** (Phase 2) – post-sale onboarding tasks and renewal reminders.

---

## 3) Success Metrics (MVP)

* Time-to-first-entry < 60 seconds from app load to new lead saved
* 90% of interactions logged via one click "Quick Log" path
* Pipeline view loads < 1.5s for 500 leads
* 0 data-loss incidents during first 3 months

---

## 4) Scope & Feature Set

### 4.1 Core Objects

* **Account (Organization)**: name, website, industry, size, address, notes
* **Contact (Person)**: name, role, email, phone, linked Account
* **Lead / Opportunity**: title, account/contact, stage, value, close probability, expected close date, source, owner
* **Activity / Communication**: type (call, email, meeting, note, SMS), subject, body/summary, timestamp, duration, attachments, linked to Lead/Account/Contact
* **Task / Reminder**: due date/time, owner, priority, status, linked object
* **Attachment**: filename, type, size, storage path (local/s3 later), checksum, linked object

### 4.2 Pipeline & Stages (Default)

* *New → Qualified → Proposal → Negotiation → Closed-Won / Closed-Lost*
* Configurable stages (Phase 2) with simple reordering

### 4.3 Views

* **Kanban Pipeline:** columns by stage, cards show title, account, value, next task due
* **Accounts & Contacts List:** sortable/filterable, quick-actions
* **Lead Detail Page:** header (stage, value, owner), tabs: Activity | Details | Contacts | Files | Tasks | Timeline
* **Today View:** My open tasks, overdues, prioritized "Next Best Action"
* **Reports:** Pipeline summary, won vs lost by period, top sources

### 4.4 Capture & Logging

* Global "+" button for New Lead/Account/Contact/Activity
* Inline quick-add for activity from lead detail
* File uploads (local) with virus check stub (Phase 2 real AV)

### 4.5 Notifications & Reminders (MVP)

* Local in-app reminders & badges
* Daily digest email (Phase 2) via FastAPI background task + SMTP env vars

### 4.6 Roles & Permissions (MVP)

* **Admin**, **Standard User**, **Read-Only**
* Row-level: Users can view all records; edits restricted by owner (option toggle). Admin can edit all.

### 4.7 Audit & History

* Change log per lead: stage changes, value edits, owner reassignment
* Activity timeline aggregated from Activities + Tasks + Stage changes

---

## 5) Out of Scope (MVP)

* OAuth email ingestion, 2‑way calendar sync, e‑signature, quoting/CPQ, multi‑currency, multi-language, SSO

---

## 6) Data Model (SQLite)

> Use **SQLModel** (recommended) or SQLAlchemy + Alembic for migrations.

```sql
-- SQLite DDL (reference; generate via SQLModel/Alembic in code)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','user','viewer')) NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  size TEXT,
  phone TEXT,
  email TEXT,
  street TEXT, city TEXT, state TEXT, postal_code TEXT, country TEXT,
  notes TEXT,
  owner_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  account_id INTEGER,
  first_name TEXT, last_name TEXT,
  title TEXT,
  email TEXT, phone TEXT,
  notes TEXT,
  owner_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE leads (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  account_id INTEGER,
  primary_contact_id INTEGER,
  stage TEXT NOT NULL,
  value_cents INTEGER DEFAULT 0,
  probability INTEGER CHECK(probability BETWEEN 0 AND 100) DEFAULT 10,
  expected_close_date TEXT,
  source TEXT,
  owner_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('open','closed_won','closed_lost')) NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(primary_contact_id) REFERENCES contacts(id),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER,
  account_id INTEGER,
  contact_id INTEGER,
  type TEXT CHECK(type IN ('call','email','meeting','note','sms')) NOT NULL,
  subject TEXT,
  body TEXT,
  occurred_at TEXT NOT NULL,
  duration_minutes INTEGER,
  owner_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(lead_id) REFERENCES leads(id),
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(contact_id) REFERENCES contacts(id),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  linked_type TEXT CHECK(linked_type IN ('lead','account','contact')) NOT NULL,
  linked_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_at TEXT,
  priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
  status TEXT CHECK(status IN ('open','done','canceled')) DEFAULT 'open',
  owner_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY,
  linked_type TEXT CHECK(linked_type IN ('lead','account','contact','activity')) NOT NULL,
  linked_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  path TEXT NOT NULL,
  checksum TEXT,
  uploaded_at TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_tasks_due ON tasks(due_at);
```

**Notes:**

* Use `TEXT` ISO 8601 timestamps (UTC) for simplicity with SQLite.
* Monetary values stored as integer cents to avoid float rounding.

---

## 7) API Design (FastAPI)

**Auth:** JWT (access + refresh) with password-hash (argon2/bcrypt).
**Prefix:** `/api/v1`
**Error Shape:** `{ "detail": "...", "code": "..." }`

### 7.1 Endpoints (MVP)

* `POST /auth/register` – Admin only; create user
* `POST /auth/login` – returns tokens
* `POST /auth/refresh`
* `GET /me` – current profile
* `GET /accounts` (q, page, owner_id)
* `POST /accounts`
* `GET /accounts/{id}`
* `PATCH /accounts/{id}`
* `DELETE /accounts/{id}`
* `GET /contacts` (q, page, account_id, owner_id)
* `POST /contacts`
* `GET /contacts/{id}`
* `PATCH /contacts/{id}`
* `DELETE /contacts/{id}`
* `GET /leads` (q, page, stage, owner_id)
* `POST /leads`
* `GET /leads/{id}`
* `PATCH /leads/{id}`
* `DELETE /leads/{id}`
* `GET /activities` (q, page, lead_id, account_id, contact_id)
* `POST /activities`
* `GET /activities/{id}`
* `PATCH /activities/{id}`
* `DELETE /activities/{id}`
* `GET /tasks` (q, page, due_before, owner_id)
* `POST /tasks`
* `GET /tasks/{id}`
* `PATCH /tasks/{id}`
* `DELETE /tasks/{id}`
* `POST /attachments/upload`
* `GET /attachments/{id}/download`
* `DELETE /attachments/{id}`

---

## 8) Frontend (React + Vite)

**Routing:** React Router v6
**State:** Context API + useReducer (Phase 2: consider Zustand/Redux Toolkit)
**UI:** Tailwind CSS + Headless UI or shadcn/ui
**Forms:** React Hook Form + Zod validation
**HTTP:** Axios with interceptors for auth

### 8.1 Pages/Routes

* `/login` – Login form
* `/` – Today View (default after login)
* `/pipeline` – Kanban board
* `/accounts` – Account list + detail modal/page
* `/contacts` – Contact list + detail modal/page
* `/leads` – Lead list
* `/leads/{id}` – Lead detail page
* `/reports` – Basic analytics
* `/settings` – User preferences, team management (admin)

### 8.2 Key Components

* `<Layout>` – Header, nav, main content area
* `<KanbanBoard>` – Drag-drop pipeline view
* `<LeadCard>` – Individual lead in kanban
* `<ActivityTimeline>` – Chronological activity feed
* `<QuickAddModal>` – Global + button actions
* `<FileUpload>` – Drag-drop attachment handling

---

## 9) Technical Architecture

### 9.1 Backend Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + middleware
│   ├── core/
│   │   ├── config.py        # Settings (pydantic)
│   │   ├── security.py      # JWT, password hashing
│   │   └── database.py      # SQLite connection
│   ├── models/              # SQLModel classes
│   │   ├── user.py
│   │   ├── account.py
│   │   ├── contact.py
│   │   ├── lead.py
│   │   ├── activity.py
│   │   ├── task.py
│   │   └── attachment.py
│   ├── api/
│   │   ├── deps.py          # Dependencies (auth, db)
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── accounts.py
│   │       ├── contacts.py
│   │       ├── leads.py
│   │       ├── activities.py
│   │       ├── tasks.py
│   │       └── attachments.py
│   └── schemas/             # Pydantic request/response
├── requirements.txt
└── alembic/                 # DB migrations
```

### 9.2 Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Router setup
│   ├── components/
│   │   ├── ui/              # Reusable components
│   │   ├── layout/
│   │   ├── forms/
│   │   └── kanban/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── TodayPage.tsx
│   │   ├── PipelinePage.tsx
│   │   ├── AccountsPage.tsx
│   │   └── LeadDetailPage.tsx
│   ├── hooks/               # Custom hooks
│   ├── services/            # API calls
│   ├── types/               # TypeScript interfaces
│   ├── utils/
│   └── styles/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 10) Deployment & Infrastructure (MVP)

**Target:** Single VPS or cloud instance
**Stack:** Docker compose with:

* Frontend: Nginx serving built React app
* Backend: FastAPI with Uvicorn
* Database: SQLite file (mounted volume)
* File Storage: Local filesystem (mounted volume)

**Phase 2:** Separate containers, cloud storage (S3), PostgreSQL

---

## 11) Success Criteria & Timeline

**MVP Target:** 6-8 weeks

**Week 1-2:** Backend API + database models
**Week 3-4:** Frontend core pages + auth
**Week 5-6:** Pipeline/kanban, activity logging
**Week 7-8:** File uploads, reports, polish

**Launch Criteria:**
* All CRUD operations working
* JWT auth + user management
* Kanban pipeline functional
* Basic activity logging
* File attachment working
* Responsive design (mobile-friendly)

---

## 12) Future Enhancements (Post-MVP)

* Email integration (IMAP/OAuth)
* Calendar sync (CalDAV/Google)
* Advanced reporting & analytics
* Mobile app (React Native)
* API webhooks
* Integrations (Zapier, etc.)
* Multi-tenancy improvements
