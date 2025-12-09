import { Team, TeamMember, Sprint, SprintTemplate, Holiday, SprintCapacity, RetroItem } from '../types';

const API_BASE = '/api';

// Teams
export const teamApi = {
  getAll: async (): Promise<Team[]> => {
    const res = await fetch(`${API_BASE}/teams`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  getById: async (id: number): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams/${id}`);
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  create: async (team: Omit<Team, 'id' | 'created_at'>): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  update: async (id: number, team: Partial<Team>): Promise<Team> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    });
    if (!res.ok) throw new Error('Failed to update team');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete team');
  },

  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members`);
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },

  addMember: async (teamId: number, memberId: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId }),
    });
    if (!res.ok) throw new Error('Failed to add member to team');
  },

  removeMember: async (teamId: number, memberId: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove member from team');
  },

  uploadLogo: async (teamId: number, imageFile: File): Promise<Team> => {
    // Convert file to base64
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const res = await fetch(`${API_BASE}/teams/${teamId}/logo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });
    if (!res.ok) throw new Error('Failed to upload logo');
    return res.json();
  },
};

// Team Members
export const teamMemberApi = {
  getAll: async (): Promise<TeamMember[]> => {
    const res = await fetch(`${API_BASE}/members`);
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },

  create: async (member: Omit<TeamMember, 'id' | 'created_at'>): Promise<TeamMember> => {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to create team member');
    return res.json();
  },

  update: async (id: number, member: Partial<TeamMember>): Promise<TeamMember> => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update team member');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete team member');
  },
};

// Sprints
export const sprintApi = {
  getAll: async (teamId?: number): Promise<Sprint[]> => {
    const url = teamId ? `${API_BASE}/sprints?teamId=${teamId}` : `${API_BASE}/sprints`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch sprints');
    return res.json();
  },

  getCurrent: async (teamId?: number): Promise<Sprint | null> => {
    const url = teamId ? `${API_BASE}/sprints/current?teamId=${teamId}` : `${API_BASE}/sprints/current`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch current sprint');
    return res.json();
  },

  create: async (sprint: Omit<Sprint, 'id' | 'created_at'>): Promise<Sprint> => {
    const res = await fetch(`${API_BASE}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprint),
    });
    if (!res.ok) throw new Error('Failed to create sprint');
    return res.json();
  },

  update: async (id: number, sprint: Partial<Sprint>): Promise<Sprint> => {
    const res = await fetch(`${API_BASE}/sprints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprint),
    });
    if (!res.ok) throw new Error('Failed to update sprint');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/sprints/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete sprint');
  },

  getCapacity: async (id: number): Promise<SprintCapacity> => {
    const res = await fetch(`${API_BASE}/sprints/${id}/capacity`);
    if (!res.ok) throw new Error('Failed to fetch sprint capacity');
    return res.json();
  },
};

// Holidays
export const holidayApi = {
  getBySprintId: async (sprintId: number): Promise<Holiday[]> => {
    const res = await fetch(`${API_BASE}/holidays/sprint/${sprintId}`);
    if (!res.ok) throw new Error('Failed to fetch holidays');
    return res.json();
  },

  toggle: async (sprint_id: number, member_id: number, date: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/holidays/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprint_id, member_id, date }),
    });
    if (!res.ok) throw new Error('Failed to toggle holiday');
    return res.json();
  },
};

// Retro Items
export const retroApi = {
  getBySprintId: async (sprintId: number): Promise<RetroItem[]> => {
    const res = await fetch(`${API_BASE}/retro/sprint/${sprintId}`);
    if (!res.ok) throw new Error('Failed to fetch retro items');
    return res.json();
  },

  create: async (item: Omit<RetroItem, 'id' | 'created_at'>): Promise<RetroItem> => {
    const res = await fetch(`${API_BASE}/retro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create retro item');
    return res.json();
  },

  update: async (id: number, item: Partial<RetroItem>): Promise<RetroItem> => {
    const res = await fetch(`${API_BASE}/retro/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update retro item');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/retro/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete retro item');
  },
};

// Sprint Templates
export const sprintTemplateApi = {
  getAll: async (): Promise<SprintTemplate[]> => {
    const res = await fetch(`${API_BASE}/sprint-templates`);
    if (!res.ok) throw new Error('Failed to fetch sprint templates');
    return res.json();
  },

  getById: async (id: number): Promise<SprintTemplate> => {
    const res = await fetch(`${API_BASE}/sprint-templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch sprint template');
    return res.json();
  },

  getByQuarter: async (year: number, quarter: number): Promise<SprintTemplate[]> => {
    const res = await fetch(`${API_BASE}/sprint-templates/quarter/${year}/${quarter}`);
    if (!res.ok) throw new Error('Failed to fetch templates by quarter');
    return res.json();
  },

  getAvailableQuarters: async (): Promise<Array<{ year: number; quarter: number }>> => {
    const res = await fetch(`${API_BASE}/sprint-templates/quarters`);
    if (!res.ok) throw new Error('Failed to fetch available quarters');
    return res.json();
  },

  generateQuarter: async (
    year: number,
    quarter: number,
    durationWeeks: number,
    firstSprintStart: string
  ): Promise<SprintTemplate[]> => {
    const res = await fetch(`${API_BASE}/sprint-templates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year,
        quarter,
        duration_weeks: durationWeeks,
        first_sprint_start: firstSprintStart,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate quarter templates');
    return res.json();
  },

  adopt: async (
    templateId: number,
    teamId: number,
    customDates?: { start_date?: string; end_date?: string }
  ): Promise<Sprint> => {
    const res = await fetch(`${API_BASE}/sprint-templates/${templateId}/adopt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        ...customDates,
      }),
    });
    if (!res.ok) throw new Error('Failed to adopt template');
    return res.json();
  },

  update: async (id: number, template: Partial<SprintTemplate>): Promise<SprintTemplate> => {
    const res = await fetch(`${API_BASE}/sprint-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/sprint-templates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete template');
  },
};
