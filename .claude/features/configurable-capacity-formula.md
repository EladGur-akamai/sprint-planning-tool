# Feature: Configurable Capacity Formula

**Priority:** Low
**Status:** ✅ Completed
**Created:** 2025-12-7
**Completed:** 2025-12-7
**Implementation:** See `.claude/memory/2025-12-07-load-factor-implementation.md`

## Description

In the Capacity widget, make the capacity formula configurable by letting the user fill a load factor (with default set to 0.8 for 80%). The story points will take this factor into account by multiplying each team member's available days by this formula.

## Implementation Summary

✅ Added configurable load factor per sprint (default: 80%)
✅ Load factor input when creating new sprints (0-100%, step 5%)
✅ Editable load factor in Capacity Summary UI with Edit/Save/Cancel
✅ Updated capacity formula: `Capacity = (Default Capacity × Available Days × Load Factor) ÷ 10`
✅ Database schema updated (load_factor column in sprints table)
✅ Deployed to production successfully

## Usage

1. **Creating a sprint:** Set load factor in the "Load Factor (%)" field (default 80%)
2. **Editing load factor:** Click "Edit" button next to load factor in Capacity Summary
3. **View impact:** Formula display shows how load factor affects calculation
