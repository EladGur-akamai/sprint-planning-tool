import { queryAll, queryOne, queryInsert, queryRun, queryExec } from '../database/queries';

export interface Sprint {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
}

export class SprintModel {
  static async getAll(): Promise<Sprint[]> {
    return queryAll<Sprint>('SELECT * FROM sprints ORDER BY start_date DESC');
  }

  static async getById(id: number): Promise<Sprint | undefined> {
    return queryOne<Sprint>('SELECT * FROM sprints WHERE id = ?', [id]);
  }

  static async getCurrent(): Promise<Sprint | undefined> {
    return queryOne<Sprint>('SELECT * FROM sprints WHERE is_current = TRUE LIMIT 1');
  }

  static async create(sprint: Omit<Sprint, 'id' | 'created_at'>): Promise<Sprint> {
    // If this sprint is marked as current, unmark all others
    if (sprint.is_current) {
      await queryRun('UPDATE sprints SET is_current = FALSE');
    }

    const result = await queryInsert<Sprint>(
      'INSERT INTO sprints (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)',
      [sprint.name, sprint.start_date, sprint.end_date, sprint.is_current]
    );
    return { ...sprint, ...result };
  }

  static async update(id: number, sprint: Partial<Omit<Sprint, 'id' | 'created_at'>>): Promise<boolean> {
    // If setting as current, unmark all others first
    if (sprint.is_current) {
      await queryRun('UPDATE sprints SET is_current = FALSE');
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
