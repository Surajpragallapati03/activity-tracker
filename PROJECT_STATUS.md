

## Project Overview

Internal activity tracker for a team of fewer than 50 users.

### Stack

- Backend: Go 1.24 + Gin
- Database: PostgreSQL
- Migrations: golang-migrate
- Authentication: Google OAuth + IR ID/password
- Authorization: JWT
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Data fetching: TanStack Query
- Local development: Docker Compose
- Production database: Neon PostgreSQL

---

# Architecture

```text
React Frontend
      ↓
Axios API Client
      ↓
Go / Gin
      ↓
Service
      ↓
Repository
      ↓
PostgreSQL
````

Keep the existing architecture simple.

Do not introduce unnecessary abstractions.

---

# Roles & Authorization

Supported roles:

* admin
* upline
* ir

## Admin

* Full system access.
* Manage all users.
* View and manage all activities.
* Generate individual reports.
* Generate team reports.
* Export reports.

## Upline

* View self and direct/indirect descendants.
* Manage authorized activities.
* Generate reports for self and authorized descendants.
* Generate team reports from authorized hierarchy.
* Export authorized reports.

## IR

* View own data only.
* Manage own activities.
* Generate own individual report.
* Cannot access another user's data.

Backend authorization is the source of truth.

---

# Authentication

Implemented:

* Google OAuth
* IR ID + password login
* JWT access token
* JWT refresh token
* bcrypt password hashing
* Set password
* Change password
* Password visibility toggle
* Active-user validation

Existing Google-only users can have a NULL password hash.

Migration:

```text
000008_add_password_hash_to_users
```

Password hashes are never returned by APIs.

---

# User Management

Implemented:

* User creation
* User editing
* User deletion
* Search
* Pagination
* Hierarchy management
* Role management
* Activity owner filtering
* Password setup
* User metrics

## User Metrics

Fields:

* `plans_shown`
* `drs_hit`

Migration:

```text
000009_add_user_metrics
```

### plans_shown

* Automatically increments after successful Plan creation.
* Does not increment when editing a Plan.
* Can be manually edited.

### drs_hit

* Manually editable.
* Can be entered during user creation.
* Can be updated later.

## User Deletion

* Only Admin can delete users.
* Users cannot delete themselves.
* Downlines are not deleted.
* Direct children are re-parented to the deleted user's upline.
* Deletion/re-parenting is transactional.

---

# Dashboard

Implemented:

* System Count
* Plans Shown
* DRs Hit
* Account Information
* Profile editing
* User menu
* Set/Change Password
* Logout

## Editable Profile Fields

* Name
* Email
* Phone
* Status

## Read-only Profile Fields

* IR ID
* Role

Password management remains separate from normal profile editing.

---

# Navigation

Implemented:

* Responsive sidebar
* Desktop collapse/expand
* Mobile drawer
* Sidebar state persistence
* Activity section collapse/expand

Current navigation:

```text
Dashboard
Users
Infos
Pipeline Updates
KIV
Reports

Activities
├── Invites
├── Plans
├── Closings
├── FG Invites
└── Feel Goods
```

---

# Activity Workflow

```text
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
Feel Good
```

KIV is maintained separately from the active pipeline.

---

# Activity Modules

## Infos

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Authorization
* Responsive UI

## Invites

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Owner-first creation
* Owner-based Info filtering
* Authorization
* Meeting time conversion

Creation flow:

```text
Activity Owner
      ↓
Owner's Infos
      ↓
Invite
```

## Plans

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Owner-first creation
* Eligible Invite filtering
* Expected UVs
* Pipeline Status
* Prospect resolution
* Authorization

Creation flow:

```text
Activity Owner
      ↓
Eligible Invite
      ↓
