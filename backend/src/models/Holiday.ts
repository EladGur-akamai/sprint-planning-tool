import { queryAll, queryInsert, queryRun } from '../database/queries';
import { isSQLite } from '../database/config';

export interface Holiday {
  id?: number;
  sprint_id: number;
  member_id: number;
  date: string;
}

export class HolidayModel {
  static async getBySprintId(sprintId: number): Promise<Holiday[]> {
    return queryAll<Holiday>('SELECT * FROM holidays WHERE sprint_id = ?', [sprintId]);
  }

  static async getBySprintAndMember(sprintId: number, memberId: number): Promise<Holiday[]> {
    return queryAll<Holiday>('SELECT * FROM holidays WHERE sprint_id = ? AND member_id = ?', [sprintId, memberId]);
  }

  static async create(holiday: Omit<Holiday, 'id'>): Promise<Holiday> {
    const result = await queryInsert<Holiday>(
      'INSERT INTO holidays (sprint_id, member_id, date) VALUES (?, ?, ?)',
      [holiday.sprint_id, holiday.member_id, holiday.date]
    );
    return { ...holiday, ...result };
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM holidays WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async deleteBySprintMemberAndDate(sprintId: number, memberId: number, date: string): Promise<boolean> {
    const result = await queryRun(
      'DELETE FROM holidays WHERE sprint_id = ? AND member_id = ? AND date = ?',
      [sprintId, memberId, date]
    );
    return result.changes > 0;
  }

  static async bulkCreate(holidays: Omit<Holiday, 'id'>[]): Promise<void> {
    // Use INSERT OR IGNORE for SQLite, ON CONFLICT for PostgreSQL
    const sql = isSQLite()
      ? 'INSERT OR IGNORE INTO holidays (sprint_id, member_id, date) VALUES (?, ?, ?)'
      : 'INSERT INTO holidays (sprint_id, member_id, date) VALUES (?, ?, ?) ON CONFLICT (sprint_id, member_id, date) DO NOTHING';

    for (const holiday of holidays) {
      await queryRun(sql, [holiday.sprint_id, holiday.member_id, holiday.date]);
    }
  }
}
