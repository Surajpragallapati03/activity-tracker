# CLAUDE.md

## Activity Tracker

Internal activity tracker for a team of fewer than 50 users.

## Core Principles

* Build production-ready code only.
* Keep implementation simple and readable.
* Minimize token usage.
* Read `PROJECT_STATUS.md` before implementing anything.
* Modify existing files whenever possible.
* Do not regenerate completed modules.
* Implement only the requested milestone.
* Do not add unrelated features.
* Follow the existing project structure and naming conventions.
* Do not introduce libraries unless explicitly required.
* Run the appropriate build after changes.

## Architecture

Backend flow:

`Route → Handler → Service → Repository → PostgreSQL`

Frontend flow:

`Page → API Client → Backend API`

Keep handlers thin, services focused on business logic, and repositories focused on database access.

Avoid unnecessary abstractions such as:

* Generic repositories
* CQRS
* Event-driven architecture
* Microservices
* Factories
* Unnecessary interfaces
* Unnecessary DTOs
* Premature optimization
* Extra layers or folders

## Tech Stack

### Backend

* Go 1.24
* Gin
* PostgreSQL
* golang-migrate
* JWT
* Google OAuth

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* TanStack Table
* Axios
* shadcn/ui

### Infrastructure

* Docker Compose
* Neon PostgreSQL for production

## Roles

Allowed roles:

* `admin`
* `upline`
* `ir`

Use these terms:

* Admin
* Upline
* Independent Distributor
* IR
* Downline

Do not use:

* Employee
* Manager
* Member

## Authorization

Hierarchy source:

`users.upline_id`

### Admin

* Full access to users and activities.
* Can create, edit, and delete any activity.
* Only Admin can delete users.
* Admin cannot delete themselves.

### Upline

* Can access own data.
* Can access direct and indirect downlines.
* Can create and manage activities for authorized users.

### IR

* Can access own data.
* Can access direct and indirect downlines.
* Can create and manage activities for authorized users.
* An IR can have downlines.
* An IR can be promoted to Upline without changing relationships.

Unauthorized access must return HTTP 403.

Authentication failures must return HTTP 401 where applicable.

## Activity Ownership

`activity.ir_id` always represents the actual activity owner.

The logged-in user's ID must not replace the activity owner's `ir_id`.

## Business Flow

`Info → Invite → Plan → Closing → FG Invite → Feel Good`

## Plan Pipeline

Allowed `pipeline_status` values:

* `tentative`
* `strong`
* `sureshot`
* `kiv`
* `done`

New Plans default to `tentative`.

All five statuses are editable.

Only these are active pipeline categories:

* Tentative
* Strong
* Sureshot

KIV and Done are normal metrics, not pipeline categories.

Pipeline calculations use `plans.expected_uvs`.

Pipeline remarks come from `plans.remarks`.

Do not create a separate pipeline table unless explicitly requested.

## Database Rules

* Use UUID primary keys.
* Never modify existing migrations.
* Always create a new migration for schema changes.
* Use hard delete for activities.
* Preserve existing relationships.
* Do not add `created_by` or `updated_by` fields unless explicitly requested.
* Do not change existing activity ownership rules.

For schema changes, create both:

`XXXX_description.up.sql`

`XXXX_description.down.sql`

## Authentication

Supported authentication:

* Google OAuth
* IR ID + password

JWT:

* Access token
* Refresh token

Password requirements:

* Store only bcrypt hashes.
* Never store plaintext passwords.
* Never return `password_hash`.
* Existing Google-only users may have a NULL password hash.

Protected APIs require:

`Authorization: Bearer <access_token>`

Do not modify authentication when implementing unrelated features.

## Frontend

The application must support:

* Desktop
* Tablet
* Mobile
* Light mode
* Dark mode

Use responsive layouts and avoid unnecessary fixed widths.

Existing sidebar behavior:

* Desktop collapsible sidebar.
* Activities section can expand/collapse.
* Mobile drawer.
* Sidebar state persists locally.

Reuse existing UI patterns across modules.

## Pagination

Default frontend page size:

`20`

Use backend pagination for large datasets.

List pages should support pagination, search, and filtering where applicable.

## Reporting

Reports are based on existing activity data.

### Individual Report

Supports:

* Daily
* Weekly
* Monthly
* Custom date range

Shows activity counts:

* Infos
* Invites
* Plans
* Done
* Closings
* FG Invites
* Feel Goods
* KIV

Pipeline summary contains only:

* Tentative UV
* Strong UV
* Sureshot UV

Pipeline details:

* Sl. No.
* IR Name
* Prospect Name
* Expected UVs
* Remarks

### Team Report

* Uses the existing hierarchy.
* Supports custom reporting verticals.
* A selected vertical represents the selected user plus all descendants.
* Prevent overlapping verticals.
* Includes team activity counts and pipeline aggregation.
* Downloadable as Excel (`.xlsx`).

## User Metrics

Users have:

* Plans Shown
* DRs Hit

`plans_shown` may be incremented when a Plan is successfully created for that user.

The counter must belong to the Plan owner, not necessarily the logged-in user.

`drs_hit` remains manually editable unless explicitly defined otherwise.

## Project Structure

Use the existing structure:

`backend/internal/config`

`backend/internal/database`

`backend/internal/handlers`

`backend/internal/middleware`

`backend/internal/models`

`backend/internal/repository`

`backend/internal/routes`

`backend/internal/services`

`frontend/src/components`

`frontend/src/hooks`

`frontend/src/layouts`

`frontend/src/pages`

`frontend/src/services`

`frontend/src/types`

Do not create new folders unless required.

## Implementation Process

Before coding:

1. Read `CLAUDE.md`.
2. Read `PROJECT_STATUS.md`.
3. Inspect only files relevant to the requested milestone.
4. Reuse existing implementations and patterns.
5. Implement only the requested feature.
6. Do not rewrite working unrelated code.
7. Run the appropriate build.
8. Report changed files and build status.
9. Never commit or push the code.

If functionality is partially implemented, inspect and complete the existing implementation instead of rebuilding it.

## Code Generation

* Prefer modifying existing files.
* Do not regenerate unchanged files.
* Do not add unrelated features.
* Do not add libraries unless necessary.
* Keep functions small and readable.
* Avoid unnecessary comments.
* Prefer simple SQL.
* Use transactions only when necessary.

## Response Format

Keep responses concise.

Return:

1. Changed files
2. Implementation summary
3. Build/test status

Do not return unchanged files.

Do not provide long architecture explanations unless explicitly requested.
