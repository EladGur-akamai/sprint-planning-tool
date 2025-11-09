# Sprint Planning Tool

A full-stack web application for managing sprint planning, team capacity, and holiday tracking. Built with React, TypeScript, Node.js, Express, and SQLite.

## Features

### Team Management
- Add, edit, and remove team members
- Configure member name, role, and default capacity (story points)
- View all team members in an organized table

### Sprint Management
- Create 2-week sprints with selectable start dates
- Automatic calculation of sprint end dates
- Set current active sprint
- View sprint history
- Delete sprints

### Sprint Calendar
- Interactive Sun-Thu calendar grid for 2-week sprints (Israel work week)
- Visual display of working days
- Click to toggle holidays for team members
- Color-coded indicators (green for working, red for holidays)
- Weekends (Fri-Sat) automatically excluded

### Capacity Calculation
- Automatic calculation: `(Default Capacity × Available Days) ÷ 10`
- Available days = Total working days - Holidays
- Per-member capacity breakdown
- Total team capacity summary
- Real-time updates when holidays change

### Additional Features
- Sprint history view with capacity details
- CSV export for capacity reports
- **Hybrid database support**: SQLite (local dev) or PostgreSQL (production)
- Ready for cloud deployment (Render, Heroku, etc.)
- Responsive TailwindCSS UI
- TypeScript for type safety

## Tech Stack

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **better-sqlite3** for database
- **date-fns** for date manipulation
- **CORS** enabled for API access

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development
- **TailwindCSS** for styling
- **date-fns** for date formatting
- Proxy to backend API

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

## Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd sprint-planning-tool
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on **http://localhost:3001**

### Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:3000**

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
sprint-planning-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── database/           # Database initialization
│   │   ├── models/             # Data models
│   │   ├── routes/             # API routes
│   │   └── index.ts            # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── sprint-planning.db      # SQLite database (created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions (CSV export)
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles with Tailwind
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## API Endpoints

### Team Members
- `GET /api/members` - Get all team members
- `GET /api/members/:id` - Get a specific team member
- `POST /api/members` - Create a new team member
- `PUT /api/members/:id` - Update a team member
- `DELETE /api/members/:id` - Delete a team member

### Sprints
- `GET /api/sprints` - Get all sprints
- `GET /api/sprints/current` - Get the current sprint
- `GET /api/sprints/:id` - Get a specific sprint
- `GET /api/sprints/:id/capacity` - Get capacity calculation for a sprint
- `POST /api/sprints` - Create a new sprint
- `PUT /api/sprints/:id` - Update a sprint
- `DELETE /api/sprints/:id` - Delete a sprint

### Holidays
- `GET /api/holidays/sprint/:sprintId` - Get all holidays for a sprint
- `GET /api/holidays/sprint/:sprintId/member/:memberId` - Get holidays for a member in a sprint
- `POST /api/holidays` - Create a holiday
- `POST /api/holidays/toggle` - Toggle a holiday (add/remove)
- `DELETE /api/holidays/:id` - Delete a holiday

## Usage Guide

### 1. Add Team Members

1. Navigate to **Team Management** tab
2. Click **Add Team Member**
3. Fill in:
   - Name (e.g., "John Doe")
   - Role (e.g., "Frontend Developer")
   - Default Capacity (e.g., 10 story points)
4. Click **Create**

### 2. Create a Sprint

1. Navigate to **Sprint Management** tab
2. Click **Create New Sprint**
3. Fill in:
   - Sprint Name (auto-generated, e.g., "Sprint 1")
   - Start Date (select a Sunday)
   - Check "Set as current sprint" if this is your active sprint
4. Click **Create Sprint**

The sprint will automatically run for 2 weeks (10 working days, Sun-Thu).

### 3. Mark Holidays

1. Navigate to **Dashboard** tab
2. View the sprint calendar showing all team members and working days
3. Click on any cell to toggle a holiday for that team member on that day
   - Green with ✓ = Working day
   - Red with ✗ = Holiday
4. Capacity calculations update automatically

### 4. View Capacity

The **Capacity Summary** section shows:
- Total team capacity for the sprint
- Per-member breakdown:
  - Default capacity
  - Total working days
  - Number of holidays
  - Available days
  - Calculated capacity (story points)

### 5. Export to CSV

Click **Export to CSV** in the Capacity Summary to download a CSV report of the sprint capacity.

### 6. View Sprint History

1. Navigate to **Sprint History** tab
2. Click on any sprint card to view its capacity details
3. Export historical sprint data to CSV

## Database

The application supports **two database options**:

### Local Development (SQLite)
- Uses SQLite for simple, zero-configuration local development
- Database file (`sprint-planning.db`) created automatically in `backend/` directory
- Perfect for development and testing

### Production (PostgreSQL)
- Supports PostgreSQL for cloud deployments
- Provides persistent, reliable data storage
- Required for platforms like Render, Heroku, Railway

The app automatically uses the right database based on the `DATABASE_TYPE` environment variable.

### Database Schema

**team_members**
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `role` (TEXT)
- `default_capacity` (INTEGER)
- `created_at` (DATETIME)

**sprints**
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `start_date` (TEXT)
- `end_date` (TEXT)
- `is_current` (BOOLEAN)
- `created_at` (DATETIME)

**holidays**
- `id` (INTEGER PRIMARY KEY)
- `sprint_id` (INTEGER, FOREIGN KEY)
- `member_id` (INTEGER, FOREIGN KEY)
- `date` (TEXT)

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`. Serve them with any static file server.

## Deploying to Production

The app is ready to deploy to various platforms:

### Option 1: Kubernetes (Linode LKE, AWS EKS, GKE, etc.)

**🚀 Quick Start: [QUICKSTART.md](./QUICKSTART.md)** - Deploy in 5 simple steps!

**📘 Complete Guide: [KUBERNETES_DEPLOYMENT.md](./KUBERNETES_DEPLOYMENT.md)** - Full documentation

Quick commands:
```bash
# 1. Build and push Docker images
./build-and-push.sh all

# 2. Deploy to Kubernetes
cd k8s
./deploy.sh deploy

# 3. Check status
./deploy.sh status
```

Features:
- ✅ High availability with multiple replicas
- ✅ Auto-healing and auto-scaling
- ✅ Managed PostgreSQL in cluster
- ✅ HTTPS with cert-manager
- ✅ Production-grade infrastructure

### Option 2: Render (Simple Cloud Platform)

**📘 See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for Render deployment instructions**

Quick summary:
1. **Create a PostgreSQL database** on Render
2. **Deploy backend** with environment variables:
   - `DATABASE_TYPE=postgres`
   - `DATABASE_URL=<your-postgres-url>`
   - `NODE_ENV=production`
3. **Deploy frontend** as a static site

The app automatically switches from SQLite (local) to PostgreSQL (production) based on environment variables.

## Troubleshooting

### Port Already in Use

If port 3001 (backend) or 3000 (frontend) is already in use:

**Backend**: Edit `backend/src/index.ts` and change the PORT variable
**Frontend**: Edit `frontend/vite.config.ts` and change the server port

### Database Issues

If you encounter database errors, delete `backend/sprint-planning.db` and restart the backend server to recreate a fresh database.

### CORS Errors

The backend has CORS enabled by default. If you still see CORS errors, ensure the frontend is accessing the API through the Vite proxy or update the CORS configuration in `backend/src/index.ts`.

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
