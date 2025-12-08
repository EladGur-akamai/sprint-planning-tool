import { queryAll, queryOne, queryInsert, queryRun } from '../database/queries';

export interface TeamMember {
  id?: number;
  name: string;
  role: string;
  default_capacity: number;
  created_at?: string;
}

export class TeamMemberModel {
  static async getAll(): Promise<TeamMember[]> {
    return queryAll<TeamMember>('SELECT * FROM team_members ORDER BY name');
  }

  static async getByTeamId(teamId: number): Promise<TeamMember[]> {
    return queryAll<TeamMember>(
      `SELECT tm.* FROM team_members tm
       INNER JOIN team_members_teams tmt ON tm.id = tmt.member_id
       WHERE tmt.team_id = ?
       ORDER BY tm.name`,
      [teamId]
    );
  }

  static async getById(id: number): Promise<TeamMember | undefined> {
    return queryOne<TeamMember>('SELECT * FROM team_members WHERE id = ?', [id]);
  }

  static async create(member: Omit<TeamMember, 'id' | 'created_at'>): Promise<TeamMember> {
    const result = await queryInsert<TeamMember>(
      'INSERT INTO team_members (name, role, default_capacity) VALUES (?, ?, ?)',
      [member.name, member.role, member.default_capacity]
    );
    return { ...member, ...result };
  }

  static async update(id: number, member: Partial<Omit<TeamMember, 'id' | 'created_at'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (member.name !== undefined) {
      fields.push('name = ?');
      values.push(member.name);
    }
    if (member.role !== undefined) {
      fields.push('role = ?');
      values.push(member.role);
    }
    if (member.default_capacity !== undefined) {
      fields.push('default_capacity = ?');
      values.push(member.default_capacity);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await queryRun(`UPDATE team_members SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM team_members WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
