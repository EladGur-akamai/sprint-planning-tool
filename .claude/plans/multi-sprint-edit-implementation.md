# Implementation Plan: Multi-Sprint Edit Support

**Feature Request:** `.claude/features/multi-sprint-edit-support.md`
**Priority:** Medium
**Status:** In Progress
**Created:** 2025-12-07

## Current State Analysis

### How It Works Now
1. App.tsx loads only the "current sprint" via `sprintApi.getCurrent()`
2. Dashboard displays only the active sprint (marked as `is_current: true`)
3. No ability to view/edit past or future sprints from the dashboard

### What Needs to Change
1. Load all sprints, not just current one
2. Add sprint selector dropdown in dashboard
3. Default selection to current sprint
4. Allow switching between any sprint
5. Maintain all existing functionality

## Implementation Strategy

### Phase 1: State Management Updates

**File:** `frontend/src/App.tsx`

**Changes:**
1. Add new state variables:
   - `allSprints: Sprint[]` - List of all sprints
   - `selectedSprint: Sprint | null` - Currently selected sprint for viewing
   - Keep `currentSprint` for reference to the active sprint

2. Update `loadData()` function:
   - Load all sprints via `sprintApi.getAll()`
   - Load current sprint to know which is active
   - Set `selectedSprint` to current sprint by default

3. Create new handler:
   - `handleSprintSelection(sprintId: number)` - Load data for selected sprint

### Phase 2: Sprint Selector Component

**New Component:** `frontend/src/components/SprintSelector.tsx`

**Props:**
```typescript
interface SprintSelectorProps {
  sprints: Sprint[];
  selectedSprint: Sprint | null;
  currentSprintId: number | null;
  onSprintChange: (sprintId: number) => void;
}
```

**Features:**
- Dropdown with all sprints
- Display sprint name and date range
- Highlight current/active sprint with badge
- Simple, clean design matching existing UI

### Phase 3: UI Integration

**Location:** Dashboard tab in App.tsx

**Layout:**
```
┌─────────────────────────────────────┐
│ Sprint Selector (dropdown)          │
│ [Sprint 1 (CURRENT) ▼]              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Sprint: Sprint 1                    │
│ 2025-12-08 - 2025-12-21            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Sprint Calendar                     │
│ (existing calendar component)       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Capacity Summary                    │
│ (existing summary component)        │
└─────────────────────────────────────┘
```

### Phase 4: Data Flow Updates

**Updated Flow:**
1. User selects sprint from dropdown
2. `handleSprintSelection(sprintId)` called
3. Load holidays for selected sprint
4. Load capacity for selected sprint
5. Update calendar and capacity summary
6. Holiday toggle works on selected sprint (not necessarily current)

## Technical Details

### API Calls
- Already exists: `sprintApi.getAll()` ✅
- Already exists: `sprintApi.getCurrent()` ✅
- Already exists: `holidayApi.getBySprintId(sprintId)` ✅
- Already exists: `sprintApi.getCapacity(sprintId)` ✅

No backend changes needed!

### State Management
```typescript
// Before
const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);

// After
const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null); // Active sprint
const [allSprints, setAllSprints] = useState<Sprint[]>([]); // All sprints
const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null); // Viewing sprint
```

### Component Props
```typescript
// SprintCalendar - no changes needed, already accepts any sprint
<SprintCalendar
  sprint={selectedSprint}  // Changed from currentSprint
  teamMembers={teamMembers}
  holidays={holidays}
  onHolidayToggle={handleHolidayToggle}
/>

// CapacitySummary - no changes needed
<CapacitySummary capacity={capacity} />
```

## SOLID Principles Applied

### Single Responsibility
- **SprintSelector:** Only handles sprint selection UI
- **App.tsx:** Orchestrates data loading and state
- **SprintCalendar:** Displays calendar (unchanged)

### Open/Closed
- SprintCalendar already accepts any Sprint object
- No modification needed, only extension of App.tsx

### Liskov Substitution
- selectedSprint and currentSprint are both Sprint type
- Can be used interchangeably in child components

### Interface Segregation
- SprintSelector only receives props it needs
- Child components unchanged

### Dependency Inversion
- Components depend on Sprint interface, not specific implementation

## Testing Checklist

### Functional Testing
- [ ] Dropdown shows all sprints
- [ ] Current sprint is pre-selected on load
- [ ] Can switch between sprints
- [ ] Calendar updates when sprint changes
- [ ] Capacity updates when sprint changes
- [ ] Can toggle holidays on non-current sprints
- [ ] Selected sprint persists during session

### Regression Testing
- [ ] Team Management still works
- [ ] Sprint Management still works
- [ ] Sprint History still works
- [ ] Current sprint indicator still accurate
- [ ] CSV export works for selected sprint
- [ ] No console errors

### Edge Cases
- [ ] No sprints exist (show message)
- [ ] Only one sprint exists
- [ ] Current sprint is deleted (fallback to first sprint)
- [ ] Switch sprints while editing holidays

## Files to Modify

1. **frontend/src/App.tsx** - Main state management
2. **frontend/src/components/SprintSelector.tsx** - New component (create)

## Files Unchanged
- SprintCalendar.tsx ✅
- CapacitySummary.tsx ✅
- TeamManagement.tsx ✅
- SprintManagement.tsx ✅
- Backend (no changes needed) ✅

## Estimated Complexity
**Low-Medium** - Clean architecture makes this straightforward

## Rollback Plan
If issues arise:
1. Revert App.tsx changes
2. Remove SprintSelector.tsx
3. System returns to current-sprint-only view

## Success Criteria
✅ User can select any sprint from dropdown
✅ Default selection is current/active sprint
✅ All existing functionality works
✅ UI maintains consistent look and feel
✅ No performance degradation
✅ Code follows SOLID principles