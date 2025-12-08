# Feature Requests

This folder is for you to add feature requirements and specifications.

## How to Use This Folder

1. **Create a new markdown file** for each feature request or requirement
2. **Use descriptive names** like `feature-authentication.md` or `req-multi-team-support.md`
3. **Include details** such as:
   - User story or use case
   - Acceptance criteria
   - Priority (High/Medium/Low)
   - Dependencies
   - Design considerations

## Template for Feature Requests

```markdown
# Feature: [Feature Name]

**Priority:** [High/Medium/Low]
**Status:** [Proposed/In Progress/Completed/Rejected]
**Created:** YYYY-MM-DD

## User Story
As a [type of user], I want [goal] so that [benefit].

## Description
[Detailed description of the feature]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Considerations
- [Any technical notes, constraints, or dependencies]

## Design Notes
- [UI/UX considerations, mockups, wireframes]

## Dependencies
- [Other features, libraries, or systems this depends on]

## Estimated Effort
[Time estimate or story points]

## Notes
[Any additional notes or context]
```

## Feature Status Summary

| Feature | Priority | Status | Completed |
|---------|----------|--------|-----------|
| [Multi-Team Support](multi-teams-support.md) | Medium | ✅ Completed | 2025-12-08 |
| [Retro Tool](retro-tool.md) | Medium | ✅ Completed | 2025-12-07 |
| [Configurable Capacity Formula](configurable-capacity-formula.md) | Low | ✅ Completed | 2025-12-07 |
| [Multi Sprint Edit Support](multi-sprint-edit-support.md) | Medium | ✅ Completed | 2025-12-07 |

## Current Features in Production

See `.claude/memory/current-implementation.md` for a complete list of implemented features.

### Recently Completed
- **Multi-Team Support** (2025-12-08) - Teams can be created with logos, members can belong to multiple teams, complete data isolation
- **Retro Tool** (2025-12-07) - Sprint retrospective with categorized feedback (what went well/wrong, lessons, action items)
- **Configurable Capacity Formula** (2025-12-07) - Load factor per sprint (default 80%), editable in UI
- **Multi Sprint Edit Support** (2025-12-07) - View and edit any sprint, not just the current one

## All Current Features Completed ✅

All features in this folder have been successfully implemented and deployed to production!

## Planned Features

See `.claude/plans/future-enhancements.md` for the roadmap and planned future enhancements.