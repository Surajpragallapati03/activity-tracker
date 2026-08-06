# CLAUDE.md

# Activity Tracker

Internal activity tracker for a team of fewer than 50 users.

---

# Core Principles

- Generate production-ready code only.
- Keep responses concise.
- Minimize token usage.
- Modify existing files whenever possible.
- Generate only the requested module.
- Do not generate unrelated features.
- Do not explain code unless explicitly asked.
- Prefer simple solutions over overengineering.
- Follow the existing project structure.

---

# Simplicity Rules

Maximum users: 50.

Prefer explicit code over abstractions.

Avoid:

- interfaces unless absolutely necessary
- generic repositories
- factory patterns
- CQRS
- event-driven architecture
- microservices
- DTOs unless required
- premature optimization
- unnecessary helper packages

Do not create folders, layers, or abstractions unless explicitly requested.

Keep functions small and readable.

---

# Tech Stack

## Backend

- Go 1.24
- Gin
- PostgreSQL
- golang-migrate
- JWT Authentication
- Google OAuth

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- TanStack Table
- Axios
- shadcn/ui

## Infrastructure

- Docker Compose (local development)
- Neon PostgreSQL (production)

---

# Project Structure

```text
activity-tracker/

├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repository/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── migrations/
│   ├── .env
│   └── Makefile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── CLAUDE.md
└── PROJECT_STATUS.md
```

Always follow the existing folder structure.

Do not create new folders unless explicitly asked.

---

# Roles

Allowed roles:

```text
admin
upline
ir
```

---

# Permissions

## Admin

- Full access
- Create, edit and delete anything
- View all activities
- Manage all users

## Upline

- View own data
- View direct downlines
- Create activities for direct downlines
- Edit direct downline activities

## IR

- View own data only
- Create own activities
- Edit own activities

---

# Terminology

Never use:

- Employee
- Employees
- Manager
- Managers
- Member
- Members

Always use:

- Admin
- Upline
- Independent Distributor
- IR
- Downline

---

# Business Flow

```text
Info
    ↓
Invite
    ↓
Plan
    ↓
Closing
    ↓
FG Invite (optional)
    ↓
Feel Good / KIV
```

---

# Database Rules

- Use UUID as the primary key.
- Never modify existing migrations.
- Always create new migrations.
- One prospect belongs to exactly one IR.
- One prospect can have only one invite.
- One prospect can have only one plan.
- One prospect can have only one closing.
- One prospect can have only one FG invite.
- One prospect can have only one feel-good entry.
- Phone numbers must be globally unique.
- Use hard delete for activities.
- Restrict user deletion.

---

# Tables

## users

```text
id
ir_id
name
email
phone
role
upline_id
status
created_at
updated_at
```

## infos

```text
id
ir_id
prospect_name
phone
response
status
remarks
entry_date
created_at
updated_at
```

## invites

```text
id
info_id
ir_id
meeting_date
meeting_time
mode
status
remarks
created_at
updated_at
```

## plans

```text
id
info_id
ir_id
ul1
ul2
quoted_amount
expected_uv
status
remarks
created_at
updated_at
```

## closings

```text
id
info_id
ir_id
status
remarks
created_at
updated_at
```

## fg_invites

```text
id
info_id
ir_id
meeting_date
meeting_time
mode
status
remarks
created_at
updated_at
```

## feel_goods

```text
id
info_id
ir_id
ul1
ul2
status
remarks
created_at
updated_at
```

---

# Backend Architecture

```text
Route
   ↓
Handler
   ↓
Service
   ↓
Repository
   ↓
PostgreSQL
```

---

# Backend Rules

- Keep handlers thin.
- Keep services focused on business logic.
- Keep repositories focused on database access.
- Validate requests.
- Use transactions only when necessary.
- Prefer simple SQL queries.
- Avoid unnecessary abstractions.
- Use context.Context where needed.

---

# API Standards

Every list API must support:

- pagination
- search
- filtering
- sorting

Examples:

```text
GET /infos?page=1&limit=20

GET /infos?search=john

GET /infos?ir_id=123

GET /plans?status=completed
```

---

# Authentication

- Google OAuth
- JWT access token
- JWT refresh token

Protected APIs must use:

```text
Authorization: Bearer <token>
```

---

# Frontend Rules

Build mobile-first.

The application must support:

- Desktop
- Tablet
- Mobile

Never use fixed widths.

Always use responsive layouts.

---

# Layout Rules

## Desktop

- Fixed sidebar
- Full-width tables
- Filters visible

## Tablet

- Collapsible sidebar
- Horizontal scrolling
- Responsive forms

## Mobile

- Drawer navigation
- Card layout instead of tables
- Stacked forms

---

# Dashboard Layout

```text
Sidebar
    ├── Dashboard
    ├── IRs
    ├── Infos
    ├── Invites
    ├── Plans
    ├── Closings
    ├── FG Invites
    └── Feel Goods
```

---

# Table Rules

Every table must support:

- search
- sorting
- filters
- pagination
- create
- edit
- delete

Show all business columns.

If activity does not exist:

```text
NA
```

---

# Code Generation Rules

Generate only the files explicitly requested.

Prefer modifying existing files over creating new files.

Do not create:

- interfaces
- DTOs
- generic repositories
- helper packages
- constants packages
- tests
- analytics
- reports
- charts
- pipelines
- notifications

unless explicitly requested.

---

# Response Format

Return:

1. File path
2. Code

Do not regenerate unchanged files.

Do not explain architecture decisions.

Keep explanations under 10 lines.

Prefer diffs over full file replacements.

Minimize output tokens.

Avoid unnecessary comments.

Follow existing naming conventions.

Do not introduce additional libraries unless explicitly requested.