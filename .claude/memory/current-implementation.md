# Current Implementation Status

**Last Updated:** 2025-12-07

## Project Overview

mTeam Extreme is a full-stack web application for managing sprint planning, team capacity, and holiday tracking. Built for Israeli work weeks (Sunday-Thursday).

## Technology Stack

### Backend
- **Runtime:** Node.js with Express
- **Language:** TypeScript 5.3.3
- **Database:** Hybrid support
  - SQLite (better-sqlite3) - Local development
  - PostgreSQL (pg) - Production deployment
- **Dependencies:**
  - express 4.18.2
  - cors 2.8.5
  - dotenv 16.3.1
  - date-fns 3.0.6
- **Dev Dependencies:**
  - tsx 4.7.0 (for watch mode)
  - TypeScript type definitions

### Frontend
- **Framework:** React 18.2.0
- **Language:** TypeScript 5.3.3
- **Build Tool:** Vite 5.0.11
- **Styling:** TailwindCSS 3.4.1
- **Dependencies:**
  - react-dom 18.2.0
  - date-fns 3.0.6
- **Dev Dependencies:**
  - @vitejs/plugin-react 4.2.1
  - PostCSS 8.4.33
  - Autoprefixer 10.4.16

## Architecture

### Database Layer
- **Configuration:** `backend/src/database/config.ts` - Environment-based configuration
- **Abstraction:** `backend/src/database/db.ts` - Unified database interface
- **Implementations:**
  - SQLite: `backend/src/database/sqlite.ts`
  - PostgreSQL: `backend/src/database/postgres.ts`
- **Queries:** `backend/src/database/queries.ts` - Database-agnostic query layer

### Backend Structure
```
backend/src/
├── index.ts                 # Express app entry point
├── controllers/             # Request handlers
│   ├── teamMemberController.ts
│   ├── sprintController.ts
│   └── holidayController.ts
├── routes/                  # API route definitions
│   ├── teamMemberRoutes.ts
│   ├── sprintRoutes.ts
│   └── holidayRoutes.ts
├── models/                  # Data models
│   ├── TeamMember.ts
│   ├── Sprint.ts
│   └── Holiday.ts
└── database/                # Database layer
    ├── config.ts
    ├── db.ts
    ├── sqlite.ts
    ├── postgres.ts
    └── queries.ts
```

### Frontend Structure
```
frontend/src/
├── main.tsx                 # React entry point
├── App.tsx                  # Main application component
├── components/              # React components
│   ├── TeamManagement.tsx
│   ├── SprintManagement.tsx
│   ├── SprintSelector.tsx   # Sprint dropdown selector (NEW)
│   ├── SprintCalendar.tsx
│   ├── CapacitySummary.tsx
│   └── SprintHistory.tsx
├── services/                # API service layer
│   └── api.ts
├── types/                   # TypeScript definitions
│   └── index.ts
└── utils/                   # Utility functions
    └── csvExport.ts
```

## Features Implemented

### 1. Team Management
- CRUD operations for team members
- Configurable fields:
  - Name
  - Role
  - Default capacity (story points)
- Organized table view

### 2. Sprint Management
- Create 2-week sprints with custom start dates
- Automatic end date calculation
- Set current active sprint
- Sprint history view
- Delete sprints functionality

### 3. Sprint Calendar
- **Sprint selector dropdown** - View and edit any sprint (past, current, or future)
- Default selection shows current active sprint
- Interactive Sun-Thu calendar grid (Israeli work week)
- 2-week sprint visualization
- Holiday toggle per team member per day
- Color-coded indicators:
  - Green (✓) = Working day
  - Red (✗) = Holiday
  - Blue = Today
- Automatic weekend exclusion (Friday-Saturday)
- "CURRENT SPRINT" badge on active sprint

### 4. Capacity Calculation
- Formula: `(Default Capacity × Available Days) ÷ 10`
- Available days = Total working days - Holidays
- Per-member capacity breakdown
- Total team capacity summary
- Real-time updates on holiday changes

### 5. Data Export
- CSV export for capacity reports
- Sprint history with capacity details

### 6. UI/UX
- Responsive TailwindCSS design
- Tab-based navigation:
  - Dashboard (with sprint selector)
  - Team Management
  - Sprint Management
- Loading states
- Error handling
- Health check endpoint (`/api/health`)
- Brand: "Team Extreme"

## API Endpoints

### Team Members
- `GET /api/members` - List all team members
- `GET /api/members/:id` - Get specific team member
- `POST /api/members` - Create team member
- `PUT /api/members/:id` - Update team member
- `DELETE /api/members/:id` - Delete team member

### Sprints
- `GET /api/sprints` - List all sprints
- `GET /api/sprints/current` - Get current sprint
- `GET /api/sprints/:id` - Get specific sprint
- `GET /api/sprints/:id/capacity` - Get sprint capacity calculation
- `POST /api/sprints` - Create sprint
- `PUT /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint

### Holidays
- `GET /api/holidays/sprint/:sprintId` - Get all holidays for a sprint
- `GET /api/holidays/sprint/:sprintId/member/:memberId` - Get member holidays
- `POST /api/holidays` - Create holiday
- `POST /api/holidays/toggle` - Toggle holiday (add/remove)
- `DELETE /api/holidays/:id` - Delete holiday

## Database Schema

### team_members
- `id` INTEGER PRIMARY KEY
- `name` TEXT
- `role` TEXT
- `default_capacity` INTEGER
- `created_at` DATETIME

### sprints
- `id` INTEGER PRIMARY KEY
- `name` TEXT
- `start_date` TEXT
- `end_date` TEXT
- `is_current` BOOLEAN
- `created_at` DATETIME

### holidays
- `id` INTEGER PRIMARY KEY
- `sprint_id` INTEGER (FOREIGN KEY)
- `member_id` INTEGER (FOREIGN KEY)
- `date` TEXT

## Deployment Options

### 1. Kubernetes (Current)
- Namespace: `sprint-planning`
- Components:
  - Backend deployment
  - Frontend deployment
  - External Akamai managed PostgreSQL
  - Ingress configuration
- Scripts:
  - `k8s/deploy.sh` - Deployment automation
  - `build-and-push.sh` - Docker image building
- Dockerfiles available for both frontend and backend

### 2. Cloud Platforms (Supported)
- Render
- Heroku
- Railway
- Any platform supporting Node.js and PostgreSQL

## Configuration

### Backend Environment Variables
- `DATABASE_TYPE` - "sqlite" or "postgres"
- `DATABASE_URL` - PostgreSQL connection string (production)
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default: 3001)

### Frontend Development
- Vite proxy configured for backend API
- Development port: 3000
- Production: Static file serving

## Build & Run

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Production
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve dist/ folder with static file server
```

## Current Deployment Status
- Kubernetes deployment configured
- Using external Akamai managed PostgreSQL
- Dockerized frontend and backend
- Ingress configured for external access
- Deployment script ready (`k8s/deploy.sh`)

## Known Issues/Notes
- Typo in `k8s/deploy.sh:87` - "tieout" should be "timeout"
- Docker username placeholder in deploy script
- PostgreSQL configuration managed externally (Akamai)