# Activity Tracker - Project Status

Last Updated: 2026-08-25

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

# Database ✅

- [x] Users table
- [x] Infos table
- [x] Invites table
- [x] Plans table
- [x] Closings table
- [x] FG Invites table
- [x] Feel Goods table
- [x] Database migrations
- [x] Automatic migration execution

---

# Business Modules

## Users ✅

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Validation
- [x] Unique IR ID
- [x] Unique phone
- [x] Role/status validation
- [x] Default admin seeding
- [x] Hierarchy-based access
- [x] User creation by all authenticated users
- [x] IR promotion to Upline
- [x] Self profile editing
- [x] Admin-only deletion
- [x] Hierarchy-safe deletion with reparenting
- [x] 20 users per page

---

## Infos ✅

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Response validation: A, AB, B, BC, C
- [x] Status as free text
- [x] Activity owner filtering
- [x] Hierarchy-aware owner selection
- [x] 20 items per page

---

## Invites ✅

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Date/time validation
- [x] Activity owner filtering
- [x] Owner-first create flow
- [x] Owner-specific Info filtering
- [x] Logged-in user shown first as "(Me)"
- [x] Meeting time converted to HH:MM:SS
- [x] Meeting time displayed
- [x] Remarks displayed
- [x] Hierarchy-aware filtering

---

## Plans ✅

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Activity owner filtering
- [x] Owner-first create flow
- [x] Owner-specific Invite filtering
- [x] Logged-in user shown first as "(Me)"
- [x] Correct invite_id mapping
- [x] Correct expected_uvs mapping
- [x] Remarks mapping
- [x] Prospect name resolution: Plan → Invite → Info
- [x] Hierarchy-aware authorization
- [x] 20 items per page

---

## Closings ✅

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Activity owner filtering
- [x] Owner-first create flow
- [x] Owner-specific Plan filtering
- [x] Logged-in user shown first as "(Me)"
- [x] Create Closing
- [x] View Closing
- [x] Edit Closing
- [x] Delete Closing
- [x] Prospect name resolution: Closing → Plan → Invite → Info
- [x] Hierarchy-aware authorization
- [x] Responsive UI
- [x] Loading/error/empty states
- [x] 20 items per page

---

## FG Invites ✅

Rules:

- One Closing → One FG Invite
- FG Invite can be updated multiple times
- Meeting date optional
- Meeting time optional
- Mode: virtual / physical
- Status: free text
- Remarks: optional

Features:

- [x] CRUD
- [x] Search
- [x] Pagination
- [x] Activity owner filtering
- [x] Owner-first create flow
- [x] Owner-specific Closing filtering
- [x] Logged-in user shown first as "(Me)"
- [x] Create FG Invite
- [x] View FG Invite
- [x] Edit FG Invite
- [x] Delete FG Invite
- [x] Authorization-aware actions
- [x] Prospect name resolution: FG Invite → Closing → Plan → Invite → Info
- [x] Meeting date/time display
- [x] Meeting time converted to HH:MM:SS
- [x] Remarks display
- [x] Loading/error/empty states
- [x] Responsive UI
- [x] 20 items per page

---

## Feel Good / KIV 🚧

Rules:

- One FG Invite → One Feel Good / KIV
- Can be updated multiple times
- UL1: mandatory
- UL2: mandatory
- Status: free text
- Remarks: optional
- Hard delete
- ir_id = activity owner

Backend:

- [x] CRUD APIs
- [x] Pagination
- [x] Filtering
- [x] Authorization

Frontend:

- [ ] Page
- [ ] Activity owner selector
- [ ] Owner-first create flow
- [ ] Owner-specific FG Invite filtering
- [ ] Create Feel Good / KIV
- [ ] View Feel Good / KIV
- [ ] Edit Feel Good / KIV
- [ ] Delete Feel Good / KIV
- [ ] Pagination
- [ ] Search/filter
- [ ] Authorization-aware actions
- [ ] Prospect name resolution
- [ ] Loading/error/empty states
- [ ] Responsive UI

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
- [x] Frontend redirect

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

## Upline / IR

- [x] Access own activities
- [x] Access direct downline activities
- [x] Access indirect downline activities
- [x] Create downline activities
- [x] Edit downline activities
- [x] Delete downline activities

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
- [x] Reparenting when admin deletes an Upline

## Activity Ownership

- [x] ir_id represents activity owner
- [x] Logged-in user does not replace ir_id
- [x] Admin can create for another IR
- [x] Upline can manage downline activities
- [x] IR can manage own activities
- [x] No created_by / updated_by fields

---

# Frontend UI Foundation ✅

- [x] Tailwind CSS
- [x] Responsive layout
- [x] Header
- [x] Sidebar
- [x] Collapsible sidebar
- [x] Mobile navigation drawer
- [x] Expand/collapse Activities section
- [x] Sidebar state persistence
- [x] Responsive content width
- [x] Login page
- [x] Dashboard layout
- [x] Reusable UI components

---

# Frontend Authentication ✅

- [x] Auth TypeScript models
- [x] AuthContext
- [x] useAuth hook
- [x] Google login
- [x] OAuth callback handling
- [x] Access token handling
- [x] Refresh token handling
- [x] Axios Bearer token interceptor
- [x] Automatic token refresh
- [x] Request queue during token refresh
- [x] Logout
- [x] Auth state persistence
- [x] Protected routes
- [x] End-to-end browser authentication

---

# Frontend Authorization ✅

- [x] Admin UI permissions
- [x] Upline UI permissions
- [x] IR UI permissions
- [x] Hide unauthorized actions
- [x] Activity ownership handling
- [x] Protected navigation
- [x] Activity owner selector
- [x] Hierarchy-aware owner filtering

---

# Frontend Pages

- [x] Login
- [x] Dashboard
- [x] Users
- [x] Infos
- [x] Invites
- [x] Plans
- [x] Closings
- [x] FG Invites
- [ ] Feel Goods

---

# Deployment

## Local

- [x] Environment configuration
- [x] OAuth testing
- [x] JWT testing
- [x] JWT middleware testing
- [x] Authorization testing
- [x] Frontend authentication testing
- [x] Users testing
- [x] Infos testing
- [x] Invites testing
- [x] Plans testing
- [x] Closings testing
- [x] FG Invites testing

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

**Frontend Business Modules**

Completed:

1. Users
2. Infos
3. Invites
4. Plans
5. Closings
6. FG Invites

Remaining:

7. Feel Goods / KIV

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
- Frontend activity modules should follow the established Infos/Invites/Plans/Closings/FG Invites patterns.
- Use 20 items per page.
- Activity owner selector should show the logged-in user first as "(Me)".
- Owner selection should filter activities by ir_id.