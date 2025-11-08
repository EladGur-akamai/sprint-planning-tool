# Deploying to Render

This guide explains how to deploy the Sprint Planning Tool to Render with PostgreSQL database support.

## Overview

The application uses a **hybrid database approach**:
- **Local Development**: SQLite (simple, no setup)
- **Production (Render)**: PostgreSQL (persistent, reliable)

The code automatically switches between databases based on the `DATABASE_TYPE` environment variable.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Create a PostgreSQL Database

1. Log in to your Render dashboard
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `sprint-planning-db` (or any name you prefer)
   - **Database**: `sprint_planning`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 or later
   - **Plan**: **Free** (sufficient for small teams)
4. Click **Create Database**
5. Wait for the database to be created (takes ~1-2 minutes)
6. **Copy the "Internal Database URL"** from the database page (you'll need this next)

## Step 2: Deploy the Backend

1. In Render dashboard, click **New +** → **Web Service**
2. Connect your Git repository
3. Configure the service:
   - **Name**: `sprint-planning-backend`
   - **Environment**: **Node**
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. **Add Environment Variables** (click "Advanced" or "Environment"):
   ```
   DATABASE_TYPE=postgres
   DATABASE_URL=[paste the Internal Database URL from Step 1]
   NODE_ENV=production
   PORT=3001
   ```

5. Click **Create Web Service**
6. Wait for deployment to complete (~3-5 minutes)
7. **Copy the backend URL** (e.g., `https://sprint-planning-backend.onrender.com`)

## Step 3: Deploy the Frontend

1. In Render dashboard, click **New +** → **Static Site**
2. Connect your Git repository (same repo)
3. Configure:
   - **Name**: `sprint-planning-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=[paste your backend URL from Step 2]
   ```

   Example: `VITE_API_URL=https://sprint-planning-backend.onrender.com`

5. Click **Create Static Site**
6. Wait for deployment (~2-3 minutes)

## Step 4: Update Frontend API Configuration

You need to update the frontend to use the production API URL:

### Option A: Using Environment Variables (Recommended)

1. Update `frontend/src/services/api.ts`:
   ```typescript
   const API_BASE = import.meta.env.VITE_API_URL
     ? `${import.meta.env.VITE_API_URL}/api`
     : '/api';
   ```

2. In Render, set the environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

3. Redeploy the frontend

### Option B: Direct Configuration

1. Edit `frontend/src/services/api.ts`:
   ```typescript
   const API_BASE = 'https://your-backend-url.onrender.com/api';
   ```

2. Commit and push changes
3. Render will auto-deploy

## Step 5: Configure CORS

Update `backend/src/index.ts` to allow your frontend domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development
    'https://your-frontend-url.onrender.com', // Production
  ],
}));
```

Commit and push - Render will auto-deploy the backend.

## Verification

1. Visit your frontend URL (e.g., `https://sprint-planning-frontend.onrender.com`)
2. Try creating a team member
3. Create a sprint
4. Mark some holidays
5. Verify data persists after page refresh

## Important Notes

### Free Tier Limitations

- **Backend**: Spins down after 15 minutes of inactivity
  - First request after spin-down takes 30-60 seconds (cold start)
  - Subsequent requests are fast
- **Database**: 90-day expiration on free tier
  - Upgrade to paid plan ($7/month) for permanent database
- **Frontend**: Always-on (static sites don't spin down)

### Database Migrations

When you update the database schema:

1. The tables are created automatically on first run
2. For schema changes, you may need to manually update PostgreSQL:
   - Go to your database in Render
   - Click "Connect" → "External Connection"
   - Use a PostgreSQL client (e.g., pgAdmin, DBeaver, psql)
   - Run your SQL migration scripts

### Backing Up Data

**From Render Dashboard:**
1. Go to your PostgreSQL database
2. Click "Backups"
3. Free tier: Manual backups only
4. Paid tier: Automatic daily backups

**Manual Backup:**
```bash
# Get connection string from Render dashboard
pg_dump [your-database-url] > backup.sql

# Restore
psql [your-database-url] < backup.sql
```

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify `DATABASE_URL` environment variable is set
- Ensure PostgreSQL database is running

### Frontend can't connect to backend
- Check CORS configuration in backend
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure backend URL is accessible (not spun down)

### Database connection errors
- Verify `DATABASE_URL` format: `postgres://user:pass@host:port/database`
- Check PostgreSQL database status in Render
- Review backend logs for detailed error messages

### Cold start delays
- First request after 15 min inactivity takes 30-60 sec
- Consider upgrading to paid plan ($7/month) for always-on
- Or use a cron job to ping your backend every 10 minutes

## Local Development vs Production

Your `.env` file controls which database to use:

**Local Development** (`.env`):
```
DATABASE_TYPE=sqlite
PORT=3001
NODE_ENV=development
```

**Production** (Render Environment Variables):
```
DATABASE_TYPE=postgres
DATABASE_URL=postgres://...
NODE_ENV=production
PORT=3001
```

The app automatically uses the right database based on `DATABASE_TYPE`.

## Cost Summary

**Free Tier (Recommended for testing/personal use):**
- Backend: Free (spins down after 15min inactivity)
- Frontend: Free (always-on)
- PostgreSQL: Free (90-day limit)
- **Total: $0/month**

**Paid Tier (Recommended for production):**
- Backend: $7/month (always-on, faster)
- Frontend: Free
- PostgreSQL: $7/month (persistent, backups)
- **Total: $14/month**

## Next Steps

- Set up custom domain (Render supports this on all plans)
- Enable automatic deployments from GitHub
- Set up monitoring and alerts
- Consider upgrading to paid plans for production use

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- Issues? Check the [Render Status Page](https://status.render.com/)
