# Development Workflow & Best Practices

**Last Updated:** 2025-12-07

## Development Environment Setup

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Git
- Docker (for containerization)
- kubectl (for Kubernetes deployment)

### Initial Setup

```bash
# Clone repository
cd sprint-planning-tool

# Install dependencies
npm run install:all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Coding Standards

### General Principles

**SOLID Principles:**
- **Single Responsibility:** One class/function = one purpose
- **Open/Closed:** Open for extension, closed for modification
- **Liskov Substitution:** Derived types must be substitutable
- **Interface Segregation:** Many specific interfaces > one general
- **Dependency Inversion:** Depend on abstractions, not concretions

**Clean Code:**
- Write simple, elegant code
- Prefer readability over cleverness
- Use meaningful variable and function names
- Keep functions small and focused
- Avoid deep nesting (max 3 levels)
- Comment only when logic isn't self-evident

### TypeScript Standards

**Type Safety:**
```typescript
// Good: Explicit types
function calculateCapacity(defaultCapacity: number, availableDays: number): number {
  return (defaultCapacity * availableDays) / 10;
}

// Avoid: any type
function process(data: any) { } // ❌

// Prefer: Proper types
function process(data: SprintData) { } // ✅
```

**Interface vs Type:**
```typescript
// Use interface for object shapes
interface TeamMember {
  id: number;
  name: string;
  role: string;
}

// Use type for unions, intersections
type Status = 'active' | 'inactive' | 'archived';
```

### React Best Practices

**Component Structure:**
```typescript
// Functional components with hooks
function TeamManagement({ members, onUpdate }: TeamManagementProps) {
  const [loading, setLoading] = useState(false);

  // Event handlers
  const handleDelete = async (id: number) => {
    // Implementation
  };

  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;

  // Main render
  return (
    <div>{/* Component JSX */}</div>
  );
}
```

**Custom Hooks:**
```typescript
// Extract reusable logic
function useSprintData(sprintId: number) {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSprint(sprintId);
  }, [sprintId]);

  return { sprint, loading };
}
```

**Props Destructuring:**
```typescript
// Good: Destructure props
function Component({ name, onUpdate }: ComponentProps) { }

// Avoid: props object
function Component(props: ComponentProps) {
  return <div>{props.name}</div>; // ❌
}
```

### Backend Best Practices

**Controller Pattern:**
```typescript
// controllers/sprintController.ts
export const getSprintById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sprint = await queries.getSprintById(Number(id));

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    res.json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

**Database Queries:**
```typescript
// queries.ts - Database-agnostic
export const getSprintById = async (id: number): Promise<Sprint | null> => {
  if (isSQLite()) {
    return db!.prepare('SELECT * FROM sprints WHERE id = ?').get(id) as Sprint;
  } else {
    const result = await pool!.query('SELECT * FROM sprints WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
};
```

**Error Handling:**
```typescript
// Always wrap database operations in try-catch
try {
  const result = await queries.createSprint(data);
  res.status(201).json(result);
} catch (error) {
  console.error('Error creating sprint:', error);
  res.status(500).json({ error: 'Failed to create sprint' });
}
```

## Git Workflow

### Branch Strategy

**Main Branches:**
- `main` - Production-ready code
- `develop` - Integration branch for features

**Feature Branches:**
- `feature/add-authentication`
- `feature/multi-team-support`

**Bugfix Branches:**
- `bugfix/fix-capacity-calculation`
- `bugfix/deploy-script-typo`

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(capacity): add custom capacity per sprint

Allows team leads to override default capacity for specific sprints.
Adds new field to Sprint model and updates API.

Closes #42
```

```
fix(deploy): correct timeout typo in deploy.sh

