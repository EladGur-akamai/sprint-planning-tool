# Feature: Retro Tool

**Priority:** Medium
**Status:** ✅ Completed
**Created:** 2025-07-12
**Completed:** 2025-12-07 (estimated based on implementation)

## Description
Sprint retrospective tool that allows team members to provide feedback about completed sprints. Each team member can add insights categorized as:
- **What Went Well** (✅) - Positive outcomes and successes
- **What Went Wrong** (❌) - Issues and problems encountered
- **Lesson Learned** (💡) - Key takeaways and insights
- **Action Items** (📝) - TODOs for future improvement

The Sprint Planning tab displays insights from the last retro in a summarized way.

## Implementation Summary

### ✅ Features Delivered

**Backend:**
- Complete CRUD operations for retro items
- Database table: `retro_items` with sprint_id, member_id, team_id, type, content
- Team-aware filtering (data isolation)
- Four retro item types: what_went_well, what_went_wrong, lesson_learned, todo
- API endpoints for creating, updating, deleting, and fetching retro items

**Frontend:**
- `SprintRetro.tsx` component - Form for team members to add retro items
- `RetroInsights.tsx` component - Displays previous sprint retro items
- Category-based organization with emoji indicators
- Member-specific attribution for each retro item
- Color-coded display by category
- Integrated into main app with dedicated "Retro" tab

**Database Schema:**
```sql
CREATE TABLE retro_items (
  id INTEGER/SERIAL PRIMARY KEY,
  sprint_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('lesson_learned', 'todo', 'what_went_well', 'what_went_wrong')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

### Files Implemented

**Backend:**
- `backend/src/models/RetroItem.ts` - Data model with CRUD operations
- `backend/src/controllers/retroController.ts` - API controllers
- `backend/src/routes/retroRoutes.ts` - REST API routes
- Database migrations in `sqlite.ts` and `postgres.ts`

**Frontend:**
- `frontend/src/components/SprintRetro.tsx` - Retro input form
- `frontend/src/components/RetroInsights.tsx` - Display past retro items
- `frontend/src/types/index.ts` - RetroItem and RetroItemType interfaces
- `frontend/src/services/api.ts` - retroApi service

## API Endpoints

```
GET    /api/retro/sprint/:sprintId    - Get all retro items for a sprint
GET    /api/retro/team/:teamId        - Get all retro items for a team
GET    /api/retro/:id                 - Get single retro item
POST   /api/retro                     - Create retro item
PUT    /api/retro/:id                 - Update retro item
DELETE /api/retro/:id                 - Delete retro item
```

## Acceptance Criteria

- ✅ User is able to fill a retro for each sprint
- ✅ Each team member can provide their own input
- ✅ Each input is categorized (lesson learned, todo, what went well, what went wrong)
- ✅ Sprint Planning tab shows insights in a summarized way
- ✅ Team selection works correctly - only shows retro items for selected team
- ✅ Member attribution - shows which team member added each item
- ✅ Retro items are color-coded by category for easy scanning

## Technical Implementation

**Retro Item Types:**
- `what_went_well` - Green color, checkmark emoji
- `what_went_wrong` - Red color, X emoji
- `lesson_learned` - Yellow color, lightbulb emoji
- `todo` - Blue color, notepad emoji

**Team Data Isolation:**
- All retro items include team_id foreign key
- Queries filter by team_id for proper data isolation
- Cascade deletes when team or sprint is deleted

**User Experience:**
- Dropdown to select team member
- Category selector for retro item type
- Textarea for content input
- Display groups items by category with visual indicators
- Shows member name for each retro item

## Production Status

- ✅ Deployed to production
- ✅ Database tables created in PostgreSQL
- ✅ Working in multi-team environment
- ✅ Integrated with sprint planning workflow