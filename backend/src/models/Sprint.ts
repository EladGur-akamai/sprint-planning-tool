import { queryAll, queryOne, queryInsert, queryRun, queryExec } from '../database/queries';
import { parseISO, getQuarter, getYear } from 'date-fns';

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
      await queryRun('UPDATE sprints SET is_current = FALSE WHERE team_id = ?', [sprint.team_id]);
    }

    const load_factor = sprint.load_factor !== undefined ? sprint.load_factor : 0.8;
    const is_current = sprint.is_current ? true : false;

    // Automatically calculate year and quarter from start_date if not provided
    const startDate = parseISO(sprint.start_date);
    const year = sprint.year !== undefined ? sprint.year : getYear(startDate);
    const quarter = sprint.quarter !== undefined ? sprint.quarter : getQuarter(startDate);
    const template_id = sprint.template_id || null;

    const result = await queryInsert<Sprint>(
      'INSERT INTO sprints (team_id, template_id, name, year, quarter, start_date, end_date, is_current, load_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [sprint.team_id, template_id, sprint.name, year, quarter, sprint.start_date, sprint.end_date, is_current, load_factor]
    );
    return { ...sprint, year, quarter, template_id, ...result };
  }

  static async update(id: number, sprint: Partial<Omit<Sprint, 'id' | 'created_at'>>): Promise<boolean> {
    // If setting as current, unmark all others in the same team first
    if (sprint.is_current) {
      // Get the team_id of the sprint being updated
      const existingSprint = await this.getById(id);
      if (existingSprint) {
        await queryRun('UPDATE sprints SET is_current = FALSE WHERE team_id = ?', [existingSprint.team_id]);
      }
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
      values.push(sprint.is_current);
    }
    if (sprint.load_factor !== undefined) {
      fields.push('load_factor = ?');
      values.push(sprint.load_factor);
    }
    if (sprint.year !== undefined) {
      fields.push('year = ?');
      values.push(sprint.year);
    }
    if (sprint.quarter !== undefined) {
      fields.push('quarter = ?');
      values.push(sprint.quarter);
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
