export interface Team {
  id?: number;
  name: string;
  logo_url: string | null;
  created_at?: string;
}

export interface TeamMember {
  id?: number;
  name: string;
  role: string;
  default_capacity: number;
  created_at?: string;
}

export interface Sprint {
  id?: number;
  team_id: number;
  template_id?: number | null;
  name: string;
  year?: number | null;
  quarter?: number | null;
  start_date: string;
  end_date: string;
  is_current: boolean;
  load_factor: number;
  created_at?: string;
}

export interface SprintTemplate {
  id?: number;
  name: string;
  year: number;
  quarter: number;
  sprint_number: number;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  load_factor: number;
  created_at?: string;
}

export interface Holiday {
  id?: number;
  sprint_id: number;
  member_id: number;
  date: string;
}

export interface MemberCapacity {
  member_id: number;
  member_name: string;
  default_capacity: number;
  total_working_days: number;
  holidays: number;
  available_days: number;
  capacity: number;
}

export interface SprintCapacity {
  sprint_id: number;
  sprint_name: string;
  total_working_days: number;
  load_factor: number;
  member_capacities: MemberCapacity[];
  total_capacity: number;
}

export type RetroItemType = 'lesson_learned' | 'todo' | 'what_went_well' | 'what_went_wrong';

export interface RetroItem {
  id?: number;
  sprint_id: number;
  member_id: number;
  team_id: number;
  type: RetroItemType;
  content: string;
  created_at?: string;
}
