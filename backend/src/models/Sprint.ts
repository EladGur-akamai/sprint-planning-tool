import { queryAll, queryOne, queryInsert, queryRun, queryExec } from '../database/queries';

export interface Sprint {
  id?: number;
  team_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  load_factor: number;
  created_at?: string;
}

export class SprintModel {
  static async getAll(teamId?: number): Promise<Sprint[]> {
    if (teamId) {
      return queryAll<Sprint>('SELECT * FROM sprints WHERE team_id = ? ORDER BY start_date DESC', [teamId]);
    }
    return queryAll<Sprint>('SELECT * FROM sprints ORDER BY start_date DESC');
  }

  static async getById(id: number): Promise<Sprint | undefined> {
    return queryOne<Sprint>('SELECT * FROM sprints WHERE id = ?', [id]);
  }

  static async getCurrent(teamId?: number): Promise<Sprint | undefined> {
    if (teamId) {
      return queryOne<Sprint>('SELECT * FROM sprints WHERE is_current = TRUE AND team_id = ? LIMIT 1', [teamId]);
    }
    return queryOne<Sprint>('SELECT * FROM sprints WHERE is_current = TRUE LIMIT 1');
  }

  static async create(sprint: Omit<Sprint, 'id' | 'created_at'>): Promise<Sprint> {
    // If this sprint is marked as current, unmark all others in the same team
    if (sprint.is_current) {
      await queryRun('UPDATE sprints SET is_current = 0 WHERE team_id = ?', [sprint.team_id]);
    }

    const load_factor = sprint.load_factor !== undefined ? sprint.load_factor : 0.8;
    // Convert boolean to integer for SQLite
    const is_current = sprint.is_current ? 1 : 0;

    const result = await queryInsert<Sprint>(
      'INSERT INTO sprints (team_id, name, start_date, end_date, is_current, load_factor) VALUES (?, ?, ?, ?, ?, ?)',
      [sprint.team_id, sprint.name, sprint.start_date, sprint.end_date, is_current, load_factor]
    );
    return { ...sprint, ...result };
  }

  static async update(id: number, sprint: Partial<Omit<Sprint, 'id' | 'created_at'>>): Promise<boolean> {
    // If setting as current, unmark all others first
    if (sprint.is_current) {
      await queryRun('UPDATE sprints SET is_current = 0');
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (sprint.name !== undefined) {
      fields.push('name = ?');
      values.push(sprint.name);
    }
    if (sprint.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(sprint.start_date);
    }
    if (sprint.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(sprint.end_date);
    }
    if (sprint.is_current !== undefined) {
      fields.push('is_current = ?');
      values.push(sprint.is_current ? 1 : 0); // Convert boolean to integer
    }
    if (sprint.load_factor !== undefined) {
      fields.push('load_factor = ?');
      values.push(sprint.load_factor);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await queryRun(`UPDATE sprints SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM sprints WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
