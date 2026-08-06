# PROJECT_STATUS.md

# Activity Tracker - Project Status

Last Updated: 2026-08-05

---

# Current Phase

Infos module implementation.

---

# Completed ✅

## Repository Setup

### Backend

- [x] Backend folder structure
- [x] Go module initialized
- [x] Environment files created
- [x] Makefile created
- [x] Migrations folder created

### Frontend

- [x] React + Vite initialized
- [x] TypeScript configured
- [x] Frontend folder structure created

### Infrastructure

- [x] Docker Compose configured
- [x] CLAUDE.md configured
- [x] PROJECT_STATUS.md created

---

## Backend Foundation

- [x] main.go implementation
- [x] config.go implementation
- [x] postgres.go implementation
- [x] routes.go implementation
- [x] health.go implementation

---

## Database

- [x] PostgreSQL container setup
- [x] Database connection
- [x] Connection verification
- [x] Migration setup
- [x] Users migration created
- [x] Users table verified

---

## Users Module

### Backend

- [x] User model
- [x] User repository
- [x] User service
- [x] User handler
- [x] User routes

### APIs

- [x] Create user
- [x] Get user by ID
- [x] Update user
- [x] Delete user
- [x] List users

### Features

- [x] Pagination
- [x] Search
- [x] Role validation
- [x] Status validation
- [x] Email validation
- [x] Upline validation

---

# In Progress 🚧

## Infos Module

### Database

- [ ] Migration

### Backend

- [ ] Info model
- [ ] Info repository
- [ ] Info service
- [ ] Info handler
- [ ] Info routes

### APIs

- [ ] Create info
- [ ] Get info by ID
- [ ] Update info
- [ ] Delete info
- [ ] List infos

### Features

- [ ] Pagination
- [ ] Search

---

# Pending 📋

## Authentication

### Google OAuth

- [ ] Google OAuth setup
- [ ] OAuth callback
- [ ] Login API
- [ ] Logout API

### JWT

- [ ] Access token
- [ ] Refresh token
- [ ] Token validation
- [ ] Authentication middleware

---

## Business Modules

### Invites

- [ ] Migration
- [ ] Backend
- [ ] APIs

### Plans

- [ ] Migration
- [ ] Backend
- [ ] APIs

### Closings

- [ ] Migration
- [ ] Backend
- [ ] APIs

### FG Invites

- [ ] Migration
- [ ] Backend
- [ ] APIs

### Feel Goods

- [ ] Migration
- [ ] Backend
- [ ] APIs

---

## Frontend

### Foundation

- [ ] React Router setup
- [ ] API client setup
- [ ] Authentication setup
- [ ] Responsive layout
- [ ] Sidebar
- [ ] Header

### Pages

- [ ] Dashboard
- [ ] Users
- [ ] Infos
- [ ] Invites
- [ ] Plans
- [ ] Closings
- [ ] FG Invites
- [ ] Feel Goods

---

## Deployment

### Local

- [ ] Environment verification

### Production

- [ ] Neon database setup
- [ ] Backend deployment
- [ ] Frontend deployment

---

# Database Rules

- Use UUID as the primary key.
- Every user must have a unique `ir_id`.
- `ir_id` is mandatory for all roles.
- Phone in infos is optional.
- Use hard delete for activities.
- Deleting a user deletes all their infos.
- Only admins can delete users.
- Never modify existing migrations.
- Always create new migrations.

---

# Infos Rules

Allowed responses:

- A
- AB
- B
- BC
- C

Rules:

- response is mandatory.
- response must be one of the allowed values.
- phone is optional.
- status is mandatory.
- status can be any string.
- ir_id is mandatory.
- info cannot exist without an owner.

---

# Current Milestone

Implement the Infos module.

Files:

- backend/migrations/000002_create_infos_table.up.sql
- backend/migrations/000002_create_infos_table.down.sql
- backend/internal/models/info.go
- backend/internal/repository/info_repository.go
- backend/internal/services/info_service.go
- backend/internal/handlers/info_handler.go
- backend/internal/routes/info_routes.go

Requirements:

- Create info
- Get info by ID
- Update info
- Delete info
- List infos
- Pagination
- Search by prospect_name and phone
- Validate response values

---

# Notes

- Empty files are not considered complete.
- Mark tasks as complete only after implementation and testing.
- Never regenerate completed modules.
- Follow CLAUDE.md.
- Keep the implementation simple.
- Avoid over-engineering.