# Current Architecture Plan

## System Overview

Sprint Planning Tool is deployed on Kubernetes with a 3-tier architecture:

```
Internet
    ↓
Ingress (nginx)
    ↓
┌─────────────────┬─────────────────┐
│   Frontend      │    Backend      │
│   (8080)        │    (3001)       │
│   2 replicas    │    2 replicas   │
└─────────────────┴─────────────────┘
                      ↓
          External Akamai PostgreSQL
          (14773)
```

## Infrastructure Components

### 1. Namespace
- **Name**: sprint-planning
- **Purpose**: Logical isolation of all application resources

### 2. Frontend Layer
- **Technology**: Static web application
- **Deployment**: 2 replicas for high availability
- **Scaling**: Horizontal scaling ready
- **Access**: LoadBalancer + Ingress at `/`
- **Health Monitoring**: HTTP health checks on `/health`

### 3. Backend Layer
- **Technology**: Node.js API server
- **Deployment**: 2 replicas for high availability
- **Port**: 3001
- **Access**: LoadBalancer + Ingress at `/api`
- **Health Monitoring**: HTTP health checks on `/api/health`
- **Database**: Connects to external Akamai managed PostgreSQL

### 4. Data Layer
- **Primary**: External Akamai Managed PostgreSQL
  - Host: a382874-akamai-prod-2493147-default.g2a.akamaidb.net
  - Port: 14773
  - Database: sprint_planning
  - User: akmadmin
- **Backup Option**: Local PostgreSQL deployment (configured but not active)
  - Uses 10Gi persistent volume
  - postgres:15-alpine image
  - Ready to activate if needed

### 5. Ingress Layer
- **Controller**: nginx
- **Features**:
  - Path-based routing
  - CORS support for API calls
  - SSL redirect capability
  - TLS/HTTPS ready (cert-manager integration available)
- **Routes**:
  - Frontend: All paths except `/api`
  - Backend: `/api` prefix paths

## Deployment Strategy

### Build & Push
1. Docker images built from source
2. Tagged as `latest`
3. Pushed to Docker Hub (dambo14)

### Deployment
1. Namespace creation
2. Backend deployment (with secrets and configmaps)
3. Frontend deployment
4. Ingress configuration
5. Health check validation

### Rollout Strategy
- Rolling updates
- Zero-downtime deployments
- Health checks ensure pod readiness

## Resource Allocation

### Backend
- Min: 128Mi RAM, 100m CPU
- Max: 256Mi RAM, 200m CPU

### Frontend
- Min: 64Mi RAM, 50m CPU
- Max: 128Mi RAM, 100m CPU

### PostgreSQL (if local deployment used)
- Min: 256Mi RAM, 250m CPU
- Max: 512Mi RAM, 500m CPU

## High Availability

- All services run 2+ replicas
- Health checks detect and replace unhealthy pods
- LoadBalancer distributes traffic
- Persistent storage for database (when using local PostgreSQL)

## Security Considerations

- Secrets for sensitive data (DATABASE_URL, passwords)
- ConfigMaps for non-sensitive configuration
- SSL/TLS ready for production
- Database credentials stored in Kubernetes secrets

## Monitoring & Observability

- Liveness probes: Restart unhealthy containers
- Readiness probes: Control traffic routing
- Logs accessible via kubectl
- Status checks via deploy.sh script

## Future Considerations

### Potential Improvements
1. **HTTPS/TLS**: Enable cert-manager for automatic SSL certificates
2. **Domain**: Configure actual domain name in ingress
3. **Monitoring**: Add Prometheus/Grafana
4. **Logging**: Centralized logging solution
5. **Database**: Consider migrating to local PostgreSQL for better control
6. **Autoscaling**: Implement HPA (Horizontal Pod Autoscaler)
7. **CI/CD**: Automate build and deployment pipeline
8. **Backup**: Database backup strategy
9. **Secrets Management**: Consider using external secrets manager
10. **Resource Optimization**: Fine-tune resource requests/limits based on usage
