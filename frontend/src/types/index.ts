export interface TeamMember {
  id?: number;
  name: string;
  role: string;
  default_capacity: number;
  created_at?: string;
}

export interface Sprint {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
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
