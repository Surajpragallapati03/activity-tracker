# Activity Tracker - Project Status

Last Updated: 2026-08-14

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
- [x] CORS middleware

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

## Users Backend ✅

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
- [x] Upline hierarchy
- [x] Direct downline handling
- [x] Indirect downline handling
- [x] Hierarchy-based authorization
- [x] Everyone can create users
- [x] IR can create users
- [x] IR promotion to upline
- [x] Only admin can delete users
- [x] Self-delete prevention
- [x] Hierarchy-safe deletion
- [x] Downline re-parenting on deletion
- [x] Atomic delete + re-parenting

---

## Infos Backend ✅

- [x] Create
- [x] Get
- [x] Update
- [x] Delete
- [x] List
- [x] Search
- [x] Pagination
- [x] Partial updates
- [x] Authorization
- [x] Activity ownership through ir_id
- [x] Response validation: A, AB, B, BC, C
- [x] Status as free text

---

## Invites Backend ✅

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
- [x] Authorization

---

## Plans Backend ✅

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
- [x] Authorization

---

## Closings Backend ✅

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
- [x] Authorization

---

## FG Invites Backend ✅

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
- [x] Authorization

---

## Feel Good / KIV Backend ✅

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
- [x] Authorization

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
- [x] Backend → frontend OAuth redirect
- [x] End-to-end browser login

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

- [x] Full access to all users
- [x] Full access to all activities
- [x] Create users
- [x] Create activities for any IR
- [x] Edit any user
- [x] Edit any activity
- [x] Delete any user
- [x] Delete any activity
- [x] Choose upline when creating users

## Upline

- [x] View self
- [x] View direct downlines
- [x] View indirect downlines
- [x] Edit self
- [x] Edit downlines
- [x] Create users
- [x] Create users under self
- [x] Manage permitted activities

## IR

- [x] View self
- [x] View direct downlines
- [x] View indirect downlines
- [x] Edit self
- [x] Edit downlines
- [x] Create users
- [x] Create users under self
- [x] IR can be promoted to upline
- [x] Manage permitted activities

## Hierarchy

- [x] users.upline_id as hierarchy source
- [x] Direct downline lookup
- [x] Indirect downline lookup
- [x] Recursive hierarchy traversal
- [x] Hierarchy-based user access
- [x] Hierarchy-based activity access
- [x] Hierarchy-based user creation
- [x] Hierarchy-based activity creation
- [x] Hierarchy-based editing
- [x] Hierarchy-safe deletion
- [x] Downline re-parenting
- [x] IR can have downlines
- [x] IR can be promoted to Upline

## Activity Ownership

- [x] ir_id represents activity owner
- [x] Logged-in user does not replace ir_id
- [x] Admin can create activity for another IR
- [x] Upline can manage permitted downline activities
- [x] IR can manage permitted activities
- [x] No created_by / updated_by fields

---

# Frontend Authentication ✅

- [x] Auth TypeScript models
- [x] AuthContext
- [x] useAuth hook
- [x] Google login
- [x] OAuth callback handling
- [x] Access token handling
- [x] Refresh token handling
- [x] Axios Bearer interceptor
- [x] Automatic token refresh
- [x] Request queue during token refresh
- [x] Logout
- [x] Auth state persistence
- [x] Protected routes
- [x] Login page
- [x] Dashboard
- [x] Backend OAuth callback → frontend redirect
- [x] End-to-end browser authentication

---

# Frontend Foundation ✅

- [x] React Router
- [x] API client
- [x] Authentication integration
- [x] JWT token handling
- [x] Token refresh handling
- [x] Protected routes
- [x] Responsive application layout
- [x] Responsive sidebar
- [x] Responsive header
- [x] Theme/color system
- [x] Typography system
- [x] Reusable UI components
- [x] Consistent spacing/layout system
- [x] Mobile navigation
- [x] Responsive Login page
- [x] Responsive Dashboard
- [x] Accessibility/focus states

---

# Frontend Dashboard + Users ✅

## Dashboard

- [x] Real authenticated user information
- [x] User statistics
- [x] Account information
- [x] Edit Profile
- [x] Edit own name
- [x] Edit own email
- [x] Edit own phone
- [x] Edit own status
- [x] Responsive dashboard

## Users

- [x] Users list
- [x] Search by name
- [x] Search by email
- [x] Search by IR ID
- [x] Backend pagination
- [x] Frontend pagination
- [x] 20 users per page
- [x] View user
- [x] Create user
- [x] Edit user
- [x] Delete user
- [x] Upline selection
- [x] Role selection
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Confirmation before delete
- [x] Hierarchy-aware permissions
- [x] Admin full access
- [x] Upline hierarchy access
- [x] IR hierarchy access
- [x] Self-delete prevention
- [x] Downline re-parenting

---

# Frontend Authorization

- [x] Admin UI permissions
- [x] Upline UI permissions
- [x] IR UI permissions
- [x] Hide unauthorized actions
- [x] Activity ownership handling
- [x] Protected navigation
- [x] Hierarchy-aware user actions

---

# Frontend Business Modules

## Infos

- [ ] List Infos
- [ ] Search Infos
- [ ] Pagination
- [ ] View Info
- [ ] Create Info
- [ ] Edit Info
- [ ] Delete Info
- [ ] Activity owner / IR selection
- [ ] Status handling
- [ ] Response handling
- [ ] Authorization-aware actions
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive UI

## Invites

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Responsive UI

## Plans

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Responsive UI

## Closings

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Responsive UI

## FG Invites

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Responsive UI

## Feel Good / KIV

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Responsive UI

---

# Deployment

## Local

- [x] Environment configuration
- [x] OAuth testing
- [x] JWT testing
- [x] JWT middleware testing
- [x] Authorization testing
- [x] CORS testing
- [x] Frontend authentication testing
- [x] Frontend Users testing
- [x] Hierarchy testing
- [x] User deletion/re-parenting testing

## Production

- [ ] Neon database
- [ ] Backend deployment
- [ ] Frontend deployment
- [ ] Production OAuth redirect URI
- [ ] Production environment variables
- [ ] Production JWT secrets
- [ ] Production authentication testing
- [ ] Production authorization testing
- [ ] Production CORS configuration

---

# Current Milestone

**Frontend Infos Module**

Build the Infos UI using the existing frontend design system and existing backend APIs.

Focus:

1. List Infos.
2. Search/filter Infos.
3. Pagination.
4. View Info.
5. Create Info.
6. Edit Info.
7. Delete Info.
8. Apply existing hierarchy-based authorization.
9. Use `ir_id` as activity ownership.
10. Keep responsive behavior.
11. Reuse existing loading, error, empty, modal, table and pagination patterns.

Do not modify completed authentication, authorization, Users, or database modules unless an existing bug is discovered.

---

# Next Major Milestone

**Frontend Activity Flow**

- Infos
- Invites
- Plans
- Closings
- FG Invites
- Feel Good / KIV

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
- `ir_id` always represents the activity owner.
- `users.upline_id` is the source of truth for hierarchy.
- Use hard delete.
- Never modify existing migrations.
- Always create new migrations.
- Backend remains the security boundary.
- Frontend permissions are for UX; backend authorization must enforce access.
- User deletion must preserve descendants through re-parenting.