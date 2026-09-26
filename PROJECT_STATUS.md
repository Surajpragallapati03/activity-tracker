# Activity Tracker - Project Status

## Project

Internal activity tracker for a team of fewer than 50 users.

## Stack

- Backend: Go 1.24, Gin, PostgreSQL, golang-migrate, JWT, Google OAuth
- Frontend: React, TypeScript, Vite, Tailwind, React Router, TanStack Query/Table, Axios, shadcn/ui
- Production: Vercel + Render + Neon PostgreSQL

## Production

- Frontend: https://activity-tracker-xi-inky.vercel.app
- Backend: https://activity-tracker-api-ufap.onrender.com
- Google OAuth: Working
- Neon PostgreSQL: Production database
- Default Admin: Seeded
- Backend health check: Working
- Vercel SPA routing: Fixed
- Production smoke testing: Completed

## Completed

- Authentication: Google OAuth + IR ID/password
- User management and hierarchy
- Infos
- Invites
- Plans
- Closings
- FG Invites
- Feel Goods
- Dashboard metrics
- Pipeline Updates
- KIV
- Individual Reports
- Team Reports
- Excel/CSV/PDF exports
- Light/Dark/System theme
- Profile/password management
- Plans Shown and DRs Hit metrics
- Production deployment

## Daily Updates

**Status: In progress**

Daily Updates is a bulk-entry convenience page over the existing six activities.

It is NOT a new activity type and must NOT create a separate activity table.

### General Rules

- User can select any past, current, or future date.
- Selected date represents the Daily Updates activity/update date.
- Show only the logged-in user's own activities.
- Existing records for the selected date are loaded.
- Multiple rows can be added where existing activity rules permit.
- Existing records can be edited and deleted.
- New records can be added.
- One Save Daily Updates action persists all changes.
- Save must use one backend request and one database transaction.
- Any failure rolls back the entire save.
- Existing activity pages must remain unchanged.
- Preserve existing activity authorization, validation, relationships, and business logic.
- Prospect names must be displayed instead of UUIDs/IR IDs.

### Activity Dates

| Activity | Date |
|---|---|
| Info | Daily Updates date |
| Invite | Meeting Date defaults to Daily Updates date but is independently editable |
| Plan | Daily Updates date |
| Closing | Daily Updates date |
| FG Invite | Meeting Date defaults to Daily Updates date but is independently editable |
| Feel Good | Daily Updates date |

`created_at` is not relevant to Daily Updates date handling.

### Activity Eligibility

Preserve the existing activity progression:

Info → Invite → Plan → Closing → FG Invite → Feel Good

Daily Updates selection lists must use the existing activity eligibility rules and only show the logged-in user's eligible records.

- Invite → user's eligible Infos
- Plan → user's eligible Invites
- Closing → user's eligible Plans
- FG Invite → user's eligible Closings
- Feel Good → user's eligible FG Invites

Do not show downline, upline, or other IR records simply because the user can view them elsewhere.

### Activity Forms

Daily Updates should provide the same relevant fields, options, validation, and business behavior as the existing activity forms.

Do not create alternate business rules.

### Plan Rules

New Plans created through Daily Updates must preserve existing behavior:

- `pipeline_status = tentative`
- `plans_shown` increments once after successful creation
- Updates do not increment `plans_shown`

### CRUD

- Existing records use their existing IDs.
- New rows are created normally.
- Existing rows can be edited.
- Existing rows marked for deletion are deleted when the transaction commits.
- New unsaved rows removed before Save do not require database deletion.

### Scope

Daily Updates only.

Do not implement:
- Telegram
- Plan Scheduler
- Meeting Attendance

## Current Next Step

Complete and stabilize Daily Updates:

1. Implement the finalized activity/eligibility rules above.
2. Ensure user-specific records and prospect selection.
3. Ensure correct date handling.
4. Ensure create/update/delete work transactionally.
5. Polish the Daily Updates UI.
6. Verify all six activity types.
7. Run backend/frontend builds and regression checks.