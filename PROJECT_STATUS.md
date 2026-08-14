# Activity Tracker - Project Status

Last Updated: 2026-08-12

---

# Architecture

Frontend
↓
API Client
↓
Backend
↓
Authentication
↓
Authorization
↓
Services
↓
Repository
↓
PostgreSQL

---

# Infrastructure ✅

- [x] Go project setup
- [x] React + Vite setup
- [x] PostgreSQL setup
- [x] Docker Compose setup
- [x] Makefile
- [x] GitHub setup
- [x] Automatic database migrations
- [x] Startup logging
- [x] Default admin seeding from environment variables

---

# Backend Foundation ✅

- [x] main.go
- [x] config.go
- [x] postgres.go
- [x] routes.go
- [x] Health endpoint

---

# Database ✅

- [x] Users table
- [x] Infos table
- [x] Invites table
- [x] Plans table
- [x] Closings table
- [x] FG Invites table
- [x] Feel Goods table
- [x] Database migrations
- [x] Automatic migration execution on startup

---

# Business Modules

## Users ✅

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Validation
- [x] Unique IR ID
- [x] Unique phone
- [x] Role validation
- [x] Status validation
- [x] Default admin seeding

---

## Infos ✅

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Response validation: A, AB, B, BC, C
- [x] Status as free text

---

## Invites ✅

Rules:

- One Info → One Invite
- Invite can be updated multiple times
- Meeting date optional
- Meeting time optional
- Mode: virtual / physical
- Status: free text

Features:

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Date/time validation

---

## Plans ✅

Rules:

- One Invite → One Plan
- Plan can be updated multiple times
- UL1: free text
- UL2: free text
- Quoted amount: string
- Expected UVS: float
- Status: free text

Features:

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates

---

## Closings ✅

Rules:

- One Plan → One Closing
- Closing can be updated multiple times
- Closing date: YYYY-MM-DD
- Status: done / pending

Features:

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Date validation

---

## FG Invites ✅

Rules:

- One Closing → One FG Invite
- FG Invite can be updated multiple times
- Meeting date optional
- Meeting time optional
- Mode: virtual / physical
- Status: free text

Features:

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Date/time validation

---

## Feel Good / KIV ✅

Rules:

- One FG Invite → One Feel Good / KIV
- Can be updated multiple times
- UL1: mandatory
- UL2: mandatory
- Status: free text
- Remarks: optional
- Hard delete

Features:

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates

---

# Business Flow ✅

Info
↓
Invite
↓
Plan
↓
Closing
↓
FG Invite
↓
Feel Good / KIV

---

# Authentication ✅

## Default Admin

- [x] Environment configuration
- [x] Automatic admin seeding
- [x] Idempotent admin creation

## Google OAuth

- [x] OAuth configuration
- [x] Login endpoint
- [x] OAuth callback
- [x] Google identity verification
- [x] Existing-user lookup
- [x] Unknown-user rejection
- [x] OAuth state validation
- [x] Browser OAuth flow

## JWT

- [x] Access token generation
- [x] Refresh token generation
- [x] Access token expiry
- [x] Refresh token expiry
- [x] Access token validation
- [x] Refresh token validation
- [x] Separate access/refresh secrets
- [x] Token type validation
- [x] POST /auth/refresh

## JWT Middleware

- [x] Bearer token extraction
- [x] Access token validation
- [x] Token type validation
- [x] User lookup
- [x] Current user in Gin context
- [x] Protected business routes
- [x] Public health endpoint
- [x] Public authentication endpoints

---

# Authorization ✅

## Admin

- [x] Full access to users
- [x] Full access to activities
- [x] Create activities for any user
- [x] Edit any user's activities
- [x] Delete any user's activities

## Upline

- [x] Access own activities
- [x] Access direct downline activities
- [x] Access indirect downline activities
- [x] Create downline activities
- [x] Edit downline activities
- [x] Delete downline activities

## IR / Independent Distributor

- [x] Access own activities
- [x] Create own activities
- [x] Edit own activities
- [x] Delete own activities
- [x] Access descendant activities

## Hierarchy

- [x] users.upline_id as hierarchy source
- [x] Direct downline lookup
- [x] Indirect downline lookup
- [x] Recursive hierarchy traversal
- [x] Hierarchy-based activity access
- [x] Hierarchy-based activity creation
- [x] Hierarchy-based activity editing
- [x] Hierarchy-based activity deletion
- [x] IR can have downlines
- [x] IR can be promoted to Upline

## Activity Ownership

- [x] ir_id represents activity owner
- [x] Logged-in user does not replace ir_id
- [x] Admin can create for another IR
- [x] Upline can manage downline activities
- [x] IR can manage own activities
- [x] No created_by / updated_by fields

---

# Frontend Authentication 🚧

## Authentication

- [x] Auth TypeScript models
- [x] AuthContext
- [x] useAuth hook
- [x] Google login button
- [x] OAuth callback handling
- [x] Access token handling
- [x] Refresh token handling
- [x] Axios Bearer token interceptor
- [x] Automatic token refresh
- [x] Request queue during token refresh
- [x] Logout
- [x] Auth state persistence
- [x] Protected routes
- [x] Login page
- [x] Basic authenticated dashboard
- [ ] Backend OAuth callback → frontend redirect
- [ ] End-to-end browser authentication test

## Frontend Foundation

- [x] React Router
- [x] API client
- [x] Authentication integration
- [x] JWT token handling
- [x] Token refresh handling
- [x] Protected routes
- [ ] Responsive application layout
- [ ] Sidebar
- [ ] Header

---

# Frontend Authorization

- [ ] Admin UI permissions
- [ ] Upline UI permissions
- [ ] IR UI permissions
- [ ] Hide unauthorized actions
- [ ] Activity ownership handling
- [ ] Protected navigation

---

# Frontend Pages

- [x] Login
- [x] Basic Dashboard
- [ ] Users
- [ ] Infos
- [ ] Invites
- [ ] Plans
- [ ] Closings
- [ ] FG Invites
- [ ] Feel Goods

---

# Deployment

## Local

- [x] Environment configuration
- [x] OAuth testing
- [x] JWT testing
- [x] JWT middleware testing
- [x] Authorization testing
- [ ] Full frontend authentication testing

## Production

- [ ] Neon database
- [ ] Backend deployment
- [ ] Frontend deployment
- [ ] Production OAuth redirect URI
- [ ] Production environment variables
- [ ] Production JWT secrets
- [ ] Production authentication testing
- [ ] Production authorization testing

---

# Current Milestone

**Complete Frontend Authentication Integration**

Remaining:

1. Fix backend OAuth callback → frontend redirect.
2. Test complete browser login flow.
3. Verify automatic token refresh.
4. Verify logout.
5. Verify protected routes.

Next major milestone:

**Frontend Application UI + Business Modules**

- Dashboard
- Users
- Infos
- Invites
- Plans
- Closings
- FG Invites
- Feel Goods

---

# Notes

- Empty files are not considered complete.
- Mark tasks complete only after implementation and testing.
- Never regenerate completed modules.
- Follow CLAUDE.md.
- Keep implementation simple.
- Avoid over-engineering.
- Do not add audit fields unless explicitly requested.
- Do not change activity ownership rules.
- ir_id always represents the activity owner.
- users.upline_id is the source of truth for hierarchy.
- Use hard delete.
- Never modify existing migrations.
- Always create new migrations.