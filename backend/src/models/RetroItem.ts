import { queryAll, queryOne, queryInsert, queryRun } from '../database/queries';

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

export class RetroItemModel {
  static async getBySprintId(sprintId: number): Promise<RetroItem[]> {
    return queryAll<RetroItem>(
      'SELECT * FROM retro_items WHERE sprint_id = ? ORDER BY created_at DESC',
      [sprintId]
    );
  }

  static async getByTeamId(teamId: number): Promise<RetroItem[]> {
    return queryAll<RetroItem>(
      'SELECT * FROM retro_items WHERE team_id = ? ORDER BY created_at DESC',
      [teamId]
    );
  }

  static async getById(id: number): Promise<RetroItem | undefined> {
    return queryOne<RetroItem>('SELECT * FROM retro_items WHERE id = ?', [id]);
  }

  static async create(item: Omit<RetroItem, 'id' | 'created_at'>): Promise<RetroItem> {
    const result = await queryInsert<RetroItem>(
      'INSERT INTO retro_items (sprint_id, member_id, team_id, type, content) VALUES (?, ?, ?, ?, ?)',
      [item.sprint_id, item.member_id, item.team_id, item.type, item.content]
    );
    return { ...item, ...result };
  }

  static async update(id: number, item: Partial<Omit<RetroItem, 'id' | 'created_at'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (item.type !== undefined) {
      fields.push('type = ?');
      values.push(item.type);
    }
    if (item.content !== undefined) {
      fields.push('content = ?');
      values.push(item.content);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await queryRun(`UPDATE retro_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM retro_items WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async deleteBySprintId(sprintId: number): Promise<boolean> {
    const result = await queryRun('DELETE FROM retro_items WHERE sprint_id = ?', [sprintId]);
    return result.changes > 0;
  }
}
