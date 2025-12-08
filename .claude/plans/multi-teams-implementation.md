# Multi-Team Support Implementation Plan

## Overview
Add multi-team functionality with team logos (via ImgBB API), many-to-many team-member relationships, sidebar navigation, and complete data isolation per team. All existing data will migrate to a default "Elad Team".

## Key Design Decisions
- **Logo Storage**: ImgBB API (external CDN, free tier)
- **Team-Member Relationship**: Junction table for many-to-many
- **Team Selection UI**: Persistent sidebar (not dropdown)
- **Data Isolation**: team_id foreign keys on sprints and retro_items
- **Migration**: Auto-create "Elad Team" and assign all existing data

## Implementation Phases

### Phase 1: Database Schema (Backend)
**Files to modify:**
- `backend/src/database/sqlite.ts`
- `backend/src/database/postgres.ts`

**Add these tables:**
```sql
-- Teams table
CREATE TABLE teams (
  id INTEGER/SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at DATETIME/TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for team-member many-to-many
CREATE TABLE team_members_teams (
  id INTEGER/SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  created_at DATETIME/TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  UNIQUE(team_id, member_id)
);
```

**Update existing tables:**
- Add `team_id` column to `sprints` table (FOREIGN KEY to teams)
- Add `team_id` column to `retro_items` table (FOREIGN KEY to teams)
- Add indexes on all `team_id` columns for performance

**Note:** SQLite requires table recreation for schema changes (rename → create → copy → drop pattern)

### Phase 2: Data Migration Script
**Create:** `backend/src/scripts/migrate-to-teams.ts`

**Migration steps:**
1. Check if teams table exists
2. Create "Elad Team" as default (ID=1)
3. Insert all existing team members into junction table with team_id=1
4. Add team_id=1 to all existing sprints and retro_items
5. Verify data integrity

**Add to package.json:**
```json
"scripts": {
  "migrate": "tsx src/scripts/migrate-to-teams.ts"
}
```

### Phase 3: Backend Models
**Create:** `backend/src/models/Team.ts`
- Interface: Team { id, name, logo_url, created_at }
- Methods: getAll(), getById(), create(), update(), delete()
- Methods: getMembersByTeamId(), addMemberToTeam(), removeMemberFromTeam()

**Update:** `backend/src/models/Sprint.ts`
- Add team_id to Sprint interface
- Update getAll() to accept teamId parameter
- Update getCurrent() to filter by team
- Add team_id validation

**Update:** `backend/src/models/RetroItem.ts`
- Add team_id to RetroItem interface
- Update queries to filter by team_id

**Update:** `backend/src/models/TeamMember.ts`
- Add getByTeamId(teamId: number) method

### Phase 4: Backend Controllers & Routes
**Create:** `backend/src/controllers/teamController.ts`
- getAllTeams, getTeamById, createTeam, updateTeam, deleteTeam
- getTeamMembers, addTeamMember, removeTeamMember
- **uploadTeamLogo**: Convert base64 → POST to ImgBB API → save URL

**ImgBB Integration:**
```typescript
// POST to https://api.imgbb.com/1/upload
// Body: { key: IMGBB_API_KEY, image: base64_string }
// Returns: { data: { url: "https://..." } }
```

**Environment variable:** Add `IMGBB_API_KEY` to .env

**Update:** `backend/src/controllers/sprintController.ts`
- Add team-based filtering to all methods
- Validate sprint belongs to team

**Update:** `backend/src/controllers/retroController.ts`
- Add team validation

**Create:** `backend/src/routes/teamRoutes.ts`
```typescript
GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id
GET    /api/teams/:id/members
POST   /api/teams/:id/members
DELETE /api/teams/:id/members/:memberId
POST   /api/teams/:id/logo
```

**Update:** `backend/src/index.ts`
- Register: `app.use('/api/teams', teamRoutes)`

### Phase 5: Frontend Types & API
**Update:** `frontend/src/types/index.ts`
```typescript
export interface Team {
  id?: number;
  name: string;
  logo_url: string | null;
  created_at?: string;
}

// Add team_id to Sprint and RetroItem
```

**Update:** `frontend/src/services/api.ts`
- Add teamApi object with CRUD methods
- Add uploadLogo(teamId, imageFile) - converts File to base64
- Update sprintApi to accept teamId parameter
- Update retroApi for team filtering

### Phase 6: Frontend State Management
**Create:** `frontend/src/contexts/TeamContext.tsx`
```typescript
interface TeamContextType {
  currentTeam: Team | null;
  allTeams: Team[];
  setCurrentTeam: (team: Team) => void;
  loadTeams: () => Promise<void>;
}
```

