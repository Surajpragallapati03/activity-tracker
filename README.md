# Activity Tracker

Internal activity tracker for a team of fewer than 50 users.

## Project Overview

Activity Tracker is a web application for managing the business flow of info gathering, invitations, plans, closings, feel-good invites, and feel-good/KIV tracking. The application supports a hierarchical team structure with role-based access control (Admin, Upline, IR - Independent Distributor).

### Business Flow

```
Info → Invite → Plan → Closing → FG Invite → Feel Good / KIV
```

## Architecture Overview

```
Frontend (React + Vite)
        ↓
API Client (Axios)
        ↓
Backend (Go + Gin)
        ↓
Authentication (JWT)
        ↓
Authorization (Role-based)
        ↓
Services (Business Logic)
        ↓
Repository (Database Access)
        ↓
PostgreSQL
```

## Prerequisites

### System Requirements

- **Go** 1.25.0 or later ([download](https://golang.org/dl/))
- **Node.js** 18+ and **npm** 10+ ([download](https://nodejs.org/))
- **PostgreSQL** 17 (via Docker or locally installed)
- **Docker** and **Docker Compose** (for local PostgreSQL)

### Verify Versions

```bash
go version        # Should show go1.25.0 or later
node --version    # Should show v18.0.0 or later
npm --version     # Should show 10.0.0 or later
docker --version
docker-compose --version
```

## Repository Structure

```
activity-tracker/
├── backend/
│   ├── cmd/server/
│   │   └── main.go              # Application entry point
│   ├── internal/
│   │   ├── config/              # Configuration loading
│   │   ├── database/            # Database connection & migrations
│   │   ├── handlers/            # HTTP request handlers
│   │   ├── middleware/          # JWT, CORS middleware
│   │   ├── models/              # Data models
│   │   ├── repository/          # Database access layer
│   │   ├── routes/              # Route definitions
│   │   └── services/            # Business logic
│   ├── migrations/              # Database migrations
│   ├── .env                     # Backend environment variables
│   ├── Makefile                 # Database migration commands
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── layouts/             # Layout components
│   │   ├── services/            # API client
│   │   ├── types/               # TypeScript types
│   │   ├── context/             # React context (auth)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── assets/              # Static assets
│   │   └── App.tsx              # Root component
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.local               # Frontend environment variables
├── docker-compose.yml           # Local PostgreSQL setup
└── CLAUDE.md                    # Project guidelines
```

## Local Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Surajpragallapati03/activity-tracker.git
cd activity-tracker
```

### 2. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This starts a PostgreSQL 17 container with:
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `activity_tracker`

**Verify the connection:**

```bash
psql -h localhost -U postgres -d activity_tracker
# Type \q to quit
```

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

#### Create `.env` File

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=activity_tracker

# Server Configuration
PORT=8080
ENV=development

# Default Admin User (seeded automatically on startup)
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_IR_ID=ADMIN001
DEFAULT_ADMIN_PHONE=+1234567890

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# Frontend URL (for OAuth redirect and CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-secure-random-access-secret
JWT_REFRESH_SECRET=your-secure-random-refresh-secret

# JWT Expiry (duration format: 15m, 168h, etc.)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h
```

#### Environment Variable Details

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | No |
| `DB_PORT` | PostgreSQL port | `5432` | No |
| `DB_USER` | PostgreSQL user | `postgres` | No |
| `DB_PASSWORD` | PostgreSQL password | `postgres` | No |
| `DB_NAME` | PostgreSQL database | `activity_tracker` | No |
| `PORT` | Backend server port | `8080` | No |
| `ENV` | Environment (development/production) | `development` | No |
| `DEFAULT_ADMIN_NAME` | Default admin user name | Empty | Optional |
| `DEFAULT_ADMIN_EMAIL` | Default admin user email | Empty | Optional |
| `DEFAULT_ADMIN_IR_ID` | Default admin IR ID | Empty | Optional |
| `DEFAULT_ADMIN_PHONE` | Default admin phone | Empty | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Empty | Required for OAuth login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Empty | Required for OAuth login |
| `GOOGLE_REDIRECT_URL` | Google OAuth redirect URI | Empty | Required for OAuth login |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` | No |
| `JWT_ACCESS_SECRET` | JWT access token signing secret | Empty | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token signing secret | Empty | Required |
| `JWT_ACCESS_EXPIRY` | Access token expiration | `15m` | No |
| `JWT_REFRESH_EXPIRY` | Refresh token expiration | `168h` | No |

#### Generate JWT Secrets

Generate secure random secrets for JWT:

```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows (using PowerShell)
[Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)}))
```

### 4. Start Backend

From the `backend/` directory:

```bash
go run ./cmd/server/main.go
```

The backend will:
1. Load environment variables from `.env`
2. Connect to PostgreSQL
3. Run database migrations automatically
4. Seed default admin user (if `DEFAULT_ADMIN_EMAIL` is provided)
5. Start listening on `http://localhost:8080`

Expected output:
```
Connecting to database...
Database connected successfully
Running migrations...
Database migrations completed successfully
Checking default admin...
Default admin created successfully.
Starting HTTP server on :8080
```

### 5. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

#### Create `.env.local` File

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:8080
```

### 6. Start Frontend

From the `frontend/` directory:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` and automatically open in your browser.

## Accessing the Application

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`

## PostgreSQL / Database

### Docker Compose

The `docker-compose.yml` includes a PostgreSQL 17 service. Start it:

```bash
docker-compose up -d
```

### Database Migrations

Migrations run **automatically** when the backend starts. The backend uses `golang-migrate` to:

1. Connect to PostgreSQL
2. Check for pending migrations in `backend/migrations/`
3. Apply any new migrations
4. Log success or indicate the database is already up-to-date

**Manual Migration Commands** (from `backend/` directory):

```bash
# Apply all pending migrations
make migrate-up

# Rollback the last migration
make migrate-down
```

These commands require the `migrate` CLI tool:

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### Database Schema

The application uses the following tables:

- **users** — Team members (Admin, Upline, IR)
- **infos** — Prospect information
- **invites** — Meeting invitations
- **plans** — Prospect plans
- **closings** — Deal closings
- **fg_invites** — Feel-good meeting invitations
- **feel_goods** — Feel-good / KIV entries

## Default Admin Seeding

The backend automatically creates a default admin user on startup if `DEFAULT_ADMIN_EMAIL` is set in `.env`.

### How It Works

1. Backend startup calls `database.SeedDefaultAdmin()`
2. Checks if a user with `DEFAULT_ADMIN_EMAIL` already exists
3. If not, creates a new user with role `admin` and status `active`
4. Idempotent: Running the backend multiple times does NOT create duplicate admins

### Configuration

Set in `.env`:

```env
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_IR_ID=ADMIN001
DEFAULT_ADMIN_PHONE=+1234567890
```

If `DEFAULT_ADMIN_EMAIL` is empty, admin seeding is skipped.

## Google OAuth Local Setup

### 1. Create a Google OAuth 2.0 Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Create OAuth 2.0 credentials:
   - Type: **Web Application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:8080/auth/google/callback`

### 2. Copy Credentials

From the Google Cloud Console, copy:
- **Client ID**
- **Client Secret**

### 3. Update Backend `.env`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 4. Testing Google OAuth Locally

1. Visit `http://localhost:5173/login`
2. Click "Sign in with Google"
3. You'll be redirected to Google's login page
4. After login, you'll be redirected back to the application
5. **Note**: Only existing users in the database can log in. New users are rejected for security.

## JWT Configuration

### Access Token vs. Refresh Token

- **Access Token**: Short-lived (default 15 minutes), used for API requests
- **Refresh Token**: Long-lived (default 168 hours / 7 days), used to get a new access token

### Configuring Expiry

In `.env`:

```env
JWT_ACCESS_EXPIRY=15m    # Access token expires in 15 minutes
JWT_REFRESH_EXPIRY=168h  # Refresh token expires in 7 days
```

Valid duration formats: `30s`, `5m`, `2h`, `24h`, `168h`, etc.

### Generating Secrets

Both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be present. Generate them:

```bash
# Generate a 32-byte hex string for each secret
openssl rand -hex 32
```

Example output:
```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

### How JWT Works in the Application

1. **User logs in** → Backend generates access + refresh tokens
2. **Frontend stores tokens** in localStorage
3. **API requests** include access token in `Authorization: Bearer <token>` header
4. **Token expires** → Frontend automatically refreshes using refresh token
5. **Refresh token expires** → User must log in again

See `frontend/src/services/api.ts` for the refresh mechanism.

## Starting the Application Locally

### Terminal 1: PostgreSQL

```bash
docker-compose up
```

Or, if already running in background:
```bash
docker-compose ps  # Check status
```

### Terminal 2: Backend

```bash
cd backend
go run ./cmd/server/main.go
```

Wait for:
```
Starting HTTP server on :8080
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev
```

Wait for:
```
VITE v8.2.0  ready in 123 ms

➜  Local:   http://localhost:5173/
```

### Browser

Visit `http://localhost:5173` and log in with Google or your default admin account.

## Build & Compile

### Build Backend Binary

From `backend/` directory:

```bash
go build -o ./bin/server ./cmd/server/main.go
```

This creates an executable at `backend/bin/server`.

### Build Frontend

From `frontend/` directory:

```bash
npm run build
```

This creates optimized files in `frontend/dist/`.

## Local Testing Flow

### 1. Login

- Visit `http://localhost:5173/login`
- Sign in with Google OAuth or use default admin credentials

### 2. Dashboard

- View the dashboard (read-only summary)
- Verify the current user and role

### 3. Users

- Create a new user (all authenticated users can create users)
- Edit user details
- Promote IR to Upline (admin only)
- Delete users (admin only, with hierarchy reparenting)

### 4. Infos

- Create prospect information
- Search by prospect name
- Filter by owner (hierarchy-aware)
- Edit remarks and status
- Pagination (20 items per page)

### 5. Invites

- Create meeting invitations from existing infos
- Set meeting date, time, mode (Online/Offline)
- Edit meeting details
- Delete invitations
- View prospect information from linked info

### 6. Plans

- Create plans from existing invites
- Set UL1, UL2, quoted amount, expected UV
- Edit plan details
- Hierarchy-aware access (admin can edit any plan, upline can edit downlines' plans, IR can edit their own)

### 7. Closings

- Record deal closings from existing plans
- Update closing status and remarks
- View related plan information
- Hierarchy-aware access

### 8. FG Invites

- Create feel-good invitations from existing closings
- Set meeting date and time
- Edit meeting details
- View closing and prospect information

### 9. Feel Goods

- Record feel-good / KIV entries from existing FG invites
- Set UL1 and UL2 (mandatory fields)
- Update status and remarks
- View related information hierarchy

## Troubleshooting

### Backend Not Starting

**Error**: `Failed to load config: required environment variable missing`

**Solution**: Ensure `.env` file exists in `backend/` with all required variables (especially JWT secrets).

```bash
cd backend
ls -la .env   # Verify the file exists
```

**Error**: `Failed to connect to database: connection refused`

**Solution**: PostgreSQL is not running. Start Docker Compose:

```bash
docker-compose up -d
docker-compose ps  # Verify postgres is running
```

### Database Connection Failure

**Error**: `Connection refused at localhost:5432`

**Solution**: Verify PostgreSQL container is running:

```bash
docker-compose logs postgres  # View logs
docker-compose restart postgres
```

### Migration Failure

**Error**: `Failed to run migrations: no change`

**Solution**: Migrations have already been applied. This is not an error. The backend continues normally.

**Error**: `Failed to run migrations: migration file not found`

**Solution**: Ensure migrations are in `backend/migrations/`. They should be auto-discovered when the backend starts.

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Verify `FRONTEND_URL` in backend `.env`:

```env
FRONTEND_URL=http://localhost:5173  # Must match frontend URL
```

Then restart the backend.

### Google OAuth Redirect Mismatch

**Error**: `Error 400: redirect_uri_mismatch`

**Solution**: Verify in Google Cloud Console:
- **Authorized Redirect URIs** includes: `http://localhost:8080/auth/google/callback`
- **Authorized JavaScript Origins** includes: `http://localhost:5173`

### JWT / Authentication Errors

**Error**: `Failed to seed default admin: empty JWT secrets`

**Solution**: Generate JWT secrets in `.env`:

```env
JWT_ACCESS_SECRET=<32-byte-hex-string>
JWT_REFRESH_SECRET=<32-byte-hex-string>
```

Generate with:
```bash
openssl rand -hex 32
```

**Error**: `401 Unauthorized on API requests`

**Solution**: 
- Verify access token is stored in localStorage
- Check that token is not expired
- Inspect network requests in browser DevTools to see `Authorization` header

### Frontend Unable to Reach Backend

**Error**: `Cannot POST http://localhost:8080/auth/refresh`

**Solution**: Verify `VITE_API_URL` in `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080  # Must match backend URL
```

**Error**: `Network error: localhost:8080 not found`

**Solution**: Verify backend is running:

```bash
curl http://localhost:8080/health  # If health endpoint exists
ps aux | grep "go run"
```

## Additional Resources

- [CLAUDE.md](./CLAUDE.md) — Project guidelines and conventions
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Current implementation status
- [Go Documentation](https://golang.org/doc/)
- [React Documentation](https://react.dev/)
- [Gin Framework](https://gin-gonic.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For development questions or issues, refer to:
1. `CLAUDE.md` for project conventions
2. `PROJECT_STATUS.md` for what's implemented
3. Backend logs: Check `backend/` console output
4. Frontend logs: Check browser DevTools Console
5. Database: Use `psql` to inspect data directly