Changed '--tieout' to '--timeout' on line 87.
```

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Implement changes** following coding standards
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Create PR** with description
6. **Code review** by team member
7. **Address feedback** and push changes
8. **Merge** to `develop` when approved

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Testing Strategy

### Unit Tests (To Be Implemented)

**Controllers:**
```typescript
// __tests__/controllers/sprintController.test.ts
describe('getSprintById', () => {
  it('should return sprint when found', async () => {
    // Arrange
    const mockSprint = { id: 1, name: 'Sprint 1' };
    jest.spyOn(queries, 'getSprintById').mockResolvedValue(mockSprint);

    // Act
    await getSprintById(mockReq, mockRes);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith(mockSprint);
  });
});
```

**Utilities:**
```typescript
// __tests__/utils/csvExport.test.ts
describe('exportToCSV', () => {
  it('should format capacity data correctly', () => {
    const data = { /* test data */ };
    const csv = exportToCSV(data);
    expect(csv).toContain('Team Member,Capacity');
  });
});
```

### Integration Tests (To Be Implemented)

```typescript
// __tests__/api/sprints.test.ts
describe('Sprint API', () => {
  it('should create a new sprint', async () => {
    const response = await request(app)
      .post('/api/sprints')
      .send({ name: 'Sprint 1', start_date: '2025-12-08' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

## Code Review Guidelines

### What to Look For

**Functionality:**
- Does it solve the problem?
- Are edge cases handled?
- Is error handling appropriate?

**Code Quality:**
- Follows coding standards?
- Clear variable names?
- Appropriate abstraction level?
- No code duplication?

**Performance:**
- Efficient algorithms?
- No unnecessary database queries?
- Appropriate use of caching?

**Security:**
- Input validation?
- SQL injection prevention?
- XSS prevention?

**Testing:**
- Adequate test coverage?
- Tests are meaningful?
- Edge cases tested?

### Review Comments

**Be Constructive:**
```
❌ "This is wrong"
✅ "Consider using Array.map() instead of forEach for better readability"

❌ "Bad naming"
✅ "The variable 'x' could be more descriptive. How about 'availableDays'?"
```

## Documentation Standards

### Code Documentation

**JSDoc Comments:**
```typescript
/**
 * Calculates sprint capacity for a team member
 * @param defaultCapacity - Member's default story point capacity
 * @param availableDays - Number of working days minus holidays
 * @returns Calculated capacity for the sprint
 */
function calculateCapacity(defaultCapacity: number, availableDays: number): number {
  return (defaultCapacity * availableDays) / 10;
}
```

**README Files:**
- Each major directory should have a README
- Explain purpose and structure
- Include examples where helpful

### API Documentation (Future)

**OpenAPI/Swagger:**
```yaml
/api/sprints:
  get:
    summary: Get all sprints
    responses:
      200:
        description: List of sprints
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Sprint'
```

## Performance Guidelines

### Frontend Optimization

**React Performance:**
```typescript
// Memoize expensive calculations
const totalCapacity = useMemo(() => {
  return capacity.members.reduce((sum, m) => sum + m.capacity, 0);
}, [capacity]);

// Memoize callbacks
const handleDelete = useCallback((id: number) => {
  deleteTeamMember(id);
}, []);
```

**Lazy Loading:**
```typescript
const SprintHistory = lazy(() => import('./components/SprintHistory'));
```

### Backend Optimization

**Database Queries:**
```typescript
// Good: Single query with join
SELECT s.*, COUNT(h.id) as holiday_count
FROM sprints s
LEFT JOIN holidays h ON s.id = h.sprint_id
GROUP BY s.id

// Avoid: N+1 queries
sprints.forEach(sprint => {
  const holidays = getHolidaysForSprint(sprint.id); // ❌
});
```

**Caching (Future):**
```typescript
// Redis caching for frequently accessed data
const cachedSprint = await redis.get(`sprint:${id}`);
if (cachedSprint) return JSON.parse(cachedSprint);
```

## Troubleshooting Guide

### Common Development Issues

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

**Database Locked (SQLite):**
```bash
# Delete database and restart
rm backend/sprint-planning.db
cd backend && npm run dev
```

**CORS Errors:**
- Check frontend is proxying to correct backend URL
- Verify CORS configuration in `backend/src/index.ts`

**TypeScript Errors:**
```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready (if any)
- [ ] Backup created

### Deployment

- [ ] Build Docker images
- [ ] Push to registry
- [ ] Deploy to cluster
- [ ] Run smoke tests
- [ ] Monitor logs for errors

### Post-Deployment

- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Notify team of deployment

## Maintenance Tasks

### Daily
- Monitor error logs
- Check for security alerts

### Weekly
- Review performance metrics
- Update dependencies (non-breaking)

### Monthly
- Dependency audit and updates
- Review and close stale issues
- Clean up old branches

### Quarterly
- Major dependency updates
- Security audit
- Performance review
- Architecture review