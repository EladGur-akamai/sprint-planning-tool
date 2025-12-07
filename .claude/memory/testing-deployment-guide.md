# Testing & Deployment Guide

**Last Updated:** 2025-12-07
**Feature:** Multi-Sprint Selector

## Quick Test (Local Development)

### Terminal 1 - Start Backend
```bash
cd /Users/egur/private/repos/sprint-planning-tool/backend
npm run dev
```
Backend will run on: `http://localhost:3001`

### Terminal 2 - Start Frontend
```bash
cd /Users/egur/private/repos/sprint-planning-tool/frontend
npm run dev
```
Frontend will run on: `http://localhost:3000`

### Open in Browser
Navigate to: `http://localhost:3000`

### What to Test
1. **Sprint Selector Dropdown**
   - Should appear at top of dashboard
   - Should list all your sprints
   - Current sprint should show "⭐ CURRENT"

2. **Sprint Switching**
   - Select different sprints from dropdown
   - Calendar should update to show selected sprint
   - Capacity should update

3. **Holiday Toggle**
   - Click on calendar cells to toggle holidays
   - Should work on any selected sprint (not just current)

4. **Existing Features**
   - Team Management should still work
   - Sprint Management should still work
   - Sprint History should still work

---

## Deployment to Kubernetes

The build completed successfully! Here's how to deploy:

### Option A: Deploy Everything (Recommended)

```bash
cd /Users/egur/private/repos/sprint-planning-tool/k8s

# Set your Docker Hub username
export DOCKER_USER=your-dockerhub-username

# Build, push, and deploy
./deploy.sh all
```

This will:
1. Build Docker images for frontend and backend
2. Push to Docker Hub
3. Deploy to Kubernetes
4. Show deployment status

### Option B: Deploy Only Frontend (Faster)

Since only frontend changed, you can deploy just that:

```bash
cd /Users/egur/private/repos/sprint-planning-tool

# Build and push frontend image
docker build -t $DOCKER_USER/sprint-planning-frontend:latest ./frontend
docker push $DOCKER_USER/sprint-planning-frontend:latest

# Restart frontend pods to pull new image
kubectl rollout restart deployment frontend -n sprint-planning

# Watch the rollout
kubectl rollout status deployment frontend -n sprint-planning
```

### Option C: Use Existing Deployment Script

```bash
cd /Users/egur/private/repos/sprint-planning-tool/k8s

# Build images
DOCKER_USER=your-username ./deploy.sh build

# Push to registry
DOCKER_USER=your-username ./deploy.sh push

# Deploy to cluster
./deploy.sh deploy

# Check status
./deploy.sh status
```

---

## Verify Deployment

### Check Pods
```bash
kubectl get pods -n sprint-planning
```

All pods should show `Running` status.

### Check Services
```bash
kubectl get svc -n sprint-planning
```

### Get Application URL
```bash
kubectl get ingress -n sprint-planning
```

Look for the external IP and access: `http://<EXTERNAL-IP>`

### View Logs
```bash
# Frontend logs
kubectl logs -n sprint-planning -l app=frontend -f

# Backend logs
kubectl logs -n sprint-planning -l app=backend -f
```

---

## Troubleshooting

### Build Failed
```bash
# Check for syntax errors
cd frontend
npx tsc --noEmit
```

### Docker Push Failed
- Verify you're logged in: `docker login`
- Check DOCKER_USER is set correctly

### Pods Not Starting
```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n sprint-planning

# Check logs
kubectl logs <pod-name> -n sprint-planning
```

### Feature Not Showing
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify new image was pulled:
   ```bash
   kubectl describe pod <frontend-pod> -n sprint-planning | grep Image
   ```

---

## Rollback Plan

If something goes wrong:

### Rollback Kubernetes Deployment
```bash
kubectl rollout undo deployment frontend -n sprint-planning
```

### Rollback Code Changes
```bash
cd /Users/egur/private/repos/sprint-planning-tool
git checkout main -- frontend/src/App.tsx
git checkout main -- frontend/src/components/SprintSelector.tsx
```

---

## What Changed

**Files Modified:**
- `frontend/src/App.tsx` - State management for sprint selection
- `frontend/src/components/SprintSelector.tsx` - New dropdown component

**Files Unchanged:**
- Backend (no changes needed)
- Database (no migrations needed)
- Other frontend components

**Build Output:**
- Frontend build: ✅ Success (196.70 kB JS, 15.53 kB CSS)
- TypeScript compilation: ✅ No errors