Plan
```

Plans Shown increments after successful Plan creation.

## Closings

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Authorization
* Prospect resolution

## FG Invites

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Authorization
* Meeting date/time
* Mode
* Prospect resolution

## Feel Goods

Implemented:

* CRUD
* Search
* Pagination
* Activity owner filtering
* Authorization
* Hard delete
* UL1
* UL2
* Status
* Remarks

---

# Plan Pipeline

Migration:

```text
000010_add_pipeline_status_to_plans
```

Supported statuses:

```text
tentative
strong
sureshot
done
KIV
```

## Meaning

* `tentative`: Prospect is still tentative.
* `strong`: Prospect is arranging funds.
* `sureshot`: Prospect is ready with funds.
* `done`: Prospect is outside the active pipeline.
* `KIV`: Keep in View / tracking.

## Pipeline Rules

Active pipeline:

* tentative
* strong
* sureshot

Normal metrics:

* done
* KIV

Pipeline UV uses:

```text
plans.expected_uvs
```

Done and KIV do not contribute to active pipeline UV totals.

All pipeline statuses are editable.

New Plans default to:

```text
tentative
```

---

# Pipeline Updates

Route:

```text
/pipeline-updates
```

Implemented:

* Hierarchy-aware user selection
* Current user shown first as `(Me)`
* Tentative summary
* Strong summary
* Sureshot summary
* UV totals
* Plan counts
* Pipeline details
* Date filtering
* Pagination
* Authorization

Pipeline detail format:

```text
Sl.No | IR Name | Prospect Name | Expected UVs | Remarks
```

Only tentative, strong and sureshot appear as active pipeline sections.

---

# KIV

Route:

```text
/kiv
```

KIV is individual-user-specific.

Rules:

* Shows only the logged-in user's KIV plans.
* Does not include descendants.
* Supports pagination.
* Pipeline status can be edited.
* Changing status removes the Plan from KIV automatically.

---

# Reports

Route:

```text
/reports
```

Modes:

* Individual
* Team

## Individual Reports

Supports:

* User selection
* Today
* This Week
* This Month
* Custom date range
* Activity counts
* Done count
* KIV count
* Pipeline UV totals
* Pipeline details

Activity metrics:

```text
Infos
Invites
Plans
Closings
FG Invites
Feel Goods
Done
KIV
```

Pipeline metrics:

```text
Tentative UV
Strong UV
Sureshot UV
Total Pipeline UV
```

Pipeline detail:

```text
Sl.No | IR Name | Prospect Name | Expected UVs | Remarks
```

Individual reports contain only the selected user's own data.

---

# Team Reports

A team means:

```text
Selected User
+
All Descendants
```

User-facing terminology:

```text
<Name>'s Team
```

Do not use "Vertical" or "Sub-Team" in user-facing reports.

## Example

```text
Upline 1's Team

Upline 1
├── Upline 2
│   ├── IR1
│   ├── IR2
│   └── IR3
└── Upline 3
    ├── IR4
    ├── IR5
    └── IR6
```

## Multiple Team Selection

Multiple teams can be selected.

If selected users have a parent/descendant relationship, overlapping teams are deduplicated.

Example:

```text
Selected:
Upline 1
Upline 2
Upline 3
```

If Upline 2 and Upline 3 are descendants of Upline 1, the overall aggregation belongs to:

```text
Upline 1's Team
```

The same activities and pipeline UVs must not be counted twice.

Independent teams remain separate.

Example:

```text
Upline 2's Team
Upline 3's Team
```

if neither contains the other.

---

# Report Data Rules

For pipeline details:

```text
IR Name       = users.name
IR ID         = users.ir_id
Prospect Name = infos.prospect_name
Expected UVs  = plans.expected_uvs
Remarks       = plans.remarks
```

Important:

* `users.name` must be displayed as IR Name.
* `users.ir_id` must be displayed as IR ID.
* `users.id` UUID must never be displayed as IR ID.

---

# Report Export

Implemented:

* Excel
* CSV
* PDF

Endpoints:

```text
POST /reports/individual/export/:format
POST /reports/team/export/:format
```

Supported formats:

```text
excel
csv
pdf
```

Exports use the same authorized report data.

## Excel

Individual:

* Summary sheet
* Pipeline Details sheet

Team:

* Team Summary sheet
* Pipeline Details sheet

## CSV

Includes:

* Report summary
* Activity metrics
* Pipeline metrics
* Pipeline details

Proper CSV escaping is required.

## PDF

Implemented using a real PDF generator.

PDF includes:

* Report metadata
* Activity summary
* Pipeline summary
* Pipeline details
* Team sections

PDF must be valid and open in standard PDF readers.

---

# Report Validation & Fixes

Completed:

* Fixed blank Reports page caused by NULL Go slices.
* Fixed report authorization for Upline descendants.
* Fixed Reports authentication/API calls.
* Fixed user and team selectors.
* Fixed report rendering.
* Fixed PDF generation.
* Fixed UUID being displayed instead of IR ID.
* Fixed IR Name being displayed as IR ID.
* Fixed overlapping team aggregation.
* Fixed duplicate team activity counts.
* Fixed duplicate pipeline data.
* Updated team terminology to `<Name>'s Team`.
* Added Excel export.
* Added CSV export.
* Added PDF export.
* Fixed Reports dark-mode visibility.

