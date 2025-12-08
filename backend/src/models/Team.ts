import { queryAll, queryOne, queryInsert, queryRun } from '../database/queries';
import { TeamMember } from './TeamMember';

export interface Team {
  id?: number;
  name: string;
  logo_url: string | null;
  created_at?: string;
}

export class TeamModel {
  static async getAll(): Promise<Team[]> {
    return queryAll<Team>('SELECT * FROM teams ORDER BY name');
  }

  static async getById(id: number): Promise<Team | undefined> {
    return queryOne<Team>('SELECT * FROM teams WHERE id = ?', [id]);
  }

  static async create(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const result = await queryInsert<Team>(
      'INSERT INTO teams (name, logo_url) VALUES (?, ?)',
      [team.name, team.logo_url]
    );
    return { ...team, ...result };
  }

  static async update(id: number, team: Partial<Omit<Team, 'id' | 'created_at'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (team.name !== undefined) {
      fields.push('name = ?');
      values.push(team.name);
    }
    if (team.logo_url !== undefined) {
      fields.push('logo_url = ?');
      values.push(team.logo_url);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await queryRun(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM teams WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // Get all members of a team
  static async getMembersByTeamId(teamId: number): Promise<TeamMember[]> {
    return queryAll<TeamMember>(
      `SELECT tm.* FROM team_members tm
       INNER JOIN team_members_teams tmt ON tm.id = tmt.member_id
       WHERE tmt.team_id = ?
       ORDER BY tm.name`,
      [teamId]
    );
  }

  // Add a member to a team
  static async addMemberToTeam(teamId: number, memberId: number): Promise<void> {
    await queryRun(
      'INSERT OR IGNORE INTO team_members_teams (team_id, member_id) VALUES (?, ?)',
      [teamId, memberId]
    );
  }

  // Remove a member from a team
  static async removeMemberFromTeam(teamId: number, memberId: number): Promise<boolean> {
    const result = await queryRun(
      'DELETE FROM team_members_teams WHERE team_id = ? AND member_id = ?',
      [teamId, memberId]
    );
    return result.changes > 0;
  }

  // Get all teams a member belongs to
  static async getTeamsByMemberId(memberId: number): Promise<Team[]> {
    return queryAll<Team>(
      `SELECT t.* FROM teams t
       INNER JOIN team_members_teams tmt ON t.id = tmt.team_id
       WHERE tmt.member_id = ?
       ORDER BY t.name`,
      [memberId]
    );
  }
}
