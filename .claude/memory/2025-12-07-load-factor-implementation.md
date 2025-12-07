# Load Factor Feature Implementation

**Date:** 2025-12-07
**Status:** ✅ Completed & Deployed

## Overview

Implemented configurable load factor for sprint capacity calculations to account for meetings, overhead, and realistic productivity. Load factor allows reducing theoretical capacity by a percentage (default 80%).

## Changes Made

### 1. Database Schema Updates

**Backend: `src/database/sqlite.ts`**
```sql
CREATE TABLE IF NOT EXISTS sprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current BOOLEAN DEFAULT 0,
  load_factor REAL DEFAULT 0.8,  -- NEW COLUMN
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Backend: `src/database/postgres.ts`**
```sql
CREATE TABLE IF NOT EXISTS sprints (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  load_factor REAL DEFAULT 0.8,  -- NEW COLUMN
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fix:** Made PostgreSQL initialization conditional to avoid errors when DATABASE_URL is not set:
```typescript
export const pool = isPostgres() && dbConfig.url ? new Pool({
  connectionString: dbConfig.url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
}) : null;
```

### 2. Backend Model & Controller Updates

**Backend: `src/models/Sprint.ts`**
- Added `load_factor: number` to Sprint interface
- Updated `create()` method to handle load_factor (default 0.8)
- Updated `update()` method to support load_factor updates

**Backend: `src/controllers/sprintController.ts`**
- Updated `createSprint()` to accept and store load_factor
- Updated `getSprintCapacity()` to include load_factor in calculation:

```typescript
const loadFactor = sprint.load_factor || 0.8;

const memberCapacities = members.map(member => {
  const memberHolidays = holidays.filter(h => h.member_id === member.id);
  const holidayCount = memberHolidays.length;
  const availableDays = totalWorkingDays - holidayCount;
  const capacity = (member.default_capacity * availableDays * loadFactor) / 10;  // UPDATED FORMULA

  return {
    member_id: member.id,
    member_name: member.name,
    default_capacity: member.default_capacity,
    total_working_days: totalWorkingDays,
    holidays: holidayCount,
    available_days: availableDays,
    capacity: Math.round(capacity * 10) / 10,
  };
});

res.json({
  sprint_id: id,
  sprint_name: sprint.name,
  total_working_days: totalWorkingDays,
  load_factor: loadFactor,  // NEW - included in response
  member_capacities: memberCapacities,
  total_capacity: Math.round(totalCapacity * 10) / 10,
});
```

### 3. Frontend Type Updates

**Frontend: `src/types/index.ts`**
```typescript
export interface Sprint {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  load_factor: number;  // NEW
  created_at?: string;
}

export interface SprintCapacity {
  sprint_id: number;
  sprint_name: string;
  total_working_days: number;
  load_factor: number;  // NEW
  member_capacities: MemberCapacity[];
  total_capacity: number;
}
```

### 4. Frontend UI Components

**A. Sprint Creation Modal (`src/components/SprintCreateModal.tsx`)**

Added load factor input field:
```typescript
const [formData, setFormData] = useState({
  name: `Sprint ${sprintCount + 1}`,
  start_date: '',
  is_current: false,
  load_factor: 0.8,  // NEW
});

// In the form:
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Load Factor (%)
  </label>
  <input
    type="number"
    min="0"
    max="100"
    step="5"
    value={formData.load_factor * 100}
    onChange={(e) => setFormData({ ...formData, load_factor: Number(e.target.value) / 100 })}
    required
    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg..."
  />
  <p className="text-xs text-gray-500 mt-2">
    Accounts for meetings, overhead, and realistic productivity (default: 80%)
  </p>
</div>
```

**B. Capacity Summary (`src/components/CapacitySummary.tsx`)**

Added editable load factor display:
```typescript
const [loadFactor, setLoadFactor] = useState(capacity.load_factor || 0.8);
const [isEditing, setIsEditing] = useState(false);

const handleSaveLoadFactor = async () => {
  await sprintApi.update(capacity.sprint_id, { load_factor: loadFactor });
  setIsEditing(false);
  onUpdate();
};

// UI shows either display mode or edit mode:
{isEditing ? (
  <>
    <input type="number" min="0" max="100" step="5"
           value={Math.round(loadFactor * 100)}
           onChange={(e) => setLoadFactor(Number(e.target.value) / 100)} />
    <button onClick={handleSaveLoadFactor}>Save</button>
    <button onClick={() => setIsEditing(false)}>Cancel</button>
  </>
) : (
  <>
    <span>{Math.round(loadFactor * 100)}%</span>
    <button onClick={() => setIsEditing(true)}>Edit</button>
  </>
)}
```

Updated formula display:
```typescript
<p className="text-xs text-gray-600">
  Capacity = (Default Capacity × Available Days × Load Factor) ÷ 10
</p>
<p className="text-xs text-gray-500">
  Load Factor ({Math.round(loadFactor * 100)}%) = Realistic productivity accounting for meetings and overhead
</p>
```

**C. App.tsx**

Updated CapacitySummary to receive onUpdate callback:
```typescript
{capacity && <CapacitySummary capacity={capacity} onUpdate={() => loadSprintData(selectedSprint.id!)} />}
```

### 5. Development Tools

**New Script: `backend/scripts/sync-from-production.ts`**

Created utility script to sync production data to local SQLite database for testing:
```typescript
// Fetches sprints, team members, and holidays from production API
// Populates local SQLite database with production data
// Ensures load_factor defaults to 0.8 for any missing values
```

Usage:
```bash
cd backend
npx tsx scripts/sync-from-production.ts
```

### 6. Database Migration

**Production Migration:**
Ran on Kubernetes backend pod:
```sql
ALTER TABLE sprints
ADD COLUMN IF NOT EXISTS load_factor REAL DEFAULT 0.8;

UPDATE sprints
SET load_factor = 0.8
WHERE load_factor IS NULL;
```

Result: ✅ Added load_factor column, 0 sprints needed update (column had default)

## Capacity Calculation Formula

### Before:
```
Capacity = (Default Capacity × Available Days) ÷ 10
```

### After:
```
Capacity = (Default Capacity × Available Days × Load Factor) ÷ 10
```

### Example:
- Team member with default capacity: 10
- Available days in sprint: 10
- Load factor: 80% (0.8)
- **Result:** (10 × 10 × 0.8) ÷ 10 = **8.0 SP** (instead of 10.0 SP)

## Files Modified

### Backend
1. `src/database/sqlite.ts` - Added load_factor column to schema
2. `src/database/postgres.ts` - Added load_factor column to schema, made pool conditional
3. `src/models/Sprint.ts` - Added load_factor to interface and methods
4. `src/controllers/sprintController.ts` - Updated create/capacity endpoints

### Frontend
1. `src/types/index.ts` - Added load_factor to Sprint and SprintCapacity interfaces
2. `src/components/SprintCreateModal.tsx` - Added load factor input field
3. `src/components/CapacitySummary.tsx` - Added editable load factor display
4. `src/components/SprintManagement.tsx` - Added load_factor to sprint creation
5. `src/App.tsx` - Added onUpdate callback to CapacitySummary

### New Files
1. `backend/scripts/sync-from-production.ts` - Production data sync utility
2. `backend/src/migrations/add-load-factor.ts` - Migration script (created but not used)

## Testing

### Local Testing
1. Created sync script to populate local DB with production data
2. Tested sprint creation with various load factors (50%, 80%, 100%)
3. Tested load factor editing (Edit → Change → Save/Cancel)
4. Verified capacity calculations with different load factors
5. Confirmed formula display shows correct load factor percentage

### Production Testing
1. Deployed to Kubernetes (http://66.228.63.81:3000)
2. Ran database migration successfully
3. Verified existing sprints have default load_factor (0.8)
4. Tested creating new sprint with custom load factor
5. Tested editing load factor for existing sprint

## Deployment

### Build
```bash
cd backend && npx tsc
cd frontend && npm run build
```

### Docker Images
```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t dambo14/sprint-planning-backend:latest --push ./backend

docker buildx build --platform linux/amd64,linux/arm64 \
  -t dambo14/sprint-planning-frontend:latest --push ./frontend
```

### Kubernetes
```bash
kubectl rollout restart deployment backend -n sprint-planning
kubectl rollout restart deployment frontend -n sprint-planning
kubectl rollout status deployment backend -n sprint-planning --timeout=120s
kubectl rollout status deployment frontend -n sprint-planning --timeout=120s
```

Status: ✅ Both deployments successful

## User Impact

### New Features
✅ Configurable load factor when creating sprints (default 80%)
✅ Edit load factor for existing sprints
✅ More realistic capacity calculations
✅ Transparent formula showing load factor impact

### No Breaking Changes
✅ Existing sprints automatically get default load_factor (0.8)
✅ API backward compatible (load_factor optional in requests)
✅ UI gracefully handles missing load_factor values
✅ All existing functionality preserved

## Known Issues

None - all issues resolved during development:
1. ✅ Fixed PostgreSQL connection error when DATABASE_URL not set
2. ✅ Fixed NaN display by providing default value (0.8)
3. ✅ Fixed capacity calculation not applying load factor
4. ✅ Fixed TypeScript compilation errors

## Future Enhancements

Potential improvements (not implemented):
- Per-team-member load factors
- Historical load factor tracking
- Load factor recommendations based on past sprints
- Load factor presets (aggressive: 90%, balanced: 80%, conservative: 70%)

## Success Metrics

✅ **Clean TypeScript compilation** - No errors in backend or frontend
✅ **Production build success** - Bundle size: 192.29 kB (frontend), optimized
✅ **Successful deployment** - Both backend and frontend pods running
✅ **Database migration success** - load_factor column added to production
✅ **Zero downtime** - Rolling update completed successfully
✅ **Feature working** - Tested creation, editing, and calculation

## Documentation

- Updated `.claude/memory/` with this implementation log
- Updated `.claude/plans/` with architecture changes
- Feature request in `.claude/features/configurable-capacity-formula.md` - ✅ Completed