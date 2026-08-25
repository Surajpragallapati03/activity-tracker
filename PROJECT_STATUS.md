# Activity Tracker - Project Status

Last Updated: 2026-08-17

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
- [x] IR ID filtering

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
- [x] Collapsible desktop sidebar
- [x] Icon-only collapsed sidebar
- [x] Expandable/collapsible Activities section
- [x] Sidebar state persistence
- [x] Responsive sidebar resize behavior
- [x] Mobile drawer

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

# Frontend Infos ✅

- [x] Infos list
- [x] Search by prospect name
- [x] Search by phone
- [x] Backend pagination
- [x] Frontend pagination
- [x] 20 Infos per page
- [x] View Info
- [x] Create Info
- [x] Edit Info
- [x] Delete Info
- [x] Activity owner selector
- [x] Searchable activity owner selector
- [x] Admin owner filtering
- [x] Upline owner filtering
- [x] IR owner filtering
- [x] Owner change resets pagination
- [x] Response handling
- [x] Status handling
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Responsive UI
- [x] Authorization-aware actions

---

# Frontend Invites ✅

- [x] List Invites
- [x] Search/filter
- [x] Pagination
- [x] 20 Invites per page
- [x] Activity owner selector
- [x] Logged-in user shown first as "(Me)"
- [x] Owner-based Info filtering
- [x] Owner → Info → Invite creation flow
- [x] View Invite
- [x] Create Invite
- [x] Edit Invite
- [x] Delete Invite
- [x] Authorization-aware actions
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Responsive UI
- [x] Meeting time normalization: HH:MM → HH:MM:SS
- [x] Meeting time displayed in list
- [x] Remarks displayed in list
- [x] Full remarks available in View modal
- [x] Backend IR ID filtering
- [x] Owner filtering verified end-to-end
- [x] Pagination resets when owner changes

---

# Frontend Business Modules

## Plans 🚧

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] Activity owner selector
- [ ] Owner-based Invite selection
- [ ] View
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Authorization
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive UI

## Closings

- [ ] List
- [ ] Search/filter
- [ ] Pagination
- [ ] Activity owner selector
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
- [ ] Activity owner selector
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
- [ ] Activity owner selector
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
- [x] Infos frontend testing
- [x] Sidebar/responsive navigation testing
- [x] Invites frontend testing
- [x] Invites owner filtering testing
- [x] Invites time format testing

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

**Frontend Plans Module**

Implement the Plans UI using the existing working Infos and Invites patterns.

Focus:

1. List Plans.
2. Search/filter Plans.
3. Pagination with 20 items per page.
4. Activity owner selector.
5. Owner → eligible Invite selection.
6. View Plan.
7. Create Plan.
8. Edit Plan.
9. Delete Plan.
10. Apply existing hierarchy-based authorization.
11. Preserve responsive UI.
12. Reuse existing loading/error/empty/pagination patterns.

---

# Business Flow

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

For frontend creation flows:

- Infos belong to an activity owner.
- Invites are created from an owner's eligible Infos.
- Plans should be created from an owner's eligible Invites.
- The activity owner should be selected first.
- Only records belonging to that selected owner should be displayed.
- The activity `ir_id` should come from the selected owner/parent activity.
- Do not ask users to manually enter duplicate ownership information.

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
- Activity owner filtering must only expose users the logged-in user is authorized to access.
- HTML time inputs may return `HH:MM`; normalize to backend `HH:MM:SS` before API submission.
- Reuse proven patterns from completed frontend modules instead of creating new architecture.