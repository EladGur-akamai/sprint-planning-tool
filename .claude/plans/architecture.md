# Sprint Planning Tool - Architecture Plan

**Last Updated:** 2025-12-07

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (React SPA)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Frontend       │
│  Vite Dev/Nginx │
│  Port: 3000     │
└────────┬────────┘
         │ API Proxy
         ▼
┌─────────────────┐
│  Backend API    │
│  Express/Node   │
│  Port: 3001     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│ SQLite/Postgres │
└─────────────────┘
```

## Design Principles

### 1. SOLID Principles Applied

#### Single Responsibility
- **Controllers:** Handle HTTP request/response only
- **Models:** Define data structures and validation
- **Database Layer:** Manage database operations
- **Routes:** Define API endpoints only

#### Open/Closed Principle
- Database abstraction allows switching between SQLite and PostgreSQL
- Query layer separates SQL logic from business logic

#### Liskov Substitution
- Database implementations (SQLite/PostgreSQL) are interchangeable
- Both implement the same query interface

#### Interface Segregation
- Separate route files for each domain (teams, sprints, holidays)
- API clients consume only needed endpoints

#### Dependency Inversion
- Controllers depend on query abstractions, not concrete database implementations
- Configuration drives database selection at runtime

### 2. Clean Architecture Layers

```
Presentation Layer (Frontend)
    ↓
API Layer (Express Routes)
    ↓
Business Logic Layer (Controllers)
    ↓
Data Access Layer (Queries)
    ↓
Database Layer (SQLite/PostgreSQL)
```

### 3. Separation of Concerns

#### Frontend
- **Components:** UI presentation and user interaction
- **Services:** API communication
- **Types:** TypeScript type definitions
- **Utils:** Pure utility functions (CSV export)

#### Backend
- **Routes:** Endpoint definitions
- **Controllers:** Business logic and validation
- **Models:** Data structures
- **Database:** Persistence layer

## Technology Choices & Rationale

### Backend Stack

**Node.js + Express**
- Lightweight, fast HTTP server
- Large ecosystem
- Easy deployment
- TypeScript support

**TypeScript**
- Type safety reduces runtime errors
- Better developer experience
- Self-documenting code
- Refactoring confidence

**Hybrid Database (SQLite + PostgreSQL)**
- SQLite for local development (zero config)
- PostgreSQL for production (reliability, scalability)
- Abstraction layer allows seamless switching

**date-fns**
- Lightweight alternative to moment.js
- Immutable, pure functions
- Tree-shakeable

### Frontend Stack

**React**
- Component-based architecture
- Large ecosystem
- Excellent TypeScript support
- Virtual DOM performance

**Vite**
- Fast development server
- Hot module replacement
- Optimized production builds
- Better than Create React App

**TailwindCSS**
- Utility-first approach
- No CSS file management
- Consistent design system
- Responsive by default

## Data Flow

### Sprint Capacity Calculation Flow

```
User toggles holiday on calendar
    ↓
Frontend sends POST /api/holidays/toggle
    ↓
Backend updates holidays table
    ↓
Frontend fetches GET /api/sprints/:id/capacity
    ↓
Backend queries all holidays for sprint
    ↓
Backend calculates capacity per member
    ↓
Frontend displays updated capacity
```

### Calculation Algorithm
```
For each team member:
  totalWorkingDays = 10 (2 weeks, Sun-Thu)
  holidays = count(holidays for member in sprint)
  availableDays = totalWorkingDays - holidays
  capacity = (defaultCapacity × availableDays) ÷ 10

Total team capacity = sum(all member capacities)
```

## Database Design

### Entity Relationships

```
team_members (1) ──┐
                   │
                   ├── (M) holidays (M) ──┐
                   │                       │
sprints (1) ───────┘                       └── One sprint can have many holidays
                                               One member can have many holidays
```

### Normalization
- **3NF compliance:** No redundant data
- **Foreign keys:** Maintain referential integrity
- **Indexes:** (Can be added for performance as needed)

### Data Integrity
- Foreign key constraints prevent orphaned records
- Boolean `is_current` ensures only one active sprint
- Date validation in application layer

## API Design

### RESTful Principles
- Resource-based URLs (`/api/members`, `/api/sprints`)
- HTTP verbs map to operations (GET, POST, PUT, DELETE)
- Stateless server
- JSON request/response format

### Response Format
```json
{
  "data": {...},
  "error": null
}
```

### Error Handling
- HTTP status codes (200, 201, 400, 404, 500)
- Descriptive error messages
- Try-catch in controllers

## Security Considerations

### Current Implementation
- CORS enabled for frontend access
- Input validation in controllers
- Parameterized queries (SQL injection prevention)

### Future Enhancements (Not Yet Implemented)
- Authentication/Authorization
- Rate limiting
- API keys
- HTTPS enforcement
- Input sanitization library
- Environment variable validation

## Scalability Considerations

### Current Design
- Stateless API (horizontally scalable)
- Database connection pooling (PostgreSQL)
- Efficient queries (minimal joins)

### Future Improvements
- Redis caching for frequently accessed data
- Database read replicas
- CDN for frontend assets
- Load balancing
- Containerization (already implemented via Docker)

## Deployment Architecture

### Local Development
```
Developer Machine
  ├── Backend (SQLite)
  └── Frontend (Vite dev server)
```

### Kubernetes Production
```
Kubernetes Cluster
  ├── Namespace: sprint-planning
  ├── Backend Pods (replicas)
  ├── Frontend Pods (replicas)
  ├── Ingress (external access)
  └── External PostgreSQL (Akamai managed)
```

### Alternative: Cloud Platform (Render/Heroku)
```
Cloud Provider
  ├── Backend Service (Node.js)
  ├── Frontend Service (Static files)
  └── Managed PostgreSQL
```

## Code Organization Strategy

### Backend File Naming
- Routes: `{domain}Routes.ts`
- Controllers: `{domain}Controller.ts`
- Models: `{Entity}.ts`

### Frontend File Naming
- Components: `PascalCase.tsx`
- Services: `camelCase.ts`
- Utils: `camelCase.ts`

### Import Strategy
- Absolute imports for clarity
- Group imports (external, internal, types)
- Single responsibility per file

## Testing Strategy (Future Implementation)

### Unit Tests
- Controllers (business logic)
- Utility functions
- Data validation

### Integration Tests
- API endpoints
- Database operations

### E2E Tests
- User workflows
- Critical paths (create sprint, calculate capacity)

## Monitoring & Observability (Future)

### Health Checks
- `/api/health` endpoint (already implemented)
- Database connectivity check

### Logging
- Request/response logging
- Error logging
- Performance metrics

### Metrics
- API response times
- Error rates
- Database query performance

## Performance Optimization

### Current Optimizations
- React component memoization (where needed)
- Efficient database queries
- Minimal API calls (batch loading)

### Future Optimizations
- Lazy loading for components
- Virtual scrolling for large lists
- Database query optimization
- Asset compression
- Service worker for offline support

## Maintenance & Evolution

### Version Control
- Git repository
- Semantic versioning
- Changelog maintenance

### Documentation
- README with setup instructions
- API documentation
- Deployment guides (QUICKSTART.md, KUBERNETES_DEPLOYMENT.md, RENDER_DEPLOYMENT.md)

### Code Quality
- TypeScript for type safety
- Consistent code style
- Meaningful variable names
- Comments where logic isn't obvious