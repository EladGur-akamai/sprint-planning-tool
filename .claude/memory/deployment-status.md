# Deployment Status & Configuration

**Last Updated:** 2025-12-08

## Current Deployment Configuration

### Kubernetes Deployment

**Cluster:** Linode LKE (or compatible Kubernetes cluster)
**Namespace:** sprint-planning

#### Components

1. **Backend Service**
   - Deployment: `backend.yaml`
   - Container: Docker image for Node.js/Express backend
   - Port: 3001
   - Environment: Production
   - Database: External Akamai managed PostgreSQL

2. **Frontend Service**
   - Deployment: `frontend.yaml`
   - Container: Docker image for React/Vite frontend
   - Port: 3000
   - Serves static built files

3. **Database**
   - **Type:** PostgreSQL (managed by Akamai)
   - **Location:** External to cluster
   - **Note:** `postgres.yaml` commented out in `kustomization.yaml`

4. **Ingress**
   - Configuration: `ingress.yaml`
   - Provides external HTTP access
   - Load balancer integration

#### Deployment Files

```
k8s/
├── kustomization.yaml    # Main Kustomize configuration
├── namespace.yaml        # Namespace definition
├── backend.yaml          # Backend deployment & service
├── frontend.yaml         # Frontend deployment & service
├── postgres.yaml         # PostgreSQL (currently disabled)
├── ingress.yaml          # Ingress configuration
└── deploy.sh             # Deployment automation script
```

### Deployment Script

**Location:** `k8s/deploy.sh`

**Commands:**
- `./deploy.sh build` - Build Docker images locally
- `./deploy.sh push` - Push images to registry
- `./deploy.sh build-push` - Build and push
- `./deploy.sh deploy` - Deploy to Kubernetes
- `./deploy.sh all` - Full pipeline (build, push, deploy)
- `./deploy.sh status` - Show deployment status
- `./deploy.sh logs` - View pod logs
- `./deploy.sh delete` - Delete all resources

**Environment Variables:**
- `DOCKER_USER` - Docker Hub username (required for push)

### Docker Images

**Backend:** `$DOCKER_USER/sprint-planning-backend:latest`
- Dockerfile: `backend/Dockerfile`
- Base: Node.js
- Port: 3001

**Frontend:** `$DOCKER_USER/sprint-planning-frontend:latest`
- Dockerfile: `frontend/Dockerfile`
- Base: Node.js (build) + Nginx (serve)
- Port: 3000

## Environment Configuration

### Backend Environment Variables

**Development (SQLite):**
```bash
DATABASE_TYPE=sqlite
NODE_ENV=development
PORT=3001
```

**Production (PostgreSQL):**
```bash
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=3001
```

### Database Connection

**SQLite (Local Dev):**
- File: `backend/sprint-planning.db`
- Auto-created on first run
- No external dependencies

**PostgreSQL (Production):**
- External Akamai managed instance
- Connection string from environment
- Connection pooling enabled

## Deployment Workflow

### Initial Setup

1. **Build Docker images:**
   ```bash
   cd k8s
   DOCKER_USER=your-username ./deploy.sh build
   ```

2. **Push to registry:**
   ```bash
   DOCKER_USER=your-username ./deploy.sh push
   ```

3. **Deploy to cluster:**
   ```bash
   ./deploy.sh deploy
   ```

4. **Check status:**
   ```bash
   ./deploy.sh status
   ```

### Updates & Rollouts

1. **Code changes:** Make changes to source code
2. **Rebuild images:** `./deploy.sh build`
3. **Push images:** `./deploy.sh push`
4. **Rolling update:** Kubernetes automatically detects new image
5. **Verify:** `./deploy.sh status`

### Monitoring

**Pod Status:**
```bash
kubectl get pods -n sprint-planning
```

**Service Status:**
```bash
kubectl get svc -n sprint-planning
```

**Logs:**
```bash
kubectl logs -n sprint-planning -l app=backend
kubectl logs -n sprint-planning -l app=frontend
```

**Resource Usage:**
```bash
kubectl top pods -n sprint-planning
```

## Known Issues

### Current Issues

1. **Typo in deploy.sh:87**
   - `--tieout=120s` should be `--timeout=120s`
   - Affects backend pod readiness wait

2. **Docker Username Placeholder**
   - Default: `your-dockerhub-username`
   - Must be set via `DOCKER_USER` environment variable

### Resolved Issues

None currently documented.

## Security Considerations

### Current Implementation

- Environment variables for sensitive data
- CORS configured for frontend access
- Kubernetes secrets (to be implemented for DATABASE_URL)

### Recommendations

- [ ] Store DATABASE_URL in Kubernetes Secret
- [ ] Use RBAC for cluster access
- [ ] Enable network policies
- [ ] Implement pod security policies
- [ ] Use private Docker registry
- [ ] Enable HTTPS with cert-manager

## Scalability

### Current Configuration

- Single replica for backend (can be increased)
- Single replica for frontend (can be increased)
- External managed PostgreSQL (handles scaling)

### Scaling Recommendations

- Horizontal pod autoscaling (HPA) based on CPU/memory
- Vertical pod autoscaling (VPA) for resource requests
- Database read replicas for heavy read workloads
- CDN for frontend static assets

## Backup & Recovery

### Database Backups

- Managed by Akamai PostgreSQL service
- Automatic backups (check provider settings)
- Point-in-time recovery available

### Application State

- Stateless application design
- All state in database
- Pod recreation safe

## Disaster Recovery

### Recovery Steps

1. **Database failure:**
   - Restore from Akamai backup
   - Update DATABASE_URL if needed
   - Restart backend pods

2. **Cluster failure:**
   - Provision new cluster
   - Run `./deploy.sh deploy`
   - Update DNS if needed

3. **Data corruption:**
   - Restore database from backup
   - Verify data integrity
   - Resume operations

## Monitoring & Alerting (Planned)

### Metrics to Monitor

- Pod CPU/memory usage
- API response times
- Error rates
- Database connection pool
- Request volume

### Alerting Thresholds

- Pod restarts > 3 in 10 minutes
- API response time > 500ms (p95)
- Error rate > 5%
- Database connections > 80% of pool

## Documentation References

- **QUICKSTART.md** - Quick deployment guide
- **KUBERNETES_DEPLOYMENT.md** - Full Kubernetes documentation
- **RENDER_DEPLOYMENT.md** - Alternative Render deployment
- **README.md** - General project documentation

## Support & Troubleshooting

### Common Issues

**Port conflicts:**
- Check service definitions
- Verify ingress configuration

**Image pull errors:**
- Verify DOCKER_USER is correct
- Check image exists in registry
- Verify registry credentials

**Database connection:**
- Check DATABASE_URL is correct
- Verify network connectivity
- Check PostgreSQL credentials

**Pod crashes:**
- View logs: `./deploy.sh logs`
- Check resource limits
- Verify environment variables

## Next Steps

- [ ] Fix deployment script typo
- [ ] Implement Kubernetes Secrets for DATABASE_URL
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure autoscaling
- [ ] Implement HTTPS with cert-manager
- [ ] Set up CI/CD pipeline