**Update:** `frontend/src/App.tsx`
- Add selectedTeam state
- Add allTeams state
- Load teams on mount
- Update loadData() to filter by team
- Wrap app with TeamProvider
- Update layout for sidebar (flex container)

### Phase 7: Frontend UI Components
**Create:** `frontend/src/components/TeamSidebar.tsx`
- Fixed sidebar on left edge (~250px wide)
- Display team logos (circular) + names
- Active team highlighted
- Click to switch teams
- "Add Team" button at bottom
- Responsive: collapse to icons on mobile

**Create:** `frontend/src/components/TeamManagementModal.tsx`
- Form: team name input
- Logo upload: File picker → convert to base64 → upload to ImgBB
- Logo preview
- Member assignment (multi-select checkboxes)
- Delete team button (with confirmation)

**Update:** `frontend/src/App.tsx` layout
```typescript
<div className="flex min-h-screen">
  <TeamSidebar ... />
  <div className="flex-1 ml-[250px]">
    <header>...</header>
    <main>...</main>
  </div>
</div>
```

**Update:** `frontend/src/components/TeamManagement.tsx`
- Add team filter at top
- Show team badges next to member names
- Allow assigning members to multiple teams

### Phase 8: Testing & Deployment
1. Run migration locally (SQLite)
2. Test team CRUD operations
3. Test logo upload flow
4. Test team switching and data isolation
5. Test multi-team member assignment
6. Verify cascade deletes
7. Test on PostgreSQL (staging)
8. Deploy to production with migration

## Implementation Order
1. Database schema changes (sqlite.ts, postgres.ts)
2. Migration script
3. Team model
4. Update existing models with team_id
5. Team controller with ImgBB integration
6. Team routes + register in index.ts
7. Update existing controllers for team filtering
8. Frontend types
9. Team API service
10. TeamContext
11. Update App.tsx state management
12. TeamSidebar component
13. TeamManagementModal component
14. Update App.tsx layout
15. Update TeamManagement component
16. Test migration and all features
17. Deploy

## Critical Files

**Backend:**
- `backend/src/database/sqlite.ts` - Add teams & junction tables
- `backend/src/database/postgres.ts` - Same schema for PostgreSQL
- `backend/src/models/Team.ts` - NEW
- `backend/src/models/Sprint.ts` - UPDATE: add team_id
- `backend/src/models/RetroItem.ts` - UPDATE: add team_id
- `backend/src/controllers/teamController.ts` - NEW
- `backend/src/routes/teamRoutes.ts` - NEW
- `backend/src/index.ts` - Register team routes
- `backend/src/scripts/migrate-to-teams.ts` - NEW

**Frontend:**
- `frontend/src/types/index.ts` - Add Team interface
- `frontend/src/services/api.ts` - Add teamApi
- `frontend/src/contexts/TeamContext.tsx` - NEW
- `frontend/src/App.tsx` - Team state & layout
- `frontend/src/components/TeamSidebar.tsx` - NEW
- `frontend/src/components/TeamManagementModal.tsx` - NEW
- `frontend/src/components/TeamManagement.tsx` - UPDATE

## Key Challenges & Solutions

**Challenge:** SQLite limited ALTER TABLE support
**Solution:** Use table recreation pattern (rename → create → copy → drop)

**Challenge:** Existing data without team_id
**Solution:** Migration script creates default "Elad Team" and assigns all data to it

**Challenge:** Logo upload size
**Solution:** Client-side validation (max 5MB), ImgBB handles optimization

**Challenge:** Team deletion safety
**Solution:** Confirmation dialog showing what will be deleted (sprint count, retro count)

## Environment Variables
Add to `.env`:
```
IMGBB_API_KEY=your_imgbb_api_key
```

Get API key from: https://api.imgbb.com/

## Data Model Summary
```
teams (root)
├── sprints.team_id → teams.id [CASCADE]
├── retro_items.team_id → teams.id [CASCADE]
└── team_members_teams.team_id → teams.id [CASCADE]

team_members (root)
└── team_members_teams.member_id → team_members.id [CASCADE]

team_members_teams (junction)
└── Represents many-to-many: team ↔ members
```

## Next Steps After Plan Approval
1. Start with Phase 1 (database schema)
2. Test migration on local SQLite
3. Implement backend models and controllers
4. Add frontend state management
5. Build UI components
6. Test end-to-end
7. Deploy with migration