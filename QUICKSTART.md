# Quick Start Guide - Deploy to Kubernetes

This guide shows you how to deploy the Sprint Planning Tool to your Linode Kubernetes cluster in 5 simple steps.

## Prerequisites

✅ Linode Kubernetes cluster created and running
✅ `kubectl` installed and configured
✅ Docker installed and running
✅ Docker Hub account (username: dambo14)

## Step 1: Build and Push Docker Images

From the project root directory:

```bash
# Make sure you're in the project root
cd /Users/egur/private/repos/sprint-planning-tool

# Run the build script
./build-and-push.sh all
```

**What this does:**
- ✅ Builds backend Docker image
- ✅ Builds frontend Docker image
- ✅ Pushes both images to Docker Hub (dambo14/...)
- ✅ Automatically updates Kubernetes manifests with image names

**Time:** ~5-10 minutes (depending on your internet speed)

**Output:** You'll see green checkmarks and image names when successful.

---

## Step 2: Configure Secrets

Edit the Kubernetes manifests to set secure passwords:

### Update PostgreSQL Password

Edit `k8s/postgres.yaml`:

```yaml
# Find this section (around line 18):
stringData:
  POSTGRES_PASSWORD: "ChangeThisPassword123!"  # <- Change this!
```

Change `"ChangeThisPassword123!"` to a strong password.

### Update Backend Database URL

Edit `k8s/backend.yaml`:

```yaml
# Find this section (around line 18):
stringData:
  DATABASE_URL: "postgres://sprintuser:ChangeThisPassword123!@postgres-service:5432/sprint_planning"
  #                                      ^^^^^^^^^^^^^^^^^^
  #                                      Must match the password above!
```

Replace `ChangeThisPassword123!` with the SAME password you set in postgres.yaml.

---

## Step 3: Deploy to Kubernetes

```bash
cd k8s

# Deploy everything
./deploy.sh deploy
```

**What this does:**
- ✅ Creates namespace
- ✅ Deploys PostgreSQL with persistent storage
- ✅ Deploys backend (2 replicas)
- ✅ Deploys frontend (2 replicas)
- ✅ Sets up ingress for external access
- ✅ Waits for all pods to be ready

**Time:** ~3-5 minutes

**Expected output:**
```
[INFO] Deploying to Kubernetes...
[INFO] Deployment complete!
[INFO] Waiting for pods to be ready...
[INFO] All pods are ready!
```

---

## Step 4: Check Status

```bash
# Still in the k8s directory
./deploy.sh status
```

**What you'll see:**
```
Pods:
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxxxx               1/1     Running   0          2m
backend-yyyyy               1/1     Running   0          2m
frontend-xxxxx              1/1     Running   0          2m
frontend-yyyyy              1/1     Running   0          2m
postgres-xxxxx              1/1     Running   0          2m

Services:
NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)
backend-service    ClusterIP   10.128.xxx.xxx   <none>        3001/TCP
frontend-service   ClusterIP   10.128.xxx.xxx   <none>        80/TCP
postgres-service   ClusterIP   10.128.xxx.xxx   <none>        5432/TCP

Ingress:
NAME                       CLASS   HOSTS                          ADDRESS
sprint-planning-ingress    nginx   sprint-planning.yourdomain.com 123.45.67.89

External Access:
Access your application at: http://123.45.67.89
```

**Copy the External IP address!**

---

## Step 5: Access Your Application

### Option A: Access via IP (Quick Test)

Open your browser and go to the External IP:
```
http://123.45.67.89
```

### Option B: Set up Domain (Production)

1. **Point your domain to the IP:**
   - Go to your DNS provider (Namecheap, Cloudflare, etc.)
   - Create an A record:
     - Host: `sprint-planning` (or `@` for root domain)
     - Value: `123.45.67.89` (your LoadBalancer IP)
     - TTL: 300 (5 minutes)

2. **Update the ingress:**

   Edit `k8s/ingress.yaml`:
   ```yaml
   rules:
   - host: sprint-planning.yourdomain.com  # Change this
   ```

3. **Reapply ingress:**
   ```bash
   kubectl apply -f ingress.yaml
   ```

4. **Wait for DNS** (5-30 minutes) and access:
   ```
   http://sprint-planning.yourdomain.com
   ```

---

## Verification Checklist

Test that everything works:

- [ ] **Access the app** - Homepage loads
- [ ] **Add a team member** - Go to Team Management tab
- [ ] **Create a sprint** - Go to Sprint Management tab
- [ ] **Mark holidays** - Click on calendar cells
- [ ] **Refresh the page** - Data persists
- [ ] **Restart backend pods** and verify data still there:
  ```bash
  kubectl delete pod -n sprint-planning -l app=backend
  # Wait 30 seconds
  # Refresh browser - data should still be there
  ```

---

## All Scripts Reference

Here's what each script does:

### `./build-and-push.sh`
**Location:** Project root
**Purpose:** Build and push Docker images

```bash
./build-and-push.sh all        # Build and push everything
./build-and-push.sh backend    # Only backend
./build-and-push.sh frontend   # Only frontend
```

### `k8s/deploy.sh`
**Location:** k8s directory
**Purpose:** Deploy and manage Kubernetes resources

```bash
./deploy.sh deploy    # Deploy everything
./deploy.sh status    # Check status
./deploy.sh logs      # View logs
./deploy.sh delete    # Delete everything (careful!)
```

---

## Common Commands

### View Logs
```bash
cd k8s
./deploy.sh logs
# Select: 1 (Backend), 2 (Frontend), 3 (PostgreSQL), or 4 (All)
```

### Scale Up/Down
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend -n sprint-planning --replicas=3

# Scale frontend to 3 replicas
kubectl scale deployment frontend -n sprint-planning --replicas=3
```

### Update Application
```bash
# 1. Make code changes
# 2. Build and push new images
./build-and-push.sh all

# 3. Restart pods to use new images
kubectl rollout restart deployment backend -n sprint-planning
kubectl rollout restart deployment frontend -n sprint-planning
```

### Backup Database
```bash
# Get postgres pod name
POSTGRES_POD=$(kubectl get pod -n sprint-planning -l app=postgres -o jsonpath="{.items[0].metadata.name}")

# Create backup
kubectl exec -n sprint-planning $POSTGRES_POD -- pg_dump -U sprintuser sprint_planning > backup-$(date +%Y%m%d).sql

echo "Backup saved to: backup-$(date +%Y%m%d).sql"
```

---

## Troubleshooting

### Pods not starting
```bash
# Check pod details
kubectl describe pod -n sprint-planning <pod-name>

# Check logs
kubectl logs -n sprint-planning <pod-name>
```

### Can't access application
```bash
# Check ingress
kubectl get ingress -n sprint-planning

# Check nginx ingress controller
kubectl get pods -n ingress-nginx

# Check if LoadBalancer has external IP
kubectl get svc -n ingress-nginx
```

### Database errors
```bash
# Check PostgreSQL pod
kubectl logs -n sprint-planning -l app=postgres

# Connect to PostgreSQL (for debugging)
kubectl exec -it -n sprint-planning <postgres-pod> -- psql -U sprintuser sprint_planning
```

---

## Complete Deployment Flow

**First time deployment:**
```bash
# 1. Build and push images (project root)
./build-and-push.sh all

# 2. Configure secrets
vim k8s/postgres.yaml    # Update password
vim k8s/backend.yaml     # Update DATABASE_URL

# 3. Deploy (in k8s directory)
cd k8s
./deploy.sh deploy

# 4. Check status
./deploy.sh status

# 5. Access application
# Use the External IP shown
```

**Updating application after code changes:**
```bash
# 1. Build and push new images (project root)
./build-and-push.sh all

# 2. Restart deployments (in k8s directory)
cd k8s
kubectl rollout restart deployment backend -n sprint-planning
kubectl rollout restart deployment frontend -n sprint-planning

# 3. Verify
./deploy.sh status
```

---

## Next Steps

Once your app is running:

1. ✅ **Set up HTTPS** - See `KUBERNETES_DEPLOYMENT.md` for cert-manager setup
2. ✅ **Configure backups** - Set up automated PostgreSQL backups
3. ✅ **Set up monitoring** - Add Prometheus & Grafana
4. ✅ **Configure autoscaling** - HPA for backend/frontend
5. ✅ **Set up CI/CD** - Automate builds and deployments

---

## Getting Help

- **Kubernetes issues:** See `KUBERNETES_DEPLOYMENT.md`
- **Application issues:** Check logs with `./deploy.sh logs`
- **Docker issues:** Ensure Docker is running and you're logged in

## Summary

```bash
# Quick deployment in 3 commands:

# 1. Build and push
./build-and-push.sh all

# 2. Deploy
cd k8s && ./deploy.sh deploy

# 3. Check status
./deploy.sh status

# Done! Access via the External IP shown.
```
