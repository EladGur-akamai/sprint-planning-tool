# Kubernetes Deployment Guide (Linode LKE)

This guide walks you through deploying the Sprint Planning Tool to a Kubernetes cluster on Linode (LKE).

## Prerequisites

1. **Linode Account** with a Kubernetes cluster created
2. **kubectl** installed and configured
3. **Docker** installed locally
4. **Linode CLI** (optional, for easier management)
5. **A container registry** (Docker Hub, GitHub Container Registry, or Linode's registry)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Ingress (Nginx)                 │
│    sprint-planning.yourdomain.com       │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   ┌────▼────┐         ┌─────▼──────┐
   │Frontend │         │  Backend   │
   │(Nginx)  │         │  (Node.js) │
   │2 replicas│         │ 2 replicas │
   └─────────┘         └─────┬──────┘
                             │
                       ┌─────▼──────┐
                       │ PostgreSQL │
                       │ (Persistent)│
                       └────────────┘
```

## Step 1: Set Up Linode Kubernetes Cluster

### Create LKE Cluster (via Linode Cloud Manager)

1. Log in to [Linode Cloud Manager](https://cloud.linode.com)
2. Click **Kubernetes** → **Create Cluster**
3. Configure:
   - **Cluster Label**: `sprint-planning-cluster`
   - **Region**: Choose closest to your users
   - **Kubernetes Version**: Latest stable (1.28+)
   - **Node Pools**:
     - 2-3 nodes × **Linode 4GB** (recommended)
     - Or 2-3 nodes × **Linode 2GB** (minimum)
4. Click **Create Cluster**
5. Wait for cluster to provision (~5-10 minutes)

### Configure kubectl

1. Download kubeconfig from Linode dashboard
2. Set KUBECONFIG environment variable:
   ```bash
   export KUBECONFIG=/path/to/sprint-planning-kubeconfig.yaml
   ```
3. Verify connection:
   ```bash
   kubectl get nodes
   ```

## Step 2: Install Nginx Ingress Controller

The ingress controller routes external traffic to your services.

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for LoadBalancer to get an external IP
kubectl get svc -n ingress-nginx ingress-nginx-controller --watch
```

**Note the EXTERNAL-IP** - this is your cluster's public IP address.

## Step 3: Build and Push Docker Images

### Option A: Using Docker Hub

```bash
# Set your Docker Hub username
DOCKER_USER=your-dockerhub-username

# Build backend image
cd backend
docker build -t $DOCKER_USER/sprint-planning-backend:latest .
docker push $DOCKER_USER/sprint-planning-backend:latest

# Build frontend image
cd ../frontend
docker build -t $DOCKER_USER/sprint-planning-frontend:latest .
docker push $DOCKER_USER/sprint-planning-frontend:latest
```

### Option B: Using GitHub Container Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Set your GitHub username
GITHUB_USER=your-github-username

# Build and push backend
cd backend
docker build -t ghcr.io/$GITHUB_USER/sprint-planning-backend:latest .
docker push ghcr.io/$GITHUB_USER/sprint-planning-backend:latest

# Build and push frontend
cd ../frontend
docker build -t ghcr.io/$GITHUB_USER/sprint-planning-frontend:latest .
docker push ghcr.io/$GITHUB_USER/sprint-planning-frontend:latest
```

### Option C: Using Linode Container Registry (if available)

Follow Linode's documentation for their container registry setup.

## Step 4: Update Kubernetes Manifests

Update the image references in the manifests:

### Update k8s/backend.yaml
```yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        image: your-dockerhub-username/sprint-planning-backend:latest
```

### Update k8s/frontend.yaml
```yaml
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: your-dockerhub-username/sprint-planning-frontend:latest
```

### Update Secrets

Edit `k8s/postgres.yaml` and `k8s/backend.yaml` to set a secure password:

```yaml
# In postgres.yaml - change POSTGRES_PASSWORD
stringData:
  POSTGRES_PASSWORD: "YourSecurePassword123!"

# In backend.yaml - update DATABASE_URL to match
stringData:
  DATABASE_URL: "postgres://sprintuser:YourSecurePassword123!@postgres-service:5432/sprint_planning"
```

## Step 5: Deploy to Kubernetes

### Deploy all resources

```bash
# Navigate to k8s directory
cd k8s

# Apply all manifests
kubectl apply -k .

# Or apply individually:
kubectl apply -f namespace.yaml
kubectl apply -f postgres.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.yaml
```

### Verify deployment

```bash
# Check all pods are running
kubectl get pods -n sprint-planning

# Check services
kubectl get svc -n sprint-planning

# Check ingress
kubectl get ingress -n sprint-planning

# View logs
kubectl logs -n sprint-planning -l app=backend
kubectl logs -n sprint-planning -l app=postgres
```

## Step 6: Configure DNS

### Option A: Use Linode NodeBalancer IP

1. Get the Ingress external IP:
   ```bash
   kubectl get ingress -n sprint-planning
   ```

2. In your DNS provider (Namecheap, Cloudflare, etc.):
   - Create an A record pointing to the NodeBalancer IP
   - Example: `sprint-planning.yourdomain.com` → `123.45.67.89`

3. Update `k8s/ingress.yaml` with your domain:
   ```yaml
   rules:
   - host: sprint-planning.yourdomain.com
   ```

4. Reapply ingress:
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Option B: Use NodeBalancer IP Directly (for testing)

If you don't have a domain, you can access directly via IP:

```bash
# Get the LoadBalancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Access at: http://<EXTERNAL-IP>
```

## Step 7: Enable HTTPS (Optional but Recommended)

### Install cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager pods to be ready
kubectl get pods -n cert-manager --watch
```

### Create Let's Encrypt issuer

Create `k8s/letsencrypt-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # Change this
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply it:
```bash
kubectl apply -f k8s/letsencrypt-issuer.yaml
```

### Update ingress for HTTPS

Uncomment the TLS section in `k8s/ingress.yaml`:

```yaml
spec:
  tls:
  - hosts:
    - sprint-planning.yourdomain.com
    secretName: sprint-planning-tls
  rules:
  - host: sprint-planning.yourdomain.com
```

Reapply:
```bash
kubectl apply -f k8s/ingress.yaml
```

## Step 8: Verify Everything Works

1. **Visit your domain**: `https://sprint-planning.yourdomain.com`
2. **Add a team member** - should persist
3. **Create a sprint** - should persist
4. **Mark holidays** - should persist
5. **Restart pods** and verify data persists:
   ```bash
   kubectl delete pod -n sprint-planning -l app=backend
   # Wait for new pods to start
   # Check if data is still there
   ```

## Monitoring and Maintenance

### View logs

```bash
# Backend logs
kubectl logs -n sprint-planning -l app=backend -f

# Frontend logs
kubectl logs -n sprint-planning -l app=frontend -f

# PostgreSQL logs
kubectl logs -n sprint-planning -l app=postgres -f
```

### Check resource usage

```bash
kubectl top nodes
kubectl top pods -n sprint-planning
```

### Scale deployments

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend -n sprint-planning --replicas=3

# Scale frontend to 3 replicas
kubectl scale deployment frontend -n sprint-planning --replicas=3
```

### Update application

```bash
# Build and push new images
docker build -t $DOCKER_USER/sprint-planning-backend:v2 .
docker push $DOCKER_USER/sprint-planning-backend:v2

# Update deployment
kubectl set image deployment/backend -n sprint-planning backend=$DOCKER_USER/sprint-planning-backend:v2

# Or update the YAML and reapply
kubectl apply -f k8s/backend.yaml
```

## Backup and Restore

### Backup PostgreSQL

```bash
# Get the postgres pod name
POSTGRES_POD=$(kubectl get pod -n sprint-planning -l app=postgres -o jsonpath="{.items[0].metadata.name}")

# Create backup
kubectl exec -n sprint-planning $POSTGRES_POD -- pg_dump -U sprintuser sprint_planning > backup.sql

# Download backup
kubectl cp sprint-planning/$POSTGRES_POD:/tmp/backup.sql ./backup.sql
```

### Restore PostgreSQL

```bash
# Upload backup to pod
kubectl cp ./backup.sql sprint-planning/$POSTGRES_POD:/tmp/backup.sql

# Restore
kubectl exec -n sprint-planning $POSTGRES_POD -- psql -U sprintuser sprint_planning < /tmp/backup.sql
```

### Automated Backups with CronJob

Create `k8s/backup-cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: sprint-planning
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -h postgres-service -U sprintuser sprint_planning > /backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod -n sprint-planning <pod-name>

# Check events
kubectl get events -n sprint-planning --sort-by='.lastTimestamp'
```

### Database connection errors

```bash
# Check if PostgreSQL is running
kubectl get pods -n sprint-planning -l app=postgres

# Check PostgreSQL logs
kubectl logs -n sprint-planning -l app=postgres

# Test connection from backend pod
kubectl exec -n sprint-planning -it <backend-pod> -- sh
# Inside pod:
nc -zv postgres-service 5432
```

### Ingress not working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Describe ingress
kubectl describe ingress -n sprint-planning sprint-planning-ingress
```

### Persistent Volume issues

```bash
# Check PVC status
kubectl get pvc -n sprint-planning

# Check PV status
kubectl get pv

# Describe PVC
kubectl describe pvc -n sprint-planning postgres-pvc
```

## Cost Optimization

### Linode LKE Pricing (as of 2024)

- **Kubernetes Control Plane**: Free
- **Worker Nodes**:
  - Linode 2GB: ~$12/month per node
  - Linode 4GB: ~$24/month per node
- **Block Storage** (for PostgreSQL): $0.10/GB per month
- **NodeBalancer** (for Ingress): $10/month

**Example setup cost:**
- 2 × Linode 4GB nodes: $48/month
- 10GB Block Storage: $1/month
- NodeBalancer: $10/month
- **Total: ~$59/month**

### Reducing costs

1. **Use smaller nodes** (Linode 2GB) if traffic is low
2. **Reduce replicas** to 1 for non-critical components
3. **Use managed PostgreSQL** instead of self-hosted
4. **Set up autoscaling** to scale down during low traffic

## Security Best Practices

1. **Change default passwords** in secrets
2. **Enable RBAC** for access control
3. **Use network policies** to restrict pod communication
4. **Regular security updates**: Keep images and K8s version updated
5. **Use secrets management**: Consider HashiCorp Vault or Sealed Secrets
6. **Enable audit logging**

## Next Steps

- Set up monitoring with Prometheus & Grafana
- Configure autoscaling (HPA)
- Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- Implement network policies for security
- Add rate limiting and DDoS protection

## Support

- [Linode Kubernetes Documentation](https://www.linode.com/docs/guides/deploy-and-manage-a-cluster-with-linode-kubernetes-engine-a-tutorial/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Nginx Ingress Controller Docs](https://kubernetes.github.io/ingress-nginx/)