---

# Frontend Theme

Implemented:

* Light mode
* Dark mode
* System theme support
* Theme persistence
* Tailwind dark mode
* Dark-mode styling across application

Reports page received additional dark-mode fixes for:

* Date fields
* Select controls
* Team selectors
* Error messages
* Tables
* Checkboxes
* Summary blocks
* Pipeline sections

---

# Google Profile

Implemented:

* Google profile image support.
* Profile image in user interface.
* Initials fallback for users without an image.
* No unnecessary profile image persistence.

Google profile image is not required for IR ID/password authentication.

---

# Dashboard Visual Enhancement

Implemented:

* Enhanced metric cards.
* System Count card.
* Plans Shown card.
* DRs Hit card.
* Icons.
* Improved spacing and hierarchy.
* Improved Account Information presentation.
* Responsive dashboard layout.

---

# Database Migrations

Important migrations:

```text
000008_add_password_hash_to_users
000009_add_user_metrics
000010_add_pipeline_status_to_plans
```

Rules:

* Never modify an existing migration.
* Always create a new migration for schema changes.
* Every new migration must have up/down files.
* Do not add migrations unless required.

---

# Core Business Rules

## User Hierarchy

`users.upline_id` is the source of truth.

```text
Admin
  ↓
Upline
  ↓
Upline / IR
```

Users can have direct and indirect descendants.

## Activity Ownership

Activities use `ir_id` to identify the owner.

Backend authorization must enforce ownership and hierarchy access.

## Prospect Flow

```text
Info
→ Invite
→ Plan
→ Closing
→ FG Invite
→ Feel Good
```

## Pipeline

Active:

```text
tentative
strong
sureshot
```

Normal tracking:

```text
done
KIV
```

## KIV

KIV is individual-user-specific.

Descendants are not included.

## User Metrics

`plans_shown`:

* Automatically increments after successful Plan creation.
* Does not increment on Plan update.
* Can be manually edited.

`drs_hit`:

* Manually editable.

---

# Current Module Status

```text
Authentication             COMPLETE
Google OAuth                COMPLETE
IR ID + Password            COMPLETE
Password Management         COMPLETE
User Management             COMPLETE
User Hierarchy              COMPLETE
User Metrics                COMPLETE
Dashboard                   COMPLETE
Collapsible Sidebar         COMPLETE
Light/Dark Mode             COMPLETE
Google Profile Image        COMPLETE
Infos                       COMPLETE
Invites                     COMPLETE
Plans                       COMPLETE
Plan Pipeline Status        COMPLETE
Closings                    COMPLETE
FG Invites                  COMPLETE
Feel Goods                  COMPLETE
Pipeline Updates            COMPLETE
KIV                         COMPLETE
Individual Reports          COMPLETE
Team Reports                COMPLETE
Excel Export                COMPLETE
CSV Export                  COMPLETE
PDF Export                  COMPLETE
```

---

# Remaining Roadmap

## 1. Final Application Testing

* [ ] Full end-to-end testing
* [ ] Admin workflow testing
* [ ] Upline workflow testing
* [ ] IR workflow testing
* [ ] Mobile testing
* [ ] Dark/light mode regression testing
* [ ] Report/export regression testing
* [ ] Authorization/security testing
* [ ] Database migration verification

## 2. Production Deployment

* [ ] Production backend deployment
* [ ] Production frontend deployment
* [ ] Neon production database
* [ ] Production Google OAuth configuration
* [ ] Production environment variables
* [ ] Production JWT secrets
* [ ] Production domain configuration
* [ ] Production smoke testing

---

# Project Status

Core application functionality: COMPLETE

Authentication: COMPLETE

User hierarchy: COMPLETE

Activity tracking: COMPLETE

Pipeline tracking: COMPLETE

KIV tracking: COMPLETE

Individual reports: COMPLETE

Team reports: COMPLETE

Report exports: COMPLETE

Light/Dark mode: COMPLETE

Google profile image: COMPLETE

Current priority:

```text
Final Testing
      ↓
Production Deployment
```

