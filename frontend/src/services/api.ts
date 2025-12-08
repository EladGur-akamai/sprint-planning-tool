import { TeamMember, Sprint, Holiday, SprintCapacity, RetroItem } from '../types';

const API_BASE = '/api';

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
  getAll: async (): Promise<Sprint[]> => {
    const res = await fetch(`${API_BASE}/sprints`);
    if (!res.ok) throw new Error('Failed to fetch sprints');
    return res.json();
  },

  getCurrent: async (): Promise<Sprint | null> => {
    const res = await fetch(`${API_BASE}/sprints/current`);
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
